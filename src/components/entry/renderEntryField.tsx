import { CustomFieldTable, EntryTable } from "@/db/schema";
// import { Input } from "../ui/input";
// import { Checkbox } from "../ui/checkbox";
import {
  BotIcon,
  Brain,
  CheckCircleIcon,
  LightbulbIcon,
  LoaderCircle,
  RefreshCcwIcon,
  ShieldCheckIcon,
  SparklesIcon,
  XCircleIcon,
} from "lucide-react";
import {
  ActionIcon,
  Autocomplete,
  Button,
  Checkbox,
  Code,
  NumberInput,
  TextInput,
  Title,
} from "@mantine/core";
import { AiModesType } from "@/lib/zustand";
import { useMutation } from "@tanstack/react-query";
import { checkAllFieldsWithAI, checkSingleFieldWithAI } from "@/lib/langchain";
import { AIValidationResult } from "./AIValidationResult";

export type AIConfiguration = {
  enabled: boolean;
  mode: AiModesType;
  suggestionModeConfig: {
    aiStatus: "loading" | "disabled" | "data";
    regenerateAi?: () => void;
    aiData:
      | {
          value: any;
          explanation: string;
        }
      | undefined;
  };
  checkModeConfig: {
    input: string;
    queryStatus: "error" | "success" | "pending";
    aiData:
      | Awaited<ReturnType<typeof checkAllFieldsWithAI>>[string]
      | undefined;
  };
};

const EntryField = (props: {
  customFieldDefinition: typeof CustomFieldTable.$inferSelect;
  aiConfig: AIConfiguration;
  onChange: (val: any) => void;
  value: any;
  autocomplete?: string[] | null;
}) => {
  const { onChange, value, customFieldDefinition: customField } = props;

  const keyOrId = customField.id;
  const f = customField;
  const dataType = customField.dataType;
  const hasAiDesc = !!f.aiDescription;

  const {
    enabled: aiEnabled,
    checkModeConfig,
    mode: aiMode,
    suggestionModeConfig,
  } = props.aiConfig;

  return (
    <div>
      {(() => {
        switch (dataType) {
          case "number":
            return (
              <div>
                <label className="font-bold">{f.label}</label>
                <NumberInput
                  value={value || 0}
                  onChange={(e) => onChange(Number(e))}
                  disabled={f.isDisabled}
                ></NumberInput>
              </div>
            );

          case "string":
            if (props.autocomplete) {
              return (
                <div>
                  <Autocomplete
                    label={f.label}
                    value={value || ""}
                    onChange={(val) => onChange(val)}
                    data={props.autocomplete || []}
                    disabled={f.isDisabled}
                    rightSection={
                      aiEnabled &&
                      hasAiDesc &&
                      aiMode == "check" &&
                      checkModeConfig.aiData &&
                      (checkModeConfig.aiData.generalAcceptance ? (
                        <CheckCircleIcon
                          className="p-1 text-green"
                          strokeWidth={3}
                          size="25px"
                        ></CheckCircleIcon>
                      ) : (
                        <XCircleIcon
                          strokeWidth={3}
                          className="p-1 text-red"
                          size="25px"
                        ></XCircleIcon>
                      ))
                    }
                  />
                </div>
              );
            } else {
              return (
                <div>
                  <TextInput
                    label={f.label}
                    value={value || ""}
                    onChange={(e) => onChange(e.target.value)}
                    disabled={f.isDisabled}
                  />
                </div>
              );
            }

          case "boolean":
            return (
              <div className="my-3 flex items-center space-x-2">
                <Checkbox
                  // TODO: Fix this
                  checked={value === "true"}
                  disabled={f.isDisabled}
                  id={keyOrId.toString()}
                  onChange={(e) => onChange(e.target.checked)}
                  label={f.label}
                ></Checkbox>
              </div>
            );
          default:
            return <div>Unsupported type</div>;
        }
      })()}
      {f.description && <div className="text-sm">{f.description}</div>}
      {aiMode == "check" &&
        hasAiDesc &&
        props.aiConfig.checkModeConfig.aiData && (
          <AIValidationResult
            data={props.aiConfig.checkModeConfig.aiData}
            onChange={props.onChange}
          />
        )}
      {suggestionModeConfig.aiStatus != "disabled" && aiMode == "suggest" && (
        <div className="flex space-x-1 justify-start items-start text-sm mt-2 mb-4 bg-secondary rounded-md py-4 px-2 opacity-60">
          <div>
            <BotIcon className="min-w-5 p-1" size="25px"></BotIcon>
          </div>
          {suggestionModeConfig.aiData &&
          suggestionModeConfig.aiStatus != "loading" ? (
            <>
              <div className="flex-1">
                <code
                  onClick={() => {
                    onChange(suggestionModeConfig.aiData?.value);
                  }}
                  className="cursor-pointer"
                >
                  {String(suggestionModeConfig.aiData.value)}
                </code>
                : {suggestionModeConfig.aiData.explanation}
              </div>
              <div>
                <RefreshCcwIcon
                  className="cursor-pointer p-1"
                  size="25px"
                  onClick={() => {
                    if (suggestionModeConfig.regenerateAi)
                      suggestionModeConfig.regenerateAi();
                  }}
                ></RefreshCcwIcon>
              </div>
            </>
          ) : suggestionModeConfig.aiStatus == "loading" ? (
            <LoaderCircle
              className="animate-spin opacity-55 min-w-4"
              size={20}
            ></LoaderCircle>
          ) : (
            <RefreshCcwIcon
              className="cursor-pointer p-1"
              size="25px"
              onClick={() => {
                if (suggestionModeConfig.regenerateAi)
                  suggestionModeConfig.regenerateAi();
              }}
            ></RefreshCcwIcon>
          )}
        </div>
      )}
    </div>
  );
};

export default EntryField;
