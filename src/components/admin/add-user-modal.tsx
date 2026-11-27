'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { User, Search } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { nationalityService } from '@/services/nationality/nationality.service';
import { userService } from '@/services/user/user.service';
import { formatDocument } from '@/lib/utils';
import { Nationality, NationalityResponse } from '@/types';

const createDocumentSchema = (documentRegex: string, t: (key: string) => string) => {
  return z.object({
    nationality: z.string().min(1, t('auth.nationalityRequired')),
    document: z.string()
      .min(1, t('auth.documentRequired'))
      .refine((value) => {
        return documentRegex ? new RegExp(documentRegex).test(value) : true;
      }, t('auth.invalidDocument')),
    name: z.string().min(2, t('admin.addUserModal.nameRequired')),
  });
};

type CreateUserForm = z.infer<ReturnType<typeof createDocumentSchema>>;

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserAdded: () => void;
}

function AddUserModal({ isOpen, onClose, onUserAdded }: AddUserModalProps) {
  const t = useTranslations();
  const [nationalities, setNationalities] = useState<Nationality[]>([]);
  const [selectedNationality, setSelectedNationality] = useState<Nationality | null>(null);
  const [isLoadingNationalities, setIsLoadingNationalities] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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
    reset,
  } = useForm<CreateUserForm>({
    resolver: zodResolver(schema),
  });

  const watchedDocument = watch('document');
  const watchedNationality = watch('nationality');

  // Filtrar nacionalidades baseado no termo de busca
  const filteredNationalities = nationalities.filter(nationality =>
    nationality.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Carregar nacionalidades
  useEffect(() => {
    const fetchNationalities = async () => {
      try {
        const response: NationalityResponse = await nationalityService.getNationalities();
        if (response.success && response.data) {
          setNationalities(response.data);
        }
      } catch {
        toast.error(t('admin.toast.loadNationalitiesError'));
      } finally {
        setIsLoadingNationalities(false);
      }
    };

    fetchNationalities();
  }, [t]);

  // Atualizar nacionalidade selecionada
  useEffect(() => {
    if (watchedNationality) {
      const nationality = nationalities.find(n => n.id === watchedNationality);
      setSelectedNationality(nationality || null);
      setValue('document', '');
    }
  }, [watchedNationality, nationalities, setValue]);

  // Formatar documento automaticamente
  useEffect(() => {
    if (selectedNationality && watchedDocument) {
      const formattedDocument = formatDocument(watchedDocument, selectedNationality.abbr);
      if (formattedDocument !== watchedDocument) {
        setValue('document', formattedDocument);
      }
    }
  }, [watchedDocument, selectedNationality, setValue]);

  const onSubmit = async (data: CreateUserForm) => {
    setIsLoading(true);

    try {
      const documentWithoutMask = data.document.replace(/\D+/g, '');
      const nationalityAbbr = selectedNationality?.abbr || '';

      const result = await userService.createUser({
        document: documentWithoutMask,
        nationalityId: nationalityAbbr,
        name: data.name,
      });

      if (result.success) {
        toast.success(t('admin.toast.userCreatedSuccess'));
        onUserAdded();
        handleClose();
      } else {
        // Tratar diferentes tipos de erro
        if (result.error?.includes('User already exists')) {
          toast.error(t('admin.toast.userAlreadyExists'));
        } else if (result.error?.includes('User not found in global platform')) {
          toast.error(t('admin.toast.userNotFoundInGlobalPlatform'));
        } else if (result.error?.includes('Failed to create')) {
          toast.error(t('admin.toast.createUserError'));
        } else {
          toast.error(result.error || t('admin.toast.createUserError'));
        }
      }
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast.error(t('admin.toast.createUserError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    reset();
    setSelectedNationality(null);
    setSearchTerm('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] backdrop-blur-xl border border-white/10 text-white">
        <DialogHeader>
          <DialogTitle className="text-white text-xl font-semibold">
            {t('admin.addUserModal.title')}
          </DialogTitle>
          <DialogDescription className="text-white/60">
            {t('admin.addUserModal.description')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
                          className="glass bg-white/5 backdrop-blur-sm border border-white/10 text-white placeholder:text-white/40 h-10 rounded-lg focus:border-emerald-400/50 focus:ring-2 focus:ring-emerald-400/20 transition-all duration-200 pl-10"
                        />
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40 w-4 h-4" />
                      </div>
                    </div>
                    {filteredNationalities.map((nationality) => (
                      <SelectItem
                        key={nationality.id}
                        value={nationality.id}
                        className="text-white hover:bg-white/10 focus:bg-white/10 cursor-pointer"
                      >
                        <div className="flex items-center gap-2 w-full">
                          <span className={`fi fi-${nationality.abbr.toLowerCase()} fis w-4 h-3 flex-shrink-0`}></span>
                          <span className="truncate flex-1">{truncateText(nationality.name)}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.nationality && (
                  <p className="text-red-400 text-xs mt-1">{errors.nationality.message}</p>
                )}
              </div>

              {/* Document Input */}
              <div className="w-1/2">
                <Input
                  {...register('document')}
                  type="text"
                  placeholder={t('auth.documentPlaceholder')}
                  className="glass bg-white/5 backdrop-blur-sm border border-white/10 text-white placeholder:text-white/40 h-12 rounded-xl focus:border-emerald-400/50 focus:ring-2 focus:ring-emerald-400/20 transition-all duration-200"
                  disabled={!selectedNationality}
                />
                {errors.document && (
                  <p className="text-red-400 text-xs mt-1">{errors.document.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Name Input */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-white/80 text-sm font-medium">
              {t('admin.addUserModal.name')}
            </Label>
            <Input
              {...register('name')}
              type="text"
              placeholder={t('admin.addUserModal.enterName')}
              className="glass bg-white/5 backdrop-blur-sm border border-white/10 text-white placeholder:text-white/40 h-12 rounded-xl focus:border-emerald-400/50 focus:ring-2 focus:ring-emerald-400/20 transition-all duration-200"
            />
            {errors.name && (
              <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="glass bg-white/5 backdrop-blur-sm border border-white/20 text-white hover:bg-white/10 hover:border-white/30 transition-all duration-200 px-6 py-2 rounded-xl"
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {t('admin.addUserModal.creating')}
                </>
              ) : (
                <>
                  <User className="w-4 h-4" />
                  {t('admin.addUserModal.create')}
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export { AddUserModal };
export default AddUserModal;