import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { prisma } from "./lib/prisma.js";

async function main() {
  // Verify database connectivity on boot for a clear failure message.
  await prisma.$connect();

  const app = createApp();
  const server = app.listen(env.port, () => {
    console.log(`\n  AssetFlow API running at http://localhost:${env.port}`);
    console.log(`  Environment: ${env.nodeEnv}`);
    console.log(`  Health check: http://localhost:${env.port}/api/health\n`);
  });

  const shutdown = async (signal: string) => {
    console.log(`\n${signal} received — shutting down gracefully...`);
    server.close();
    await prisma.$disconnect();
    process.exit(0);
  };
  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
}

main().catch(async (err) => {
  console.error("Failed to start AssetFlow API:", err);
  await prisma.$disconnect();
  process.exit(1);
});
