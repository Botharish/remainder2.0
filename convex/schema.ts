import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    userId: v.optional(v.string()),
    createdAt: v.optional(v.number()),
  })
    .index("by_email", ["email"])
    .index("by_user_id", ["userId"]),

  clients: defineTable({
    name: v.optional(v.string()),
    clientName: v.optional(v.string()),
    userId: v.optional(v.string()),
    createdBy: v.optional(v.id("users")),
    createdAt: v.number(),
  })
    .index("by_name", ["name"])
    .index("by_client_name", ["clientName"]),

  projects: defineTable({
    clientId: v.optional(v.id("clients")),
    name: v.optional(v.string()),
    clientName: v.optional(v.string()),
    projectName: v.optional(v.string()),
    userId: v.optional(v.string()),
    createdBy: v.optional(v.id("users")),
    createdAt: v.number(),
  })
    .index("by_client_id_name", ["clientId", "name"])
    .index("by_client_project_names", ["clientName", "projectName"]),

  reminders: defineTable({
    clientId: v.optional(v.id("clients")),
    projectId: v.optional(v.id("projects")),
    clientName: v.optional(v.string()),
    projectName: v.optional(v.string()),
    status: v.optional(v.string()),
    reminderDate: v.optional(v.number()),
    date: v.optional(v.string()),
    time: v.optional(v.string()),
    reminderTime: v.optional(v.string()),
    notes: v.optional(v.string()),
    completed: v.optional(v.boolean()),
    notifiedAt: v.optional(v.number()),
    userId: v.optional(v.string()),
    createdBy: v.optional(v.id("users")),
    createdAt: v.optional(v.number()),
    updatedAt: v.optional(v.number()),
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
    userId: v.optional(v.string()),
    createdBy: v.optional(v.id("users")),
    createdAt: v.number(),
  }).index("by_created_at", ["createdAt"]),

  logs: defineTable({
    type: v.optional(v.string()),
    action: v.optional(v.string()),
    message: v.optional(v.string()),
    description: v.optional(v.string()),
    userId: v.optional(v.string()),
    reminderId: v.optional(v.id("reminders")),
    createdAt: v.number(),
  }).index("by_created_at", ["createdAt"]),
});
