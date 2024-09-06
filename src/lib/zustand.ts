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

type SettingsStore = {
  jumpPoint: string;
  setJumpPoint: (value: string) => void;
  filter: RuleGroupType;
  setFilter: (filter: RuleGroupType) => void;
  openAIKey: string | null;
  setOpenAIKey: (value: string | null) => void;
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
      setFilter: (newFilter) =>
        set((state) => {
          state.filter = newFilter;
        }),
      openAIKey: null,
      setOpenAIKey: (value) =>
        set((state) => {
          state.openAIKey = value;
        }),
    })),
    {
      name: "settings",
      storage: createJSONStorage(() => storage),
    }
  )
);
