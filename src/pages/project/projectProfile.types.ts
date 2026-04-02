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
export type ProjectEditorTarget = ProjectSectionKey | 'settings';

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
    userId: string;
    name: string;
    role?: string;
    companyName?: string;
    avatarUrl?: string | null;
    permission?: 'creator' | 'viewer' | null;
}

export interface ProjectOpportunity {
    id: string;
    type: string;
    description?: string | null;
    urgent?: boolean;
}

export interface ProjectDocument {
    id: string;
    name: string;
    type?: string | null;
    status?: string | null;
    dateLabel?: string | null;
}

export interface ProjectMediaItem {
    id: string;
    url: string;
    caption?: string | null;
    dateLabel?: string | null;
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
    registryName?: string | null;
    registryStatus?: string | null;
    registryProjectId?: string | null;
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
}

export type ProjectCompletenessRule = {
    id: string;
    label: string;
    description?: string;
    section: ProjectSectionKey;
    isComplete: (project: ProjectProfileData) => boolean;
};