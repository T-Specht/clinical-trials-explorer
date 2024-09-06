import {
  createRootRoute,
  Link,
  Outlet,
  useLocation,
  useNavigate,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";
import { isDev } from "@/lib/utils";

export const Route = createRootRoute({
  component: () => {
    const location = useLocation();
    const nav = useNavigate();

    

    return (
      <>
        <Outlet />
        {isDev() && <TanStackRouterDevtools />}
      </>
    );
  },
});
