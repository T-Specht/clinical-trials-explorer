// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { contextBridge, ipcRenderer } from "electron";

console.log(process.env);

const BRIDGE = {
  v: process.env.VITE_APP_VERSION,
  db_execute: (...args: any[]) => ipcRenderer.invoke("db:execute", ...args),
};
export type Bridge = typeof BRIDGE;
declare global {
  interface Window {
    bridge: Bridge;
  }
}


contextBridge.exposeInMainWorld("bridge", BRIDGE);
