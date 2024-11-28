import Container from "@/components/Container";
import EditEntryForm from "@/components/EditEntryForm";
import {
  CustomFieldEntryTable,
  CustomFieldTable,
  EntryTable,
} from "@/db/schema";
import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";

import { QueryBuilder, RuleGroupType, formatQuery } from "react-querybuilder";

import { FIELDS } from "@/lib/fields";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { sql, getTableColumns } from "drizzle-orm";
import { database } from "@/lib/database-wrappers";
import { getKeys, isDev } from "@/lib/utils";
import EntryFilter from "@/components/EntryFilter";
import { Label } from "@/components/ui/label";
import { useSettingsStore } from "@/lib/zustand";
import { useShallow } from "zustand/react/shallow";
import {
  Button,
  SegmentedControl,
  Text,
  TextInput,
  Input,
  Title,
  useMantineColorScheme,
} from "@mantine/core";

export const Route = createFileRoute("/_navbar/settings")({
  component: () => {
    const [
      openAiKey,
      setOpenAiKey,
      openAIModelName,
      setOpenAIModelName,
      setOnboardingComplete,
    ] = useSettingsStore(
      useShallow((s) => [
        s.openAIKey,
        s.setOpenAIKey,
        s.openAIModelName,
        s.setOpenAIModelName,
        s.setOnboardingComplete,
      ])
    );

    const { setColorScheme, clearColorScheme, colorScheme } =
      useMantineColorScheme();

    return (
      <Container className="space-y-4">
        <Title mb="sm">Settings</Title>

        <div>
          <Input.Label>Color Scheme</Input.Label>
          <div>
            <SegmentedControl
              data={["auto", "light", "dark"]}
              onChange={(e) => {
                setColorScheme(e as any);
              }}
              value={colorScheme}
            />
          </div>
        </div>

        <TextInput
          label="Open AI Key"
          type="password"
          placeholder="sk-..."
          value={openAiKey || ""}
          onChange={(e) =>
            setOpenAiKey(e.target.value.trim() == "" ? null : e.target.value)
          }
        ></TextInput>
        <TextInput
          label="Open AI Model Name"
          placeholder="gpt-4o-mini"
          value={openAIModelName || ""}
          onChange={(e) => setOpenAIModelName(e.target.value.trim())}
        ></TextInput>

        <div>
          <Link to="/custom_fields">
            <Button>Custom Field Settings and Creation</Button>
          </Link>
        </div>

        <div>
          <Link to="/welcome">
            <Button>Go to onboarding</Button>
          </Link>
        </div>

        {isDev() && (
          <Button
            onClick={async () => {
              if (
                confirm(
                  "Are you sure you want to clear the database? This cannot be undone."
                )
              ) {
                await database.delete(CustomFieldEntryTable).run();
                await database.delete(EntryTable).run();
                await database.delete(CustomFieldTable).run();
                setOnboardingComplete(false);
              }
            }}
            color="red"
          >
            Remove all data from database
          </Button>
        )}
      </Container>
    );
  },
});
