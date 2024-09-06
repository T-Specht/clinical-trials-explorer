import { createFileRoute, redirect, Redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: () => <div>Home</div>,
  loader: () => {
    return redirect({
      to: "/display_filtered_entries",
    });
  },
});
