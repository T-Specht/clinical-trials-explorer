/**
 * This file will automatically be loaded by vite and run in the "renderer" context.
 * To learn more about the differences between the "main" and the "renderer" context in
 * Electron, visit:
 *
 * https://electronjs.org/docs/tutorial/application-architecture#main-and-renderer-processes
 *
 * By default, Node.js integration in this file is disabled. When enabling Node.js integration
 * in a renderer process, please be aware of potential security implications. You can read
 * more about security risks here:
 *
 * https://electronjs.org/docs/tutorial/security
 *
 * To enable Node.js integration in this file, open up `main.ts` and enable the `nodeIntegration`
 * flag:
 *
 * ```
 *  // Create the browser window.
 *  mainWindow = new BrowserWindow({
 *    width: 800,
 *    height: 600,
 *    webPreferences: {
 *      nodeIntegration: true
 *    }
 *  });
 * ```
 */

import "./index.css";
import "@mantine/core/styles.css";

import { MantineProvider } from "@mantine/core";
import "@mantine/notifications/styles.css";
import { Notifications } from "@mantine/notifications";
import { ModalsProvider } from "@mantine/modals";

import { createRoot } from "react-dom/client";

import { StrictMode, useEffect } from "react";
import {
  RouterProvider,
  createRouter,
  createHashHistory,
} from "@tanstack/react-router";

// Import the generated route tree
import { routeTree } from "./routeTree.gen";

import {
  useQuery,
  useMutation,
  useQueryClient,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // staleTime: 1000 * 60 * 5,
    },
  },
});
const persister = createSyncStoragePersister({
  storage: window.localStorage,
});

// TODO!
// persistQueryClient({
//   queryClient,
//   persister: localStoragePersister,
// })

// import { Toaster } from "@/components/ui/sonner";
import { useDarkMode } from "usehooks-ts";

const hashHistory = createHashHistory();
// Create a new router instance
const router = createRouter({ routeTree, history: hashHistory });

// Register the router instance for type safety
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
const root = createRoot(document.getElementById("root")!);

const MainComponent = () => {
  // const { isDarkMode } = useDarkMode();

  // useEffect(() => {
  //   const root = window.document.documentElement;

  //   root.classList.remove("light", "dark");

  //   root.classList.add(isDarkMode ? "dark" : "light");
  // }, [isDarkMode]);

  return (
    <StrictMode>
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{ persister }}
      >
        <MantineProvider>
          <Notifications />
          <ModalsProvider>
            <RouterProvider router={router} />
          </ModalsProvider>
        </MantineProvider>
      </PersistQueryClientProvider>
      {/* <ThemePanel /> */}
    </StrictMode>
  );
};

root.render(<MainComponent></MainComponent>);
