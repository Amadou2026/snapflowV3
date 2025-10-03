import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import { AuthProvider } from './context/AuthContext';
import { SidebarProvider } from './context/SidebarContext'; // Ajoutez cette ligne
import App from './App';
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <AuthProvider>
      <SidebarProvider> {/* Ajoutez le SidebarProvider ici */}
        <App />
      </SidebarProvider>
    </AuthProvider>
  </React.StrictMode>
);

reportWebVitals();