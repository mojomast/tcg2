// src/index.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App'; // Import the new App component
import './index.css'; // Global styles remain

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Failed to find the root element');

const root = ReactDOM.createRoot(rootElement);

root.render(
  // <React.StrictMode>  // Temporarily disabled to test socket connection
    <App /> 
  // </React.StrictMode>
);
