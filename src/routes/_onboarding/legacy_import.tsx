import { createFileRoute } from "@tanstack/react-router";
import "@mantine/dropzone/styles.css";
import {
  Group,
  Text,
  rem,
  Stepper,
  Button,
  Title,
  Code,
  Alert,
  CopyButton,
  Tooltip,
  ActionIcon,
} from "@mantine/core";
import { Dropzone, DropzoneProps } from "@mantine/dropzone";
import { Check, Copy, FileJson, FileWarning, Upload, X } from "lucide-react";
import Container from "@/components/Container";
import {
  AWLAYS_CREATE_CUSTOM_FILEDS,
  createCustomFieldsInDatabase,
  extractCustomFields,
  importLegacyData,
  LEGACY_DEFAULT_KEYS,
  LegacyExportEntry,
} from "@/lib/legacy-import";
import { useEffect, useState } from "react";
import { check } from "drizzle-orm/mysql-core";
import { notifications } from "@mantine/notifications";
import { set } from "zod";
import { Link } from "@tanstack/react-router";
import { useSettingsStore } from "@/lib/zustand";
import { useShallow } from "zustand/react/shallow";

export const Route = createFileRoute("/_onboarding/legacy_import")({
  component: () => {
    const [legacyEntries, setLegacyEntries] = useState<
      LegacyExportEntry[] | null
    >(null);

    const [active, setActive] = useState(0);
    const nextStep = () =>
      setActive((current) => (current < 4 ? current + 1 : current));
    const prevStep = () =>
      setActive((current) => (current > 0 ? current - 1 : current));

    const [onboardingComplete, setOnboardingComplete] = useSettingsStore(
      useShallow((s) => [s.onboardingComplete, s.setOnboardingComplete])
    );

    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
      setIsLoading(false);
    }, [active]);

    return (
      <Container>
        <div className="flex mb-10 items-center">
          <div className="flex-1">
            <Title>Legacy Import</Title>
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
                To import data from the old version of this application, you
                first need to export it. To export your data, run the following
                command in the old version of clinical trials explorer:
              </div>
              <Alert
                variant="light"
                color="yellow"
                title="Common issues"
                icon={<FileWarning></FileWarning>}
              >
                For this step to work, you will need to have at least the
                database container running. <br />
                If you don't have it running, you can start it with the
                following command:
                <Code>docker compose up -d db</Code>
              </Alert>
              <Code block className="relative">
                {`docker compose exec db psql -U postgres -t -c "SELECT json_agg(row_to_json(e)) from \"Entry\" e;" > migration_export.json;`}{" "}
                <div className="absolute right-2 top-1/2 -translate-y-1/2 bg-gray-200 dark:bg-dark-light rounded">
                  <CopyButton
                    value={`docker compose exec db psql -U postgres -t -c "SELECT json_agg(row_to_json(e)) from \"Entry\" e;" > migration_export.json;`}
                    timeout={2000}
                  >
                    {({ copied, copy }) => (
                      <Tooltip
                        label={copied ? "Copied" : "Copy"}
                        withArrow
                        position="right"
                      >
                        <ActionIcon
                          color={copied ? "teal" : "gray"}
                          variant="subtle"
                          onClick={copy}
                        >
                          {copied ? (
                            <Check style={{ width: rem(16) }} />
                          ) : (
                            <Copy style={{ width: rem(16) }} />
                          )}
                        </ActionIcon>
                      </Tooltip>
                    )}
                  </CopyButton>
                </div>
              </Code>

              <div>
                Once you have run the above command correctly, you will find a
                file called <Code>migration_export.json</Code> in the root of
                your project folder. This file contains all the important data
                you have saved in your project. If you see this file, continue
                to the next step.
              </div>

              <Group justify="center" mt="xl">
                <Button onClick={nextStep}>Continue</Button>
              </Group>
            </Container>
          </Stepper.Step>
          <Stepper.Step label="Step 2" description="Select your export file">
            <Container className="space-y-4">
              <div>
                Now, drag the <Code>migration_export.json</Code> file into the
                area below or select it manually by clicking onto the field.
              </div>
              {legacyEntries === null && (
                <LegacyImportPage
                  onImport={(data) => setLegacyEntries(data)}
                ></LegacyImportPage>
              )}
              {legacyEntries && (
                <Alert title="File loaded" color="green" icon={<Check></Check>}>
                  The file has been loaded successfully and inlcuded{" "}
                  <b>{legacyEntries.length}</b> entries that can be imported in
                  the next step.
                  <div>It includes data for the following search terms:</div>
                  <div>
                    <ul className="list-disc">
                      {[
                        ...new Set(
                          legacyEntries.map((e) => e.legacy_search_term)
                        ),
                      ].map((term) => (
                        <li key={term}>{term}</li>
                      ))}
                    </ul>
                  </div>
                </Alert>
              )}

              <Group justify="center" mt="xl">
                <Button
                  variant="default"
                  onClick={() => {
                    prevStep();
                    setLegacyEntries(null);
                  }}
                >
                  Back
                </Button>
                {legacyEntries && <Button onClick={nextStep}>Continue</Button>}
              </Group>
            </Container>
          </Stepper.Step>
          <Stepper.Step label="Step 3" description="Create custom fields">
            <Container className="space-y-4">
              <div>
                We have found the following custom fields in your data, which
                will be created in the new version of the application. You can
                add descriptions and change the data type in the settings after
                the import.
              </div>

              {legacyEntries && (
                <div>
                  <ul className="list-disc">
                    {extractCustomFields(legacyEntries).map((term) => (
                      <li key={term}>{term}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div>
                You may not have created these fields yourself, but due to the
                new architecture, the data for the these fields will now be
                stored as a custom field.
              </div>

              <div>
                <ul className="list-disc">
                  {AWLAYS_CREATE_CUSTOM_FILEDS.map((term) => (
                    <li key={term.idName}>{term.label}</li>
                  ))}
                </ul>
              </div>

              <Group justify="center" mt="xl">
                <Button variant="default" onClick={prevStep}>
                  Back
                </Button>
                <Button
                  disabled={isLoading}
                  loading={isLoading}
                  onClick={() => {
                    setIsLoading(true);
                    createCustomFieldsInDatabase(
                      extractCustomFields(legacyEntries!)
                    ).then(() => {
                      notifications.show({
                        title: "Custom fields created",
                        message: "The custom fields have been created.",
                        color: "green",
                      });
                      nextStep();
                    });
                  }}
                >
                  Yes, create these fields and continue to next step.
                </Button>
              </Group>
            </Container>
          </Stepper.Step>

          <Stepper.Step label="Step 4" description="Download new data">
            <Container className="space-y-4">
              <div>
                To remain compatible with the new version of the application and
                API version of clinical trials, we will download each study that
                is present in the legacy system again. This may result in newer
                data being present in the new version of the application. After
                import, we will highlight the nct numbers with update
                differences.
              </div>

              <Alert
                variant="light"
                color="yellow"
                title="Notice"
                icon={<FileWarning></FileWarning>}
              >
                You will need to be connected to the internet for this step.
                This step may take a few seconds.
              </Alert>

              <Group justify="center" mt="xl">
                <Button
                  disabled={isLoading}
                  loading={isLoading}
                  onClick={() => {
                    setIsLoading(true);
                    importLegacyData(legacyEntries!).then(() => {
                      notifications.show({
                        title: "Import done",
                        message: "The import has been completed.",
                        color: "green",
                      });
                      nextStep();
                      setOnboardingComplete(true);
                    });
                  }}
                >
                  Ok, start the import.
                </Button>
              </Group>
            </Container>
          </Stepper.Step>
          <Stepper.Completed>
            <Container>
              <Alert title="File loaded" color="green" icon={<Check></Check>}>
                <b>{legacyEntries?.length}</b> studies have been imported
                successfully. Please check the data types and descriptions in
                the custom fields settings for optimal performance.
              </Alert>
              <Group justify="center" mt="xl">
                <Link to="/custom_fields">
                  <Button variant="default">Go to custom field settings</Button>
                </Link>
                <Link to="/display_filtered_entries">
                  <Button>Go to main page</Button>
                </Link>
              </Group>
            </Container>
          </Stepper.Completed>
        </Stepper>
      </Container>
    );
  },
});

const LegacyImportPage = (props: {
  onImport: (data: LegacyExportEntry[]) => void;
}) => {
  const checkIfValid = (data: string) => {
    let checkPassed = true;
    let entries: LegacyExportEntry[] = [];

    try {
      entries = JSON.parse(data);
      let keysPresent = entries.every((entry) => {
        return LEGACY_DEFAULT_KEYS.every((key) => {
          return key in entry;
        });
      });

      checkPassed = keysPresent;
    } catch (e) {
      checkPassed = false;
    }

    if (checkPassed) {
      notifications.show({
        title: "Format check",
        message: "File passed the format check.",
        color: "green",
      });
      props.onImport(entries);
    } else {
      notifications.show({
        title: "Format check error",
        message:
          "File did not pass the format check. Please make sure the file is in the correct format and that you provided the correct file.",
        color: "red",
      });
    }
  };

  return (
    <Dropzone
      maxFiles={1}
      onDrop={(files) => {
        console.log("accepted files", files);

        let file = files[0];

        file.text().then((text) => {
          checkIfValid(text);
        });
      }}
      onReject={(files) => console.log("rejected files", files)}
      maxSize={20 * 1024 ** 2}
      accept={["application/json"]}
    >
      <Group
        justify="center"
        gap="xl"
        mih={220}
        style={{ pointerEvents: "none" }}
      >
        <Dropzone.Accept>
          <Upload
            style={{
              width: rem(52),
              height: rem(52),
              color: "var(--mantine-color-blue-6)",
            }}
            // stroke={1.5}
          />
        </Dropzone.Accept>
        <Dropzone.Reject>
          <X
            style={{
              width: rem(52),
              height: rem(52),
              color: "var(--mantine-color-red-6)",
            }}
          />
        </Dropzone.Reject>
        <Dropzone.Idle>
          <FileJson
            style={{
              width: rem(52),
              height: rem(52),
              color: "var(--mantine-color-dimmed)",
            }}
          />
        </Dropzone.Idle>

        <div>
          <Text size="xl" inline>
            Drag exported <Code>migration_export.json</Code> file here or click
            to select file
          </Text>
          <Text size="sm" c="dimmed" inline mt={7}>
            Please make sure the file is not larger than 20MB.
          </Text>
        </div>
      </Group>
    </Dropzone>
  );
};
