'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, Loader2, Search, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { nationalityService } from '@/services/nationality/nationality.service';
import { formatDocument, validateDocument } from '@/lib/utils';
import { Nationality, NationalityResponse } from '@/types';

const createDocumentSchema = (documentRegex: string, t: (key: string) => string) => {
  return z.object({
    nationality: z.string().min(1, t('errors.required')),
    document: z.string()
      .min(1, t('errors.required'))
      .refine((val) => validateDocument(val, documentRegex), {
        message: t('errors.invalidDocument'),
      }),
  });
};

interface LoginStepOneProps {
  onNext: (data: { nationality: string; document: string; nationalityData: Nationality }) => void;
  isLoading?: boolean;
}

export const LoginStepOne: React.FC<LoginStepOneProps> = ({ onNext, isLoading = false }) => {
  const t = useTranslations();
  const [nationalities, setNationalities] = useState<Nationality[]>([]);
  const [selectedNationality, setSelectedNationality] = useState<Nationality | null>(null);
  const [isLoadingNationalities, setIsLoadingNationalities] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Função para truncar texto com base no espaço disponível
  const truncateText = (text: string, maxLength: number = 25): string => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const schema = createDocumentSchema(
    selectedNationality?.documentRegex || '',
    t
  );

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
  });

  const watchedDocument = watch('document');
  const watchedNationality = watch('nationality');

  // Filtrar nacionalidades baseado no termo de busca
  const filteredNationalities = nationalities.filter(nationality =>
    nationality.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    const fetchNationalities = async () => {
      try {
        const response: NationalityResponse = await nationalityService.getNationalities();
        if (response.success && response.data) {
          setNationalities(response.data);
          // Não selecionar automaticamente nenhum item - deixar vazio
        }
      } catch {
        toast.error(t('errors.failedToLoadNationalities'));
      } finally {
        setIsLoadingNationalities(false);
      }
    };

    fetchNationalities();
  }, [t]);

  useEffect(() => {
    if (watchedNationality) {
      const nationality = nationalities.find(n => n.id === watchedNationality);
      setSelectedNationality(nationality || null);
      setValue('document', '');
    }
  }, [watchedNationality, nationalities, setValue]);

  useEffect(() => {
    if (selectedNationality && watchedDocument) {
      const formattedDocument = formatDocument(watchedDocument, selectedNationality.abbr);
      if (formattedDocument !== watchedDocument) {
        setValue('document', formattedDocument);
      }
    }
  }, [watchedDocument, selectedNationality, setValue]);

  const handleNext = (data: z.infer<typeof schema>) => {
    if (!selectedNationality) return;

    onNext({
      nationality: data.nationality,
      document: data.document,
      nationalityData: selectedNationality
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">
          {t('auth.accessYourAccount')}
        </h1>
        <p className="text-white/60 text-sm text-center">
          {t('auth.noAccount')}
          <a href="https://www.zionglobal.app/sign-up" target="_blank" className="text-emerald-400 hover:text-emerald-300 cursor-pointer underline pl-2">
            {t('auth.signUp')}
          </a>
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(handleNext)} className="space-y-6">
        {/* Document Input - Combined Nationality and Document */}
        <div className="space-y-2">
          <Label htmlFor="document" className="text-white/80 text-sm font-medium">
            {t('auth.document')}
          </Label>
          <div className="flex gap-2">
            {/* Nationality Select */}
            <div className="w-1/2">
              <Select
                value={watchedNationality}
                onValueChange={(value) => {
                  setValue('nationality', value);
                  const nationality = nationalities.find(n => n.id === value);
                  if (nationality) {
                    setSelectedNationality(nationality);
                  }
                }}
                disabled={isLoadingNationalities}
              >
                <SelectTrigger className="glass bg-white/5 backdrop-blur-sm border border-white/10 text-white h-12 rounded-xl focus:border-emerald-400/50 focus:ring-2 focus:ring-emerald-400/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed">
                  <SelectValue
                    placeholder={
                      isLoadingNationalities
                        ? "..."
                        : selectedNationality
                          ? (
                            <div className="flex items-center gap-2 w-full overflow-hidden">
                              <span className={`fi fi-${selectedNationality.abbr.toLowerCase()} fis w-4 h-3 flex-shrink-0`}></span>
                              <span className="truncate text-left flex-1 min-w-0">{selectedNationality.name}</span>
                            </div>
                          )
                          : t('auth.selectNationality')
                    }
                  />
                </SelectTrigger>
                <SelectContent className="glass bg-slate-800/90 backdrop-blur-xl border border-white/10">
                  {/* Input de busca dentro do dropdown */}
                  <div className="p-2 border-b border-white/10">
                    <div className="relative">
                      <Input
                        type="text"
                        placeholder={t('auth.searchNationality')}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="glass bg-white/5 backdrop-blur-sm border border-white/10 text-white placeholder:text-white/40 h-8 rounded-lg px-3 pr-8 focus:border-emerald-400/50 focus:ring-1 focus:ring-emerald-400/20 transition-all duration-200"
                      />
                      <Search className="absolute right-2 top-1/2 transform -translate-y-1/2 text-white/40 w-3 h-3" />
                    </div>
                  </div>
                  {filteredNationalities.map((nationality) => (
                    <SelectItem key={nationality.id} value={nationality.id} className="text-white hover:bg-white/10">
                      <div className="flex items-center gap-3">
                        <span className={`fi fi-${nationality.abbr.toLowerCase()} fis w-5 h-5`}></span>
                        <span className="text-sm">{nationality.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.nationality && (
                <p className="text-sm text-red-400 mt-1">
                  {errors.nationality.message}
                </p>
              )}
            </div>

            {/* Document Input */}
            <div className="w-full">
              <div className="relative">
                <Input
                  id="document"
                  type="text"
                  placeholder={
                    selectedNationality?.documentMask || t('auth.documentPlaceholder')
                  }
                  disabled={!selectedNationality}
                  {...register('document')}
                  className="glass bg-white/5 backdrop-blur-sm border border-white/10 text-white placeholder:text-white/40 h-12 rounded-xl px-4 focus:border-emerald-400/50 focus:ring-2 focus:ring-emerald-400/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <User className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              </div>
              {errors.document && (
                <p className="text-sm text-red-400 mt-1">
                  {errors.document.message}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          className="w-full h-12 shadow-lg"
          disabled={isLoading || isLoadingNationalities}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {t('common.loading')}
            </>
          ) : (
            t('auth.next')
          )}
        </Button>
      </form>
    </div>
  );
};