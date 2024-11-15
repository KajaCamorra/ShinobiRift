"use client";

import { cn } from "@/lib/utils";

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
  children: React.ReactNode;
}

export default function MobileMenu({ isOpen, onClose, className, children }: MobileMenuProps) {
  return (
    <>
      <nav
        className={cn(
          "fixed top-[60px] left-0 w-[250px] h-[calc(100vh-60px)]",
          "bg-[rgba(1,0,3,0.95)] border-r border-[rgba(0,229,255,0.1)]",
          "backdrop-blur-[10px] transition-transform duration-300 p-4 z-[1001]",
          isOpen ? "translate-x-0" : "-translate-x-full",
          className
        )}
      >
        {children}
      </nav>

      {/* Overlay */}
      <div
        onClick={onClose}
        className={cn(
          "fixed inset-0 bg-[rgba(1,0,3,0.7)] backdrop-blur-[3px]",
          "transition-all duration-300 z-[1000]",
          isOpen ? "opacity-100 visible" : "opacity-0 invisible"
        )}
      />
    </>
  );
}

// Menu item component for consistent styling
export function MenuItem({ 
  href, 
  children, 
  className 
}: { 
  href: string; 
  children: React.ReactNode; 
  className?: string;
}) {
  return (
    <a
      href={href}
      className={cn(
        "block p-4 text-[#e4e4e4] no-underline",
        "border-b border-[rgba(0,229,255,0.1)]",
        "transition-all duration-300 hover:bg-[rgba(0,229,255,0.1)] hover:text-[#00e5ff]",
        className
      )}
    >
      {children}
    </a>
  );
}

export function MenuDivider({ className }: { className?: string }) {
  return (
    <div 
      className={cn(
        "h-[1px] bg-[rgba(0,229,255,0.1)] my-2",
        className
      )} 
    />
  );
}