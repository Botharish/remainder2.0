import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    name: v.string(),
    email: v.optional(v.string()),
  }).index("by_email", ["email"]),

  clients: defineTable({
    name: v.string(),
    createdBy: v.optional(v.id("users")),
    createdAt: v.number(),
  }).index("by_name", ["name"]),

  projects: defineTable({
    clientId: v.id("clients"),
    name: v.string(),
    createdBy: v.optional(v.id("users")),
    createdAt: v.number(),
  }).index("by_client_name", ["clientId", "name"]),

  reminders: defineTable({
    clientId: v.optional(v.id("clients")),
    projectId: v.optional(v.id("projects")),
    clientName: v.string(),
    projectName: v.string(),
    status: v.string(),
    reminderDate: v.number(),
    reminderTime: v.string(),
    notes: v.string(),
    completed: v.boolean(),
    notifiedAt: v.optional(v.number()),
    createdBy: v.optional(v.id("users")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_due", ["completed", "reminderDate"])
    .index("by_client", ["clientName"])
    .index("by_project", ["projectName"]),

  importHistory: defineTable({
    fileName: v.string(),
    clientsCreated: v.number(),
    projectsCreated: v.number(),
    remindersCreated: v.number(),
    skippedRows: v.number(),
    createdBy: v.optional(v.id("users")),
    createdAt: v.number(),
  }).index("by_created_at", ["createdAt"]),

  logs: defineTable({
    type: v.string(),
    message: v.string(),
    reminderId: v.optional(v.id("reminders")),
    createdAt: v.number(),
  }).index("by_created_at", ["createdAt"]),
});
