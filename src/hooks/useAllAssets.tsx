import { useState, useEffect, useCallback } from 'react';

const GITHUB_BASE_URL = 'https://raw.githubusercontent.com/misrori/goldhand_data_collect/main';

interface SearchAsset {
    ticker: string;
    name: string;
    type: 'stocks' | 'crypto';
    price: number;
}

export function useAllAssets() {
    const [assets, setAssets] = useState<SearchAsset[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchAssets = useCallback(async () => {
        setLoading(true);
        try {
            const fetchCSV = async (type: 'stocks' | 'crypto') => {
                const res = await fetch(`${GITHUB_BASE_URL}/${type}_daily.csv`);
                const text = await res.text();
                const lines = text.trim().split('\n');
                if (lines.length < 2) return [];

                const headers = lines[0].split(',');
                const tickerIdx = headers.indexOf('ticker');
                const priceIdx = headers.indexOf('price_last_close');

                return lines.slice(1).map(line => {
                    const values = line.split(',');
                    return {
                        ticker: values[tickerIdx] || '',
                        name: values[tickerIdx] || '', // Use ticker as name if not available
                        type,
                        price: parseFloat(values[priceIdx]) || 0
                    };
                });
            };

            const [stocks, crypto] = await Promise.all([
                fetchCSV('stocks'),
                fetchCSV('crypto')
            ]);

            setAssets([...stocks, ...crypto]);
        } catch (error) {
            console.error('Failed to fetch assets for search', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAssets();
    }, [fetchAssets]);

    return { assets, loading };
}
