'use client';

import { Search, FileX } from 'lucide-react';

interface EmptySearchStateProps {
  searchTerm: string;
}

export const EmptySearchState = ({ searchTerm }: EmptySearchStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
      <div className="relative mb-4">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-600/20 to-gray-700/20 flex items-center justify-center backdrop-blur-sm border border-gray-600/30">
          <FileX className="w-8 h-8 text-gray-400" />
        </div>
        <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center border border-blue-500/30">
          <Search className="w-3 h-3 text-blue-400" />
        </div>
      </div>

      <h3 className="text-md font-semibold text-white mb-2">
        Nenhum resultado encontrado
      </h3>

      <p className="text-xs text-gray-400 mb-1 max-w-xs pb-4">
        Não encontramos nenhuma página que corresponda a
      </p>

      <p className="text-sm font-medium text-blue-400 mb-4 px-3 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20">
        "{searchTerm}"
      </p>

      <div className="text-xs text-gray-500 space-y-1">
        <p>• Verifique a ortografia</p>
        <p>• Tente termos mais gerais</p>
        <p>• Verifique suas permissões de acesso</p>
      </div>
    </div>
  );
};