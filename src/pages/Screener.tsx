import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGoldHandData } from '@/hooks/useGoldHandData';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Search,
    Filter,
    X,
    ChevronDown,
    ArrowRight,
    TrendingUp,
    TrendingDown,
    Zap,
    BarChart3,
    Globe,
    ArrowLeft,
    RefreshCw,
    Info,
    ScanSearch
} from 'lucide-react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    HoverCard,
    HoverCardContent,
    HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Slider } from '@/components/ui/slider';
import { ScannerTable } from '@/components/ScannerTable';
import { useAuth } from '@/hooks/useAuth';
import { Skeleton } from '@/components/ui/skeleton';
import type { GoldHandAsset } from '@/hooks/useGoldHandData';

// Operators for filtering
type Operator = 'gt' | 'lt' | 'eq' | 'contains' | 'between';

interface FilterRule {
    id: string;
    column: keyof GoldHandAsset;
    operator: Operator;
    value: any;
    value2?: any; // for 'between'
}

const COLUMN_METADATA: Record<string, { label: string, type: 'number' | 'string' | 'category' }> = {
    // Basic
    market_capitalization: { label: 'Market Cap', type: 'number' },
    sector: { label: 'Sector', type: 'category' },
    industry: { label: 'Industry', type: 'category' },

    // Trend (GHL)
    ghl_status: { label: 'GHL Status', type: 'category' },
    ghl_color: { label: 'GHL Color', type: 'category' },
    ghl_days_since_change: { label: 'GHL Days Since Flip', type: 'number' },
    ghl_last_change_date: { label: 'GHL Last Flip Date', type: 'string' },
    ghl_last_change_price: { label: 'GHL Last Flip Price', type: 'number' },
    ghl_change_percent: { label: 'GHL % Change from Flip', type: 'number' },

    // Momentum (RSI)
    rsi: { label: 'RSI Value', type: 'number' },
    rsi_status: { label: 'RSI Status', type: 'category' },
    rsi_last_change_date: { label: 'RSI Last Change Date', type: 'string' },
    rsi_last_change_price: { label: 'RSI Last Change Price', type: 'number' },
    rsi_days_since_last_change: { label: 'RSI Days Since Change', type: 'number' },

    // Moving Averages
    sma_50: { label: 'SMA 50', type: 'number' },
    sma_100: { label: 'SMA 100', type: 'number' },
    sma_200: { label: 'SMA 200', type: 'number' },
    diff_sma50: { label: '% Diff SMA50', type: 'number' },
    diff_sma100: { label: '% Diff SMA100', type: 'number' },
    diff_sma200: { label: '% Diff SMA200', type: 'number' },

    // Bollinger Bands
    bb_mid: { label: 'BB Middle', type: 'number' },
    bb_upper: { label: 'BB Upper', type: 'number' },
    bb_lower: { label: 'BB Lower', type: 'number' },
    diff_upper_bb: { label: '% Diff Upper BB', type: 'number' },
    diff_lower_bb: { label: '% Diff Lower BB', type: 'number' },

    // Cycle Analysis (Max/Min)
    fell_from_last_max: { label: '% Fall from Max', type: 'number' },
    last_local_min_date: { label: 'Last Local Min Date', type: 'string' },
    last_local_min_price: { label: 'Last Local Min Price', type: 'number' },
    days_after_last_local_min: { label: 'Days Since Local Min', type: 'number' },
    percent_change_from_last_local_min: { label: '% Change from Min', type: 'number' },
    last_local_max_date: { label: 'Last Local Max Date', type: 'string' },
    last_local_max_price: { label: 'Last Local Max Price', type: 'number' },
    days_after_last_local_max: { label: 'Days Since Local Max', type: 'number' },
    percent_fall_from_last_local_max: { label: '% Fall from Local Max', type: 'number' },

    // Fundamentals
    price_per_earning: { label: 'P/E Ratio', type: 'number' },
    earnings_per_share_basic_ttm: { label: 'EPS (TTM)', type: 'number' },
    number_of_employees: { label: 'Employees', type: 'number' },
};

// Predefined Smart Filters
const SMART_FILTERS = [
    {
        name: "Blue-Chip Value Dip",
        description: "High-cap assets that fell 35-45% from max and are holding near SMA200.",
        rules: [
            { id: '1', column: 'fell_from_last_max' as keyof GoldHandAsset, operator: 'between' as Operator, value: 35, value2: 45 },
            { id: '2', column: 'diff_sma200' as keyof GoldHandAsset, operator: 'between' as Operator, value: -15, value2: 15 },
            { id: '3', column: 'market_capitalization' as keyof GoldHandAsset, operator: 'gt' as Operator, value: '100B' },
        ]
    },
    {
        name: "RSI Oversold Bounce",
        description: "RSI below 30 (deeply oversold) but trend has already flipped to Bullish (Gold).",
        rules: [
            { id: '4', column: 'rsi' as keyof GoldHandAsset, operator: 'lt' as Operator, value: 35 },
            { id: '5', column: 'ghl_color' as keyof GoldHandAsset, operator: 'eq' as Operator, value: 'gold' },
        ]
    },
    {
        name: "Mean Reversion Short",
        description: "Overextended assets: RSI above 75 and more than 30% above SMA200.",
        rules: [
            { id: '6', column: 'rsi' as keyof GoldHandAsset, operator: 'gt' as Operator, value: 75 },
            { id: '7', column: 'diff_sma200' as keyof GoldHandAsset, operator: 'gt' as Operator, value: 30 },
        ]
    },
    {
        name: "Tech Momentum",
        description: "Technology sector leaders with a fresh trend flip in the last 14 days.",
        rules: [
            { id: '8', column: 'sector' as keyof GoldHandAsset, operator: 'eq' as Operator, value: 'Technology Services' },
            { id: '9', column: 'ghl_days_since_change' as keyof GoldHandAsset, operator: 'lt' as Operator, value: 14 },
            { id: '10', column: 'ghl_color' as keyof GoldHandAsset, operator: 'eq' as Operator, value: 'gold' },
        ]
    }
];


export default function Screener() {
    const navigate = useNavigate();
    const { user, loading: authLoading } = useAuth();

    // Persistent State initialization
    const [assetType, setAssetType] = useState<'stocks' | 'crypto' | 'commodities'>(() => {
        const saved = localStorage.getItem('screener_assetType');
        return (saved as any) || 'stocks';
    });

    const [timeframe, setTimeframe] = useState<'daily' | 'weekly'>(() => {
        const saved = localStorage.getItem('screener_timeframe');
        return (saved as any) || 'daily';
    });

    const [filters, setFilters] = useState<FilterRule[]>(() => {
        const saved = localStorage.getItem('screener_filters');
        return saved ? JSON.parse(saved) : [];
    });

    const { data: allAssets, loading, refetch } = useGoldHandData(assetType, timeframe);
    const [activeSmartFilter, setActiveSmartFilter] = useState<string | null>(null);

    // Persist changes to localStorage
    useEffect(() => {
        localStorage.setItem('screener_assetType', assetType);
    }, [assetType]);

    useEffect(() => {
        localStorage.setItem('screener_timeframe', timeframe);
    }, [timeframe]);

    useEffect(() => {
        localStorage.setItem('screener_filters', JSON.stringify(filters));
    }, [filters]);

    useEffect(() => {
        if (!authLoading && !user) {
            navigate('/auth');
        }
    }, [user, authLoading, navigate]);

    const addFilter = () => {
        const newFilter: FilterRule = {
            id: Math.random().toString(36).substr(2, 9),
            column: 'market_capitalization',
            operator: 'gt',
            value: ''
        };
        setFilters([...filters, newFilter]);
        setActiveSmartFilter(null);
    };

    const removeFilter = (id: string) => {
        setFilters(filters.filter(f => f.id !== id));
        setActiveSmartFilter(null);
    };

    const updateFilter = (id: string, updates: Partial<FilterRule>) => {
        setFilters(filters.map(f => f.id === id ? { ...f, ...updates } : f));
        setActiveSmartFilter(null);
    };

    const applySmartFilter = (sf: typeof SMART_FILTERS[0]) => {
        setFilters(sf.rules as FilterRule[]);
        setActiveSmartFilter(sf.name);
    };

    // Extract unique values for categories
    const getUniqueValues = (column: keyof GoldHandAsset) => {
        const values = allAssets.map(a => (a as any)[column]).filter(Boolean);
        return Array.from(new Set(values)).sort();
    };

    function parseMarketCap(val: string | number): number {
        if (typeof val === 'number') return val;
        const str = val.toUpperCase().replace(/[$,]/g, '');
        let num = parseFloat(str);
        if (isNaN(num)) return 0;
        if (str.endsWith('T')) num *= 1e12;
        else if (str.endsWith('B')) num *= 1e9;
        else if (str.endsWith('M')) num *= 1e6;
        return num;
    }

    const filteredData = useMemo(() => {
        if (filters.length === 0) return allAssets;

        return allAssets.filter(asset => {
            return filters.every(rule => {
                const val = (asset as any)[rule.column];
                if (val === undefined || val === null) return false;

                const meta = COLUMN_METADATA[rule.column];
                const isNumericCol = meta?.type === 'number';
                const isCategory = meta?.type === 'category';

                if (isNumericCol) {
                    const numericVal = rule.column === 'market_capitalization' ? parseMarketCap(val) : parseFloat(val);
                    const parseFilterVal = (v: any) => rule.column === 'market_capitalization' ? parseMarketCap(v) : parseFloat(v);

                    const min = (rule.value !== '' && rule.value !== undefined) ? parseFilterVal(rule.value) : -Infinity;
                    const max = (rule.value2 !== '' && rule.value2 !== undefined) ? parseFilterVal(rule.value2) : Infinity;

                    switch (rule.operator) {
                        case 'gt':
                        case 'lt':
                        case 'between':
                            return numericVal >= min && numericVal <= max;
                        case 'eq':
                            return numericVal === min;
                        default: return true;
                    }
                } else if (isCategory) {
                    const stringVal = val.toString();
                    if (Array.isArray(rule.value)) {
                        return rule.value.length === 0 || rule.value.includes(stringVal);
                    }
                    return stringVal === rule.value;
                } else {
                    const stringVal = val.toString().toLowerCase();
                    const filterVal = rule.value.toString().toLowerCase();

                    switch (rule.operator) {
                        case 'eq': return stringVal === filterVal;
                        case 'contains': return stringVal.includes(filterVal);
                        default: return true;
                    }
                }
            });
        });
    }, [allAssets, filters]);

    if (authLoading) {
        return (
            <div className="min-h-screen bg-background p-6">
                <Skeleton className="h-12 w-48 mb-8" />
                <Skeleton className="h-96 w-full" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background pb-12">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => navigate('/dashboard')}
                            >
                                <ArrowLeft className="h-5 w-5" />
                            </Button>
                            <div>
                                <h1 className="text-2xl font-bold text-foreground">Advanced Screener</h1>
                                <p className="text-sm text-muted-foreground">
                                    Multi-factor filtering for {assetType}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => navigate('/wiki')}
                                className="gap-2 border-primary/20 hover:bg-primary/10"
                            >
                                <Globe className="h-4 w-4" />
                                Indicator Wiki
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={refetch}
                                disabled={loading}
                                className="gap-2"
                            >
                                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                                Refresh
                            </Button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8 space-y-8">
                {/* Smart Filters Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {SMART_FILTERS.map((sf) => (
                        <Card
                            key={sf.name}
                            className={`cursor-pointer group transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] ${activeSmartFilter === sf.name
                                ? 'border-primary bg-primary/5 ring-1 ring-primary'
                                : 'bg-card/50 hover:border-primary/50'
                                }`}
                            onClick={() => applySmartFilter(sf)}
                        >
                            <CardHeader className="p-4">
                                <CardTitle className="text-sm flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Zap className={`h-4 w-4 ${activeSmartFilter === sf.name ? 'text-primary' : 'text-muted-foreground group-hover:text-primary'}`} />
                                        {sf.name}
                                    </div>
                                    {activeSmartFilter === sf.name && (
                                        <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                                    )}
                                </CardTitle>
                                <CardDescription className="text-xs mt-1">{sf.description}</CardDescription>
                            </CardHeader>
                        </Card>
                    ))}
                </div>

                {/* Filter Builder */}
                <Card className="border-border bg-card/40 backdrop-blur-sm overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between border-b border-border bg-muted/20 px-6 py-4">
                        <div className="space-y-1">
                            <CardTitle className="text-lg font-semibold flex items-center gap-2">
                                <Filter className="h-5 w-5 text-primary" />
                                Filter Rules
                                <HoverCard>
                                    <HoverCardTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 ml-1 text-muted-foreground hover:text-foreground"
                                            onClick={() => navigate('/wiki')}
                                        >
                                            <Info className="h-4 w-4" />
                                        </Button>
                                    </HoverCardTrigger>
                                    <HoverCardContent className="w-[450px] p-0 shadow-2xl border-primary/20 bg-background/95 backdrop-blur-md">
                                        <div className="p-4 border-b border-border bg-muted/30">
                                            <h4 className="font-bold text-base flex items-center gap-2">
                                                <Info className="h-4 w-4 text-primary" />
                                                Screener Dictionary
                                            </h4>
                                            <p className="text-xs text-muted-foreground mt-1">Guide to all available data points and technical filters.</p>
                                        </div>
                                        <div className="max-h-[500px] overflow-y-auto px-4 py-3 space-y-4 text-xs">
                                            <section>
                                                <h5 className="font-bold text-primary mb-1.5 uppercase tracking-wider text-[10px]">Trend (GoldHand Line)</h5>
                                                <div className="grid gap-1.5 opacity-90">
                                                    <p><strong>GHL Status/Color:</strong> Current trend state (Bullish/Gold, Bearish/Blue, etc).</p>
                                                    <p><strong>Days Since Flip:</strong> How long has the trend been in its current state.</p>
                                                    <p><strong>% Change from Flip:</strong> Performance since the trend signal changed.</p>
                                                </div>
                                            </section>
                                            <section>
                                                <h5 className="font-bold text-primary mb-1.5 uppercase tracking-wider text-[10px]">Momentum (RSI)</h5>
                                                <div className="grid gap-1.5 opacity-90">
                                                    <p><strong>RSI Value:</strong> Current Relative Strength Index (0-100).</p>
                                                    <p><strong>RSI Status:</strong> Overbought (&gt;70) or Oversold (&lt;30) conditions.</p>
                                                </div>
                                            </section>
                                            <section>
                                                <h5 className="font-bold text-primary mb-1.5 uppercase tracking-wider text-[10px]">Moving Averages &amp; Bands</h5>
                                                <div className="grid gap-1.5 opacity-90">
                                                    <p><strong>Diff SMA:</strong> % distance from the 50, 100, or 200-day average. Positive means above average.</p>
                                                    <p><strong>Diff BB:</strong> % distance from Bollinger Bands. Useful for volatility and mean reversion.</p>
                                                </div>
                                            </section>
                                            <section>
                                                <h5 className="font-bold text-primary mb-1.5 uppercase tracking-wider text-[10px]">Cycle Analysis (Local High/Low)</h5>
                                                <div className="grid gap-1.5 opacity-90">
                                                    <p><strong>% Fall from Max:</strong> Drawdown from the absolute major high.</p>
                                                    <p><strong>Local Max/Min:</strong> Short-term pivots. % Change from Min is "recovery", % Fall from Max is "dip".</p>
                                                </div>
                                            </section>
                                            <section>
                                                <h5 className="font-bold text-primary mb-1.5 uppercase tracking-wider text-[10px]">Fundamentals</h5>
                                                <div className="grid gap-1.5 opacity-90">
                                                    <p><strong>P/E Ratio:</strong> Price valuation relative to earnings.</p>
                                                    <p><strong>EPS:</strong> Earnings per share (TTM). Company profitability.</p>
                                                    <p><strong>Employees:</strong> Total workforce size.</p>
                                                </div>
                                            </section>
                                        </div>
                                    </HoverCardContent>
                                </HoverCard>
                            </CardTitle>
                            <p className="text-xs text-muted-foreground">Rules are combined with AND logic</p>
                        </div>
                        <Button onClick={addFilter} variant="outline" className="gap-2 border-primary/20 hover:bg-primary/10">
                            <Zap className="h-4 w-4" /> Add Rule
                        </Button>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                        {filters.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground border-2 border-dashed border-border rounded-2xl bg-muted/10">
                                <ScanSearch className="h-12 w-12 mx-auto mb-4 opacity-20" />
                                <p className="text-lg font-medium">No active filters</p>
                                <p className="text-sm">Add a custom rule or pick a smart filter to begin</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {filters.map((rule) => {
                                    const meta = COLUMN_METADATA[rule.column];
                                    const isCategory = meta?.type === 'category';
                                    const isNumber = meta?.type === 'number';

                                    // Filter column list based on asset type
                                    const availableColumns = Object.entries(COLUMN_METADATA).filter(([id]) => {
                                        // Always exclude ticker, name, price
                                        if (id === 'ticker' || id === 'name' || id === 'price') return false;

                                        // Exclude stock-specific fields for crypto/commodities
                                        if (assetType !== 'stocks' && (
                                            id === 'sector' ||
                                            id === 'industry' ||
                                            id === 'price_per_earning' ||
                                            id === 'earnings_per_share_basic_ttm' ||
                                            id === 'number_of_employees'
                                        )) {
                                            return false;
                                        }
                                        return true;
                                    });

                                    return (
                                        <div key={rule.id} className="flex flex-wrap items-center gap-3 p-4 bg-muted/30 rounded-2xl border border-border/50 animate-in fade-in slide-in-from-top-1 transition-all">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-1">Column</span>
                                                <Select
                                                    value={rule.column}
                                                    onValueChange={(val) => updateFilter(rule.id, { column: val as keyof GoldHandAsset, value: isCategory ? [] : '' })}
                                                >
                                                    <SelectTrigger className="w-[200px] h-10 bg-background border-border/50">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {availableColumns.map(([id, meta]) => (
                                                            <SelectItem key={id} value={id}>{meta.label}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div className="flex flex-col gap-1">
                                                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-1">Operator</span>
                                                <Select
                                                    value={rule.operator}
                                                    onValueChange={(val) => updateFilter(rule.id, { operator: val as Operator })}
                                                >
                                                    <SelectTrigger className="w-[140px] h-10 bg-background border-border/50">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {isNumber && <SelectItem value="gt">Greater Than</SelectItem>}
                                                        {isNumber && <SelectItem value="lt">Less Than</SelectItem>}
                                                        <SelectItem value="eq">{isCategory ? 'In List' : 'Equals'}</SelectItem>
                                                        {!isNumber && !isCategory && <SelectItem value="contains">Contains</SelectItem>}
                                                        {isNumber && <SelectItem value="between">Between</SelectItem>}
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div className="flex flex-col gap-1 grow">
                                                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-1">Value</span>
                                                {isCategory ? (
                                                    <div className="flex flex-wrap gap-2 p-1 bg-background rounded-lg border border-border/50 min-h-[40px]">
                                                        {getUniqueValues(rule.column).map(v => {
                                                            const isSelected = Array.isArray(rule.value) && rule.value.includes(v);
                                                            return (
                                                                <Badge
                                                                    key={v}
                                                                    variant={isSelected ? 'default' : 'outline'}
                                                                    className={`cursor-pointer transition-all ${isSelected ? 'bg-primary' : 'hover:bg-primary/10'}`}
                                                                    onClick={() => {
                                                                        const current = Array.isArray(rule.value) ? rule.value : [];
                                                                        const next = isSelected
                                                                            ? current.filter(x => x !== v)
                                                                            : [...current, v];
                                                                        updateFilter(rule.id, { value: next });
                                                                    }}
                                                                >
                                                                    {v}
                                                                </Badge>
                                                            );
                                                        })}
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-2 grow">
                                                        {!isNumber ? (
                                                            <Input
                                                                type="text"
                                                                placeholder="Value..."
                                                                className="grow h-10 bg-background border-border/50"
                                                                value={rule.value}
                                                                onChange={(e) => updateFilter(rule.id, { value: e.target.value })}
                                                            />
                                                        ) : (
                                                            <div className="w-full px-4 pt-2">
                                                                {(() => {
                                                                    const rawValues = allAssets.map(a => {
                                                                        const v = (a as any)[rule.column];
                                                                        return rule.column === 'market_capitalization' ? parseMarketCap(v || 0) : parseFloat(v || 0);
                                                                    }).filter(n => !isNaN(n) && isFinite(n));

                                                                    if (rawValues.length === 0) return <span className="text-xs text-muted-foreground italic">No data available</span>;

                                                                    const sorted = [...rawValues].sort((a, b) => a - b);
                                                                    const dataMin = sorted[0];
                                                                    const dataMax = sorted[sorted.length - 1];
                                                                    const p10 = sorted[Math.floor(sorted.length * 0.1)];
                                                                    const p90 = sorted[Math.floor(sorted.length * 0.9)];

                                                                    const parseVal = (v: any) => rule.column === 'market_capitalization' ? parseMarketCap(v || 0) : parseFloat(v || 0);
                                                                    const currentVal1 = (rule.value !== '' && rule.value !== undefined) ? parseVal(rule.value) : p10;
                                                                    const currentVal2 = (rule.value2 !== '' && rule.value2 !== undefined) ? parseVal(rule.value2) : p90;

                                                                    const formatValue = (n: number) => {
                                                                        if (rule.column === 'market_capitalization') {
                                                                            if (n >= 1e12) return (n / 1e12).toFixed(1) + 'T';
                                                                            if (n >= 1e9) return (n / 1e9).toFixed(1) + 'B';
                                                                            if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
                                                                            return Math.round(n).toLocaleString();
                                                                        }
                                                                        return Number.isInteger(n) ? n.toString() : n.toFixed(2);
                                                                    };

                                                                    return (
                                                                        <div className="space-y-4 my-2">
                                                                            <Slider
                                                                                value={[currentVal1, currentVal2]}
                                                                                min={dataMin}
                                                                                max={dataMax}
                                                                                step={(dataMax - dataMin) / 200 || 1}
                                                                                onValueChange={([v1, v2]) => {
                                                                                    updateFilter(rule.id, {
                                                                                        value: rule.column === 'market_capitalization' ? formatValue(v1) : v1.toString(),
                                                                                        value2: rule.column === 'market_capitalization' ? formatValue(v2) : v2.toString()
                                                                                    });
                                                                                }}
                                                                                className="my-4"
                                                                            />
                                                                            <div className="flex justify-between text-[10px] text-primary font-mono font-bold">
                                                                                <div className="flex flex-col">
                                                                                    <span className="text-muted-foreground font-normal">MIN</span>
                                                                                    <span>{formatValue(currentVal1)}</span>
                                                                                </div>
                                                                                <div className="flex flex-col text-right">
                                                                                    <span className="text-muted-foreground font-normal">MAX</span>
                                                                                    <span>{formatValue(currentVal2)}</span>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })()}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>

                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => removeFilter(rule.id)}
                                                className="mt-5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full"
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {filters.length > 0 && (
                            <div className="flex justify-between items-center pt-4 border-t border-border mt-4">
                                <div className="flex items-center gap-3">
                                    <p className="text-sm text-muted-foreground">
                                        Matching assets: <span className="text-primary font-bold text-lg">{filteredData.length}</span>
                                    </p>
                                    <div className="h-4 w-[1px] bg-border" />
                                    <div className="flex gap-1">
                                        {assetType === 'stocks' && <Badge variant="outline" className="bg-primary/5">Stocks</Badge>}
                                        {assetType === 'crypto' && <Badge variant="outline" className="bg-accent/5">Crypto</Badge>}
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setFilters([])}
                                    className="text-xs text-muted-foreground hover:text-foreground"
                                >
                                    <RefreshCw className="h-3 w-3 mr-1" /> Clear All Filters
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Results Section */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <h2 className="text-2xl font-bold flex items-center gap-2">
                                <BarChart3 className="h-6 w-6 text-primary" />
                                Screener Results
                            </h2>

                            {/* Asset Type Toggle */}
                            <div className="flex bg-muted p-1 rounded-lg">
                                <Button
                                    variant={assetType === 'stocks' ? 'default' : 'ghost'}
                                    size="sm"
                                    onClick={() => { setAssetType('stocks'); setFilters([]); }}
                                    className="rounded-md px-3 h-8"
                                >
                                    Stocks
                                </Button>
                                <Button
                                    variant={assetType === 'crypto' ? 'default' : 'ghost'}
                                    size="sm"
                                    onClick={() => { setAssetType('crypto'); setFilters([]); }}
                                    className="rounded-md px-3 h-8"
                                >
                                    Crypto
                                </Button>
                                <Button
                                    variant={assetType === 'commodities' ? 'default' : 'ghost'}
                                    size="sm"
                                    onClick={() => { setAssetType('commodities'); setFilters([]); }}
                                    className="rounded-md px-3 h-8"
                                >
                                    Commodities
                                </Button>
                            </div>

                            <div className="h-6 w-[1px] bg-border" />

                            {/* Timeframe Toggle */}
                            <div className="flex bg-muted p-1 rounded-lg">
                                <Button
                                    variant={timeframe === 'daily' ? 'secondary' : 'ghost'}
                                    size="sm"
                                    onClick={() => setTimeframe('daily')}
                                    className={`rounded-md px-3 h-8 ${timeframe === 'daily' ? 'bg-background shadow-sm' : ''}`}
                                >
                                    Daily
                                </Button>
                                <Button
                                    variant={timeframe === 'weekly' ? 'secondary' : 'ghost'}
                                    size="sm"
                                    onClick={() => setTimeframe('weekly')}
                                    className={`rounded-md px-3 h-8 ${timeframe === 'weekly' ? 'bg-background shadow-sm' : ''}`}
                                >
                                    Weekly
                                </Button>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">Showing {filteredData.length} of {allAssets.length} assets</span>
                        </div>
                    </div>

                    <div className="bg-card/30 backdrop-blur-sm rounded-2xl border border-border p-1 overflow-hidden">
                        <ScannerTable
                            data={filteredData}
                            assetType={assetType}
                            loading={loading}
                        />
                    </div>
                </div>
            </main>
        </div>
    );
}
