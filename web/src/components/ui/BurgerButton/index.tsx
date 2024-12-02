"use client";

import { cn } from "@/lib/utils";

interface BurgerButtonProps {
  isOpen: boolean;
  onClick: () => void;
  className?: string;
}

export default function BurgerButton({ isOpen, onClick, className }: BurgerButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col justify-between w-[30px] h-[20px] bg-transparent border-none cursor-pointer p-0 z-[1003]",
        className
      )}
      aria-label={isOpen ? "Close menu" : "Open menu"}
      aria-expanded={isOpen}
    >
      <span 
        className={cn(
          "w-full h-[2px] bg-[#00e5ff] shadow-[0_0_5px_rgba(0,229,255,0.5)] transition-all duration-300",
          isOpen && "translate-y-[9px] rotate-45"
        )}
      />
      <span 
        className={cn(
          "w-full h-[2px] bg-[#00e5ff] shadow-[0_0_5px_rgba(0,229,255,0.5)] transition-all duration-300",
          isOpen && "opacity-0"
        )}
      />
      <span 
        className={cn(
          "w-full h-[2px] bg-[#00e5ff] shadow-[0_0_5px_rgba(0,229,255,0.5)] transition-all duration-300",
          isOpen && "-translate-y-[9px] -rotate-45"
        )}
      />
    </button>
  );
}