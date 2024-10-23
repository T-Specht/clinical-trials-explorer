import { EntryTable, CustomFieldTable } from "@/db/schema";
import { z } from "zod";

export type UIFieldType = {
  key: keyof typeof EntryTable.$inferInsert;
  label: string;
  description?: string;
  isDisabled?: boolean;
};

export const CUSTOM_FIELDS_SEED: (typeof CustomFieldTable.$inferInsert)[] = [
  {
    id: 1,
    idName: "usecase",
    dataType: "string",
    label: "Usecase of drug",
    aiDescription:
      "the indication/use case/condition treated with the cetirizine in the study. Maximum of 3 words! Whenever possible the usecase should correspond to the study title condition.",
    description: "Usecase",
    isDisabled: false,
  },
  {
    id: 2,
    idName: "is_repurpose",
    dataType: "boolean",
    label: "Repurpose",
    aiDescription:
      "Is the H1 receptor antagonist being used, tested, or evaluated in this study for any indications outside of its typical use in treating allergies, allergic rhinitis, or urticaria?\n\nIf unsure, respond with “true.”\n\nNote: Drug repurposing (or repositioning) refers to using existing drugs for new therapeutic purposes beyond their conventional indications.",
    description: "Whether the study could be repurposing",
    isDisabled: false,
  },
  {
    id: 3,
    idName: "h1ra",
    dataType: "string",
    label: "H1Ra",
    aiDescription:
      "the name of the H1 receptor antagonists / antihistamine if there was one that was looked at primarily. Possible options are cetirizine, levocetirizine, loratadine, desloratadine, fexofenadine or a combination of these. If non of these can be chosen, output 'No h1ra'. If multiple apply, list them by using |, e.g. cetirizine|loratadiine",
    description: "",
    isDisabled: false,
  },
];

export const FIELDS: UIFieldType[] = [
  {
    key: "design_masking",
    label: "Design Masking",
    isDisabled: true,
    description: "This field is disabled",
  },
  {
    key: "design_observation_model",
    label: "Design Observation Model",
  },
  {
    key: "enrollmentCount",
    label: "Enrollment Count",
  },
  {
    key: "sex",
    label: "Sex of people",
  },
];

export const buildAiReturnSchemaForCustomFields = (
  customFields: (typeof CustomFieldTable.$inferSelect)[]
) => {
  let schema = z.object(
    Object.fromEntries(
      customFields.map((f) => {
        const key = f.idName;
        const types = {
          string: z.string(),
          number: z.number(),
          boolean: z.boolean(),
        };
        const type = types[f.dataType];

        return [
          key,
          z.object({
            value: type.describe(f.aiDescription || f.description || ""),
            explanation: z
              .string()
              .describe("shortly describe why you picked this value"),
          }),
        ];
      })
    )
  );

  return schema;
};
