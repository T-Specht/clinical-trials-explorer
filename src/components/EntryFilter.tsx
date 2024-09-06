import { EntryTable } from "@/db/schema";
import {
  database,
  getAllFilteredEntries,
  getNumberOfEntriesWithFilter,
} from "@/lib/database-wrappers";
import { getKeys } from "@/lib/utils";
import { useSettingsStore } from "@/lib/zustand";
import { useQuery } from "@tanstack/react-query";
import { getTableColumns, sql } from "drizzle-orm";
import QueryBuilder, {
  Field,
  FlexibleOptionList,
  formatQuery,
  InputType,
  Option,
  OptionGroup,
  ValueEditorType,
  ValueOption,
} from "react-querybuilder";
import { useShallow } from "zustand/react/shallow";
import "react-querybuilder/dist/query-builder.css";
import { useEffect, useState } from "react";
import { useDebounceCallback, useDebounceValue } from "usehooks-ts";
import { useDebounce } from "@uidotdev/usehooks";
import { diff } from "deep-object-diff";

const columns = getTableColumns(EntryTable);

const FILTER_FILEDS = Promise.all(
  getKeys(columns).map(async (k) => {
    let name = columns[k].name;
    let c = columns[k];
    let inputType: InputType = (() => {
      if (c.columnType == "SQLiteBoolean") return "checkbox";
      if (c.columnType == "SQLiteTimestamp") return "datetime-local";
      if (c.columnType == "SQLiteInteger") return "number";
      return "text";
    })();

    // Set filed type to select for these values
    let valueEditorType: ValueEditorType | undefined = (() => {
      if (
        [
          EntryTable.design_masking,
          EntryTable.design_intervention_model,
          EntryTable.design_allocation,
          EntryTable.design_observation_model,
          EntryTable.sex,
        ]
          .map((c) => c.name)
          .includes(name)
      ) {
        return "select";
      }
    })();

    // Get unique values if type is select
    let values: { name: any }[] = [];
    if (valueEditorType == "select") {
      values = await (() => {
        return database
          .selectDistinct({
            name: c,
          })
          .from(EntryTable);
      })();
    }

    return {
      name: columns[k].name,
      label: name,
      inputType,
      valueEditorType,
      defaultOperator: "contains",
      values:
        valueEditorType == "select"
          ? [
              {
                label: "Values",
                options: values.map((v) => ({ name: v.name, label: v.name })),
              },
            ]
          : undefined,
    } satisfies Field;
  })
);

const EntryFilter = (props: { showCount?: boolean }) => {
  // Will be saved debounced
  const [globalFilter, setGlobalFilter] = useSettingsStore(
    useShallow((s) => [s.filter, s.setFilter])
  );

  const [query, setQuery] = useState(globalFilter);
  const debouncedQuery = useDebounce(query, 500);

  useEffect(() => {
    // Save to settingsStore
    const d = diff(globalFilter, query);
    if (Object.keys(d).length > 0) {
      // Only save if it has changed to prevent databse query spam
      setGlobalFilter(query);
    }
  }, [debouncedQuery]);

  const { data: fields, isLoading: fieldsLoading } = useQuery({
    queryKey: ["fields"],
    queryFn: async () => {
      return FILTER_FILEDS;
    },
  });

  const { data, isLoading } = useQuery({
    queryKey: ["filtered_entries_count", debouncedQuery],
    queryFn: async () => {
      return getNumberOfEntriesWithFilter(debouncedQuery);
    },
  });

  if (!fields) return <div>Loading...</div>;

  return (
    <>
      <QueryBuilder
        fields={fields}
        query={query}
        onQueryChange={setQuery}
      ></QueryBuilder>
      {!isLoading && props.showCount && (
        <div>
          Number of database entries matching: <code>{data}</code>
        </div>
      )}

      <div>
        {/* <EditEntryForm
              onSubmit={async (data, form) => {
                console.log(data);
    
                try {
                  await database.insert(EntryTable).values(data);
                  toast.success("Entry created");
                  form.reset({}, { keepValues: false });
                } catch (error) {
                  toast.error("Error creating entry");
                }
              }}
            ></EditEntryForm> */}
      </div>
    </>
  );
};

export default EntryFilter;
