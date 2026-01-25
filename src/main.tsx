import * as React from 'react';
import { createRoot } from 'react-dom/client'
import { useEffect } from 'react';
import App from './App'
import './index.css'

function RootApp() {
  useEffect(() => {
    const meta = document.createElement('meta');
    meta.name = 'yandex-verification';
    meta.content = 'e4f71593ff2478e9';
    document.head.appendChild(meta);
  }, []);

  return <App />;
}

createRoot(document.getElementById("root")!).render(<RootApp />);