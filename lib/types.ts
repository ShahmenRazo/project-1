import type {
  BillingCycle,
  SubscriptionCategory,
  SubscriptionTier,
} from "@/lib/database.types";

export interface DashboardSubscription {
  id: string;
  name: string;
  category: SubscriptionCategory;
  price: number;
  currency: string;
  billing_cycle: BillingCycle;
  billing_day: number;
  created_at: string;
  group: { id: string; name: string; creator_id: string } | null;
}

export interface DashboardProfile {
  id: string;
  display_name: string | null;
  email: string;
  subscription_tier: SubscriptionTier;
}

export interface DashboardGroup {
  id: string;
  name: string;
  creator_id: string;
  subscription_id: string;
  subscription_name: string | null;
  my_share_percent: number;
  member_count: number;
  owed_by_me: number;
  owed_to_me: number;
  currency: string;
}
