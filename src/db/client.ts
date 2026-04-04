import { drizzle } from "drizzle-orm/d1";
import type { BaseSQLiteDatabase } from "drizzle-orm/sqlite-core";
import type * as schema from "./schema";

export type AppBindings = {
  DB: D1Database;
};

type DB = BaseSQLiteDatabase<"async", unknown, typeof schema>;

export const database = (db: D1Database): DB => drizzle(db);
