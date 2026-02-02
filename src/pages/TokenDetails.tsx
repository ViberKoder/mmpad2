import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Address, toNano } from '@ton/core';
import { useSDK } from '../contexts/SDKContext';
import { useTonConnect } from '../contexts/TonConnectContext';
import { useTonConnectUI } from '@tonconnect/ui-react';
import { tonConnectSender } from 'ton-bcl-sdk';
import type { Coin } from 'ton-bcl-sdk';
import './TokenDetails.css';

export function TokenDetails() {
  const { address: tokenAddress } = useParams<{ address: string }>();
  const navigate = useNavigate();
  const { sdk } = useSDK();
  const { connected, address } = useTonConnect();
  const [tonConnectUI] = useTonConnectUI();

  const [coin, setCoin] = useState<Coin | null>(null);
  const [balance, setBalance] = useState<bigint>(0n);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Buy form
  const [buyAmount, setBuyAmount] = useState('');
  const [buyPreview, setBuyPreview] = useState<{ coins: bigint; fees: bigint } | null>(null);

  // Sell form
  const [sellAmount, setSellAmount] = useState('');
  const [sellPreview, setSellPreview] = useState<{ tons: bigint; fees: bigint } | null>(null);

  useEffect(() => {
    if (tokenAddress && sdk) {
      loadTokenData();
    }
  }, [tokenAddress, sdk, address]);

  const loadTokenData = async () => {
    if (!tokenAddress || !sdk) return;

    try {
      setLoading(true);
      // Парсим адрес, поддерживая разные форматы
      let tokenAddr: Address;
      try {
        tokenAddr = Address.parse(tokenAddress);
      } catch (e) {
        // Если не удалось распарсить, пробуем decodeURIComponent
        const decoded = decodeURIComponent(tokenAddress);
        tokenAddr = Address.parse(decoded);
      }
      
      const coinData = await sdk.api.fetchCoin(tokenAddr);
      setCoin(coinData);

      // Load user balance if connected
      if (address) {
        const userAddr = Address.parse(address);
        const userBalance = await sdk.getUserCoinBalance(tokenAddr, userAddr);
        setBalance(userBalance);
      }
    } catch (err: any) {
      console.error('Failed to load token:', err);
      setError('Failed to load token data');
    } finally {
      setLoading(false);
    }
  };

  const handleBuyAmountChange = async (value: string) => {
    setBuyAmount(value);
    if (!value || !sdk || !tokenAddress) {
      setBuyPreview(null);
      return;
    }

    try {
      const tokenAddr = Address.parse(tokenAddress);
      const tons = toNano(value);
      const preview = await sdk.getCoinsForTons(tokenAddr, tons);
      setBuyPreview(preview);
    } catch (err) {
      console.error('Failed to preview buy:', err);
      setBuyPreview(null);
    }
  };

  const handleSellAmountChange = async (value: string) => {
    setSellAmount(value);
    if (!value || !sdk || !tokenAddress) {
      setSellPreview(null);
      return;
    }

    try {
      const tokenAddr = Address.parse(tokenAddress);
      const coins = BigInt(Math.floor(parseFloat(value) * 1e9));
      if (sdk) {
        const preview = await sdk.getTonsForCoins(tokenAddr, coins);
        setSellPreview(preview);
      }
    } catch (err) {
      console.error('Failed to preview sell:', err);
      setSellPreview(null);
    }
  };

  const handleBuy = async () => {
    if (!connected || !address || !sdk || !tokenAddress || !buyAmount) {
      setError('Please connect wallet and enter amount');
      return;
    }

    try {
      setActionLoading(true);
      setError(null);

      const tokenAddr = Address.parse(tokenAddress);
      const coin = sdk.openCoin(tokenAddr);
      const sender = tonConnectSender(tonConnectUI!);
      const tons = toNano(buyAmount);
      const minReceive = buyPreview?.coins || 0n;

      // Используем провайдер из SDK
      const provider = (coin as any).provider;
      await (coin as any).sendBuy(provider, sender, {
        tons,
        minReceive,
        referral: null,
      });

      // Reload data
      await loadTokenData();
      setBuyAmount('');
      setBuyPreview(null);
    } catch (err: any) {
      console.error('Failed to buy:', err);
      setError(err.message || 'Failed to buy tokens');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSell = async () => {
    if (!connected || !address || !sdk || !tokenAddress || !sellAmount) {
      setError('Please connect wallet and enter amount');
      return;
    }

    try {
      setActionLoading(true);
      setError(null);

      const tokenAddr = Address.parse(tokenAddress);
      const userAddr = Address.parse(address);
      const wallet = await sdk.openUserCoinWallet(tokenAddr, userAddr);
      const sender = tonConnectSender(tonConnectUI!);
      const amount = BigInt(Math.floor(parseFloat(sellAmount) * 1e9));
      const minReceive = sellPreview?.tons || 0n;

      // wallet уже является OpenedContract, используем его провайдер
      const provider = (wallet as any).provider || wallet;
      await (wallet as any).sendSellCoins(provider, sender, {
        amount,
        minReceive,
        referral: null,
        queryId: 0n,
      });

      // Reload data
      await loadTokenData();
      setSellAmount('');
      setSellPreview(null);
    } catch (err: any) {
      console.error('Failed to sell:', err);
      setError(err.message || 'Failed to sell tokens');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="token-details">
        <div className="loading">Loading token data...</div>
      </div>
    );
  }

  if (!coin) {
    return (
      <div className="token-details">
        <div className="error">Token not found</div>
        <button onClick={() => navigate('/')} className="btn-back">
          Back to Home
        </button>
      </div>
    );
  }

  return (
    <div className="token-details">
      <button onClick={() => navigate('/')} className="btn-back">
        ← Back
      </button>

      <div className="token-header">
        {coin.metadata.image && (
          <img
            src={coin.metadata.image}
            alt={coin.metadata.name}
            className="token-image"
          />
        )}
        <div className="token-info">
          <h1>{coin.metadata.name}</h1>
          <p className="token-symbol">{coin.metadata.symbol}</p>
          {coin.metadata.description && (
            <p className="token-description">{coin.metadata.description}</p>
          )}
        </div>
      </div>

      {error && (
        <div className="error-message">{error}</div>
      )}

      <div className="token-stats">
        <div className="stat-card">
          <div className="stat-label">Total Supply</div>
          <div className="stat-value">
            {(Number(coin.totalSupply) / 1e9).toLocaleString()}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">BCL Supply</div>
          <div className="stat-value">
            {(Number(coin.bclSupply) / 1e9).toLocaleString()}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Status</div>
          <div className={`stat-value ${coin.tradingEnabled ? 'active' : 'listed'}`}>
            {coin.tradingEnabled ? 'Trading' : 'Listed on STON.fi'}
          </div>
        </div>
        {connected && (
          <div className="stat-card">
            <div className="stat-label">Your Balance</div>
            <div className="stat-value">
              {(Number(balance) / 1e9).toLocaleString()}
            </div>
          </div>
        )}
      </div>

      {coin.tradingEnabled && (
        <div className="trading-section">
          {connected ? (
            <>
              <div className="trade-card">
                <h3>Buy Tokens</h3>
                <div className="trade-form">
                  <div className="input-group">
                    <label>TON Amount</label>
                    <input
                      type="number"
                      step="0.01"
                      value={buyAmount}
                      onChange={(e) => handleBuyAmountChange(e.target.value)}
                      placeholder="0.0"
                    />
                  </div>
                  {buyPreview && (
                    <div className="preview">
                      <div>You will receive: {(Number(buyPreview.coins) / 1e9).toFixed(2)} tokens</div>
                      <div>Fees: {(Number(buyPreview.fees) / 1e9).toFixed(4)} TON</div>
                    </div>
                  )}
                  <button
                    onClick={handleBuy}
                    disabled={actionLoading || !buyAmount || !buyPreview}
                    className="btn-trade btn-buy"
                  >
                    {actionLoading ? 'Processing...' : 'Buy'}
                  </button>
                </div>
              </div>

              <div className="trade-card">
                <h3>Sell Tokens</h3>
                <div className="trade-form">
                  <div className="input-group">
                    <label>Token Amount</label>
                    <input
                      type="number"
                      step="0.01"
                      value={sellAmount}
                      onChange={(e) => handleSellAmountChange(e.target.value)}
                      placeholder="0.0"
                      max={Number(balance) / 1e9}
                    />
                  </div>
                  {sellPreview && (
                    <div className="preview">
                      <div>You will receive: {(Number(sellPreview.tons) / 1e9).toFixed(4)} TON</div>
                      <div>Fees: {(Number(sellPreview.fees) / 1e9).toFixed(4)} TON</div>
                    </div>
                  )}
                  <button
                    onClick={handleSell}
                    disabled={actionLoading || !sellAmount || !sellPreview || Number(sellAmount) * 1e9 > Number(balance)}
                    className="btn-trade btn-sell"
                  >
                    {actionLoading ? 'Processing...' : 'Sell'}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="connect-prompt">
              <p>Connect your wallet to buy or sell tokens</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
