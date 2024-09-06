import Container from "@/components/Container";
import CustomNavMenu from "@/components/CustomNavMenu";
import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_navbar")({
  component: () => (
    <div>
      <CustomNavMenu></CustomNavMenu>

      <Outlet></Outlet>
    </div>
  ),
});
