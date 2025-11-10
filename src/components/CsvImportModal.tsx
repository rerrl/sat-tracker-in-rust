import { useState } from "react";
import { TauriService, BalanceChangeEvent } from "../services/tauriService";

interface CsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: (events: BalanceChangeEvent[]) => void;
}

export default function CsvImportModal({
  isOpen,
  onClose,
  onImportComplete,
}: CsvImportModalProps) {
  const [selectedFile, setSelectedFile] = useState<string>("");
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string>("");

  if (!isOpen) return null;

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
      }
    } catch (error) {
      console.error("Error selecting file:", error);
      setError("Failed to open file dialog");
    }
  };

  const handleImport = async () => {
    if (!selectedFile) return;

    setIsImporting(true);
    setError("");

    try {
      const events = await TauriService.importCsvData(selectedFile);
      onImportComplete(events);
      onClose();
      setSelectedFile("");
    } catch (error) {
      console.error("Import failed:", error);
      setError(error instanceof Error ? error.message : "Import failed");
    } finally {
      setIsImporting(false);
    }
  };

  const handleClose = () => {
    if (!isImporting) {
      setSelectedFile("");
      setError("");
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isImporting) {
          handleClose();
        }
      }}
    >
      <div
        className="bg-[#2A2633] border border-[rgba(247,243,227,0.3)] rounded-lg w-[500px]"
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-[rgba(247,243,227,0.2)]">
          <h3 className="text-lg font-semibold text-[#F7F3E3]">
            Import CSV Data
          </h3>
          <p className="text-sm text-[rgba(247,243,227,0.6)] mt-1">
            Import transactions from Coinbase or River CSV exports
          </p>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="space-y-4">
            {/* File Selection */}
            <div>
              <label className="block text-[rgba(247,243,227,0.8)] font-medium mb-2">
                Select CSV File
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
                  disabled={isImporting}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-4 py-2 text-sm rounded"
                >
                  Browse
                </button>
              </div>
            </div>

            {/* Supported Formats */}
            <div className="bg-[rgba(247,243,227,0.05)] border border-[rgba(247,243,227,0.1)] rounded p-3">
              <p className="text-xs text-[rgba(247,243,227,0.6)] mb-2">Supported formats:</p>
              <ul className="text-xs text-[#F7F3E3] space-y-1">
                <li>• Coinbase transaction exports</li>
                <li>• River transaction exports</li>
              </ul>
            </div>

            {/* Error Display */}
            {error && (
              <div className="bg-red-900/20 border border-red-500/30 rounded p-3">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {/* Import Status */}
            {isImporting && (
              <div className="bg-blue-900/20 border border-blue-500/30 rounded p-3">
                <p className="text-blue-400 text-sm">Importing transactions...</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[rgba(247,243,227,0.2)] flex gap-3">
          <button
            onClick={handleImport}
            disabled={!selectedFile || isImporting}
            className={`flex-1 py-2 px-4 text-sm rounded ${
              selectedFile && !isImporting
                ? "bg-green-600 hover:bg-green-700 text-white"
                : "bg-gray-500 text-gray-300 cursor-not-allowed"
            }`}
          >
            {isImporting ? "Importing..." : "Import"}
          </button>
          <button
            onClick={handleClose}
            disabled={isImporting}
            className="flex-1 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-500 text-white py-2 px-4 text-sm rounded"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
