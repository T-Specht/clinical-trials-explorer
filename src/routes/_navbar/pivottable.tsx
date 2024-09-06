import { EntryTable } from "@/db/schema";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import PivotTableUI, { PivotTableUIProps } from "react-pivottable/PivotTableUI";
import "react-pivottable/pivottable.css";

import TableRenderers from "react-pivottable/TableRenderers";
import Plot from "react-plotly.js";
import createPlotlyRenderers from "react-pivottable/PlotlyRenderers";
import { getAllEntries } from "@/lib/database-wrappers";

// create Plotly renderers via dependency injection
const PlotlyRenderers = createPlotlyRenderers(Plot);

export const Route = createFileRoute("/_navbar/pivottable")({
  component: () => <PivotTable />,
  loader: async ({ params }) => {
    let data = await getAllEntries();
    return data.map((e) => {
      let ret = {
        ...e,
        ...e.custom_fields,
      };

      //@ts-ignore
      delete ret.custom_fields;
      return ret;
    });
  },
});

const PivotTable = () => {
  const entries = Route.useLoaderData();
  const [pivot, setPivot] = useState<PivotTableUIProps>();

  return (
    <div className="overflow-scroll dark:invert dark:hue-rotate-180">
      <PivotTableUI
        data={entries as any}
        onChange={(s) => setPivot(s)}
        renderers={Object.assign({}, TableRenderers, PlotlyRenderers)}
        {...pivot}
        //   renderers={PivotTable.renderers}
        //   onChange={(s) => this.setState(s)}
        //   {...this.state}
      />
    </div>
  );
};
