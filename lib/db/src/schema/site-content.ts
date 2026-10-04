import { createInsertSchema } from "drizzle-zod";
import { jsonb, pgTable, timestamp, varchar } from "drizzle-orm/pg-core";
import { z } from "zod/v4";

export interface StoredSiteMember {
  id: string;
  name: string;
  alias: string;
  description: string;
  channel: string;
  imageUrl: string | null;
}

export interface StoredSiteContent {
  members: StoredSiteMember[];
  theme: {
    base: string;
    violet: string;
    magenta: string;
  };
}

export const siteContentTable = pgTable("xov_site_content", {
  id: varchar("id").primaryKey(),
  content: jsonb("content").$type<StoredSiteContent>().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const insertSiteContentSchema = createInsertSchema(siteContentTable).omit({
  updatedAt: true,
});
export type InsertSiteContent = z.infer<typeof insertSiteContentSchema>;
export type SiteContentRecord = typeof siteContentTable.$inferSelect;