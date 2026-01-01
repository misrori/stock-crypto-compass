import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface Profile {
  id: string;
  user_id: string;
  display_name: string | null;
  trading_frequency: string | null;
  trading_instruments: string[] | null;
  favorite_youtubers: string[] | null;
  favorite_websites: string[] | null;
  interested_stocks: string[] | null;
  interested_sectors: string[] | null;
  interested_technologies: string[] | null;
  created_at: string;
  updated_at: string;
}

export function useProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchProfile();
    } else {
      setProfile(null);
      setLoading(false);
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching profile:', error);
      toast.error('Failed to load profile');
    } else {
      setProfile(data);
    }
    setLoading(false);
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return { error: new Error('No user logged in') };

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
      return { error };
    }

    toast.success('Profile updated successfully');
    await fetchProfile();
    return { error: null };
  };

  return { profile, loading, updateProfile, refetch: fetchProfile };
}