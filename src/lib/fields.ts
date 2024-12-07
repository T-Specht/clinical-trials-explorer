import { EntryTable, CustomFieldTable } from "@/db/schema";
import { z } from "zod";

export const CUSTOM_FIELDS_SEED: (typeof CustomFieldTable.$inferInsert)[] = [
  {
    idName: "usecase",
    dataType: "string",
    label: "Usecase of drug",
    aiDescription:
      "the indication/use case/condition treated with the {drug_name} in the study. Maximum of 3 words! Whenever possible the usecase should correspond to the study title condition.",
    description: "Usecase",
    isDisabled: false,
  },
  {
    idName: "is_repurpose",
    dataType: "boolean",
    label: "Repurpose",
    aiDescription:
      "Is the {drug_name} being used, tested, or evaluated in this study for any indications outside of its typical use in treating {list of conventional usecases}?\n\nIf unsure, respond with “true.”\n\nNote: Drug repurposing (or repositioning) refers to using existing drugs for new therapeutic purposes beyond their conventional indications.",
    description: "Whether the study could be repurposing",
    isDisabled: false,
  },
  {
    idName: "drug_name",
    dataType: "string",
    label: "drug name",
    aiDescription:
      "the name of the drug if there was one that was looked at primarily. Possible options are {list of drugs} or a combination of these. If non of these can be chosen, output 'No drug'. If multiple apply, list them by using |, e.g. drug1|drug2",
    description: "",
    isDisabled: false,
  },
];

export const buildAiReturnSchemaForCustomFields = (
  customFields: (typeof CustomFieldTable.$inferSelect)[]
) => {
  let schema = z.object(
    Object.fromEntries(
      customFields
        .filter((f) => !!f.aiDescription && f.aiDescription.trim() != "")
        .map((f) => {
          const key = f.idName;
          const types = {
            string: z.string(),
            number: z.number(),
            boolean: z.boolean(),
          };
          const type = types[f.dataType];

          return [
            key,
            z.object({
              value: type.describe(f.aiDescription || f.description || ""),
              explanation: z
                .string()
                .describe("shortly describe why you picked this value"),
            }),
          ];
        })
    )
  );

  return schema;
};

export const buildAiCheckSchemaForCustomFields = (
  customFields: (typeof CustomFieldTable.$inferSelect)[]
) => {
  let fields = customFields.filter(
    (f) => !!f.aiDescription && f.aiDescription.trim() != ""
  );

  let outputSchema = z.object(
    Object.fromEntries(
      fields.map((f) => {
        const key = f.idName;

        return [
          key,
          z.object({
            generalAcceptance: z
              .boolean()
              .describe(
                "if you think that the value the user provided for the field is correct in general based on the field description and the study data"
              ),
            critique: z
              .array(z.string().describe("critique bullet point"))
              .describe(
                "short critique of the user's value, things you would like to point out, improve or correct if any. Each element in the array should be it's own bullet point. Maximum of 4 bullet points. If you think that the provided value is good, write one small bullet point as an explanation as to why you think so"
              ),
            suggestions: z
              .array(z.string())
              .describe(
                "suggestions for better values if necessary, maximum of 4 => only if generalAcceptance = false"
              ),
          }),
        ];
      })
    )
  );

  // let inputSchema = customFields
  // .filter((f) => !!f.aiDescription && f.aiDescription.trim() != "")

  return outputSchema;
};
