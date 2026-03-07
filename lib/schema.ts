import { pgTable, text, integer, serial, timestamp } from "drizzle-orm/pg-core";

export const requests = pgTable("requests", {
  id: text("id").primaryKey(),
  title: text("title").notNull().default("새 요구사항"),
  status: text("status").notNull().default("chatting"),
  requirementDoc: text("requirement_doc"),
  prototypeHtml: text("prototype_html"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  requestId: text("request_id").notNull().references(() => requests.id),
  role: text("role").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").notNull(),
});

export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  requestId: text("request_id").notNull().references(() => requests.id),
  parentId: integer("parent_id"),
  role: text("role").notNull().default("plan"),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").notNull(),
});

export const apiUsage = pgTable("api_usage", {
  id: serial("id").primaryKey(),
  date: text("date").notNull(),
  model: text("model").notNull(),
  count: integer("count").notNull().default(0),
});
