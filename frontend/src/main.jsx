import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { Toaster } from 'sonner';
import { store } from './app/store.js';
import { ThemeProvider } from './lib/theme/ThemeProvider.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import App from './App.jsx';
import './index.css';

// iOS Safari freezes when backdrop-filter is composited over fixed/scrolling
// layers. Tag the document so CSS can disable those effects on iOS only.
// (iPadOS 13+ reports as "Mac", so also check for a touch-capable Mac.)
const isIOS =
  /iP(hone|od|ad)/.test(navigator.platform) ||
  (/Mac/.test(navigator.platform) && navigator.maxTouchPoints > 1) ||
  /iPad|iPhone|iPod/.test(navigator.userAgent);
if (isIOS) document.documentElement.classList.add('ios');

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <Provider store={store}>
        <ThemeProvider>
          <App />
          <Toaster position="top-right" theme="system" richColors closeButton />
        </ThemeProvider>
      </Provider>
    </ErrorBoundary>
  </React.StrictMode>
);
