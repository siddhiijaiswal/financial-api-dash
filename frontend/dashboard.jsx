import React, { useState, useEffect, useRef } from 'react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Settings, RefreshCw, DollarSign, Activity, Wifi, WifiOff } from 'lucide-react';

const API_BASE = 'http://localhost:5000/api';

const FinancialDashboard = () => {
  const [config, setConfig] = useState({
    stockSymbol: 'AAPL',
    cryptoSymbol: 'BTC',
    forexPair: 'EUR/USD',
    refreshInterval: 30,
    showStocks: true,
    showCrypto: true,
    showForex: true,
    showPortfolio: true,
    showEconomic: true,
    useRealData: true,
    theme: 'dark'
  });

  const [data, setData] = useState({
    stocks: null,
    crypto: null,
    forex: null,
    portfolio: null,
    economic: null,
    marketOverview: null
  });

  const [showConfig, setShowConfig] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const realParam = config.useRealData ? 'true' : 'false';
      
      const [stocks, crypto, forex, portfolio, economic, market] = await Promise.all([
        fetch(`${API_BASE}/stocks/${config.stockSymbol}?real=${realParam}`).then(r => r.json()).catch(() => generateMockStockData(config.stockSymbol)),
        fetch(`${API_BASE}/crypto/${config.cryptoSymbol}?real=${realParam}`).then(r => r.json()).catch(() => generateMockCryptoData(config.cryptoSymbol)),
        fetch(`${API_BASE}/forex/${config.forexPair.replace('/', '')}?real=${realParam}`).then(r => r.json()).catch(() => generateMockForexData(config.forexPair)),
        fetch(`${API_BASE}/portfolio`).then(r => r.json()).catch(() => generateMockPortfolio()),
        fetch(`${API_BASE}/economic-indicators`).then(r => r.json()).catch(() => generateMockEconomic()),
        fetch(`${API_BASE}/market-overview`).then(r => r.json()).catch(() => generateMockMarket())
      ]);

      setData({ stocks, crypto, forex, portfolio, economic, marketOverview: market });
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error fetching data:', error);
    }
    setLoading(false);
  };

  const generateMockStockData = (symbol) => {
    const data = Array.from({ length: 30 }, (_, i) => ({
      date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      close: 150 + Math.random() * 50 + i * 0.5
    }));
    return { symbol, data, currentPrice: data[data.length - 1].close, change: 5.20, changePercent: 2.3 };
  };

  const generateMockCryptoData = (symbol) => {
    const data = Array.from({ length: 24 }, (_, i) => ({
      timestamp: new Date(Date.now() - (23 - i) * 60 * 60 * 1000).toISOString(),
      price: 45000 + Math.random() * 5000 + i * 50
    }));
    return { symbol, data, currentPrice: data[data.length - 1].price, change: 1200, changePercent: 2.7 };
  };

  const generateMockForexData = (pair) => {
    const data = Array.from({ length: 30 }, (_, i) => ({
      date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      rate: 1.10 + Math.random() * 0.05
    }));
    return { pair, data, currentRate: data[data.length - 1].rate };
  };

  const generateMockPortfolio = () => [
    { asset: 'Stocks', value: 50000, percentage: 45 },
    { asset: 'Bonds', value: 25000, percentage: 22 },
    { asset: 'Real Estate', value: 20000, percentage: 18 },
    { asset: 'Crypto', value: 10000, percentage: 9 },
    { asset: 'Cash', value: 6000, percentage: 6 }
  ];

  const generateMockEconomic = () => ({
    gdp: { value: 23500, change: 2.3, period: 'Q3 2024' },
    unemployment: { value: 3.8, change: -0.2, period: 'Sep 2024' },
    inflation: { value: 3.2, change: -0.5, period: 'Sep 2024' },
    interestRate: { value: 5.25, change: 0, period: 'Oct 2024' }
  });

  const generateMockMarket = () => ({
    indices: {
      SP500: { value: 4523.45, change: 1.2 },
      DOW: { value: 35234.56, change: 0.8 },
      NASDAQ: { value: 14123.78, change: 1.5 }
    }
  });

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, config.refreshInterval * 1000);
    return () => clearInterval(interval);
  }, 
            [config.stockSymbol, config.cryptoSymbol, config.forexPair, config.refreshInterval, config.useRealData]);

  const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];
  const isDark = config.theme === 'dark';
  const bgClass = isDark ? 'bg-gray-900' : 'bg-gray-50';
  const cardClass = isDark ? 'bg-gray-800' : 'bg-white';
  const textClass = isDark ? 'text-gray-100' : 'text-gray-900';
  const subtextClass = isDark ? 'text-gray-400' : 'text-gray-600';

  return (
    <div className={`min-h-screen ${bgClass} ${textClass} p-6`}>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            Financial Dashboard
            <Activity size={24} className="text-blue-500 animate-pulse" title="Live Data" />
          </h1>
          <p className={subtextClass}>
            {config.useRealData ? 'Real-time market data' : 'Demo data'} 
            {lastUpdate && ` • Last update: ${lastUpdate.toLocaleTimeString()}`}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-all">
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button
            onClick={() => setShowConfig(!showConfig)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-all">
            <Settings size={18} />
            Configure
          </button>
        </div>
      </div>

      {showConfig && (
        <div className={`${cardClass} rounded-lg p-6 mb-6 shadow-lg animate-fade-in`}>
          <h2 className="text-xl font-semibold mb-4">Dashboard Configuration</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">Stock Symbol</label>
              <input
                type="text"
                value={config.stockSymbol}
                onChange={(e) => setConfig({ ...config, stockSymbol: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                placeholder="AAPL"/>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Crypto Symbol</label>
              <input
                type="text"
                value={config.cryptoSymbol}
                onChange={(e) => setConfig({ ...config, cryptoSymbol: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                placeholder="BTC"/>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Forex Pair</label>
              <input
                type="text"
                value={config.forexPair}
                onChange={(e) => setConfig({ ...config, forexPair: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                placeholder="EUR/USD"/>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Refresh Interval (seconds)</label>
              <input
                type="number"
                value={config.refreshInterval}
                onChange={(e) => setConfig({ ...config, refreshInterval: parseInt(e.target.value) || 30 })}
                className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                min="10"
                max="300"/>
            </div>
            <div className="flex flex-col gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.useRealData}
                  onChange={(e) => setConfig({ ...config, useRealData: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"/>
                <span className="text-sm">Use Real Data (API)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.showStocks}
                  onChange={(e) => setConfig({ ...config, showStocks: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"/>
                <span className="text-sm">Show Stocks</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.showCrypto}
                  onChange={(e) => setConfig({ ...config, showCrypto: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"/>
                <span className="text-sm">Show Crypto</span>
              </label>
            </div>
            <div className="flex flex-col gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.showForex}
                  onChange={(e) => setConfig({ ...config, showForex: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"/>
                <span className="text-sm">Show Forex</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.showPortfolio}
                  onChange={(e) => setConfig({ ...config, showPortfolio: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"/>
                <span className="text-sm">Show Portfolio</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.showEconomic}
                  onChange={(e) => setConfig({ ...config, showEconomic: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"/>
                <span className="text-sm">Show Economic</span>
              </label>
            </div>
          </div>
          <div className="mt-4 p-3 bg-blue-900 bg-opacity-20 rounded-lg border border-blue-700">
            <p className="text-sm">
              <strong> Tip:</strong> Enable "Use Real Data" to fetch live market data from APIs. 
              Requires backend API keys (see documentation).
            </p>
          </div>
        </div>)}

      {data.marketOverview && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {Object.entries(data.marketOverview.indices).map(([key, value]) => (
            <div key={key} className={`${cardClass} rounded-lg p-4 shadow transition-all duration-300 hover:shadow-lg hover:scale-105`}>
              <div className="flex justify-between items-start">
                <div>
                  <p className={subtextClass}>{key}</p>
                  <p className="text-2xl font-bold mt-1 transition-all duration-500">
                    {value.value.toFixed(2)}
                  </p>
                </div>
                <div className={`flex items-center gap-1 ${value.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {value.change >= 0 ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                  <span className="font-semibold">{value.change >= 0 ? '+' : ''}{value.change.toFixed(2)}%</span>
                </div>
              </div>
            </div>))}
        </div>
      )}

      {config.showStocks && data.stocks && (
        <div className={`${cardClass} rounded-lg p-6 mb-6 shadow-lg`}>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Stock Price - {data.stocks.symbol}</h2>
            <div className={`flex items-center gap-2 ${data.stocks.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              <span className="text-2xl font-bold">
                ${data.stocks.currentPrice?.toFixed(2)}
              </span>
              <span className="font-semibold">({data.stocks.changePercent?.toFixed(2)}%)</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.stocks.data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} />
              <YAxis stroke="#9ca3af" fontSize={12} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }}
                labelStyle={{ color: '#9ca3af' }}/>
              <Line type="monotone" dataKey="close" stroke="#3b82f6" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {config.showCrypto && data.crypto && (
          <div className={`${cardClass} rounded-lg p-6 shadow-lg`}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Crypto - {data.crypto.symbol}</h2>
              <div className={`flex items-center gap-2 ${data.crypto.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                <span className="text-xl font-bold">
                  ${data.crypto.currentPrice?.toFixed(2)}
                </span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={data.crypto.data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="timestamp" tick={false} stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" fontSize={12} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }}
                  labelStyle={{ color: '#9ca3af' }}/>
                <Line type="monotone" dataKey="price" stroke="#8b5cf6" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {config.showForex && data.forex && (
          <div className={`${cardClass} rounded-lg p-6 shadow-lg`}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Forex - {data.forex.pair}</h2>
              <span className="text-xl font-bold">{data.forex.currentRate?.toFixed(4)}</span>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={data.forex.data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" tick={false} stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" fontSize={12} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }}
                  labelStyle={{ color: '#9ca3af' }}/>
                <Line type="monotone" dataKey="rate" stroke="#ec4899" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {config.showPortfolio && data.portfolio && (
          <div className={`${cardClass} rounded-lg p-6 shadow-lg`}>
            <h2 className="text-xl font-semibold mb-4">Portfolio Allocation</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data.portfolio}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ asset, percentage }) => `${asset} ${percentage}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value">
                  {data.portfolio.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {config.showEconomic && data.economic && (
          <div className={`${cardClass} rounded-lg p-6 shadow-lg`}>
            <h2 className="text-xl font-semibold mb-4">Economic Indicators</h2>
            <div className="space-y-4">
              {Object.entries(data.economic).map(([key, value]) => (
                <div key={key} className="flex justify-between items-center p-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors">
                  <div>
                    <p className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                    <p className={subtextClass}>{value.period}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold">{value.value}</p>
                    <p className={`text-sm ${value.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {value.change >= 0 ? '+' : ''}{value.change}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className={`${cardClass} rounded-lg p-4 mt-6 shadow`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <RefreshCw size={20} className="text-blue-500 animate-spin" style={{ animationDuration: '3s' }} />
            <div>
              <p className="font-semibold">Auto-refresh Active</p>
              <p className={subtextClass}>
                Updating every {config.refreshInterval} seconds
              </p>
            </div>
          </div>
          {lastUpdate && (
            <div className="text-right">
              <p className="text-sm font-medium">Last Update</p>
              <p className={subtextClass}>{lastUpdate.toLocaleTimeString()}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FinancialDashboard;
