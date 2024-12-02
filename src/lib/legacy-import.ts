import {
  CustomFieldEntryTable,
  CustomFieldTable,
  EntryTable,
} from "@/db/schema";
import { database, insertStudiesIntoDatabase } from "./database-wrappers";
import { getSingleStudyByNCTId, getStudiesByNCTIds } from "./api";
import { eq } from "drizzle-orm";

export type LegacyExportEntry = {
  id: number;
  createdAt: string;
  updatedAt: string;
  NCTId: string;
  OfficialTitle?: string;
  BriefTitle: string;
  OverallStatus: string;
  BriefSummary: string;
  DesignInterventionModel?: string;
  LeadSponsorName: string;
  LeadSponsorClass: string;
  Gender?: string;
  MaximumAge?: number;
  MinimumAge?: number;
  EnrollmentCount?: number;
  EnrollmentType?: string;
  OrgClass: string;
  OrgFullName: string;
  DesignAllocation?: string;
  DesignInterventionModelDescription?: string;
  DesignMasking?: string;
  DesignMaskingDescription?: string;
  DesignObservationalModel?: string;
  DesignPrimaryPurpose?: string;
  DesignTimePerspective?: string;
  DetailedDescription?: string;
  StartDate?: string;
  PrimaryCompletionDate?: string;
  CompletionDate?: string;
  StudyFirstPostDate: string;
  ResultsFirstPostDate?: string;
  LastUpdatePostDate: string;
  PointOfContactOrganization?: string;
  ResponsiblePartyInvestigatorAffiliation?: string;
  ResponsiblePartyInvestigatorFullName?: string;
  ResponsiblePartyInvestigatorTitle?: string;
  ResponsiblePartyOldNameTitle?: string;
  ResponsiblePartyOldOrganization?: string;
  ResponsiblePartyType?: string;
  WhyStopped?: string;
  StudyType: string;
  AgeCategories: Array<string>;
  Phases: Array<string>;
  conditions: Array<string>;
  ReferenceCitation: Array<string>;
  drug_name?: string;
  drug_role?: string;
  legacy_search_term: string;
  usecase?: string;
  repurpose: boolean;
  legacy_import_date?: string;
  notes?: string;
  publicationStatus: string;
  publicationUrl?: string;
  [additionalKey: string]: unknown;
};

export const LEGACY_DEFAULT_KEYS = [
  "id",
  "createdAt",
  "updatedAt",
  "NCTId",
  "OfficialTitle",
  "BriefTitle",
  "OverallStatus",
  "BriefSummary",
  "DesignInterventionModel",
  "LeadSponsorName",
  "LeadSponsorClass",
  "Gender",
  "MaximumAge",
  "MinimumAge",
  "EnrollmentCount",
  "EnrollmentType",
  "OrgClass",
  "OrgFullName",
  "DesignAllocation",
  "DesignInterventionModelDescription",
  "DesignMasking",
  "DesignMaskingDescription",
  "DesignObservationalModel",
  "DesignPrimaryPurpose",
  "DesignTimePerspective",
  "DetailedDescription",
  "StartDate",
  "PrimaryCompletionDate",
  "CompletionDate",
  "StudyFirstPostDate",
  "ResultsFirstPostDate",
  "LastUpdatePostDate",
  "PointOfContactOrganization",
  "ResponsiblePartyInvestigatorAffiliation",
  "ResponsiblePartyInvestigatorFullName",
  "ResponsiblePartyInvestigatorTitle",
  "ResponsiblePartyOldNameTitle",
  "ResponsiblePartyOldOrganization",
  "ResponsiblePartyType",
  "WhyStopped",
  "StudyType",
  "AgeCategories",
  "Phases",
  "conditions",
  "ReferenceCitation",
  "drug_name",
  "drug_role",
  "legacy_search_term",
  "usecase",
  "repurpose",
  "legacy_import_date",
  "notes",
  "publicationStatus",
  "publicationUrl",
];

export const AWLAYS_CREATE_CUSTOM_FILEDS: (typeof CustomFieldTable.$inferInsert)[] =
  [
    {
      dataType: "string",
      idName: "drug_name",
      label: "Drug Name",
      description: "Name of the drug",
    },
    {
      dataType: "string",
      idName: "drug_role",
      label: "Drug Role",
      description: "Role of the drug",
    },
    {
      idName: "usecase",
      dataType: "string",
      label: "Usecase of drug",
      aiDescription:
        "the indication/use case/condition treated with the cetirizine in the study. Maximum of 3 words! Whenever possible the usecase should correspond to the study title condition.",
      description: "Usecase",
    },
    {
      idName: "is_repurpose",
      dataType: "boolean",
      label: "Repurpose",
      aiDescription:
        "Is the H1 receptor antagonist being used, tested, or evaluated in this study for any indications outside of its typical use in treating allergies, allergic rhinitis, or urticaria?\n\nIf unsure, respond with “true.”\n\nNote: Drug repurposing (or repositioning) refers to using existing drugs for new therapeutic purposes beyond their conventional indications.",
      description: "Whether the study could be repurposing",
    },
    // {
    //   idName: "conditions",
    //   dataType: "string",
    //   label: "Conditions",
    //   description: "Conditions treated with the drug researched",
    // },
    {
      dataType: "string",
      idName: "legacy_search_term",
      label: "Legacy Search Term",
      description: "Search term used in legacy system",
      isDisabled: true,
    },
    {
      dataType: "string",
      idName: "publicationStatus",
      label: "Publication Status",
      description: "Publication status of the study",
    },
    {
      dataType: "string",
      idName: "publicationUrl",
      label: "Publication URL",
      description: "URL to the publication",
    },
    {
      dataType: "string",
      idName: "legacy_import_date",
      label: "Legacy Import Date",
      description: "Date when the study was imported",
      isDisabled: true,
    },
    {
      dataType: "string",
      idName: "last_update_ctg_legacy",
      label: "Last Update",
      description: "Last Update in the legacy system for the study",
      isDisabled: true,
    },
    {
      dataType: "boolean",
      idName: "has_changed",
      label: "Has changed since last import",
      description: "Has the study changed since the last import",
      isDisabled: true,
    },
  ];

export const extractCustomFields = (entries: LegacyExportEntry[]) => {
  let customFields = new Set<string>();

  entries.forEach((e) => {
    Object.keys(e).forEach((key) => {
      if (!LEGACY_DEFAULT_KEYS.includes(key)) {
        customFields.add(key);
      }
    });
  });

  return Array.from(customFields);
};

export const createCustomFieldsInDatabase = (additionalKeys: string[]) => {
  let additionalFields: (typeof CustomFieldTable.$inferInsert)[] =
    additionalKeys.map((k) => {
      return {
        idName: k,
        dataType: "string",
        label: k,
      };
    });

  //console.log(additionalFields);

  return database
    .insert(CustomFieldTable)
    .values([...AWLAYS_CREATE_CUSTOM_FILEDS, ...additionalFields])
    .run();
};

export const importLegacyData = async (entries: LegacyExportEntry[]) => {
  const additionalKeys = extractCustomFields(entries);

  let currentOnlineData = await getStudiesByNCTIds(entries.map((e) => e.NCTId));

  let customFields = await database.query.CustomFieldTable.findMany();

  function getCustomFieldIdByName(name: string) {
    let field = customFields.find((f) => f.idName === name);
    return field?.id!;
  }

  for (const le of entries) {
    let curr = currentOnlineData.find(
      (d) => d.identificationModule?.nctId === le.NCTId
    );

    if (curr) {
      let lastUpdateCurrent = curr.statusModule?.lastUpdatePostDateStruct?.date;
      let hasUpdate = lastUpdateCurrent !== le.LastUpdatePostDate;

      //   if (hasUpdate) {
      //     console.log(le.NCTId, lastUpdateCurrent, le.LastUpdatePostDate);
      //   }

      // Insert then get

      await insertStudiesIntoDatabase([curr], undefined, undefined, {
        date: new Date().toISOString(),
        type: "legacy",
        data: le,
        desc: "Legacy import",
      });
      const dbId = (
        await database.query.EntryTable.findFirst({
          where: (table, { eq }) => eq(table.nctId, le.NCTId),
          columns: {
            id: true,
          },
        })
      )?.id!;

      await database
        .update(EntryTable)
        .set({
          notes: le.notes,
        })
        .where(eq(EntryTable.id, dbId));

      // Insert custom fields
      try {
        await database.insert(CustomFieldEntryTable).values([
          {
            customFieldId: getCustomFieldIdByName("is_repurpose"),
            entryId: dbId,
            value: le.repurpose ? "true" : "false",
          },
          {
            customFieldId: getCustomFieldIdByName("legacy_search_term"),
            entryId: dbId,
            value: le.legacy_search_term,
          },
          {
            customFieldId: getCustomFieldIdByName("legacy_import_date"),
            entryId: dbId,
            value: le.legacy_import_date,
          },
          {
            customFieldId: getCustomFieldIdByName("publicationStatus"),
            entryId: dbId,
            value: le.publicationStatus,
          },
          {
            customFieldId: getCustomFieldIdByName("publicationUrl"),
            entryId: dbId,
            value: le.publicationUrl,
          },
          {
            customFieldId: getCustomFieldIdByName("last_update_ctg_legacy"),
            entryId: dbId,
            value: le.LastUpdatePostDate,
          },
          {
            customFieldId: getCustomFieldIdByName("has_changed"),
            entryId: dbId,
            value: hasUpdate ? "true" : "false",
          },
          {
            customFieldId: getCustomFieldIdByName("drug_name"),
            entryId: dbId,
            value: le.drug_name,
          },
          {
            customFieldId: getCustomFieldIdByName("drug_role"),
            entryId: dbId,
            value: le.drug_role,
          },
          {
            customFieldId: getCustomFieldIdByName("usecase"),
            entryId: dbId,
            value: le.usecase,
          },
          // {
          //   customFieldId: getCustomFieldIdByName("conditions"),
          //   entryId: dbId,
          //   value: le.conditions.join(", "),
          // },
          ...additionalKeys.map((k) => {
            return {
              customFieldId: getCustomFieldIdByName(k),
              entryId: dbId,
              value: le[k] === null ? null : String(le[k]),
            };
          }),
        ]);
      } catch (error) {
        console.error(
          error,
          le,
          additionalKeys.map((k) => ({ key: k, value: le[k] }))
        );
      }
      //console.log(dbId);
    } else {
      // Handle this!
      alert(`Study with NCTId ${le.NCTId} not found in the online database`);
    }
  }
};
