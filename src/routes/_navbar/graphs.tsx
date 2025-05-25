import Container from "@/components/Container";
import EntryFilter from "@/components/EntryFilter";
import {
  aggregateConditions,
  aggregateMeshTerms,
  geoHeatMap,
  geoScannerPoints,
  aggregateInterventions,
  aggregateHighRelevanceLeavesMeshTerms,
} from "@/lib/data-transforms";
import { getAllEntries } from "@/lib/database-wrappers";
import { isDev } from "@/lib/utils";
import { Button, Group } from "@mantine/core";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Config } from "plotly.js";
import Plot, { PlotParams } from "react-plotly.js";

export const Route = createFileRoute("/_navbar/graphs")({
  component: () => <PlotPage></PlotPage>,
});

const CPlot = (props: {} & PlotParams) => {
  return (
    <Plot
      {...props}
      layout={{
        ...props.layout,
        xaxis: {
          automargin: true,
        },
        yaxis: {
          automargin: true,
        },
      }}
      config={{
        ...props.config,

        toImageButtonOptions: {
          format: "svg",
          filename: `${props.layout.title || "plot_" + crypto.randomUUID()}`,
          scale: 1,
        },
      }}
    ></Plot>
  );
};

const PlotPage = () => {
  //const { heatmap, scatter, interventions, ...data } = Route.useLoaderData();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["graph_data_2"],
    queryFn: async () => {
      return {
        heatmap: await geoHeatMap(),
        // scatter: await geoScannerPoints(),
        allEntries: await getAllEntries(),
        interventions: await aggregateInterventions(),
        conditions: await aggregateConditions(),
        meshTerms: await aggregateMeshTerms(),
        highRelevanceMeshTerms: await aggregateHighRelevanceLeavesMeshTerms(),
      };
    },
    staleTime: 0,
  });

  return (
    <Container>
      <EntryFilter showCount></EntryFilter>

      <Group className="mb-4">
        <Button
          onClick={() => {
            refetch();
          }}
        >
          Regenerate charts
        </Button>

        {isDev() && (
          <Link to="/graphology">
            <Button size="xs" variant="subtle">
              Mesh Graphs
            </Button>
          </Link>
        )}
      </Group>

      {!data ? (
        <div>Loading...</div>
      ) : (
        <div>
          {/* <CPlot
            data={[
              {
                type: "bar",
                x: data.interventions.x,
                y: data.interventions.y,
              },
            ]}
            layout={{
              title: "Top 50 Interventions",
            }}
          ></CPlot>
          <CPlot
            data={[
              {
                type: "bar",
                x: data.conditions.x,
                y: data.conditions.y,
              },
            ]}
            layout={{
              title: "Top 50 Conditions",
            }}
          ></CPlot>

          <CPlot
            data={[
              {
                type: "bar",
                x: data.meshTerms.x,
                y: data.meshTerms.y,
              },
            ]}
            layout={{
              title: "Top 50 Mesh Terms",
            }}
          ></CPlot>

          <CPlot
            data={[
              {
                type: "bar",
                x: data.highRelevanceMeshTerms.x,
                y: data.highRelevanceMeshTerms.y,
              },
            ]}
            layout={{
              title: "Top 50 HIGH Relevance Mesh Terms Leaves",
            }}
          ></CPlot> */}

          <CPlot
            data={[
              {
                //@ts-ignore - this is a bug in the types
                type: "densitymap",
                lat: data.heatmap.lats,
                lon: data.heatmap.lngs,
                z: data.heatmap.zs,
                coloraxis: "coloraxis",
                radius: 20,
                //colorscale: 'Viridis'
              },
            ]}
            
            layout={{
              //map: { center: { lon: 60, lat: 30 }, style: "outdoors", zoom: 2 },
              //@ts-ignore - this is a bug in the types
              coloraxis: { colorscale: "Viridis" },
              title: "Locations Density Map",
              width: 1500,
              height: 1000,
              map: {
                center: { lon: 10, lat: 40 },
                zoom: 0,
              },
            }}
          ></CPlot>

          <CPlot
            data={[
              {
                //@ts-ignore - this is a bug in the types
                type: "scattermap",
                lat: data.heatmap.lats,
                lon: data.heatmap.lngs,
              },
            ]}
            layout={{
              //@ts-ignore - this is a bug in the types
              coloraxis: { colorscale: "Viridis" },
              width: 1500,
              height: 1000,
              map: {
                center: { lon: 10, lat: 40 },
                zoom: 0,
              },
              title: "Locations Scatter Plot",
            }}
          ></CPlot>
        </div>
      )}
    </Container>
  );
};
