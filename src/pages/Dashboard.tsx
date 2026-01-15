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
  Target,
  ScanSearch,
  Search,
  Star
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
          <h1 className="text-2xl font-bold font-mono text-gradient">Goldhand Finance</h1>
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
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold">
              Welcome back, {profile?.display_name || 'Trader'}!
            </h2>
            <p className="text-muted-foreground">
              {isProfileComplete
                ? 'Access your watchlists and track your favorite assets.'
                : 'Complete your profile to get personalized recommendations.'}
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() => navigate('/predictions')}
              className="bg-primary text-primary-foreground font-black uppercase tracking-widest px-8 rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all h-12"
            >
              <Zap className="w-4 h-4 mr-2" />
              Post New Idea
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/watchlist')}
              className="h-12 rounded-xl px-6 border-primary/20 hover:bg-primary/5 font-bold"
            >
              <Star className="w-4 h-4 mr-2" />
              Watchlist
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/predictions')}
              className="h-12 rounded-xl px-6 border-primary/20 hover:bg-primary/5 font-bold"
            >
              <Target className="w-4 h-4 mr-2" />
              Tip Center
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/scanner')}
              className="h-12 rounded-xl px-6 border-primary/20 hover:bg-primary/5 font-bold"
            >
              <Search className="w-4 h-4 mr-2" />
              Scanner
            </Button>
          </div>
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
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Scanner Card - NOW Primary Feature */}
          <Link to="/scanner" className="md:col-span-2">
            <Card className="bg-gradient-to-br from-primary/10 to-accent/10 border-primary/30 hover:border-primary/60 transition-all cursor-pointer group h-full">
              <CardHeader>
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-4 group-hover:shadow-[0_0_40px_hsl(var(--primary)/0.4)] transition-all">
                  <TrendingUp className="w-7 h-7 text-primary-foreground" />
                </div>
                <CardTitle className="text-xl">Market Scanner</CardTitle>
                <CardDescription className="text-base">
                  Track bullish and bearish trends across markets with the Gold Hand Line
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Quick view of current trends across all assets with daily & weekly timeframes. See trend strength and time since flip.
                </p>
              </CardContent>
            </Card>
          </Link>

          {/* Screener Card - Secondary Feature */}
          <Link to="/screener">
            <Card className="bg-card border-border hover:border-primary/50 transition-all cursor-pointer group h-full">
              <CardHeader>
                <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center mb-4 group-hover:glow-primary transition-all">
                  <ScanSearch className="w-6 h-6 text-primary-foreground" />
                </div>
                <CardTitle>Advanced Screener</CardTitle>
                <CardDescription>
                  Multi-factor filtering
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Filter by sector, cap, and technical indicators.
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link to="/predictions">
            <Card className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border-indigo-500/30 hover:border-indigo-500/60 transition-all cursor-pointer group h-full">
              <CardHeader>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center mb-4 group-hover:shadow-[0_0_30px_rgba(99,102,241,0.4)] transition-all">
                  <Target className="w-6 h-6 text-white" />
                </div>
                <CardTitle>Tip Center</CardTitle>
                <CardDescription>
                  Market Tips & Ideas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  View crowd sentiment and active market tips.
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
                    ? 'Manage your preferences'
                    : 'Complete your profile'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Update your interests and favorite trading resources.
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </main>
    </div>
  );
}