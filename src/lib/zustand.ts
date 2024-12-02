import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { JUMP_POINT_OPTIONS } from "./constants";
import { persist, createJSONStorage, StateStorage } from "zustand/middleware";
import { database } from "@/lib/database-wrappers";
import { PersistentZustandTable } from "@/db/schema";
import { eq } from "drizzle-orm";
//import superjson from "superjson";
import { getZustandItem } from "./database-wrappers";
import { RuleGroupType } from "react-querybuilder";
import { PivotConfigSave } from "@/routes/_navbar/pivottable";
import { PivotDeriveRule, DEFAULT_DERIVED_RULES } from "./pivot-derive";

// Store Data in Database
const storage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    //console.log(name, "has been retrieved");
    let item = await getZustandItem(name);

    return item || null;
  },
  setItem: async (name: string, value: string): Promise<void> => {
    //console.log(name, "with value", value, "has been saved");

    // check if exists

    let updateRes = await database
      .update(PersistentZustandTable)
      .set({ data: value })
      .where(eq(PersistentZustandTable.name, name))
      .returning({
        id: PersistentZustandTable.id,
      });

    // if not exists, insert
    if (updateRes.length === 0) {
      await database
        .insert(PersistentZustandTable)
        .values({ name, data: value });
    }
  },
  removeItem: async (name: string): Promise<void> => {
    //console.log(name, "has been deleted");
    await database
      .delete(PersistentZustandTable)
      .where(eq(PersistentZustandTable.name, name));
  },
};

export type AIProviders = "openai" | "anthropic" | "disabled";

type SettingsStore = {
  jumpPoint: string;
  setJumpPoint: (value: string) => void;
  filter: RuleGroupType;
  setFilter: (filter: RuleGroupType) => void;
  openAIKey: string | null;
  setOpenAIKey: (value: string | null) => void;
  openAIModelName: string;
  setOpenAIModelName: (value: string) => void;
  aiProvider: AIProviders;
  setAiProvider: (value: AIProviders) => void;
  onboardingComplete: boolean;
  setOnboardingComplete: (value: boolean) => void;
  savedPivotConfigs: { name: string; config: PivotConfigSave }[];
  setSavedPivotConfigs: (
    value: { name: string; config: PivotConfigSave }[]
  ) => void;
  pivotDeriveRules: PivotDeriveRule[];
  setPivotDeriveRules: (value: PivotDeriveRule[]) => void;
  searxngUrl: string;
  setSearxngUrl: (value: string) => void;
  searxngEngines: string;
  setSeaxngEngines: (value: string) => void;
  searxngMaxResultsPerEngine: number;
  setSearxngMaxResultsPerEngine: (value: number) => void;
};

export const useSettingsStore = create<SettingsStore>()(
  persist(
    immer((set) => ({
      jumpPoint: JUMP_POINT_OPTIONS[0],
      setJumpPoint: (value) =>
        set((state) => {
          state.jumpPoint = value;
        }),
      filter: {
        combinator: "and",
        rules: [],
      },
      searxngMaxResultsPerEngine: 3,
      setSearxngMaxResultsPerEngine: (value) =>
        set((state) => {
          state.searxngMaxResultsPerEngine = value;
        }),
      searxngEngines:
        "pubmed,semantic scholar,openairepublications,google_scholar",
      setSeaxngEngines: (value) =>
        set((state) => {
          state.searxngEngines = value;
        }),
      searxngUrl: "",
      setSearxngUrl: (value) =>
        set((state) => {
          state.searxngUrl = value;
        }),
      aiProvider: "disabled",
      setAiProvider: (value) =>
        set((state) => {
          state.aiProvider = value;
        }),
      setFilter: (newFilter) =>
        set((state) => {
          state.filter = newFilter;
        }),
      openAIKey: null,
      setOpenAIKey: (value) =>
        set((state) => {
          state.openAIKey = value;
        }),
      openAIModelName: "", // Blank to use default
      setOpenAIModelName: (value) =>
        set((state) => {
          state.openAIModelName = value;
        }),
      onboardingComplete: false,
      setOnboardingComplete: (value) =>
        set((state) => {
          state.onboardingComplete = value;
        }),
      savedPivotConfigs: [],
      setSavedPivotConfigs: (value) =>
        set((state) => {
          state.savedPivotConfigs = value;
        }),
      pivotDeriveRules: DEFAULT_DERIVED_RULES,
      setPivotDeriveRules: (value) =>
        set((state) => {
          state.pivotDeriveRules = value;
        }),
    })),
    {
      name: "settings",
      storage: createJSONStorage(() => storage),
    }
  )
);
