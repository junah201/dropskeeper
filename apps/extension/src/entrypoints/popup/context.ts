import { createContext, useContext } from 'react';
import { defaultSettings, type Settings } from '@/lib/types';

/** 팝업 어디서나 쓰는 설정 값과 설정 화면 열기·닫기 */
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
