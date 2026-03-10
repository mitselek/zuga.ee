import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    // "forks" is required because server.ts has module-level side effects
    // (http.createServer + server.listen + setInterval) that execute on import.
    // Without process isolation each test file would share the same server
    // instance and port, causing EADDRINUSE conflicts.
    pool: "forks",
  },
});
