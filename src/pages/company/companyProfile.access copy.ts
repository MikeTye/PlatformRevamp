export type CompanyPrivacyVisibility = 'public' | 'private';

export type CompanyPrivacySectionKey =
    | 'page'
    | 'overview'
    | 'about'
    | 'team'
    | 'documents'
    | 'media'
    | 'projects'
    | 'permissions';

export type CompanyAccessRole = 'creator' | 'viewer' | null | undefined;

export interface CompanyAccessLike {
    isMyCompany?: boolean;
    accessRole?: CompanyAccessRole;
    privacy?: Partial<Record<CompanyPrivacySectionKey, CompanyPrivacyVisibility>>;
}

export function isCompanyCreator(company: CompanyAccessLike | null | undefined): boolean {
    return !!company && (company.isMyCompany === true || company.accessRole === 'creator');
}

export function hasCompanyViewerAccess(company: CompanyAccessLike | null | undefined): boolean {
    if (!company) return false;
    return isCompanyCreator(company) || company.accessRole === 'viewer';
}

export function canViewCompanyPage(company: CompanyAccessLike | null | undefined): boolean {
    if (!company) return false;
    const pageVisibility = company.privacy?.page ?? 'public';

    if (pageVisibility === 'public') return true;
    return hasCompanyViewerAccess(company);
}

export function canViewCompanySection(
    company: CompanyAccessLike | null | undefined,
    section: CompanyPrivacySectionKey
): boolean {
    if (!company) return false;

    if (!canViewCompanyPage(company)) return false;

    const sectionVisibility = company.privacy?.[section] ?? 'public';
    if (sectionVisibility === 'public') return true;

    return hasCompanyViewerAccess(company);
}