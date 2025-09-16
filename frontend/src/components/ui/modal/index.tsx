import { useRef, useEffect } from "react";
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
  children: React.ReactNode;
  title?: string;
  showCloseButton?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
  bodyClassName?: string;
}

const sizeToMaxWidth: Record<NonNullable<ModalProps['size']>, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
};

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  children,
  className,
  title,
  showCloseButton = true,
  size = '2xl',
  bodyClassName,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className={`fixed inset-0 z-50 flex items-start justify-center overflow-y-auto transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'opacity-0'}`}
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 h-full w-full bg-black/60"
        onClick={onClose}
      />

      {/* Modal container */}
      <div
        ref={modalRef}
        className={`relative w-full ${sizeToMaxWidth[size]} mx-4 sm:mx-auto my-8 rounded-lg bg-white dark:bg-gray-800 shadow-xl border border-gray-200 dark:border-gray-700 transform transition-all duration-200 ${isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'} ${className || ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b bg-white/95 dark:bg-gray-800/95 backdrop-blur border-gray-200 dark:border-gray-700 rounded-t-lg">
          {title && <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">{title}</h2>}
          {showCloseButton && (
            <button
              onClick={onClose}
              aria-label="Close"
              className="text-gray-400 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>
          )}
        </div>

        {/* Body (scrollable) */}
        <div className={`p-4 sm:p-6 overflow-y-auto max-h-[calc(90vh-64px)] ${bodyClassName || ''}`}>
          {children}
        </div>
      </div>
    </div>
  );
};
