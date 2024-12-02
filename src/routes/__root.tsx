import {
  createRootRoute,
  Link,
  Outlet,
  useLocation,
  useNavigate,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";
import { isDev } from "@/lib/utils";
import { useSettingsStore } from "@/lib/zustand";
import { useShallow } from "zustand/react/shallow";
import { useEffect } from "react";
import { useTimeout } from "@mantine/hooks";

export const Route = createRootRoute({
  component: () => {
    const location = useLocation();
    const nav = useNavigate();

    const [onboardingComplete] = useSettingsStore(
      useShallow((s) => [s.onboardingComplete])
    );

    //console.log(onboardingComplete);

    const { clear, start } = useTimeout(() => {
      nav({
        to: "/welcome",
      });
    }, 500);

    useEffect(() => {
      clear();
      if (!onboardingComplete) {
        start();
      }
    }, [onboardingComplete]);

    return (
      <>
        <Outlet />
        {/* {isDev() && <TanStackRouterDevtools />} */}
      </>
    );
  },
});
