import { Link } from 'react-router-dom';
import { useSDK } from '../contexts/SDKContext';
import { useEffect, useState } from 'react';
import type { Coin } from 'ton-bcl-sdk';
import './Home.css';

export function Home() {
  const { sdk, loading: sdkLoading } = useSDK();
  const [coins, setCoins] = useState<Coin[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (sdk && !sdkLoading) {
      loadCoins();
    }
  }, [sdk, sdkLoading]);

  const loadCoins = async () => {
    if (!sdk) return;
    try {
      setLoading(true);
      const response = await sdk.api.fetchCoins({ first: 20 });
      setCoins(response.items);
    } catch (error) {
      console.error('Failed to load coins:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="home">
      <div className="home-hero">
        <h1 style={{ color: '#000', fontSize: '4rem', fontWeight: 'bold', marginBottom: '1rem' }}>MMPAD</h1>
        <h2>Create and Launch Your Token on TON</h2>
        <p>Deploy your token with bonding curve liquidity in minutes</p>
        <Link to="/create" className="btn-primary">
          Create New Token
        </Link>
      </div>

      <div className="coins-section">
        <h3>Recent Tokens</h3>
        {sdkLoading || loading ? (
          <div className="loading">Loading tokens...</div>
        ) : !sdk ? (
          <div className="empty">SDK not initialized. Please refresh the page.</div>
        ) : coins.length === 0 ? (
          <div className="empty">No tokens found</div>
        ) : (
          <div className="coins-grid">
            {coins.map((coin) => (
              <Link
                key={coin.id}
                to={`/token/${coin.address.toString({ urlSafe: true })}`}
                className="coin-card"
              >
                <div className="coin-header">
                  {coin.metadata.image && (
                    <img
                      src={coin.metadata.image}
                      alt={coin.metadata.name}
                      className="coin-image"
                    />
                  )}
                  <div className="coin-info">
                    <h4>{coin.metadata.name}</h4>
                    <span className="coin-symbol">{coin.metadata.symbol}</span>
                  </div>
                </div>
                <div className="coin-stats">
                  <div className="stat">
                    <span className="stat-label">Supply</span>
                    <span className="stat-value">
                      {(Number(coin.totalSupply) / 1e9).toLocaleString()}
                    </span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Status</span>
                    <span className={`stat-value ${coin.tradingEnabled ? 'active' : 'listed'}`}>
                      {coin.tradingEnabled ? 'Trading' : 'Listed'}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
