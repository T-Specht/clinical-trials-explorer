import { JUPYTER_PORT } from "@/lib/constants";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_navbar/jupyter")({
  component: () => (
    <div>
      <iframe
        src={`http://localhost:${JUPYTER_PORT}`}
        className="w-[100%] h-[calc(100vh-45px)]"
      ></iframe>
    </div>
  ),
});
