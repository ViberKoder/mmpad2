import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { TonConnectProvider } from './contexts/TonConnectContext';
import { SDKProvider } from './contexts/SDKContext';
import { Header } from './components/Header';
import { Home } from './pages/Home';
import { CreateToken } from './pages/CreateToken';
import { TokenDetails } from './pages/TokenDetails';
import { ErrorBoundary } from './ErrorBoundary';
import './App.css';

function App() {
  return (
    <ErrorBoundary>
      <TonConnectProvider>
        <SDKProvider>
          <BrowserRouter basename="/">
            <div className="app">
              <Header />
              <main className="main-content">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/create" element={<CreateToken />} />
                  <Route path="/token/:address" element={<TokenDetails />} />
                </Routes>
              </main>
            </div>
          </BrowserRouter>
        </SDKProvider>
      </TonConnectProvider>
    </ErrorBoundary>
  );
}

export default App;
