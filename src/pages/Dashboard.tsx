import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  TrendingUp, 
  Bitcoin, 
  User, 
  LogOut, 
  BarChart3,
  Zap,
  Globe,
  Target
} from 'lucide-react';

export default function Dashboard() {
  const { user, loading: authLoading, signOut } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <Skeleton className="h-12 w-64" />
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Skeleton className="h-48" />
            <Skeleton className="h-48" />
            <Skeleton className="h-48" />
          </div>
        </div>
      </div>
    );
  }

  const isProfileComplete = profile?.trading_frequency && 
    profile?.trading_instruments?.length && 
    profile?.interested_sectors?.length;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold font-mono text-gradient">TradeWatch</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {profile?.display_name || user?.email}
            </span>
            <Button variant="ghost" size="icon" onClick={handleSignOut}>
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">
            Welcome back, {profile?.display_name || 'Trader'}!
          </h2>
          <p className="text-muted-foreground">
            {isProfileComplete 
              ? 'Access your watchlists and track your favorite assets.'
              : 'Complete your profile to get personalized recommendations.'}
          </p>
        </div>

        {/* Quick Stats */}
        {profile?.trading_frequency && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card className="bg-card border-border">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Zap className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Trading Frequency</p>
                    <p className="font-semibold capitalize">{profile.trading_frequency}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Instruments</p>
                    <p className="font-semibold">{profile.trading_instruments?.length || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Target className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Sectors</p>
                    <p className="font-semibold">{profile.interested_sectors?.length || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Globe className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Stocks Watching</p>
                    <p className="font-semibold">{profile.interested_stocks?.length || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Navigation Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link to="/stocks">
            <Card className="bg-card border-border hover:border-primary/50 transition-all cursor-pointer group h-full">
              <CardHeader>
                <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center mb-4 group-hover:glow-primary transition-all">
                  <TrendingUp className="w-6 h-6 text-primary-foreground" />
                </div>
                <CardTitle>StockWatch</CardTitle>
                <CardDescription>
                  Track top US stocks with real-time TradingView charts
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Monitor AAPL, MSFT, GOOGL, AMZN, TSLA, and more
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link to="/crypto">
            <Card className="bg-card border-border hover:border-accent/50 transition-all cursor-pointer group h-full">
              <CardHeader>
                <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center mb-4 group-hover:shadow-[0_0_30px_hsl(var(--accent)/0.3)] transition-all">
                  <Bitcoin className="w-6 h-6 text-accent-foreground" />
                </div>
                <CardTitle>CryptoWatch</CardTitle>
                <CardDescription>
                  Track top cryptocurrencies with live price charts
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Follow BTC, ETH, SOL, XRP, and top 20 cryptos
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link to="/profile">
            <Card className="bg-card border-border hover:border-secondary-foreground/30 transition-all cursor-pointer group h-full">
              <CardHeader>
                <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center mb-4">
                  <User className="w-6 h-6 text-secondary-foreground" />
                </div>
                <CardTitle>Your Profile</CardTitle>
                <CardDescription>
                  {isProfileComplete 
                    ? 'View and update your trading preferences'
                    : 'Complete your trading profile'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {isProfileComplete
                    ? 'Manage your interests, favorite resources, and more'
                    : 'Set up your trading frequency, interests, and favorites'}
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </main>
    </div>
  );
}