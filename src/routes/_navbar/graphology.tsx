import Container from "@/components/Container";
import { meshTermsGraph } from "@/lib/data-transforms";
import { Title } from "@mantine/core";
import { createFileRoute } from "@tanstack/react-router";
import { SigmaContainer } from "@react-sigma/core";
import "@react-sigma/core/lib/react-sigma.min.css";

export const Route = createFileRoute("/_navbar/graphology")({
  component: RouteComponent,
  loader: async () => {
    return {
      meshTermsGraph: await meshTermsGraph(),
    };
  },
});

function RouteComponent() {
  let data = Route.useLoaderData();

  return (
    <Container>
      <Title>Nodes and Edges</Title>
      <SigmaContainer
        graph={data.meshTermsGraph}
        style={{ height: "100vh" }}
        settings={{ allowInvalidContainer: true }}
        
      ></SigmaContainer>
    </Container>
  );
}
