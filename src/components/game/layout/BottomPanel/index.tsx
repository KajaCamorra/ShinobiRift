// src/components/game/layout/BottomPanel/index.tsx
export default function BottomPanel() {
    return (
      <div className="h-[200px] bg-bright-blue/5 border-t border-bright-blue/10 
                      backdrop-blur-md p-4">
        <div className="text-bright-blue font-goldman mb-2">
          Current Location: Crystal Wastes
        </div>
        <div className="text-text/80">Energy Level: 85%</div>
        <div className="text-text/80">
          Active Effects: Speed Boost (2:45), Shadow Veil (1:30)
        </div>
      </div>
    );
  }