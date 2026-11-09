import { createContext } from 'preact';
import { useContext } from 'preact/hooks';
import { defaultSettings, type Settings } from '@/lib/types';

export interface PopupContext {
  settings: Settings;
  settingsOpen: boolean;
  openSettings: () => void;
  closeSettings: () => void;
}

export const PopupCtx = createContext<PopupContext>({
  settings: defaultSettings,
  settingsOpen: false,
  openSettings: () => {},
  closeSettings: () => {},
});

export const usePopup = () => useContext(PopupCtx);
