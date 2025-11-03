
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Revert to standard React initialization.
// The browser's script loading order should ensure KaTeX is available before the app runs.
const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
