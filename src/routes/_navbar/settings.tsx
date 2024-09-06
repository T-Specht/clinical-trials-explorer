import Container from "@/components/Container";
import EditEntryForm from "@/components/EditEntryForm";
import { EntryTable } from "@/db/schema";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";

import { QueryBuilder, RuleGroupType, formatQuery } from "react-querybuilder";

import { FIELDS } from "@/lib/fields";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { sql, getTableColumns } from "drizzle-orm";
import { database } from "@/lib/database-wrappers";
import { getKeys } from "@/lib/utils";
import EntryFilter from "@/components/EntryFilter";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSettingsStore } from "@/lib/zustand";
import { useShallow } from "zustand/react/shallow";

export const Route = createFileRoute("/_navbar/settings")({
  component: () => {
    const [openAiKey, setOpenAiKey] = useSettingsStore(
      useShallow((s) => [s.openAIKey, s.setOpenAIKey])
    );
    return (
      <Container>
        <div>
          <Label>Open AI Key</Label>
          <Input
            type="password"
            placeholder="sk-..."
            value={openAiKey || ""}
            onChange={(e) =>
              setOpenAiKey(e.target.value.trim() == "" ? null : e.target.value)
            }
          ></Input>
        </div>
      </Container>
    );
  },
});
