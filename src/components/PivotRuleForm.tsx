import {
  PivotDeriveRule,
  zodPivotDeriveRuleBaseSchema,
  PIVOT_DERIVE_FUNCTIONS,
} from "@/lib/pivot-derive";
import { getKeys } from "@/lib/utils";
import { useSettingsStore } from "@/lib/zustand";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
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

  const form = useForm<PivotDeriveRule>({
    defaultValues: {
      args: props.rule?.args || {},
      description: props.rule?.description || "",
      displayName: props.rule?.displayName || "",
      func: props.rule?.func || "get",
      jsonLogic: props.rule?.jsonLogic || { var: "path.to.value" },
      propertyName: props.rule?.propertyName || "new_property",
    },
    resolver: zodResolver(zodPivotDeriveRuleBaseSchema),
  });

  // If this value is true, then do not change field via form! Field will become disabled because json logic is set to more advanced value.
  const HAS_COMPLEX_JSON_LOGIC =
    !!props.rule && !!props.rule.jsonLogic && !props.rule.jsonLogic.var;

  const fnName = form.watch("func");

  let currentFunction = PIVOT_DERIVE_FUNCTIONS.find((fn) => fn.name === fnName);
  let hasArguments = currentFunction?.args
    ? getKeys(currentFunction?.args.shape).length > 0
    : false;

  return (
    <form className="space-y-3">
      <TextInput
        {...form.register("propertyName")}
        required
        label="Property Name"
        description="The name of the property to derive"
      ></TextInput>
      <TextInput
        {...form.register("displayName")}
        label="Display Name"
        description="The name of the property to display in the pivot table"
      ></TextInput>
      <TextInput
        {...form.register("description")}
        label="Description"
        description="A description of the property"
      ></TextInput>
      <Controller
        control={form.control}
        name="func"
        render={({ field }) => {
          return (
            <Select
              value={field.value}
              description={
                PIVOT_DERIVE_FUNCTIONS.find((p) => p.name === fnName)
                  ?.description
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
              onChange={(e) => field.onChange(e)}
              placeholder="Select function"
              label="Derivation Function"
              required
            ></Select>
          );
        }}
      ></Controller>

      {hasArguments && (
        <Paper shadow="xs" p="md">
          <Title order={5}>Arguments</Title>

          {currentFunction?.args && (
            <Controller
              control={form.control}
              name="args"
              render={({ field }) => {
                return (
                  <>
                    {getKeys(currentFunction?.args.shape).map((arg) => {
                      return (
                        <TextInput
                          key={arg}
                          value={field.value[arg]}
                          onChange={(e) => {
                            field.onChange({
                              ...field.value,
                              [arg]: e.target.value,
                            });
                          }}
                          label={arg}
                          description={
                            (currentFunction?.args.shape[arg] as any)
                              .description || ""
                          }
                        ></TextInput>
                      );
                    })}
                  </>
                );
              }}
            ></Controller>
          )}
        </Paper>
      )}

      <Controller
        control={form.control}
        name="jsonLogic"
        render={({ field, fieldState }) => {
          return (
            <Autocomplete
              disabled={HAS_COMPLEX_JSON_LOGIC}
              required
              label="Path to access data"
              value={!!field.value ? field.value.var : ""}
              onChange={(e) => field.onChange({ var: e })}
              data={props.autoCompletePaths || []}
              description={
                HAS_COMPLEX_JSON_LOGIC
                  ? 'This field is disabled because you have selected a more advanced value for "jsonLogic"'
                  : "This field's autocomplete includes possible paths to access data in the JSON object of a single entry. Start typing to search. You may deviate from the suggestions."
              }
            />
          );
        }}
      ></Controller>

      {props.rule ? (
        <Group>
          <Button
            size="xs"
            variant="default"
            onClick={form.handleSubmit((data) => {
              setPivotDeriveRules([
                ...pivotDeriveRules.map((r) => {
                  if (r.propertyName === props.rule?.propertyName) {
                    return data;
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
            })}
          >
            Update
          </Button>
          <Button
            size="xs"
            variant="default"
            onClick={() => {
              if (
                confirm("Are you sure you want to duplicate this rule?") &&
                props.rule
              ) {
                setPivotDeriveRules([
                  {
                    ...props.rule,
                    propertyName: `${props.rule?.propertyName}_copy`,
                  },
                  ...pivotDeriveRules,
                ]);
                notifications.show({
                  title: "Success",
                  message:
                    "Rule duplicated, you will find it at the top of the list.",
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
          onClick={form.handleSubmit((data) => {
            setPivotDeriveRules([data, ...pivotDeriveRules]);
            notifications.show({
              title: "Success",
              message: "Rule added",
              color: "green",
            });
            form.reset();
          })}
        >
          Create
        </Button>
      )}
    </form>
  );
};
