import type { PermissionMatrix, PhiExportLevel, Role } from '@ucc/types';

// Plain DTOs mirroring auth-service's internal-admin response shapes. Not
// importing auth-service's generated Prisma types across the service
// boundary — each service's generated client is private.
export interface LocationDto {
  id: string;
  city: string;
  name: string;
  address: string | null;
  phone: string | null;
  officeManagerId: string | null;
  officeManagerName: string | null;
  openTime: string | null;
  closeTime: string | null;
  latitude: number | null;
  longitude: number | null;
  status: string;
  settings: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface RoleConfigDto {
  role: Role;
  scope: string;
  description: string | null;
  permissions: PermissionMatrix;
  phiExport: PhiExportLevel;
  updatedAt: string;
}

export interface AuditLogDto {
  id: string;
  actorId: string | null;
  actorRole: string | null;
  actorName: string | null;
  action: string;
  entity: string;
  entityId: string | null;
  detail: Record<string, unknown> | null;
  requestId: string | null;
  createdAt: string;
}

export interface UserDto {
  id: string;
  role: Role;
  email: string;
  firstName: string;
  lastName: string;
  name: string;
  phone?: string | null;
  city?: string | null;
  status: string;
  languagePref: string;
  patientId?: string;
  locationId?: string | null;
  physicianType?: string | null;
  physicianSpecialtyIds?: string[];
  physicianSpecialtyNames?: string[];
  physicianLicenseNo?: string | null;
  credentialsVerified?: boolean;
}

export interface CategoryDto {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  displayOrder: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceOfferingDto {
  id: string;
  title: string;
  description: string | null;
  priceLabel: string | null;
  icon: string | null;
  displayOrder: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface FaqDto {
  id: string;
  category: string;
  question: string;
  answer: string;
  displayOrder: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface CareerDto {
  id: string;
  title: string;
  department: string;
  location: string;
  employmentType: string;
  description: string;
  requirements: string | null;
  displayOrder: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface TestimonialDto {
  id: string;
  patientName: string;
  rating: number;
  quote: string;
  status: string;
  reviewedBy: string | null;
  reviewedAt: string | null;
  createdAt: string;
}

export interface ContactSubmissionDto {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  serviceCategory: string | null;
  reason: string | null;
  message: string;
  status: string;
  createdAt: string;
}

export interface AnalyticsOverviewDto {
  locations: { total: number; active: number; byCity: Record<string, { total: number; active: number }> };
  users: { total: number; byRole: Record<string, number> };
  activity: {
    adminActions24h: number;
    adminActions7d: number;
    recent: Array<{ id: string; action: string; entity: string; actorName: string | null; actorRole: string | null; createdAt: string }>;
  };
}
