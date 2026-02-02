import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSDK } from '../contexts/SDKContext';
import { useTonConnectUI } from '@tonconnect/ui-react';
import { Address } from '@ton/core';
import { tonConnectSender } from 'ton-bcl-sdk';
import './CreateToken.css';

export function CreateToken() {
  const navigate = useNavigate();
  const { sdk } = useSDK();
  const [tonConnectUI] = useTonConnectUI();

  const [formData, setFormData] = useState({
    name: '',
    symbol: '',
    description: '',
    imageUrl: '',
    socialLinks: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Проверяем подключение через tonConnectUI напрямую
    const account = tonConnectUI?.account;
    if (!account || !account.address || !sdk) {
      setError('Please connect your wallet first');
      return;
    }

    if (!formData.name || !formData.symbol) {
      setError('Name and Symbol are required');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const userAddress = Address.parse(account.address);
      const socialLinksArray = formData.socialLinks
        ? formData.socialLinks.split(',').map(s => s.trim()).filter(Boolean)
        : [];

      // Создаем sender из TonConnect
      const sender = tonConnectSender(tonConnectUI!);

      // Деплоим токен
      await sdk.deployCoin(sender, {
        authorAddress: userAddress,
        name: formData.name,
        symbol: formData.symbol,
        description: formData.description || undefined,
        imageUrl: formData.imageUrl || undefined,
        socialLinks: socialLinksArray.length > 0 ? socialLinksArray : undefined,
        referral: null,
        extraMetadata: {},
      });

      // После успешного деплоя переходим на главную
      navigate('/');
    } catch (err: any) {
      console.error('Failed to create token:', err);
      setError(err.message || 'Failed to create token. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Проверяем подключение через tonConnectUI напрямую
  const account = tonConnectUI?.account;
  if (!account || !account.address) {
    return (
      <div className="create-token">
        <div className="connect-prompt">
          <h2>Connect Your Wallet</h2>
          <p>Please connect your TON wallet to create a token</p>
        </div>
      </div>
    );
  }

  return (
    <div className="create-token">
      <div className="create-token-container">
        <h2>Create New Token</h2>
        <p className="subtitle">Deploy your token with bonding curve liquidity</p>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="token-form">
          <div className="form-group">
            <label htmlFor="name">Token Name *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="My Awesome Token"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="symbol">Token Symbol *</label>
            <input
              type="text"
              id="symbol"
              name="symbol"
              value={formData.symbol}
              onChange={handleChange}
              placeholder="MAT"
              maxLength={10}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe your token..."
              rows={4}
            />
          </div>

          <div className="form-group">
            <label htmlFor="imageUrl">Image URL</label>
            <input
              type="url"
              id="imageUrl"
              name="imageUrl"
              value={formData.imageUrl}
              onChange={handleChange}
              placeholder="https://example.com/image.png"
            />
          </div>

          <div className="form-group">
            <label htmlFor="socialLinks">Social Links (comma-separated)</label>
            <input
              type="text"
              id="socialLinks"
              name="socialLinks"
              value={formData.socialLinks}
              onChange={handleChange}
              placeholder="https://twitter.com/..., https://t.me/..."
            />
          </div>

          <button
            type="submit"
            className="btn-submit"
            disabled={loading}
          >
            {loading ? 'Creating Token...' : 'Create Token'}
          </button>
        </form>
      </div>
    </div>
  );
}
