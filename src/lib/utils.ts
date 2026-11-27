import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDocument(document: string, countryCode: string): string {
  if (!document) return '';
  
  // Remove all non-numeric characters
  const numbers = document.replace(/\D/g, '');
  
  switch (countryCode.toLowerCase()) {
    case 'br':
      // CPF format: 000.000.000-00
      if (numbers.length <= 11) {
        return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
      }
      // CNPJ format: 00.000.000/0000-00
      return numbers.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    
    case 'us':
      // SSN format: 000-00-0000
      return numbers.replace(/(\d{3})(\d{2})(\d{4})/, '$1-$2-$3');
    
    default:
      return document;
  }
}

export function validateDocument(document: string, regex: string): boolean {
  if (!document || !regex) return false;
  
  try {
    const regexPattern = new RegExp(regex);
    return regexPattern.test(document);
  } catch (error) {
    console.error('Invalid regex pattern:', error);
    return false;
  }
}

export function createUsername(countryCode: string, document: string): string {
  if (!countryCode || !document) return '';
  
  // Remove formatting from document
  const cleanDocument = document.replace(/\D/g, '');
  
  return `${countryCode.toLowerCase()}:${cleanDocument}`;
}

export function formatDate(dateString: string): string {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    // Formatação consistente para evitar problemas de hidratação
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  } catch {
    return dateString;
  }
}