import Container from "@/components/Container";
import { Button } from "@/components/ui/button";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Form,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { SubmitHandler, useForm, UseFormReturn } from "react-hook-form";
import { z } from "zod";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { BotIcon, Brain, ChevronsUpDown } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

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
  const [open, setOpen] = useState(false);

  const { field } = props;
  return (
    <div className="p-4 shadow-sm border rounded-md ">
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
        <Button
          onClick={() => {
            setOpen(true);
          }}
        >
          Edit
        </Button>
        <Dialog open={open} onOpenChange={(o) => setOpen(o)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Field {field.label}</DialogTitle>
              <DialogDescription>
                Please be sure what you are doing
              </DialogDescription>
            </DialogHeader>

            <CustomFieldsForm
              initialValues={field}
              onSubmit={(data) => {
                console.log(data);
                setOpen(false);
                toast.success("Field updated.");
                upsertCustomField(data).then(() => {
                  queryClient.invalidateQueries({
                    queryKey: ["custom_fields"],
                  });
                });
              }}
            ></CustomFieldsForm>
          </DialogContent>
        </Dialog>
        <Button
          variant="destructive"
          onClick={async () => {
            if (confirm("Really delete this field?")) {
              await deleteCustomField(field.id);
              toast.success("Field deleted.");
              queryClient.invalidateQueries({
                queryKey: ["custom_fields"],
              });
            }
          }}
        >
          Delete
        </Button>
      </div>
    </div>
  );
};

const CustomFieldsForm = (props: {
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
    <Form {...form}>
      <form onSubmit={form.handleSubmit(submit)}>
        <FormField
          control={form.control}
          name="idName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>ID Name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormDescription>
                Be careful to update this value!
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="label"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Label</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormDescription>
                How the field label is displayed
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                {/* @ts-ignore */}
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="aiDescription"
          render={({ field }) => (
            <FormItem>
              <FormLabel>AI Description</FormLabel>
              <FormControl>
                {/* @ts-ignore */}
                <Textarea {...field} />
              </FormControl>
              <FormDescription>
                This description is used to generate suggestions for the value
                of this field using AI if an OpenAI API key is provided in
                settings. It is passed directly to the AI model.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="dataType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select the data type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {getKeys(insertSchema.shape.dataType.enum).map((key) => {
                    return (
                      <SelectItem value={key} key={key}>
                        {key}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              <FormDescription>Datatype of Custom Field</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          className="mt-4"
          disabled={form.formState.isSubmitting}
        >
          Submit
        </Button>
      </form>
    </Form>
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

  if (!fields || isLoading) {
    return <div>Loading...ƒ</div>;
  }

  return (
    <Container>
      <div className="p-4 shadow-sm border rounded-md">
        <Collapsible>
          <CollapsibleTrigger>
            <div className="flex justify-between items-center w-full space-x-2">
              <h2 className="my-3 text-xl font-bold">
                Create new custom field
              </h2>
              <ChevronsUpDown className="h-4 w-4" />
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent>
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
                toast.success("Field created.");
                refetch();
              }}
            />
          </CollapsibleContent>
        </Collapsible>
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
