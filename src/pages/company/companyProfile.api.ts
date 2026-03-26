import type { CompanyProfile } from './companyProfile.types';
import { ExistingUserOption } from './CompanySidebarEditor';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

function normalizePrivacyValue(value: unknown): 'public' | 'hidden' {
    if (
        value === 'hidden' ||
        value === 'private' ||
        value === 'company_users'
    ) {
        return 'hidden';
    }

    return 'public';
}

export function normalizeCompanyDetail(raw: any): CompanyProfile {
    const roles = Array.isArray(raw.roles)
        ? raw.roles
        : Array.isArray(raw.company_roles)
            ? raw.company_roles
            : Array.isArray(raw.companyRoles)
                ? raw.companyRoles
                : raw.type
                    ? [raw.type]
                    : raw.company_type
                        ? [raw.company_type]
                        : [];

    const serviceCategories = Array.isArray(raw.serviceCategories)
        ? raw.serviceCategories
        : Array.isArray(raw.service_categories)
            ? raw.service_categories
            : Array.isArray(raw.serviceTypes)
                ? raw.serviceTypes
                : Array.isArray(raw.service_types)
                    ? raw.service_types
                    : [];

    const projectTypes = Array.isArray(raw.projectTypes)
        ? raw.projectTypes
        : Array.isArray(raw.project_types)
            ? raw.project_types
            : [];

    const geographicalCoverage = Array.isArray(raw.geographicalCoverage)
        ? raw.geographicalCoverage
        : Array.isArray(raw.geographical_coverage)
            ? raw.geographical_coverage
            : Array.isArray(raw.regions)
                ? raw.regions
                : [];

    return {
        id: String(raw.id),
        slug: raw.slug ?? raw.id,
        displayName:
            String(raw.displayName ?? raw.display_name ?? raw.name ?? '').trim() || 'Untitled Company',
        type:
            raw.type ??
            raw.companyType ??
            raw.company_type ??
            roles[0] ??
            'Project Developer',
        roles,
        serviceTypes: serviceCategories,
        serviceCategories,
        projectTypes,
        country:
            raw.country ??
            raw.primary_country ??
            raw.primaryCountry ??
            null,
        countryCode: raw.countryCode ?? raw.country_code ?? null,
        description: raw.description ?? raw.function_description ?? '',
        fullDescription: raw.fullDescription ?? raw.full_description ?? '',
        website: raw.website ?? raw.website_url ?? '',
        isMyCompany: Boolean(raw.isMyCompany ?? raw.is_my_company ?? false),
        accessRole: raw.accessRole ?? raw.access_role ?? null,
        inheritCompanyPermissionsToProjects: Boolean(
            raw.inheritCompanyPermissionsToProjects ??
            raw.inherit_company_permissions_to_projects ??
            false
        ),
        externalInviteUrl:
            raw.externalInviteUrl ??
            raw.external_invite_url ??
            raw.invite_url ??
            null,
        inviteToken:
            raw.inviteToken ??
            raw.invite_token ??
            null,
        invitePath:
            raw.invitePath ??
            raw.invite_path ??
            null,
        inviteEnabled: Boolean(
            raw.inviteEnabled ??
            raw.invite_enabled ??
            raw.hasInviteLink ??
            raw.has_invite_link ??
            raw.inviteToken ??
            raw.invite_token ??
            raw.externalInviteUrl ??
            raw.external_invite_url
        ),
        privacy: {
            header: normalizePrivacyValue(raw.privacy?.header ?? raw.privacy?.overview),
            about: normalizePrivacyValue(raw.privacy?.about),
            media: normalizePrivacyValue(raw.privacy?.media),
            documents: normalizePrivacyValue(raw.privacy?.documents),
            projects: normalizePrivacyValue(raw.privacy?.projects),
            services: normalizePrivacyValue(raw.privacy?.services),
            serviceCategories: normalizePrivacyValue(
                raw.privacy?.serviceCategories ?? raw.privacy?.service_categories
            ),
            projectTypes: normalizePrivacyValue(
                raw.privacy?.projectTypes ?? raw.privacy?.project_types
            ),
            geographicalCoverage: normalizePrivacyValue(
                raw.privacy?.geographicalCoverage ?? raw.privacy?.geographical_coverage
            ),
            permissions: normalizePrivacyValue(raw.privacy?.permissions),
            team: normalizePrivacyValue(raw.privacy?.team),
        },
        team: Array.isArray(raw.team) ? raw.team : [],
        media: Array.isArray(raw.media) ? raw.media : [],
        documents: Array.isArray(raw.documents) ? raw.documents : [],
        projects: Array.isArray(raw.projects) ? raw.projects : [],
        projectsParticipated: Array.isArray(raw.projectsParticipated)
            ? raw.projectsParticipated
            : Array.isArray(raw.projects_participated)
                ? raw.projects_participated
                : [],
        services: Array.isArray(raw.services) ? raw.services : [],
        geographicalCoverage,
        permissions: Array.isArray(raw.permissions) ? raw.permissions : [],
    };
}

export async function getCompanyDetail(companyIdOrSlug: string): Promise<CompanyProfile | null> {
    const response = await fetch(
        `${API_BASE_URL}/companies/${encodeURIComponent(companyIdOrSlug)}`,
        {
            method: 'GET',
            credentials: 'include',
            headers: { Accept: 'application/json' },
        }
    );

    if (response.status === 404) return null;

    if (!response.ok) {
        const text = await response.text().catch(() => '');
        throw new Error(text || `Failed to load company detail (${response.status})`);
    }

    const payload = await response.json();
    const rawCompany = payload?.data ?? payload?.result ?? payload;

    if (!rawCompany || !rawCompany.id) return null;
    return normalizeCompanyDetail(rawCompany);
}

export async function patchCompanySection(
    companyId: string,
    section:
        | 'header'
        | 'about'
        | 'services'
        | 'serviceCategories'
        | 'geographicalCoverage'
        | 'permissions'
        | 'team'
        | 'media'
        | 'projectTypes'
        | 'documents',
    data: Record<string, unknown>
): Promise<CompanyProfile> {
    const response = await fetch(
        `${API_BASE_URL}/companies/${encodeURIComponent(companyId)}`,
        {
            method: 'PATCH',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
            },
            body: JSON.stringify({ section, data }),
        }
    );

    const payload = await response.json().catch(() => null);

    if (!response.ok) {
        throw new Error(payload?.error || `Failed to update company (${response.status})`);
    }

    return normalizeCompanyDetail(payload?.data ?? payload);
}

export async function getUserOptions(q = ''): Promise<ExistingUserOption[]> {
    const response = await fetch(
        `${API_BASE_URL}/users/options?q=${encodeURIComponent(q)}`,
        {
            method: 'GET',
            credentials: 'include',
            headers: { Accept: 'application/json' },
        }
    );

    const payload = await response.json().catch(() => null);

    if (!response.ok) {
        throw new Error(payload?.error || `Failed to load users (${response.status})`);
    }

    const items = Array.isArray(payload?.items)
        ? payload.items
        : Array.isArray(payload?.data)
            ? payload.data
            : [];

    return items.map((item: any) => ({
        id: String(item.id),
        name: String(item.name ?? ''),
        email: item.email ?? undefined,
    }));
}