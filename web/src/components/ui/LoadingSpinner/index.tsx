"use client";

export default function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center">
      <div className="relative w-12 h-12">
        {/* Outer ring */}
        <div className="absolute inset-0 border-4 border-neon-pink/20 rounded-full"></div>
        {/* Spinning ring */}
        <div className="absolute inset-0 border-4 border-transparent border-t-neon-pink rounded-full animate-spin"></div>
      </div>
    </div>
  );
}
