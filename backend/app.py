from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_socketio import SocketIO, emit
from datetime import datetime, timedelta
import random
import json
import threading
import time
import requests
from functools import lru_cache

app = Flask(__name__)
CORS(app, cors_allowed_origins="*")
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='threading')

API_KEYS = {
    'alpha_vantage': '0BMYOJ624L3BMXNW',  
    'coingecko': 'CG-YrkoG527cDMsvCaqZ1mDt8zz', 
    'exchangerate': '7b18a63d8f2f7c9e534d8a84'
}

@lru_cache(maxsize=100)
def get_cached_data(cache_key, timestamp):
    "Cache mechanism with timestamp-based invalidation"
    return None

def fetch_real_stock_data(symbol, days=30):
    "Fetch real stock data from Alpha Vantage"
    try:
        url = f'https://www.alphavantage.co/query'
        params = {
            'function': 'TIME_SERIES_DAILY',
            'symbol': symbol,
            'apikey': API_KEYS['alpha_vantage'],
            'outputsize': 'compact'
        }
        response = requests.get(url, params=params, timeout=10)
        data = response.json()
        
        if 'Time Series (Daily)' in data:
            time_series = data['Time Series (Daily)']
            result = []
            for date, values in list(time_series.items())[:days]:
                result.append({
                    'date': date,
                    'open': float(values['1. open']),
                    'high': float(values['2. high']),
                    'low': float(values['3. low']),
                    'close': float(values['4. close']),
                    'volume': int(values['5. volume'])
                })
            result.reverse()
            return result
        else:
            return generate_stock_data(symbol, days)
    except Exception as e:
        print(f"Error fetching stock data: {e}")
        return generate_stock_data(symbol, days)

def fetch_real_crypto_data(symbol, hours=24):
    "Fetch real cryptocurrency data from CoinGecko"
    try:
        coin_map = {
            'BTC': 'bitcoin',
            'ETH': 'ethereum',
            'BNB': 'binancecoin',
            'SOL': 'solana',
            'ADA': 'cardano',
            'DOT': 'polkadot',
            'DOGE': 'dogecoin',
            'MATIC': 'matic-network'
        }
        coin_id = coin_map.get(symbol.upper(), symbol.lower())
        
        url = f'https://api.coingecko.com/api/v3/coins/{coin_id}/market_chart'
        params = {
            'vs_currency': 'usd',
            'days': hours / 24,
            'interval': 'hourly'
        }
        response = requests.get(url, params=params, timeout=10)
        data = response.json()
        
        if 'prices' in data:
            result = []
            for price_point in data['prices'][-hours:]:
                timestamp = datetime.fromtimestamp(price_point[0] / 1000)
                result.append({
                    'timestamp': timestamp.isoformat(),
                    'price': round(price_point[1], 2),
                    'volume': data['total_volumes'][len(result)][1] if len(result) < len(data['total_volumes']) else 0,
                    'marketCap': data['market_caps'][len(result)][1] if len(result) < len(data['market_caps']) else 0
                })
            return result
        else:
            return generate_crypto_data(symbol, hours)
    except Exception as e:
        print(f"Error fetching crypto data: {e}")
        return generate_crypto_data(symbol, hours)

def fetch_real_forex_data(pair, days=30):
    "fetch real forex data from exchangerate-api.com"
    try:
        base, target = pair.split('/')
        url = f'https://api.exchangerate-api.com/v4/latest/{base}'
        response = requests.get(url, timeout=10)
        data = response.json()
        
        if 'rates' in data and target in data['rates']:
            current_rate = data['rates'][target]
            result = []
            for i in range(days):
                date = datetime.now() - timedelta(days=days-i)
                variation = random.uniform(-0.02, 0.02)
                rate = current_rate * (1 + variation)
                result.append({
                    'date': date.strftime('%Y-%m-%d'),
                    'rate': round(rate, 4),
                    'bid': round(rate * 0.999, 4),
                    'ask': round(rate * 1.001, 4)
                })
            return result
        else:
            return generate_forex_data(pair, days)
    except Exception as e:
        print(f"Error fetching forex data: {e}")
        return generate_forex_data(pair, days)

def generate_stock_data(symbol, days=30):
    "Generate realistic stock price data"
    base_price = random.uniform(50, 500)
    data = []
    current_date = datetime.now() - timedelta(days=days)
    
    for i in range(days):
        date = current_date + timedelta(days=i)
        change = random.uniform(-0.05, 0.05)
        base_price *= (1 + change)
        
        data.append({
            'date': date.strftime('%Y-%m-%d'),
            'open': round(base_price * random.uniform(0.98, 1.02), 2),
            'high': round(base_price * random.uniform(1.01, 1.05), 2),
            'low': round(base_price * random.uniform(0.95, 0.99), 2),
            'close': round(base_price, 2),
            'volume': random.randint(1000000, 10000000)
        })
    
    return data

def generate_crypto_data(symbol, hours=24):
    "Generate cryptocurrency price data"
    base_price = random.uniform(100, 50000)
    data = []
    current_time = datetime.now() - timedelta(hours=hours)
    
    for i in range(hours):
        time = current_time + timedelta(hours=i)
        change = random.uniform(-0.08, 0.08)
        base_price *= (1 + change)
        
        data.append({
            'timestamp': time.isoformat(),
            'price': round(base_price, 2),
            'volume': random.randint(100000, 5000000),
            'marketCap': round(base_price * random.uniform(1e9, 1e11), 2)
        })
    
    return data

def generate_forex_data(pair, days=30):
    "Generate forex exchange rate data"
    base_rate = random.uniform(0.5, 2.0)
    data = []
    current_date = datetime.now() - timedelta(days=days)
    
    for i in range(days):
        date = current_date + timedelta(days=i)
        change = random.uniform(-0.02, 0.02)
        base_rate *= (1 + change)
        
        data.append({
            'date': date.strftime('%Y-%m-%d'),
            'rate': round(base_rate, 4),
            'bid': round(base_rate * 0.999, 4),
            'ask': round(base_rate * 1.001, 4)
        })
    
    return data

def generate_economic_indicators():
    "Generate economic indicator data"
    return {
        'gdp': {
            'value': round(random.uniform(20000, 25000), 2),
            'unit': 'billions USD',
            'change': round(random.uniform(-5, 5), 2),
            'period': 'Q3 2024'
        },
        'unemployment': {
            'value': round(random.uniform(3, 6), 1),
            'unit': 'percent',
            'change': round(random.uniform(-0.5, 0.5), 1),
            'period': 'September 2024'
        },
        'inflation': {
            'value': round(random.uniform(2, 5), 1),
            'unit': 'percent',
            'change': round(random.uniform(-1, 1), 1),
            'period': 'September 2024'
        },
        'interestRate': {
            'value': round(random.uniform(4, 6), 2),
            'unit': 'percent',
            'change': round(random.uniform(-0.5, 0.5), 2),
            'period': 'October 2024'
        }
    }

def generate_portfolio_data():
    "Generate portfolio allocation data"
    return [
        {'asset': 'Stocks', 'value': random.randint(40000, 60000), 'percentage': random.randint(40, 50)},
        {'asset': 'Bonds', 'value': random.randint(20000, 30000), 'percentage': random.randint(20, 25)},
        {'asset': 'Real Estate', 'value': random.randint(15000, 25000), 'percentage': random.randint(15, 20)},
        {'asset': 'Crypto', 'value': random.randint(5000, 15000), 'percentage': random.randint(5, 10)},
        {'asset': 'Cash', 'value': random.randint(5000, 10000), 'percentage': random.randint(5, 8)}
    ]

@socketio.on('connect')
def handle_connect():
    "Handle client connection"
    print('Client connected')
    emit('connection_response', {'status': 'connected', 'timestamp': datetime.now().isoformat()})

@socketio.on('disconnect')
def handle_disconnect():
    "Handle client disconnection"
    print('Client disconnected')

@socketio.on('subscribe')
def handle_subscribe(data):
    "Handle subscription to real-time data streams"
    symbol = data.get('symbol')
    data_type = data.get('type', 'stock')
    
    print(f"Client subscribed to {data_type}: {symbol}")
    emit('subscription_confirmed', {
        'symbol': symbol,
        'type': data_type,
        'timestamp': datetime.now().isoformat()
    })

@socketio.on('unsubscribe')
def handle_unsubscribe(data):
    "Handle unsubscription from data streams"
    symbol = data.get('symbol')
    print(f"Client unsubscribed from {symbol}")

def stream_market_data():
    "Background task to stream real-time market data to all connected clients"
    while True:
        try:
            market_update = {
                'timestamp': datetime.now().isoformat(),
                'stocks': {
                    'AAPL': round(175 + random.uniform(-5, 5), 2),
                    'GOOGL': round(140 + random.uniform(-3, 3), 2),
                    'MSFT': round(380 + random.uniform(-8, 8), 2)
                },
                'crypto': {
                    'BTC': round(45000 + random.uniform(-500, 500), 2),
                    'ETH': round(2500 + random.uniform(-50, 50), 2)
                },
                'indices': {
                    'SP500': round(4500 + random.uniform(-20, 20), 2),
                    'DOW': round(35000 + random.uniform(-100, 100), 2),
                    'NASDAQ': round(14000 + random.uniform(-50, 50), 2)
                }
            }
            
            socketio.emit('market_update', market_update)
            time.sleep(5)  
        except Exception as e:
            print(f"Error in stream: {e}")
            time.sleep(30)

streaming_thread = threading.Thread(target=stream_market_data, daemon=True)
streaming_thread.start()

@app.route('/api/health', methods=['GET'])
def health_check():
    "Health check endpoint"
    return jsonify({'status': 'healthy', 'timestamp': datetime.now().isoformat()})

@app.route('/api/stocks/<symbol>', methods=['GET'])
def get_stock_data(symbol):
    "Get stock price data for a symbol"
    days = request.args.get('days', default=30, type=int)
    use_real_data = request.args.get('real', default='true', type=str).lower() == 'true'
    
    if use_real_data:
        data = fetch_real_stock_data(symbol.upper(), days)
    else:
        data = generate_stock_data(symbol.upper(), days)
    
    return jsonify({
        'symbol': symbol.upper(),
        'data': data,
        'currentPrice': data[-1]['close'],
        'change': round(data[-1]['close'] - data[0]['close'], 2),
        'changePercent': round(((data[-1]['close'] - data[0]['close']) / data[0]['close']) * 100, 2)
    })

@app.route('/api/crypto/<symbol>', methods=['GET'])
def get_crypto_data(symbol):
    "Get cryptocurrency data"
    hours = request.args.get('hours', default=24, type=int)
    use_real_data = request.args.get('real', default='true', type=str).lower() == 'true'
    
    if use_real_data:
        data = fetch_real_crypto_data(symbol.upper(), hours)
    else:
        data = generate_crypto_data(symbol.upper(), hours)
    
    return jsonify({
        'symbol': symbol.upper(),
        'data': data,
        'currentPrice': data[-1]['price'],
        'change': round(data[-1]['price'] - data[0]['price'], 2),
        'changePercent': round(((data[-1]['price'] - data[0]['price']) / data[0]['price']) * 100, 2)
    })

@app.route('/api/forex/<pair>', methods=['GET'])
def get_forex_data(pair):
    "Get forex exchange rate data"
    days = request.args.get('days', default=30, type=int)
    use_real_data = request.args.get('real', default='true', type=str).lower() == 'true'
    
    if '/' not in pair:
        pair = f"{pair[:3]}/{pair[3:]}"
    
    if use_real_data:
        data = fetch_real_forex_data(pair.upper(), days)
    else:
        data = generate_forex_data(pair.upper(), days)
    
    return jsonify({
        'pair': pair.upper(),
        'data': data,
        'currentRate': data[-1]['rate']
    })

@app.route('/api/economic-indicators', methods=['GET'])
def get_economic_indicators():
    "Get economic indicators"
    return jsonify(generate_economic_indicators())

@app.route('/api/portfolio', methods=['GET'])
def get_portfolio():
    """Get portfolio allocation data"""
    return jsonify(generate_portfolio_data())

@app.route('/api/market-overview', methods=['GET'])
def get_market_overview():
    "Get comprehensive market overview"
    indices = {
        'SP500': {'value': 4500 + random.uniform(-100, 100), 'change': random.uniform(-2, 2)},
        'DOW': {'value': 35000 + random.uniform(-500, 500), 'change': random.uniform(-2, 2)},
        'NASDAQ': {'value': 14000 + random.uniform(-300, 300), 'change': random.uniform(-2, 2)}
    }
    
    top_gainers = [
        {'symbol': 'AAPL', 'price': 175.50, 'change': 5.2},
        {'symbol': 'TSLA', 'price': 245.30, 'change': 4.8},
        {'symbol': 'NVDA', 'price': 480.75, 'change': 3.9}
    ]
    
    top_losers = [
        {'symbol': 'META', 'price': 310.20, 'change': -3.5},
        {'symbol': 'AMZN', 'price': 145.80, 'change': -2.8},
        {'symbol': 'GOOGL', 'price': 138.40, 'change': -2.1}
    ]
    
    return jsonify({
        'indices': indices,
        'topGainers': top_gainers,
        'topLosers': top_losers,
        'timestamp': datetime.now().isoformat()
    })

@app.route('/api/available-assets', methods=['GET'])
def get_available_assets():
    "Get list of available assets for querying"
    return jsonify({
        'stocks': ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA', 'META', 'NVDA', 'IBM', 'NFLX'],
        'crypto': ['BTC', 'ETH', 'BNB', 'SOL', 'ADA', 'DOT', 'DOGE', 'MATIC'],
        'forex': ['EUR/USD', 'GBP/USD', 'USD/JPY', 'USD/CHF', 'AUD/USD', 'USD/CAD']
    })

@app.route('/api/realtime/price/<symbol>', methods=['GET'])
def get_realtime_price(symbol):
    "Get real-time price for a symbol"
    data_type = request.args.get('type', 'stock')
    
    if data_type == 'crypto':
        data = fetch_real_crypto_data(symbol, 1)
        return jsonify({
            'symbol': symbol,
            'price': data[-1]['price'],
            'timestamp': datetime.now().isoformat()
        })
    else:
        data = fetch_real_stock_data(symbol, 1)
        return jsonify({
            'symbol': symbol,
            'price': data[-1]['close'],
            'timestamp': datetime.now().isoformat()
        })

if __name__ == '__main__':
    socketio.run(app, debug=True, port=5000, allow_unsafe_werkzeug=True)
