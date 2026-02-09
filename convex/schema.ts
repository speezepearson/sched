import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  events: defineTable({
    name: v.string(),
    description: v.string(),
    slots: v.array(v.string()), // "YYYY-MM-DD:HH" format
  }),
  votes: defineTable({
    eventId: v.id("events"),
    voterName: v.string(),
    ratings: v.array(
      v.object({
        slot: v.string(),
        rating: v.union(
          v.literal("great"),
          v.literal("good"),
          v.literal("fine")
        ),
      })
    ),
  }).index("by_event", ["eventId"]),
});
