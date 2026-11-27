'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, ArrowLeft, Mail } from 'lucide-react';
import { toast } from 'sonner';

interface LoginStepTwoProps {
  email: string;
  onVerify: (otp: string) => void;
  onResendOtp: () => void;
  onBack: () => void;
  isLoading?: boolean;
  isResending?: boolean;
}

export const LoginStepTwo: React.FC<LoginStepTwoProps> = ({
  email,
  onVerify,
  onResendOtp,
  onBack,
  isLoading = false,
  isResending = false,
}) => {
  const t = useTranslations();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return;
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all fields are filled
    if (newOtp.every(digit => digit !== '') && newOtp.join('').length === 6) {
      onVerify(newOtp.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '');

    if (pastedData.length === 6) {
      const newOtp = pastedData.split('');
      setOtp(newOtp);
      inputRefs.current[5]?.focus();
      onVerify(pastedData);
    }
  };

  const handleResend = () => {
    if (!canResend || isResending) return;

    setCountdown(60);
    setCanResend(false);
    setOtp(['', '', '', '', '', '']);
    inputRefs.current[0]?.focus();
    onResendOtp();
  };

  const handleManualSubmit = () => {
    const otpValue = otp.join('');
    if (otpValue.length === 6) {
      onVerify(otpValue);
    } else {
      toast.error(t('auth.enterCompleteOtp'));
    }
  };

  const maskEmail = (email: string) => {
    const [localPart, domain] = email.split('@');
    if (localPart.length <= 2) return email;

    const maskedLocal = localPart[0] + '*'.repeat(localPart.length - 2) + localPart[localPart.length - 1];
    return `${maskedLocal}@${domain}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center mb-4">
          <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center">
            <Mail className="w-8 h-8 text-emerald-400" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">
          {t('auth.verifyYourEmail')}
        </h1>
        <p className="text-white/60 text-sm">
          {t('auth.otpSentTo')} <span className="text-white font-medium">{maskEmail(email)}</span>
        </p>
      </div>

      {/* OTP Input */}
      <div className="space-y-4">
        <Label className="text-white/80 text-sm font-medium mb-0.5">
          {t('auth.verificationCode')}
        </Label>

        <div className="flex gap-3 justify-center mt-4">
          {otp.map((digit, index) => (
            <Input
              key={index}
              ref={(el) => { inputRefs.current[index] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleOtpChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={handlePaste}
              className="w-12 h-12 text-center text-lg font-bold glass bg-white/5 backdrop-blur-sm border border-white/10 text-white rounded-xl focus:border-emerald-400/50 focus:ring-2 focus:ring-emerald-400/20 transition-all duration-200"
              disabled={isLoading}
            />
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-4">
        <Button
          onClick={handleManualSubmit}
          className="w-full h-12 shadow-lg"
          disabled={isLoading || otp.some(digit => digit === '')}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {t('auth.verifying')}
            </>
          ) : (
            t('auth.accessAccount')
          )}
        </Button>

        {/* Resend Button */}
        <div className="text-center">
          {canResend ? (
            <Button
              variant="ghost"
              onClick={handleResend}
              disabled={isResending}
              className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-400/10"
            >
              {isResending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t('auth.resending')}
                </>
              ) : (
                t('auth.resendCode')
              )}
            </Button>
          ) : (
            <p className="text-white/60 text-sm">
              {t('auth.resendIn')} {countdown}s
            </p>
          )}
        </div>

        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={onBack}
          disabled={isLoading}
          className="w-full text-white/60 hover:text-white hover:bg-white/5"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t('common.back')}
        </Button>
      </div>
    </div>
  );
};