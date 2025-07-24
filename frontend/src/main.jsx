import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Check if MetaMask is installed
const checkMetaMask = () => {
  if (window.ethereum) {
    return true;
  }
  return false;
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {checkMetaMask() ? (
      <App />
    ) : (
      <div className="metamask-warning">
        <h1>MetaMask Not Detected</h1>
        <p>This dApp requires MetaMask to function properly. Please install the MetaMask extension and refresh the page.</p>
        <a href="https://metamask.io/download/" target="_blank" rel="noopener noreferrer" className="metamask-link">
          Install MetaMask
        </a>
      </div>
    )}
  </React.StrictMode>,
)
