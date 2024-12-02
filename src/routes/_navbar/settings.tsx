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
  Group,
  Select,
  NumberInput,
  Modal,
  Code,
  Alert,
} from "@mantine/core";
import { DEFAULT_AI_MODELS } from "@/lib/langchain";
import { useStep } from "usehooks-ts";
import { FileWarning } from "lucide-react";

const intialSettings = useSettingsStore.getInitialState();

export const Route = createFileRoute("/_navbar/settings")({
  component: () => {
    // const [
    //   openAiKey,
    //   setOpenAiKey,
    //   openAIModelName,
    //   setOpenAIModelName,
    //   setOnboardingComplete,
    //   aiProvider,
    //   setAiProvider,

    // ] = useSettingsStore(
    //   useShallow((s) => [
    //     s.openAIKey,
    //     s.setOpenAIKey,
    //     s.openAIModelName,
    //     s.setOpenAIModelName,
    //     s.setOnboardingComplete,
    //     s.aiProvider,
    //     s.setAiProvider,
    //   ])
    // );

    const settingsStore = useSettingsStore();

    const [modalState, setModalState] = useState<"closed" | "searxng">(
      "closed"
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

        <Title order={4}>LLM Providers</Title>

        <Group>
          <Select
            data={[
              {
                value: "openai",
                label: "OpenAI",
              },
              {
                value: "anthropic",
                label: "Anthropic",
              },
              {
                value: "disabled",
                label: "Disable AI Features",
              },
            ]}
            value={settingsStore.aiProvider}
            onChange={(e) => settingsStore.setAiProvider((e as any) || "")}
            label="AI Provider"
          ></Select>
          <TextInput
            label="API Key"
            type="password"
            placeholder="sk-..."
            className="flex-1"
            disabled={settingsStore.aiProvider === "disabled"}
            value={settingsStore.openAIKey || ""}
            onChange={(e) =>
              settingsStore.setOpenAIKey(
                e.target.value.trim() == "" ? null : e.target.value
              )
            }
          ></TextInput>
        </Group>
        <TextInput
          label="Model Name"
          placeholder={`${DEFAULT_AI_MODELS[settingsStore.aiProvider]}`}
          description={
            <div>
              The model name to use for AI responses. <br />
              Leave blank to use the default model (OpenAI:{" "}
              {DEFAULT_AI_MODELS.openai}, Anthropic:{" "}
              {DEFAULT_AI_MODELS.anthropic})
            </div>
          }
          disabled={settingsStore.aiProvider == "disabled"}
          value={settingsStore.openAIModelName || ""}
          onChange={(e) =>
            settingsStore.setOpenAIModelName(e.target.value.trim())
          }
        ></TextInput>

        <Group>
          <Title order={4}>SearxNG Settings</Title>
          <Button
            onClick={() => setModalState("searxng")}
            variant="transparent"
            size="xs"
          >
            More information
          </Button>
        </Group>

        <Group>
          <TextInput
            label="SearxNG Instance URL"
            placeholder="https://url.tld/search"
            description={
              <div>
                The URL of the SearxNG instance to use for publication search.
                The instance needs to be configured to support the SearxNG API
                in JSON mode.
              </div>
            }
            value={settingsStore.searxngUrl || ""}
            onChange={(e) => settingsStore.setSearxngUrl(e.target.value.trim())}
          ></TextInput>
          <TextInput
            label="SearxNG Engines"
            placeholder={intialSettings.searxngEngines}
            description={
              <div>
                The engines to use for publication search. Comma separated list
              </div>
            }
            value={settingsStore.searxngEngines || ""}
            onChange={(e) =>
              settingsStore.setSeaxngEngines(e.target.value.trim())
            }
          ></TextInput>
          <NumberInput
            className="flex-shrink"
            label="Max Results Per Engine"
            placeholder={intialSettings.searxngMaxResultsPerEngine.toString()}
            description={
              <div>
                The maximum number of results returned by each engine. Higher
                numbers may slow down the search and increase AI cost
                significantly.
              </div>
            }
            value={settingsStore.searxngMaxResultsPerEngine}
            onChange={(e) => settingsStore.setSearxngMaxResultsPerEngine(+e)}
          ></NumberInput>
        </Group>

        <Title order={4}>Others</Title>

        <div>
          <Group>
            <Link to="/custom_fields">
              <Button>Custom Field Settings and Creation</Button>
            </Link>
            <Link to="/pivot-derived-page">
              <Button>Derived Fields Setup</Button>
            </Link>
          </Group>
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
                settingsStore.setOnboardingComplete(false);
              }
            }}
            color="red"
          >
            Remove all data from database
          </Button>
        )}

        <Modal
          opened={modalState != "closed"}
          onClose={() => setModalState("closed")}
          title="Additional Information"
        >
          {(() => {
            switch (modalState) {
              case "searxng":
                return (
                  <div>
                    <Text>
                      SearxNG is a privacy-respecting search engine aggregator.
                      You can use it to search for publications and other
                      information. You can find more information about SearxNG{" "}
                      <a
                        href="https://searxng.github.io"
                        target="_blank"
                        className="underline"
                      >
                        here
                      </a>
                      .
                    </Text>
                    <Text>
                      You can host an instance of SearxNG yourself using a
                      simple docker compose file. After starting the container,
                      use <Code>http://localhost:8080/search</Code> as the URL.
                    </Text>
                    <Code block>
                      {`
services:
  searxng:
    ports:
      - 8080:8080
    container_name: searxng
    image: docker.io/searxng/searxng:latest
    restart: unless-stopped
    volumes:
      - ./searxng-data:/etc/searxng:rw

`}
                    </Code>
                    <Alert
                      variant="light"
                      color="yellow"
                      title="Common issues"
                      mt="md"
                      icon={<FileWarning></FileWarning>}
                    >
                      You will need to enable JSON mode in the SearxNG
                      settings.yml under <Code>search</Code>:
                      <Code block>{`  formats:
    - html
    - json`}</Code>
                    </Alert>
                  </div>
                );

              default:
                return <div>Unknown state</div>;
            }
          })()}
        </Modal>
      </Container>
    );
  },
});
