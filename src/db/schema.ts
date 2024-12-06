//import { pgTable, integer, text, timestamp, boolean, doublePrecision, varchar, uniqueIndex, serial, foreignKey, pgEnum } from "drizzle-orm/pg-core"
import { APIStudyReturn } from "@/lib/api";
import { LegacyExportEntry } from "@/lib/legacy-import";
import { desc, relations, sql } from "drizzle-orm";

import { text, integer, sqliteTable, numeric } from "drizzle-orm/sqlite-core";

export type EntryHistory =
  | { date: string; desc?: string; type: "legacy"; data: LegacyExportEntry }
  | {
      date: string;
      desc?: string;
      type: "new_version";
      apiQuery?: string;
      data: APIStudyReturn | null;
    };

export const EntryTable = sqliteTable("Entry", {
  id: integer("id").primaryKey().notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" })
    .default(new Date())
    .notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" })
    .default(new Date())
    .$onUpdate(() => new Date())
    .notNull(),
  nctId: text("nct_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  notes: text("notes"),
  rawJson: text("raw_json", { mode: "json" }).$type<APIStudyReturn>(),
  history: text("history", { mode: "json" }).$type<EntryHistory[]>(),
});

export const CustomFieldTable = sqliteTable("CustomField", {
  id: integer("id").primaryKey().notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" })
    .default(sql`CURRENT_TIMESTAMP`)
    .$onUpdate(() => new Date())
    .notNull(),
  idName: text("id_name").notNull().unique(),
  dataType: text("data_type", {
    enum: ["string", "number", "boolean"],
  }).notNull(),
  label: text("label").notNull(),
  aiDescription: text("ai_description"),
  description: text("description"),
  autocompleteEnabled: integer("autocomplete_enabled", { mode: "boolean" })
    .notNull()
    .default(true),
  isDisabled: integer("is_disabled", { mode: "boolean" })
    .notNull()
    .default(false),
});

export const CustomFieldEntryTable = sqliteTable("CustomFieldEntry", {
  id: integer("id").primaryKey().notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" })
    .default(new Date())
    .notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" })
    .default(new Date())
    .$onUpdate(() => new Date())
    .notNull(),
  customFieldId: integer("custom_field_id")
    .references(() => CustomFieldTable.id)
    .notNull(),
  entryId: integer("entry_id")
    .references(() => EntryTable.id)
    .notNull(),
  value: text("value"),
});

export const PersistentZustandTable = sqliteTable("PersistentZustand", {
  id: integer("id").primaryKey().notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" })
    .default(new Date())
    .notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" })
    .default(new Date())
    .$onUpdate(() => new Date())
    .notNull(),
  name: text("name").notNull().unique(),
  data: text("data"),
});

export const entriesRelation = relations(EntryTable, ({ many }) => ({
  customFieldsData: many(CustomFieldEntryTable),
}));

export const customFieldsDataRelation = relations(
  CustomFieldEntryTable,
  ({ one }) => ({
    entry: one(EntryTable, {
      fields: [CustomFieldEntryTable.entryId],
      references: [EntryTable.id],
    }),
    customFieldDefinition: one(CustomFieldTable, {
      fields: [CustomFieldEntryTable.customFieldId],
      references: [CustomFieldTable.id],
    }),
  })
);