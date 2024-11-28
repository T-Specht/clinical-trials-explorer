import {
  PivotDeriveRule,
  zodPivotDeriveRuleBaseSchema,
  PIVOT_DERIVE_FUNCTIONS,
} from "@/lib/pivot-derive";
import { getKeys } from "@/lib/utils";
import { useSettingsStore } from "@/lib/zustand";
import {
  Autocomplete,
  Button,
  Group,
  Input,
  JsonInput,
  Paper,
  Select,
  TextInput,
  Title,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import e from "express";
import { useState } from "react";
import { useShallow } from "zustand/react/shallow";

export function getAllJsonLogicPaths(obj: any, parentPath = ""): string[] {
  const paths = [];

  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const currentPath = parentPath ? `${parentPath}.${key}` : key;
      paths.push(currentPath);

      // If the value is an object, recursively find its paths
      if (
        typeof obj[key] === "object" &&
        obj[key] !== null &&
        !Array.isArray(obj[key])
      ) {
        paths.push(...getAllJsonLogicPaths(obj[key], currentPath));
      }
    }
  }

  return paths;
}

export const PivotDerivedRuleForm = (props: {
  rule: PivotDeriveRule | null;
  autoCompletePaths: string[] | undefined;
}) => {
  const [pivotDeriveRules, setPivotDeriveRules] = useSettingsStore(
    useShallow((s) => [s.pivotDeriveRules, s.setPivotDeriveRules])
  );

  const [propertyName, setPropertyName] = useState(
    props.rule?.propertyName || "new_property"
  );
  const [fnName, setFnName] = useState<string | null>(props.rule?.func || null);
  const [cArgs, setCArgs] = useState<{ [key: string]: string }[]>(
    props.rule?.args || {}
  );

  // If this value is null, then do not change it! Field will become disabled because json logic is set to more advanced value.
  const [jsonLogicPathVar, setJsonLogicPathVar] = useState<string | null>(
    () => {
      if (!props.rule) return "path.to.value";
      //@ts-ignore
      if (!!props.rule.jsonLogic?.var) return props.rule.jsonLogic.var;
      else return null;
    }
  );

  let currentFunction = PIVOT_DERIVE_FUNCTIONS.find((fn) => fn.name === fnName);
  let hasArguments = currentFunction?.args
    ? getKeys(currentFunction?.args.shape).length > 0
    : false;

  const generateRule = () => {
    return {
      propertyName,
      func: fnName as any,
      args: cArgs,
      jsonLogic:
        jsonLogicPathVar == null
          ? props.rule?.jsonLogic! // Keep "complex json logic" if it was set and detected
          : {
              var: jsonLogicPathVar,
            },
    } satisfies PivotDeriveRule;
  };

  return (
    <form className="space-y-3">
      <TextInput
        value={propertyName}
        label="Property Name"
        description="The name of the property to derive"
        onChange={(e) => setPropertyName(e.target.value)}
      ></TextInput>
      <Select
        value={fnName}
        description={
          PIVOT_DERIVE_FUNCTIONS.find((p) => p.name === fnName)?.description
        }
        data={PIVOT_DERIVE_FUNCTIONS.map((fn) => ({
          value: fn.name,
          label: fn.name,
        }))}
        renderOption={(props) => {
          let description = PIVOT_DERIVE_FUNCTIONS.find(
            (p) => p.name === props.option.value
          )?.description;
          return (
            <Group flex="1" gap="xs">
              {props.option.label}
              {description && <small>{description}</small>}
            </Group>
          );
        }}
        onChange={(e) => setFnName(e)}
        placeholder="Select function"
        label="Derivation Function"
        required
      ></Select>
      {hasArguments && (
        <Paper shadow="xs" p="md">
          <Title order={5}>Arguments</Title>

          {currentFunction?.args &&
            getKeys(currentFunction?.args.shape).map((arg) => {
              return (
                <TextInput
                  key={arg}
                  value={cArgs[arg] as any}
                  onChange={(e) => {
                    // @ts-ignore
                    setCArgs({ ...cArgs, [arg]: e.target.value });
                  }}
                  label={arg}
                  description={
                    (currentFunction?.args.shape[arg] as any).description || ""
                  }
                ></TextInput>
              );
            })}
        </Paper>
      )}
      {/* <JsonInput
        label="JSONLogic Path"
        description="Path to access data"
        autosize
        formatOnBlur
        value={jsonLogic}
        onChange={(e) => setJsonLogic(e)}
      ></JsonInput> */}

      <Autocomplete
        disabled={jsonLogicPathVar == null}
        label="Path to access data"
        value={!!jsonLogicPathVar ? jsonLogicPathVar : ""}
        onChange={(e) => setJsonLogicPathVar(e)}
        data={props.autoCompletePaths || []}
        description={
          jsonLogicPathVar == null
            ? 'This field is disabled because you have selected a more advanced value for "jsonLogic"'
            : "This field's autocomplete includes possible paths to access data in the JSON object of a single entry. Start typing to search. You may deviate from the suggestions."
        }
      />

      {props.rule ? (
        <Group>
          <Button
            size="xs"
            variant="default"
            onClick={() => {
              let newRuleSet = generateRule();
              let parse = zodPivotDeriveRuleBaseSchema.safeParse(newRuleSet);
              if (!parse.success) {
                notifications.show({
                  title: "Error",
                  message: parse.error.message,
                  color: "red",
                });
                return;
              } else {
                setPivotDeriveRules([
                  ...pivotDeriveRules.map((r) => {
                    if (r.propertyName === props.rule?.propertyName) {
                      return newRuleSet;
                    } else {
                      return r;
                    }
                  }),
                ]);
                notifications.show({
                  title: "Success",
                  message: "Rule updated",
                  color: "green",
                });
              }
            }}
          >
            Update
          </Button>
          <Button
            size="xs"
            variant="default"
            onClick={() => {
              if (confirm("Are you sure you want to duplicate this rule?") && props.rule) {
                setPivotDeriveRules([
                  {
                    ...props.rule,
                    propertyName: `${props.rule?.propertyName}_copy`,
                  },
                  ...pivotDeriveRules,
                ]);
                notifications.show({
                  title: "Success",
                  message: "Rule duplicated, you will find it at the top of the list.",
                  color: "green",
                });
              }
            }}
          >
            Duplicate
          </Button>
          <Button
            size="xs"
            color="red"
            onClick={() => {
              if (confirm("Are you sure you want to delete this rule?")) {
                setPivotDeriveRules([
                  ...pivotDeriveRules.filter(
                    (r) => r.propertyName !== props.rule?.propertyName
                  ),
                ]);
                notifications.show({
                  title: "Success",
                  message: "Rule deleted",
                  color: "green",
                });
              }
            }}
          >
            Delete
          </Button>
        </Group>
      ) : (
        <Button
          size="xs"
          onClick={() => {
            let newRuleSet = generateRule();
            let parse = zodPivotDeriveRuleBaseSchema.safeParse(newRuleSet);
            if (!parse.success) {
              notifications.show({
                title: "Error",
                message: parse.error.message,
                color: "red",
              });
              return;
            } else {
              setPivotDeriveRules([newRuleSet, ...pivotDeriveRules]);
              notifications.show({
                title: "Success",
                message: "Rule added",
                color: "green",
              });
            }
          }}
        >
          Create
        </Button>
      )}
    </form>
  );
};
