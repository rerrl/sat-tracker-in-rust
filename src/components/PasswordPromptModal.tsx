import React, { useState, useEffect } from "react";

interface PasswordPromptModalProps {
  isOpen: boolean;
  onPasswordSubmit: (password: string) => void;
  onSkip?: () => void; // For unencrypted databases
  isEncrypted: boolean;
  error?: string;
  isValidating: boolean;
}

const PasswordPromptModal: React.FC<PasswordPromptModalProps> = ({
  isOpen,
  onPasswordSubmit,
  onSkip,
  isEncrypted,
  error,
  isValidating
}) => {
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (isOpen) {
      setPassword("");
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.trim() || !isEncrypted) {
      onPasswordSubmit(password);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSubmit(e);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[#2A2633] border border-[rgba(247,243,227,0.3)] rounded-lg p-6 w-96">
        <div className="text-center mb-6">
          <h2 className="text-xl font-semibold text-[#F7F3E3] mb-2">
            {isEncrypted ? "🔐 Database Password" : "🗄️ Database Access"}
          </h2>
          <p className="text-sm text-[rgba(247,243,227,0.7)]">
            {isEncrypted 
              ? "Enter your password to unlock the database"
              : "Database is not encrypted. You can continue without a password or encrypt it later."
            }
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-[rgba(247,243,227,0.8)] mb-2">
              {isEncrypted ? "Password" : "Password (optional)"}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full bg-[#090C08] border border-[rgba(247,243,227,0.3)] text-[#F7F3E3] px-3 py-2 rounded focus:outline-none focus:border-[rgba(247,243,227,0.6)]"
              placeholder={isEncrypted ? "Enter password" : "Leave empty for no encryption"}
              autoFocus
              disabled={isValidating}
            />
          </div>

          {error && (
            <div className="text-red-400 text-sm text-center">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={isValidating || (isEncrypted && !password.trim())}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded transition-colors"
            >
              {isValidating ? "Validating..." : isEncrypted ? "Unlock" : "Continue"}
            </button>
            
            {!isEncrypted && onSkip && (
              <button
                type="button"
                onClick={onSkip}
                disabled={isValidating}
                className="px-4 py-2 text-[rgba(247,243,227,0.7)] hover:text-[#F7F3E3] transition-colors"
              >
                Skip
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default PasswordPromptModal;
