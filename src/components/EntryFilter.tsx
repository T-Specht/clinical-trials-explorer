import { EntryTable } from "@/db/schema";
import {
  database,
  getAllFilteredEntries,
  getCustomFields,
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

import { QueryBuilderMantine } from "@react-querybuilder/mantine";

const columns = getTableColumns(EntryTable);

const FILTER_FILEDS = Promise.all(
  getKeys(columns).map(async (k) => {
    let name = columns[k].name;
    let c = columns[k];
    let inputType: InputType = (() => {
      //if (c.columnType == "SQLiteBoolean") return "checkbox";
      if (c.columnType == "SQLiteTimestamp") return "datetime-local";
      if (c.columnType == "SQLiteInteger") return "number";
      return "text";
    })();

    return {
      name: columns[k].name,
      label: name,
      inputType,
      defaultOperator: "contains",
    } satisfies Field;
  })
);

const EntryFilter = (props: { showCount?: boolean }) => {
  // Will be saved debounced
  const [query, setQuery] = useSettingsStore(
    useShallow((s) => [s.filter, s.setFilter])
  );

  // const [query, setQuery] = useState(globalFilter);
  // const debouncedQuery = useDebounce(query, 500);

  // useEffect(() => {
  //   // Save to settingsStore
  //   const d = diff(globalFilter, query);
  //   if (Object.keys(d).length > 0) {
  //     // Only save if it has changed to prevent databse query spam
  //     setGlobalFilter(query);
  //   }
  // }, [debouncedQuery]);

  const { data: fields, isLoading: fieldsLoading } = useQuery({
    queryKey: ["fields"],
    queryFn: async () => {
      //return FILTER_FILEDS;

      return [
        ...(await getCustomFields()).map((c) => {
          const inputTypes = {
            boolean: "text",
            number: "number",
            string: "text",
          };

          return {
            label: c.label,
            name: c.idName,
            inputType:
              inputTypes[c.dataType as keyof typeof inputTypes] || "text",
            defaultOperator: "contains",
          } satisfies Field;
        }),
        ...(await useSettingsStore.getState().pivotDeriveRules).map((r) => {
          return {
            label: "Derived field: " + r.propertyName,
            name: `derived_${r.propertyName}`,
            inputType: "text",
            defaultOperator: "contains",
          } satisfies Field;
        }),
        ...Object.entries(getTableColumns(EntryTable)).map((e) => {
          const [key, c] = e;

          const inputTypes = {
            SQLiteBoolean: "checkbox",
            SQLiteTimestamp: "datetime-local",
            SQLiteInteger: "number",
          };

          return {
            label: c.name,
            name: c.name,
            defaultOperator: "contains",
            inputType:
              inputTypes[c.columnType as keyof typeof inputTypes] || "text",
          } satisfies Field;
        }),
      ];
    },
  });

  const { data, isLoading } = useQuery({
    queryKey: ["filtered_entries_count", query],
    queryFn: async () => {
      return getNumberOfEntriesWithFilter(query);
    },
  });

  if (!fields) return <div>Loading...</div>;

  return (
    <>
      <QueryBuilderMantine>
      <QueryBuilder
        fields={fields}
        query={query}
        onQueryChange={setQuery}
      ></QueryBuilder>
      </QueryBuilderMantine>
      <div>Please note that filters are case sensitive!</div>
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
