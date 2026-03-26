import type {
    CompanyAccessRole,
    CompanyPrivacyLevel,
    CompanyProfile,
    CompanySectionKey,
} from './companyProfile.types';

export interface CompanyAccessLike {
    isMyCompany?: boolean;
    accessRole?: CompanyAccessRole | null;
    privacy?: Partial<Record<CompanySectionKey, CompanyPrivacyLevel>>;
}

export function isCompanyCreator(company: CompanyAccessLike | null | undefined): boolean {
    return !!company && (company.isMyCompany === true || company.accessRole === 'creator');
}

export function hasCompanyViewerAccess(company: CompanyAccessLike | null | undefined): boolean {
    if (!company) return false;
    return isCompanyCreator(company) || company.accessRole === 'viewer';
}

export function canViewCompanySection(
    company: CompanyAccessLike | null | undefined,
    section: CompanySectionKey
): boolean {
    if (!company) return false;

    // creator/viewer always bypass section privacy
    if (hasCompanyViewerAccess(company)) return true;

    // no stored value means visible by default
    const sectionVisibility = company.privacy?.[section] ?? 'public';
    return sectionVisibility === 'public';
}

export function canEditCompany(company: CompanyProfile | null | undefined): boolean {
    return isCompanyCreator(company);
}