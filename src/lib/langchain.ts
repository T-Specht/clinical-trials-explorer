import { ChatOpenAI } from "@langchain/openai";
import { RunnableSequence } from "@langchain/core/runnables";
import { JsonOutputFunctionsParser } from "langchain/output_parsers";
import { z } from "zod";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { zodToJsonSchema } from "zod-to-json-schema";
import { useAiCacheStore, useSettingsStore } from "./zustand";
import { searxng_api_search } from "./searxng_api";
import { ChatAnthropic } from "@langchain/anthropic";
import { ChatOllama } from "@langchain/ollama";
import { buildAiCheckSchemaForCustomFields } from "./fields";

// import { ChatAnthropicTools } from "@langchain/anthropic/experimental";

// import { searxng_api_search } from "./searxng_api";

export const DEFAULT_AI_MODELS = {
  openai: "gpt-4o-mini",
  anthropic: "claude-3-5-haiku-latest",
  ollama: "llama3.1",
  disabled: "",
};

const getModel = (temp = 0) => {
  const { openAIKey, openAIModelName, aiProvider } =
    useSettingsStore.getState();

  const model =
    openAIModelName.trim() != ""
      ? openAIModelName
      : DEFAULT_AI_MODELS[aiProvider];

  if (aiProvider === "anthropic") {
    return new ChatAnthropic({
      model,
      temperature: temp,
      anthropicApiKey: openAIKey || "",
    });
  }

  if (aiProvider === "openai") {
    return new ChatOpenAI({
      modelName: model,
      temperature: temp,
      openAIApiKey: openAIKey || "",
    });
  }

  if (aiProvider === "ollama") {
    return new ChatOllama({
      model: model,
      temperature: temp,
      maxRetries: 5,
    });
  }

  return null;

  //return new ChatAnthropic({});
};

export async function generateAISearchQueries(input: string) {
  const model = getModel(0.5);

  if (!model) {
    throw new Error("No model selected");
  }

  const n = 6;
  const queryGenerationSchema = z.object({
    queries: z
      .array(z.string())
      .length(n)
      .min(n)
      .max(n)
      .describe("search queries"),
  });

  const prompt = ChatPromptTemplate.fromMessages([
    [
      "system",
      `Given the input of data from a clinical study, generate exactly ${n} search queries that are highly likely to find via internet search engines (you will use searxng as a meta search engine for scientific literature) the exact published paper if one should exist. If the study provides references, check if they are relevant.`,
    ],
    ["user", "{input}"],
  ]);

  const chain = RunnableSequence.from([
    prompt,
    model.withStructuredOutput(queryGenerationSchema),
  ]).withRetry({
    stopAfterAttempt: 3,
  });

  const { queries } = await chain.invoke({ input: input });
  return queries;
}

async function extractPapers(input: string, references: string) {
  const model = getModel(0.5);
  if (!model) {
    throw new Error("No model selected");
  }

  const schema = z.object({
    result: z
      .array(
        z.object({
          title: z.string().describe("title of the paper"),
          authors: z.string().describe("authors of the paper"),
          url: z.string().describe("link to the paper"),
          year: z.string().describe("year the paper was published"),
          source: z
            .string()
            .describe(
              "the tool with which you found the source, e.g. pubmed or semantic_scholar"
            ),
          confidence: z
            .enum(["high", "medium", "low"])
            .describe("confidence that this paper matches the clinical study"),
          pro: z
            .string()
            .describe(
              "considerations that this is the right paper for the given study = pro arguments"
            ),
          con: z
            .string()
            .describe(
              "considerations that this is the wrong paper for the given study = con arguments"
            ),
        })
      )
      .describe(
        "array of papers that you found. If you found non that match, return an empty array"
      ),
  });

  const prompt = ChatPromptTemplate.fromMessages([
    [
      "system",
      `Given the input of data from a clinical study and potential references for a corresponding publication to the study, find the paper that matches the study data. Important: If you cannot find a paper that matches the study data, return an empty array. Do not generate fake papers.
      Also take into consideration the start/end dates of the study and the publication date of the paper when matching.
      `,
    ],
    [
      "user",
      `### STUDY DATA ###
    {input}


    ### REFERENCES ###
    {references}`,
    ],
  ]);

  const chain = RunnableSequence.from([
    prompt,
    model.withStructuredOutput(schema).withRetry({
      stopAfterAttempt: 3,
    }),
  ]);

  const result = await chain.invoke({
    input: input,
    references: references,
  });
  return result;
}

export async function generateMetaData<T extends z.ZodRawShape>(
  input: string,
  returnSchema: z.ZodObject<T>
) {
  const baseModel = getModel(0);
  if (!baseModel) {
    throw new Error("No model selected");
  }
  const model = baseModel.withStructuredOutput(returnSchema).withRetry({
    stopAfterAttempt: 3,
  });

  const prompt = ChatPromptTemplate.fromMessages([
    [
      "system",
      `You are given information about a clinical study in JSON format. Extract the information required in the output formatter function from the study data.
    `,
    ],
    ["user", `{input}`],
  ]);
  // Binding "function_call" below makes the model always call the specified function.
  // If you want to allow the model to call functions selectively, omit it.

  const chain = RunnableSequence.from([prompt, model]);

  const result = await chain.invoke({
    input: input,
  });

  //console.log('AI_RESULT_LOG', result);

  return result;
}

export async function checkAllFieldsWithAI(
  studyDataInput: string,
  userFieldsWithValues: {
    fieldName: string;
    aiDesc: string | null;
    userValue: string | null | undefined;
  }[],
  returnSchema: ReturnType<typeof buildAiCheckSchemaForCustomFields>
) {
  const baseModel = getModel(0);
  if (!baseModel) {
    throw new Error("No model selected");
  }
  const model = baseModel.withStructuredOutput(returnSchema).withRetry({
    stopAfterAttempt: 3,
  });

  const prompt = ChatPromptTemplate.fromMessages([
    [
      "system",
      `You are given information about a clinical study in JSON format.
      The user has provided a value for a specific field that he is interested in. Check if the value is correct/acceptable and provide feedback.
    `,
    ],
    [
      "user",
      `
      ### STUDY DATA ###
      {input}

      ### USER VALUES ###
      {userFieldsWithValues}
      `,
    ],
  ]);
  // Binding "function_call" below makes the model always call the specified function.
  // If you want to allow the model to call functions selectively, omit it.

  const chain = RunnableSequence.from([prompt, model]);

  const result = await chain.invoke({
    input: studyDataInput,
    userFieldsWithValues: JSON.stringify(userFieldsWithValues),
  });

  //console.log('AI_RESULT_LOG', result);

  return result;
}

export async function checkSingleFieldWithAI(
  input: string,
  aiFieldDescription: string,
  userValue: string
  //returnSchema: z.ZodObject<T>,
) {
  const baseModel = getModel(0);
  if (!baseModel) {
    throw new Error("No model selected");
  }
  const model = baseModel
    .withStructuredOutput(
      z.object({
        generalAcceptance: z
          .boolean()
          .describe(
            "if you think that the value the user provided for the field is correct in general based on the field description and the study data"
          ),
        critique: z
          .array(z.string().describe("critique bullet point"))
          .describe(
            "short critique of the user's value, things you would like to point out, improve or correct if any. Each element in the array should be it's own bullet point. Maximum of 4 bullet points"
          ),
        suggestions: z
          .array(z.string())
          .describe(
            "suggestions for better values if necessary, maximum of 4 => only if generalAcceptance = false"
          ),
      })
    )
    .withRetry({
      stopAfterAttempt: 3,
    });

  const prompt = ChatPromptTemplate.fromMessages([
    [
      "system",
      `You are given information about a clinical study in JSON format.
      The user has provided a value for a specific field that he is interested in. Check if the value is correct/acceptable and provide feedback.
    `,
    ],
    [
      "user",
      `
      ### STUDY DATA ###
      {input}

      ### USER VALUE ###
      Field Description: {ai_field_description}
      Value to check: {userValue}
      `,
    ],
  ]);
  // Binding "function_call" below makes the model always call the specified function.
  // If you want to allow the model to call functions selectively, omit it.

  const chain = RunnableSequence.from([prompt, model]);

  const result = await chain.invoke({
    input: input,
    ai_field_description: aiFieldDescription,
    userValue,
  });

  //console.log('AI_RESULT_LOG', result);

  return result;
}

// export async function findPublications(input: string) {
//   //Get search results
//   const queries = await generateAISearchQueries(input);
//   const references = (
//     await Promise.all(
//       queries.map(async (query) => await searxng_api_search(query))
//     )
//   )
//     .flat()
//     .map((r) => {
//       const { content, url, title, authors, score, engine } = r;
//       return { content, url, title, authors, score, engine };
//     })
//     .filter((e, i, self) => {
//       const index = self.findIndex((t) => t.title === e.title);
//       return index === i;
//     });
//   const matched = await extractPapers(input, JSON.stringify(references));
//   return matched;
// }

export type AiPublicationMatchType = Awaited<
  ReturnType<typeof extractPapers>
>["result"];

export async function findPublicationsWithCallbacks(
  input: string,
  callbacks: {
    queries: (queries: string[]) => any;
    rawReferences: (
      references: {
        content: string;
        url: string;
        title: string;
        authors: string[] | undefined;
        engine: string;
      }[]
    ) => any;
    aiMatches: (result: AiPublicationMatchType) => any;
  },
  addEngines: string[] = []
) {
  //Get search results
  const queries = await generateAISearchQueries(input);
  callbacks.queries(queries);

  const { searxngEngines, searxngMaxResultsPerEngine } =
    useSettingsStore.getState();

  const references = (
    await Promise.all(
      queries.map(
        async (query) =>
          // Search english (:en)
          await searxng_api_search(`:en ${query}`, searxngMaxResultsPerEngine, {
            engines: searxngEngines + addEngines.join(","),
            categories: "science", // TODO
          })
      )
    )
  )
    .flat()
    .map((r) => {
      const { content, url, title, authors, engine } = r;
      return { content, url, title, authors, engine };
    });
  // .filter((e, i, self) => {
  //   const index = self.findIndex((t) => t.title === e.title);
  //   return index === i;
  // });

  callbacks.rawReferences(references);

  const matched = await extractPapers(input, JSON.stringify(references));

  callbacks.aiMatches(matched.result);

  return matched;
}

export async function generateAIInformation(input: string) {
  //const metaData = await generateMetaData(input);
  //return metaData;
}
