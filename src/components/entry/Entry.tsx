import { useShallow } from "zustand/react/shallow";

//import { PanelResizeHandle, Panel, PanelGroup } from "react-resizable-panels";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "../ui/resizable";
import { useEffect, useState } from "react";
import Markdown from "marked-react";
import Container from "../Container";
import { Editor } from "../Editor";
import { CustomFieldEntryTable, CustomFieldTable } from "../../db/schema";
import {
  getAllEntries,
  getUniqueValuesForStringCustomFields,
  insertCustomFieldData,
  SingleEntryReturnedByDBWrapper,
  updateCustomFieldData,
  updateEntryFields,
} from "@/lib/database-wrappers";
//import { serialize, deserialize } from "superjson";

import { JsonView } from "react-json-view-lite";
import "react-json-view-lite/dist/index.css";
import { diff } from "deep-object-diff";
import { useDebounce } from "@uidotdev/usehooks";

import { produce } from "immer";

const serialize = (data: any) => data.toString();
const deserialize = (data: string) => data;

const Handle = () => <ResizableHandle withHandle className="border-2 " />;

// const fieldsSchema = createInsertSchema(entry).pick({
//   design_masking: true,
//   design_observation_model: true,
//   enrollmentCount: true,
//   isRepurpose: true,
// });

import {
  buildAiCheckSchemaForCustomFields,
  buildAiReturnSchemaForCustomFields,
} from "@/lib/fields";
import EntryField from "./renderEntryField";
import {
  useAiCacheStore,
  useSettingsStore,
  useUiActionsStore,
} from "@/lib/zustand";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { checkAllFieldsWithAI, generateMetaData } from "@/lib/langchain";
import {
  Badge,
  Button,
  Group,
  ScrollArea,
  Title,
  Alert,
  Code,
  ActionIcon,
  Tooltip,
} from "@mantine/core";
import { sleep } from "@/lib/utils";
import { searxng_api_search } from "@/lib/searxng_api";
import { PublicationSearch } from "./PublicationSearch";
import { LightbulbIcon, Redo2, SaveIcon, SearchCheckIcon } from "lucide-react";
import { useDebouncedCallback } from "@mantine/hooks";
import { Link } from "@tanstack/react-router";
import { motion, useAnimation } from "motion/react";
import useKeyboardShortcut from "use-keyboard-shortcut";

(window as any)["searxng_api_search"] = searxng_api_search;

const Entry = (props: {
  entry: SingleEntryReturnedByDBWrapper;
  customFields: (typeof CustomFieldTable.$inferSelect)[];
  customFieldsData: (typeof CustomFieldEntryTable.$inferSelect)[];
  children?: React.ReactNode;
  className?: string;
  stringCustomFieldsUniqueValues: Awaited<
    ReturnType<typeof getUniqueValuesForStringCustomFields>
  >;
}) => {
  const [
    jumpPoint,
    setJumpPoint,
    openAIKey,
    aiProvider,
    searxngUrl,
    deriveRules,
    entryViewConfig,
    aiMode,
    filter,
  ] = useSettingsStore(
    useShallow((s) => [
      s.jumpPoint,
      s.setJumpPoint,
      s.openAIKey,
      s.aiProvider,
      s.searxngUrl,
      s.pivotDeriveRules,
      s.entryViewConfig,
      s.aiMode,
      s.filter,
    ])
  );

  const [lastSavedFields, setLastSavedFields] = useState<string[]>([]);

  const currentEntry = props.entry;

  const [displayOtherUrl, setDisplayOtherUrl] = useState<null | string>(null);

  const updateNotes = useDebouncedCallback(async (markdown: string) => {
    await updateEntryFields(props.entry.id, { notes: markdown });
    // notifications.show({
    //   title: "Saved changes",
    //   message: "Notes",
    // });
    setLastSavedFields(["Notes"]);

    // Update in Cache
    updateCachedEntry({
      notes: markdown,
    });
  }, 1000);

  const [customFieldDataCurrent, updateCustomFieldDataCurrent] = useState(
    props.customFieldsData
  );

  const [lastSave, setLastSave] = useState({ customFieldDataCurrent });
  const queryClient = useQueryClient();

  const aiSuggestQuery = useQuery({
    queryKey: ["ai_meta", currentEntry.id, currentEntry.createdAt, aiProvider],
    enabled:
      !!openAIKey &&
      aiProvider != "disabled" &&
      ["suggest", "both"].includes(aiMode),
    queryFn: async () => {
      const schema = buildAiReturnSchemaForCustomFields(props.customFields);
      const cache = useAiCacheStore
        .getState()
        .getMetadataCacheForNct(currentEntry.nctId);

      // Before refetch you have to clear cache to get new data
      if (cache) {
        return cache;
      }

      let input = {
        title: currentEntry.title,
        description: currentEntry.rawJson?.descriptionModule,
        intervention: currentEntry.rawJson?.armsInterventionsModule,
      };

      console.log("Requesting AI data...", currentEntry.id, input);

      let result = await generateMetaData(JSON.stringify(input), schema);

      useAiCacheStore
        .getState()
        .setMetadataCacheForNct(currentEntry.nctId, result);

      return result;
    },
  });

  const aiCheckQuery = useQuery({
    queryKey: [
      "ai_meta_check",
      currentEntry.id,
      currentEntry.createdAt,
      aiProvider,
    ],
    //enabled: !!openAIKey && aiProvider != "disabled" && aiMode == "check",
    enabled: false, // no fetch on mount only with button
    queryFn: async () => {
      const schema = buildAiCheckSchemaForCustomFields(props.customFields);
      const userInputDataWithFieldsDef = props.customFields
        .map((c) => ({
          fieldName: c.idName,
          aiDesc: c.aiDescription,
          userValue:
            customFieldDataCurrent.find((cf) => cf.customFieldId == c.id)
              ?.value || null,
        }))
        .filter((c) => c.aiDesc && c.aiDesc.trim() != "");

      console.log(customFieldDataCurrent, userInputDataWithFieldsDef);

      let input = JSON.stringify({
        title: currentEntry.title,
        description: currentEntry.rawJson?.descriptionModule,
        intervention: currentEntry.rawJson?.armsInterventionsModule,
      });

      let res = await checkAllFieldsWithAI(
        input,
        userInputDataWithFieldsDef,
        schema
      );

      console.log("AI_CHECK_ALL", res);

      return res;
    },
  });

  useKeyboardShortcut(["Shift", "Control", "c"], () => aiCheckQuery.refetch(), {
    //overrideSystem: true,
    ignoreInputFields: true,
    repeatOnHold: false,
  });

  const saveChangesIfAnyForCustomFields = async () => {
    //console.log("Save updated custom fields", customFieldDataCurrent);
    const updateDiff = diff(
      lastSave.customFieldDataCurrent,
      customFieldDataCurrent
    );
    const keys = Object.keys(updateDiff);

    let updatedFieldNames: string[] = [];

    if (keys.length > 0) {
      console.log("Save updated CF diff", updateDiff);

      // updateEntryFields(props.entry.id, updateDiff);

      for (let k of keys) {
        let field = customFieldDataCurrent.at(parseInt(k))!;
        let updatedFields = (updateDiff as any)[k];
        //console.log(field, updatedFields);

        if (field.id == -1) {
          // Field is new and needs to be inserted
          let [insertedEntry] = await insertCustomFieldData(field);
          updateCustomFieldDataCurrent(
            produce((d) => {
              d[parseInt(k)] = insertedEntry;
              return d;
            })
          );
        } else {
          // Update
          updateCustomFieldData(field.id, updatedFields);
        }

        updatedFieldNames.push(
          props.customFields.find((f) => f.id == field.customFieldId)?.label ||
            "Unknown field"
        );

        // notifications.show({
        //   title: "Saved changes",
        //   message:
        //     props.customFields.find((f) => f.id == field.customFieldId)
        //       ?.label || "Unknown field",
        // });

        //registerUiUpdateAsSaveEvent();
      }
    }

    // For save animation and display of fields saved
    setLastSavedFields(updatedFieldNames);

    // queryClient.invalidateQueries({
    //   queryKey: ["filtered_entries", filter],
    // });

    // Hot swap the current entry in the cache
    updateCachedEntry({
      customFieldsData: customFieldDataCurrent as any, // TODO FIX THIS - this is because customFieldDefinition is not in type of props
    });

    setLastSave({ customFieldDataCurrent });
  };

  const updateCachedEntry = (
    newData: Partial<Awaited<ReturnType<typeof getAllEntries>>[0]>
  ) => {
    queryClient.setQueryData(
      ["filtered_entries", filter],
      (prev: Awaited<ReturnType<typeof getAllEntries>>) => {
        if (!prev) return prev;

        return prev.map((e) => {
          if (e.id == currentEntry.id) {
            let clone = { ...structuredClone(e), ...newData }; // Merge old data with new data
            //console.log("Updating Query cache", clone);
            return clone;
          }
          return e;
        });
      }
    );

    // TODO: Replace instead of refetch
    queryClient.invalidateQueries({
      queryKey: ["custom_field_unique_values"],
    });
  };

  // Only save after 1 seconds of no changes
  const debouncedCustomFieldDataCurrent = useDebounce(
    customFieldDataCurrent,
    1000
  );

  useEffect(() => {
    saveChangesIfAnyForCustomFields();
  }, [debouncedCustomFieldDataCurrent]);

  const registerCustomField = (fieldId: number) => {
    let value = customFieldDataCurrent.find(
      (f) => f.customFieldId == fieldId
    )?.value;

    return {
      value: !!value ? deserialize(value) : null,
      onChange: (newVal: any) => {
        //console.log("Setting custom field", fieldId, newVal);
        updateCustomFieldDataCurrent(
          produce((d) => {
            let index = d.findIndex((f) => f.customFieldId == fieldId);
            if (index == -1) {
              // Mock database entry because it is inserted later
              d.push({
                customFieldId: fieldId,
                entryId: currentEntry.id,
                value: serialize(newVal),
                id: -1,
                createdAt: new Date(),
                updatedAt: new Date(),
              });
            } else {
              d[index].value = serialize(newVal);
            }
            return d;
          })
        );
      },
    };
  };

  // useEffect(() => {
  //   debouncedSave()
  // }, [current])
  //console.log(cond?.conditions);

  const visibleFields = entryViewConfig.filter((f) => f.hidden == false);

  const animation = useAnimation();

  const playSaveAnimation = async () => {
    console.log(lastSavedFields);

    await animation.start("visible");
    await sleep(2000);
    await animation.start("hidden");
  };

  useEffect(() => {
    if (lastSavedFields.length > 0) {
      playSaveAnimation();
    }
  }, [lastSavedFields]);

  return (
    <div className={props.className}>
      <ResizablePanelGroup direction="horizontal" autoSaveId="layout1">
        <ResizablePanel
          className="min-w-[25%] relative"
          defaultSize={50}
          //onResize={(s) => setPanelSizes({ ...panelSizes, left: s })}
        >
          <Container className="h-full overflow-y-scroll">
            <motion.div
              //className="absolute top-0 right-0 p-2 z-20 flex space-x-2 items-center w-full justify-end bg-gradient-to-b from-white from-70% bg-opacity-50"
              className="absolute top-2 right-2 z-20 flex space-x-2 items-center justify-end"
              variants={{
                hidden: { opacity: 0, y: -20 },
                visible: {
                  opacity: 1,
                  y: 0,
                },
              }}
              initial="hidden"
              animate={animation}
            >
              {/* <div className="text-xs text-right leading-none">
                <div className="flex space-x-1 items-center font-bold">
                  <div>Fields saved successfully to database</div>
                </div>
                <div>{lastSavedFields.join(", ")}</div>
              </div> */}
              <motion.div
                className="p-2 text-white rounded-md shadow-md bg-primary"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{
                  ease: "easeInOut",
                  repeat: Infinity,
                  duration: 1,
                }}
              >
                <SaveIcon size={15}></SaveIcon>
              </motion.div>
            </motion.div>

            {["check", "both"].includes(aiMode) && aiProvider != "disabled" && (
              <div
                //className="absolute top-0 right-0 p-2 z-20 flex space-x-2 items-center w-full justify-end bg-gradient-to-b from-white from-70% bg-opacity-50"
                className="absolute bottom-2 right-2 z-20 flex space-x-2 items-center justify-end"
              >
                {/* <div className="text-xs text-right leading-none">
                <div className="flex space-x-1 items-center font-bold">
                  <div>Fields saved successfully to database</div>
                </div>
                <div>{lastSavedFields.join(", ")}</div>
              </div> */}
                <Tooltip label="Check custom fields data with AI">
                  <ActionIcon
                    className="shadow-md"
                    size={"md"}
                    loading={
                      aiCheckQuery.isLoading || aiCheckQuery.isRefetching
                    }
                    onClick={() => aiCheckQuery.refetch()}
                  >
                    <SearchCheckIcon size={15}></SearchCheckIcon>
                  </ActionIcon>
                </Tooltip>
              </div>
            )}

            <Group>
              <Title order={4}>{currentEntry.title}</Title>

              <Tooltip label="Click to open in external default browser">
                <a
                  href={`https://clinicaltrials.gov/study/${currentEntry.nctId}`}
                  target="_blank"
                  className="cursor-pointer"
                  rel="noopener noreferrer"
                >
                  <Badge>{currentEntry.nctId}</Badge>
                </a>
              </Tooltip>
            </Group>

            <h3>Description</h3>
            <ScrollArea className="max-h-60 overflow-y-scroll rounded-md border p-2">
              <Markdown>{currentEntry.description || ""}</Markdown>
            </ScrollArea>

            {visibleFields.length == 0 && (
              <div>
                <Alert
                  my="md"
                  variant="light"
                  color="blue"
                  title="Information"
                  icon={<LightbulbIcon></LightbulbIcon>}
                >
                  <div>
                    No fields are visible. Please go to settings and configure
                    this view to your requirement.
                  </div>

                  <Link to="/configure-view">
                    <Button variant="light" mt="md">
                      Configure Entry View
                    </Button>
                  </Link>
                </Alert>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 my-5">
              {visibleFields.map((item) => {
                if (item.type == "derived_field") {
                  let r = deriveRules.find(
                    (r) => r.propertyName == item.propertyNameOrId
                  );

                  if (!r) return <div>Rule not found</div>;
                  return (
                    <div
                      key={r.propertyName}
                      className="p-4 bg-gray-50 dark:bg-gray-800 rounded-md "
                    >
                      <div className="text-sm font-bold flex space-x-2 items-center">
                        <div>
                          {r.displayName ? (
                            <span>
                              {r.displayName} <Code>{r.propertyName}</Code>
                            </span>
                          ) : (
                            <Code>{r.propertyName}</Code>
                          )}
                        </div>

                        <Badge
                          color="gray"
                          variant="light"
                          size="xs"
                          className="!ml-auto"
                        >
                          Derived Field
                        </Badge>
                      </div>
                      {r.description && (
                        <div className="text-xs">{r.description}</div>
                      )}
                      <div className="mt-3 ml-1">
                        {(currentEntry as any)[`derived_${r.propertyName}`]}
                      </div>
                    </div>
                  );
                } else if (item.type == "custom_field") {
                  let f = props.customFields.find(
                    (e) => e.id.toString() == item.propertyNameOrId
                  );

                  if (!f) return <div>Custom Field not found</div>;

                  // Get Autocomplete values
                  let acValues =
                    props.stringCustomFieldsUniqueValues.find(
                      (c) => c.id == f.id
                    )?.uniqueValues || [];

                  return (
                    <EntryField
                      autocomplete={f.autocompleteEnabled ? acValues : null}
                      aiConfig={{
                        enabled: aiProvider != "disabled",
                        mode: aiMode,
                        suggestionModeConfig: {
                          aiData: aiSuggestQuery.data?.[f.idName],
                          aiStatus:
                            aiProvider == "disabled" ||
                            !openAIKey ||
                            !f.aiDescription ||
                            f.aiDescription?.trim() == ""
                              ? "disabled"
                              : aiSuggestQuery.isLoading ||
                                  aiSuggestQuery.isRefetching
                                ? "loading"
                                : "data",
                          regenerateAi: () => {
                            // Remove from Cache first
                            useAiCacheStore
                              .getState()
                              .clearMetadataCacheForNct(currentEntry.nctId);
                            aiSuggestQuery.refetch();
                          },
                        },
                        checkModeConfig: {
                          aiData: aiCheckQuery.data?.[f.idName],
                          queryStatus: aiCheckQuery.status,
                          input: JSON.stringify({
                            title: currentEntry.title,
                            description:
                              currentEntry.rawJson?.descriptionModule,
                            intervention:
                              currentEntry.rawJson?.armsInterventionsModule,
                          }),
                        },
                      }}
                      key={f.id}
                      customFieldDefinition={f}
                      {...registerCustomField(f.id)}
                    ></EntryField>
                  );
                } else {
                  return <div>Unsupported type</div>;
                }
              })}
            </div>

            <div>
              <PublicationSearch
                entry={props.entry}
                disabled={aiProvider == "disabled" || searxngUrl.trim() == ""}
                onLinkClick={(url) => setDisplayOtherUrl(url)}
              ></PublicationSearch>
            </div>

            <Title order={4} mt="md">
              Raw Data
            </Title>
            <div className="font-mono text-[12px] dark:invert">
              <JsonView
                data={currentEntry.rawJson as any}
                //style={{...defaultStyles, container: 'bg-blue'}}
                //style={darkStyles}
                shouldExpandNode={(level) => level < 2}
                clickToExpandNode
              ></JsonView>
            </div>
            {/* <EditEntryForm
          initialValues={current}
          onSubmit={(data, form) => {}}
        ></EditEntryForm> */}
          </Container>
        </ResizablePanel>
        <Handle></Handle>
        <ResizablePanel>
          <ResizablePanelGroup direction="vertical" autoSaveId="layout2">
            <ResizablePanel className="">
              <div className="h-full flex flex-col">
                {displayOtherUrl && (
                  <div className="p-2">
                    <Group>
                      <Button
                        size="xs"
                        variant="light"
                        onClick={() => setDisplayOtherUrl(null)}
                      >
                        <Redo2 size={15} className="mr-2"></Redo2> Go back to
                        clinical trial page
                      </Button>
                    </Group>
                  </div>
                )}
                <iframe
                  // src={`http://localhost:${PROXY_PORT}/study/${current.nctId}${jumpPoint}`}
                  src={
                    displayOtherUrl ||
                    `https://clinicaltrials.gov/study/${currentEntry.nctId}${jumpPoint}`
                  }
                  className="w-full h-full border-none dark:invert-[95%] dark:hue-rotate-180"
                ></iframe>
              </div>
            </ResizablePanel>
            <Handle></Handle>
            <ResizablePanel
              className="flex flex-col h-0"
              defaultSize={20}
              //onResize={(s) => setPanelSizes({ ...panelSizes, rightBottom: s })}
            >
              <div className="p-2 mt-[-10px] h-0 flex-1">
                <Editor
                  inputMarkdown={props.entry.notes || ""} // Can be initialized like this because it is controlled in componentnt
                  placeholderText="Notes"
                  key={currentEntry.id}
                  onChange={(markdown) => {
                    // Todo change in cache
                    updateNotes(markdown);
                  }}
                  prose
                  className="h-full overflow-y-scroll text-sm"
                ></Editor>
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};

export default Entry;
