import jsonLogic from "json-logic-js";
import { getAllEntriesWithFlatCustomFields } from "./database-wrappers";
import dayjs from "dayjs";
import { z } from "zod";

type PivotDeriveFunction<T extends z.ZodObject<any>> = {
  name: (typeof FUNCTION_NAMES)[number];
  description?: string;
  args: T;
  func: (
    d: Awaited<ReturnType<typeof getAllEntriesWithFlatCustomFields>>[0],
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

    // Proceed with the original function
    return config.func(d, jl, validationResult.data);
  };

  // Return the config with the wrapped function
  return {
    ...config,
    func: validatedFunc,
  };
}
const FUNCTION_NAMES = ["split_first", "format_date", "get"] as const;
// Define the functions with strong typing
export const PIVOT_DERIVE_FUNCTIONS = [
  createPivotDeriveFunction({
    name: "split_first",
    description:
      "Get the first part of a string split by a delimeter, e.g. useful if you listed multiple values sperated by a pipe '|' or comma ',' and only want the first value",
    args: z.object({
      delimeter: z.string().describe("The delimeter to split the string by"),
    }),
    func: (d, jl, args) => {
      let { delimeter } = args;
      return jsonLogic.apply(jl, d)?.split(delimeter)[0] ?? "";
    },
  }),
  createPivotDeriveFunction({
    name: "get",
    description:
      "Get the string value of a field that may be nested in the data and therefore requires JSON logic to extract",
    args: z.object({}),
    func: (d, jl, args) => {
      return jsonLogic.apply(jl, d).toString();
    },
  }),
  createPivotDeriveFunction({
    name: "format_date",
    description:
      "Format a date or date string using the provided format string using dayjs formatting",
    args: z.object({
      format: z.string().describe("The format to use for the date, e.g. YYYY or YYYY-MM-DD"),
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
});

export type PivotDeriveRule = z.infer<typeof zodPivotDeriveRuleBaseSchema>;

export const SAMPLE_RULES: PivotDeriveRule[] = [
  //   {
  //     propertyName: "first_drug_name",
  //     func: 'split_first',
  //     args: {
  //       delimeter: "|",
  //     },
  //     jsonLogic: {
  //       var: "drug_name",
  //     },
  //   },
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
];
