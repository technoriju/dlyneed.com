"use client";

import Image from "next/image";
import { useState } from "react";
import { LockIcon, ReturnIcon, TruckIcon } from "@/components/layout/icons";

type Props = {
  images: string[];
  name: string;
  discountPct: number;
};

export function ProductGallery({ images, name, discountPct }: Props) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });

  const activeImage = images[selectedIndex] || images[0] || "/images/products/backpack.jpg";

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isZoomed) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
    setZoomPos({ x, y });
  };

  return (
    <div className="sticky top-[92px] grid gap-3.5 max-[720px]:static">
      {/* Main Image Stage */}
      <div
        id="stage"
        onClick={() => setIsZoomed((prev) => !prev)}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setIsZoomed(false)}
        className={`relative aspect-square overflow-hidden rounded-lg bg-surface-muted select-none ${
          isZoomed ? "cursor-zoom-out" : "cursor-zoom-in"
        }`}
        title={isZoomed ? "Click to zoom out" : "Click to zoom in"}
      >
        <Image
          src={activeImage}
          alt={name}
          fill
          priority
          sizes="(max-width: 720px) 100vw, 550px"
          style={{
            transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`,
            transform: isZoomed ? "scale(2)" : "scale(1)",
            transition: isZoomed ? "none" : "transform 0.25s ease",
          }}
          className="object-cover pointer-events-none"
        />

        {discountPct > 0 && (
          <span className="absolute top-4 left-4 z-10 rounded-sm bg-brand-600 px-2.5 py-1 text-xs font-bold text-white shadow-xs">
            -{discountPct}%
          </span>
        )}
      </div>

      {/* Multiple Image Thumbnails if more than 1 image */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar" role="tablist" aria-label="Product thumbnails">
          {images.map((img, idx) => (
            <button
              key={idx}
              type="button"
              role="tab"
              aria-selected={idx === selectedIndex}
              onClick={() => {
                setSelectedIndex(idx);
                setIsZoomed(false);
              }}
              className={`relative size-14 sm:size-16 flex-none overflow-hidden rounded-md border-2 bg-surface-muted transition-colors ${
                idx === selectedIndex ? "border-brand-600 ring-2 ring-brand-100" : "border-border hover:border-brand-500"
              }`}
            >
              <Image src={img} alt={`${name} thumbnail ${idx + 1}`} fill sizes="64px" className="object-cover" />
            </button>
          ))}
        </div>
      )}

      {/* Perks Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-2.5">
        <div className="flex items-center gap-2 rounded-md bg-brand-50 p-2 sm:p-2.5 text-xs text-ink-500">
          <TruckIcon size={18} className="flex-none text-brand-600" />
          <span>Free shipping over ₹999</span>
        </div>
        <div className="flex items-center gap-2 rounded-md bg-brand-50 p-2 sm:p-2.5 text-xs text-ink-500">
          <ReturnIcon size={18} className="flex-none text-brand-600" />
          <span>30-day returns</span>
        </div>
        <div className="flex items-center gap-2 rounded-md bg-brand-50 p-2 sm:p-2.5 text-xs text-ink-500">
          <LockIcon size={18} className="flex-none text-brand-600" />
          <span>Secure checkout</span>
        </div>
      </div>
    </div>
  );
}
