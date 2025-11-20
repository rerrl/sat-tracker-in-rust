import React, { useEffect } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidth?: string;
  maxHeight?: string;
  showCloseButton?: boolean;
  preventCloseOnBackdropClick?: boolean;
}

export default function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = "600px",
  maxHeight = "80vh",
  showCloseButton = true,
  preventCloseOnBackdropClick = false,
}: ModalProps) {
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscapeKey);
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !preventCloseOnBackdropClick) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 backdrop-blur-xs flex items-center justify-center z-50"
      onClick={handleBackdropClick}
    >
      <div
        className="bg-[#2A2633] border border-[rgba(247,243,227,0.3)] rounded-lg overflow-hidden"
        style={{ width: maxWidth, maxHeight }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-[rgba(247,243,227,0.2)]">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-semibold text-[#F7F3E3]">
                {title}
              </h3>
              {subtitle && (
                <p className="text-sm text-[rgba(247,243,227,0.6)] mt-1">
                  {subtitle}
                </p>
              )}
            </div>
            {showCloseButton && (
              <button
                onClick={onClose}
                className="text-[rgba(247,243,227,0.6)] hover:text-[#F7F3E3] text-xl ml-4"
              >
                ×
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto" style={{ maxHeight: `calc(${maxHeight} - 120px)` }}>
          {children}
        </div>
      </div>
    </div>
  );
}
