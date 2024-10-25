import { useShallow } from "zustand/react/shallow";

import { PanelResizeHandle, Panel, PanelGroup } from "react-resizable-panels";
import { useEffect, useRef, useState } from "react";
import Markdown from "marked-react";
import Container from "../Container";
import { Editor } from "../Editor";
import { CustomFieldTable, EntryTable } from "../../db/schema";
import { updateEntryFields } from "@/lib/database-wrappers";
import EntryMenu from "./EntryMenu";

import { JsonView } from "react-json-view-lite";
import "react-json-view-lite/dist/index.css";
import { diff, updatedDiff } from "deep-object-diff";
import { useDebounce } from "@uidotdev/usehooks";

import { produce } from "immer";

const Handle = () => <PanelResizeHandle className="p-[1px] bg-black" />;

// const fieldsSchema = createInsertSchema(entry).pick({
//   design_masking: true,
//   design_observation_model: true,
//   enrollmentCount: true,
//   isRepurpose: true,
// });

import { buildAiReturnSchemaForCustomFields, FIELDS } from "@/lib/fields";
import EntryField from "./renderEntryField";
import { useSettingsStore } from "@/lib/zustand";
import EntryFilter from "../EntryFilter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { desc } from "drizzle-orm";
import { generateMetaData } from "@/lib/langchain";
import { notifications } from "@mantine/notifications";

const Entry = (props: {
  entry: typeof EntryTable.$inferSelect;
  customFields: (typeof CustomFieldTable.$inferSelect)[];
  children?: React.ReactNode;
  className?: string;
}) => {
  const [jumpPoint, setJumpPoint, openAIKey] = useSettingsStore(
    useShallow((s) => [s.jumpPoint, s.setJumpPoint, s.openAIKey])
  );
  const filter = useSettingsStore((s) => s.filter);

  const [panelSizes, setPanelSizes] = useState({
    left: 50,
    rightBottom: 20,
  });

  const [currentIndex, setCurrentIndex] = useState(0);

  const [selectedFields, setSelectedFields] = useState<typeof FIELDS>(
    // "selected_fields",
    FIELDS
  );
  const [selectedFieldQuery, setSelectedFieldsQuery] = useState("");

  const [current, updateCurrent] = useState(props.entry);
  const [lastSave, setLastSave] = useState(current);
  const queryClient = useQueryClient();

  const aiQuery = useQuery({
    queryKey: ["ai_meta", current.id, current.createdAt],
    enabled: !!openAIKey,
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
    const updateDiff = diff(lastSave, debouncedCurrent);
    const keys = Object.keys(updateDiff);

    //console.log(updateDiff);

    if (keys.length > 0) {
      console.log("Save updated diff", updateDiff);
      setLastSave(current);
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

  // Only save after 1 seconds of no changes
  const debouncedCurrent = useDebounce(current, 1000);

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

  const registerCustomField = (fieldId: string) => {
    return {
      value: current.custom_fields ? current.custom_fields[fieldId] : null,
      onChange: (newVal: any) => {
        updateCurrent(
          produce((draft) => {
            if (!draft.custom_fields) {
              draft.custom_fields = {};
            }
            draft.custom_fields[fieldId] = newVal;
            return draft;
          })
        );
      },
    };
  };

  const iframe2 = useRef<HTMLIFrameElement>(null);

  // useEffect(() => {
  //   debouncedSave()
  // }, [current])
  //console.log(cond?.conditions);

  return (
    <div className={props.className}>
      <PanelGroup direction="horizontal" autoSaveId="layout1">
        <Panel
          className="min-w-[25%]"
          defaultSize={panelSizes.left}
          //onResize={(s) => setPanelSizes({ ...panelSizes, left: s })}
        >
          <Container className="prose h-full overflow-y-scroll">
            <h2>{current.title}</h2>
            <p>{current.nctId}</p>

            <h3>Description</h3>
            <div className="max-h-60 overflow-y-scroll rounded-md border p-2">
              <Markdown>{current.description || ""}</Markdown>
            </div>
            <div className="space-y-3">
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
                      !openAIKey
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
                    customField={f}
                    {...registerCustomField(f.idName)}
                  ></EntryField>
                );
              })}
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
        </Panel>
        <Handle></Handle>
        <Panel>
          <PanelGroup direction="vertical" autoSaveId="layout2">
            <Panel className="">
              <iframe
                // src={`http://localhost:${PROXY_PORT}/study/${current.nctId}${jumpPoint}`}
                src={`https://clinicaltrials.gov/study/${current.nctId}${jumpPoint}`}
                className="w-full h-full dark:invert-[95%] dark:hue-rotate-180 border-none"
              ></iframe>
            </Panel>
            <Handle></Handle>
            <Panel
              className="flex flex-col h-0"
              defaultSize={panelSizes.rightBottom}
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
            </Panel>
          </PanelGroup>
        </Panel>
      </PanelGroup>
    </div>
  );
};

export default Entry;
