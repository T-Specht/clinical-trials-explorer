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

  return flat;
};

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
  //console.log(query);
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
  return database.insert(CustomFieldTable).values(data).onConflictDoUpdate({
    target: CustomFieldTable.id,
    set: data,
  });
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
  progressCallback?: (p: number) => any
) => {
  for (const [i, study] of studies.entries()) {
    const idm = study.identificationModule;
    const insertSchema = createInsertSchema(EntryTable);

    const potentialInsert = {
      description: study.descriptionModule?.briefSummary,
      nctId: idm?.nctId,
      title: idm?.briefTitle || idm?.officialTitle,
      firstMeshTerm: study.interventionBrowseModule?.meshes?.at(0)?.term || "",
      enrollmentCount: study.designModule?.enrollmentInfo?.count,
      design_allocation: study.designModule?.designInfo?.allocation,
      design_intervention_model:
        study.designModule?.designInfo?.interventionModel,
      design_masking: study.designModule?.designInfo?.maskingInfo?.masking,
      design_observation_model:
        study.designModule?.designInfo?.observationalModel,
      phase: study.designModule?.phases?.at(0),
      sex: study.eligibilityModule?.sex,
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
