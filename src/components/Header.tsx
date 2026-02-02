import { useTonConnectUI } from '@tonconnect/ui-react';
import { useTonConnect } from '../contexts/TonConnectContext';
import './Header.css';

export function Header() {
  const [tonConnectUI] = useTonConnectUI();
  const { connected, address, disconnect } = useTonConnect();

  const handleConnect = () => {
    tonConnectUI?.openModal();
  };

  const shortAddress = address 
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : '';

  return (
    <header className="header">
      <div className="header-container">
        <div className="logo">
          <h1>🚀 TonFun Launchpad</h1>
        </div>
        <nav className="nav">
          <div className="wallet-section">
            {connected ? (
              <div className="wallet-info">
                <span className="wallet-address">{shortAddress}</span>
                <button onClick={disconnect} className="btn-disconnect">
                  Disconnect
                </button>
              </div>
            ) : (
              <button onClick={handleConnect} className="btn-connect">
                Connect Wallet
              </button>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
