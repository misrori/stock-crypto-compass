import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft, Zap, Activity, Info, TrendingUp, DollarSign } from 'lucide-react';

export default function Wiki() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-background pb-12">
            <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <h1 className="text-2xl font-bold">Indicator Hub & Wiki</h1>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8 space-y-12">
                <div className="max-w-3xl mx-auto text-center space-y-4">
                    <h2 className="text-4xl font-extrabold tracking-tight">Understanding the Market Compass</h2>
                    <p className="text-xl text-muted-foreground">
                        A quick guide to our proprietary trend-following system and institutional indicators.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* GoldHand Line */}
                    <Card className="border-primary/20 bg-primary/5">
                        <CardHeader>
                            <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center mb-4">
                                <Zap className="h-6 w-6 text-primary" />
                            </div>
                            <CardTitle className="text-2xl font-bold">GoldHand Line (GHL)</CardTitle>
                            <CardDescription>The ultimate trend filter</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-sm leading-relaxed text-muted-foreground">
                                The **GoldHand Line** is our core trend detection algorithm. It acts as a dynamic support and resistance boundary that filters out noise.
                            </p>
                            <ul className="space-y-2">
                                <li className="flex items-center gap-2 text-sm">
                                    <div className="w-2 h-2 rounded-full bg-gold" />
                                    <span>**Bullish (Gold):** Price is above the line.</span>
                                </li>
                                <li className="flex items-center gap-2 text-sm">
                                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                                    <span>**Bearish (Blue):** Price is below the line.</span>
                                </li>
                            </ul>
                            <p className="text-xs italic text-muted-foreground/60">
                                Best used for identifying market regimes and avoiding "vhipsaws" in sideways markets.
                            </p>
                        </CardContent>
                    </Card>

                    {/* MoneyLine */}
                    <Card className="border-accent/20 bg-accent/5">
                        <CardHeader>
                            <div className="w-12 h-12 rounded-2xl bg-accent/20 flex items-center justify-center mb-4">
                                <TrendingUp className="h-6 w-6 text-accent" />
                            </div>
                            <CardTitle className="text-2xl font-bold">MoneyLine</CardTitle>
                            <CardDescription>Institutional Flow & Momentum</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-sm leading-relaxed text-muted-foreground">
                                **MoneyLine** tracks volume-weighted price movements to see where "Big Money" is moving. It detects aggressive buying or selling before it becomes obvious on the chart.
                            </p>
                            <div className="p-3 rounded-lg bg-background/50 border border-border/50">
                                <p className="text-xs font-mono">Slope up = Strong accumulation</p>
                                <p className="text-xs font-mono">Slope down = Distribution / Selling</p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* RSI */}
                    <Card className="border-border bg-muted/20">
                        <CardHeader>
                            <div className="w-12 h-12 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
                                <Activity className="h-6 w-6 text-foreground" />
                            </div>
                            <CardTitle className="text-2xl font-bold">Relative Strength Index</CardTitle>
                            <CardDescription>Standard Momentum Oscillator</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-sm leading-relaxed text-muted-foreground">
                                RSI measures the speed and change of price movements. We use it to identify overextended conditions.
                            </p>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                                <div className="p-2 rounded bg-destructive/10 text-destructive text-center">
                                    **Overbought** (&gt;70)
                                </div>
                                <div className="p-2 rounded bg-green-500/10 text-green-500 text-center">
                                    **Oversold** (&lt;30)
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="rounded-3xl border border-dashed border-border p-12 text-center space-y-4">
                    <Info className="h-10 w-10 mx-auto text-muted-foreground opacity-50" />
                    <h3 className="text-xl font-bold">Strategy Tip</h3>
                    <p className="max-w-xl mx-auto text-muted-foreground">
                        The most powerful signals occur when indicators align: **Gold Trend** + **MoneyLine uptrend** + **RSI bounce** from oversold. Use the Advanced Screener to find these rare high-probability setups.
                    </p>
                </div>
            </main>
        </div>
    );
}
