'use client';

import { useState } from 'react';
import Image from 'next/image';

interface ImageModalProps {
  src: string;
  alt: string;
}

export default function ImageModal({ src, alt }: ImageModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div
        className="relative h-[420px] w-full cursor-pointer rounded-2xl border border-line shadow-card transition-opacity hover:opacity-90"
        onClick={() => setIsOpen(true)}
      >
        <Image
          src={src}
          alt={alt}
          fill
          sizes="(min-width: 768px) 700px, 100vw"
          className="rounded-2xl object-cover"
          priority
        />
      </div>

      {isOpen && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        >
          <button
            onClick={() => setIsOpen(false)}
            className="absolute top-6 right-6 z-[10000] rounded-lg bg-white/20 p-2 hover:bg-white/30 transition-colors"
            aria-label="Закрыть"
          >
            <svg
              className="h-6 w-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={alt}
            className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
