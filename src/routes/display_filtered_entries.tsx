import Entry from "@/components/entry/Entry";
import EntryMenu from "@/components/entry/EntryMenu";
import { EntryTable } from "@/db/schema";
import {
  getAllEntries,
  getAllFilteredEntries,
  getCustomFields,
  getEntry,
  getListOfEntryIds,
} from "@/lib/database-wrappers";
import { clamp } from "@/lib/utils";
import { useSettingsStore } from "@/lib/zustand";
import { useQueries, useQuery } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { useIsFirstRender, useLocalStorage } from "@uidotdev/usehooks";
import { eq } from "drizzle-orm";
import { useEffect, useState } from "react";
import useKeyboardShortcut from "use-keyboard-shortcut";
import { useShallow } from "zustand/react/shallow";

export const Route = createFileRoute("/display_filtered_entries")({
  component: () => <Component />,
});

const Component = () => {
  // let { e, nextId, prevId, customFields, allEntries } = Route.useLoaderData();
  const filter = useSettingsStore((s) => s.filter);

  const [entries, customFields] = useQueries({
    queries: [
      {
        queryKey: ["filtered_entries", filter],
        queryFn: () => getAllFilteredEntries(filter),
      },
      {
        queryKey: ["custom_fields"],
        queryFn: () => getCustomFields(),
      },
    ],
  });

  const [currentIndex, setCurrentIndex] = useLocalStorage("current_index", 0);

  useEffect(() => {
    if (entries.data && currentIndex >= entries.data.length) {
      setCurrentIndex(0);
      console.log("resetting current index because it was out of bounds");
    }
  }, [currentIndex, entries.data]);

  const [jumpPoint, setJumpPoint] = useSettingsStore(
    useShallow((s) => [s.jumpPoint, s.setJumpPoint])
  );
  const current = entries.data?.at(currentIndex);
  const maxLen = entries.data?.length || 0;

  const next = () => setCurrentIndex(clamp(currentIndex + 1, 0, maxLen - 1));
  const prev = () => setCurrentIndex(clamp(currentIndex - 1, 0, maxLen - 1));

  useKeyboardShortcut(["Shift", "ArrowRight"], () => next(), {
    overrideSystem: true,
    ignoreInputFields: true,
    repeatOnHold: false,
  });
  useKeyboardShortcut(["Shift", "ArrowLeft"], () => prev(), {
    overrideSystem: true,
    ignoreInputFields: true,
    repeatOnHold: false,
  });

  return (
    <div className="flex flex-col max-h-screen h-screen">
      <EntryMenu
        jumpPoint={jumpPoint}
        currentIndex={currentIndex + 1}
        maxLength={entries.data?.length || 0}
        onCurrentChange={(i) => {
          if (isNaN(i)) return;
          setCurrentIndex(clamp(i - 1, 0, maxLen - 1));
        }}
        onNext={next}
        onPrev={prev}
        setJumpPoint={setJumpPoint}
      ></EntryMenu>
      {!!current && !!customFields.data ? (
        <Entry
          className="flex-1 h-0"
          entry={current}
          customFields={customFields.data}
          key={current.id}
        ></Entry>
      ) : (
        <div>Loading</div>
      )}
    </div>
  );
};
