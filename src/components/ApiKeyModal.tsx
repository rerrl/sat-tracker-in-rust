import { useState, useEffect } from "react";
import Modal from "./Modal";
import { TauriService } from "../services/tauriService";

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ApiKeyModal({ isOpen, onClose }: ApiKeyModalProps) {
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("success");

  const showMessage = (msg: string, type: "success" | "error") => {
    setMessage(msg);
    setMessageType(type);
  };

  // Load existing key on open
  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      setMessage("");
      TauriService.getApiKey()
        .then((existing) => {
          if (existing) {
            setApiKey(existing);
          }
        })
        .catch((err) => {
          console.error("Failed to load API key:", err);
        })
        .finally(() => setIsLoading(false));
    } else {
      // Reset on close
      setApiKey("");
      setShowKey(false);
      setMessage("");
      setIsProcessing(false);
    }
  }, [isOpen]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!apiKey.trim()) {
      showMessage("Please enter an API key", "error");
      return;
    }

    setIsProcessing(true);
    try {
      const result = await TauriService.saveApiKey(apiKey.trim());
      showMessage(result, "success");
    } catch (error) {
      showMessage(`Failed to save API key: ${error}`, "error");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add API Key"
      subtitle="Store a premium API key for future backend data requests"
      maxWidth="500px"
      maxHeight="auto"
    >
      <div className="p-6">
        {isLoading ? (
          <div className="text-center py-8">
            <p className="text-sm text-[rgba(247,243,227,0.6)]">Loading...</p>
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-sm text-[rgba(247,243,227,0.8)] mb-1">
                dprogram.me API Key
              </label>
              <div className="relative">
                <input
                  type={showKey ? "text" : "password"}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="w-full bg-[#090C08] border border-[rgba(247,243,227,0.3)] text-[#F7F3E3] px-3 py-2 pr-10 text-sm rounded"
                  placeholder="Paste your API key here"
                  disabled={isProcessing}
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[rgba(247,243,227,0.5)] hover:text-[#F7F3E3] text-sm"
                >
                  {showKey ? "🙈" : "👁"}
                </button>
              </div>
            </div>

            <div className="bg-[rgba(247,243,227,0.05)] border border-[rgba(247,243,227,0.1)] rounded p-3">
              <p className="text-xs text-[rgba(247,243,227,0.6)]">
                This key will be stored securely in your local database and used
                for authenticated API requests to dprogram.me services.
              </p>
            </div>

            {message && (
              <div
                className={`p-3 rounded text-sm ${
                  messageType === "success"
                    ? "bg-green-900 text-green-200 border border-green-700"
                    : "bg-red-900 text-red-200 border border-red-700"
                }`}
              >
                {message}
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={isProcessing}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white py-2 px-4 text-sm rounded"
              >
                {isProcessing ? "Saving..." : "Save"}
              </button>
              <button
                type="button"
                onClick={onClose}
                disabled={isProcessing}
                className="flex-1 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-500 text-white py-2 px-4 text-sm rounded"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
}