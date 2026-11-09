import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { uiLang } from '@/lib/i18n';
import App from './App';
import './style.css';

// 화면 언어(브라우저 언어에 따라 고른 locales 파일)를 문서 언어로 알린다. 글꼴 선택과 화면 낭독기가 이 값을 쓴다.
document.documentElement.lang = uiLang();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
