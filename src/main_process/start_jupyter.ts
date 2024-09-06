import { JUPYTER_PORT } from "../lib/constants";
import { execFile } from "child_process";
import { exists } from "drizzle-orm";
import path from "path";

// IMPORTANT: before, "include/python/bin/pip install jupyterlab" must be executed

const IS_DEV = process.env.NODE_ENV === "development";

const includePath = IS_DEV
  ? path.join(__dirname, "../../include")
  : path.join(process.resourcesPath, "include");

const labDir = path.join(includePath, "lab_dir");
const pythonPath = path.join(includePath, "python");
const configPath = path.join(includePath, "jupyterconfig.json");

const jupyterPath = path.join(pythonPath, "bin", "jupyter");

export const startJupyter = () => {
  console.log(pythonPath);

  const child = execFile(jupyterPath, [
    "lab",
    `--notebook-dir=${labDir}`,
    "--no-browser",
    `--port=${JUPYTER_PORT}`,
    "--NotebookApp.token=''",
    "--NotebookApp.password=''",
    `--config=${configPath}`,
  ]);

  child.stdout?.on("data", (data) => {
    console.log("[JUPYTER]", data);
  });

  return child;
};
