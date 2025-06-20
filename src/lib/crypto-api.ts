// lib/crypto-api.ts

interface BitcoinPrice {
    price: number;
    lastUpdated: string;
    source: string;
    change24h?: number;
    high24h?: number;
    low24h?: number;
    marketCap?: number;
}

export async function getBitcoinPrice(): Promise<BitcoinPrice> {
    const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true');
    const data = await response.json();

    return {
        price: data.bitcoin.usd,
        change24h: data.bitcoin.usd_24h_change,
        lastUpdated: new Date().toISOString(),
        source: 'CoinGecko'
    };
}

export async function getBitcoinPriceHistory(timeframe: '24h' | '7d' | '30d' | '90d'): Promise<Array<{ timestamp: string; price: number }>> {
    const days = timeframe === '24h' ? 1 : timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : 90;
    const response = await fetch(`https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=${days}`);
    const data = await response.json();

    return data.prices.map(([timestamp, price]: [number, number]) => ({
        timestamp: new Date(timestamp).toISOString(),
        price
    }));
}