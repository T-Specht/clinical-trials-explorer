import Container from "@/components/Container";
import { Indicator, Title } from "@mantine/core";
import { Link } from "@tanstack/react-router";
import { createFileRoute } from "@tanstack/react-router";
import { CloudDownload, FolderInput } from "lucide-react";

//@ts-ignore - icon is not a module
import icon from "@/assets/app-icon.png";

export const Route = createFileRoute("/_onboarding/welcome")({
  component: () => (
    <Container className="space-y-4 max-w-4xl m-auto min-h-screen flex">
      <div className="m-auto">
        <div className="text-center">
          <img src={icon} alt="" className="max-w-24 inline-block" />
          <Title>Welcome!</Title>
        </div>

        <div className="my-6 text-center">
          To use this app, you will need to import data. If you have used the
          previous version, you may transfer the data to this new version.
          Alternatively, you can start from the ground up with data imported
          directly from the clinicaltrials.gov API.
        </div>

        <div className="flex border-collapse items-stretch m-auto min-h-1/2">
          <div className="flex-1 text-center p-6 border shadow-lg m-4 rounded-md">
            <Link to="/legacy_import">
              <div className="flex justify-center mb-4">
                <FolderInput></FolderInput>
              </div>
              <Title order={3}>Transfer Legacy Data</Title>
              <div>
                If you have data from the previous version, you can transfer it
                to this new version.
              </div>
            </Link>
          </div>
          <div className="flex-1 text-center p-6 border shadow-lg m-4 rounded-md">
            <Indicator label="Preferred Option" size={20}>
              <Link to="/api_import">
                <div className="flex justify-center mb-4">
                  <CloudDownload></CloudDownload>
                </div>
                <Title order={3}>Download new Data from API</Title>
                <div>Use the clinicaltrials.gov API to download new data.</div>
              </Link>
            </Indicator>
          </div>
        </div>
      </div>
    </Container>
  ),
});
