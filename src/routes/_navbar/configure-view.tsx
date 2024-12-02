import Container from "@/components/Container";
import { createFileRoute } from "@tanstack/react-router";

import { useSettingsStore } from "@/lib/zustand";
import {
  ActionIcon,
  Badge,
  Button,
  Group,
  Paper,
  Pill,
  Title,
} from "@mantine/core";
import { getCustomFields } from "@/lib/database-wrappers";
import { Reorder } from "motion/react";
import { useEffect, useState } from "react";
import { EyeIcon, EyeOffIcon, GripVerticalIcon } from "lucide-react";
import { useShallow } from "zustand/react/shallow";

const intialSettings = useSettingsStore.getInitialState();

export type TypeItemToOrder = {
  type: "derived_field" | "custom_field";
  propertyNameOrId: string;
  hidden: boolean;
};

export const generateDefaultViewConfig = async () => {
  let customFields = await getCustomFields();
  let derivedFields = useSettingsStore.getState().pivotDeriveRules;

  return [
    ...customFields.map(
      (cf) =>
        ({
          type: "custom_field",
          propertyNameOrId: cf.id.toString(),
          hidden: false,
        }) satisfies TypeItemToOrder
    ),
    ...derivedFields.map(
      (df) =>
        ({
          type: "derived_field",
          propertyNameOrId: `${df.propertyName}`,
          hidden: true,
        }) satisfies TypeItemToOrder
    ),
  ];
};

export const Route = createFileRoute("/_navbar/configure-view")({
  loader: async ({ params }) => {
    return {
      customFields: await getCustomFields(),
      defaultViewConfig: await generateDefaultViewConfig(),
    };
  },
  shouldReload: true,
  component: () => {
    const [entryViewConfig, setEntryViewConfig, derivedFields] =
      useSettingsStore(
        useShallow((s) => [
          s.entryViewConfig,
          s.setEntryViewConfig,
          s.pivotDeriveRules,
        ])
      );
    const { customFields, defaultViewConfig } = Route.useLoaderData();

    // On first render check if some fields are missing in config and add them or remove them if the fields have been removed
    useEffect(() => {
      setEntryViewConfig([
        ...entryViewConfig.filter((item) => {
          return defaultViewConfig.some(
            (dc) => dc.propertyNameOrId === item.propertyNameOrId
          );
        }),
        ...defaultViewConfig.filter((item) => {
          return !entryViewConfig.some(
            (ci) => ci.propertyNameOrId === item.propertyNameOrId
          );
        }),
      ]);
    }, []);

    return (
      <Container className="space-y-4 max-w-4xl m-auto">
        <Title mb="sm">Configure Entry View</Title>

        <div className="text-sm">
          Drag the items to reorder or click on the eye symbol to show/hide
          items.
        </div>

        <Group>
          <Button
            onClick={() => {
              if (confirm("Are you sure you want to reset to default?")) {
                setEntryViewConfig(defaultViewConfig);
              }
            }}
          >
            Reset to default
          </Button>
          <Button
            variant="light"
            onClick={() => {
              if (confirm("Are you sure you want to show all fields?")) {
                setEntryViewConfig(
                  entryViewConfig.map((e) => ({ ...e, hidden: false }))
                );
              }
            }}
          >
            Show all
          </Button>
          <Button
            variant="light"
            onClick={() => {
              if (confirm("Are you sure you want to hide all fields?")) {
                setEntryViewConfig(
                  entryViewConfig.map((e) => ({ ...e, hidden: true }))
                );
              }
            }}
          >
            Hide all
          </Button>
        </Group>

        <div>
          <Reorder.Group
            axis="y"
            values={entryViewConfig}
            onReorder={setEntryViewConfig}
          >
            {entryViewConfig.map((item) => {
              const customField = customFields.find(
                (cf) => cf.id.toString() === item.propertyNameOrId
              );

              const derivedField = derivedFields.find(
                (c) => c.propertyName === item.propertyNameOrId
              );

              return (
                <Reorder.Item key={item.propertyNameOrId} value={item}>
                  <Paper withBorder p="md" shadow="md" my="md">
                    <div className="flex items-center space-x-2">
                      <div>
                        <div className="flex items-center space-x-2">
                          <Title order={4}>
                            {item.type == "custom_field"
                              ? customField?.label || "Unknown custom field"
                              : derivedField?.displayName ||
                                item.propertyNameOrId}
                          </Title>

                          {item.type == "custom_field" ? (
                            <Badge color="blue" variant="light">
                              Custom Field
                            </Badge>
                          ) : (
                            <Badge color="grape" variant="light">
                              Derived Field
                            </Badge>
                          )}
                          {item.hidden && (
                            <Badge color="gray" variant="light">
                              Hidden
                            </Badge>
                          )}
                        </div>
                        <div>
                          {item.type == "custom_field"
                            ? customField?.description || ""
                            : derivedField?.description || ""}
                        </div>
                      </div>
                      <div className="!ml-auto">
                        <Group>
                          <ActionIcon
                            variant="light"
                            onClick={() => {
                              let newItems = entryViewConfig.map((i) => {
                                if (
                                  i.propertyNameOrId === item.propertyNameOrId
                                ) {
                                  return {
                                    ...i,
                                    hidden: !i.hidden,
                                  };
                                } else {
                                  return i;
                                }
                              });
                              setEntryViewConfig(newItems);
                            }}
                          >
                            {item.hidden ? (
                              <EyeOffIcon></EyeOffIcon>
                            ) : (
                              <EyeIcon></EyeIcon>
                            )}
                          </ActionIcon>
                          <GripVerticalIcon></GripVerticalIcon>
                        </Group>
                      </div>
                    </div>
                  </Paper>
                </Reorder.Item>
              );
            })}
          </Reorder.Group>
        </div>
      </Container>
    );
  },
});
