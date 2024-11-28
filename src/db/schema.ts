//import { pgTable, integer, text, timestamp, boolean, doublePrecision, varchar, uniqueIndex, serial, foreignKey, pgEnum } from "drizzle-orm/pg-core"
import { APIStudyReturn } from "@/lib/api";
import { desc, relations, sql } from "drizzle-orm";

import { text, integer, sqliteTable, numeric } from "drizzle-orm/sqlite-core";

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
  custom_fields: text("custom_fields", { mode: "json" }).$type<{
    [id: string]: any;
  }>(),
  firstMeshTerm: text("first_mesh_term"),
  enrollmentCount: integer("enrollment_count"),
  sex: text("sex"),
  phase: text("phase"),
  design_allocation: text("design_allocation"),
  design_intervention_model: text("design_intervention_model"),
  design_masking: text("design_masking"),
  design_observation_model: text("design_observation_model"),
});

export const CustomFieldTable = sqliteTable("CustomField", {
  id: integer("id").primaryKey().notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" })
    .default(new Date())
    .notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" })
    .default(new Date())
    .$onUpdate(() => new Date())
    .notNull(),
  idName: text("id_name").notNull().unique(),
  dataType: text("data_type", {
    enum: ["string", "number", "boolean"],
  }).notNull(),
  label: text("label").notNull(),
  aiDescription: text("ai_description"),
  description: text("description"),
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
  customFieldId: integer("custom_field_id").references(() => CustomFieldTable.id).notNull(),
  entryId: integer("entry_id").references(() => EntryTable.id).notNull(),
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

export const entriesRelation = relations(EntryTable, ({many}) => ({
  customFieldsData: many(CustomFieldEntryTable),
}));

export const customFieldsDataRelation = relations(CustomFieldEntryTable, ({one}) => ({
  entry: one(EntryTable, {
      fields: [CustomFieldEntryTable.entryId],
      references: [EntryTable.id]
  }),
  customFieldDefinition: one(CustomFieldTable, {
      fields: [CustomFieldEntryTable.customFieldId],
      references: [CustomFieldTable.id]
  })
}));


// export const entry = sqliteTable("Entry", {
//   test_field: text("test_field").default("hallo"),
//   id: integer("id").primaryKey().notNull(),
//   createdAt: integer("createdAt", { mode: "timestamp" })
//     .default(sql`CURRENT_TIMESTAMP`)
//     .notNull(),
//   updatedAt: integer("updatedAt", {
//     mode: "timestamp",
//   }).notNull(),
//   nctId: text("NCTId").notNull(),
//   officialTitle: text("OfficialTitle"),
//   briefTitle: text("BriefTitle").notNull(),
//   overallStatus: text("OverallStatus").notNull(),
//   briefSummary: text("BriefSummary").notNull(),
//   designInterventionModel: text("DesignInterventionModel"),
//   leadSponsorName: text("LeadSponsorName"),
//   leadSponsorClass: text("LeadSponsorClass"),
//   gender: text("Gender"),
//   maximumAge: numeric("MaximumAge"),
//   minimumAge: numeric("MinimumAge"),
//   enrollmentCount: integer("EnrollmentCount"),
//   enrollmentType: text("EnrollmentType"),
//   orgClass: text("OrgClass").notNull(),
//   orgFullName: text("OrgFullName").notNull(),
//   designAllocation: text("DesignAllocation"),
//   designInterventionModelDescription: text(
//     "DesignInterventionModelDescription"
//   ),
//   designMasking: text("DesignMasking"),
//   designMaskingDescription: text("DesignMaskingDescription"),
//   designObservationalModel: text("DesignObservationalModel"),
//   designPrimaryPurpose: text("DesignPrimaryPurpose"),
//   designTimePerspective: text("DesignTimePerspective"),
//   detailedDescription: text("DetailedDescription"),
//   startDate: text("StartDate"),
//   primaryCompletionDate: text("PrimaryCompletionDate"),
//   completionDate: text("CompletionDate"),
//   studyFirstPostDate: text("StudyFirstPostDate"),
//   resultsFirstPostDate: text("ResultsFirstPostDate"),
//   lastUpdatePostDate: text("LastUpdatePostDate"),
//   pointOfContactOrganization: text("PointOfContactOrganization"),
//   responsiblePartyInvestigatorAffiliation: text(
//     "ResponsiblePartyInvestigatorAffiliation"
//   ),
//   responsiblePartyInvestigatorFullName: text(
//     "ResponsiblePartyInvestigatorFullName"
//   ),
//   responsiblePartyInvestigatorTitle: text("ResponsiblePartyInvestigatorTitle"),
//   responsiblePartyOldNameTitle: text("ResponsiblePartyOldNameTitle"),
//   responsiblePartyOldOrganization: text("ResponsiblePartyOldOrganization"),
//   responsiblePartyType: text("ResponsiblePartyType"),
//   whyStopped: text("WhyStopped"),
//   studyType: text("StudyType").notNull(),
//   ageCategories: text("AgeCategories", { mode: "json" }).$type<string[]>(),
//   phases: text("Phases", { mode: "json" }).$type<string[]>(),
//   conditions: text("conditions", { mode: "json" }).$type<string[]>(),
//   drugRole: text("drug_role"),
//   legacySearchTerm: text("legacy_search_term"),
//   notes: text("notes"),
//   repurpose: integer("repurpose", { mode: "boolean" }).default(false),
//   usecase: text("usecase"),
//   legacyImportDate: integer("legacy_import_date", {
//     mode: "timestamp",
//   }),
//   referenceCitation: text("ReferenceCitation", { mode: "json" }).$type<
//     string[]
//   >(),
//   publicationStatus: text("publicationStatus", {
//     enum: ["UNKNOWN", "PUBLISHED", "CT_RESULTS", "NO_PUBLICATION_FOUND"],
//   }).notNull(),
//   publicationUrl: text("publicationUrl"),
//   drugName: text("drug_name"),
// });

// export const conditionMeshTermOnEntries = pgTable(
//   "ConditionMeshTermOnEntries",
//   {
//     id: serial("id").primaryKey().notNull(),
//     createdAt: timestamp("createdAt", { precision: 3, mode: "string" })
//       .default(sql`CURRENT_TIMESTAMP`)
//       .notNull(),
//     updatedAt: timestamp("updatedAt", {
//       precision: 3,
//       mode: "string",
//     }).notNull(),
//     meshId: integer("meshId").notNull(),
//     entryId: integer("entryId").notNull(),
//   },
//   (table) => {
//     return {
//       conditionMeshTermOnEntriesEntryIdFkey: foreignKey({
//         columns: [table.entryId],
//         foreignColumns: [entry.id],
//         name: "ConditionMeshTermOnEntries_entryId_fkey",
//       })
//         .onUpdate("cascade")
//         .onDelete("restrict"),
//       conditionMeshTermOnEntriesMeshIdFkey: foreignKey({
//         columns: [table.meshId],
//         foreignColumns: [meshTerm.id],
//         name: "ConditionMeshTermOnEntries_meshId_fkey",
//       })
//         .onUpdate("cascade")
//         .onDelete("restrict"),
//     };
//   }
// );

// export const meshTerm = pgTable("MeshTerm", {
//   id: serial("id").primaryKey().notNull(),
//   createdAt: timestamp("createdAt", { precision: 3, mode: "string" })
//     .default(sql`CURRENT_TIMESTAMP`)
//     .notNull(),
//   updatedAt: timestamp("updatedAt", { precision: 3, mode: "string" }).notNull(),
//   term: text("term").notNull(),
// });

// export const interventionMeshTermOnEntries = pgTable(
//   "InterventionMeshTermOnEntries",
//   {
//     id: serial("id").primaryKey().notNull(),
//     createdAt: timestamp("createdAt", { precision: 3, mode: "string" })
//       .default(sql`CURRENT_TIMESTAMP`)
//       .notNull(),
//     updatedAt: timestamp("updatedAt", {
//       precision: 3,
//       mode: "string",
//     }).notNull(),
//     meshId: integer("meshId").notNull(),
//     entryId: integer("entryId").notNull(),
//     description: text("description"),
//   },
//   (table) => {
//     return {
//       interventionMeshTermOnEntriesEntryIdFkey: foreignKey({
//         columns: [table.entryId],
//         foreignColumns: [entry.id],
//         name: "InterventionMeshTermOnEntries_entryId_fkey",
//       })
//         .onUpdate("cascade")
//         .onDelete("restrict"),
//       interventionMeshTermOnEntriesMeshIdFkey: foreignKey({
//         columns: [table.meshId],
//         foreignColumns: [meshTerm.id],
//         name: "InterventionMeshTermOnEntries_meshId_fkey",
//       })
//         .onUpdate("cascade")
//         .onDelete("restrict"),
//     };
//   }
// );

// export const locationOnEntries = pgTable(
//   "LocationOnEntries",
//   {
//     id: serial("id").primaryKey().notNull(),
//     createdAt: timestamp("createdAt", { precision: 3, mode: "string" })
//       .default(sql`CURRENT_TIMESTAMP`)
//       .notNull(),
//     updatedAt: timestamp("updatedAt", {
//       precision: 3,
//       mode: "string",
//     }).notNull(),
//     locationId: integer("locationId").notNull(),
//     entryId: integer("entryId").notNull(),
//   },
//   (table) => {
//     return {
//       locationOnEntriesEntryIdFkey: foreignKey({
//         columns: [table.entryId],
//         foreignColumns: [entry.id],
//         name: "LocationOnEntries_entryId_fkey",
//       })
//         .onUpdate("cascade")
//         .onDelete("restrict"),
//       locationOnEntriesLocationIdFkey: foreignKey({
//         columns: [table.locationId],
//         foreignColumns: [location.id],
//         name: "LocationOnEntries_locationId_fkey",
//       })
//         .onUpdate("cascade")
//         .onDelete("restrict"),
//     };
//   }
// );

// export const location = pgTable("Location", {
//   id: serial("id").primaryKey().notNull(),
//   createdAt: timestamp("createdAt", { precision: 3, mode: "string" })
//     .default(sql`CURRENT_TIMESTAMP`)
//     .notNull(),
//   updatedAt: timestamp("updatedAt", { precision: 3, mode: "string" }).notNull(),
//   city: text("city").notNull(),
//   country: text("country").notNull(),
//   facility: text("facility"),
// });

// export const aiCache = pgTable(
//   "AICache",
//   {
//     id: serial("id").primaryKey().notNull(),
//     createdAt: timestamp("createdAt", { precision: 3, mode: "string" })
//       .default(sql`CURRENT_TIMESTAMP`)
//       .notNull(),
//     updatedAt: timestamp("updatedAt", {
//       precision: 3,
//       mode: "string",
//     }).notNull(),
//     entryId: integer("entryId").notNull(),
//     input: text("input").notNull(),
//     output: text("output").notNull(),
//     type: text("type").notNull(),
//   },
//   (table) => {
//     return {
//       aiCacheEntryIdFkey: foreignKey({
//         columns: [table.entryId],
//         foreignColumns: [entry.id],
//         name: "AICache_entryId_fkey",
//       })
//         .onUpdate("cascade")
//         .onDelete("restrict"),
//     };
//   }
// );
