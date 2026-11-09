import { render } from 'preact';
import { uiLang } from '@/lib/i18n';
import App from './App';
import './style.css';

// <html lang>을 화면 언어로 맞춘다. 글꼴 선택과 화면 낭독기가 이 값을 쓴다.
document.documentElement.lang = uiLang();

render(<App />, document.getElementById('root')!);
