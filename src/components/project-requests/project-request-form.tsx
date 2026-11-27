'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { CheckCircle2, Lightbulb, Loader2, Send, UserRound } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/auth-context';
import { useAuthPermissions } from '@/contexts/permission-context';
import { projectRequestsService, ProjectRequestError } from '@/services/project-requests';
import { ChurchArea, PROJECT_REQUEST_LIMITS } from '@/types/project-requests';

type FieldErrors = Partial<Record<'area_id' | 'title' | 'description' | 'whatsapp', string>>;

const L = PROJECT_REQUEST_LIMITS;
const onlyDigits = (value: string) => value.replace(/\D/g, '');

/** Máscara simples: (11) 98765-4321 / +55 (11) 98765-4321 */
export const formatWhatsapp = (value: string): string => {
  const digits = onlyDigits(value).slice(0, L.whatsappMaxDigits);
  if (digits.length > 11) {
    const ddi = digits.slice(0, digits.length - 11);
    return `+${ddi} ${formatWhatsapp(digits.slice(-11))}`;
  }
  if (digits.length <= 2) return digits ? `(${digits}` : '';
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
};

/**
 * Formulário de solicitação de projeto para líderes / heads / pastores.
 *
 * Permissão necessária: SOLICITACAO_PROJETOS_CRIAR (a página usa RouteGuard).
 * Nome e e-mail vêm do cadastro do usuário logado (somente leitura).
 */
export const ProjectRequestForm = () => {
  const t = useTranslations('projectRequests');
  const { user: profile } = useAuth();
  const { user: authorizedUser } = useAuthPermissions();

  const requesterName = authorizedUser?.full_name || profile?.name || profile?.full_name || '';
  const requesterEmail = profile?.email || profile?.userEmail || authorizedUser?.email || '';

  const [areas, setAreas] = useState<ChurchArea[]>([]);
  const [loadingAreas, setLoadingAreas] = useState(true);
  const [areaId, setAreaId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [whatsapp, setWhatsapp] = useState(formatWhatsapp(profile?.phone || ''));
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submittedTitle, setSubmittedTitle] = useState<string | null>(null);

  useEffect(() => {
    projectRequestsService
      .getAreas()
      .then(setAreas)
      .catch((error: Error) => toast.error(error.message))
      .finally(() => setLoadingAreas(false));
  }, []);

  useEffect(() => {
    if (!whatsapp && profile?.phone) setWhatsapp(formatWhatsapp(profile.phone));
  }, [profile?.phone]); // eslint-disable-line react-hooks/exhaustive-deps

  const descriptionCount = useMemo(() => description.trim().length, [description]);

  const validate = (): FieldErrors => {
    const next: FieldErrors = {};
    if (!areaId) next.area_id = t('form.errors.area');
    if (title.trim().length < L.titleMin || title.trim().length > L.titleMax) {
      next.title = t('form.errors.title', { min: L.titleMin, max: L.titleMax });
    }
    if (descriptionCount < L.descriptionMin || descriptionCount > L.descriptionMax) {
      next.description = t('form.errors.description', { min: L.descriptionMin });
    }
    const digits = onlyDigits(whatsapp).length;
    if (digits < L.whatsappMinDigits || digits > L.whatsappMaxDigits) {
      next.whatsapp = t('form.errors.whatsapp');
    }
    return next;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSubmitting(true);
    try {
      await projectRequestsService.create({
        area_id: areaId,
        title: title.trim(),
        description: description.trim(),
        whatsapp: onlyDigits(whatsapp),
      });
      toast.success(t('form.success'));
      setSubmittedTitle(title.trim());
      setAreaId('');
      setTitle('');
      setDescription('');
    } catch (error) {
      if (error instanceof ProjectRequestError && error.fields) setErrors(error.fields as FieldErrors);
      toast.error(error instanceof Error ? error.message : t('form.error'));
    } finally {
      setSubmitting(false);
    }
  };

  if (submittedTitle) {
    return (
      <Card className="glass bg-white/5 backdrop-blur-xl border border-white/10">
        <CardContent className="p-10 text-center space-y-4">
          <CheckCircle2 className="w-14 h-14 text-[#008980] mx-auto" />
          <h2 className="text-white text-xl font-semibold">{t('form.sentTitle')}</h2>
          <p className="text-white/70 max-w-lg mx-auto">
            {t('form.sentDescription', { title: submittedTitle })}
          </p>
          <Button onClick={() => setSubmittedTitle(null)}>{t('form.newRequest')}</Button>
        </CardContent>
      </Card>
    );
  }

  const fieldClass = 'bg-white/10 border-white/20 text-white placeholder:text-white/40';

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6" noValidate>
      <div className="lg:col-span-2 space-y-6">
        {/* Dados do solicitante (puxados do cadastro) */}
        <Card className="glass bg-white/5 backdrop-blur-xl border border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2 text-lg">
              <UserRound className="w-5 h-5 text-blue-400" />
              {t('form.requesterSection')}
            </CardTitle>
            <CardDescription className="text-white/60">{t('form.requesterHint')}</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-white/80">{t('form.name')}</Label>
              <Input value={requesterName} disabled className={fieldClass} />
            </div>
            <div className="space-y-2">
              <Label className="text-white/80">{t('form.email')}</Label>
              <Input value={requesterEmail} disabled className={fieldClass} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="whatsapp" className="text-white/80">
                {t('form.whatsapp')} *
              </Label>
              <Input
                id="whatsapp"
                inputMode="tel"
                autoComplete="tel"
                placeholder="(11) 98765-4321"
                value={whatsapp}
                onChange={(e) => setWhatsapp(formatWhatsapp(e.target.value))}
                error={!!errors.whatsapp}
                className={fieldClass}
              />
              <p className={errors.whatsapp ? 'text-sm text-red-400' : 'text-xs text-white/50'}>
                {errors.whatsapp || t('form.whatsappHint')}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Solicitação */}
        <Card className="glass bg-white/5 backdrop-blur-xl border border-white/10">
          <CardHeader>
            <CardTitle className="text-white text-lg">{t('form.requestSection')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label className="text-white/80">{t('form.area')} *</Label>
              <Select value={areaId} onValueChange={setAreaId} disabled={loadingAreas}>
                <SelectTrigger className={fieldClass}>
                  <SelectValue placeholder={loadingAreas ? t('form.loadingAreas') : t('form.areaPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  {areas.map((area) => (
                    <SelectItem key={area.id} value={area.id}>
                      {area.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.area_id && <p className="text-sm text-red-400">{errors.area_id}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="title" className="text-white/80">
                {t('form.title')} *
              </Label>
              <Input
                id="title"
                maxLength={L.titleMax}
                placeholder={t('form.titlePlaceholder')}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                error={!!errors.title}
                className={fieldClass}
              />
              {errors.title && <p className="text-sm text-red-400">{errors.title}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-white/80">
                {t('form.description')} *
              </Label>
              <Textarea
                id="description"
                rows={12}
                maxLength={L.descriptionMax}
                placeholder={t('form.descriptionPlaceholder')}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className={`${fieldClass} min-h-[280px] leading-relaxed ${errors.description ? 'border-red-500' : ''}`}
              />
              <div className="flex justify-between text-xs">
                <span className={errors.description ? 'text-red-400' : 'text-white/50'}>
                  {errors.description || t('form.descriptionMinHint', { min: L.descriptionMin })}
                </span>
                <span className="text-white/50">
                  {descriptionCount}/{L.descriptionMax}
                </span>
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={submitting} className="min-w-40">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                {t('form.submit')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Orientações */}
      <Card className="glass bg-white/5 backdrop-blur-xl border border-white/10 h-fit lg:sticky lg:top-0">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2 text-lg">
            <Lightbulb className="w-5 h-5 text-yellow-400" />
            {t('form.guideTitle')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-white/70">
          <p>{t('form.guideIntro')}</p>
          <ol className="list-decimal pl-5 space-y-2">
            <li>{t('form.guideProblem')}</li>
            <li>{t('form.guideGoal')}</li>
            <li>{t('form.guidePeople')}</li>
            <li>{t('form.guideToday')}</li>
          </ol>
          <div className="rounded-lg border border-white/10 bg-white/5 p-3">
            <p className="text-white/80 font-medium mb-1">{t('form.exampleLabel')}</p>
            <p className="text-white/60 italic">{t('form.exampleTitle')}</p>
          </div>
        </CardContent>
      </Card>
    </form>
  );
};

export default ProjectRequestForm;
