// src/components/game/layout/Header/index.tsx
"use client";

import { useAuth } from '@/hooks/useAuth';
import { useGameLayout } from '@/contexts/GameLayoutContext';
import Link from 'next/link';
import { Menu, X, MessageSquare, Heart, Map, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '#', label: 'Shop' },
  { href: '#', label: 'Travel' },
  { href: '#', label: 'Clan' },
  { href: '#', label: 'Lore' },
  { href: '#', label: 'Blog' },
];

const PANEL_ITEMS = [
  { id: 'chat', icon: MessageSquare, label: 'Chat' },
  { id: 'inventory', icon: Heart, label: 'Inventory' },
  { id: 'map', icon: Map, label: 'Map' },
  { id: 'settings', icon: Settings, label: 'Settings' },
] as const;

export default function Header() {
  const { logout } = useAuth();
  const { 
    isMobileMenuOpen, 
    setIsMobileMenuOpen,
    activePanel,
    setActivePanel,
    isPanelOpen,
    setIsPanelOpen
  } = useGameLayout();

  const handlePanelToggle = (panelId: typeof PANEL_ITEMS[number]['id']) => {
    if (activePanel === panelId && isPanelOpen) {
      setIsPanelOpen(false);
    } else {
      setActivePanel(panelId);
      setIsPanelOpen(true);
    }
  };

  return (
    <header className="fixed top-0 left-0 w-[calc(100%-15px)] h-[60px] z-[1002]
                     bg-gradient-to-b from-dark-bg/65 via-dark-bg/50 to-dark-bg/30
                     border-b border-bright-blue/10 backdrop-blur-md">
      <div className="flex items-center justify-between h-full px-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden"
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6 text-bright-blue" />
            ) : (
              <Menu className="w-6 h-6 text-bright-blue" />
            )}
          </button>

          <span className="font-goldman text-bright-blue text-xl hidden md:block">
            SHINOBI RIFT
          </span>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-8">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="nav-link"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Mobile Panel Icons */}
          <div className="flex items-center gap-2 lg:hidden">
            {PANEL_ITEMS.map(({ id, icon: Icon }) => (
              <button
                key={id}
                onClick={() => handlePanelToggle(id)}
                className={cn(
                  "w-10 h-10 flex items-center justify-center",
                  "border border-bright-blue/20 rounded-lg",
                  "bg-bright-blue/5 text-bright-blue",
                  "transition-all duration-300",
                  activePanel === id && isPanelOpen && "bg-bright-blue/20 border-bright-blue"
                )}
              >
                <Icon className="w-5 h-5" />
              </button>
            ))}
          </div>
        </div>

        {/* Desktop Logout Button */}
        <button
          onClick={() => logout()}
          className="px-4 py-2 text-bright-blue border border-bright-blue/20 
                   hover:bg-bright-blue/10 transition-all duration-300 rounded
                   hidden lg:block"
        >
          Logout
        </button>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="fixed top-[60px] left-0 w-full h-[calc(100vh-60px)] 
                      bg-dark-bg/95 backdrop-blur-md z-[1001] lg:hidden">
          <nav className="flex flex-col p-4">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="py-3 px-4 text-text hover:text-bright-blue 
                         transition-colors border-b border-bright-blue/10"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                logout();
              }}
              className="py-3 px-4 text-bright-blue hover:bg-bright-blue/10 
                       transition-colors mt-4 text-left"
            >
              Logout
            </button>
          </nav>
        </div>
      )}
    </header>
  );
}