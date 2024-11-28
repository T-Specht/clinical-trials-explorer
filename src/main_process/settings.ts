import settings from "electron-settings";

export const getLastOpenDbPath = async () =>
  (await settings.get("lastOpenDbPath")) as string | null;

export const setLastOpenDbPath = async (p: string) =>
  await settings.set("lastOpenDbPath", p);
