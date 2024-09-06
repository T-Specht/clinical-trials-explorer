import helmet from "helmet";
import { createProxyMiddleware } from "http-proxy-middleware";
import express from "express";

const app = express();

app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: false,
      directives: {
        // defaultSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        defaultSrc:
          "* data: mediastream: blob: filesystem: about: ws: wss: 'unsafe-eval' 'wasm-unsafe-eval' 'unsafe-inline'",
        scriptSrc: "* data: blob: 'unsafe-inline' 'unsafe-eval'",
        connectSrc: "* data: blob: 'unsafe-inline'",
        imgSrc: "* data: blob: 'unsafe-inline'",
        frameSrc: "* data: blob:",
        styleSrc: "* data: blob: 'unsafe-inline'",
        fontSrc: "* data: blob: 'unsafe-inline'",
        //frameAncestors: "* data: blob: 'unsafe-inline'",
        frameAncestors: ["*", "file:", "http://localhost:*", "http://127.0.0.1:*"],
      },
    },
  })
);

app.use(
  "/",
  createProxyMiddleware({
    target: "https://clinicaltrials.gov/",
    changeOrigin: true,
  })
);

export default app;
