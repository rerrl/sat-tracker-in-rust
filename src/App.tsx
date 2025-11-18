import { useState, useEffect, useCallback } from "react";
import {
  TauriService,
  DatabaseStatus,
  BitcoinTransaction,
} from "./services/tauriService";
import { useQueryClient } from "@tanstack/react-query";
import AppHeader from "./components/AppHeader";
import ToolContainer from "./components/ToolContainer";
import LumpsumModal from "./components/LumpsumModal";
import PasswordPromptModal from "./components/PasswordPromptModal";
import EncryptionSettings from "./components/EncryptionSettings";
import CsvImportModal from "./components/CsvImportModal";
import Modal from "./components/Modal";
import { listen } from "@tauri-apps/api/event";
import "./App.css";
import {
  useTransactions,
  useCreateTransaction,
  useUpdateTransaction,
  useDeleteTransaction,
} from "./hooks/useTransactions";

function App() {
  // Database initialization state
  const [databaseStatus, setDatabaseStatus] = useState<DatabaseStatus | null>(
    null
  );
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [passwordError, setPasswordError] = useState<string>("");
  const [isValidatingPassword, setIsValidatingPassword] = useState(false);
  const [isDatabaseInitialized, setIsDatabaseInitialized] = useState(false);

  // UI state
  const [selectedTool, setSelectedTool] = useState("overview");
  const [showToolDropdown, setShowToolDropdown] = useState(false);
  const [showLumpsumModal, setShowLumpsumModal] = useState(false);
  const [showEncryptionSettings, setShowEncryptionSettings] = useState(false);
  const [showCsvImportModal, setShowCsvImportModal] = useState(false);

  const {
    transactions,
    totalCount,
    loading: eventsLoading,
  } = useTransactions(isDatabaseInitialized);

  const createTransactionMutation = useCreateTransaction();
  const updateTransactionMutation = useUpdateTransaction();
  const deleteTransactionMutation = useDeleteTransaction();

  const queryClient = useQueryClient();

  // UI state for editing (keep these)
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [editData, setEditData] = useState<any>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newEventData, setNewEventData] = useState<any>(null);

  // Lumpsum modal state
  const [lumpsumData, setLumpsumData] = useState({
    start_date: "",
    end_date: "",
    total_sats: "",
    total_usd: "",
    frequency: "weekly" as "daily" | "weekly" | "monthly",
    memo: "",
  });

  // Memoized event handlers
  const handleEditEvent = useCallback((transaction: BitcoinTransaction) => {
    setIsCreatingNew(false);
    setNewEventData(null);
    setEditingEventId(transaction.id);
    setEditData({
      type: transaction.type,
      amount_sats: transaction.amount_sats,
      subtotal_cents: transaction.subtotal_cents,
      fee_cents: transaction.fee_cents,
      memo: transaction.memo,
      timestamp: transaction.timestamp,
    });
  }, []);

  const handleSaveEvent = useCallback(async () => {
    if (!editingEventId || !editData) return;

    try {
      await updateTransactionMutation.mutateAsync({
        id: editingEventId,
        request: {
          type: editData.type as "Buy" | "Sell" | "Fee",
          amount_sats: editData.amount_sats,
          subtotal_cents: editData.subtotal_cents,
          fee_cents: editData.fee_cents,
          memo: editData.memo,
          timestamp: editData.timestamp,
        },
      });
    } catch (error) {
      console.error("Error updating event:", error);
    } finally {
      setEditingEventId(null);
      setEditData(null);
    }
  }, [editingEventId, editData, updateTransactionMutation]);

  const handleDeleteEvent = useCallback(async () => {
    if (!editingEventId) return;

    try {
      await deleteTransactionMutation.mutateAsync(editingEventId);
    } catch (error) {
      console.error("Error deleting event:", error);
    } finally {
      setEditingEventId(null);
      setEditData(null);
    }
  }, [editingEventId, deleteTransactionMutation]);

  const handleCancelEdit = useCallback(() => {
    setEditingEventId(null);
    setEditData(null);
  }, []);

  const handleEditDataChange = useCallback((field: string, value: any) => {
    setEditData((prev: any) => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  const handleAddNewEvent = useCallback(() => {
    setIsCreatingNew(true);
    setNewEventData({
      type: "Buy",
      amount_sats: 0,
      subtotal_cents: null,
      fee_cents: 0,
      memo: null,
      timestamp: new Date().toISOString(),
    });
    setEditingEventId(null);
    setEditData(null);
  }, []);

  const handleSaveNewEvent = useCallback(async () => {
    if (!newEventData) return;

    try {
      await createTransactionMutation.mutateAsync({
        type: newEventData.type as "Buy" | "Sell" | "Fee",
        amount_sats: newEventData.amount_sats,
        subtotal_cents: newEventData.subtotal_cents,
        fee_cents: newEventData.fee_cents,
        memo: newEventData.memo,
        timestamp: newEventData.timestamp,
      });
    } catch (error) {
      console.error("Error creating event:", error);
    } finally {
      setIsCreatingNew(false);
      setNewEventData(null);
    }
  }, [newEventData, createTransactionMutation]);

  const handleCancelNewEvent = useCallback(() => {
    setIsCreatingNew(false);
    setNewEventData(null);
  }, []);

  const handleNewEventDataChange = useCallback((field: string, value: any) => {
    setNewEventData((prev: any) => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  const handleSelectEvent = useCallback((eventId: string | null) => {
    setSelectedEventId(eventId);
  }, []);

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

  // Lumpsum modal handlers
  const handleLumpsumDataChange = (field: string, value: any) => {
    setLumpsumData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleCreateLumpsumEvents = async () => {
    try {
      const startDate = new Date(lumpsumData.start_date);
      const endDate = new Date(lumpsumData.end_date);

      if (endDate < startDate) {
        alert("End date cannot be before start date");
        return;
      }

      const createdTransactions =
        await TauriService.createUndocumentedLumpsumTransactions({
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          total_sats: parseInt(lumpsumData.total_sats),
          total_usd_cents: Math.round(parseFloat(lumpsumData.total_usd) * 100),
          frequency: lumpsumData.frequency,
          memo: lumpsumData.memo.trim() || undefined,
        });

      // Invalidate all queries to refetch
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["portfolioMetrics"] });
      queryClient.invalidateQueries({ queryKey: ["activityMetrics"] });

      setShowLumpsumModal(false);
      setLumpsumData({
        start_date: "",
        end_date: "",
        total_sats: "",
        total_usd: "",
        frequency: "weekly",
        memo: "",
      });

      alert(`Successfully created ${createdTransactions.length} transactions`);
    } catch (error) {
      console.error("Error creating lumpsum events:", error);
      alert(`Failed to create events: ${error}`);
    }
  };

  // Check database status on component mount
  useEffect(() => {
    checkDatabaseStatusAndInitialize();
  }, []);

  // Keyboard event listener for shared state
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (editingEventId) {
          handleCancelEdit();
        } else if (isCreatingNew) {
          handleCancelNewEvent();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [editingEventId, isCreatingNew]);

  // Set up menu event listeners once database is initialized
  useEffect(() => {
    if (isDatabaseInitialized) {
      TauriService.updateMenuForDatabaseStatus(true).catch(console.error);

      const setupMenuListeners = async () => {
        await listen("menu-import-v1", async () => {
          try {
            const result = await TauriService.importSatTrackerV1Data();
            console.log("Import result:", result);

            // Invalidate all queries to refetch after import
            queryClient.invalidateQueries({ queryKey: ["transactions"] });
            queryClient.invalidateQueries({ queryKey: ["portfolioMetrics"] });
            queryClient.invalidateQueries({ queryKey: ["activityMetrics"] });

            alert(`Import completed: ${result}`);
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

        await listen("menu-import-csv", () => {
          setShowCsvImportModal(true);
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
        <AppHeader
          selectedTool={selectedTool}
          setSelectedTool={setSelectedTool}
          showToolDropdown={showToolDropdown}
          setShowToolDropdown={setShowToolDropdown}
        />

        <ToolContainer
          selectedTool={selectedTool}
          events={transactions}
          eventsLoading={eventsLoading}
          totalCount={totalCount}
          editingEventId={editingEventId}
          selectedEventId={selectedEventId}
          editData={editData}
          isCreatingNew={isCreatingNew}
          newEventData={newEventData}
          onAddNewEvent={handleAddNewEvent}
          onEditEvent={handleEditEvent}
          onSelectEvent={handleSelectEvent}
          onSaveEvent={handleSaveEvent}
          onDeleteEvent={handleDeleteEvent}
          onCancelEdit={handleCancelEdit}
          onEditDataChange={handleEditDataChange}
          onSaveNewEvent={handleSaveNewEvent}
          onCancelNewEvent={handleCancelNewEvent}
          onNewEventDataChange={handleNewEventDataChange}
        />
      </div>

      <LumpsumModal
        isOpen={showLumpsumModal}
        onClose={() => setShowLumpsumModal(false)}
        lumpsumData={lumpsumData}
        onLumpsumDataChange={handleLumpsumDataChange}
        onCreateEvents={handleCreateLumpsumEvents}
      />

      <CsvImportModal
        isOpen={showCsvImportModal}
        onClose={() => setShowCsvImportModal(false)}
        onImportComplete={(events) => {
          // Invalidate all queries to refetch after import
          queryClient.invalidateQueries({ queryKey: ["transactions"] });
          queryClient.invalidateQueries({ queryKey: ["portfolioMetrics"] });
          queryClient.invalidateQueries({ queryKey: ["activityMetrics"] });

          alert(`Successfully imported ${events.length} events`);
        }}
      />

      {showEncryptionSettings && (
        <Modal
          isOpen={showEncryptionSettings}
          onClose={() => setShowEncryptionSettings(false)}
          title="Database Encryption"
          maxWidth="500px"
          maxHeight="80vh"
        >
          <div className="p-6">
            <EncryptionSettings
              isEncrypted={databaseStatus?.is_encrypted || false}
              onEncryptionChange={async () => {
                await checkDatabaseStatusAndInitialize();
              }}
              onClose={() => setShowEncryptionSettings(false)}
            />
          </div>
        </Modal>
      )}
    </div>
  );
}

export default App;
