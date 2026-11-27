export const pageTemplate = (featureName, pascalName, camelName, titleName) => `'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Plus, Search, Edit, Trash2, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { PermissionGuard } from '@/components/auth/PermissionGuard';
import { LoadingSpinner } from '@/components/loading-spinner';
import { ${camelName}Service, ${pascalName}Data } from '@/services/${featureName}';

export default function ${pascalName}Page() {
  const t = useTranslations('${featureName}');
  const { toast } = useToast();
  
  const [data, setData] = useState<${pascalName}Data[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Carregar dados
  const loadData = async () => {
    try {
      setLoading(true);
      const result = await ${camelName}Service.getAll();
      setData(result);
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao carregar dados',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtrar dados
  const filteredData = data.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handlers
  const handleCreate = () => {
    // TODO: Implementar modal/formulário de criação
    toast({
      title: 'Em desenvolvimento',
      description: 'Funcionalidade de criação será implementada em breve',
    });
  };

  const handleEdit = (item: ${pascalName}Data) => {
    // TODO: Implementar modal/formulário de edição
    toast({
      title: 'Em desenvolvimento',
      description: 'Funcionalidade de edição será implementada em breve',
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir?')) return;
    
    try {
      await ${camelName}Service.delete(id);
      toast({
        title: 'Sucesso',
        description: 'Registro excluído com sucesso',
      });
      loadData();
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao excluir registro',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Package className="h-8 w-8" />
            {t('title')}
          </h1>
          <p className="text-muted-foreground mt-1">{t('description')}</p>
        </div>
        
        <PermissionGuard 
          module="${featureName}" 
          action="create"
        >
          <Button onClick={handleCreate} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            {t('create')}
          </Button>
        </PermissionGuard>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            {t('filters')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder={t('search_placeholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de dados */}
      <div className="grid gap-4">
        {filteredData.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Package className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-lg">{t('no_data')}</p>
              <p className="text-sm text-muted-foreground mt-2">
                {searchTerm ? 'Tente ajustar os filtros de busca' : 'Comece criando um novo registro'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredData.map((item) => (
            <Card key={item.id} className="hover:shadow-md transition-shadow">
              <CardContent className="flex items-center justify-between p-6">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{item.name}</h3>
                  {item.description && (
                    <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                  )}
                  <div className="flex gap-2 mt-3">
                    <Badge variant="secondary">
                      {new Date(item.created_at!).toLocaleDateString('pt-BR')}
                    </Badge>
                    <Badge variant="outline">
                      ID: {item.id}
                    </Badge>
                  </div>
                </div>
                
                <div className="flex gap-2 ml-4">
                  <PermissionGuard 
                    module="${featureName}" 
                    action="edit"
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(item)}
                      className="flex items-center gap-1"
                    >
                      <Edit className="h-4 w-4" />
                      <span className="hidden sm:inline">Editar</span>
                    </Button>
                  </PermissionGuard>
                  
                  <PermissionGuard 
                    module="${featureName}" 
                    action="delete"
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(item.id!)}
                      className="flex items-center gap-1 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="hidden sm:inline">Excluir</span>
                    </Button>
                  </PermissionGuard>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Estatísticas */}
      {filteredData.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between items-center text-sm text-muted-foreground">
              <span>
                Mostrando {filteredData.length} de {data.length} registros
              </span>
              {searchTerm && (
                <span>
                  Filtrado por: "{searchTerm}"
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}`;