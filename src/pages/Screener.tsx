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
    ExternalLink,
    ScanSearch
} from 'lucide-react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
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
    ticker: { label: 'Ticker', type: 'string' },
    name: { label: 'Name', type: 'string' },
    sector: { label: 'Sector', type: 'category' },
    industry: { label: 'Industry', type: 'category' },
    price: { label: 'Price', type: 'number' },
    market_capitalization: { label: 'Market Cap', type: 'number' },
    ghl_color: { label: 'Trend', type: 'category' },
    ghl_days_since_change: { label: 'Days Since Flip', type: 'number' },
    rsi: { label: 'RSI', type: 'number' },
    fell_from_last_max: { label: '% Fall from Max', type: 'number' },
    diff_sma50: { label: '% Diff SMA50', type: 'number' },
    diff_sma100: { label: '% Diff SMA100', type: 'number' },
    diff_sma200: { label: '% Diff SMA200', type: 'number' },
    diff_upper_bb: { label: '% Diff Upper BB', type: 'number' },
    diff_lower_bb: { label: '% Diff Lower BB', type: 'number' },
    rsi_days_since_last_change: { label: 'RSI Days Since Change', type: 'number' },
    price_per_earning: { label: 'P/E Ratio', type: 'number' },
    percent_change_from_last_local_min: { label: '% Change from Min', type: 'number' },
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
    const [assetType, setAssetType] = useState<'stocks' | 'crypto'>('stocks');
    const { data: allAssets, loading, refetch } = useGoldHandData(assetType, 'daily');
    const [filters, setFilters] = useState<FilterRule[]>([]);
    const [activeSmartFilter, setActiveSmartFilter] = useState<string | null>(null);

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

                const isNumericCol = COLUMN_METADATA[rule.column]?.type === 'number';

                if (isNumericCol) {
                    const numericVal = rule.column === 'market_capitalization' ? parseMarketCap(val) : parseFloat(val);
                    const filterVal = parseFloat(rule.value);
                    const filterVal2 = parseFloat(rule.value2);

                    switch (rule.operator) {
                        case 'gt': return numericVal > filterVal;
                        case 'lt': return numericVal < filterVal;
                        case 'eq': return numericVal === filterVal;
                        case 'between': return numericVal >= filterVal && numericVal <= (isNaN(filterVal2) ? filterVal : filterVal2);
                        default: return true;
                    }
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
                            <div className="flex bg-muted p-1 rounded-lg">
                                <Button
                                    variant={assetType === 'stocks' ? 'default' : 'ghost'}
                                    size="sm"
                                    onClick={() => { setAssetType('stocks'); setFilters([]); }}
                                    className="rounded-md"
                                >
                                    Stocks
                                </Button>
                                <Button
                                    variant={assetType === 'crypto' ? 'default' : 'ghost'}
                                    size="sm"
                                    onClick={() => { setAssetType('crypto'); setFilters([]); }}
                                    className="rounded-md"
                                >
                                    Crypto
                                </Button>
                            </div>
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

                                    return (
                                        <div key={rule.id} className="flex flex-wrap items-center gap-3 p-4 bg-muted/30 rounded-2xl border border-border/50 animate-in fade-in slide-in-from-top-1 transition-all">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-1">Column</span>
                                                <Select
                                                    value={rule.column}
                                                    onValueChange={(val) => updateFilter(rule.id, { column: val as keyof GoldHandAsset, value: '' })}
                                                >
                                                    <SelectTrigger className="w-[200px] h-10 bg-background border-border/50">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {Object.entries(COLUMN_METADATA).map(([id, meta]) => (
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
                                                        <SelectItem value="eq">Equals</SelectItem>
                                                        {!isNumber && !isCategory && <SelectItem value="contains">Contains</SelectItem>}
                                                        {isNumber && <SelectItem value="between">Between</SelectItem>}
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div className="flex flex-col gap-1 grow">
                                                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-1">Value</span>
                                                {isCategory ? (
                                                    <Select
                                                        value={rule.value}
                                                        onValueChange={(val) => updateFilter(rule.id, { value: val })}
                                                    >
                                                        <SelectTrigger className="grow h-10 bg-background border-border/50">
                                                            <SelectValue placeholder="Select value..." />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {getUniqueValues(rule.column).map(v => (
                                                                <SelectItem key={v} value={v}>{v}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                ) : (
                                                    <div className="flex items-center gap-2">
                                                        <Input
                                                            type={isNumber ? 'number' : 'text'}
                                                            placeholder="Value..."
                                                            className="grow h-10 bg-background border-border/50"
                                                            value={rule.value}
                                                            onChange={(e) => updateFilter(rule.id, { value: e.target.value })}
                                                        />
                                                        {rule.operator === 'between' && (
                                                            <>
                                                                <span className="text-muted-foreground text-xs font-bold uppercase">and</span>
                                                                <Input
                                                                    type="number"
                                                                    placeholder="Value..."
                                                                    className="w-[120px] h-10 bg-background border-border/50"
                                                                    value={rule.value2 || ''}
                                                                    onChange={(e) => updateFilter(rule.id, { value2: e.target.value })}
                                                                />
                                                            </>
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
                        <h2 className="text-2xl font-bold flex items-center gap-2">
                            <BarChart3 className="h-6 w-6 text-primary" />
                            Screener Results
                        </h2>
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
