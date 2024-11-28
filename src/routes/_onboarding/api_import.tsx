import Container from "@/components/Container";

import {
  CustomFieldEntryTable,
  CustomFieldTable,
  EntryTable,
} from "@/db/schema";
import {
  ctgApiClient,
  getNumberOfStudiesForQuery,
  getStudies,
} from "@/lib/api";
import { database, insertStudiesIntoDatabase } from "@/lib/database-wrappers";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";

import { createFileRoute, Link } from "@tanstack/react-router";
import { createInsertSchema } from "drizzle-zod";
import { useEffect, useState } from "react";

import { useForm, SubmitHandler, useWatch } from "react-hook-form";

import { useDebounceValue } from "usehooks-ts";
import { z } from "zod";

import { defineStepper } from "@stepperize/react";
import { cn } from "@/lib/utils";
import { CUSTOM_FIELDS_SEED } from "@/lib/fields";
import { notifications } from "@mantine/notifications";
import {
  Alert,
  Button,
  Progress,
  Stepper,
  TextInput,
  Title,
  Group,
  Code,
  Card,
  Paper,
  Table,
  ActionIcon,
} from "@mantine/core";
import { Check, CircleAlertIcon, Plus, SquarePlus } from "lucide-react";
import { useSettingsStore } from "@/lib/zustand";
import { useShallow } from "zustand/react/shallow";

const schema = z.object({
  query: z.string(),
});

type FormInputs = z.infer<typeof schema>;

const CustomFieldCreationRow = (props: {
  field: (typeof CUSTOM_FIELDS_SEED)[0];
}) => {
  const f = props.field;

  const { mutate, isSuccess, isPending } = useMutation({
    mutationFn: () => {
      return database.insert(CustomFieldTable).values(f).run();
    },
    onError: (e) => {
      notifications.show({
        message:
          "Could not create field. This is most likely because it already exists.",
        color: "red",
      });
    },
  });
  return (
    <Table.Tr key={f.idName}>
      <Table.Td>{f.idName}</Table.Td>
      <Table.Td>{f.label}</Table.Td>
      <Table.Td>{f.description}</Table.Td>
      <Table.Td>
        <ActionIcon
          disabled={isPending || isSuccess}
          loading={isPending}
          variant="default"
          onClick={() => {
            mutate();
          }}
        >
          {isSuccess ? <Check></Check> : <Plus></Plus>}
        </ActionIcon>
      </Table.Td>
    </Table.Tr>
  );
};

export const Route = createFileRoute("/_onboarding/api_import")({
  component: () => {
    const [_query, setQuery] = useState("");
    const [query] = useDebounceValue(_query, 500);

    const { data: number } = useQuery({
      queryKey: ["study_count", query],
      queryFn: async ({}) => {
        console.log(query);
        return getNumberOfStudiesForQuery(query);
      },
    });

    const downloadStudies = async () => {
      const studies = await getStudies(query);
      setIsLoading(true);

      if (studies.length == 0) {
        return notifications.show({
          message: "No studies found!",
          color: "red",
        });
      }

      if (
        !confirm(`Downloaded ${studies.length} studies. Import into database?`)
      ) {
        return notifications.show({
          message: "Import cancelled",
          color: "yellow",
        });
      }

      notifications.show({
        message: `Found ${studies.length} studies, importing now...`,
        color: "green",
      });

      const length = studies.length;

      await insertStudiesIntoDatabase(studies, (e) => {
        notifications.show({
          message: e,
          color: "red",
        });
      });

      notifications.show({
        message: `Import done.`,
        color: "green",
      });

      nextStep();
    };

    const [active, setActive] = useState(0);
    const nextStep = () =>
      setActive((current) => (current < 4 ? current + 1 : current));
    const prevStep = () =>
      setActive((current) => (current > 0 ? current - 1 : current));

    const [isLoading, setIsLoading] = useState(false);

    const [onboardingComplete, setOnboardingComplete] = useSettingsStore(
      useShallow((s) => [s.onboardingComplete, s.setOnboardingComplete])
    );

    useEffect(() => {
      setIsLoading(false);
    }, [active]);

    return (
      <Container>
        <div className="flex mb-10 items-center">
          <div className="flex-1">
            <Title>New API Import</Title>
          </div>
          <Link to="/settings">
            <Button variant="default" size="xs">
              Cancel
            </Button>
          </Link>
        </div>
        <Stepper
          active={active}
          onStepClick={setActive}
          allowNextStepsSelect={false}
        >
          <Stepper.Step label="Step 1" description="Export your data">
            <Container className="space-y-4">
              <div>
                <b>Welcome to ClinicalTrialsExplorer!</b>
              </div>
              <div>
                This tool allows you to import data from clinicaltrials.gov for
                a specific search query and stores it for you in a database
                locally on your device. After import, you can create custom
                fields that you use for data annotation and later analysis. We
                will provide a starting template to check for repurposing of
                drugs, however, you may customize the software to your liking.
              </div>
              <div>
                This is an updated version based on the published version{" "}
                <a
                  href="https://pubmed.ncbi.nlm.nih.gov/37870580/"
                  target="_blank"
                  className="underline"
                >
                  you can read about here
                </a>
                .
              </div>
              <div>
                Additinonally, the program includes optional AI features for
                data annotation, checking and searching for publications.
              </div>
              <Alert
                variant="light"
                color="yellow"
                title="Information"
                icon={<CircleAlertIcon></CircleAlertIcon>}
              >
                If you have been using the previous version of the software, you
                can export your data and import it into this version. {""}
                <Link to="/legacy_import" className="underline">
                  Click here, to go to the legacy import.
                </Link>
              </Alert>

              <Group justify="center" mt="xl">
                <Button onClick={nextStep}>Continue</Button>
              </Group>
            </Container>
          </Stepper.Step>
          <Stepper.Step label="Step 2" description="Download data">
            <Container className="space-y-4">
              <div>
                First, you will need to donwload data. For this, you may try
                your search query on the{" "}
                <a
                  href={`https://clinicaltrials.gov/search?term=${_query == "" ? "query" : _query}`}
                  target="_blank"
                  className="underline"
                >
                  ClinicalTrials.gov
                </a>{" "}
                website to see if it returns any results. If it does, you can
                import the data into the software.
              </div>
              <div>
                The programm will show you a preview of the number of studies
                found for a given query once you enter the first characters.
              </div>
              <div className="flex items-end space-x-2">
                <TextInput
                  label="Search query"
                  className="flex-1"
                  value={_query}
                  onChange={(e) => setQuery(e.target.value)}
                  description={
                    query == "" ? (
                      <span>Search Query on Clinical trials.gov</span>
                    ) : (
                      <span>
                        Found {number} studies for <Code>{query}</Code>
                      </span>
                    )
                  }
                ></TextInput>
                <Button
                  onClick={downloadStudies}
                  disabled={isLoading}
                  loading={isLoading}
                >
                  Import
                </Button>
              </div>
            </Container>
          </Stepper.Step>
          <Stepper.Step label="Step 3" description="Create custom fields">
            <Container className="space-y-4">
              <Alert title="Successfull" color="green" icon={<Check></Check>}>
                The studies have been imported successfully.
              </Alert>
              <div>
                Originally, the software was developed to screen for studies
                that may use a drug in the context of drug repurposing. If you
                also want to use it for this purpose, we can initialize the
                following custom fields for you as a starting point. You may
                customize, change, add or delete the fields in the settings
                later at any time.
              </div>
              <Paper shadow="xs" p="xl">
                <div>
                  <Table>
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>ID</Table.Th>
                        <Table.Th>Label</Table.Th>
                        <Table.Th>Description</Table.Th>
                        <Table.Th>Action</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {CUSTOM_FIELDS_SEED.map((f) => {
                        return (
                          <CustomFieldCreationRow
                            key={f.idName}
                            field={f}
                          ></CustomFieldCreationRow>
                        );
                      })}
                    </Table.Tbody>
                  </Table>
                </div>
              </Paper>

              <Group justify="center" mt="xl">
                <Button onClick={() => {
                  nextStep();
                  setOnboardingComplete(true);
                }}>Complete import</Button>
              </Group>
            </Container>
          </Stepper.Step>
          <Stepper.Completed>
            <Container className="space-y-4">
              <Alert title="Successfull" color="green" icon={<Check></Check>}>
                You are all set! The data has been imported and the custom
                fields have been created if you chose to do so.
              </Alert>

              <Group justify="center" mt="xl">
                <Link to="/display_filtered_entries">
                  <Button>Go to main page</Button>
                </Link>
              </Group>
            </Container>
          </Stepper.Completed>
        </Stepper>
      </Container>
    );
    return (
      <Container>
        Hello /api_import!
        <div>
          <Button
            onClick={() => {
              confirm("Confirm?") &&
                database
                  .insert(CustomFieldTable)
                  .values(CUSTOM_FIELDS_SEED)
                  .run()
                  .then(() => {
                    notifications.show({ message: "Seed done." });
                  });
            }}
          >
            Seed Custom Fields
          </Button>
        </div>
      </Container>
    );
  },
});
