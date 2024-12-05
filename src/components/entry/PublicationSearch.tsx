import { EntryTable } from "@/db/schema";
import { SingleEntryReturnedByDBWrapper } from "@/lib/database-wrappers";
import { findPublicationsWithCallbacks } from "@/lib/langchain";
import {
  Button,
  CopyButton,
  Group,
  Paper,
  ScrollArea,
  Skeleton,
} from "@mantine/core";
import { useLocalStorage, useSessionStorage } from "@mantine/hooks";
import { useEffect, useState } from "react";

const LoadingSkeleton = () => {
  return (
    <div className="my-2">
      <Skeleton height={8} radius="xl" />
      <Skeleton height={8} mt={6} radius="xl" />
      <Skeleton height={8} mt={6} width="70%" radius="xl" />
    </div>
  );
};

export const PublicationSearch = (props: {
  entry: SingleEntryReturnedByDBWrapper;
  disabled?: boolean;
  onLinkClick?: (url: string) => void;
  //customFields: (typeof CustomFieldTable.$inferSelect)[];
}) => {
  const input = {
    title: props.entry.title,
    description: props.entry.rawJson?.descriptionModule,
    intervention: props.entry.rawJson?.armsInterventionsModule,
    references: props.entry.rawJson?.referencesModule,
    status: props.entry.rawJson?.statusModule,
  };

  const [step, setStep] = useState<
    "initial" | "started" | "finished_queries" | "finished_searchx" | "finished"
  >("initial");

  const [queries, setQueries] = useState<string[]>([]);
  const [aiMatches, setAiMatches] = useLocalStorage<
    {
      url: string;
      title: string;
      authors: string;
      year: string;
      source: string;
      confidence: string;
      pro: string;
      con: string;
    }[]
  >({
    key: `ai_publications_${props.entry.nctId}`, // TODO cache in DB?
    defaultValue: [],
  });
  const [rawReferences, setRawReferences] = useState<
    {
      content: string;
      url: string;
      title: string;
      authors: string[] | undefined;
      engine: string;
    }[]
  >([]);

  useEffect(() => {
    if (aiMatches.length > 0) {
      setStep("finished");
    }
  }, [aiMatches]);

  return (
    <div className="my-3">
      <Group>
        <Button
          loading={step != "initial" && step != "finished"}
          disabled={(step != "initial" && step != "finished") || props.disabled}
          onClick={async () => {
            const isSecondRun = step == "finished";
            setStep("started");
            setAiMatches([]);
            setQueries([]);
            setRawReferences([]);

            let res = await findPublicationsWithCallbacks(
              JSON.stringify(input),
              {
                aiMatches(result) {
                  setAiMatches(result);
                  console.log("aiMatch", result);

                  setStep("finished");
                },
                queries(queries) {
                  setQueries(queries);
                  setStep("finished_queries");
                  console.log("queries", queries);
                },
                rawReferences(references) {
                  setRawReferences(references);
                  console.log("rawReferences:");
                  console.dir(references);
                  setStep("finished_searchx");
                },
              },
              isSecondRun ? ["internetarchivescholar", "arxiv"] : [] // Add google as a search engine in the second run to increase the chances of finding something
            );
            console.log(res);
          }}
        >
          {step == "initial"
            ? "Find Publications with AI"
            : step == "finished"
              ? "Retry to find publications with additional search engines"
              : "Finding Publications..."}
        </Button>

        <a
          href={`https://www.google.com/search?q=${encodeURIComponent(
            `${props.entry.nctId} OR (${props.entry.title} ${
              props.entry.rawJson?.contactsLocationsModule?.overallOfficials?.at(
                0
              )?.name || ""
            }) pubmed`
          )}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Button variant="light">Google for publication</Button>
        </a>
      </Group>

      {step == "initial" && (
        <div className="text-sm opacity-75">
          <small>
            Clicking on the buttom above, will try to find matching publications
            automatically by using a combination of AI and automated web
            searches. If nothing is found, it does not mean that there aren't
            any publications available.
          </small>
          {props.disabled && (
            <div>
              <small>
                <b>
                  <span className="text-red">
                    This feature is currently disabled!{" "}
                  </span>
                  You need to enable AI features, provide an API Key for your
                  selected AI Provider and set a searxng base url in the
                  settings to use this feature.
                </b>
              </small>
            </div>
          )}
        </div>
      )}

      {step !== "initial" && (
        <Paper p="md" shadow="md" my="md" className="space-y-3">
          {step == "started" && (
            <div>
              <h2>Generating search queries...</h2>
              <LoadingSkeleton></LoadingSkeleton>
            </div>
          )}

          {queries.length > 0 && (
            <div>
              <b>Using the following search queries</b>
              <ul className="pl-4 list-disc">
                {queries.map((q) => (
                  <li key={q}>
                    <small>{q}</small>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {step == "finished_queries" && (
            <div>
              <b>Using queries to find relevant data online</b>
              <LoadingSkeleton></LoadingSkeleton>
            </div>
          )}

          {rawReferences.length > 0 && (
            <div>
              <b>Found the follwing online resources: </b>
              <ScrollArea className="max-h-60 overflow-y-scroll">
                <ul className="pl-4 list-disc">
                  {rawReferences.map((r) => (
                    <li key={r.url}>
                      <small>
                        <b>
                          <a href={r.url} target="_blank" className="underline">
                            {r.title}
                          </a>
                        </b>
                        {r.authors?.join(", ")}
                      </small>
                    </li>
                  ))}
                </ul>
              </ScrollArea>
            </div>
          )}

          {step == "finished_searchx" && (
            <div>
              <b>Using AI to screen online data</b>
              <LoadingSkeleton></LoadingSkeleton>
            </div>
          )}

          {aiMatches.length > 0 && (
            <div>
              <b className="mb-3">Results: </b>
              <div className="space-y-3">
                {aiMatches.map((r) => (
                  <Paper key={r.url} p="sm" shadow="sm" withBorder>
                    <div>
                      <b>{r.title}</b>
                    </div>
                    <div>
                      <small>{r.authors}</small>
                    </div>
                    <div className="flex space-x-3 items-center">
                      {/* <a href={r.url} target="_blank" className="underline"> */}
                      <div
                        className="mt-2 underline cursor-pointer"
                        onClick={() => {
                          console.log(r.url);

                          props.onLinkClick && props.onLinkClick(r.url);
                        }}
                      >
                        Link: {r.source} {r.year}, Confidence of match{" "}
                        {r.confidence}
                      </div>
                      <CopyButton value={r.url}>
                        {({ copied, copy }) => (
                          <Button
                            color={copied ? "teal" : "blue"}
                            variant="light"
                            size="compact-xs"
                            onClick={copy}
                          >
                            {copied ? "Copied url" : "Copy url"}
                          </Button>
                        )}
                      </CopyButton>
                      <a href={r.url} target="_blank" rel="noopener noreferrer">
                        <Button variant="light" size="compact-xs">
                          Open in Browser
                        </Button>
                      </a>

                      {/* </a> */}
                    </div>
                    <div className="text-sm">
                      <div>
                        <b className="text-green">Pro: </b>
                        {r.pro}
                      </div>
                      <div>
                        <b className="text-red">Con: </b>
                        {r.con}
                      </div>
                    </div>
                  </Paper>
                ))}
              </div>
            </div>
          )}

          {step == "finished" && aiMatches.length == 0 && (
            <div className="text-red">
              <b>Could not find any publications automatically</b>
            </div>
          )}
        </Paper>
      )}
    </div>
  );
};
