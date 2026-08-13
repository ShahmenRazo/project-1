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
    feature_flags: {
      Row: {
        name: string;
        enabled: boolean;
        rollout_percent: number;
        target: "all" | "pro_only" | "beta_users";
        created_at: string;
      };
      Insert: {
        name: string;
        enabled?: boolean;
        rollout_percent?: number;
        target?: "all" | "pro_only" | "beta_users";
        created_at?: string;
      };
      Update: {
        name?: string;
        enabled?: boolean;
        rollout_percent?: number;
        target?: "all" | "pro_only" | "beta_users";
        created_at?: string;
      };
      Relationships: [];
    };
      users: {
        Row: {
          id: string;
          email: string;
          display_name: string | null;
          username: string | null;
          venmo_username: string | null;
          cash_tag: string | null;
          zelle_email: string | null;
          zelle_phone: string | null;
          avatar_url: string | null;
          onboarding_completed: boolean;
          phone_number: string | null;
          subscription_tier: SubscriptionTier;
          ls_customer_id: string | null;
          ls_subscription_id: string | null;
          ls_subscription_item_id: string | null;
          plan_status: string;
          plan_expires_at: string | null;
          role: "user" | "admin";
          banned: boolean;
          is_beta: boolean;
          last_active: string | null;
          country: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          display_name?: string | null;
          username?: string | null;
          venmo_username?: string | null;
          cash_tag?: string | null;
          zelle_email?: string | null;
          zelle_phone?: string | null;
          avatar_url?: string | null;
          onboarding_completed?: boolean;
          phone_number?: string | null;
          subscription_tier?: SubscriptionTier;
          ls_customer_id?: string | null;
          ls_subscription_id?: string | null;
          ls_subscription_item_id?: string | null;
          plan_status?: string;
          plan_expires_at?: string | null;
          role?: "user" | "admin";
          banned?: boolean;
          is_beta?: boolean;
          last_active?: string | null;
          country?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          display_name?: string | null;
          username?: string | null;
          venmo_username?: string | null;
          cash_tag?: string | null;
          zelle_email?: string | null;
          zelle_phone?: string | null;
          avatar_url?: string | null;
          onboarding_completed?: boolean;
          phone_number?: string | null;
          subscription_tier?: SubscriptionTier;
          ls_customer_id?: string | null;
          ls_subscription_id?: string | null;
          ls_subscription_item_id?: string | null;
          plan_status?: string;
          plan_expires_at?: string | null;
          role?: "user" | "admin";
          banned?: boolean;
          is_beta?: boolean;
          last_active?: string | null;
          country?: string | null;
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
          status: PaymentStatus | "initiated";
          method: string | null;
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
          status?: PaymentStatus | "initiated";
          method?: string | null;
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
          status?: PaymentStatus | "initiated";
          method?: string | null;
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
      invites: {
        Row: {
          id: string;
          group_id: string;
          email: string;
          token: string;
          share_percent: number;
          status: "pending" | "accepted" | "expired";
          expires_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          group_id: string;
          email: string;
          token: string;
          share_percent: number;
          status?: "pending" | "accepted" | "expired";
          expires_at: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          group_id?: string;
          email?: string;
          token?: string;
          share_percent?: number;
          status?: "pending" | "accepted" | "expired";
          expires_at?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "invites_group_id_fkey";
            columns: ["group_id"];
            isOneToOne: false;
            referencedRelation: "groups";
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
          image_url: string | null;
          read: boolean;
          read_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: NotificationType;
          message: string;
          image_url?: string | null;
          read?: boolean;
          read_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: NotificationType;
          message?: string;
          image_url?: string | null;
          read?: boolean;
          read_at?: string | null;
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
      waitlist: {
        Row: {
          id: string;
          email: string;
          source: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          source?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          source?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      error_reports: {
        Row: {
          id: string;
          user_id: string | null;
          message: string | null;
          stack: string | null;
          path: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          message?: string | null;
          stack?: string | null;
          path?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          message?: string | null;
          stack?: string | null;
          path?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "error_reports_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      referrals: {
        Row: {
          id: string;
          user_id: string;
          referred_by: string;
          created_at: string;
          converted: boolean;
          converted_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          referred_by: string;
          created_at?: string;
          converted?: boolean;
          converted_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          referred_by?: string;
          created_at?: string;
          converted?: boolean;
          converted_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "referrals_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "referrals_referred_by_fkey";
            columns: ["referred_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      public_invites: {
        Row: {
          id: string;
          group_id: string;
          token: string;
          created_by: string;
          max_uses: number;
          uses_count: number;
          expires_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          group_id: string;
          token: string;
          created_by: string;
          max_uses?: number;
          uses_count?: number;
          expires_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          group_id?: string;
          token?: string;
          created_by?: string;
          max_uses?: number;
          uses_count?: number;
          expires_at?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "public_invites_group_id_fkey";
            columns: ["group_id"];
            isOneToOne: false;
            referencedRelation: "groups";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "public_invites_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
    ls_orders: {
      Row: {
        id: string;
        user_id: string | null;
        email: string | null;
        amount: number;
        currency: string;
        status: "succeeded" | "failed" | "refunded";
        payment_method: string;
        invoice_id: string | null;
        ls_order_id: string | null;
        created_at: string;
      };
      Insert: {
        id?: string;
        user_id?: string | null;
        email?: string | null;
        amount: number;
        currency?: string;
        status?: "succeeded" | "failed" | "refunded";
        payment_method?: string;
        invoice_id?: string | null;
        ls_order_id?: string | null;
        created_at?: string;
      };
      Update: {
        id?: string;
        user_id?: string | null;
        email?: string | null;
        amount?: number;
        currency?: string;
        status?: "succeeded" | "failed" | "refunded";
        payment_method?: string;
        invoice_id?: string | null;
        ls_order_id?: string | null;
        created_at?: string;
      };
      Relationships: [];
    };
    admin_logs: {
      Row: {
        id: string;
        user_id: string | null;
        action: "ban_user" | "unban_user" | "delete_user" | "impersonate" | "refund" | "toggle_pro" | "flag_create" | "flag_update" | "flag_delete";
        target_id: string | null;
        target_email: string | null;
        metadata: Record<string, unknown>;
        ip_address: string | null;
        created_at: string;
      };
      Insert: {
        id?: string;
        user_id?: string | null;
        action: "ban_user" | "unban_user" | "delete_user" | "impersonate" | "refund" | "toggle_pro" | "flag_create" | "flag_update" | "flag_delete";
        target_id?: string | null;
        target_email?: string | null;
        metadata?: Record<string, unknown>;
        ip_address?: string | null;
        created_at?: string;
      };
      Update: {
        id?: string;
        user_id?: string | null;
        action?: "ban_user" | "unban_user" | "delete_user" | "impersonate" | "refund" | "toggle_pro" | "flag_create" | "flag_update" | "flag_delete";
        target_id?: string | null;
        target_email?: string | null;
        metadata?: Record<string, unknown>;
        ip_address?: string | null;
        created_at?: string;
      };
      Relationships: [
        {
          foreignKeyName: "admin_logs_user_id_fkey";
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
      admin_hard_delete_user: {
        Args: { p_uid: string };
        Returns: undefined;
      };
      admin_kpi: {
        Args: Record<PropertyKey, never>;
        Returns: unknown;
      };
      admin_cohorts: {
        Args: Record<PropertyKey, never>;
        Returns: unknown;
      };
      admin_funnel: {
        Args: Record<PropertyKey, never>;
        Returns: unknown;
      };
    };
  };
}
