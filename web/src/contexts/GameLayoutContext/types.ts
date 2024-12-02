export type ActivePanel = 'chat' | 'inventory' | 'map' | 'settings';

export interface GameLayoutContextType {
  isPanelOpen: boolean;
  setIsPanelOpen: (value: boolean) => void;
  activePanel: ActivePanel;
  setActivePanel: (panel: ActivePanel) => void;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (value: boolean) => void;
  panelWidth: number;
  setPanelWidth: (width: number) => void;
}
