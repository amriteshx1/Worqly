import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const connectionString =
  process.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5433/worqly";

const client = postgres(connectionString, {
  max: 5
});

export const db = drizzle(client);

