import {
  CustomFieldTable,
  EntryTable,
  CustomFieldEntryTable,
} from "@/db/schema";
import {
  and,
  count,
  DefaultLogger,
  eq,
  getTableColumns,
  LogWriter,
  sql,
} from "drizzle-orm";
import { APIStudyReturn } from "./api";
import { createInsertSchema } from "drizzle-zod";
import * as schema from "@/db/schema";

import { drizzle } from "drizzle-orm/sqlite-proxy";
import {
  defaultValueProcessorByRule,
  formatQuery,
  RuleGroupType,
  RuleProcessor,
  ValueProcessorByRule,
} from "react-querybuilder";
import { getKeys } from "./utils";
import jsonLogic from "json-logic-js";
import { useSettingsStore } from "./zustand";
import { PIVOT_DERIVE_FUNCTIONS } from "./pivot-derive";

class MyLogWriter implements LogWriter {
  write(message: string) {
    // console.group("database log");
    // console.log(message);
    // console.groupEnd();
  }
}

const logger = new DefaultLogger({ writer: new MyLogWriter() });

export const database = drizzle(
  async (...args) => {
    try {
      const result = await window.bridge.db_execute(...args);
      return { rows: result };
    } catch (e: any) {
      console.error("Error from sqlite proxy server: ", e.response.data);
      return { rows: [] };
    }
  },
  {
    schema: schema,
    logger: logger,
  }
);

export const getListOfEntryIds = async () => {
  return database
    .select({
      id: EntryTable.id,
    })
    .from(EntryTable);
};

export const getAllEntries = async () => {
  let res = await database.query.EntryTable.findMany({
    columns: {
      history: false,
    },
    with: {
      customFieldsData: {
        with: {
          customFieldDefinition: true,
        },
      },
    },
  });

  return res;
};

export const getAllEntriesWithFlatCustomFields = async () => {
  const allEntries = await getAllEntries();

  const flat = allEntries.map((e) => ({
    ...e,
    ...e.customFieldsData.reduce(
      (acc, c) => ({ ...acc, [c.customFieldDefinition.idName]: c.value }),
      {}
    ),
  }));

  // Add derived fields

  const derivedFields = useSettingsStore.getState().pivotDeriveRules;

  for (let entry of flat) {
    for (let r of derivedFields) {
      let fn = PIVOT_DERIVE_FUNCTIONS.find((f) => f.name == r.func);
      if (fn) {
        // Entry is augmented with derived fields, they are prefixed with `derived_` and will not be used in the code. Only for user
        (entry as any)[`derived_${r.propertyName}`] = fn.func(
          entry,
          r.jsonLogic,
          r.args
        );
      }
    }
  }

  return flat;
};

export type SingleEntryReturnedByDBWrapper = Awaited<
  ReturnType<typeof getAllEntriesWithFlatCustomFields>
>[number];

const customFormatQueryFilter = (filter: RuleGroupType) => {
  let columns = Object.values(getTableColumns(EntryTable));
  const dateColumnsNames = columns
    .filter((c) => c.dataType == "date")
    .map((c) => c.name);

  // Format Date Columns to match SQLITE format
  const customValueProcessor: ValueProcessorByRule = (rule, options) => {
    if (dateColumnsNames.includes(rule.field)) {
      return new Date(rule.value).getTime().toString();
    }

    return defaultValueProcessorByRule(rule, options);
  };

  const sqlQuery = formatQuery(filter, {
    format: "sql",
    valueProcessor: customValueProcessor,
  });

  return sqlQuery;
};

export const getAllFilteredEntries = async (filter: RuleGroupType) => {
  let query = formatQuery(filter, "jsonlogic");

  console.log(query);
  const flat = await getAllEntriesWithFlatCustomFields();

  if (query) {
    return flat.filter((e) => jsonLogic.apply(query, e));
  } else {
    return flat;
  }

  // const sqlQuery = customFormatQueryFilter(filter);
  // return database
  //   .select()
  //   .from(EntryTable)
  //   .where(sql`${sql.raw(sqlQuery)}`);
};

export const getNumberOfEntriesWithFilter = async (filter: RuleGroupType) => {
  // const sqlQuery = customFormatQueryFilter(filter);
  // let r = await database
  //   .select({
  //     count: count(),
  //   })
  //   .from(EntryTable)
  //   .where(sql`${sql.raw(sqlQuery)}`);
  // return r[0].count;

  // Todo: Optimize this

  let all = await getAllFilteredEntries(filter);
  return all.length;
};

export const getZustandItem = async (name: string) => {
  let data = await database.query.PersistentZustandTable.findFirst({
    where: (table) => eq(table.name, name),
  });
  return data?.data;
};

export const getCustomFields = async () => {
  return database.select().from(CustomFieldTable);
};

export const upsertCustomField = async (
  data: typeof CustomFieldTable.$inferInsert
) => {
  // Enable in view

  let res = await database
    .insert(CustomFieldTable)
    .values(data)
    .onConflictDoUpdate({
      target: CustomFieldTable.id,
      set: data,
    })
    .returning();

  // Add to view if custom field is just created
  let state = useSettingsStore.getState();
  if (!data.id) {
    state.setEntryViewConfig([
      {
        hidden: false,
        type: "custom_field",
        propertyNameOrId: res[0].id.toString(),
      },
      ...state.entryViewConfig,
    ]);
  }

  return res;
};

export const deleteCustomField = async (id: number) => {
  return database.delete(CustomFieldTable).where(eq(CustomFieldTable.id, id));
};

export const getEntriesForSelection = async () => {
  return database
    .select({
      id: EntryTable.id,
      title: EntryTable.title,
    })
    .from(EntryTable);
};

export const updateEntryFields = async (
  id: number,
  fields: Partial<typeof EntryTable.$inferInsert>
) => {
  return database.update(EntryTable).set(fields).where(eq(EntryTable.id, id));
};

export const insertCustomFieldData = async (
  fields: typeof CustomFieldEntryTable.$inferInsert
) => {
  return database
    .insert(CustomFieldEntryTable)
    .values({ ...fields, id: undefined })
    .returning();
};

export const updateCustomFieldData = async (
  id: number,
  fields: Partial<typeof CustomFieldEntryTable.$inferInsert>
) => {
  return database
    .update(CustomFieldEntryTable)
    .set(fields)
    .where(eq(CustomFieldEntryTable.id, id));
};

export const getEntry = async (id: number) => {
  return (
    await database
      .select()
      .from(EntryTable)
      .where(eq(EntryTable.id, id))
      .limit(1)
  ).at(0);
};

export const getNumberOfEntries = async () => {
  let r = await database
    .select({
      count: count(),
    })
    .from(EntryTable);
  return r[0].count;
};

export const insertStudiesIntoDatabase = async (
  studies: APIStudyReturn[],
  errorCallback?: (e: string) => any,
  progressCallback?: (p: number) => any,
  history?: schema.EntryHistory
) => {
  for (const [i, study] of studies.entries()) {
    const idm = study.identificationModule;
    const insertSchema = createInsertSchema(EntryTable);

    const potentialInsert = {
      description: study.descriptionModule?.briefSummary,
      nctId: idm?.nctId,
      title: idm?.briefTitle || idm?.officialTitle,
      history: history ? [history] : [],
    } satisfies Partial<typeof EntryTable.$inferInsert>;

    let validation = insertSchema.safeParse(potentialInsert);

    if (validation.success) {
      await database.insert(EntryTable).values({
        rawJson: study,
        ...(validation.data as any),
      });
      //toast.success(`Successfully inserted study ${validation.data.nctId}`);
      progressCallback?.(i / studies.length);
    } else {
      errorCallback?.(
        `Error inserting study ${idm?.nctId}: ${validation.error.errors}`
      );
    }
  }
};
