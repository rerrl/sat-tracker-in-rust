import { useState } from "react";
import Modal from "./Modal";
import { TauriService, ExchangeTransaction } from "../services/tauriService";

interface CsvPreview {
  format: string;
  bitcoin_transactions_found: number;
  headers_found_at_line: number;
  total_rows_in_file: number;
}

interface CsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: (events: ExchangeTransaction[]) => void;
}

export default function CsvImportModal({
  isOpen,
  onClose,
  onImportComplete,
}: CsvImportModalProps) {
  const [selectedFile, setSelectedFile] = useState<string>("");
  const [preview, setPreview] = useState<CsvPreview | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string>("");
  const [step, setStep] = useState<"select" | "preview" | "importing">("select");

  const handleFileSelect = async () => {
    try {
      const { open } = await import('@tauri-apps/plugin-dialog');
      const selected = await open({
        multiple: false,
        filters: [{
          name: 'CSV',
          extensions: ['csv']
        }]
      });
      
      if (selected && typeof selected === 'string') {
        setSelectedFile(selected);
        setError("");
        await analyzeFile(selected);
      }
    } catch (error) {
      console.error("Error selecting file:", error);
      setError("Failed to open file dialog");
    }
  };

  const analyzeFile = async (filePath: string) => {
    setIsAnalyzing(true);
    setError("");
    
    try {
      const preview = await TauriService.analyzeCsvFile(filePath);
      setPreview(preview);
      setStep("preview");
    } catch (error) {
      console.error("Analysis failed:", error);
      setError(error instanceof Error ? error.message : "Failed to analyze file");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) return;

    setIsImporting(true);
    setError("");
    setStep("importing");

    try {
      const events = await TauriService.importCsvData(selectedFile);
      onImportComplete(events);
      handleClose();
    } catch (error) {
      console.error("Import failed:", error);
      setError(error instanceof Error ? error.message : "Import failed");
      setStep("preview");
    } finally {
      setIsImporting(false);
    }
  };

  const handleClose = () => {
    if (!isImporting) {
      setSelectedFile("");
      setPreview(null);
      setError("");
      setStep("select");
      onClose();
    }
  };

  const handleBackToSelect = () => {
    setSelectedFile("");
    setPreview(null);
    setError("");
    setStep("select");
  };

  const getSubtitle = () => {
    if (step === "select") return "Select your Bitcoin exchange CSV file";
    if (step === "preview") return "Review detected Bitcoin transactions before importing";
    if (step === "importing") return "Importing your Bitcoin transactions...";
    return "";
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Import Bitcoin Transactions"
      subtitle={getSubtitle()}
      maxWidth="600px"
      maxHeight="80vh"
      preventCloseOnBackdropClick={isImporting}
      showCloseButton={!isImporting}
    >
      {/* Content */}
      <div className="p-6">
        {step === "select" && (
          <div className="space-y-4">
            {/* File Selection */}
            <div>
              <label className="block text-[rgba(247,243,227,0.8)] font-medium mb-2">
                Select Bitcoin Exchange CSV File
              </label>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={selectedFile ? selectedFile.split('/').pop() || selectedFile : ""}
                  readOnly
                  className="flex-1 bg-[#090C08] border border-[rgba(247,243,227,0.3)] text-[#F7F3E3] px-3 py-2 text-sm rounded"
                  placeholder="No file selected"
                />
                <button
                  onClick={handleFileSelect}
                  disabled={isAnalyzing}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-4 py-2 text-sm rounded"
                >
                  {isAnalyzing ? "Analyzing..." : "Browse"}
                </button>
              </div>
            </div>

            {/* Supported Formats */}
            <div className="bg-[rgba(247,243,227,0.05)] border border-[rgba(247,243,227,0.1)] rounded p-3">
              <p className="text-xs text-[rgba(247,243,227,0.6)] mb-2">Supported Bitcoin exchanges:</p>
              <ul className="text-xs text-[#F7F3E3] space-y-1">
                <li>• Coinbase (Bitcoin buys and sells)</li>
                <li>• River (Bitcoin buys and sells)</li>
                <li>• More Bitcoin exchanges coming soon...</li>
              </ul>
            </div>
          </div>
        )}

        {step === "preview" && preview && (
          <div className="space-y-4">
            {/* Detection Results */}
            <div className="bg-green-900/20 border border-green-500/30 rounded p-3">
              <p className="text-green-400 text-sm font-medium mb-1">
                ✅ Format Detected: {preview.format}
              </p>
              <p className="text-xs text-[rgba(247,243,227,0.6)]">
                Found {preview.bitcoin_transactions_found} Bitcoin transactions 
                (from {preview.total_rows_in_file} total rows, headers at line {preview.headers_found_at_line})
              </p>
            </div>

            {/* Summary instead of sample data */}
            <div className="bg-[rgba(247,243,227,0.05)] border border-[rgba(247,243,227,0.1)] rounded p-3">
              <p className="text-sm text-[rgba(247,243,227,0.8)] mb-2">Import Summary:</p>
              <ul className="text-xs text-[#F7F3E3] space-y-1">
                <li>• {preview.bitcoin_transactions_found} Bitcoin buy/sell transactions detected</li>
                <li>• Non-Bitcoin assets will be ignored</li>
                <li>• Duplicate transactions will be skipped</li>
              </ul>
            </div>

            {/* File Info */}
            <div className="text-xs text-[rgba(247,243,227,0.6)]">
              <p>File: {selectedFile.split('/').pop() || selectedFile}</p>
            </div>
          </div>
        )}

        {step === "importing" && (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">⏳</div>
            <p className="text-[#F7F3E3] mb-2">Processing your Bitcoin transactions...</p>
            <p className="text-xs text-[rgba(247,243,227,0.6)]">
              This may take a moment for large files
            </p>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-900/20 border border-red-500/30 rounded p-3 mt-4">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-6 flex gap-3">
          {step === "select" && (
            <button
              onClick={handleClose}
              disabled={isAnalyzing}
              className="flex-1 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-500 text-white py-2 px-4 text-sm rounded"
            >
              Cancel
            </button>
          )}

          {step === "preview" && (
            <>
              <button
                onClick={handleBackToSelect}
                className="bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 text-sm rounded"
              >
                Back
              </button>
              <button
                onClick={handleImport}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 text-sm rounded"
              >
                Import {preview!.bitcoin_transactions_found} Bitcoin Transactions
              </button>
            </>
          )}

          {step === "importing" && (
            <button
              disabled
              className="flex-1 bg-gray-500 text-gray-300 cursor-not-allowed py-2 px-4 text-sm rounded"
            >
              Importing...
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}
