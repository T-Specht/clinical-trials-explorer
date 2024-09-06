import { EntryTable } from "@/db/schema";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import {
  useForm,
  Resolver,
  SubmitHandler,
  UseFormReturn,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { database } from "@/db/db-renderer";
import { Button } from "./ui/button";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { toast } from "sonner";
import z from "zod";
import { getKeys, keysToNullObject } from "@/lib/utils";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const insertSchema = createInsertSchema(EntryTable).omit({
  createdAt: true,
  custom_fields: true,
  id: true,
});

type FormInputs = z.infer<typeof insertSchema>;

const KEYS = getKeys(insertSchema.shape);

const EditEntryForm = (props: {
  onSubmit: (data: FormInputs, form: UseFormReturn<FormInputs>) => void;
  initialValues?: FormInputs;
}) => {
  const form = useForm<FormInputs>({
    resolver: zodResolver(insertSchema),
    defaultValues: props.initialValues,
  });

  const onSubmit: SubmitHandler<FormInputs> = async (data) => {
    props.onSubmit(data, form);
  };

  return (
    <div>
      <h2>Create Entry</h2>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          {KEYS.map((f) => {
            return (
              <FormField
                key={f}
                control={form.control}
                name={f}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{f}</FormLabel>
                    <FormControl>
                      <Input {...(field as any)} />
                    </FormControl>
                    {/* <FormDescription>
                      {fieldState.error?.message}
                    </FormDescription> */}
                    <FormMessage />
                  </FormItem>
                )}
              />
            );
          })}

          <Button type="submit" disabled={form.formState.isSubmitting}>
            Submit
          </Button>
        </form>
      </Form>
    </div>
  );
};

export default EditEntryForm;
