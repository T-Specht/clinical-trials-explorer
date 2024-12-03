import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema.ts",
  dialect: "sqlite",
  out: "./drizzle",
  dbCredentials: {
    url: "file:sqlite.db",
  },
});

// export default defineConfig({
//     dialect: 'postgresql',
//     out: './src/drizzle',
//     schema: './src/db/schema.ts',
//     dbCredentials: {
//         url: 'postgresql://postgres:example@localhost:5433/postgres?statusColor=F8F8F8&env=local&name=Postgres%20in%20Docker&tLSMode=0&usePrivateKey=false&safeModeLevel=0&advancedSafeModeLevel=0&driverVersion=0&lazyload=true'
//     },
//     // Print all statements
//     verbose: true,
//     // Always ask for confirmation
//     strict: true,
//   });
