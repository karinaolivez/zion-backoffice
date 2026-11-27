// API Types
export interface Nationality {
  id: string;
  name: string;
  abbr: string;
  label: string;
  documentRegex: string;
  phoneRegex: string;
  dialCode: string;
  phoneMask: string;
  documentMask: string;
  documentMinLength: number;
  documentMaxLength: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string | null;
}

export interface NationalityResponse {
  success: boolean;
  data?: Nationality[];
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  user?: {
    token?: string | null;
    accessToken?: string | null;
    availableProfiles?: Array<{
      id?: string | null;
      name?: string | null;
      type?: string | null;
      [key: string]: unknown;
    }> | null;
    expiresIn?: number | null;
    refreshToken?: string | null;
    status?: string | null;
    tokenType?: string | null;
    userEmail?: string | null;
    username?: string | null;
  }
}

// External API Profile Response interfaces
export interface ExternalUserProfile {
  id: string;
  type: "VISITOR" | string;
  fullname: string;
  birthdate: string;
  gender: "MALE" | "FEMALE" | string;
  maritalStatus: "SINGLE" | "MARRIED" | string;
  documentType: string;
  documentNumber: string;
  isBaptized: boolean;
  baptismType: "ASPERSION" | string;
  baptismYear: string;
  belongsToOrganization: boolean;
  yearJoinedOrganization: string;
  avatarUrl: string;
  customFields: Record<string, unknown>;
  organizationId: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  interests: Array<{
    id: string;
    name: string;
    type: "INTERESTS" | string;
  }>;
  communities: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
  addresses: Array<{
    id: string;
    street: string;
    number: string;
    complement: string;
    neighborhood: string;
    city: string;
    state: string;
    country: string;
    zipCode: string;
    reference: string;
    latitude: number;
    longitude: number;
  }>;
  user: {
    id: string;
    email: string;
    phone: string;
    username: string;
  };
  roles: Array<{
    id: string;
    name: string;
    type: "LEADER" | string;
  }>;
  churchOrigin: string;
  mainCommunityId: string;
}

export interface UserProfile extends Partial<Omit<ExternalUserProfile, 'type'>> {
  id: string;
  name?: string | null;
  email?: string | null;
  phone?: string;
  document?: string;
  nationality?: string;
  address?: string;
  birthDate?: string;
  registrationDate?: string;
  avatar?: string;
  status?: string | null;
  external_id?: string;
  full_name?: string;
  // Login-specific fields
  token?: string | null;
  accessToken?: string | null;
  expiresIn?: number | null;
  refreshToken?: string | null;
  tokenType?: string | null;
  userEmail?: string | null;
  username?: string | null;
  type?: string | null;
}

export interface ProfileResponse {
  success: boolean;
  data?: UserProfile;
}

export interface ApiError {
  message: string;
  statusCode: number;
  error?: string;
}

// App Types
export interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isLoading: boolean;
  login: (token: string, userData: UserProfile) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

export interface Theme {
  mode: 'light' | 'dark';
  toggle: () => void;
}

export interface Language {
  code: string;
  name: string;
  flag: string;
}

// Campus/Communities Types
export interface CommunityGroup {
  id: string;
  name: string;
}

export interface Community {
  id: string;
  name: string;
  slug: string;
  organizationId: string;
  communityGroupId: string;
  communityGroup: CommunityGroup;
  createdAt: string;
}

export interface CommunityPageInfo {
  totalCount: number;
  currentPage: number;
  totalPages: number;
  pageSize: number;
}

export interface CommunityResponse {
  communities: Community[];
  pageInfo: CommunityPageInfo;
}

export interface CampusApiResponse {
  success: boolean;
  data?: CommunityResponse;
  error?: string;
}

// Campus interfaces for Supabase integration
export interface Campus {
  id: string;
  name: string;
  slug: string;
  organizationId: string;
  communityGroupId: string;
  communityGroupName: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateCampusRequest {
  name: string;
  slug: string;
  organizationId: string;
  communityGroupId: string;
  communityGroupName: string;
}

export interface UpdateCampusRequest extends Partial<CreateCampusRequest> {
  id: string;
}

export interface CampusPageInfo {
  totalCount: number;
  currentPage: number;
  totalPages: number;
  pageSize: number;
}

export interface CampusPaginatedResponse {
  campuses: Campus[];
  pageInfo: CampusPageInfo;
}

export interface CampusResponse {
  success: boolean;
  data?: Campus | Campus[] | CampusPaginatedResponse;
  error?: string;
  message?: string;
}