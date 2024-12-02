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
import { Button, Checkbox, Group, Modal, Select } from "@mantine/core";

// create Plotly renderers via dependency injection
const PlotlyRenderers = createPlotlyRenderers(Plot);

export const Route = createFileRoute("/_navbar/pivottable")({
  component: () => <PivotTable />,
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
import {
  PIVOT_DERIVE_FUNCTIONS,
  DEFAULT_DERIVED_RULES,
} from "@/lib/pivot-derive";
import { useQuery } from "@tanstack/react-query";
import EntryFilter from "@/components/EntryFilter";
import { pick } from "@/lib/utils";

const PivotTable = () => {
  const [savedConfigs, setSavedConfigs, pivotDeriveRules] = useSettingsStore(
    useShallow((s) => [
      s.savedPivotConfigs,
      s.setSavedPivotConfigs,
      s.pivotDeriveRules,
    ])
  );
  const [selectedConfig, setSelectedConfig] = useLocalStorage<string | null>({
    key: "selected_pivot_view_config",
    defaultValue: null,
  });

  const [useGobalFilter, setUseGlobalFilter] = useState(false);

  const entriesQuery = useQuery({
    queryKey: ["entries_pivot", useGobalFilter],
    queryFn: () => {
      if (useGobalFilter) {
        return getAllFilteredEntries(useSettingsStore.getState().filter);
      } else {
        return getAllEntriesWithFlatCustomFields();
      }
    },
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
      <Group className="p-3 mt-3">
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
          className="-mt-6" // TODO fix hack to align with button
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
        <Checkbox
          label="Use global filter"
          checked={useGobalFilter}
          onChange={(e) => setUseGlobalFilter(e.target.checked)}
        ></Checkbox>
        <Link to="/pivot-derived-page" className="!ml-auto">
          <Button size="xs" variant="subtle">
            Setup Derived Fields
          </Button>
        </Link>
        <Link to="/graphs">
          <Button size="xs" variant="subtle">
            Additional Geo Graphs
          </Button>
        </Link>
      </Group>
      {useGobalFilter && (
        <div className="p-3">
          <EntryFilter showCount></EntryFilter>
          <Button
            className="my-3"
            size="xs"
            onClick={() => {
              entriesQuery.refetch();
            }}
          >
            Reload data
          </Button>
        </div>
      )}
      <div className="overflow-scroll zoom-50 dark:invert dark:hue-rotate-180 p-3 mb-8">
        {entriesQuery.isLoading ? (
          <div>Loading...</div>
        ) : (
          <PivotTableUI
            key={useGobalFilter ? "filtered" : "all"}
            {...pivot}
            data={entriesQuery.data as any}
            onChange={(s) => setPivot(s)}
            renderers={Object.assign({}, TableRenderers, PlotlyRenderers)}
            // derivedAttributes={pivotDeriveRules.reduce<{
            //   [k: string]: (d: any) => string;
            // }>((prev, r) => {
            //   prev[`derived_${r.propertyName}`] = (d) => {
            //     let fn = PIVOT_DERIVE_FUNCTIONS.find((f) => f.name == r.func);
            //     if (!fn) return "Error";
            //     return fn.func(d, r.jsonLogic, r.args);
            //   };
            //   return prev;
            // }, {})}

            //   renderers={PivotTable.renderers}
            //   onChange={(s) => this.setState(s)}
            //   {...this.state}
          />
        )}
      </div>
    </div>
  );
};
