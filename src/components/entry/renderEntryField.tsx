import { CustomFieldTable, EntryTable } from "@/db/schema";
import { UIFieldType } from "@/lib/fields";
// import { Input } from "../ui/input";
// import { Checkbox } from "../ui/checkbox";
import { BotIcon, Brain, LoaderCircle, RefreshCcwIcon } from "lucide-react";
import { Checkbox, NumberInput, TextInput } from "@mantine/core";

const EntryField = (props: {
  databaseField?: UIFieldType;
  customFieldDefinition?: typeof CustomFieldTable.$inferSelect;
  regenerateAi?: () => void;
  aiData?:
    | {
        value: any;
        explanation: string;
      }
    | undefined;
  aiStatus: "loading" | "disabled" | "data";
  onChange: (val: any) => void;
  value: any;
}) => {
  const { databaseField, onChange, value, customFieldDefinition: customField } = props;
  const isDatabaseField = !!databaseField;

  if (!!databaseField && !!customField) {
    throw new Error("Cannot have both databaseField and customField");
  }

  if (!databaseField && !customField) {
    throw new Error("Must have either databaseField or customField");
  }

  const keyOrId = isDatabaseField ? databaseField!.key : customField!.id;

  const f = databaseField || customField!;

  const dataType = !!databaseField
    ? EntryTable[databaseField.key].dataType
    : customField?.dataType;

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

          case "boolean":

            return (
              <div className="my-3 flex items-center space-x-2">
                <Checkbox
                // TODO: Fix this
                  checked={value === 'true'}
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
      {props.aiStatus != "disabled" && (
        <div className="flex space-x-1 justify-start items-start text-sm mt-2 mb-4 bg-secondary rounded-md py-4 px-2 opacity-60">
          <div>
            <BotIcon className="min-w-5 p-1" size="25px"></BotIcon>
          </div>
          {props.aiData && props.aiStatus != "loading" ? (
            <>
              <div className="flex-1">
                <code
                  onClick={() => {
                    onChange(props.aiData?.value);
                  }}
                  className="cursor-pointer"
                >
                  {props.aiData.value.toString()}
                </code>
                : {props.aiData.explanation}
              </div>
              <div>
                <RefreshCcwIcon
                  className="cursor-pointer p-1"
                  size="25px"
                  onClick={() => {
                    if (props.regenerateAi) props.regenerateAi();
                  }}
                ></RefreshCcwIcon>
              </div>
            </>
          ) : (
            <LoaderCircle
              className="animate-spin opacity-55 min-w-4"
              size={20}
            ></LoaderCircle>
          )}
        </div>
      )}
    </div>
  );
};

export default EntryField;
