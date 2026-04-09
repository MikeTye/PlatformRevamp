export type CollaboratorEntityType = 'user' | 'company';

export type ProjectStage =
    | 'Exploration'
    | 'Concept'
    | 'Design'
    | 'Listed'
    | 'Validation'
    | 'Registered'
    | 'Issued'
    | 'Closed';

export type ProjectRole = 'creator' | 'viewer';
export type SectionVisibility = 'public' | 'private';
export type ProjectEditorTarget = ProjectSectionKey | 'cover' | 'settings';

export type ProjectSectionKey =
    | 'overview'
    | 'story'
    | 'location'
    | 'readiness'
    | 'registry'
    | 'impact'
    | 'opportunities'
    | 'updates'
    | 'documents'
    | 'media'
    | 'team';

export interface ProjectTeamMember {
    id: string;
    memberType: CollaboratorEntityType;
    memberId?: string | null;
    userId?: string | null;
    companyId?: string | null;

    name: string;
    role?: string | null;
    companyName?: string;
    avatarUrl?: string | null;
    permission?: ProjectRole | null;

    isPlatformMember?: boolean;
    manualName?: string | null;
    manualOrganization?: string | null;
}

export interface ProjectOpportunity {
    id: string;
    type: string;
    description?: string | null;
    urgent?: boolean;
}

export type ProjectDocumentStatus = 'Draft' | 'Final';

export interface ProjectDocument {
    id: string;
    kind?: string | null;
    assetUrl: string;
    contentType?: string | null;
    name?: string | null;
    type?: string | null;
    status?: ProjectDocumentStatus | null;
    createdAt?: string | null;
}

export interface ProjectMediaItem {
    id: string;
    kind?: string | null;
    assetUrl: string;
    contentType?: string | null;
    caption?: string | null;
    isCover?: boolean;
    createdAt?: string | null;
}

export interface ProjectReadinessItem {
    id: string;
    label: string;
    status: 'yes' | 'progress' | 'seeking' | 'na';
    note?: string | null;
}

export type ProjectAccess = {
    isProjectMember: boolean;
    projectRole: ProjectRole | null;
    canViewPrivateSections: boolean;
};

export interface ProjectServiceProvider {
    id: string;
    name: string;
    type?: string | null;
}

export interface ProjectUpdate {
    id: string;
    title: string;
    description?: string | null;
    dateLabel?: string | null;
    authorName?: string | null;
    type?: 'progress' | 'stage';
}

export interface ProjectProfileData {
    id: string;
    upid?: string | null;
    name: string;
    stage: ProjectStage;
    type?: string | null;
    description?: string | null;
    companyName?: string | null;
    country?: string | null;
    region?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    coverImageUrl?: string | null;
    projectVisibility?: 'public' | 'private' | 'draft' | null;
    storyProblem?: string | null;
    storyApproach?: string | null;
    methodology?: string | null;

    registrationPlatform?: string | null;
    registryStatus?: string | null;
    registryProjectUrl?: string | null;
    registryId?: string | null;

    totalAreaHa?: number | null;
    estimatedAnnualRemoval?: string | null;
    readiness?: ProjectReadinessItem[];
    serviceProviders?: ProjectServiceProvider[];
    opportunities?: ProjectOpportunity[];
    updates?: ProjectUpdate[];
    documents?: ProjectDocument[];
    media?: ProjectMediaItem[];
    team?: ProjectTeamMember[];
    sectionVisibility?: Partial<Record<ProjectSectionKey, SectionVisibility>>;

    totalCreditsIssued?: number | null;
    annualEstimatedCredits?: number | null;
    annualEstimateUnit?: string | null;
    firstVintageYear?: number | null;

    creditIssuanceDate?: string | null;
    creditingStart?: string | null;
    creditingEnd?: string | null;
    tenureText?: string | null;
}

export type ProjectCompletenessRule = {
    id: string;
    label: string;
    description?: string;
    section: ProjectSectionKey;
    isComplete: (project: ProjectProfileData) => boolean;
};