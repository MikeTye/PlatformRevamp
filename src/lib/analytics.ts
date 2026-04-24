import * as amplitude from '@amplitude/analytics-browser';

const AMPLITUDE_API_KEY = import.meta.env.VITE_AMPLITUDE_API_KEY ?? '';

let initialized = false;

export function initAnalytics() {
    if (!AMPLITUDE_API_KEY || initialized) return;

    amplitude.init(AMPLITUDE_API_KEY, {
        defaultTracking: {
            sessions: true,
            pageViews: true,
            formInteractions: false,
            fileDownloads: false,
        },
    });

    initialized = true;
}

export function trackEvent(
    eventType: string,
    eventProperties?: Record<string, unknown>
) {
    if (!AMPLITUDE_API_KEY) {
        if (import.meta.env.DEV) {
            console.debug('[analytics disabled]', eventType, eventProperties);
        }
        return;
    }

    if (import.meta.env.DEV) {
        console.debug('[analytics]', eventType, eventProperties);
    }

    amplitude.track(eventType, eventProperties);
}

export function setAnalyticsUser(userId: string) {
    if (!AMPLITUDE_API_KEY) return;
    amplitude.setUserId(userId);
}

export function setAnalyticsUserProperties(properties: Record<string, unknown>) {
    if (!AMPLITUDE_API_KEY) return;
    const identify = new amplitude.Identify();

    for (const [key, value] of Object.entries(properties)) {
        if (value !== undefined) {
            identify.set(key, value as any);
        }
    }

    amplitude.identify(identify);
}

export function resetAnalyticsUser() {
    if (!AMPLITUDE_API_KEY) return;
    amplitude.reset();
}

export type CompanyTrackingContext = {
    companyId?: string;
    companyName?: string;
    isOwnCompany?: boolean;
    entryPoint?: string;
};

export function trackCompanyDirectoryRefined(input: {
    refinementType: 'search' | 'filter' | 'tab' | 'sort' | 'view_mode' | 'clear_filters';
    tab?: string;
    searchQuery?: string;
    filterName?: string;
    filterValues?: string[];
    sortField?: string;
    sortDirection?: 'asc' | 'desc';
    viewMode?: 'table' | 'grid';
}) {
    trackEvent('Company directory refined', {
        refinement_type: input.refinementType,
        tab: input.tab,
        search_query: input.searchQuery,
        filter_name: input.filterName,
        filter_values: input.filterValues,
        sort_field: input.sortField,
        sort_direction: input.sortDirection,
        view_mode: input.viewMode,
    });
}

export function trackCompanyPageContentUpdated(input: {
    companyId: string;
    companyName?: string;
    section: string;
    editType: 'update' | 'upload' | 'remove' | 'visibility_change';
    visibility?: 'public' | 'hidden';
    hasFile?: boolean;
    itemId?: string;
}) {
    trackEvent('Company page content updated', {
        company_id: input.companyId,
        company_name: input.companyName,
        section: input.section,
        edit_type: input.editType,
        visibility: input.visibility,
        has_file: input.hasFile,
        item_id: input.itemId,
    });
}

export function trackCompanyTeamUpdated(input: {
    companyId: string;
    companyName?: string;
    action: 'add' | 'remove' | 'edit';
    userId?: string;
    email?: string;
    role?: string;
}) {
    trackEvent('Company team updated', {
        company_id: input.companyId,
        company_name: input.companyName,
        action: input.action,
        user_id: input.userId,
        email: input.email,
        role: input.role,
    });
}

export function trackCompanyPermissionsUpdated(input: {
    companyId: string;
    companyName?: string;
    action: 'add' | 'remove' | 'change' | 'bulk_save';
    permissionsCount?: number;
    inheritToProjects?: boolean;
}) {
    trackEvent('Company permissions updated', {
        company_id: input.companyId,
        company_name: input.companyName,
        action: input.action,
        permissions_count: input.permissionsCount,
        inherit_company_permissions_to_projects: input.inheritToProjects,
    });
}

export type OpportunityTrackingEntryPoint =
    | 'opportunities_directory'
    | 'opportunity_detailed_view'
    | 'bookmarks_opportunities_tab'
    | 'dashboard';

export type DashboardDestinationType =
    | 'project_directory'
    | 'company_directory'
    | 'opportunities_directory'
    | 'company_page'
    | 'project_listing'
    | 'bookmarks';

export function trackOpportunitiesDirectoryViewed(input?: {
    tab?: 'all' | 'saved';
}) {
    trackEvent('Opportunities directory viewed', {
        tab: input?.tab,
    });
}

export function trackOpportunitiesDirectoryRefined(input: {
    refinementType: 'search' | 'filter' | 'tab' | 'clear_filters';
    tab?: 'all' | 'saved';
    searchQuery?: string;
    filterName?: 'type' | 'stage' | 'country';
    filterValues?: string[];
}) {
    trackEvent('Opportunities directory refined', {
        refinement_type: input.refinementType,
        tab: input.tab,
        search_query: input.searchQuery,
        filter_name: input.filterName,
        filter_values: input.filterValues,
    });
}

export function trackOpportunityPostViewedInDetail(input: {
    opportunityId: string;
    projectId: string;
    projectName?: string;
    opportunityType?: string;
    entryPoint: OpportunityTrackingEntryPoint;
    urgent?: boolean;
}) {
    trackEvent('Opportunity post viewed in detail', {
        opportunity_id: input.opportunityId,
        project_id: input.projectId,
        project_name: input.projectName,
        opportunity_type: input.opportunityType,
        entry_point: input.entryPoint,
        urgent: input.urgent,
    });
}

const FIRST_OPPORTUNITY_DETAIL_VIEW_KEY =
    'amplitude:first-opportunity-post-viewed-in-detail';

export function trackFirstOpportunityPostViewedInDetail(input: {
    opportunityId: string;
    projectId: string;
    projectName?: string;
    opportunityType?: string;
    entryPoint: OpportunityTrackingEntryPoint;
    urgent?: boolean;
}) {
    if (typeof window === 'undefined') return;

    const hasTracked = window.localStorage.getItem(
        FIRST_OPPORTUNITY_DETAIL_VIEW_KEY
    );

    if (hasTracked === '1') return;

    trackEvent('First opportunity post viewed in detail', {
        opportunity_id: input.opportunityId,
        project_id: input.projectId,
        project_name: input.projectName,
        opportunity_type: input.opportunityType,
        entry_point: input.entryPoint,
        urgent: input.urgent,
    });

    window.localStorage.setItem(FIRST_OPPORTUNITY_DETAIL_VIEW_KEY, '1');
}

export function trackOpportunityPostBookmarked(input: {
    opportunityId: string;
    projectId: string;
    projectName?: string;
    opportunityType?: string;
    occurrencePoint: OpportunityTrackingEntryPoint;
    urgent?: boolean;
}) {
    trackEvent('Opportunity post bookmarked', {
        opportunity_id: input.opportunityId,
        project_id: input.projectId,
        project_name: input.projectName,
        opportunity_type: input.opportunityType,
        occurrence_point: input.occurrencePoint,
        urgent: input.urgent,
    });
}

export function trackBookmarkedItemRemoved(input: {
    entityType: 'opportunity' | 'project' | 'company';
    itemId: string;
    occurrencePoint?: OpportunityTrackingEntryPoint | 'bookmarks_page';
    projectId?: string;
    projectName?: string;
    itemType?: string;
}) {
    trackEvent('Bookmarked item removed', {
        entity_type: input.entityType,
        item_id: input.itemId,
        occurrence_point: input.occurrencePoint,
        project_id: input.projectId,
        project_name: input.projectName,
        item_type: input.itemType,
    });
}

export function trackOpportunityContactClicked(input: {
    opportunityId: string;
    projectId: string;
    projectName?: string;
    opportunityType?: string;
    entryPoint: OpportunityTrackingEntryPoint;
    urgent?: boolean;
}) {
    trackEvent('Opportunity contact clicked', {
        opportunity_id: input.opportunityId,
        project_id: input.projectId,
        project_name: input.projectName,
        opportunity_type: input.opportunityType,
        entry_page_view: input.entryPoint,
        urgent: input.urgent,
    });
}

export function trackDashboardViewed() {
    trackEvent('Dashboard viewed');
}

export function trackDashboardNavigationClicked(input: {
    destinationType: DashboardDestinationType;
    destinationPath?: string;
    sourceSection?: string;
    itemId?: string;
    itemName?: string;
    itemType?: string;
    tab?: string;
}) {
    trackEvent('Dashboard navigation clicked', {
        destination_type: input.destinationType,
        destination_path: input.destinationPath,
        source_section: input.sourceSection,
        item_id: input.itemId,
        item_name: input.itemName,
        item_type: input.itemType,
        tab: input.tab,
    });
}