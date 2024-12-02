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
import {
  CustomFieldEntryTable,
  CustomFieldTable,
  EntryTable,
} from "../../db/schema";
import {
  getAllEntries,
  insertCustomFieldData,
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

import { buildAiReturnSchemaForCustomFields, FIELDS } from "@/lib/fields";
import EntryField from "./renderEntryField";
import { useSettingsStore } from "@/lib/zustand";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { generateMetaData } from "@/lib/langchain";
import { notifications } from "@mantine/notifications";
import {
  Badge,
  Button,
  Pill,
  Group,
  ScrollArea,
  Title,
  useComputedColorScheme,
} from "@mantine/core";
import { cn } from "@/lib/utils";
import { searxng_api_search } from "@/lib/searxng_api";
import { PublicationSearch } from "./PublicationSearch";
import { Redo2 } from "lucide-react";

(window as any)["searxng_api_search"] = searxng_api_search;

const Entry = (props: {
  entry: typeof EntryTable.$inferSelect;
  customFields: (typeof CustomFieldTable.$inferSelect)[];
  customFieldsData: (typeof CustomFieldEntryTable.$inferSelect)[];
  children?: React.ReactNode;
  className?: string;
}) => {
  const [jumpPoint, setJumpPoint, openAIKey, aiProvider, searxngUrl] =
    useSettingsStore(
      useShallow((s) => [
        s.jumpPoint,
        s.setJumpPoint,
        s.openAIKey,
        s.aiProvider,
        s.searxngUrl,
      ])
    );
  const filter = useSettingsStore((s) => s.filter);

  const [selectedFields, setSelectedFields] = useState<typeof FIELDS>(
    // "selected_fields",
    FIELDS
  );
  const [displayOtherUrl, setDisplayOtherUrl] = useState<null | string>(null);

  const [current, updateCurrent] = useState(props.entry);
  const [customFieldDataCurrent, updateCustomFieldDataCurrent] = useState(
    props.customFieldsData
  );

  const [lastSave, setLastSave] = useState({ current, customFieldDataCurrent });
  const queryClient = useQueryClient();

  const aiQuery = useQuery({
    queryKey: ["ai_meta", current.id, current.createdAt],
    enabled: !!openAIKey && aiProvider != "disabled",
    queryFn: () => {
      const schema = buildAiReturnSchemaForCustomFields(props.customFields);

      let input = {
        title: current.title,
        description: current.rawJson?.descriptionModule,
        intervention: current.rawJson?.armsInterventionsModule,
      };

      console.log("Requesting AI data...", current.id, input);

      return generateMetaData(JSON.stringify(input), schema);
    },
    staleTime: Infinity,
  });

  const saveChangesIfAny = async () => {
    const updateDiff = diff(lastSave.current, debouncedCurrent);
    const keys = Object.keys(updateDiff);

    //console.log(updateDiff);

    if (keys.length > 0) {
      console.log("Save updated diff", updateDiff);
      setLastSave({ ...lastSave, current });
      updateEntryFields(props.entry.id, updateDiff);
      // queryClient.invalidateQueries({
      //   queryKey: ["filtered_entries"],
      // });

      // Hot swap the current entry in the cache
      queryClient.setQueryData(
        ["filtered_entries", filter],
        (prev: (typeof props.entry)[]) => {
          if (!prev) return prev;

          return prev.map((e) => {
            if (e.id == current.id) {
              return current;
            }
            return e;
          });
        }
      );

      notifications.show({
        title: "Saved changes",
        message: keys.join(", "),
      });
    }
  };

  const saveChangesIfAnyForCustomFields = async () => {
    //console.log("Save updated custom fields", customFieldDataCurrent);
    const updateDiff = diff(
      lastSave.customFieldDataCurrent,
      customFieldDataCurrent
    );
    const keys = Object.keys(updateDiff);

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

        notifications.show({
          title: "Saved changes",
          message:
            props.customFields.find((f) => f.id == field.customFieldId)
              ?.label || "Unknown field",
        });
      }
    }

    // queryClient.invalidateQueries({
    //   queryKey: ["filtered_entries", filter],
    // });

    // Hot swap the current entry in the cache
    queryClient.setQueryData(
      ["filtered_entries", filter],
      (prev: Awaited<ReturnType<typeof getAllEntries>>) => {
        if (!prev) return prev;

        return prev.map((e) => {
          if (e.id == current.id) {
            let clone = structuredClone(e);
            // TODO FIX THIS - this is because customFieldDefinition is not in type of props
            clone.customFieldsData = customFieldDataCurrent;
            return clone;
          }
          return e;
        });
      }
    );

    setLastSave({ ...lastSave, customFieldDataCurrent });
  };

  // Only save after 1 seconds of no changes
  const debouncedCurrent = useDebounce(current, 1000);
  const debouncedCustomFieldDataCurrent = useDebounce(
    customFieldDataCurrent,
    1000
  );

  useEffect(() => {
    saveChangesIfAnyForCustomFields();
  }, [debouncedCustomFieldDataCurrent]);

  useEffect(() => {
    saveChangesIfAny();
  }, [debouncedCurrent]);

  const registerField = (field: keyof typeof EntryTable.$inferInsert) => {
    return {
      value: current[field] as any,
      onChange: (newVal: any) =>
        updateCurrent((prev) => ({ ...prev, [field]: newVal })),
    };
  };

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
                entryId: current.id,
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

  return (
    <div className={props.className}>
      <ResizablePanelGroup direction="horizontal" autoSaveId="layout1">
        <ResizablePanel
          className="min-w-[25%]"
          defaultSize={50}
          //onResize={(s) => setPanelSizes({ ...panelSizes, left: s })}
        >
          <Container className="h-full overflow-y-scroll">
            <Title order={4}>{current.title}</Title>
            <div>
              <Badge>{current.nctId}</Badge>
            </div>

            <h3>Description</h3>
            <ScrollArea className="max-h-60 overflow-y-scroll rounded-md border p-2">
              <Markdown>{current.description || ""}</Markdown>
            </ScrollArea>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 my-5">
              {selectedFields.map((f) => {
                return (
                  <EntryField
                    aiStatus="disabled"
                    key={f.label}
                    databaseField={f}
                    {...registerField(f.key)}
                  ></EntryField>
                );
              })}
              {props.customFields.map((f) => {
                return (
                  <EntryField
                    aiStatus={
                      aiProvider == "disabled" ||
                      !openAIKey ||
                      !f.aiDescription ||
                      f.aiDescription?.trim() == ""
                        ? "disabled"
                        : aiQuery.isLoading || aiQuery.isRefetching
                          ? "loading"
                          : "data"
                    }
                    aiData={aiQuery.data?.[f.idName]}
                    regenerateAi={() => {
                      aiQuery.refetch();
                    }}
                    key={f.id}
                    customFieldDefinition={f}
                    {...registerCustomField(f.id)}
                  ></EntryField>
                );
              })}
            </div>

            <div>
              <PublicationSearch
                entry={props.entry}
                disabled={aiProvider == "disabled" || searxngUrl.trim() == ""}
                onLinkClick={(url) => setDisplayOtherUrl(url)}
              ></PublicationSearch>
            </div>

            <div className="font-mono text-[12px] dark:invert">
              <JsonView
                data={current.rawJson as any}
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
                      <Button size="xs" variant="light" onClick={() => setDisplayOtherUrl(null)}>
                        <Redo2 size={15} className="mr-2"></Redo2> Go back to clinical trial page
                      </Button>
                    </Group>
                  </div>
                )}
                <iframe
                  // src={`http://localhost:${PROXY_PORT}/study/${current.nctId}${jumpPoint}`}
                  src={
                    displayOtherUrl ||
                    `https://clinicaltrials.gov/study/${current.nctId}${jumpPoint}`
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
              {/* <iframe
                  // src={`http://localhost:${PROXY_PORT}/study/${current.nctId}${jumpPoint}`}
                  src={`https://google.com`}
                  className="w-full h-full dark:invert-[95%] dark:hue-rotate-180 flex-1"
                  ref={iframe2}
                ></iframe> */}
              <div className="p-2 mt-[-10px] h-0 flex-1">
                <Editor
                  inputMarkdown={current.notes || ""}
                  placeholderText="Notes"
                  key={current.id}
                  onChange={(markdown) => {
                    updateCurrent((prev) => ({ ...prev, notes: markdown }));
                  }}
                  prose
                  className="h-full overflow-y-scroll text-sm"
                ></Editor>
              </div>
              {/* <div className="p-4 flex">Settings?</div> */}
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};

export default Entry;
