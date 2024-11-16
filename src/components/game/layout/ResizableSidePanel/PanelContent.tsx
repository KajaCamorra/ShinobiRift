// src/components/game/layout/ResizableSidePanel/PanelContent.tsx
"use client";

import { useGameLayout } from '@/contexts/GameLayoutContext';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PanelContentProps {
  onClose?: () => void;
}

export default function PanelContent({ onClose }: PanelContentProps) {
  const { activePanel } = useGameLayout();

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-neon-pink/10 lg:hidden">
        <h2 className="font-goldman text-neon-pink">
          {activePanel.charAt(0).toUpperCase() + activePanel.slice(1)}
        </h2>
        {onClose && (
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-neon-pink"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {activePanel === 'chat' && (
          <div className="h-full flex flex-col p-4">
            <h2 className="font-goldman text-neon-pink mb-4 hidden lg:block">Global Chat</h2>
            <div className="flex-1 overflow-y-auto mb-4 space-y-4">
              {/* Sample chat messages */}
              <ChatMessage
                sender="ShadowBlade"
                message="Anyone up for Crystal Wastes raid?"
                time="2:45 PM"
              />
              <ChatMessage
                sender="NinjaMaster"
                message="Count me in!"
                time="2:46 PM"
              />
              <ChatMessage
                sender="System"
                message="New event starting in 5 minutes!"
                time="2:50 PM"
                isSystem
              />
            </div>
            <div className="flex gap-2 p-2 bg-neon-pink/10 rounded border border-neon-pink/20">
              <input
                type="text"
                placeholder="Type your message..."
                className="flex-1 bg-transparent border-none outline-none text-text"
              />
              <button className="px-4 py-2 bg-neon-pink/20 text-text rounded
                             hover:bg-neon-pink/30 transition-colors">
                Send
              </button>
            </div>
          </div>
        )}

        {activePanel === 'inventory' && (
          <div className="p-4">
            <h2 className="font-goldman text-neon-pink mb-4 hidden lg:block">Inventory</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {/* Sample inventory items */}
              {SAMPLE_ITEMS.map((item, index) => (
                <InventoryItem key={index} {...item} />
              ))}
            </div>
          </div>
        )}

        {activePanel === 'map' && (
          <div className="p-4">
            <h2 className="font-goldman text-neon-pink mb-4 hidden lg:block">Map</h2>
            <div className="aspect-square bg-neon-pink/10 rounded border border-neon-pink/20">
              {/* Map content will go here */}
              <div className="h-full flex items-center justify-center text-text/50">
                Map Coming Soon
              </div>
            </div>
          </div>
        )}

        {activePanel === 'settings' && (
          <div className="p-4">
            <h2 className="font-goldman text-neon-pink mb-4 hidden lg:block">Settings</h2>
            <div className="space-y-4">
              {/* Sample settings */}
              <SettingsOption label="Notifications" />
              <SettingsOption label="Sound Effects" />
              <SettingsOption label="Music" />
              <SettingsOption label="Chat Filter" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Helper Components
interface ChatMessageProps {
  sender: string;
  message: string;
  time: string;
  isSystem?: boolean;
}

function ChatMessage({ sender, message, time, isSystem }: ChatMessageProps) {
  return (
    <div className="p-3 bg-neon-pink/10 rounded border border-neon-pink/20">
      <div className="flex justify-between mb-1 text-sm">
        <span className={cn(
          "font-medium",
          isSystem ? "text-yellow-400" : "text-neon-pink"
        )}>
          {sender}
        </span>
        <span className="text-text/50">{time}</span>
      </div>
      <p className="text-text">{message}</p>
    </div>
  );
}

interface InventoryItemProps {
  icon: string;
  name: string;
  count: number;
}

function InventoryItem({ icon, name, count }: InventoryItemProps) {
  return (
    <div className="aspect-square bg-neon-pink/10 rounded border border-neon-pink/20
                    p-2 flex flex-col items-center justify-center gap-2
                    hover:bg-neon-pink/20 transition-colors cursor-pointer">
      <div className="text-2xl">{icon}</div>
      <div className="text-sm text-center text-text">{name}</div>
      <div className="text-xs text-text/50">x{count}</div>
    </div>
  );
}

function SettingsOption({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-between p-3 
                    bg-neon-pink/10 rounded border border-neon-pink/20">
      <span className="text-text">{label}</span>
      <button className="w-12 h-6 bg-neon-pink/20 rounded-full
                        flex items-center px-1 cursor-pointer
                        hover:bg-neon-pink/30 transition-colors">
        <div className="w-4 h-4 bg-text rounded-full" />
      </button>
    </div>
  );
}

// Sample Data
const SAMPLE_ITEMS = [
  { icon: '⚔️', name: 'Katana', count: 1 },
  { icon: '🗡️', name: 'Kunai', count: 5 },
  { icon: '💫', name: 'Smoke Bomb', count: 3 },
  { icon: '🌟', name: 'Chakra Crystal', count: 10 },
  { icon: '📜', name: 'Scroll', count: 2 },
  { icon: '🔮', name: 'Spirit Orb', count: 7 },
];