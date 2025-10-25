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

export class TauriService {
  // Create a new balance change event
  static async createBalanceChangeEvent(
    request: CreateBalanceChangeEventRequest
  ): Promise<BalanceChangeEvent> {
    return await invoke("create_balance_change_event", { request });
  }

  // Get all balance change events
  static async getBalanceChangeEvents(): Promise<BalanceChangeEvent[]> {
    return await invoke("get_balance_change_events");
  }
}

// Export individual functions for convenience
export const {
  createBalanceChangeEvent,
  getBalanceChangeEvents
} = TauriService;
