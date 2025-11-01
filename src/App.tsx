import React, { useState, useEffect } from "react";
import {
  TauriService,
  BalanceChangeEvent,
  PortfolioMetrics,
  DatabaseStatus,
} from "./services/tauriService";
import SatsHoldingsChart from "./components/SatsHoldingsChart";
import LumpsumModal from "./components/LumpsumModal";
import DateTimeInput from "./components/DateTimeInput";
import Announcements from "./components/Announcements";
import PasswordPromptModal from "./components/PasswordPromptModal";
import EncryptionSettings from "./components/EncryptionSettings";
import { useBitcoinPrice } from "./hooks/useBitcoinPrice";
import { listen } from "@tauri-apps/api/event";
import "./App.css";

const EventItem = React.memo(
  ({
    event,
    isEditing,
    isCreating,
    onEdit,
    onSave,
    onDelete,
    onCancel,
    editData,
    onEditDataChange,
  }: {
    event: BalanceChangeEvent | null; // Allow null for new events
    isEditing: boolean;
    isCreating?: boolean; // New prop to indicate creation mode
    onEdit: () => void;
    onSave: () => void;
    onDelete: () => void;
    onCancel: () => void;
    editData: any;
    onEditDataChange: (field: string, value: any) => void;
  }) => {
    if (isEditing || isCreating) {
      return (
        <div className="border-b border-[rgba(247,243,227,0.2)] bg-[rgba(247,243,227,0.08)]">
          {/* Show original event data in collapsed form */}
          {!isCreating && event && (
            <div className="px-4 py-1 text-xs border-b border-[rgba(247,243,227,0.1)] bg-[rgba(247,243,227,0.03)]">
              <div
                className="grid gap-2 items-center opacity-60"
                style={{
                  gridTemplateColumns: "2fr 0.8fr 1.5fr 1.3fr 1fr 1.5fr 0.8fr",
                }}
              >
                <div className="text-[rgba(247,243,227,0.5)] text-xs">
                  {new Date(event.timestamp)
                    .toLocaleString("en-US", {
                      year: "numeric",
                      month: "2-digit",
                      day: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: true,
                    })
                    .replace(",", "")}
                </div>
                <div className="text-[rgba(247,243,227,0.5)] text-xs">
                  {event.event_type}
                </div>
                <div className="text-[rgba(247,243,227,0.5)] text-xs">
                  {event.amount_sats.toLocaleString()} sats
                </div>
                <div className="text-[rgba(247,243,227,0.5)] text-xs">
                  {event.value_cents
                    ? `$${(event.value_cents / 100).toFixed(2)}`
                    : "-"}
                </div>
                <div className="text-[rgba(247,243,227,0.5)] text-xs">-</div>
                <div className="text-[rgba(247,243,227,0.5)] text-xs truncate">
                  {event.memo || "-"}
                </div>
                <div className="text-[rgba(247,243,227,0.5)] text-xs">
                  Editing...
                </div>
              </div>
            </div>
          )}

          {/* Compact edit form */}
          <div className="px-4 py-2 bg-[rgba(247,243,227,0.03)] border-l-2 border-blue-500">
            {/* Main edit row */}
            <div
              className="grid gap-2 items-end mb-2"
              style={{ gridTemplateColumns: "2fr 0.8fr 1.5fr 1.3fr 1.5fr" }}
            >
              {/* Date & Time */}
              <div>
                <label className="block text-[rgba(247,243,227,0.6)] text-xs mb-1">
                  Date & Time
                </label>
                <DateTimeInput
                  value={editData.timestamp || new Date().toISOString()}
                  onChange={(isoTimestamp) => {
                    onEditDataChange("timestamp", isoTimestamp);
                  }}
                />
              </div>

              {/* Event Type */}
              <div>
                <label className="block text-[rgba(247,243,227,0.6)] text-xs mb-1">
                  Type
                </label>
                <select
                  value={editData.event_type}
                  onChange={(e) => {
                    const newType = e.target.value;
                    onEditDataChange("event_type", newType);
                    if (newType === "Fee") {
                      onEditDataChange("value_cents", null);
                    }
                  }}
                  className="w-full bg-[#090C08] border border-[rgba(247,243,227,0.3)] text-[#F7F3E3] px-2 py-1 text-xs rounded"
                  style={{
                    backgroundColor: "#090C08",
                    color: "#F7F3E3",
                    appearance: "none",
                    WebkitAppearance: "none",
                    MozAppearance: "none",
                  }}
                >
                  <option
                    value="Buy"
                    style={{ backgroundColor: "#090C08", color: "#F7F3E3" }}
                  >
                    Buy
                  </option>
                  <option
                    value="Sell"
                    style={{ backgroundColor: "#090C08", color: "#F7F3E3" }}
                  >
                    Sell
                  </option>
                  <option
                    value="Fee"
                    style={{ backgroundColor: "#090C08", color: "#F7F3E3" }}
                  >
                    Fee
                  </option>
                </select>
              </div>

              {/* Amount in Sats */}
              <div>
                <label className="block text-[rgba(247,243,227,0.6)] text-xs mb-1">
                  Amount (Sats)
                </label>
                <input
                  type="text"
                  value={
                    editData.amount_sats === ""
                      ? ""
                      : editData.amount_sats?.toString() || ""
                  }
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === "" || /^[1-9]\d*$/.test(value)) {
                      onEditDataChange(
                        "amount_sats",
                        value === "" ? "" : parseInt(value)
                      );
                    }
                  }}
                  className="w-full bg-[#090C08] border border-[rgba(247,243,227,0.3)] text-[#F7F3E3] px-2 py-1 text-xs rounded"
                  placeholder="1000000"
                />
              </div>

              {/* USD Value */}
              <div>
                <label className="block text-[rgba(247,243,227,0.6)] text-xs mb-1">
                  USD{" "}
                  {editData.event_type === "Fee" && (
                    <span className="text-[rgba(247,243,227,0.4)]">(N/A)</span>
                  )}
                </label>
                <input
                  type="text"
                  value={
                    editData.event_type === "Fee"
                      ? "N/A"
                      : editData.value_cents === null ||
                        editData.value_cents === undefined
                      ? ""
                      : editData.value_cents === ""
                      ? ""
                      : typeof editData.value_cents === "string"
                      ? editData.value_cents
                      : (editData.value_cents / 100).toString()
                  }
                  onChange={(e) => {
                    if (editData.event_type === "Fee") return;
                    const value = e.target.value;
                    if (value === "" || /^[0-9]+(\.[0-9]{0,2})?$/.test(value)) {
                      if (value === "") {
                        onEditDataChange("value_cents", "");
                      } else {
                        onEditDataChange("value_cents", value);
                      }
                    }
                  }}
                  onBlur={() => {
                    if (editData.event_type === "Fee") return;
                    if (
                      editData.value_cents &&
                      typeof editData.value_cents === "string"
                    ) {
                      const numValue = parseFloat(editData.value_cents);
                      if (!isNaN(numValue)) {
                        onEditDataChange(
                          "value_cents",
                          Math.round(numValue * 100)
                        );
                      }
                    }
                  }}
                  disabled={editData.event_type === "Fee"}
                  className={`w-full border px-2 py-1 text-xs rounded ${
                    editData.event_type === "Fee"
                      ? "bg-[rgba(9,12,8,0.5)] border-[rgba(247,243,227,0.1)] text-[rgba(247,243,227,0.4)] cursor-not-allowed"
                      : "bg-[#090C08] border-[rgba(247,243,227,0.3)] text-[#F7F3E3]"
                  }`}
                  placeholder={editData.event_type === "Fee" ? "N/A" : "500.00"}
                />
              </div>

              {/* Memo */}
              <div>
                <label className="block text-[rgba(247,243,227,0.6)] text-xs mb-1">
                  Memo
                </label>
                <input
                  type="text"
                  value={editData.memo || ""}
                  onChange={(e) =>
                    onEditDataChange("memo", e.target.value || null)
                  }
                  className="w-full bg-[#090C08] border border-[rgba(247,243,227,0.3)] text-[#F7F3E3] px-2 py-1 text-xs rounded"
                  placeholder="Optional memo"
                />
              </div>
            </div>

            {/* Bottom row with calculated rate and actions */}
            <div className="flex justify-between items-center">
              {/* Calculated BTC/USD Rate */}
              <div className="text-xs text-[rgba(247,243,227,0.6)]">
                {(editData.event_type === "Buy" ||
                  editData.event_type === "Sell") &&
                  editData.amount_sats &&
                  editData.value_cents &&
                  editData.value_cents !== "" && (
                    <span>
                      Rate: $
                      {(
                        Math.abs(editData.value_cents) /
                        100 /
                        (Math.abs(editData.amount_sats) / 100_000_000)
                      ).toLocaleString(undefined, {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      })}
                    </span>
                  )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={onSave}
                  className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 text-xs rounded"
                >
                  {isCreating ? "Create" : "Save"}
                </button>
                {!isCreating && (
                  <button
                    onClick={onDelete}
                    className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 text-xs rounded"
                  >
                    Delete
                  </button>
                )}
                <button
                  onClick={onCancel}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 text-xs rounded"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Regular display mode (only for existing events)
    if (!event) return null;

    return (
      <div className="border-b border-[rgba(247,243,227,0.1)] hover:bg-[rgba(247,243,227,0.1)] px-4 py-1 text-xs group">
        <div
          className="grid gap-2 items-center"
          style={{
            gridTemplateColumns: "2fr 0.8fr 1.5fr 1.3fr 1fr 1.5fr 0.8fr",
          }}
        >
          <div className="text-[rgba(247,243,227,0.5)] text-xs">
            {new Date(event.timestamp)
              .toLocaleString("en-US", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
              })
              .replace(",", "")}
          </div>
          <div
            className={
              `text-[rgba(247,243,227,1)] text-xs border-l-2 border-[rgba(247,243,227,0.3)] pl-2 ` +
              (event.event_type === "Buy"
                ? "border-green-400"
                : event.event_type === "Sell"
                ? "border-red-400"
                : "border-yellow-400")
            }
          >
            {event.event_type}
          </div>
          <div className="text-[rgba(247,243,227,1)] text-xs">
            {event.amount_sats.toLocaleString()} sats
          </div>
          <div className="text-[rgba(247,243,227,0.5)] text-xs">
            {event.value_cents
              ? `$${(event.value_cents / 100).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}`
              : "-"}
          </div>
          <div className="text-[rgba(247,243,227,0.5)] text-xs">
            {(event.event_type === "Buy" || event.event_type === "Sell") &&
            event.amount_sats &&
            event.value_cents
              ? `$${(
                  Math.abs(event.value_cents) /
                  100 /
                  (Math.abs(event.amount_sats) / 100_000_000)
                ).toLocaleString(undefined, {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })}`
              : "-"}
          </div>
          <div
            className="text-[rgba(247,243,227,0.5)] truncate text-xs"
            title={event.memo || ""}
          >
            {event.memo || "-"}
          </div>
          <div className="flex justify-end">
            <button
              onClick={onEdit}
              className="opacity-0 group-hover:opacity-100 bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 text-xs rounded transition-opacity"
            >
              Edit
            </button>
          </div>
        </div>
      </div>
    );
  }
);

function App() {
  const {
    price: bitcoinPrice,
    loading: bitcoinPriceLoading,
    error: bitcoinPriceError,
  } = useBitcoinPrice();

  // Database initialization state
  const [databaseStatus, setDatabaseStatus] = useState<DatabaseStatus | null>(null);
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [passwordError, setPasswordError] = useState<string>("");
  const [isValidatingPassword, setIsValidatingPassword] = useState(false);
  const [isDatabaseInitialized, setIsDatabaseInitialized] = useState(false);

  const [events, setEvents] = useState<BalanceChangeEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [editData, setEditData] = useState<any>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newEventData, setNewEventData] = useState<any>(null);
  const [portfolioMetrics, setPortfolioMetrics] =
    useState<PortfolioMetrics | null>(null);
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [showLumpsumModal, setShowLumpsumModal] = useState(false);
  const [lumpsumData, setLumpsumData] = useState({
    start_date: "",
    end_date: "",
    total_sats: "",
    total_usd: "",
    frequency: "weekly" as "daily" | "weekly" | "monthly",
    memo: "",
  });
  const [selectedAnalyticsPage, setSelectedAnalyticsPage] = useState<'buys-sells' | 'more-metrics'>('buys-sells');
  const [showAnalyticsDropdown, setShowAnalyticsDropdown] = useState(false);
  const [selectedChartPage, setSelectedChartPage] = useState<'sat-balance' | 'coming-soon'>('sat-balance');
  const [showChartDropdown, setShowChartDropdown] = useState(false);
  const [showEncryptionSettings, setShowEncryptionSettings] = useState(false);

  // Load portfolio metrics
  async function loadPortfolioMetrics(showLoading = false) {
    if (showLoading) {
      setMetricsLoading(true);
    }
    try {
      const metrics = await TauriService.getPortfolioMetrics();
      console.log("📊 Portfolio Metrics:", metrics);
      console.log("📈 7-day metrics:", {
        sats_stacked_7d: metrics.sats_stacked_7d,
        usd_invested_7d: metrics.usd_invested_7d_cents / 100
      });
      console.log("📈 31-day metrics:", {
        sats_stacked_31d: metrics.sats_stacked_31d,
        usd_invested_31d: metrics.usd_invested_31d_cents / 100
      });
      setPortfolioMetrics(metrics);
    } catch (error) {
      console.error("Error loading portfolio metrics:", error);
    } finally {
      if (showLoading) {
        setMetricsLoading(false);
      }
    }
  }

  // Load initial events - load ALL events for accurate chart data
  async function loadInitialEvents() {
    setLoading(true);
    try {
      let allEvents: BalanceChangeEvent[] = [];
      let currentPage = 0;
      let hasMore = true;
      let totalCount = 0;

      // Keep loading until we have all events
      while (hasMore) {
        const result = await TauriService.getBalanceChangeEvents(
          currentPage,
          1000
        ); // Load 1000 at a time
        allEvents = [...allEvents, ...result.events];
        hasMore = result.has_more;
        totalCount = result.total_count;
        currentPage++;

        console.log(
          `Loaded page ${currentPage - 1}, total events so far: ${
            allEvents.length
          }, has more: ${hasMore}`
        );
      }

      setEvents(allEvents);
      setTotalCount(totalCount);

      console.log(
        `✅ Loaded all ${allEvents.length} events for complete chart data`
      );
    } catch (error) {
      console.error("Error loading initial events:", error);
    } finally {
      setLoading(false);
    }
  }

  const handleEditEvent = (event: BalanceChangeEvent) => {
    // Cancel new event creation if in progress
    setIsCreatingNew(false);
    setNewEventData(null);

    setEditingEventId(event.id);
    setEditData({
      event_type: event.event_type,
      amount_sats: event.amount_sats,
      value_cents: event.value_cents,
      memo: event.memo,
      timestamp: event.timestamp,
    });
  };

  const handleSaveEvent = async () => {
    if (!editingEventId || !editData) return;

    try {
      const updateRequest = {
        amount_sats: editData.amount_sats,
        value_cents: editData.value_cents,
        event_type: editData.event_type as "Buy" | "Sell" | "Fee",
        memo: editData.memo,
        timestamp: editData.timestamp,
      };

      const updatedEvent = await TauriService.updateBalanceChangeEvent(
        editingEventId,
        updateRequest
      );

      // Update the event in the local state
      setEvents((prevEvents) =>
        prevEvents.map((event) =>
          event.id === editingEventId ? updatedEvent : event
        )
      );

      console.log("Event updated successfully:", updatedEvent);

      // Refresh portfolio metrics
      loadPortfolioMetrics();
    } catch (error) {
      console.error("Error updating event:", error);
    } finally {
      setEditingEventId(null);
      setEditData(null);
    }
  };

  const handleDeleteEvent = async () => {
    if (!editingEventId) return;

    try {
      await TauriService.deleteBalanceChangeEvent(editingEventId);

      // Remove the event from local state
      setEvents((prevEvents) =>
        prevEvents.filter((event) => event.id !== editingEventId)
      );

      // Update total count
      setTotalCount((prevCount) => prevCount - 1);

      console.log("Event deleted successfully");

      // Refresh portfolio metrics
      loadPortfolioMetrics();
    } catch (error) {
      console.error("Error deleting event:", error);
    } finally {
      setEditingEventId(null);
      setEditData(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingEventId(null);
    setEditData(null);
  };

  const handleEditDataChange = (field: string, value: any) => {
    setEditData((prev: any) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAddNewEvent = () => {
    setIsCreatingNew(true);
    setNewEventData({
      event_type: "Buy",
      amount_sats: 0,
      value_cents: null,
      memo: null,
      timestamp: new Date().toISOString(),
    });
    // Cancel any existing edits
    setEditingEventId(null);
    setEditData(null);
  };

  const handleSaveNewEvent = async () => {
    if (!newEventData) return;

    try {
      const createRequest = {
        amount_sats: newEventData.amount_sats,
        value_cents: newEventData.value_cents,
        event_type: newEventData.event_type as "Buy" | "Sell" | "Fee",
        memo: newEventData.memo,
        timestamp: newEventData.timestamp,
      };

      const createdEvent = await TauriService.createBalanceChangeEvent(
        createRequest
      );

      // Add the new event to the beginning of the list
      setEvents((prevEvents) => [createdEvent, ...prevEvents]);

      // Update total count
      setTotalCount((prevCount) => prevCount + 1);

      console.log("Event created successfully:", createdEvent);

      // Refresh portfolio metrics
      loadPortfolioMetrics();
    } catch (error) {
      console.error("Error creating event:", error);
    } finally {
      setIsCreatingNew(false);
      setNewEventData(null);
    }
  };

  const handleCancelNewEvent = () => {
    setIsCreatingNew(false);
    setNewEventData(null);
  };

  const handleNewEventDataChange = (field: string, value: any) => {
    setNewEventData((prev: any) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleLumpsumDataChange = (field: string, value: any) => {
    setLumpsumData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleCreateLumpsumEvents = async () => {
    try {
      // Validate that end date is not before start date
      const startDate = new Date(lumpsumData.start_date);
      const endDate = new Date(lumpsumData.end_date);

      if (endDate < startDate) {
        alert("End date cannot be before start date");
        return;
      }

      const request = {
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        total_sats: parseInt(lumpsumData.total_sats),
        total_usd_cents: Math.round(parseFloat(lumpsumData.total_usd) * 100),
        frequency: lumpsumData.frequency,
        memo: lumpsumData.memo.trim() || undefined,
      };

      const createdEvents = await TauriService.createUndocumentedLumpsumEvents(
        request
      );

      // Refresh the entire events list to get proper chronological order
      await loadInitialEvents();

      // Refresh portfolio metrics
      loadPortfolioMetrics();

      // Close modal and reset form
      setShowLumpsumModal(false);
      setLumpsumData({
        start_date: "",
        end_date: "",
        total_sats: "",
        total_usd: "",
        frequency: "weekly",
        memo: "",
      });

      alert(`Successfully created ${createdEvents.length} events`);
    } catch (error) {
      console.error("Error creating lumpsum events:", error);
      alert(`Failed to create events: ${error}`);
    }
  };

  // Keyboard event listener for Escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        // Cancel any active edit or creation
        if (editingEventId) {
          handleCancelEdit();
        } else if (isCreatingNew) {
          handleCancelNewEvent();
        } else if (showLumpsumModal) {
          setShowLumpsumModal(false);
        }
      }
    };

    // Add event listener
    document.addEventListener("keydown", handleKeyDown);

    // Cleanup function to remove event listener
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [editingEventId, isCreatingNew, showLumpsumModal]); // Dependencies to ensure we have current state

  // Close analytics dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showAnalyticsDropdown || showChartDropdown) {
        const target = event.target as Element;
        if (!target.closest('.relative')) {
          setShowAnalyticsDropdown(false);
          setShowChartDropdown(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showAnalyticsDropdown, showChartDropdown]);

  // Database initialization functions
  const checkDatabaseStatusAndInitialize = async () => {
    try {
      console.log("🔍 Checking database status...");
      const status = await TauriService.checkDatabaseStatus();
      console.log("📊 Database status:", status);
      
      setDatabaseStatus(status);
      
      if (status.needs_password) {
        console.log("🔐 Password required, showing prompt");
        setShowPasswordPrompt(true);
      } else {
        console.log("🚀 No password needed, initializing directly");
        // Database is not encrypted, initialize without password
        await initializeDatabase();
      }
    } catch (error) {
      console.error("❌ Error checking database status:", error);
      setPasswordError("Failed to check database status");
    }
  };

  const initializeDatabase = async (password?: string) => {
    try {
      console.log("🚀 Initializing database...");
      await TauriService.initializeDatabaseWithPassword(password);
      console.log("✅ Database initialized successfully");
      
      setIsDatabaseInitialized(true);
      setShowPasswordPrompt(false);
      setPasswordError("");
    } catch (error) {
      console.error("❌ Error initializing database:", error);
      throw error;
    }
  };

  const handlePasswordSubmit = async (password: string) => {
    if (!databaseStatus) return;

    setIsValidatingPassword(true);
    setPasswordError("");

    try {
      if (databaseStatus.is_encrypted) {
        // Validate password for encrypted database
        console.log("🔐 Validating password...");
        const validation = await TauriService.validateDatabasePassword(password);
        
        if (!validation.is_valid) {
          setPasswordError(validation.error_message || "Invalid password");
          setIsValidatingPassword(false);
          return;
        }
      }

      // Initialize database with password
      await initializeDatabase(password || undefined);
    } catch (error) {
      console.error("❌ Password validation/initialization failed:", error);
      setPasswordError("Failed to unlock database");
    } finally {
      setIsValidatingPassword(false);
    }
  };

  const handleSkipPassword = async () => {
    try {
      await initializeDatabase();
    } catch (error) {
      console.error("❌ Error initializing database without password:", error);
      setPasswordError("Failed to initialize database");
    }
  };

  // Check database status on component mount
  useEffect(() => {
    checkDatabaseStatusAndInitialize();
  }, []);

  // Load initial events and portfolio metrics once database is initialized
  useEffect(() => {
    if (isDatabaseInitialized) {
      loadInitialEvents();
      loadPortfolioMetrics(true); // Show loading on initial load
    }
  }, [isDatabaseInitialized]);

  // Add menu event listener
  useEffect(() => {
    const setupMenuListener = async () => {
      const unlisten = await listen("menu_import_sat_tracker_v1", async () => {
        console.log("📥 Menu import event received!");
        try {
          const result = await TauriService.importSatTrackerV1Data();
          console.log("Import result:", result);
          alert(`Import completed: ${result}`);
          // Refresh data after import
          loadInitialEvents();
          loadPortfolioMetrics(true); // Show loading for import since it's a major operation
        } catch (error) {
          console.error("Import failed:", error);
          alert(`Import failed: ${error}`);
        }
      });

      const unlisten2 = await listen("menu_add_undocumented_lumpsum", () => {
        console.log("📊 Menu lumpsum event received!");
        setShowLumpsumModal(true);
      });

      const unlisten3 = await listen("menu_encryption_settings", () => {
        console.log("🔐 Menu encryption settings event received!");
        setShowEncryptionSettings(true);
      });

      return () => {
        unlisten();
        unlisten2();
        unlisten3();
      };
    };

    let unlistenPromise = setupMenuListener();

    return () => {
      unlistenPromise.then((cleanup) => cleanup());
    };
  }, []);

  // Don't render main app until database is initialized
  if (!isDatabaseInitialized) {
    return (
      <div className="min-h-screen bg-[#090C08] flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl text-[#F7F3E3] mb-4">🗄️ Sat Tracker</div>
          <div className="text-sm text-[rgba(247,243,227,0.6)]">
            {databaseStatus === null ? "Checking database..." : "Initializing..."}
          </div>
        </div>
        
        <PasswordPromptModal
          isOpen={showPasswordPrompt}
          onPasswordSubmit={handlePasswordSubmit}
          onSkip={databaseStatus?.is_encrypted ? undefined : handleSkipPassword}
          isEncrypted={databaseStatus?.is_encrypted || false}
          error={passwordError}
          isValidating={isValidatingPassword}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#090C08]">
      {/* Title Header */}
      <div className="bg-[#2A2633] border-b border-[rgba(247,243,227,0.2)] px-6 py-4">
        <div className="flex items-center gap-6">
          <h1 className="text-2xl font-bold text-[#F7F3E3] whitespace-nowrap">
            Sat Tracker{" "}
            <span className="text-sm font-normal">
              by <span className="text-[#E16036]">dprogram</span>
              <span className="text-[#F7F3E3]">.me</span>
            </span>
          </h1>
          <div className="flex-1 min-w-0">
            <Announcements />
          </div>
        </div>
      </div>

      {/* Main Content - Two Columns */}
      <div className="flex h-[calc(100vh-73px)]">
        {/* Left Column - Chart Area (65%) */}
        <div className="w-[65%] bg-[rgba(9,12,8,0.8)] flex flex-col">
          {/* Overview Metrics Strip */}
          <div className="p-4 pb-2 shrink-0 border-b border-[rgba(247,243,227,0.1)]">
            <div className="grid grid-cols-5 gap-3 mb-3">
              {/* Bitcoin Price */}
              <div className="text-center p-2 bg-[rgba(97,218,251,0.1)] border border-[rgba(97,218,251,0.2)] rounded">
                <div className="text-xs text-[rgba(247,243,227,0.6)] mb-1">
                  Bitcoin Price
                </div>
                <div className="text-sm text-[#61dafb] font-medium">
                  {bitcoinPriceLoading
                    ? "..."
                    : `$${bitcoinPrice.toLocaleString()}`}
                </div>
              </div>

              {/* Portfolio Value */}
              <div className="text-center p-2 bg-[rgba(247,147,26,0.1)] border border-[rgba(247,147,26,0.2)] rounded">
                <div className="text-xs text-[rgba(247,243,227,0.6)] mb-1">
                  Portfolio Value
                </div>
                <div className="text-sm text-[#f7931a] font-medium">
                  {metricsLoading
                    ? "..."
                    : `$${(
                        ((portfolioMetrics?.current_sats || 0) / 100_000_000) *
                        bitcoinPrice
                      ).toLocaleString(undefined, {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      })}`}
                </div>
              </div>

              {/* Current Sats */}
              <div className="text-center p-2 bg-[rgba(247,147,26,0.1)] border border-[rgba(247,147,26,0.2)] rounded">
                <div className="text-xs text-[rgba(247,243,227,0.6)] mb-1">
                  Current Sats
                </div>
                <div className="text-sm text-[#f7931a] font-medium">
                  {metricsLoading
                    ? "..."
                    : portfolioMetrics?.current_sats.toLocaleString() || "0"}
                </div>
              </div>

              {/* Current BTC */}
              <div className="text-center p-2 bg-[rgba(247,147,26,0.1)] border border-[rgba(247,147,26,0.2)] rounded">
                <div className="text-xs text-[rgba(247,243,227,0.6)] mb-1">
                  Current BTC
                </div>
                <div className="text-sm text-[#f7931a] font-medium">
                  {metricsLoading
                    ? "..."
                    : portfolioMetrics?.current_sats
                    ? (portfolioMetrics.current_sats / 100_000_000).toFixed(8)
                    : "0.00000000"}
                </div>
              </div>

              {/* Unrealized Gain */}
              <div className="text-center p-2 bg-[rgba(144,238,144,0.1)] border border-[rgba(144,238,144,0.2)] rounded">
                <div className="text-xs text-[rgba(247,243,227,0.6)] mb-1">
                  Unrealized Gain
                </div>
                <div
                  className={`text-sm font-medium ${(() => {
                    if (
                      metricsLoading ||
                      !portfolioMetrics?.current_sats ||
                      !portfolioMetrics?.total_invested_cents
                    ) {
                      return "text-lightgreen";
                    }
                    const currentValue =
                      ((portfolioMetrics.current_sats || 0) / 100_000_000) *
                      bitcoinPrice;
                    const totalInvested =
                      (portfolioMetrics.total_invested_cents || 0) / 100;
                    const unrealizedGain = currentValue - totalInvested;
                    return unrealizedGain >= 0
                      ? "text-lightgreen"
                      : "text-lightcoral";
                  })()}`}
                >
                  {metricsLoading
                    ? "..."
                    : portfolioMetrics?.current_sats &&
                      portfolioMetrics?.total_invested_cents
                    ? (() => {
                        const currentValue =
                          ((portfolioMetrics.current_sats || 0) / 100_000_000) *
                          bitcoinPrice;
                        const totalInvested =
                          (portfolioMetrics.total_invested_cents || 0) / 100;
                        const unrealizedGain = currentValue - totalInvested;
                        return unrealizedGain >= 0
                          ? `+$${unrealizedGain.toLocaleString(undefined, {
                              minimumFractionDigits: 0,
                              maximumFractionDigits: 0,
                            })}`
                          : `-$${Math.abs(unrealizedGain).toLocaleString(
                              undefined,
                              {
                                minimumFractionDigits: 0,
                                maximumFractionDigits: 0,
                              }
                            )}`;
                      })()
                    : "-"}
                </div>
              </div>
            </div>

            {/* Chart Header */}
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-[#F7F3E3]">
                Sats Holdings Over Time
              </h2>
              <div className="relative">
                <button
                  onClick={() => setShowChartDropdown(!showChartDropdown)}
                  className="text-xs text-[rgba(247,243,227,0.5)] bg-[rgba(247,243,227,0.1)] px-2 py-1 rounded hover:bg-[rgba(247,243,227,0.15)] flex items-center gap-1"
                >
                  {selectedChartPage === 'sat-balance' ? 'Sat Balance' : 'Coming Soon'}
                  <span className="text-[10px]">▼</span>
                </button>
                {showChartDropdown && (
                  <div className="absolute right-0 top-full mt-1 bg-[#2A2633] border border-[rgba(247,243,227,0.3)] rounded shadow-lg z-10 min-w-[120px]">
                    <button
                      onClick={() => {
                        setSelectedChartPage('sat-balance');
                        setShowChartDropdown(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs hover:bg-[rgba(247,243,227,0.1)] ${
                        selectedChartPage === 'sat-balance' ? 'text-[#F7F3E3] bg-[rgba(247,243,227,0.05)]' : 'text-[rgba(247,243,227,0.7)]'
                      }`}
                    >
                      Sat Balance
                    </button>
                    <button
                      disabled
                      className="w-full text-left px-3 py-2 text-xs text-[rgba(247,243,227,0.4)] cursor-not-allowed opacity-50"
                    >
                      Coming Soon
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Chart Area */}
          <div className="flex-1 p-4">
            <SatsHoldingsChart events={events} />
          </div>
        </div>

        {/* Right Column - Metrics + Events (35%) */}
        <div className="w-[35%] border-l border-[rgba(247,243,227,0.2)] bg-[#2A2633] flex flex-col">
          {/* Top Half - Analytics with Page Selection (50%) */}
          <div className="h-1/2 border-b border-[rgba(247,243,227,0.2)] flex flex-col">
            <div className="p-4 pb-2 shrink-0">
              <div className="flex justify-between items-center">
                <h2 className="text-md font-semibold text-[#F7F3E3]">
                  Analytics
                </h2>
                <div className="relative">
                  <button
                    onClick={() => setShowAnalyticsDropdown(!showAnalyticsDropdown)}
                    className="text-xs text-[rgba(247,243,227,0.5)] bg-[rgba(247,243,227,0.1)] px-2 py-1 rounded hover:bg-[rgba(247,243,227,0.15)] flex items-center gap-1"
                  >
                    {selectedAnalyticsPage === 'buys-sells' ? 'Buys/Sells' : 'More Metrics'}
                    <span className="text-[10px]">▼</span>
                  </button>
                  {showAnalyticsDropdown && (
                    <div className="absolute right-0 top-full mt-1 bg-[#2A2633] border border-[rgba(247,243,227,0.3)] rounded shadow-lg z-10 min-w-[120px]">
                      <button
                        onClick={() => {
                          setSelectedAnalyticsPage('buys-sells');
                          setShowAnalyticsDropdown(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-xs hover:bg-[rgba(247,243,227,0.1)] ${
                          selectedAnalyticsPage === 'buys-sells' ? 'text-[#F7F3E3] bg-[rgba(247,243,227,0.05)]' : 'text-[rgba(247,243,227,0.7)]'
                        }`}
                      >
                        Buys/Sells
                      </button>
                      <button
                        onClick={() => {
                          setSelectedAnalyticsPage('more-metrics');
                          setShowAnalyticsDropdown(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-xs hover:bg-[rgba(247,243,227,0.1)] ${
                          selectedAnalyticsPage === 'more-metrics' ? 'text-[#F7F3E3] bg-[rgba(247,243,227,0.05)]' : 'text-[rgba(247,243,227,0.7)]'
                        }`}
                      >
                        More Metrics
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex-1 px-4 pb-2 overflow-y-auto">
              {selectedAnalyticsPage === 'buys-sells' ? (
                <div className="space-y-3">
                  {/* Existing Buys Section */}
                  <div>
                    <h3 className="text-xs font-semibold text-[#F7F3E3] mb-1 border-b border-[rgba(247,243,227,0.2)] pb-1">
                      Buys
                    </h3>
                    <div className="space-y-1">
                      {/* Row 1: Avg Buy Price & Total Invested */}
                      <div className="grid grid-cols-2 gap-2">
                        <div className="text-center p-1.5 bg-[rgba(144,238,144,0.1)] border border-[rgba(144,238,144,0.2)] rounded">
                          <div className="text-xs text-[rgba(247,243,227,0.6)] mb-0.5">
                            Avg Buy Price
                          </div>
                          <div className="text-xs text-lightgreen font-medium">
                            {metricsLoading
                              ? "..."
                              : portfolioMetrics?.avg_buy_price
                              ? `$${portfolioMetrics.avg_buy_price.toLocaleString(
                                  undefined,
                                  {
                                    minimumFractionDigits: 0,
                                    maximumFractionDigits: 0,
                                  }
                                )}`
                              : "-"}
                          </div>
                        </div>
                        <div className="text-center p-1.5 bg-[rgba(144,238,144,0.1)] border border-[rgba(144,238,144,0.2)] rounded">
                          <div className="text-xs text-[rgba(247,243,227,0.6)] mb-0.5">
                            Total Invested
                          </div>
                          <div className="text-xs text-lightgreen font-medium">
                            {metricsLoading
                              ? "..."
                              : `$${(
                                  (portfolioMetrics?.total_invested_cents || 0) /
                                  100
                                ).toLocaleString(undefined, {
                                  minimumFractionDigits: 0,
                                  maximumFractionDigits: 0,
                                })}`}
                          </div>
                        </div>
                      </div>
                      {/* Row 2: Total Sats Stacked (single column) */}
                      <div className="text-center p-1.5 bg-[rgba(144,238,144,0.1)] border border-[rgba(144,238,144,0.2)] rounded">
                        <div className="text-xs text-[rgba(247,243,227,0.6)] mb-0.5">
                          Total Sats Stacked
                        </div>
                        <div className="text-xs text-lightgreen font-medium">
                          {metricsLoading
                            ? "..."
                            : portfolioMetrics?.total_sats_stacked.toLocaleString() ||
                              "0"}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Existing Sells Section */}
                  <div>
                    <h3 className="text-xs font-semibold text-[#F7F3E3] mb-1 border-b border-[rgba(247,243,227,0.2)] pb-1">
                      Sells
                    </h3>
                    <div className="space-y-1">
                      {/* Row 1: Avg Sell Price & Fiat Extracted */}
                      <div className="grid grid-cols-2 gap-2">
                        <div className="text-center p-1.5 bg-[rgba(240,128,128,0.1)] border border-[rgba(240,128,128,0.2)] rounded">
                          <div className="text-xs text-[rgba(247,243,227,0.6)] mb-0.5">
                            Avg Sell Price
                          </div>
                          <div className="text-xs text-lightcoral font-medium">
                            {metricsLoading
                              ? "..."
                              : portfolioMetrics?.avg_sell_price
                              ? `$${portfolioMetrics.avg_sell_price.toLocaleString(
                                  undefined,
                                  {
                                    minimumFractionDigits: 0,
                                    maximumFractionDigits: 0,
                                  }
                                )}`
                              : "-"}
                          </div>
                        </div>
                        <div className="text-center p-1.5 bg-[rgba(240,128,128,0.1)] border border-[rgba(240,128,128,0.2)] rounded">
                          <div className="text-xs text-[rgba(247,243,227,0.6)] mb-0.5">
                            Fiat Extracted
                          </div>
                          <div className="text-xs text-lightcoral font-medium">
                            {metricsLoading
                              ? "..."
                              : `$${(
                                  (portfolioMetrics?.fiat_extracted_cents || 0) /
                                  100
                                ).toLocaleString(undefined, {
                                  minimumFractionDigits: 0,
                                  maximumFractionDigits: 0,
                                })}`}
                          </div>
                        </div>
                      </div>
                      {/* Row 2: Total Sats Spent (single column) */}
                      <div className="text-center p-1.5 bg-[rgba(240,128,128,0.1)] border border-[rgba(240,128,128,0.2)] rounded">
                        <div className="text-xs text-[rgba(247,243,227,0.6)] mb-0.5">
                          Total Sats Spent
                        </div>
                        <div className="text-xs text-lightcoral font-medium">
                          {metricsLoading
                            ? "..."
                            : portfolioMetrics?.total_sats_spent.toLocaleString() ||
                              "0"}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* 7-Day Metrics Section */}
                  <div>
                    <h3 className="text-xs font-semibold text-[#F7F3E3] mb-1 border-b border-[rgba(247,243,227,0.2)] pb-1">
                      7-Day Activity
                    </h3>
                    <div className="space-y-1">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="text-center p-1.5 bg-[rgba(97,218,251,0.1)] border border-[rgba(97,218,251,0.2)] rounded">
                          <div className="text-xs text-[rgba(247,243,227,0.6)] mb-0.5">
                            Sats Stacked
                          </div>
                          <div className="text-xs text-[#61dafb] font-medium">
                            {metricsLoading
                              ? "..."
                              : portfolioMetrics?.sats_stacked_7d?.toLocaleString() || "0"}
                          </div>
                        </div>
                        <div className="text-center p-1.5 bg-[rgba(97,218,251,0.1)] border border-[rgba(97,218,251,0.2)] rounded">
                          <div className="text-xs text-[rgba(247,243,227,0.6)] mb-0.5">
                            USD Invested
                          </div>
                          <div className="text-xs text-[#61dafb] font-medium">
                            {metricsLoading
                              ? "..."
                              : `$${(
                                  (portfolioMetrics?.usd_invested_7d_cents || 0) / 100
                                ).toLocaleString(undefined, {
                                  minimumFractionDigits: 0,
                                  maximumFractionDigits: 0,
                                })}`}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 31-Day Metrics Section */}
                  <div>
                    <h3 className="text-xs font-semibold text-[#F7F3E3] mb-1 border-b border-[rgba(247,243,227,0.2)] pb-1">
                      31-Day Activity
                    </h3>
                    <div className="space-y-1">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="text-center p-1.5 bg-[rgba(255,215,0,0.1)] border border-[rgba(255,215,0,0.2)] rounded">
                          <div className="text-xs text-[rgba(247,243,227,0.6)] mb-0.5">
                            Sats Stacked
                          </div>
                          <div className="text-xs text-[gold] font-medium">
                            {metricsLoading
                              ? "..."
                              : portfolioMetrics?.sats_stacked_31d?.toLocaleString() || "0"}
                          </div>
                        </div>
                        <div className="text-center p-1.5 bg-[rgba(255,215,0,0.1)] border border-[rgba(255,215,0,0.2)] rounded">
                          <div className="text-xs text-[rgba(247,243,227,0.6)] mb-0.5">
                            USD Invested
                          </div>
                          <div className="text-xs text-[gold] font-medium">
                            {metricsLoading
                              ? "..."
                              : `$${(
                                  (portfolioMetrics?.usd_invested_31d_cents || 0) / 100
                                ).toLocaleString(undefined, {
                                  minimumFractionDigits: 0,
                                  maximumFractionDigits: 0,
                                })}`}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Half - Events Table (50%) */}
          <div className="h-1/2 flex flex-col">
            {/* Header */}
            <div className="px-4 py-3 border-b border-[rgba(247,243,227,0.2)] bg-[rgba(42,38,51,0.8)] shrink-0">
              <div className="flex justify-between items-center">
                <h2 className="text-md font-semibold text-[#F7F3E3]">
                  Events ({events.length} of {totalCount})
                </h2>
                <button
                  onClick={handleAddNewEvent}
                  className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 text-xs rounded"
                >
                  Add Event
                </button>
              </div>
              {/* Column Headers */}
              <div
                className="grid gap-2 mt-2 text-xs font-medium text-[rgba(247,243,227,0.6)]"
                style={{
                  gridTemplateColumns: "2fr 0.8fr 1.5fr 1.3fr 1fr 1.5fr 0.8fr",
                }}
              >
                <div>Date</div>
                <div>Type</div>
                <div>Amount</div>
                <div>USD</div>
                <div>BTC/USD</div>
                <div>Memo</div>
                <div>Actions</div>
              </div>
            </div>

            {/* Events List - Scrollable */}
            <div className="flex-1 overflow-y-auto">
              {/* New Event Row using EventItem */}
              {isCreatingNew && (
                <EventItem
                  event={null}
                  isEditing={false}
                  isCreating={true}
                  onEdit={() => {}}
                  onSave={handleSaveNewEvent}
                  onDelete={() => {}}
                  onCancel={handleCancelNewEvent}
                  editData={newEventData}
                  onEditDataChange={handleNewEventDataChange}
                />
              )}

              {events.map((event) => (
                <EventItem
                  key={event.id}
                  event={event}
                  isEditing={editingEventId === event.id}
                  isCreating={false}
                  onEdit={() => handleEditEvent(event)}
                  onSave={handleSaveEvent}
                  onDelete={handleDeleteEvent}
                  onCancel={handleCancelEdit}
                  editData={editData}
                  onEditDataChange={handleEditDataChange}
                />
              ))}

              {events.length > 0 && (
                <div className="text-center py-4">
                  <div className="text-xs text-[rgba(247,243,227,0.5)]">
                    All events loaded
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <LumpsumModal
        isOpen={showLumpsumModal}
        onClose={() => setShowLumpsumModal(false)}
        lumpsumData={lumpsumData}
        onLumpsumDataChange={handleLumpsumDataChange}
        onCreateEvents={handleCreateLumpsumEvents}
      />

      {/* Encryption Settings Modal */}
      {showEncryptionSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[#2A2633] border border-[rgba(247,243,227,0.3)] rounded-lg w-[500px] max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-[#F7F3E3]">Database Encryption</h2>
                <button
                  onClick={() => setShowEncryptionSettings(false)}
                  className="text-[rgba(247,243,227,0.6)] hover:text-[#F7F3E3] text-xl"
                >
                  ×
                </button>
              </div>
              <EncryptionSettings
                isEncrypted={databaseStatus?.is_encrypted || false}
                onEncryptionChange={async () => {
                  // Refresh database status after encryption changes
                  await checkDatabaseStatusAndInitialize();
                }}
                onClose={() => setShowEncryptionSettings(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
