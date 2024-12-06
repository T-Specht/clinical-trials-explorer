import { exportDatabaseBackup, openDatabase } from "../db/db-main";
import {
  app,
  BrowserWindow,
  dialog,
  Menu,
  MenuItem,
  MenuItemConstructorOptions,
  shell,
} from "electron";
import { getLastOpenDbPath } from "./settings";

const isMac = process.platform === "darwin";

// const template: MenuItemConstructorOptions[] = [
//     ...(isMac
//         ? [{
//             label: app.name,
//             submenu: [
//               { role: 'about' },
//               { type: 'separator' },
//               { role: 'services' },
//               { type: 'separator' },
//               { role: 'hide' },
//               { role: 'hideOthers' },
//               { role: 'unhide' },
//               { type: 'separator' },
//               { role: 'quit' }
//             ]
//           }]
//         : []),
//       // { role: 'fileMenu' }
//       {
//         label: 'File',
//         submenu: [
//           isMac ? { role: 'close' } : { role: 'quit' }
//         ]
//       },
//       // { role: 'editMenu' }
//       {
//         label: 'Edit',
//         submenu: [
//           { role: 'undo' },
//           { role: 'redo' },
//           { type: 'separator' },
//           { role: 'cut' },
//           { role: 'copy' },
//           { role: 'paste' },
//           ...(isMac
//             ? [
//                 { role: 'pasteAndMatchStyle' },
//                 { role: 'delete' },
//                 { role: 'selectAll' },
//                 { type: 'separator' },
//                 {
//                   label: 'Speech',
//                   submenu: [
//                     { role: 'startSpeaking' },
//                     { role: 'stopSpeaking' }
//                   ]
//                 }
//               ]
//             : [
//                 { role: 'delete' },
//                 { type: 'separator' },
//                 { role: 'selectAll' }
//               ])
//         ]
//       },
//       // { role: 'viewMenu' }
//       {
//         label: 'View',
//         submenu: [
//           { role: 'reload' },
//           { role: 'forceReload' },
//           { role: 'toggleDevTools' },
//           { type: 'separator' },
//           { role: 'resetZoom' },
//           { role: 'zoomIn' },
//           { role: 'zoomOut' },
//           { type: 'separator' },
//           { role: 'togglefullscreen' }
//         ]
//       },
//       // { role: 'windowMenu' }
//       {
//         label: 'Window',
//         submenu: [
//           { role: 'minimize' },
//           { role: 'zoom' },
//           ...(isMac
//             ? [
//                 { type: 'separator' },
//                 { role: 'front' },
//                 { type: 'separator' },
//                 { role: 'window' }
//               ]
//             : [
//                 { role: 'close' }
//               ])
//         ]
//       },
//       {
//         role: 'help',
//         submenu: [
//           {
//             label: 'Learn More',
//             click: async () => {
//               const { shell } = require('electron')
//               await shell.openExternal('https://electronjs.org')
//             }
//           }
//         ]
//       }
// ]

export const selectDbFileWithDialog = async () => {
  let res = await dialog.showOpenDialog({
    properties: ["openFile"],
    filters: [{ name: "SQLite", extensions: ["db"] }],
  });

  if (res.canceled) return null;

  return res.filePaths[0];
};

const template: MenuItemConstructorOptions[] = [
  {
    label: app.name,
    submenu: [
      { role: "about" },
      { type: "separator" },
      { role: "services" },
      { type: "separator" },
      { role: "hide" },
      { role: "hideOthers" },
      { role: "unhide" },
      { type: "separator" },
      { role: "quit" },
    ],
  },
  {
    role: "fileMenu",
    label: "Database",
    submenu: [
      {
        label: "Open other database",
        accelerator: "CmdOrCtrl+O",
        click: async () => {
          console.log("Open database");
          let path = await selectDbFileWithDialog();
          if (path) {
            openDatabase(path);
          }
        },
      },
      {
        label: "Reveal current database file in folder",
        accelerator: "CmdOrCtrl+Option+R",
        click: async () => {
          let lastPath = await getLastOpenDbPath();
          shell.showItemInFolder(lastPath!);
        },
      },
      {
        label: "Save database backup",
        accelerator: "CmdOrCtrl+Shift+S",
        click: async () => {
          console.log("Save database backup");
          let res = await dialog.showSaveDialog({
            title: "Save database backup",
            properties: ["createDirectory"],
            filters: [{ name: "SQLite", extensions: ["db"] }],
          });

          if (!res.canceled) {
            let fPath = res.filePath;
            console.log(fPath);
            exportDatabaseBackup(fPath);
          }
        },
      },
      {
        label: "Create new empty database",
        accelerator: "CmdOrCtrl+Shift+N",
        click: async () => {
          console.log("new database");
          let res = await dialog.showSaveDialog({
            title: "New database location",
            properties: ["createDirectory"],
            filters: [{ name: "SQLite", extensions: ["db"] }],
          });

          if (!res.canceled) {
            let fPath = res.filePath;
            console.log(fPath);
            openDatabase(fPath, true);
          }
        },
      },
    ],
  },
  {
    role: "editMenu",
  },
  {
    role: "viewMenu",
  },
  {
    role: "windowMenu",
  },
  {
    role: "help",
    submenu: [
      {
        label: "View project on GitHub",
        click: async () => {
          const { shell } = require("electron");
          await shell.openExternal("https://github.com/T-Specht/clinical-trials-explorer");
        },
      },
      {
        label: "Open original paper",
        click: async () => {
          const { shell } = require("electron");
          await shell.openExternal("https://doi.org/10.1007/s00210-023-02796-9");
        },
      },
    ],
  },
];

export const menu = Menu.buildFromTemplate(template);
