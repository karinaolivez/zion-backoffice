'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  onFocus?: () => void;
  onBlur?: () => void;
  disabled?: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  placeholder,
  className = '',
  onFocus,
  onBlur,
  disabled = false
}) => {
  const t = useTranslations();
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFocus = () => {
    setIsFocused(true);
    onFocus?.();
  };

  const handleBlur = () => {
    setIsFocused(false);
    onBlur?.();
  };

  const handleClear = () => {
    onChange('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleClear();
      inputRef.current?.blur();
    }
  };

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Atalho Ctrl/Cmd + K para focar na busca
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  return (
    <div className={`relative w-full ${className}`}>
      <div
        className={`
          relative flex items-center w-full
          bg-gray-800/50
          border border-gray-700
          rounded-lg transition-all duration-200 ease-in-out
          ${isFocused
            ? 'ring-2 ring-blue-500/20 border-blue-700'
            : 'hover:border-gray-600'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        {/* Ícone de busca */}
        <div className="flex items-center justify-center w-10 h-10 text-gray-500">
          <Search
            size={16}
            className={`transition-colors duration-200 ${isFocused ? 'text-blue-400' : ''
              }`}
          />
        </div>

        {/* Input */}
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder || t('navigation.searchPlaceholder', { default: 'Buscar páginas...' })}
          disabled={disabled}
          className={`
            flex-1 h-10 px-0 py-2 text-sm
            bg-transparent border-none outline-none
            text-gray-100
            placeholder-gray-400
            disabled:cursor-not-allowed
          `}
        />

        {/* Botão de limpar */}
        {value && (
          <button
            type="button"
            onClick={handleClear}
            disabled={disabled}
            className={`
              flex items-center justify-center w-8 h-8 mr-1
              text-gray-400 hover:text-gray-300
              rounded-md hover:bg-gray-700
              transition-all duration-150 ease-in-out
              disabled:cursor-not-allowed disabled:hover:bg-transparent
              disabled:hover:text-gray-400
            `}
            aria-label={t('common.clear', { default: 'Limpar' })}
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Barra de progresso sutil durante a busca */}
      {value && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-700 rounded-b-lg overflow-hidden">
          <div
            className="h-full bg-blue-400 transition-all duration-300 ease-out"
            style={{ width: '100%' }}
          />
        </div>
      )}
    </div>
  );
};