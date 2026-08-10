export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type SubscriptionCategory =
  | "streaming"
  | "music"
  | "productivity"
  | "gaming"
  | "vpn"
  | "ai"
  | "storage"
  | "other";

export type BillingCycle = "monthly" | "yearly";
export type SubscriptionTier = "free" | "pro";
export type PaymentStatus = "pending" | "paid";
export type NotificationType =
  | "payment_due"
  | "payment_paid"
  | "group_invite"
  | "reminder"
  | "system";

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          display_name: string | null;
          avatar_url: string | null;
          subscription_tier: SubscriptionTier;
          ls_customer_id: string | null;
          ls_subscription_id: string | null;
          ls_subscription_item_id: string | null;
          plan_status: string;
          plan_expires_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          display_name?: string | null;
          avatar_url?: string | null;
          subscription_tier?: SubscriptionTier;
          ls_customer_id?: string | null;
          ls_subscription_id?: string | null;
          ls_subscription_item_id?: string | null;
          plan_status?: string;
          plan_expires_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          display_name?: string | null;
          avatar_url?: string | null;
          subscription_tier?: SubscriptionTier;
          ls_customer_id?: string | null;
          ls_subscription_id?: string | null;
          ls_subscription_item_id?: string | null;
          plan_status?: string;
          plan_expires_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "users_id_fkey";
            columns: ["id"];
            isOneToOne: true;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          category: SubscriptionCategory;
          price: number;
          currency: string;
          billing_cycle: BillingCycle;
          billing_day: number;
          deleted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          category?: SubscriptionCategory;
          price: number;
          currency?: string;
          billing_cycle?: BillingCycle;
          billing_day?: number;
          deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          category?: SubscriptionCategory;
          price?: number;
          currency?: string;
          billing_cycle?: BillingCycle;
          billing_day?: number;
          deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "subscriptions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      groups: {
        Row: {
          id: string;
          name: string;
          creator_id: string;
          subscription_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          creator_id: string;
          subscription_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          creator_id?: string;
          subscription_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "groups_creator_id_fkey";
            columns: ["creator_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "groups_subscription_id_fkey";
            columns: ["subscription_id"];
            isOneToOne: true;
            referencedRelation: "subscriptions";
            referencedColumns: ["id"];
          }
        ];
      };
      group_members: {
        Row: {
          id: string;
          group_id: string;
          user_id: string;
          share_percent: number;
          payment_status: PaymentStatus;
          joined_at: string;
        };
        Insert: {
          id?: string;
          group_id: string;
          user_id: string;
          share_percent?: number;
          payment_status?: PaymentStatus;
          joined_at?: string;
        };
        Update: {
          id?: string;
          group_id?: string;
          user_id?: string;
          share_percent?: number;
          payment_status?: PaymentStatus;
          joined_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "group_members_group_id_fkey";
            columns: ["group_id"];
            isOneToOne: false;
            referencedRelation: "groups";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "group_members_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      payments: {
        Row: {
          id: string;
          group_id: string;
          from_user_id: string;
          to_user_id: string;
          amount: number;
          currency: string;
          status: PaymentStatus;
          due_date: string;
          paid_at: string | null;
          last_reminded_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          group_id: string;
          from_user_id: string;
          to_user_id: string;
          amount: number;
          currency?: string;
          status?: PaymentStatus;
          due_date: string;
          paid_at?: string | null;
          last_reminded_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          group_id?: string;
          from_user_id?: string;
          to_user_id?: string;
          amount?: number;
          currency?: string;
          status?: PaymentStatus;
          due_date?: string;
          paid_at?: string | null;
          last_reminded_at?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "payments_group_id_fkey";
            columns: ["group_id"];
            isOneToOne: false;
            referencedRelation: "groups";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "payments_from_user_id_fkey";
            columns: ["from_user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "payments_to_user_id_fkey";
            columns: ["to_user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      push_subscriptions: {
        Row: {
          id: string;
          user_id: string;
          token: string;
          device: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          token: string;
          device?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          token?: string;
          device?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "push_subscriptions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: NotificationType;
          message: string;
          read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: NotificationType;
          message: string;
          read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: NotificationType;
          message?: string;
          read?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: {
      group_balances: {
        Row: {
          group_id: string;
          group_name: string;
          user_id: string;
          share_percent: number;
          monthly_share: number;
          outstanding: number;
          to_receive: number;
        };
        Relationships: [];
      };
    };
    Functions: {
      is_group_member: {
        Args: { gid: string };
        Returns: boolean;
      };
      is_group_creator: {
        Args: { gid: string };
        Returns: boolean;
      };
    };
  };
}
