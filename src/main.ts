import { app, BrowserWindow, ipcMain, nativeImage } from "electron";
import path from "path";
import proxy from "./ctg-proxy-view";
import { PROXY_PORT } from "./lib/constants";
import { execute, runMigrate } from "./db/db-main";
import { startJupyter } from "./main_process/start_jupyter";

const isMac = process.platform === "darwin";

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require("electron-squirrel-startup")) {
  app.quit();

}

//const jupyter = startJupyter();
const ICON_PATH = '/Users/tim/Code/JS/clinical-trials-explorer/app-icon.png'

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

  if(isMac) app.dock.setIcon(ICON_PATH);

 

  //proxy.listen(PROXY_PORT);
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", async () => {
   // IPC test
   ipcMain.on("ping", () => console.log("pong"));
   ipcMain.handle("db:execute", execute);
   await runMigrate();
  createWindow();
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

app.on("activate", () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
