import React, { useState, useEffect } from "react";
import {
  TauriService,
  BalanceChangeEvent,
  PortfolioMetrics,
  DatabaseStatus,
} from "./services/tauriService";
import SatsHoldingsChartSection from "./components/SatsHoldingsChartSection";
import LumpsumModal from "./components/LumpsumModal";
import Announcements from "./components/Announcements";
import PasswordPromptModal from "./components/PasswordPromptModal";
import EncryptionSettings from "./components/EncryptionSettings";
import EventsList from "./components/EventsList";
import AnalyticsSection from "./components/AnalyticsSection";
import { useBitcoinPrice } from "./hooks/useBitcoinPrice";
import { listen } from "@tauri-apps/api/event";
import "./App.css";

function App() {
  // Bitcoin price state - declare these first
  const [isEditingBitcoinPrice, setIsEditingBitcoinPrice] = useState(false);
  const [customBitcoinPrice, setCustomBitcoinPrice] = useState<number | null>(
    null
  );
  const [bitcoinPriceInput, setBitcoinPriceInput] = useState("");

  const {
    price: liveBitcoinPrice,
    percentChange24hr,
    loading: bitcoinPriceLoading,
    error: bitcoinPriceError,
  } = useBitcoinPrice();

  // Auto-switch to manual mode if live price is null
  useEffect(() => {
    if (
      liveBitcoinPrice === null &&
      customBitcoinPrice === null &&
      !bitcoinPriceLoading
    ) {
      setCustomBitcoinPrice(100000); // Default fallback price
    }
  }, [liveBitcoinPrice, customBitcoinPrice, bitcoinPriceLoading]);

  // Use custom price if set, otherwise use live price (with fallback)
  const bitcoinPrice =
    customBitcoinPrice !== null
      ? customBitcoinPrice
      : liveBitcoinPrice || 100000;

  // Database initialization state
  const [databaseStatus, setDatabaseStatus] = useState<DatabaseStatus | null>(
    null
  );
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
  const [showEncryptionSettings, setShowEncryptionSettings] = useState(false);
  const [selectedTool, setSelectedTool] = useState("overview");
  const [showToolDropdown, setShowToolDropdown] = useState(false);

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
        usd_invested_7d: metrics.usd_invested_7d_cents / 100,
      });
      console.log("📈 31-day metrics:", {
        sats_stacked_31d: metrics.sats_stacked_31d,
        usd_invested_31d: metrics.usd_invested_31d_cents / 100,
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

  const handleBitcoinPriceClick = () => {
    // Only allow editing if in manual mode
    if (customBitcoinPrice !== null) {
      setIsEditingBitcoinPrice(true);
      setBitcoinPriceInput(bitcoinPrice.toString());
    }
  };

  const handleBitcoinPriceBlur = () => {
    const numValue = parseFloat(bitcoinPriceInput);
    if (!isNaN(numValue) && numValue > 0) {
      setCustomBitcoinPrice(numValue);
    }
    setIsEditingBitcoinPrice(false);
  };

  const handleBitcoinPriceKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleBitcoinPriceBlur();
    } else if (e.key === "Escape") {
      setIsEditingBitcoinPrice(false);
      setBitcoinPriceInput(bitcoinPrice.toString());
    }
  };

  const handleModeToggle = () => {
    if (customBitcoinPrice === null) {
      // Switch to manual mode - set current live price as custom (with fallback)
      const priceToUse = liveBitcoinPrice || 100000;
      setCustomBitcoinPrice(priceToUse);
      setIsEditingBitcoinPrice(true);
      setBitcoinPriceInput(priceToUse.toString());
    } else {
      // Switch back to live mode
      setCustomBitcoinPrice(null);
      setIsEditingBitcoinPrice(false);
    }
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

  // Close tool dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showToolDropdown) {
        const target = event.target as Element;
        if (!target.closest(".tool-dropdown")) {
          setShowToolDropdown(false);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showToolDropdown]);

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
        const validation = await TauriService.validateDatabasePassword(
          password
        );

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

      // Update menu to show full options now that database is unlocked
      TauriService.updateMenuForDatabaseStatus(true).catch(console.error);

      // Set up menu event listeners
      const setupMenuListeners = async () => {
        await listen("menu-import-v1", async () => {
          try {
            const result = await TauriService.importSatTrackerV1Data();
            console.log("Import result:", result);
            alert(`Import completed: ${result}`);
            loadInitialEvents();
            loadPortfolioMetrics(true);
          } catch (error) {
            console.error("Import failed:", error);
            alert(`Import failed: ${error}`);
          }
        });

        await listen("menu-add-lumpsum", () => {
          setShowLumpsumModal(true);
        });

        await listen("menu-encryption-settings", () => {
          setShowEncryptionSettings(true);
        });
      };

      setupMenuListeners().catch(console.error);
    }
  }, [isDatabaseInitialized]);

  // Don't render main app until database is initialized
  if (!isDatabaseInitialized) {
    return (
      <div className="min-h-screen bg-[#090C08] flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl text-[#F7F3E3] mb-4">🗄️ Sat Tracker</div>
          <div className="text-sm text-[rgba(247,243,227,0.6)]">
            {databaseStatus === null
              ? "Checking database..."
              : "Initializing..."}
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
    <div className="min-h-screen bg-[#090C08] overflow-hidden">
      <div className="flex flex-col h-screen">
        {/* App Title, Menu, and Announcements - Split Layout */}
        <div className="bg-[#2A2633] border-b border-[rgba(247,243,227,0.2)] shrink-0 flex">
          {/* Left side - Title and Announcements (65%) */}
          <div className="w-[65%] px-6 py-3 flex items-center gap-6">
            <h1 className="text-xl font-bold text-[#F7F3E3] whitespace-nowrap">
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

          {/* Right side - Tool Selector (35%) */}
          <div className="w-[35%] px-6 py-3 flex items-center justify-between">
            {/* Update Available Button */}
            <button className="text-xs text-[#F7F3E3] bg-[rgba(247,147,26,0.2)] border border-[rgba(247,147,26,0.3)] px-2 py-1 rounded hover:bg-[rgba(247,147,26,0.3)] flex items-center gap-1">
              <span className="text-[10px]">🔄</span>
              Update Available
            </button>

            {/* Tool Selector Dropdown */}
            <div className="relative tool-dropdown">
              <button
                onClick={() => setShowToolDropdown(!showToolDropdown)}
                className="text-sm text-[#F7F3E3] bg-[rgba(97,218,251,0.15)] border border-[rgba(97,218,251,0.3)] px-3 py-1.5 rounded hover:bg-[rgba(97,218,251,0.2)] flex items-center gap-2 font-medium"
              >
                {selectedTool === "overview" && "Overview"}
                {selectedTool === "focus" && "Focus"}
                {selectedTool === "trends" && "Trends"}
                {selectedTool === "activity" && "Activity"}
                <span className="text-xs">▼</span>
              </button>
              {showToolDropdown && (
                <div className="absolute right-0 top-full mt-1 bg-[#2A2633] border border-[rgba(247,243,227,0.3)] rounded shadow-lg z-10 min-w-[120px]">
                  <button
                    onClick={() => {
                      setSelectedTool("overview");
                      setShowToolDropdown(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs hover:bg-[rgba(247,243,227,0.1)] ${
                      selectedTool === "overview"
                        ? "text-[#F7F3E3] bg-[rgba(247,243,227,0.05)]"
                        : "text-[rgba(247,243,227,0.7)]"
                    }`}
                  >
                    Overview
                  </button>
                  <button
                    onClick={() => {
                      // setSelectedTool("focus");
                      // setShowToolDropdown(false);
                    }}
                    className="w-full text-left px-3 py-2 text-xs text-[rgba(247,243,227,0.4)] cursor-not-allowed"
                    disabled
                  >
                    Focus
                  </button>
                  <button
                    onClick={() => {
                      // setSelectedTool("trends");
                      // setShowToolDropdown(false);
                    }}
                    className="w-full text-left px-3 py-2 text-xs text-[rgba(247,243,227,0.4)] cursor-not-allowed"
                    disabled
                  >
                    Trends
                  </button>
                  <button
                    onClick={() => {
                      // setSelectedTool("activity");
                      // setShowToolDropdown(false);
                    }}
                    className="w-full text-left px-3 py-2 text-xs text-[rgba(247,243,227,0.4)] cursor-not-allowed"
                    disabled
                  >
                    Activity
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main Content - Two Columns */}
        <div className="flex flex-1 min-h-0">
          {/* Left Column - Chart Area (65%) */}
          <div className="w-[65%] bg-[rgba(9,12,8,0.8)] flex flex-col">
            {/* Overview Metrics Strip */}
            <div className="p-4 pb-2 shrink-0 border-b border-[rgba(247,243,227,0.1)]">
            <div className="grid grid-cols-5 gap-3 mb-3">
              {/* Bitcoin Price */}
              <div className="text-center p-2 bg-[rgba(97,218,251,0.1)] border border-[rgba(97,218,251,0.2)] rounded relative">
                <div className="text-xs text-[rgba(247,243,227,0.6)] mb-1 flex items-center justify-center gap-1">
                  Bitcoin Price
                  <button
                    onClick={handleModeToggle}
                    className={`text-[10px] px-1 rounded ${
                      customBitcoinPrice === null
                        ? "bg-[rgba(144,238,144,0.2)] hover:bg-[rgba(144,238,144,0.3)] text-lightgreen"
                        : "bg-[rgba(255,165,0,0.2)] hover:bg-[rgba(255,165,0,0.3)] text-orange"
                    }`}
                    title={
                      customBitcoinPrice === null
                        ? "Switch to manual mode"
                        : "Switch to live mode"
                    }
                  >
                    {customBitcoinPrice === null ? "Live" : "Manual"}
                  </button>
                </div>
                {isEditingBitcoinPrice ? (
                  <input
                    type="text"
                    value={bitcoinPriceInput}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Allow numbers and decimal point
                      if (value === "" || /^[0-9]*\.?[0-9]*$/.test(value)) {
                        setBitcoinPriceInput(value);
                      }
                    }}
                    onBlur={handleBitcoinPriceBlur}
                    onKeyDown={handleBitcoinPriceKeyDown}
                    className="w-full bg-[rgba(9,12,8,0.8)] border border-[rgba(97,218,251,0.5)] text-[#61dafb] text-sm font-medium text-center px-1 py-0 rounded"
                    autoFocus
                  />
                ) : (
                  <div className="flex flex-col items-center">
                    <div
                      className={`text-sm text-[#61dafb] font-medium rounded px-1 py-0 ${
                        customBitcoinPrice !== null
                          ? "cursor-pointer hover:bg-[rgba(97,218,251,0.1)]"
                          : "cursor-default"
                      }`}
                      onClick={handleBitcoinPriceClick}
                      title={
                        customBitcoinPrice !== null
                          ? "Click to edit price"
                          : "Click 'Live' to enter manual mode"
                      }
                    >
                      {bitcoinPriceLoading && customBitcoinPrice === null
                        ? "..."
                        : `$${bitcoinPrice.toLocaleString()}`}
                    </div>
                    {/* Show 24hr change only in live mode and when data is available */}
                    {customBitcoinPrice === null &&
                      percentChange24hr !== null &&
                      !bitcoinPriceLoading && (
                        <div
                          className={`text-xs font-medium ${
                            percentChange24hr >= 0
                              ? "text-lightgreen"
                              : "text-lightcoral"
                          }`}
                        >
                          {percentChange24hr >= 0 ? "+" : ""}
                          {percentChange24hr.toFixed(2)}% (24h)
                        </div>
                      )}
                  </div>
                )}
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
          </div>

            <SatsHoldingsChartSection events={events} />
          </div>

          {/* Right Column - Metrics + Events (35%) */}
          <div className="w-[35%] border-l border-[rgba(247,243,227,0.2)] bg-[#2A2633] flex flex-col">
          {/* Top Half - Analytics with Page Selection (50%) */}
          <AnalyticsSection
            portfolioMetrics={portfolioMetrics}
            metricsLoading={metricsLoading}
          />

          <EventsList
            events={events}
            totalCount={totalCount}
            editingEventId={editingEventId}
            editData={editData}
            isCreatingNew={isCreatingNew}
            newEventData={newEventData}
            onAddNewEvent={handleAddNewEvent}
            onEditEvent={handleEditEvent}
            onSaveEvent={handleSaveEvent}
            onDeleteEvent={handleDeleteEvent}
            onCancelEdit={handleCancelEdit}
            onEditDataChange={handleEditDataChange}
            onSaveNewEvent={handleSaveNewEvent}
            onCancelNewEvent={handleCancelNewEvent}
            onNewEventDataChange={handleNewEventDataChange}
          />
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
                <h2 className="text-xl font-semibold text-[#F7F3E3]">
                  Database Encryption
                </h2>
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
