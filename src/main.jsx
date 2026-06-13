import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './styles.css';

const baseUrl = import.meta.env.BASE_URL;
const swPath = `${baseUrl}sw.js`.replace(/\/{2,}/g, '/');

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(swPath).catch(() => undefined);
  });
}

const routerBasename = baseUrl === '/' ? undefined : baseUrl.replace(/\/$/, '');

ReactDOM.createRoot(document.getElementById('app')).render(
  <React.StrictMode>
    <BrowserRouter basename={routerBasename}>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);
