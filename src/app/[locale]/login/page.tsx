'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import Image from 'next/image';
import { LanguageSelector } from '@/components/ui/language-selector';

import { LoginStepOne } from '@/components/auth/login-step-one';
import { LoginStepTwo } from '@/components/auth/login-step-two';
import { authNewService } from '@/services/auth/auth-new.service';
import { Nationality } from '@/types';
import { useAuth } from '@/contexts/auth-context';

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || 'Zion App Name';

type LoginStep = 'document' | 'otp';

interface UserData {
  id: string;
  username: string;
  email: string;
  unmaskedEmail: string;
  phone: string;
  unmaskedPhone: string;
}

export default function LoginPage() {
  const t = useTranslations();
  const router = useRouter();
  const { login } = useAuth();

  const [currentStep, setCurrentStep] = useState<LoginStep>('document');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);

  // Form data
  const [userData, setUserData] = useState<UserData | null>(null);
  const [documentData, setDocumentData] = useState<{
    nationality: string;
    document: string;
    nationalityData: Nationality;
  } | null>(null);

  const handleStepOneNext = async (data: {
    nationality: string;
    document: string;
    nationalityData: Nationality;
  }) => {
    setIsLoading(true);

    try {
      // 1. Check if user exists in Zion system
      const checkUserResponse = await authNewService.checkUser(
        `${data.nationalityData.abbr}:${data.document.replaceAll('-', '').replaceAll('.', '')}`
      );

      if (!checkUserResponse.success || !checkUserResponse.user) {
        toast.error(t('auth.userNotFound'));
        return;
      }

      // 3. Send OTP to user's email
      if (!checkUserResponse.user.unmaskedEmail) {
        toast.error(t('auth.missingEmail'));
        return;
      }
      await authNewService.sendOtp(checkUserResponse.user.unmaskedEmail);

      // Store user data and move to OTP step
      setUserData({
        id: checkUserResponse.user.id,
        username: checkUserResponse.user.username || '',
        email: checkUserResponse.user.email || '',
        unmaskedEmail: checkUserResponse.user.unmaskedEmail || '',
        phone: checkUserResponse.user.phone || '',
        unmaskedPhone: checkUserResponse.user.unmaskedPhone || '',
      });

      setDocumentData(data);
      setCurrentStep('otp');

      toast.success(t('auth.otpSent'));

    } catch (error: any) {
      console.error('Login step one error:', error);

      // Check if it's a sendOtp error with our custom message
      if (error.message === 'Usuário não existe ou não tem acesso à plataforma') {
        toast.error(error.message);
      } else if (error.response?.status === 404) {
        toast.error(t('auth.userNotFound'));
      } else if (error.response?.status === 403) {
        toast.error(error.response.data?.message || t('auth.userNotAuthorized'));
      } else {
        toast.error(error.message || t('auth.loginError'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpVerify = async (otp: string) => {
    if (!userData) return;

    setIsLoading(true);

    try {
      const verifyResponse = await authNewService.verifyOtp(
        userData.unmaskedEmail,
        otp
      );

      if (verifyResponse.success && verifyResponse.session) {
        console.log('🎉 OTP verificado com sucesso, obtendo dados do usuário autorizado...');

        // Get authorized user data from Supabase
        let authorizedUser = null;
        try {
          const { PermissionsService } = await import('@/services/permissions.service');
          authorizedUser = await PermissionsService.getAuthorizedUser(verifyResponse.user?.id || userData.id);
        } catch (error) {
          console.warn('Erro ao buscar dados do usuário autorizado:', error);
        }

        // Create UserProfile from available data, including external_id, full_name, and avatar
        const userProfile = {
          id: verifyResponse.user?.id || userData.id,
          name: verifyResponse.user?.name || authorizedUser?.full_name || userData.username || '',
          email: verifyResponse.user?.email || userData.email,
          document: verifyResponse.user?.document || '',
          nationality: '',
          registrationDate: new Date().toISOString(),
          status: 'active' as const,
          external_id: authorizedUser?.external_id || verifyResponse.user?.id || userData.id,
          full_name: authorizedUser?.full_name || verifyResponse.user?.name || userData.username || '',
          avatar: authorizedUser?.avatar || verifyResponse.user?.avatar || undefined
        };

        console.log('📋 Dados do usuário para AuthContext:', userProfile);

        // Update AuthContext with user data
        await login(verifyResponse.session.access_token, userProfile);

        console.log('✅ AuthContext atualizado, redirecionando...');

        toast.success(t('auth.loginSuccess'));

        // Redirect to dashboard after successful login
        router.push('/dashboard');
      } else {
        toast.error(verifyResponse.message || t('auth.invalidOtp'));
      }

    } catch (error: any) {
      console.error('OTP verification error:', error);

      if (error.response?.status === 400) {
        toast.error(t('auth.invalidOrExpiredOtp'));
      } else {
        toast.error(t('auth.otpVerificationError'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!userData) return;

    setIsResending(true);

    try {
      if (!userData.unmaskedEmail) {
        toast.error(t('auth.missingEmail'));
        return;
      }
      await authNewService.sendOtp(userData.unmaskedEmail);
      toast.success(t('auth.otpResent'));
    } catch (error: any) {
      console.error('Resend OTP error:', error);

      // Check if it's a sendOtp error with our custom message
      if (error.message === 'Usuário não existe ou não tem acesso à plataforma') {
        toast.error(error.message);
      } else {
        toast.error(error.message || t('auth.resendOtpError'));
      }
    } finally {
      setIsResending(false);
    }
  };

  const handleBackToDocument = () => {
    setCurrentStep('document');
    setUserData(null);
    setDocumentData(null);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">

      {/* Logo */}
      <div className="absolute top-0 z-20 flex h-auto w-full justify-between bg-transparent pt-10 md:px-12 mb-0">
        <div>
          <div className="flex items-start space-y-3">
            <div className="w-15 h-15 flex items-start justify-center mr-3">
              <img
                alt="logo"
                loading="lazy"
                width="54"
                height="54"
                decoding="async"
                data-nimg="1"
                style={{ color: 'transparent' }}
                src="https://zionglobal.app/img/logo.svg"
              />
            </div>
            <div>
              <h1 className="text-white font-bold text-xl">{APP_NAME}</h1>
              <span className="text-xs text-white/60 bg-white/10 px-2 py-0.5 rounded-full backdrop-blur-sm">
                v2.0
              </span>
            </div>
          </div>
        </div>
      </div>
      <div className="w-full max-w-md">

        {/* Language Selector */}
        <div className="flex justify-end mb-8">
          <LanguageSelector />
        </div>

        {/* Login Form Container */}
        <div className="glass bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10 shadow-2xl">
          {currentStep === 'document' && (
            <LoginStepOne
              onNext={handleStepOneNext}
              isLoading={isLoading}
            />
          )}

          {currentStep === 'otp' && userData && (
            <LoginStepTwo
              email={userData.unmaskedEmail}
              onVerify={handleOtpVerify}
              onResendOtp={handleResendOtp}
              onBack={handleBackToDocument}
              isLoading={isLoading}
              isResending={isResending}
            />
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-white/40 text-sm">
            © 2026 Zion Global Platform -  {t('common.allRightsReserved')}
          </p>
        </div>
      </div>
    </div>
  );
}