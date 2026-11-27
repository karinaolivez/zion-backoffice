import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Users,
  Calendar,
  FileText,
  TrendingUp,
  Activity,
  CheckCircle,
} from "lucide-react";
import { useTranslations } from 'next-intl';
import { PageHeader } from "@/components/ui/page-header";

export default function DashboardPage() {
  const t = useTranslations();
  const settingsCategories = [
    {
      id: 'profile',
      title: t('profile.profile'),
      description: t('profile.managePersonalInfo'),
      icon: Users,
      color: 'text-blue-400'
    },
    {
      id: 'notifications',
      title: t('profile.notifications'),
      description: t('profile.configureNotificationPreferences'),
      icon: Calendar,
      color: 'text-emerald-400'
    },
    {
      id: 'security',
      title: t('profile.security'),
      description: t('profile.securityAndPrivacySettings'),
      icon: FileText,
      color: 'text-red-400'
    },
    {
      id: 'system',
      title: t('profile.system'),
      description: t('profile.generalSystemSettings'),
      icon: TrendingUp,
      color: 'text-purple-400'
    },
    {
      id: 'appearance',
      title: t('profile.appearance'),
      description: t('profile.customizeSystemInterface'),
      icon: Activity,
      color: 'text-pink-400'
    },
    {
      id: 'localization',
      title: t('profile.localization'),
      description: t('profile.languageAndRegionalSettings'),
      icon: CheckCircle,
      color: 'text-yellow-400'
    }
  ];

  return (
    <>
      <PageHeader
        title={t('home.title')}
        description={t('home.subtitle')}
      />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {settingsCategories.map((category) => (
          <Card key={category.id} className="glass bg-white/5 backdrop-blur-xl border border-white/10 hover:bg-white/10 transition-all duration-200 cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className={`w-12 h-12 bg-gradient-to-br from-${category.color}-500/20 to-${category.color}-600/20 rounded-xl flex items-center justify-center`}>
                  <category.icon className={`w-6 h-6 text-${category.color}-400`} />
                </div>
                <div>
                  <h3 className="text-white font-semibold">{category.title}</h3>
                  <p className="text-white/60 text-sm">{category.description}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}