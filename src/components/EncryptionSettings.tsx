import React, { useState } from "react";
import { TauriService } from "../services/tauriService";

interface EncryptionSettingsProps {
  isEncrypted: boolean;
  onEncryptionChange: () => void; // Callback to refresh encryption status
  onClose?: () => void; // Optional callback to close the settings modal
}

const EncryptionSettings: React.FC<EncryptionSettingsProps> = ({
  isEncrypted,
  onEncryptionChange,
  onClose,
}) => {
  const [showEncryptForm, setShowEncryptForm] = useState(false);
  const [showChangePasswordForm, setShowChangePasswordForm] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">(
    "success",
  );
  const [passwordChangeSuccess, setPasswordChangeSuccess] = useState(false);

  const showMessage = (msg: string, type: "success" | "error") => {
    setMessage(msg);
    setMessageType(type);
    // setTimeout(() => setMessage(""), 5000);
  };

  const handleEncryptDatabase = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      showMessage("Passwords do not match", "error");
      return;
    }

    if (newPassword.length < 8) {
      showMessage("Password must be at least 8 characters", "error");
      return;
    }

    setIsProcessing(true);
    try {
      const result = await TauriService.encryptDatabase(newPassword);
      showMessage(result, "success");
      setShowEncryptForm(false);
      setNewPassword("");
      setConfirmPassword("");
      onEncryptionChange();

      // Add app quit after short delay
      setTimeout(async () => {
        await TauriService.quitApp();
      }, 2000);
    } catch (error) {
      showMessage(`Failed to encrypt database: ${error}`, "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      showMessage("New passwords do not match", "error");
      return;
    }

    if (newPassword.length < 8) {
      showMessage("Password must be at least 8 characters", "error");
      return;
    }

    setIsProcessing(true);
    try {
      const result = await TauriService.changeDatabasePassword(
        currentPassword,
        newPassword,
      );
      showMessage(result, "success");
      setPasswordChangeSuccess(true);
      setShowChangePasswordForm(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      // Add app quit after short delay
      setTimeout(async () => {
        await TauriService.quitApp();
      }, 2000);
    } catch (error) {
      showMessage(`Failed to change password: ${error}`, "error");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="border-b border-[rgba(247,243,227,0.2)] pb-2">
        <h3 className="text-lg font-semibold text-[#F7F3E3] mb-2">
          🔐 Database Encryption
        </h3>
        <p className="text-sm text-[rgba(247,243,227,0.7)]">
          Status:{" "}
          <span className={isEncrypted ? "text-green-400" : "text-red-400"}>
            {isEncrypted ? "🔒 Encrypted" : "🔓 Not Encrypted"}
          </span>
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

      {!isEncrypted ? (
        <div>
          <p className="text-sm text-[rgba(247,243,227,0.6)] mb-3">
            Your database is not encrypted. You can add encryption to protect
            your data.
          </p>

          <div className="bg-red-900 border border-red-700 p-3 rounded mb-3">
            <p className="text-red-200 text-sm font-medium">
              ⚠️ Important: The application will automatically close after
              successful encryption to ensure changes take effect properly.
            </p>
          </div>

          {!showEncryptForm ? (
            <button
              onClick={() => setShowEncryptForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm"
            >
              Encrypt Database
            </button>
          ) : (
            <form onSubmit={handleEncryptDatabase} className="space-y-3">
              <div>
                <label className="block text-sm text-[rgba(247,243,227,0.8)] mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-[#090C08] border border-[rgba(247,243,227,0.3)] text-[#F7F3E3] px-3 py-2 rounded text-sm"
                  placeholder="Enter new password (min 8 characters)"
                  required
                  minLength={8}
                  disabled={isProcessing}
                />
              </div>

              <div>
                <label className="block text-sm text-[rgba(247,243,227,0.8)] mb-1">
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-[#090C08] border border-[rgba(247,243,227,0.3)] text-[#F7F3E3] px-3 py-2 rounded text-sm"
                  placeholder="Confirm new password"
                  required
                  disabled={isProcessing}
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-4 py-2 rounded text-sm"
                >
                  {isProcessing ? "Encrypting..." : "Encrypt Database"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowEncryptForm(false);
                    setNewPassword("");
                    setConfirmPassword("");
                  }}
                  disabled={isProcessing}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded text-sm"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      ) : (
        <div>
          <p className="text-sm text-[rgba(247,243,227,0.6)] mb-3">
            Your database is encrypted. You can change your password below.
          </p>

          {passwordChangeSuccess && (
            <div className="mb-3">
              <button
                onClick={() => {
                  setPasswordChangeSuccess(false);
                  if (onClose) onClose();
                }}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm"
              >
                Done
              </button>
            </div>
          )}

          {!showChangePasswordForm && !passwordChangeSuccess && (
            <div className="flex gap-2">
              <button
                onClick={() => setShowChangePasswordForm(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm"
              >
                Change Password
              </button>
              {onClose && (
                <button
                  onClick={onClose}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded text-sm"
                >
                  Cancel
                </button>
              )}
            </div>
          )}

          {showChangePasswordForm && (
            <form onSubmit={handleChangePassword} className="space-y-3">
              <div className="bg-red-900 border border-red-700 p-3 rounded mb-3">
                <p className="text-red-200 text-sm font-medium">
                  ⚠️ Important: The application will automatically close after
                  successful password change to ensure changes take effect
                  properly.
                </p>
              </div>
              <div>
                <label className="block text-sm text-[rgba(247,243,227,0.8)] mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full bg-[#090C08] border border-[rgba(247,243,227,0.3)] text-[#F7F3E3] px-3 py-2 rounded text-sm"
                  placeholder="Enter current password"
                  required
                  disabled={isProcessing}
                />
              </div>

              <div>
                <label className="block text-sm text-[rgba(247,243,227,0.8)] mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-[#090C08] border border-[rgba(247,243,227,0.3)] text-[#F7F3E3] px-3 py-2 rounded text-sm"
                  placeholder="Enter new password (min 8 characters)"
                  required
                  minLength={8}
                  disabled={isProcessing}
                />
              </div>

              <div>
                <label className="block text-sm text-[rgba(247,243,227,0.8)] mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-[#090C08] border border-[rgba(247,243,227,0.3)] text-[#F7F3E3] px-3 py-2 rounded text-sm"
                  placeholder="Confirm new password"
                  required
                  disabled={isProcessing}
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-4 py-2 rounded text-sm"
                >
                  {isProcessing ? "Changing..." : "Change Password"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowChangePasswordForm(false);
                    setCurrentPassword("");
                    setNewPassword("");
                    setConfirmPassword("");
                    setPasswordChangeSuccess(false);
                  }}
                  disabled={isProcessing}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded text-sm"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
};

export default EncryptionSettings;
