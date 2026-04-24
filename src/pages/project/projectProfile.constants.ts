import type {
    ProjectProfileData,
    ProjectSectionKey,
    ProjectStage,
} from './projectProfile.types';

export const STAGE_ORDER: ProjectStage[] = [
    'Exploration',
    'Concept',
    'Design',
    'Listed',
    'Validation',
    'Registered',
    'Issued',
    'Closed',
];

export const stageDescriptions: Record<ProjectStage, string> = {
    Exploration:
        'A potential project is being explored, but key project boundaries and implementation details are still early.',
    Concept:
        'The project is defined in principle, with intended pathway and core structure identified.',
    Design:
        'The project is materially designed, with documentation and implementation planning underway.',
    Listed:
        'The project has been submitted and listed for review.',
    Validation:
        'The project is undergoing third-party validation.',
    Registered:
        'The project is registered and eligible for issuance subject to monitoring and verification.',
    Issued:
        'The project has had credits issued.',
    Closed:
        'The project is no longer active.',
};

import type { CompletenessItem } from '../../components/ProfileCompleteness';

export type ChecklistStageColumn =
    | 'Exploration'
    | 'Concept'
    | 'Design'
    | 'Listed'
    | 'Validation'
    | 'Registered'
    | 'Issued';

export type ProjectChecklistDefinition = {
    id: string;
    label: string;
    description?: string;
    section: ProjectSectionKey | 'cover' | 'settings';
    stages: ChecklistStageColumn[];
    isComplete: (project: ProjectProfileData) => boolean;
};

function hasText(value: unknown): boolean {
    return typeof value === 'string' ? value.trim().length > 0 : false;
}

function hasValidUrl(value: unknown): boolean {
    if (!hasText(value)) return false;

    try {
        new URL(String(value).trim());
        return true;
    } catch {
        return false;
    }
}

function normalizeText(value: unknown): string {
    return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

function getDocumentSearchBlob(document: unknown): string {
    if (!document || typeof document !== 'object') return '';

    const doc = document as Record<string, unknown>;
    const metadata =
        doc.metadata && typeof doc.metadata === 'object'
            ? (doc.metadata as Record<string, unknown>)
            : {};

    return [
        doc.type,
        doc.documentType,
        doc.kind,
        doc.category,
        doc.title,
        doc.name,
        doc.label,
        metadata.type,
        metadata.documentType,
        metadata.kind,
        metadata.category,
        metadata.title,
        metadata.name,
    ]
        .map(normalizeText)
        .filter(Boolean)
        .join(' ');
}

function getDocumentStatus(document: unknown): string {
    if (!document || typeof document !== 'object') return '';

    const doc = document as Record<string, unknown>;
    const metadata =
        doc.metadata && typeof doc.metadata === 'object'
            ? (doc.metadata as Record<string, unknown>)
            : {};

    return normalizeText(
        doc.status ??
            doc.documentStatus ??
            metadata.status ??
            metadata.documentStatus
    );
}

function projectHasDocument(
    project: ProjectProfileData,
    typeMatchers: string[],
    status?: 'draft' | 'final'
): boolean {
    return (project.documents ?? []).some((document) => {
        const blob = getDocumentSearchBlob(document);
        const docStatus = getDocumentStatus(document);

        const matchesType = typeMatchers.some((matcher) => blob.includes(matcher));
        if (!matchesType) return false;

        if (!status) return true;
        return docStatus === status;
    });
}

export function getChecklistStageColumn(stage: ProjectStage | string | null | undefined): ChecklistStageColumn | null {
    const normalized = typeof stage === 'string' ? stage.trim().toLowerCase() : '';

    switch (normalized) {
        case 'exploration':
            return 'Exploration';
        case 'concept':
            return 'Concept';
        case 'design':
            return 'Design';
        case 'listed':
            return 'Listed';
        case 'validation':
            return 'Validation';
        case 'registered':
            return 'Registered';
        case 'issued':
            return 'Issued';
        default:
            return null;
    }
}

export const PROJECT_CHECKLIST_DEFINITIONS: ProjectChecklistDefinition[] = [
    {
        id: 'developer-organization',
        label: 'Add the developer organization',
        section: 'overview',
        stages: ['Exploration', 'Concept', 'Design', 'Listed', 'Validation', 'Registered', 'Issued'],
        isComplete: (project) => hasText(project.companyName),
    },
    {
        id: 'project-name',
        label: 'Add the project name',
        section: 'overview',
        stages: ['Exploration', 'Concept', 'Design', 'Listed', 'Validation', 'Registered', 'Issued'],
        isComplete: (project) => hasText(project.name),
    },
    {
        id: 'short-description',
        label: 'Add a short tagline to your project',
        description: 'Input 1 or more characters',
        section: 'overview',
        stages: ['Exploration', 'Concept', 'Design', 'Listed', 'Validation', 'Registered', 'Issued'],
        isComplete: (project) => hasText(project.description),
    },
    {
        id: 'project-type',
        label: 'Select the project type',
        section: 'overview',
        stages: ['Exploration', 'Concept', 'Design', 'Listed', 'Validation', 'Registered', 'Issued'],
        isComplete: (project) => hasText(project.type),
    },
    {
        id: 'current-stage',
        label: 'Set the current stage',
        section: 'overview',
        stages: ['Exploration', 'Concept', 'Design', 'Listed', 'Validation', 'Registered', 'Issued'],
        isComplete: (project) => hasText(project.stage),
    },
    {
        id: 'visibility',
        label: 'Set the project visibility',
        section: 'settings',
        stages: ['Exploration', 'Concept', 'Design', 'Listed', 'Validation', 'Registered', 'Issued'],
        isComplete: (project) => hasText(project.projectVisibility),
    },
    {
        id: 'country',
        label: 'Add the project country',
        section: 'overview',
        stages: ['Exploration', 'Concept', 'Design', 'Listed', 'Validation', 'Registered', 'Issued'],
        isComplete: (project) => hasText(project.country),
    },
    {
        id: 'region',
        label: 'Add the state or region',
        section: 'overview',
        stages: ['Exploration', 'Concept', 'Design', 'Listed', 'Validation', 'Registered', 'Issued'],
        isComplete: (project) => hasText(project.region),
    },
    {
        id: 'problem-context',
        label: 'Share the problem and context of your project',
        description: 'Input 1 or more characters',
        section: 'story',
        stages: ['Exploration', 'Concept', 'Design', 'Listed', 'Validation', 'Registered', 'Issued'],
        isComplete: (project) => hasText(project.storyProblem),
    },
    {
        id: 'project-approach',
        label: 'Share the approach of your project',
        description: 'Input 1 or more characters',
        section: 'story',
        stages: ['Exploration', 'Concept', 'Design', 'Listed', 'Validation', 'Registered', 'Issued'],
        isComplete: (project) => hasText(project.storyApproach),
    },
    {
        id: 'project-cover',
        label: 'Add a project cover',
        description: 'Upload an image for project cover',
        section: 'cover',
        stages: ['Exploration', 'Concept', 'Design', 'Listed', 'Validation', 'Registered', 'Issued'],
        isComplete: (project) => hasText(project.coverImageUrl),
    },
    {
        id: 'updates',
        label: 'Share an update about your project',
        description: 'Post first project update',
        section: 'updates',
        stages: ['Concept', 'Design', 'Listed', 'Validation', 'Registered', 'Issued'],
        isComplete: (project) => (project.updates?.length ?? 0) > 0,
    },
    {
        id: 'media',
        label: 'Add some media to showcase your project',
        description: 'Upload 1 or more media (not including project cover)',
        section: 'media',
        stages: ['Concept', 'Design', 'Listed', 'Validation', 'Registered', 'Issued'],
        isComplete: (project) => (project.media?.length ?? 0) > 0,
    },
    {
        id: 'concept-note',
        label: 'Share your project concept note',
        description: 'Upload a document with Document Type = Concept Note',
        section: 'documents',
        stages: ['Concept'],
        isComplete: (project) => projectHasDocument(project, ['concept note']),
    },
    {
        id: 'feasibility-study',
        label: 'Share your project’s feasibility study',
        description: 'Upload a document with Document Type = Feasibility Study',
        section: 'documents',
        stages: ['Design'],
        isComplete: (project) => projectHasDocument(project, ['feasibility study']),
    },
    {
        id: 'pdd-draft',
        label: 'Share your Project Design Document (PDD) draft',
        description: 'Upload a document with Document Type = PDD and Status = Draft',
        section: 'documents',
        stages: ['Design', 'Listed', 'Validation'],
        isComplete: (project) => projectHasDocument(project, ['pdd', 'project design document'], 'draft'),
    },
    {
        id: 'project-partners',
        label: 'Share who your project partners are',
        description: 'List 1 or more project partners',
        section: 'team',
        stages: ['Design', 'Listed', 'Validation', 'Registered', 'Issued'],
        isComplete: (project) => (project.team?.length ?? 0) > 0,
    },
    {
        id: 'registry-platform',
        label: 'Share which registry your project is listed on',
        description: 'Select an option',
        section: 'registry',
        stages: ['Listed', 'Validation', 'Registered', 'Issued'],
        isComplete: (project) => hasText(project.registrationPlatform),
    },
    {
        id: 'registry-id',
        label: 'Share your project’s official registry ID',
        description: 'Input 1 or more characters',
        section: 'registry',
        stages: ['Listed', 'Validation', 'Registered', 'Issued'],
        isComplete: (project) => hasText(project.registryId),
    },
    {
        id: 'registry-listing-url',
        label: 'Share your project’s official registry link',
        description: 'Input a valid URL',
        section: 'registry',
        stages: ['Listed', 'Validation', 'Registered', 'Issued'],
        isComplete: (project) => hasValidUrl(project.registryProjectUrl),
    },
    {
        id: 'registry-status',
        label: 'Share your project’s current registry status',
        description: 'Select an option',
        section: 'registry',
        stages: ['Listed', 'Validation', 'Registered', 'Issued'],
        isComplete: (project) =>
            hasText(project.registryStatus) &&
            normalizeText(project.registryStatus) !== 'not started',
    },
    {
        id: 'methodology',
        label: 'Share your project’s methodology',
        description: 'Input 1 or more characters',
        section: 'registry',
        stages: ['Listed', 'Validation', 'Registered', 'Issued'],
        isComplete: (project) => hasText(project.methodology),
    },
    {
        id: 'validation-report-awaiting-approval',
        label: 'Share your validation report awaiting approval',
        description: 'Upload a document with Document Type = Validation Report',
        section: 'documents',
        stages: ['Validation'],
        isComplete: (project) => projectHasDocument(project, ['validation report']),
    },
    {
        id: 'validation-report-final',
        label: 'Share your approved validation report',
        description: 'Upload a document with Document Type = Validation Report and Status = Final',
        section: 'documents',
        stages: ['Registered', 'Issued'],
        isComplete: (project) => projectHasDocument(project, ['validation report'], 'final'),
    },
    {
        id: 'pdd-final',
        label: 'Share your finalized Project Design Document (PDD)',
        description: 'Upload a document with Document Type = PDD and Status = Final',
        section: 'documents',
        stages: ['Registered', 'Issued'],
        isComplete: (project) => projectHasDocument(project, ['pdd', 'project design document'], 'final'),
    },
    {
        id: 'total-credits-issued',
        label: 'Share your project’s total credits issued',
        description: 'Input numerical value more than 1',
        section: 'impact',
        stages: ['Registered', 'Issued'],
        isComplete: (project) =>
            typeof project.totalCreditsIssued === 'number' && project.totalCreditsIssued > 1,
    },
    {
        id: 'annual-estimate',
        label: 'Share your project’s estimated annual carbon impact',
        description: 'Input 1 or more characters',
        section: 'impact',
        stages: ['Registered', 'Issued'],
        isComplete: (project) =>
            hasText(project.annualEstimatedCredits) || hasText(project.estimatedAnnualRemoval),
    },
    {
        id: 'crediting-period',
        label: 'Share your project’s crediting period',
        description: 'Input valid dates for Crediting Start and Crediting End',
        section: 'impact',
        stages: ['Registered', 'Issued'],
        isComplete: (project) => Boolean(project.creditingStart && project.creditingEnd),
    },
    {
        id: 'monitoring-report',
        label: 'Share your monitoring report',
        description: 'Upload a document with Document Type = Monitoring Report',
        section: 'documents',
        stages: ['Issued'],
        isComplete: (project) => projectHasDocument(project, ['monitoring report']),
    },
    {
        id: 'verification-report',
        label: 'Share your verification report',
        description: 'Upload a document with Document Type = Verification Report',
        section: 'documents',
        stages: ['Issued'],
        isComplete: (project) => projectHasDocument(project, ['verification report']),
    },
];

export function getProjectCompletenessItems(project: ProjectProfileData): CompletenessItem[] {
    const stageColumn = getChecklistStageColumn(project.stage);

    if (!stageColumn) return [];

    return PROJECT_CHECKLIST_DEFINITIONS
        .filter((item) => item.stages.length === 1
            ? item.stages[0] === stageColumn
            : item.stages.includes(stageColumn)
        )
        .map((item) => ({
            id: item.id,
            label: item.label,
            description: item.description,
            isComplete: item.isComplete(project),
            section: item.section,
            requiredForStage: project.stage,
        }));
}