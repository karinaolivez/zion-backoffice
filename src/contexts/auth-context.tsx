"use client"

import React, { createContext, useContext, useEffect, useState } from 'react';
import { UserProfile, ProfileResponse } from '@/types';
import { profileService } from '@/services/profile/profile.service';
import { storageService } from '@/lib/storage';
import { authNewService } from '@/services/auth/auth-new.service';

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, userData: UserProfile) => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
  validateSession: () => Promise<boolean>;
  registerPermissionsClearCallback: (callback: () => void) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [permissionsClearCallback, setPermissionsClearCallback] = useState<(() => void) | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const initializeAuth = async () => {
      try {
        console.log('🔄 AuthContext: Inicializando autenticação...');
        
        // First check if we have immediate session data available
        const sessionData = authNewService.getCurrentUser();
        const isSessionValid = authNewService.isAuthenticated();
        
        console.log('🔍 AuthContext: Dados de sessão:', { sessionData, isSessionValid });
        
        if (isSessionValid && sessionData) {
          console.log('✅ AuthContext: Sessão válida encontrada, configurando usuário imediatamente');
          
          // We have valid session data, set user immediately to avoid loading state
          let userData = storageService.getUserProfile();
          
          if (!userData) {
            // Convert session user data to UserProfile format
            userData = {
              id: sessionData.id,
              name: sessionData.username || '',
              email: sessionData.email,
              document: '',
              nationality: '',
              registrationDate: new Date().toISOString(),
              status: 'active'
            };
            // Store in storageService for future use
            storageService.setUserProfile(userData);
          }
          
          setUser(userData);
          setIsLoading(false); // Set loading to false immediately
          
          console.log('🎉 AuthContext: Usuário configurado, loading = false');
          
          // Refresh profile data in background without blocking UI
          fetchUserProfile().catch(error => {
            console.error('Error refreshing profile:', error);
          });
        } else {
          console.log('⚠️ AuthContext: Sem dados de sessão imediatos, validando sessão...');
          
          // No immediate session data, validate session
          const isValid = await authNewService.ensureValidSession();
          
          console.log('🔍 AuthContext: Resultado da validação:', isValid);
          
          if (isValid) {
            // After validation, get user data
            let userData = storageService.getUserProfile();
            
            if (!userData) {
              const refreshedSessionData = authNewService.getCurrentUser();
              if (refreshedSessionData) {
                userData = {
                  id: refreshedSessionData.id,
                  name: refreshedSessionData.username || '',
                  email: refreshedSessionData.email,
                  document: '',
                  nationality: '',
                  registrationDate: new Date().toISOString(),
                  status: 'active'
                };
                storageService.setUserProfile(userData);
              }
            }
            
            if (userData) {
              setUser(userData);
              console.log('✅ AuthContext: Usuário configurado após validação');
              // Try to refresh profile data
              await fetchUserProfile();
            }
          } else {
            console.log('❌ AuthContext: Sessão inválida, limpando dados');
            // Clear invalid session data
            storageService.clearUserData();
            setUser(null);
          }
          
          setIsLoading(false);
          console.log('🏁 AuthContext: Inicialização concluída, loading = false');
        }
      } catch (error) {
        console.error('❌ AuthContext: Erro na inicialização:', error);
        storageService.clearUserData();
        setUser(null);
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, [mounted]);

  const fetchUserProfile = async (): Promise<UserProfile | null> => {
    try {
      const response: ProfileResponse = await profileService.getCurrentUserProfile();
      if (response.success && response.data) {
        const userProfile: UserProfile = {
          id: response.data.id,
          name: response.data.name,
          email: response.data.email,
          document: response.data.document || '',
          nationality: response.data.nationality || '',
          phone: typeof response.data.phone === 'string' ? response.data.phone : undefined,
          address: typeof response.data.address === 'string' ? response.data.address : undefined,
          birthDate: typeof response.data.birthDate === 'string' ? response.data.birthDate : undefined,
          registrationDate: response.data.registrationDate || new Date().toISOString(),
          status: typeof response.data.status === 'string' ? response.data.status : 'active',
          avatar: typeof response.data.avatar === 'string' ? response.data.avatar : undefined,
        };

        storageService.setUserProfile(userProfile);
        storageService.setUserId(response.data.id);
        setUser(userProfile);
        return userProfile;
      }
      return null;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  };

  const validateSession = async (): Promise<boolean> => {
    try {
      const isValid = await authNewService.ensureValidSession();
      if (!isValid) {
        storageService.clearUserData();
        setUser(null);
      }
      return isValid;
    } catch (error) {
      console.error('Error validating session:', error);
      storageService.clearUserData();
      setUser(null);
      return false;
    }
  };

  const login = async (token: string, userData: UserProfile): Promise<void> => {
    try {
      setIsLoading(true);
      
      // Store user data
      setUser(userData);
      storageService.setUserProfile(userData);
      
      // Immediately set loading to false since we have the user data
      setIsLoading(false);
      
      // Refresh profile data in background
      await fetchUserProfile();
    } catch (error) {
      console.error('Error during login:', error);
      setIsLoading(false);
    }
  };

  const refreshProfile = async (): Promise<void> => {
    try {
      const updatedProfile = await fetchUserProfile();
      if (updatedProfile) {
        // fetchUserProfile already saves to storage, just update state
        setUser(updatedProfile);
      }
    } catch (error) {
      console.error('Error refreshing profile:', error);
    }
  };

  const logout = () => {
    // Limpar permissões primeiro se o callback estiver registrado
    if (permissionsClearCallback) {
      permissionsClearCallback();
    }
    
    authNewService.clearSession();
    storageService.clearUserData();
    setUser(null);
  };

  const registerPermissionsClearCallback = (callback: () => void) => {
    setPermissionsClearCallback(() => callback);
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    refreshProfile,
    validateSession,
    registerPermissionsClearCallback,
  };

  return (
    <div suppressHydrationWarning>
      <AuthContext.Provider value={value}>
        {children}
      </AuthContext.Provider>
    </div>
  );
};