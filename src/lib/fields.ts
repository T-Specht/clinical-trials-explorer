import { EntryTable, CustomFieldTable } from "@/db/schema";

export type UIFieldType = {
  key: keyof typeof EntryTable.$inferInsert;
  label: string;
  description?: string;
  isDisabled?: boolean;
};

export type CustomUIFieldType = Omit<UIFieldType, "key"> & {
  id: string;
  dataType: "string" | "number" | "boolean";
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
      "true if the h1 receptor antagonist is used, tested or evaluated for other indications than their normal one of allergy, all forms of allergic rhinitis or urticaria in this study. If in doubt, answer with true.\n\nDefinition of drug repurposing: Drug repositioning (also called drug repurposing) involves the investigation of existing drugs for new therapeutic purposes other than their normal use cases.",
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
    key: "isRepurpose",
    label: "Is Repurpose",
  },
  {
    key: "sex",
    label: "Sex of people",
  },
];
