import { invoke } from "@tauri-apps/api/core";

// Types matching your Rust structs
export interface BalanceChangeEvent {
  id: string;
  amount_sats: number;
  value_cents: number | null;
  event_type: 'Buy' | 'Sell' | 'Fee';
  memo: string | null;
  created_at: string; // ISO date string from Rust
}

export interface CreateBalanceChangeEventRequest {
  amount_sats: number;
  value_cents: number | null;
  event_type: 'Buy' | 'Sell' | 'Fee';
  memo: string | null;
}

export interface PaginatedBalanceChangeEvents {
  events: BalanceChangeEvent[];
  total_count: number;
  page: number;
  page_size: number;
  total_pages: number;
  has_more: boolean;
}

export class TauriService {
  // Create a new balance change event
  static async createBalanceChangeEvent(
    request: CreateBalanceChangeEventRequest
  ): Promise<BalanceChangeEvent> {
    return await invoke("create_balance_change_event", { request });
  }

  // Get paginated balance change events with simple parameters
  static async getBalanceChangeEvents(
    page: number = 0,
    pageSize: number = 10
  ): Promise<PaginatedBalanceChangeEvents> {
    return await invoke("get_balance_change_events", { 
      page, 
      pageSize 
    });
  }
}

// Export individual functions for convenience
export const {
  createBalanceChangeEvent,
  getBalanceChangeEvents
} = TauriService;
