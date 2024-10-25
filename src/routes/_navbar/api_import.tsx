import Container from "@/components/Container";

import { CustomFieldTable, EntryTable } from "@/db/schema";
import {
  ctgApiClient,
  getNumberOfStudiesForQuery,
  getStudies,
} from "@/lib/api";
import { database, insertStudiesIntoDatabase } from "@/lib/database-wrappers";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";

import { createFileRoute } from "@tanstack/react-router";
import { createInsertSchema } from "drizzle-zod";
import { useState } from "react";

import { useForm, SubmitHandler, useWatch } from "react-hook-form";

import { useDebounceValue } from "usehooks-ts";
import { z } from "zod";

import { defineStepper } from "@stepperize/react";
import { cn } from "@/lib/utils";
import { CUSTOM_FIELDS_SEED } from "@/lib/fields";
import { notifications } from "@mantine/notifications";
import { Button, Progress, TextInput } from "@mantine/core";

const schema = z.object({
  query: z.string(),
});

type FormInputs = z.infer<typeof schema>;

const { Scoped, useStepper, steps } = defineStepper(
  { id: "step-1", desc: "Define search query" },
  { id: "step-2", desc: "Download data" },
  { id: "step-3", desc: "Import into database" },
  { id: "step-4", desc: "Done." }
);

export const Route = createFileRoute("/_navbar/api_import")({
  component: () => {
    const [progress, setProgress] = useState(0);
    const stepper = useStepper();

    const [_query, setQuery] = useState("");
    const [query] = useDebounceValue(_query, 500);

    const { data: number } = useQuery({
      queryKey: ["study_count", query],
      queryFn: async ({}) => {
        console.log(query);
        return getNumberOfStudiesForQuery(query);
      },
    });

    const onSubmit = async () => {
      const studies = await getStudies(query);

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

      await insertStudiesIntoDatabase(
        studies,
        (e) => {
          notifications.show({
            message: e,
            color: "red",
          });
        },
        (p) => {
          setProgress(p * 100);
        }
      );

      notifications.show({
        message: `Import done.`,
        color: "green",
      });
    };

    return (
      <Container>
        Hello /api_import!
        <div>
          <Button
            onClick={() => {
              confirm("Are you sure you want to clear the database?") &&
                database
                  .delete(EntryTable)
                  .run()
                  .then(() => {
                    notifications.show({ message: "Database cleared" });
                  });
            }}
          >
            Clear DB
          </Button>

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
        <TextInput
          label="Search query"
          value={_query}
          onChange={(e) => setQuery(e.target.value)}
          description={
            query == "" ? (
              <span>Search Query on Clinical trials.gov</span>
            ) : (
              <span>
                Found {number} studies for "<code>{query}</code>"
              </span>
            )
          }
        ></TextInput>
        <Button onClick={onSubmit}>Import</Button>
        <div className="mt-5 space-y-3">
          <div>Progress</div>
          <Progress value={progress}></Progress>
        </div>
        <div className="grid divide-x grid-cols-4 bg-muted rounded-md mt-3 overflow-hidden">
          {stepper.all.map((step, i) => {
            return (
              // <div className="w-10 h-10 p-2 border rounded-full text-center">{i + 1}</div>
              <div
                className={cn(
                  "text-center border-slate-500 p-4",
                  stepper.current.id == step.id && "bg-sky-600"
                )}
              >
                <div className="font-bold">Step #{i + 1}</div>
                <div className="text-sm text-muted-foreground">{step.desc}</div>
              </div>
            );
          })}
        </div>
        {stepper.when("step-1", (step) => {
          return (
            <p>
              Step 1 <Button onClick={() => stepper.next()}>Next</Button>
            </p>
          );
        })}
      </Container>
    );
  },
});
