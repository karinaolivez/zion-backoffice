// Exportações centralizadas de todos os serviços
export { default as httpClient } from './http-client';
export { authService, default as authServiceDefault } from './auth.service';
export { campusService, default as campusServiceDefault } from './campus/campus.service';
export { nationalityService, default as nationalityServiceDefault } from './nationality/nationality.service';
export { profileService, default as profileServiceDefault } from './profile/profile.service';

// Re-exportação de tipos para conveniência
export type { CampusSearchParams } from './campus/campus.service';

// Exportação de tipos do módulo de tipos
export type {
  LoginRequest,
  LoginResponse,
  NationalityResponse,
  ProfileResponse,
  UserProfile,
  Nationality,
  CampusApiResponse
} from '../types';