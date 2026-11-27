'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { X, User, Mail, FileText, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

import { UserProfile } from '@/types';
import { AccessRequestData } from '@/types/permissions';

interface AccessRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  userData: UserProfile;
  onRequestAccess: (data: AccessRequestData) => Promise<void>;
}

export const AccessRequestModal: React.FC<AccessRequestModalProps> = ({
  isOpen,
  onClose,
  userData,
  onRequestAccess,
}) => {
  const t = useTranslations();
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleRequestAccess = async () => {
    setIsLoading(true);
    try {
      const requestData: AccessRequestData = {
        external_id: userData.id,
        username: userData.username || userData.email || '',
        full_name: userData.name ?? '',
        // email removed - not part of AccessRequestData
        document_type: 'br', // Assumindo CPF como padrão
        document_value: userData.document,
        avatar: userData.avatar || undefined,
      };

      await onRequestAccess(requestData);
      toast.success('Solicitação de acesso enviada com sucesso!');
      onClose();
    } catch (error) {
      console.error('Erro ao solicitar acesso:', error);
      toast.error('Erro ao enviar solicitação de acesso. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <Card className="w-full max-w-md mx-4 shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
        <CardHeader className="relative pb-4">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 p-1 rounded-full hover:bg-gray-100 transition-colors"
            disabled={isLoading}
          >
            <X className="h-4 w-4 text-gray-500" />
          </button>

          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-full">
              <User className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <CardTitle className="text-xl text-gray-900">
                Acesso Negado
              </CardTitle>
              <CardDescription className="text-gray-600">
                Você não possui permissão para acessar
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* User Information */}
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Informações do Usuário
            </h4>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Nome:</span>
                <span className="font-medium text-gray-900">{userData.name}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-600">Email:</span>
                <span className="font-medium text-gray-900">{userData.email}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-600">Documento:</span>
                <span className="font-medium text-gray-900">{userData.document}</span>
              </div>

              {userData.username && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Username:</span>
                  <span className="font-medium text-gray-900">{userData.username}</span>
                </div>
              )}
            </div>
          </div>

          {/* Status Badge */}
          <div className="flex justify-center">
            <Badge variant="destructive" className="px-3 py-1">
              <Mail className="h-3 w-3 mr-1" />
              Aguardando Aprovação
            </Badge>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isLoading}
            >
              Cancelar
            </Button>

            <Button
              onClick={handleRequestAccess}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                'Solicitar Acesso'
              )}
            </Button>
          </div>

          {/* Information Text */}
          <div className="text-xs text-gray-500 text-center leading-relaxed">
            Sua solicitação será enviada para os administradores do sistema.
            Você receberá uma notificação quando sua solicitação for aprovada.
          </div>
        </CardContent>
      </Card>
    </div>
  );
};