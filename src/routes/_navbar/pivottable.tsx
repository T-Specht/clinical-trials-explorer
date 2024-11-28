import { EntryTable } from "@/db/schema";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import PivotTableUI, { PivotTableUIProps } from "react-pivottable/PivotTableUI";
import "react-pivottable/pivottable.css";

import TableRenderers from "react-pivottable/TableRenderers";
import Plot from "react-plotly.js";
import createPlotlyRenderers from "react-pivottable/PlotlyRenderers";
import {
  getAllEntries,
  getAllEntriesWithFlatCustomFields,
  getAllFilteredEntries,
} from "@/lib/database-wrappers";
import { Button, Modal, Select } from "@mantine/core";

// create Plotly renderers via dependency injection
const PlotlyRenderers = createPlotlyRenderers(Plot);

const omit = <T extends {}, K extends keyof T>(obj: T, ...keys: K[]) =>
  Object.fromEntries(
    Object.entries(obj).filter(([key]) => !keys.includes(key as K))
  ) as Omit<T, K>;

const pick = <T extends {}, K extends keyof T>(obj: T, ...keys: K[]) =>
  Object.fromEntries(
    keys.filter((key) => key in obj).map((key) => [key, obj[key]])
  ) as Pick<T, K>;

const inclusivePick = <T extends {}, K extends string | number | symbol>(
  obj: T,
  ...keys: K[]
) =>
  Object.fromEntries(
    keys.map((key) => [key, obj[key as unknown as keyof T]])
  ) as { [key in K]: key extends keyof T ? T[key] : undefined };

export const Route = createFileRoute("/_navbar/pivottable")({
  component: () => <PivotTable />,
  loader: async ({ params }) => {
    let data = await getAllEntriesWithFlatCustomFields();
    return data;
    // return data.map((e) => {
    //   let ret = {
    //     ...e,
    //     ...e.custom_fields,
    //   };

    //   //@ts-ignore
    //   delete ret.custom_fields;
    //   return ret;
    // });
  },
});

const pivotPropsToSaveConfig = (props: PivotTableUIProps) =>
  pick(
    props,
    "aggregatorName",
    "colOrder",
    "cols",
    "rendererName",
    "rows",
    "rowOrder",
    "vals",
    "valueFilter"
  );

export type PivotConfigSave = ReturnType<typeof pivotPropsToSaveConfig>;

import { TextInput } from "@mantine/core";
import { modals } from "@mantine/modals";
import { useDisclosure, useLocalStorage } from "@mantine/hooks";
import { useSettingsStore } from "@/lib/zustand";
import { useShallow } from "zustand/react/shallow";
import { notifications } from "@mantine/notifications";
import { PIVOT_DERIVE_FUNCTIONS, SAMPLE_RULES } from "@/lib/pivot-derive";

const PivotTable = () => {
  const entries = Route.useLoaderData();

  const [savedConfigs, setSavedConfigs, pivotDeriveRules] = useSettingsStore(
    useShallow((s) => [s.savedPivotConfigs, s.setSavedPivotConfigs, s.pivotDeriveRules])
  );
  const [selectedConfig, setSelectedConfig] = useLocalStorage<string | null>({
    key: "selected_pivot_view_config",
    defaultValue: null,
  });

  const [opened, { open, close }] = useDisclosure(false);
  const [newConfigName, setNewConfigName] = useState("");

  const [pivot, setPivot] = useState<PivotTableUIProps>();

  useEffect(() => {
    if (selectedConfig) {
      let c = savedConfigs.find((c) => c.name === selectedConfig);
      if (c) {
        setPivot((prev) => ({ ...prev, ...(c.config as any) }));
      }
    }
  }, [selectedConfig, savedConfigs, setPivot]);

  useEffect(() => {
    if (pivot) {
      let config = pivotPropsToSaveConfig(pivot);
      console.log(config);
    }
  }, [pivot]);

  return (
    <div>
      <div className="flex p-3 space-x-3 items-end">
        <Modal
          opened={opened}
          onClose={close}
          title="Save current pivot view config"
        >
          <TextInput
            label="Pivot View Name"
            placeholder="Enter name"
            value={newConfigName}
            onChange={(e) => setNewConfigName(e.currentTarget.value)}
            data-autofocus
          />
          <Button
            fullWidth
            onClick={() => {
              close();
              if (pivot) {
                setSavedConfigs([
                  ...savedConfigs,
                  {
                    name: newConfigName,
                    config: pivotPropsToSaveConfig(pivot),
                  },
                ]);
                setSelectedConfig(newConfigName);
              }
              setNewConfigName("");
            }}
            mt="md"
          >
            Save view
          </Button>
        </Modal>
        <Button
          size="xs"
          onClick={() => {
            if (!pivot) return;
            open();
          }}
        >
          Save as new view
        </Button>

        <Select
          data={savedConfigs.map((c) => c.name)}
          value={selectedConfig}
          onChange={(e) => setSelectedConfig(e)}
          label="Select from saved views"
          placeholder="no view selected"
          size="xs"
        ></Select>
        {selectedConfig && (
          <>
            <Button
              size="xs"
              onClick={() => {
                if (!pivot) return;
                setSavedConfigs(
                  savedConfigs.map((c) =>
                    c.name === selectedConfig
                      ? {
                          name: selectedConfig,
                          config: pivotPropsToSaveConfig(pivot),
                        }
                      : c
                  )
                );
                notifications.show({
                  message: `Config ${selectedConfig} updated.`,
                });
              }}
            >
              Update currently selected view
            </Button>
            <Button
              size="xs"
              color="red"
              onClick={() => {
                setSavedConfigs(
                  savedConfigs.filter((c) => c.name !== selectedConfig)
                );
                setSelectedConfig(null);
              }}
            >
              Delete current view
            </Button>
          </>
        )}
        <Link to="/pivot-derived-page" className="!ml-auto">
          <Button size="xs" variant="subtle">
            Setup Derived Fields
          </Button>
        </Link>
      </div>
      <div className="overflow-scroll zoom-50 dark:invert dark:hue-rotate-180 p-3 mb-8">
        <PivotTableUI
          {...pivot}
          data={entries as any}
          onChange={(s) => setPivot(s)}
          renderers={Object.assign({}, TableRenderers, PlotlyRenderers)}
          derivedAttributes={pivotDeriveRules.reduce<{
            [k: string]: (d: any) => string;
          }>((prev, r) => {
            prev[`derived_${r.propertyName}`] = (d) => {
              let fn = PIVOT_DERIVE_FUNCTIONS.find((f) => f.name == r.func);
              if (!fn) return "Error";
              return fn.func(d, r.jsonLogic, r.args);
            };
            return prev;
          }, {})}

          //   renderers={PivotTable.renderers}
          //   onChange={(s) => this.setState(s)}
          //   {...this.state}
        />
      </div>
    </div>
  );
};
