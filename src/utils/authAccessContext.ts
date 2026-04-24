export type InviteCompanyPreview = {
    id?: string;
    slug?: string;
    displayName?: string;
};

export type SharePreview = {
    redirectTo?: string;
    entityType?: 'company' | 'project';
    entityId?: string;
    entitySlug?: string;
    title?: string;
};

type RedirectLike = {
    redirectTo?: string;
    companyId?: string;
    companySlug?: string;
    projectId?: string;
    projectSlug?: string;
};

const KEYS = {
    inviteToken: 'tce_company_invite_token',
    inviteCompanyId: 'tce_company_invite_company_id',
    inviteCompanySlug: 'tce_company_invite_company_slug',
    inviteCompanyName: 'tce_company_invite_company_name',

    shareToken: 'tce_share_token',
    shareRedirectTo: 'tce_share_redirect_to',
    shareEntityType: 'tce_share_entity_type',
    shareEntityId: 'tce_share_entity_id',
    shareEntitySlug: 'tce_share_entity_slug',
    shareTitle: 'tce_share_title',
} as const;

export function persistInviteContext(
    token: string,
    company?: InviteCompanyPreview | null
) {
    if (!token) return;

    sessionStorage.setItem(KEYS.inviteToken, token);

    if (company?.id) sessionStorage.setItem(KEYS.inviteCompanyId, company.id);
    if (company?.slug) sessionStorage.setItem(KEYS.inviteCompanySlug, company.slug);
    if (company?.displayName) sessionStorage.setItem(KEYS.inviteCompanyName, company.displayName);
}

export function clearInviteContext() {
    sessionStorage.removeItem(KEYS.inviteToken);
    sessionStorage.removeItem(KEYS.inviteCompanyId);
    sessionStorage.removeItem(KEYS.inviteCompanySlug);
    sessionStorage.removeItem(KEYS.inviteCompanyName);
}

export function getStoredInviteToken() {
    return sessionStorage.getItem(KEYS.inviteToken)?.trim() ?? '';
}

export function getInviteRedirectPath(data?: RedirectLike) {
    if (data?.redirectTo) return data.redirectTo;
    if (data?.companySlug) return `/companies/${encodeURIComponent(data.companySlug)}`;
    if (data?.companyId) return `/companies/${encodeURIComponent(data.companyId)}`;

    const storedSlug = sessionStorage.getItem(KEYS.inviteCompanySlug)?.trim();
    const storedId = sessionStorage.getItem(KEYS.inviteCompanyId)?.trim();

    if (storedSlug) return `/companies/${encodeURIComponent(storedSlug)}`;
    if (storedId) return `/companies/${encodeURIComponent(storedId)}`;

    return '/companies';
}

export function persistShareContext(token: string, share?: SharePreview | null) {
    if (!token) return;

    sessionStorage.setItem(KEYS.shareToken, token);

    if (share?.redirectTo) sessionStorage.setItem(KEYS.shareRedirectTo, share.redirectTo);
    if (share?.entityType) sessionStorage.setItem(KEYS.shareEntityType, share.entityType);
    if (share?.entityId) sessionStorage.setItem(KEYS.shareEntityId, share.entityId);
    if (share?.entitySlug) sessionStorage.setItem(KEYS.shareEntitySlug, share.entitySlug);
    if (share?.title) sessionStorage.setItem(KEYS.shareTitle, share.title);
}

export function clearShareContext() {
    sessionStorage.removeItem(KEYS.shareToken);
    sessionStorage.removeItem(KEYS.shareRedirectTo);
    sessionStorage.removeItem(KEYS.shareEntityType);
    sessionStorage.removeItem(KEYS.shareEntityId);
    sessionStorage.removeItem(KEYS.shareEntitySlug);
    sessionStorage.removeItem(KEYS.shareTitle);
}

export function getStoredShareToken() {
    return sessionStorage.getItem(KEYS.shareToken)?.trim() ?? '';
}

export function getShareRedirectPath(data?: RedirectLike) {
    if (data?.redirectTo) return data.redirectTo;
    if (data?.projectSlug) return `/projects/${encodeURIComponent(data.projectSlug)}`;
    if (data?.projectId) return `/projects/${encodeURIComponent(data.projectId)}`;
    if (data?.companySlug) return `/companies/${encodeURIComponent(data.companySlug)}`;
    if (data?.companyId) return `/companies/${encodeURIComponent(data.companyId)}`;

    const storedRedirectTo = sessionStorage.getItem(KEYS.shareRedirectTo)?.trim();
    if (storedRedirectTo) return storedRedirectTo;

    const entityType = sessionStorage.getItem(KEYS.shareEntityType)?.trim();
    const entitySlug = sessionStorage.getItem(KEYS.shareEntitySlug)?.trim();
    const entityId = sessionStorage.getItem(KEYS.shareEntityId)?.trim();

    if (entityType === 'project' && entitySlug) {
        return `/projects/${encodeURIComponent(entitySlug)}`;
    }
    if (entityType === 'project' && entityId) {
        return `/projects/${encodeURIComponent(entityId)}`;
    }
    if (entityType === 'company' && entitySlug) {
        return `/companies/${encodeURIComponent(entitySlug)}`;
    }
    if (entityType === 'company' && entityId) {
        return `/companies/${encodeURIComponent(entityId)}`;
    }

    return '/dashboard';
}

export function clearAllAccessContext() {
    clearInviteContext();
    clearShareContext();
}

export function getStoredShareContext(): SharePreview | null {
    const redirectTo = sessionStorage.getItem(KEYS.shareRedirectTo)?.trim() ?? '';
    const entityType = sessionStorage.getItem(KEYS.shareEntityType)?.trim() as
        | 'company'
        | 'project'
        | '';
    const entityId = sessionStorage.getItem(KEYS.shareEntityId)?.trim() ?? '';
    const entitySlug = sessionStorage.getItem(KEYS.shareEntitySlug)?.trim() ?? '';
    const title = sessionStorage.getItem(KEYS.shareTitle)?.trim() ?? '';

    if (!redirectTo && !entityType && !entityId && !entitySlug && !title) {
        return null;
    }

    return {
        ...(redirectTo ? { redirectTo } : {}),
        ...(entityType ? { entityType } : {}),
        ...(entityId ? { entityId } : {}),
        ...(entitySlug ? { entitySlug } : {}),
        ...(title ? { title } : {}),
    };
}