import type {
    ProjectCompletenessRule,
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

export const STAGE_COMPLETENESS_RULES: Record<ProjectStage, ProjectCompletenessRule[]> = {
    Exploration: [
        {
            id: 'location',
            label: 'Identify project area or asset',
            description: 'Add country, region, or location context.',
            section: 'location',
            isComplete: (project) => Boolean(project.country || project.region),
        },
        {
            id: 'story',
            label: 'Define initial project context',
            description: 'Describe the problem, context, or early project approach.',
            section: 'story',
            isComplete: (project) =>
                Boolean(project.storyProblem || project.storyApproach || project.description),
        },
        {
            id: 'team',
            label: 'Map stakeholders and collaborators',
            description: 'Add internal team members or service providers.',
            section: 'team',
            isComplete: (project) =>
                Boolean(project.team?.length || project.serviceProviders?.length),
        },
    ],
    Concept: [
        {
            id: 'story-concept',
            label: 'Define project scope and concept',
            description: 'Add project story and intended pathway.',
            section: 'story',
            isComplete: (project) =>
                Boolean(project.storyProblem && project.storyApproach),
        },
        {
            id: 'registry-method',
            label: 'Select standard or methodology',
            description: 'Add registry or methodology details.',
            section: 'registry',
            isComplete: (project) =>
                Boolean(project.registrationPlatform  || project.methodology),
        },
        {
            id: 'documents-concept',
            label: 'Prepare concept note or supporting documentation',
            description: 'Upload concept note, PIN, or related materials.',
            section: 'documents',
            isComplete: (project) => Boolean(project.documents?.length),
        },
    ],
    Design: [
        {
            id: 'documents-design',
            label: 'Add design-stage documents',
            description: 'Upload PDD, plans, assessments, or similar materials.',
            section: 'documents',
            isComplete: (project) => Boolean(project.documents?.length),
        },
        {
            id: 'readiness-design',
            label: 'Track design readiness',
            description:
                'Add readiness items for monitoring, baseline, and implementation progress.',
            section: 'readiness',
            isComplete: (project) => Boolean(project.readiness?.length),
        },
        {
            id: 'media-design',
            label: 'Add media or supporting evidence',
            description: 'Upload site photos, diagrams, or visual material.',
            section: 'media',
            isComplete: (project) => Boolean(project.media?.length),
        },
    ],
    Listed: [
        {
            id: 'registry-listed',
            label: 'Add registry submission details',
            description: 'Record registry platform, status, or project ID.',
            section: 'registry',
            isComplete: (project) =>
                Boolean(project.registrationPlatform  && (project.registryStatus || project.registryId)),
        },
        {
            id: 'documents-listed',
            label: 'Upload listing-related documents',
            description: 'Include materials submitted for listing or review.',
            section: 'documents',
            isComplete: (project) => Boolean(project.documents?.length),
        },
        {
            id: 'updates-listed',
            label: 'Post listing progress update',
            description: 'Add an update once the project enters formal review.',
            section: 'updates',
            isComplete: (project) => Boolean(project.updates?.length),
        },
    ],
    Validation: [
        {
            id: 'registry-validation',
            label: 'Track validation status',
            description: 'Keep registry status current during validation.',
            section: 'registry',
            isComplete: (project) => Boolean(project.registryStatus),
        },
        {
            id: 'readiness-validation',
            label: 'Track validation readiness',
            description: 'Record validation, audit, or corrective-action progress.',
            section: 'readiness',
            isComplete: (project) => Boolean(project.readiness?.length),
        },
        {
            id: 'updates-validation',
            label: 'Post validation update',
            description: 'Share validation milestones or review progress.',
            section: 'updates',
            isComplete: (project) => Boolean(project.updates?.length),
        },
    ],
    Registered: [
        {
            id: 'registry-registered',
            label: 'Complete registration details',
            description:
                'Registry platform, status, and project identifier should be present.',
            section: 'registry',
            isComplete: (project) =>
                Boolean(
                    project.registrationPlatform  &&
                    project.registryStatus &&
                    project.registryId,
                ),
        },
        {
            id: 'impact-registered',
            label: 'Add project impact metrics',
            description:
                'Include area, estimated removals, or similar credit-related figures.',
            section: 'impact',
            isComplete: (project) =>
                Boolean(project.totalAreaHa || project.estimatedAnnualRemoval),
        },
        {
            id: 'readiness-registered',
            label: 'Show operational readiness',
            description: 'Add monitoring or reporting readiness details.',
            section: 'readiness',
            isComplete: (project) => Boolean(project.documents?.length),
        },
    ],
    Issued: [
        {
            id: 'registry-issued',
            label: 'Show issued credit status',
            description: 'Keep issuance-related registry details current.',
            section: 'registry',
            isComplete: (project) =>
                Boolean(project.registrationPlatform  && project.registryStatus),
        },
        {
            id: 'impact-issued',
            label: 'Add issued-project metrics',
            description:
                'Show area, annual estimate, or similar impact information.',
            section: 'impact',
            isComplete: (project) =>
                Boolean(project.totalAreaHa || project.estimatedAnnualRemoval),
        },
        {
            id: 'updates-issued',
            label: 'Post issuance update',
            description: 'Add an update when credits have been issued.',
            section: 'updates',
            isComplete: (project) => Boolean(project.updates?.length),
        },
    ],
    Closed: [
        {
            id: 'updates-closed',
            label: 'Document closure outcome',
            description: 'Add a final update or closure summary.',
            section: 'updates',
            isComplete: (project) => Boolean(project.updates?.length),
        },
        {
            id: 'documents-closed',
            label: 'Upload final records',
            description:
                'Store final reports, lessons learned, or supporting materials.',
            section: 'documents',
            isComplete: (project) => Boolean(project.documents?.length),
        },
    ],
};