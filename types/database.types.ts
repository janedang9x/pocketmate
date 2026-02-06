export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      user_account: {
        Row: {
          created_at: string | null;
          id: string;
          is_active: boolean | null;
          password: string;
          updated_at: string | null;
          user_name: string;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          password: string;
          updated_at?: string | null;
          user_name: string;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          password?: string;
          updated_at?: string | null;
          user_name?: string;
        };
        Relationships: [];
      };
      financial_account: {
        Row: {
          created_at: string | null;
          id: string;
          name: string;
          currency: string;
          type: "Bank Account" | "Credit Card" | "E-wallet" | "Cash";
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          name: string;
          currency: string;
          type: "Bank Account" | "Credit Card" | "E-wallet" | "Cash";
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          name?: string;
          currency?: string;
          type?: "Bank Account" | "Credit Card" | "E-wallet" | "Cash";
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "financial_account_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "user_account";
            referencedColumns: ["id"];
          },
        ];
      };
      expense_categories: {
        Row: {
          created_at: string | null;
          id: string;
          name: string;
          parent_category_id: string | null;
          user_id: string | null;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          name: string;
          parent_category_id?: string | null;
          user_id?: string | null;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          name?: string;
          parent_category_id?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "expense_categories_parent_category_id_fkey";
            columns: ["parent_category_id"];
            referencedRelation: "expense_categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "expense_categories_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "user_account";
            referencedColumns: ["id"];
          },
        ];
      };
      income_categories: {
        Row: {
          created_at: string | null;
          id: string;
          name: string;
          user_id: string | null;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          name: string;
          user_id?: string | null;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          name?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "income_categories_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "user_account";
            referencedColumns: ["id"];
          },
        ];
      };
      counterparty: {
        Row: {
          created_at: string | null;
          id: string;
          name: string;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          name: string;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          name?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "counterparty_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "user_account";
            referencedColumns: ["id"];
          },
        ];
      };
      transaction: {
        Row: {
          amount: number;
          counterparty_id: string | null;
          created_at: string | null;
          currency: string;
          date_time: string;
          details: string | null;
          expense_category_id: string | null;
          from_account_id: string | null;
          id: string;
          income_category_id: string | null;
          payment_method: string | null;
          to_account_id: string | null;
          type: "Expense" | "Income" | "Transfer" | "Borrow";
          updated_at: string | null;
          user_id: string;
          vnd_exchange: number | null;
        };
        Insert: {
          amount: number;
          counterparty_id?: string | null;
          created_at?: string | null;
          currency: string;
          date_time: string;
          details?: string | null;
          expense_category_id?: string | null;
          from_account_id?: string | null;
          id?: string;
          income_category_id?: string | null;
          payment_method?: string | null;
          to_account_id?: string | null;
          type: "Expense" | "Income" | "Transfer" | "Borrow";
          updated_at?: string | null;
          user_id: string;
          vnd_exchange?: number | null;
        };
        Update: {
          amount?: number;
          counterparty_id?: string | null;
          created_at?: string | null;
          currency?: string;
          date_time?: string;
          details?: string | null;
          expense_category_id?: string | null;
          from_account_id?: string | null;
          id?: string;
          income_category_id?: string | null;
          payment_method?: string | null;
          to_account_id?: string | null;
          type?: "Expense" | "Income" | "Transfer" | "Borrow";
          updated_at?: string | null;
          user_id?: string;
          vnd_exchange?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "transaction_counterparty_id_fkey";
            columns: ["counterparty_id"];
            referencedRelation: "counterparty";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "transaction_expense_category_id_fkey";
            columns: ["expense_category_id"];
            referencedRelation: "expense_categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "transaction_from_account_id_fkey";
            columns: ["from_account_id"];
            referencedRelation: "financial_account";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "transaction_income_category_id_fkey";
            columns: ["income_category_id"];
            referencedRelation: "income_categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "transaction_to_account_id_fkey";
            columns: ["to_account_id"];
            referencedRelation: "financial_account";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "transaction_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "user_account";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
