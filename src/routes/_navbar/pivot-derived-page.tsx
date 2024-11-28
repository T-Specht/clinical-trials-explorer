import {
  getAllJsonLogicPaths,
  PivotDerivedRuleForm,
} from "@/components/PivotRuleForm";
import { getAllEntriesWithFlatCustomFields } from "@/lib/database-wrappers";
import {
  PIVOT_DERIVE_FUNCTIONS,
  zodPivotDeriveRuleBaseSchema,
} from "@/lib/pivot-derive";
import { useSettingsStore } from "@/lib/zustand";
import {
  Button,
  Code,
  Container,
  Divider,
  JsonInput,
  Paper,
  Title,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { useShallow } from "zustand/react/shallow";

export const Route = createFileRoute("/_navbar/pivot-derived-page")({
  component: () => <Page></Page>,
});

const Page = () => {
  // Paths for autocomplete
  const pathsQuery = useQuery({
    queryKey: ["autocomplete_paths2"],
    queryFn: async () => {
      let res = await getAllEntriesWithFlatCustomFields();

      let allPaths: string[] = [];

      // Sample from first 10 enrties
      for (let entry of res.slice(0, 10)) {
        let paths = getAllJsonLogicPaths(res[0]);
        allPaths.push(...paths);
      }

      let uniquePaths = [...new Set(allPaths)];
      console.log("Generated Paths", uniquePaths);

      return uniquePaths;
    },
    staleTime: Infinity,
  });

  const [pivotDeriveRules, setPivotDeriveRules] = useSettingsStore(
    useShallow((s) => [s.pivotDeriveRules, s.setPivotDeriveRules])
  );

  const [workingCopy, setWorkingCopy] = useState("");

  useEffect(() => {
    // Necesssary because zustand may not have the latest value at first render because of database connection delay and retrival
    setWorkingCopy(JSON.stringify(pivotDeriveRules, null, 2));
  }, [pivotDeriveRules]);

  const validateAndSave = () => {
    let res = z
      .array(zodPivotDeriveRuleBaseSchema)
      .safeParse(JSON.parse(workingCopy));

    console.log(res);

    if (res.success) {
      setPivotDeriveRules(res.data);
      setWorkingCopy(JSON.stringify(res.data, null, 2));
      notifications.show({
        color: "green",
        title: "Success",
        message: "Rules saved",
      });
    } else {
      notifications.show({
        color: "red",
        title: "Error",
        message: "Invalid JSON",
      });
    }
  };

  return (
    <Container className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div className="p-4">
          <Title order={3}>Derived Fields Form</Title>
          {pathsQuery.isLoading ? (
            <div>Loading...</div>
          ) : (
            <div className="space-y-4">
              <Paper p="md" shadow="md">
                <Title order={4} my="sm">
                  Create new rule
                </Title>
                <PivotDerivedRuleForm
                  rule={null}
                  autoCompletePaths={pathsQuery.data}
                ></PivotDerivedRuleForm>
              </Paper>
              <Divider my="xs" label="Existing Rules" labelPosition="center" />
              {pivotDeriveRules.map((rule, i) => {
                return (
                  <Paper key={rule.propertyName + i} p="md" shadow="md">
                    <PivotDerivedRuleForm
                      rule={rule}
                      autoCompletePaths={pathsQuery.data}
                    ></PivotDerivedRuleForm>
                  </Paper>
                );
              })}
            </div>
          )}

          <Title order={3} mt="xl">
            Advanced Derived Fields Definition
          </Title>
          <JsonInput
            formatOnBlur
            autosize
            minRows={4}
            label="Rule Set"
            value={workingCopy}
            onChange={setWorkingCopy}
          ></JsonInput>
          <div className="flex my-3 space-x-3">
            <Link to="/pivottable">
              <Button size="xs" variant="light">
                Go back to pivot table
              </Button>
            </Link>
            <Button size="xs" onClick={validateAndSave}>
              Validate and Save
            </Button>
          </div>
        </div>

        <div className="p-3 space-y-2">
          <div className="my-3">
            <Link to="/pivottable">
              <Button size="xs" variant="light">
                Go back to pivot table
              </Button>
            </Link>
          </div>
          
          <Title order={3}>Help</Title>

          <p>
            You may define a configuration on the left side that is used to
            calculate values from the raw dataset.
          </p>
          <p>
            <b>
              At the top, you find form fields that aim to guide you through the
              process of creating a configuration.
            </b>
          </p>
          <p>
            The configuration itself is an array in JSON format. Each object in
            the array represents a derived field. You can edit the JSON directly
            in the input field at the bottom on the left side. Be careful to
            follow the JSON format. For beginner users, it is recommended to use
            the form fields.
          </p>
          <p>Each field needs the follwing definitions:</p>
          <ul className="pl-5 list-disc">
            <li>
              <Code>propertyName</Code>: The name of the property to create. It
              will be prepended with <Code>derived_</Code>
            </li>
            <li>
              <Code>func</Code>: The name of the function to use
            </li>
            <li>
              <Code>args</Code>: The arguments to pass to the function
            </li>
            <li>
              <Code>jsonLogic</Code>: The JSON logic to apply to the data to
              extract the value from the raw data. Click{" "}
              <a
                href="https://jsonlogic.com/"
                className="underline"
                target="_blank"
              >
                here
              </a>{" "}
              for more information. To find the available fields/path, you can
              use the raw data viewer on the entry page. The JSON logic is
              applied to each row of the data. Custom fields will be mergered at
              root level under their assigned name id (see example).
            </li>
          </ul>

          <Title order={3}>Example</Title>
          <p>
            A derived field based on a custom field called{" "}
            <Code>drug_name</Code> may be defined as follows to extract the
            first drug name from a list of drugs separated by a pipe{" "}
            <Code>|</Code> during data annotation.
          </p>
          <p>
            The created field will be called{" "}
            <Code>derived_first_drug_name</Code> in the pivot table.
          </p>
          <Code block>{`{
    "propertyName": "first_drug_name",
    "func": "split_first",
    "args": {
      "delimeter": "|"
    },
    "jsonLogic": {
      "var": "drug_name"
    }
}`}</Code>
          <Title order={3} mt={"md"}>
            Available functions
          </Title>
          {PIVOT_DERIVE_FUNCTIONS.map((fn) => {
            return (
              <div key={fn.name} className="bg-secondary p-3 rounded-md">
                <Title order={4}>{fn.name}</Title>
                <p className="my-3">{fn.description}</p>
                <p>
                  <b>Arguments</b> to provide in <Code>args</Code> as object:
                </p>
                <ul className="pl-5 list-disc">
                  {fn.args.keyof().options.map((arg) => {
                    return (
                      <li key={arg}>
                        <Code>{arg}</Code>:{" "}
                        {(fn.args.shape as any)[arg].description}
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </Container>
  );
};
