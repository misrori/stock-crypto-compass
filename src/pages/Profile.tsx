import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, X, Plus, Save } from 'lucide-react';

const TRADING_FREQUENCIES = ['daily', 'weekly', 'monthly', 'rarely'];
const TRADING_INSTRUMENTS = ['stocks', 'crypto', 'forex', 'options', 'futures', 'etfs'];
const SECTORS = ['technology', 'healthcare', 'finance', 'energy', 'consumer', 'industrial', 'materials', 'utilities', 'real estate'];
const TECHNOLOGIES = ['AI', 'blockchain', 'cloud computing', 'cybersecurity', 'IoT', 'robotics', '5G', 'quantum computing', 'biotech'];

export default function Profile() {
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading, updateProfile } = useProfile();
  const navigate = useNavigate();
  
  const [displayName, setDisplayName] = useState('');
  const [tradingFrequency, setTradingFrequency] = useState('');
  const [tradingInstruments, setTradingInstruments] = useState<string[]>([]);
  const [favoriteYoutubers, setFavoriteYoutubers] = useState<string[]>([]);
  const [favoriteWebsites, setFavoriteWebsites] = useState<string[]>([]);
  const [interestedStocks, setInterestedStocks] = useState<string[]>([]);
  const [interestedSectors, setInterestedSectors] = useState<string[]>([]);
  const [interestedTechnologies, setInterestedTechnologies] = useState<string[]>([]);
  
  const [newYoutuber, setNewYoutuber] = useState('');
  const [newWebsite, setNewWebsite] = useState('');
  const [newStock, setNewStock] = useState('');
  
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || '');
      setTradingFrequency(profile.trading_frequency || '');
      setTradingInstruments(profile.trading_instruments || []);
      setFavoriteYoutubers(profile.favorite_youtubers || []);
      setFavoriteWebsites(profile.favorite_websites || []);
      setInterestedStocks(profile.interested_stocks || []);
      setInterestedSectors(profile.interested_sectors || []);
      setInterestedTechnologies(profile.interested_technologies || []);
    }
  }, [profile]);

  const handleSave = async () => {
    setIsSaving(true);
    await updateProfile({
      display_name: displayName,
      trading_frequency: tradingFrequency,
      trading_instruments: tradingInstruments,
      favorite_youtubers: favoriteYoutubers,
      favorite_websites: favoriteWebsites,
      interested_stocks: interestedStocks,
      interested_sectors: interestedSectors,
      interested_technologies: interestedTechnologies,
    });
    setIsSaving(false);
  };

  const toggleItem = (array: string[], setArray: (arr: string[]) => void, item: string) => {
    if (array.includes(item)) {
      setArray(array.filter(i => i !== item));
    } else {
      setArray([...array, item]);
    }
  };

  const addItem = (array: string[], setArray: (arr: string[]) => void, item: string, setInput: (s: string) => void) => {
    if (item.trim() && !array.includes(item.trim())) {
      setArray([...array, item.trim()]);
      setInput('');
    }
  };

  const removeItem = (array: string[], setArray: (arr: string[]) => void, item: string) => {
    setArray(array.filter(i => i !== item));
  };

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-3xl mx-auto space-y-8">
          <Skeleton className="h-12 w-48" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/dashboard">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <h1 className="text-xl font-bold font-mono">Your Profile</h1>
          </div>
          <Button onClick={handleSave} disabled={isSaving}>
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        {/* Basic Info */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Your display name and trading habits</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your name"
              />
            </div>
            <div className="space-y-2">
              <Label>Trading Frequency</Label>
              <Select value={tradingFrequency} onValueChange={setTradingFrequency}>
                <SelectTrigger>
                  <SelectValue placeholder="How often do you trade?" />
                </SelectTrigger>
                <SelectContent>
                  {TRADING_FREQUENCIES.map(freq => (
                    <SelectItem key={freq} value={freq} className="capitalize">
                      {freq}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Trading Instruments */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Trading Instruments</CardTitle>
            <CardDescription>What do you trade?</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {TRADING_INSTRUMENTS.map(instrument => (
                <Badge
                  key={instrument}
                  variant={tradingInstruments.includes(instrument) ? 'default' : 'outline'}
                  className="cursor-pointer capitalize"
                  onClick={() => toggleItem(tradingInstruments, setTradingInstruments, instrument)}
                >
                  {instrument}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Sectors & Technologies */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Interests</CardTitle>
            <CardDescription>Sectors and technologies you follow</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Sectors</Label>
              <div className="flex flex-wrap gap-2">
                {SECTORS.map(sector => (
                  <Badge
                    key={sector}
                    variant={interestedSectors.includes(sector) ? 'default' : 'outline'}
                    className="cursor-pointer capitalize"
                    onClick={() => toggleItem(interestedSectors, setInterestedSectors, sector)}
                  >
                    {sector}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Technologies</Label>
              <div className="flex flex-wrap gap-2">
                {TECHNOLOGIES.map(tech => (
                  <Badge
                    key={tech}
                    variant={interestedTechnologies.includes(tech) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => toggleItem(interestedTechnologies, setInterestedTechnologies, tech)}
                  >
                    {tech}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stocks */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Interested Stocks</CardTitle>
            <CardDescription>Add stock tickers you want to follow</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={newStock}
                onChange={(e) => setNewStock(e.target.value.toUpperCase())}
                placeholder="e.g., AAPL"
                onKeyDown={(e) => e.key === 'Enter' && addItem(interestedStocks, setInterestedStocks, newStock, setNewStock)}
              />
              <Button onClick={() => addItem(interestedStocks, setInterestedStocks, newStock, setNewStock)}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {interestedStocks.map(stock => (
                <Badge key={stock} variant="secondary" className="gap-1">
                  {stock}
                  <X
                    className="w-3 h-3 cursor-pointer"
                    onClick={() => removeItem(interestedStocks, setInterestedStocks, stock)}
                  />
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Favorite YouTubers */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Favorite YouTubers</CardTitle>
            <CardDescription>Trading channels you follow</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={newYoutuber}
                onChange={(e) => setNewYoutuber(e.target.value)}
                placeholder="e.g., Graham Stephan"
                onKeyDown={(e) => e.key === 'Enter' && addItem(favoriteYoutubers, setFavoriteYoutubers, newYoutuber, setNewYoutuber)}
              />
              <Button onClick={() => addItem(favoriteYoutubers, setFavoriteYoutubers, newYoutuber, setNewYoutuber)}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {favoriteYoutubers.map(youtuber => (
                <Badge key={youtuber} variant="secondary" className="gap-1">
                  {youtuber}
                  <X
                    className="w-3 h-3 cursor-pointer"
                    onClick={() => removeItem(favoriteYoutubers, setFavoriteYoutubers, youtuber)}
                  />
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Favorite Websites */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Favorite Websites</CardTitle>
            <CardDescription>Trading and financial websites you visit</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={newWebsite}
                onChange={(e) => setNewWebsite(e.target.value)}
                placeholder="e.g., seekingalpha.com"
                onKeyDown={(e) => e.key === 'Enter' && addItem(favoriteWebsites, setFavoriteWebsites, newWebsite, setNewWebsite)}
              />
              <Button onClick={() => addItem(favoriteWebsites, setFavoriteWebsites, newWebsite, setNewWebsite)}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {favoriteWebsites.map(website => (
                <Badge key={website} variant="secondary" className="gap-1">
                  {website}
                  <X
                    className="w-3 h-3 cursor-pointer"
                    onClick={() => removeItem(favoriteWebsites, setFavoriteWebsites, website)}
                  />
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}