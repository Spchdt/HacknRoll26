import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { setApiProvider } from './api/client';
import { mockApi } from './api/mockData';
import './styles/globals.css';
import './styles/index.css';

// Use mock API in development (no backend needed)
// Switch to real API by removing this line when backend is ready
const USE_MOCK_API = true;

if (USE_MOCK_API) {
  setApiProvider(mockApi);
  console.log('🎮 [DEBUG] Using mock API - no backend required');
}

createRoot(document.getElementById('app')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
