// companyProfile.types.ts
import { ProjectStage } from '../../components/ProjectStageIndicator';
import { MediaItem } from '../../components/MediaGallery';
import { COMPANY_ROLE_OPTIONS } from '../../constants/companies';

export type CompanyType = (typeof COMPANY_ROLE_OPTIONS)[number]['id'];
export type CompanyAccessRole = 'creator' | 'viewer' | null;
export type CompanyPrivacyLevel = 'public' | 'hidden';

type CompanyAccessPermission = 'creator' | 'viewer';

export interface CompanyProject {
    id: string;
    upid: string;
    name: string;
    stage: ProjectStage;
    country?: string;
    countryCode?: string;
    type?: string;
    hectares?: number;
    expectedCredits?: string;
    photoUrl?: string | null;
    thumbUrl?: string | null;
}

export interface CompanyDocument {
    id?: string;
    name: string;
    type?: string | null;
    date?: string | null;
    url?: string | null;
}

export interface CompanyTeamMember {
    id?: string;
    name: string;
    role: string;
    email: string;
    profileSlug?: string | null;
}

export type CompanyPermissionMember = {
    id: string;
    userId: string;
    name: string;
    email: string;
    role?: string | null;
    permission: CompanyAccessPermission;
    deleteFlag?: boolean;
};


export interface CompanyPrivacyMap {
    header: CompanyPrivacyLevel;
    about: CompanyPrivacyLevel;
    media: CompanyPrivacyLevel;
    documents: CompanyPrivacyLevel;
    projects: CompanyPrivacyLevel;
    projectTypes: CompanyPrivacyLevel;
    services: CompanyPrivacyLevel;
    serviceCategories: CompanyPrivacyLevel;
    geographicalCoverage: CompanyPrivacyLevel;
    permissions: CompanyPrivacyLevel;
    team: CompanyPrivacyLevel;
}

export type CompanySectionKey =
    | 'header'
    | 'about'
    | 'media'
    | 'projects'
    | 'services'
    | 'serviceCategories'
    | 'team'
    | 'documents'
    | 'permissions'
    | 'projectTypes'
    | 'geographicalCoverage';

export interface CompanyProfile {
    id: string;
    slug?: string;

    displayName: string;
    type: CompanyType;

    roles?: string[];
    serviceTypes?: string[];
    serviceCategories?: string[];
    projectTypes?: string[];

    country?: string | null;
    countryCode?: string | null;
    description?: string | null;
    fullDescription?: string | null;
    website?: string | null;
    logoUrl?: string | null;

    isMyCompany?: boolean;
    accessRole?: CompanyAccessRole;
    privacy?: CompanyPrivacyMap;

    projects?: CompanyProject[];
    projectsParticipated?: CompanyProject[];
    services?: string[];
    team?: CompanyTeamMember[];
    media?: MediaItem[];
    geographicalCoverage?: string[];
    documents?: CompanyDocument[];

    permissions?: CompanyPermissionMember[];
    inheritCompanyPermissionsToProjects?: boolean;

    externalInviteUrl?: string | null;
    inviteToken?: string | null;
    invitePath?: string | null;
    inviteEnabled?: boolean;
}