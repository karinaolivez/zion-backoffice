import { useState, useEffect, useCallback } from 'react';
import { UserProfile } from '@/types';
import { storageService } from '@/lib/storage';
import { useAuth } from '@/contexts/auth-context';
import { ClientCookieManager } from '@/lib/cookies';

interface UseProfileReturn {
  profile: UserProfile | null;
  isLoading: boolean;
  error: string | null;
  refreshProfile: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => void;
  clearProfile: () => void;
}

export const useProfile = (): UseProfileReturn => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshProfile = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      // Get user data from cookies first
      const sessionData = ClientCookieManager.getSession();
      const cookieUser = sessionData.user;

      // Get user data from auth context
      const authUser = user;

      // Get user data from localStorage as fallback
      const storageUser = storageService.getUserProfile();

      // Combine data from all sources, prioritizing cookie data
      if (cookieUser || authUser || storageUser) {
        const updatedProfile: UserProfile = {
          id: cookieUser?.id || authUser?.id || storageUser?.id || '',
          name: cookieUser?.full_name || authUser?.name || storageUser?.name || cookieUser?.username || '',
          email: cookieUser?.email || authUser?.email || storageUser?.email || '',
          registrationDate: authUser?.registrationDate || storageUser?.registrationDate || new Date().toISOString(),
          status: authUser?.status || storageUser?.status || 'active',
          avatar: cookieUser?.avatar || authUser?.avatar || storageUser?.avatar,
          external_id: cookieUser?.external_id || authUser?.external_id || storageUser?.external_id,
          full_name: cookieUser?.full_name || authUser?.full_name || storageUser?.full_name,
        };

        // Update localStorage with the combined data
        storageService.setUserProfile(updatedProfile);

        // Update local state
        setProfile(updatedProfile);
      } else {
        setError('No user data available');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(`Error refreshing profile: ${errorMessage}`);
      console.error('Error refreshing profile:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    // Always refresh profile when user data changes or when component mounts
    refreshProfile();
  }, [user, refreshProfile]);

  const updateProfile = useCallback((updates: Partial<UserProfile>): void => {
    if (!profile) return;

    const updatedProfile = { ...profile, ...updates };

    // Update localStorage
    storageService.setUserProfile(updatedProfile);

    // Update local state
    setProfile(updatedProfile);
  }, [profile]);

  const clearProfile = useCallback((): void => {
    storageService.clearUserData();
    setProfile(null);
    setError(null);
  }, []);

  return {
    profile,
    isLoading,
    error,
    refreshProfile,
    updateProfile,
    clearProfile,
  };
};