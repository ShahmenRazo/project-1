import { z } from "zod";

export const subscriptionSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  category: z
    .enum([
      "streaming",
      "music",
      "productivity",
      "gaming",
      "vpn",
      "ai",
      "storage",
      "other",
    ])
    .default("other"),
  price: z.number().positive("Price must be positive").max(100_000).multipleOf(0.01),
  currency: z
    .string()
    .trim()
    .length(3, "Currency must be 3 letters (e.g. USD)")
    .transform((v) => v.toUpperCase())
    .default("USD"),
  billing_cycle: z.enum(["monthly", "yearly"]).default("monthly"),
  billing_day: z.number().int().min(1).max(28).default(1),
});

export const subscriptionUpdateSchema = subscriptionSchema.partial();

export const memberSchema = z
  .object({
    user_id: z.string().uuid().optional(),
    email: z.string().trim().email().optional(),
    share_percent: z.number().positive().max(100).multipleOf(0.01),
  })
  .refine((v) => v.user_id !== undefined || v.email !== undefined, {
    message: "Provide user_id or email",
    path: ["user_id"],
  });

export const createGroupSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  subscription_id: z.string().uuid(),
  members: z.array(memberSchema).max(50).default([]),
});

export const addMemberSchema = memberSchema;

export const pushSubscriptionSchema = z.object({
  token: z.string().trim().min(10).max(1024),
  device: z.string().trim().min(1).max(50).default("web"),
});

export const pushUnsubscribeSchema = z.object({
  token: z.string().trim().min(10).max(1024),
});

export const notificationsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  unread_only: z
    .enum(["true", "false"])
    .default("false")
    .transform((v) => v === "true"),
});

export type SubscriptionInput = z.infer<typeof subscriptionSchema>;
export type MemberInput = z.infer<typeof memberSchema>;
export type CreateGroupInput = z.infer<typeof createGroupSchema>;
