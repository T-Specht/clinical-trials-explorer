import Container from "@/components/Container";

import { CustomFieldTable } from "@/db/schema";
import {
  deleteCustomField,
  getCustomFields,
  upsertCustomField,
} from "@/lib/database-wrappers";
import { getKeys } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { createFileRoute } from "@tanstack/react-router";
import { createInsertSchema } from "drizzle-zod";
import {
  Controller,
  SubmitHandler,
  useForm,
  UseFormReturn,
} from "react-hook-form";
import { z } from "zod";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { BotIcon, Brain, ChevronsUpDown } from "lucide-react";

import {
  Collapse,
  Modal,
  Paper,
  Select,
  TextInput,
  Textarea,
  Button,
  Checkbox,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";

type CustomFieldTypeInsert = typeof CustomFieldTable.$inferInsert;
type CustomFieldTypeSelect = typeof CustomFieldTable.$inferSelect;
const insertSchema = createInsertSchema(CustomFieldTable);

type FormSchema = z.infer<typeof insertSchema>;

export const Route = createFileRoute("/_navbar/custom_fields")({
  component: () => <CustomFields></CustomFields>,
  loader: async () => {
    return await getCustomFields();
  },
});

const CField = (props: { field: CustomFieldTypeSelect }) => {
  const queryClient = useQueryClient();
  const [opened, { open, close }] = useDisclosure(false);

  const { field } = props;
  return (
    <Paper shadow="xs" p="xl">
      <h3 className="font-bold">
        {field.label} (ID: {field.id})
      </h3>
      {field.description && <p>Description: {field.description}</p>}
      {field.aiDescription && (
        <div className="flex space-x-1 justify-start items-start text-sm mb-4 bg-secondary rounded-md py-4 px-2 max-w-[700px]">
          <div>
            <BotIcon className="min-w-5 p-1" size="25px"></BotIcon>
          </div>
          <div className="">{field.aiDescription}</div>
        </div>
      )}

      <p>
        Field type: <code>{field.dataType}</code>
      </p>
      <p>
        Unique Name Id: <code>{field.idName}</code>
      </p>

      <div className="space-x-2 mt-3">
        <Button onClick={open}>Edit</Button>

        <Modal
          opened={opened}
          onClose={close}
          title={`Edit Field ${field.label}`}
        >
          <CustomFieldsForm
            initialValues={field}
            onSubmit={(data) => {
              console.log(data);
              close();
              notifications.show({ message: "Field updated." });
              upsertCustomField(data).then(() => {
                queryClient.invalidateQueries({
                  queryKey: ["custom_fields"],
                });
              });
            }}
          ></CustomFieldsForm>
        </Modal>
        <Button
          variant="destructive"
          onClick={async () => {
            if (confirm("Really delete this field?")) {
              await deleteCustomField(field.id);
              notifications.show({ message: "Field deleted." });

              queryClient.invalidateQueries({
                queryKey: ["custom_fields"],
              });
            }
          }}
        >
          Delete
        </Button>
      </div>
    </Paper>
  );
};

export const CustomFieldsForm = (props: {
  initialValues: FormSchema;
  onSubmit: (data: FormSchema, form: UseFormReturn<FormSchema>) => void;
}) => {
  const form = useForm<FormSchema>({
    defaultValues: props.initialValues,
    resolver: zodResolver(insertSchema),
  });

  const submit: SubmitHandler<FormSchema> = (data) => {
    props.onSubmit(data, form);
    // form.reset();
    // form.setValue("idName", crypto.randomUUID());
  };

  return (
    <form onSubmit={form.handleSubmit(submit)}>
      <TextInput
        label="ID Name"
        {...form.register("idName")}
        // description="Be careful to update this value!"
      ></TextInput>
      <TextInput
        label="Label"
        {...form.register("label")}
        description="How the field label is displayed"
      ></TextInput>
      <TextInput
        label="Description"
        {...form.register("description")}
      ></TextInput>
      <Textarea
        label="AI Description"
        {...form.register("aiDescription")}
        description="This description is used to generate suggestions for the value of this field using AI if an OpenAI API key is provided in settings. It is passed directly to the AI model."
      ></Textarea>
      <Controller
        control={form.control}
        name="dataType"
        render={({ field }) => (
          <Select
            label="Datatype"
            data={getKeys(insertSchema.shape.dataType.enum)}
            allowDeselect={false}
            value={field.value}
            onChange={(e) => field.onChange(e)}
            description="Datatype of Custom Field"
          ></Select>
        )}
      ></Controller>

      <Controller
        control={form.control}
        name="autocompleteEnabled"
        render={({ field }) => (
          <Checkbox
            my="md"
            label="Show autocomplete for field values?"
            checked={field.value}
            onChange={(e) => field.onChange(e.target.checked)}
            description="This only works for string fields"
          ></Checkbox>
        )}
      ></Controller>

      <Button
        type="submit"
        className="mt-4"
        disabled={form.formState.isSubmitting}
      >
        Submit
      </Button>
    </form>
  );
};

const CustomFields = () => {
  const {
    data: fields,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["custom_fields"],
    queryFn: getCustomFields,
  });

  const [opened, { toggle }] = useDisclosure(false);

  if (!fields || isLoading) {
    return <div>Loading...ƒ</div>;
  }

  return (
    <Container>
      <div className="p-4 shadow-sm border rounded-md">
        <div className="">
          <Button onClick={toggle}>
            Create new custom field <ChevronsUpDown className="h-4 w-4" />
          </Button>
          <Collapse in={opened}>
            <CustomFieldsForm
              initialValues={{
                dataType: "string",
                idName: crypto.randomUUID(),
                label: "New Field",
                description: "",
              }}
              onSubmit={async (data, form) => {
                await upsertCustomField(data);
                form.reset(
                  {
                    idName: crypto.randomUUID(),
                  },
                  { keepValues: false }
                );
                notifications.show({ message: "Field created." });
                refetch();
              }}
            />
          </Collapse>
        </div>
      </div>
      <h2 className="my-3 text-xl font-bold mt-5">Custom fields</h2>
      <div className="space-y-3">
        {fields.map((field) => (
          <CField key={field.id} field={field}></CField>
        ))}
      </div>
    </Container>
  );
};
