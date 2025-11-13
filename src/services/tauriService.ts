import { invoke } from "@tauri-apps/api/core";

// Types matching your Rust structs
export interface BitcoinTransaction {
  id: string;
  type: "Buy" | "Sell" | "Fee";
  amount_sats: number;
  fiat_amount_cents: number | null;
  fee_fiat_cents: number | null;
  memo: string | null;
  timestamp: string; // ISO date string from Rust
  created_at: string; // ISO date string from Rust
}

export interface CreateBitcoinTransactionRequest {
  type: "Buy" | "Sell" | "Fee";
  amount_sats: number;
  fiat_amount_cents: number | null;
  fee_fiat_cents: number | null;
  memo: string | null;
  timestamp: string; // ISO date string
}

export interface UpdateBitcoinTransactionRequest {
  type: "Buy" | "Sell" | "Fee";
  amount_sats: number;
  fiat_amount_cents: number | null;
  fee_fiat_cents: number | null;
  memo: string | null;
  timestamp: string; // ISO date string
}

// Edit data type for form state (allows string values during editing)
export interface EditBitcoinTransactionData {
  type: "Buy" | "Sell" | "Fee";
  amount_sats: number | string;
  fiat_amount_cents: number | string | null;
  fee_fiat_cents: number | string | null;
  memo: string | null;
  timestamp: string;
}

export interface PaginatedBitcoinTransactions {
  transactions: BitcoinTransaction[];
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
  sats_stacked_7d: number;
  usd_invested_7d_cents: number;
  sats_stacked_31d: number;
  usd_invested_31d_cents: number;
}

export interface CreateUndocumentedLumpsumRequest {
  start_date: string;
  end_date: string;
  total_sats: number;
  total_usd_cents: number;
  frequency: "daily" | "weekly" | "monthly";
  memo?: string;
}

export interface DatabaseStatus {
  is_encrypted: boolean;
  needs_password: boolean;
}

export interface PasswordValidationResult {
  is_valid: boolean;
  error_message?: string;
}

export interface AnnouncementsResponse {
  latest_version: string;
  announcements: string[];
}

export interface ActivityMetrics {
  current_streak_weeks: number;
  longest_streak_weeks: number;
  sats_stacked_this_year: number;
  consistency_score_percent: number;
  best_stacking_day: string | null;
  best_day_percentage: number;
  consistency_rating: string;
  weeks_to_next_milestone: number | null;
  next_milestone_description: string | null;
  heatmap_data: YearHeatmapData[];
}

export interface YearHeatmapData {
  year: number;
  weeks: WeekData[];
  max_sats: number;
}

export interface WeekData {
  days: DayData[];
}

export interface DayData {
  date: string; // ISO date string (YYYY-MM-DD)
  sats: number;
  level: number; // 0-4 for color intensity
}

export class TauriService {
  // Create a new bitcoin transaction
  static async createBitcoinTransaction(
    request: CreateBitcoinTransactionRequest
  ): Promise<BitcoinTransaction> {
    return await invoke("create_bitcoin_transaction", { request });
  }

  // Get paginated bitcoin transactions with simple parameters
  static async getBitcoinTransactions(
    page: number = 0,
    pageSize: number = 100
  ): Promise<PaginatedBitcoinTransactions> {
    return await invoke("get_bitcoin_transactions", {
      page,
      pageSize,
    });
  }

  // Update a bitcoin transaction
  static async updateBitcoinTransaction(
    id: string,
    request: UpdateBitcoinTransactionRequest
  ): Promise<BitcoinTransaction> {
    return await invoke("update_bitcoin_transaction", { id, request });
  }

  // Delete a bitcoin transaction
  static async deleteBitcoinTransaction(id: string): Promise<void> {
    return await invoke("delete_bitcoin_transaction", { id });
  }

  // Get portfolio metrics
  static async getPortfolioMetrics(): Promise<PortfolioMetrics> {
    return await invoke("get_portfolio_metrics");
  }

  // Import Sat Tracker v1 data
  static async importSatTrackerV1Data(): Promise<string> {
    return await invoke("import_sat_tracker_v1_data");
  }

  // Create undocumented lumpsum transactions
  static async createUndocumentedLumpsumTransactions(
    request: CreateUndocumentedLumpsumRequest
  ): Promise<BitcoinTransaction[]> {
    return await invoke("create_undocumented_lumpsum_transactions", {
      startDate: request.start_date,
      endDate: request.end_date,
      totalSats: request.total_sats,
      totalUsdCents: request.total_usd_cents,
      frequency: request.frequency,
      memo: request.memo,
    });
  }

  // Encryption-related commands
  static async checkDatabaseStatus(): Promise<DatabaseStatus> {
    return await invoke("check_database_status");
  }

  static async validateDatabasePassword(
    password: string
  ): Promise<PasswordValidationResult> {
    return await invoke("validate_database_password", { password });
  }

  static async encryptDatabase(password: string): Promise<string> {
    return await invoke("encrypt_database", { password });
  }

  static async changeDatabasePassword(
    oldPassword: string,
    newPassword: string
  ): Promise<string> {
    return await invoke("change_database_password", {
      oldPassword,
      newPassword,
    });
  }

  static async initializeDatabaseWithPassword(
    password?: string
  ): Promise<string> {
    return await invoke("initialize_database_with_password", { password });
  }

  static async updateMenuForDatabaseStatus(isUnlocked: boolean): Promise<void> {
    return await invoke("update_menu_for_database_status", { isUnlocked });
  }

  // Fetch announcements from API
  static async fetchAnnouncements(): Promise<AnnouncementsResponse> {
    return await invoke("fetch_announcements");
  }

  // Get activity metrics
  static async getActivityMetrics(): Promise<ActivityMetrics> {
    console.log("Fetching activity metrics");
    return await invoke("get_activity_metrics");
  }

  // Import CSV data
  static async importCsvData(filePath: string): Promise<BitcoinTransaction[]> {
    return await invoke("import_csv_data", { filePath });
  }

  // Analyze CSV file
  static async analyzeCsvFile(filePath: string): Promise<any> {
    return await invoke("analyze_csv_file", { filePath });
  }
}

// Export individual functions for convenience
export const {
  createBitcoinTransaction,
  getBitcoinTransactions,
  updateBitcoinTransaction,
  deleteBitcoinTransaction,
  getPortfolioMetrics,
  importSatTrackerV1Data,
  createUndocumentedLumpsumTransactions,
} = TauriService;
