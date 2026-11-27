'use client';

import { useState, useEffect } from 'react';
import { Search, MapPin, Users, Calendar, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Campus, CampusResponse, CampusPaginatedResponse } from '@/types';
import { campusService } from '@/services/campus/campus.service';
import { CampusSkeleton } from './campus-skeleton';
import { useDebounce } from '@/hooks/use-debounce';
import { useTranslations } from 'next-intl';

interface CampusListProps {
  className?: string;
}

export const CampusList = ({ className }: CampusListProps) => {
  const t = useTranslations();
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Implementa debounce para otimizar as buscas
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const fetchCampuses = async (search?: string, page: number = 1) => {
    try {
      setLoading(true);

      const result = await campusService.getCampusPaginated({
        search,
        page,
        limit: 10
      });

      if (result.success && result.data) {
        const paginatedData = result.data as CampusPaginatedResponse;
        setCampuses(paginatedData.campuses);
        setTotalPages(paginatedData.pageInfo.totalPages);
        setTotalCount(paginatedData.pageInfo.totalCount);
        setCurrentPage(paginatedData.pageInfo.currentPage);
      } else {
        setCampuses([]);
        setTotalPages(1);
        setTotalCount(0);
      }
    } catch (error) {
      console.error('Erro ao buscar campus:', error);
      toast.error(t('campus.errorLoadingCampuses'));
      setCampuses([]);
      setTotalPages(1);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampuses(debouncedSearchTerm, 1);
    setCurrentPage(1);
  }, [debouncedSearchTerm]);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    // Não precisa mais chamar fetchCampuses aqui, o useEffect com debounce fará isso
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchCampuses(debouncedSearchTerm, page);
  };

  const formatDate = (dateString: string) => {
    // Formatação consistente para evitar problemas de hidratação
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  return (
    <div className={className}>
      {/* Header com busca - Design padronizado */}
      <div className="glass bg-white/5 backdrop-blur-xl border border-white/10 rounded-lg p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40 w-4 h-4" />
            <Input
              placeholder={t('campus.searchCampus')}
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-white/40 focus:ring-white/20"
            />
          </div>
          <div className="flex items-center text-white/60 text-sm whitespace-nowrap">
            {totalCount > 0 ? (
              <span>{t('campus.campusFound', { count: totalCount })}</span>
            ) : (
              <span>{t('campus.noCampusFound')}</span>
            )}
          </div>
        </div>
      </div>

      {/* Lista de Campus com Skeleton Loading */}
      {loading ? (
        <CampusSkeleton count={5} />
      ) : campuses.length > 0 ? (
        <div className="space-y-4">
          {campuses.map((campus) => (
            <Card key={campus.id} className="glass bg-white/5 backdrop-blur-xl border border-white/10 hover:bg-white/10 transition-all duration-200">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-lg flex items-center justify-center">
                        <MapPin className="w-5 h-5 text-blue-400" />
                      </div>
                      <div>
                        <h3 className="text-white font-semibold text-lg">{campus.name}</h3>
                        <p className="text-white/60 text-sm">{campus.communityGroupName}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 mt-4">
                      <div className="flex items-center gap-2 text-white/60 text-sm">
                        <Calendar className="w-4 h-4" />
                        <span>{t('campus.createdOn', { date: formatDate(campus.createdAt || '') })}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-green-500/30">
                      {t('campus.active')}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="glass bg-white/5 backdrop-blur-xl border border-white/10">
          <CardContent className="p-12 text-center">
            <MapPin className="w-12 h-12 text-white/40 mx-auto mb-4" />
            <h3 className="text-white font-semibold mb-2">{t('campus.noCampusFound')}</h3>
            <p className="text-white/60">
              {searchTerm
                ? t('campus.noResultsForTerm', { term: searchTerm })
                : t('campus.noCampusRegistered')
              }
            </p>
          </CardContent>
        </Card>
      )}

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <p className="text-white/60 text-sm">
            {t('campus.pageInfo', {
              currentPage,
              totalPages,
              totalCount
            })}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              className="border-white/10 text-white/60 hover:bg-white/10 disabled:opacity-50"
            >
              <ChevronLeft className="w-4 h-4" />
              {t('common.previous')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="border-white/10 text-white/60 hover:bg-white/10 disabled:opacity-50"
            >
              {t('common.next')}
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};