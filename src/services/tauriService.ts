import { invoke } from "@tauri-apps/api/core";

// Types matching your Rust structs
export interface BalanceChangeEvent {
  id: string;
  amount_sats: number;
  value_cents: number | null;
  event_type: 'Buy' | 'Sell' | 'Fee';
  memo: string | null;
  timestamp: string; // ISO date string from Rust
  created_at: string; // ISO date string from Rust
}

export interface CreateBalanceChangeEventRequest {
  amount_sats: number;
  value_cents: number | null;
  event_type: 'Buy' | 'Sell' | 'Fee';
  memo: string | null;
  timestamp: string; // ISO date string
}

export interface UpdateBalanceChangeEventRequest {
  amount_sats: number;
  value_cents: number | null;
  event_type: 'Buy' | 'Sell' | 'Fee';
  memo: string | null;
  timestamp: string; // ISO date string
}

export interface PaginatedBalanceChangeEvents {
  events: BalanceChangeEvent[];
  total_count: number;
  page: number;
  page_size: number;
  total_pages: number;
  has_more: boolean;
}

export interface PortfolioMetrics {
  current_sats: number;
  total_sats_stacked: number;
  avg_buy_price: number | null;
  total_invested_cents: number;
  avg_sell_price: number | null;
  fiat_extracted_cents: number;
  total_sats_spent: number;
}

export interface CreateUndocumentedLumpsumRequest {
  start_date: string;
  end_date: string;
  total_sats: number;
  total_usd_cents: number;
  frequency: 'daily' | 'weekly' | 'monthly';
  memo?: string;
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
    pageSize: number = 100
  ): Promise<PaginatedBalanceChangeEvents> {
    return await invoke("get_balance_change_events", { 
      page, 
      pageSize 
    });
  }

  // Update a balance change event
  static async updateBalanceChangeEvent(
    id: string,
    request: UpdateBalanceChangeEventRequest
  ): Promise<BalanceChangeEvent> {
    return await invoke("update_balance_change_event", { id, request });
  }

  // Delete a balance change event
  static async deleteBalanceChangeEvent(id: string): Promise<void> {
    return await invoke("delete_balance_change_event", { id });
  }

  // Get portfolio metrics
  static async getPortfolioMetrics(): Promise<PortfolioMetrics> {
    return await invoke("get_portfolio_metrics");
  }

  // Import Sat Tracker v1 data
  static async importSatTrackerV1Data(): Promise<string> {
    return await invoke("import_sat_tracker_v1_data");
  }

  // Create undocumented lumpsum events
  static async createUndocumentedLumpsumEvents(
    request: CreateUndocumentedLumpsumRequest
  ): Promise<BalanceChangeEvent[]> {
    return await invoke("create_undocumented_lumpsum_events", {
      startDate: request.start_date,
      endDate: request.end_date,
      totalSats: request.total_sats,
      totalUsdCents: request.total_usd_cents,
      frequency: request.frequency,
      memo: request.memo
    });
  }
}

// Export individual functions for convenience
export const {
  createBalanceChangeEvent,
  getBalanceChangeEvents,
  updateBalanceChangeEvent,
  deleteBalanceChangeEvent,
  getPortfolioMetrics,
  importSatTrackerV1Data,
  createUndocumentedLumpsumEvents
} = TauriService;
