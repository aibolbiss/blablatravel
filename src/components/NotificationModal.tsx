'use client';
import { useEffect } from 'react';

export default function NotificationModal({
  isOpen,
  message,
  onClose,
}: {
  isOpen: boolean;
  message: string;
  onClose: () => void;
}) {
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(onClose, 2000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center pb-8 pointer-events-none">
      <div className="pointer-events-auto rounded-lg bg-green-600 px-6 py-3 text-white font-medium shadow-lg animate-in fade-in-0 slide-in-from-bottom-5 duration-300">
        {message}
      </div>
    </div>
  );
}
