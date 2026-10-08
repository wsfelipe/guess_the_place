import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './components/App';
import { AuthProvider } from './components/AuthContext';
import '../style.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>
);
