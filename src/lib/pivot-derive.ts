import jsonLogic from "json-logic-js";
import {
  getAllEntries,
  getAllEntriesWithFlatCustomFields,
} from "./database-wrappers";
import dayjs from "dayjs";
import { z } from "zod";
import { desc } from "drizzle-orm";
import { Description } from "@radix-ui/react-dialog";

type SingleEntry = Awaited<ReturnType<typeof getAllEntries>>[0];

type PivotDeriveFunction<T extends z.ZodObject<any>> = {
  name: (typeof FUNCTION_NAMES)[number];
  description?: string;
  args: T;
  func: (
    d: SingleEntry,
    jsonLogic: jsonLogic.RulesLogic<jsonLogic.AdditionalOperation>,
    args: z.infer<T> // Args inferred directly from the Zod object
  ) => string;
};

function createPivotDeriveFunction<T extends z.ZodObject<any>>(
  config: PivotDeriveFunction<T>
): PivotDeriveFunction<T> {
  // Wrap the original function to include validation
  const validatedFunc: typeof config.func = (d, jl, args) => {
    // Validate args using the Zod schema
    const validationResult = config.args.safeParse(args);
    if (!validationResult.success) {
      throw new Error(`Invalid arguments: ${validationResult.error.message}`);
    }

    try {
      // Try and catch
      return String(config.func(d, jl, validationResult.data));
    } catch (error) {
      return "error: " + String(error);
    }
  };

  // Return the config with the wrapped function
  return {
    ...config,
    func: validatedFunc,
  };
}
const FUNCTION_NAMES = [
  "split_first",
  "format_date",
  "get",
  "join",
  "get_first",
  "json_logic_extraction",
] as const;
// Define the functions with strong typing
export const PIVOT_DERIVE_FUNCTIONS = [
  createPivotDeriveFunction({
    name: "json_logic_extraction",
    description:
      "Extract a value from the raw data using JSON logic. This is useful if the field you want to extract is nested in the data and requires JSON logic to extract. For path to access data, you can choose rawJson as a starting point",
    args: z.object({
      jsonLogic: z.string().describe("The JSON logic to apply to the data"),
    }),
    func: (d, jl, args) => {
      let jsonLogicArg = JSON.parse(args.jsonLogic);
      return jsonLogic.apply(jsonLogicArg, jsonLogic.apply(jl, d));
    },
  }),
  createPivotDeriveFunction({
    name: "split_first",
    description:
      "Get the first part of a string split by a delimeter, e.g. useful if you listed multiple values sperated by a pipe '|' or comma ',' and only want the first value",
    args: z.object({
      delimeter: z.string().describe("The delimeter to split the string by"),
    }),
    func: (d, jl, args) => {
      let { delimeter } = args;
      return jsonLogic.apply(jl, d)?.split(delimeter)?.at(0) ?? "";
    },
  }),
  createPivotDeriveFunction({
    name: "join",
    description:
      "Join multiple values of array into a single string using a delimeter",
    args: z.object({
      delimeter: z.string().describe("The delimeter to join the string by"),
    }),
    func: (d, jl, args) => {
      let { delimeter } = args;
      return jsonLogic.apply(jl, d)?.join(delimeter);
    },
  }),
  createPivotDeriveFunction({
    name: "get_first",
    description:
      "Get the first string value of an array field that may be nested in the data and therefore requires JSON logic to extract",
    args: z.object({
      subPath: z
        .string()
        .describe(
          "You may specify a subpath to extract a value from a array of object. Leave emtpy if the field is a simple array of strings"
        )
        .optional(),
    }),
    func: (d, jl, args) => {
      const { subPath } = args;

      let firstValue = jsonLogic.apply(jl, d)?.at(0);

      if (subPath && subPath.trim() != "") {
        return jsonLogic.apply(
          {
            var: subPath,
          },
          firstValue
        );
      }

      return firstValue;
    },
  }),
  createPivotDeriveFunction({
    name: "get",
    description:
      "Get the string value of a field that may be nested in the data and therefore requires JSON logic to extract",
    args: z.object({}),
    func: (d, jl, args) => {
      return jsonLogic.apply(jl, d);
    },
  }),
  createPivotDeriveFunction({
    name: "format_date",
    description:
      "Format a date or date string using the provided format string using dayjs formatting",
    args: z.object({
      format: z
        .string()
        .describe("The format to use for the date, e.g. YYYY or YYYY-MM-DD"),
    }),
    func: (d, jl, args) => {
      let { format } = args;
      return dayjs(jsonLogic.apply(jl, d)).format(format);
    },
  }),
];

// CLIENT RULES

// Base schema for rule definition
export const zodPivotDeriveRuleBaseSchema = z.object({
  propertyName: z.string(),
  func: z.enum(FUNCTION_NAMES),
  args: z.any(),
  jsonLogic: z.custom<jsonLogic.RulesLogic<jsonLogic.AdditionalOperation>>(),
  displayName: z.string().optional(),
  description: z.string().optional(),
});

export type PivotDeriveRule = z.infer<typeof zodPivotDeriveRuleBaseSchema>;

export const DEFAULT_DERIVED_RULES: PivotDeriveRule[] = [
  {
    propertyName: "sex",
    func: "get",
    args: {
      delimeter: "|",
    },
    jsonLogic: {
      var: "rawJson.eligibilityModule.sex",
    },
  },
  {
    propertyName: "first_phase",
    func: "get_first",
    args: {
      delimeter: "|",
    },
    jsonLogic: {
      var: "rawJson.designModule.phases",
    },
  },
  {
    propertyName: "design_oberservation_model",
    func: "get",
    args: {},
    jsonLogic: {
      var: "rawJson.designModule.designInfo.observationalModel",
    },
  },
  {
    propertyName: "design_masking",
    func: "get",
    args: {},
    jsonLogic: {
      var: "rawJson.designModule.designInfo.maskingInfo.masking",
    },
  },
  {
    propertyName: "design_intervention_model",
    func: "get",
    args: {},
    jsonLogic: {
      var: "rawJson.designModule.designInfo.interventionModel",
    },
  },
  {
    propertyName: "design_allocation",
    func: "get",
    args: {},
    jsonLogic: {
      var: "rawJson.designModule.designInfo.allocation",
    },
  },
  {
    propertyName: "first_mesh_term",
    func: "get_first",
    args: {
      subPath: "term",
    },
    jsonLogic: {
      var: "rawJson.interventionBrowseModule.meshes",
    },
  },
  {
    propertyName: "description",
    func: "get",
    args: {},
    jsonLogic: {
      var: "rawJson.descriptionModule.briefSummary",
    },
  },
  {
    propertyName: "study_first_post",
    func: "format_date",
    args: {
      format: "YYYY",
    },
    jsonLogic: {
      var: "rawJson.statusModule.studyFirstPostDateStruct.date",
    },
  },
  {
    propertyName: "study_start_date",
    func: "format_date",
    args: {
      format: "YYYY",
    },
    jsonLogic: {
      var: "rawJson.statusModule.startDateStruct.date",
    },
  },
  {
    propertyName: "first_drug_name",
    func: "split_first",
    args: {
      delimeter: "|",
    },
    jsonLogic: {
      var: "drug_name",
    },
  },
  {
    propertyName: "status",
    func: "get",
    args: {},
    jsonLogic: {
      var: "rawJson.statusModule.overallStatus",
    },
  },
  {
    propertyName: "age",
    func: "get",
    args: {},
    jsonLogic: {
      var: "rawJson.eligibilityModule.stdAges",
    },
  },
];
