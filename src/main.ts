import {
  app,
  BrowserWindow,
  dialog,
  ipcMain,
  Menu,
  nativeImage,
  shell,
} from "electron";
import path from "path";
import proxy from "./ctg-proxy-view";
import { PROXY_PORT } from "./lib/constants";
import {
  DEFAULT_DB_PATH,
  execute,
  getCurrentDbPath,
  openDatabase,
  runMigrate,
} from "./db/db-main";
import { startJupyter } from "./main_process/start_jupyter";
import { menu } from "./main_process/app_menu";

const isMac = process.platform === "darwin";

import settings from "electron-settings";
import { getLastOpenDbPath, setLastOpenDbPath } from "./main_process/settings";

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require("electron-squirrel-startup")) {
  app.quit();
}

//const jupyter = startJupyter();
const ICON_PATH = "/Users/tim/Code/JS/clinical-trials-explorer/app-icon.png";

const createWindow = async () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    icon: ICON_PATH,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  });

  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`)
    );
  }

  // Open the DevTools.
  //mainWindow.webContents.openDevTools();

  mainWindow.webContents.session.webRequest.onHeadersReceived(
    {
      //urls: ["*://clinicaltrials.gov/*"],
      urls: ["*://*/*"],
    },
    (details, callback) => {
      const responseHeaders = details.responseHeaders || {};

      //responseHeaders["X-Frame-Options"] = ["*"];

      Object.keys(responseHeaders)
        .filter((x) =>
          ["x-frame-options", "access-control-allow-origin"].includes(
            x.toLowerCase()
          )
        )
        .map((x) => delete responseHeaders[x]);

      responseHeaders["Access-Control-Allow-Origin"] = ["*"];

      callback({ cancel: false, responseHeaders });
    }
  );

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: "deny" };
  });

  if (isMac) app.dock.setIcon(ICON_PATH);

  //proxy.listen(PROXY_PORT);

  mainWindow.on('page-title-updated', e => e.preventDefault())

  return mainWindow
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", async () => {
  // IPC test
  ipcMain.on("ping", () => console.log("pong"));
  ipcMain.handle("db:execute", execute);

  let lastPath = await getLastOpenDbPath();

  console.log("#### last open db path ###", lastPath);

  if (!lastPath) {
    openDatabase(DEFAULT_DB_PATH, true);
    setLastOpenDbPath(DEFAULT_DB_PATH);
  } else {
    openDatabase(lastPath);
  }

  Menu.setApplicationMenu(menu);

  let w = await createWindow();
  w.setTitle(`Clinical Trials Explorer - ${getCurrentDbPath()}`);

});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("will-quit", () => {
  //jupyter.kill();
});

app.on("open-file", (e, path) => {
  if (
    dialog.showMessageBoxSync({
      type: "question",
      message: "Open database?",
      detail: path,
      buttons: ["Yes", "No"],
    }) === 0
  ) {
    openDatabase(path);
    BrowserWindow.getFocusedWindow()?.reload();
  }
});

app.on("activate", () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
