import React from 'react';
import {
    Alert,
    Avatar,
    Box,
    Button,
    Chip,
    Collapse,
    Grid,
    IconButton,
    Link,
    Paper,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Tooltip,
    Typography,
    MenuItem,
    Menu,
    Popper,
} from '@mui/material';
import EditRounded from '@mui/icons-material/EditRounded';
import AddRounded from '@mui/icons-material/AddRounded';
import LocationOnRounded from '@mui/icons-material/LocationOnRounded';
import BusinessRounded from '@mui/icons-material/BusinessRounded';
import DescriptionRounded from '@mui/icons-material/DescriptionRounded';
import AttachMoneyRounded from '@mui/icons-material/AttachMoneyRounded';
import PeopleRounded from '@mui/icons-material/PeopleRounded';
import ShieldRounded from '@mui/icons-material/ShieldRounded';
import LockRounded from '@mui/icons-material/LockRounded';
import PhotoCameraRounded from '@mui/icons-material/PhotoCameraRounded';
import BookmarkBorderRounded from '@mui/icons-material/BookmarkBorderRounded';
import BookmarkRounded from '@mui/icons-material/BookmarkRounded';
import ShareRounded from '@mui/icons-material/ShareRounded';
import ExpandMoreRounded from '@mui/icons-material/ExpandMoreRounded';
import ExpandLessRounded from '@mui/icons-material/ExpandLessRounded';
import InfoOutlined from '@mui/icons-material/InfoOutlined';
import ArrowBackRounded from '@mui/icons-material/ArrowBackRounded';
import TuneRounded from '@mui/icons-material/TuneRounded';
import OpenInNewRounded from '@mui/icons-material/OpenInNewRounded';
import { Link as RouterLink } from 'react-router-dom';

import { ProfileCompleteness, type CompletenessItem } from '../../components/ProfileCompleteness';
import { MediaGallery } from '../../components/MediaGallery';
import { CloseRounded } from '@mui/icons-material';

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
    memberType: CollaboratorEntityType;
    memberId: string;
    userId?: string | null;
    companyId?: string | null;
    name: string;
    role?: string | null;
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
    kind?: string | null;
    assetUrl: string;
    contentType?: string | null;
    name?: string | null;
    type?: string | null;
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
    projectVisibility?: 'Public' | 'Private' | 'Draft' | null;
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

export interface ProjectUpdate {
    id: string;
    title: string;
    description?: string | null;
    dateLabel?: string | null;
    authorName?: string | null;
    type?: 'progress' | 'stage' | null;
}

export interface ProjectServiceProvider {
    id: string;
    name: string;
    type?: string | null;
}

export interface ProjectProfileViewProps {
    project: ProjectProfileData;
    mode: 'read' | 'edit';
    currentUserRole: ProjectRole | null;
    access: ProjectAccess;
    canEdit: boolean;
    isSaved?: boolean;
    onToggleSave?: () => void;
    onBack?: () => void;
    onShare?: () => void;
    onOpenEditor?: (section: ProjectEditorTarget) => void;
    onOpenSettings?: () => void;
    renderSidebarAnchor?: React.ReactNode;
    headerBar?: {
        backLabel?: string;
        contextLabel?: string | null;
        showSettingsButton?: boolean;
    };
}

const STAGE_ORDER: ProjectStage[] = [
    'Exploration',
    'Concept',
    'Design',
    'Listed',
    'Validation',
    'Registered',
    'Issued',
    'Closed',
];

const stageDescriptions: Record<ProjectStage, string> = {
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

type ProjectCompletenessRule = {
    id: string;
    label: string;
    description?: string;
    section: ProjectSectionKey;
    isComplete: (project: ProjectProfileData) => boolean;
};

const STAGE_COMPLETENESS_RULES: Record<ProjectStage, ProjectCompletenessRule[]> = {
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
            isComplete: (project) => Boolean(project.storyProblem || project.storyApproach || project.description),
        },
        {
            id: 'team',
            label: 'Map stakeholders and collaborators',
            description: 'Add internal team members or service providers.',
            section: 'team',
            isComplete: (project) => Boolean(project.team?.length || project.serviceProviders?.length),
        },
    ],
    Concept: [
        {
            id: 'story-concept',
            label: 'Define project scope and concept',
            description: 'Add project story and intended pathway.',
            section: 'story',
            isComplete: (project) => Boolean(project.storyProblem && project.storyApproach),
        },
        {
            id: 'registry-method',
            label: 'Select standard or methodology',
            description: 'Add registry or methodology details.',
            section: 'registry',
            isComplete: (project) => Boolean(project.registryName || project.methodology),
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
            description: 'Add readiness items for monitoring, baseline, and implementation progress.',
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
                Boolean(project.registryName && (project.registryStatus || project.registryProjectId)),
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
            description: 'Registry platform, status, and project identifier should be present.',
            section: 'registry',
            isComplete: (project) =>
                Boolean(project.registryName && project.registryStatus && project.registryProjectId),
        },
        {
            id: 'impact-registered',
            label: 'Add project impact metrics',
            description: 'Include area, estimated removals, or similar credit-related figures.',
            section: 'impact',
            isComplete: (project) => Boolean(project.totalAreaHa || project.estimatedAnnualRemoval),
        },
        {
            id: 'readiness-registered',
            label: 'Show operational readiness',
            description: 'Add monitoring or reporting readiness details.',
            section: 'readiness',
            isComplete: (project) => Boolean(project.readiness?.length),
        },
    ],
    Issued: [
        {
            id: 'registry-issued',
            label: 'Show issued credit status',
            description: 'Keep issuance-related registry details current.',
            section: 'registry',
            isComplete: (project) => Boolean(project.registryName && project.registryStatus),
        },
        {
            id: 'impact-issued',
            label: 'Add issued-project metrics',
            description: 'Show area, annual estimate, or similar impact information.',
            section: 'impact',
            isComplete: (project) => Boolean(project.totalAreaHa || project.estimatedAnnualRemoval),
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
            description: 'Store final reports, lessons learned, or supporting materials.',
            section: 'documents',
            isComplete: (project) => Boolean(project.documents?.length),
        },
    ],
};

function getProjectCompletenessItems(project: ProjectProfileData): CompletenessItem[] {
    const currentStageIndex = STAGE_ORDER.indexOf(project.stage);

    const rules = STAGE_ORDER
        .slice(0, currentStageIndex + 1)
        .flatMap((stage) => STAGE_COMPLETENESS_RULES[stage] || []);

    const deduped = new Map<string, CompletenessItem>();

    for (const rule of rules) {
        if (!deduped.has(rule.id)) {
            deduped.set(rule.id, {
                id: rule.id,
                label: rule.label,
                description: rule.description,
                isComplete: rule.isComplete(project),
                section: rule.section,
                requiredForStage: project.stage,
            });
        }
    }

    return Array.from(deduped.values());
}

function getVisibleSections(project: ProjectProfileData, access: ProjectAccess): Set<ProjectSectionKey> {
    const allSections: ProjectSectionKey[] = [
        'overview',
        'story',
        'location',
        'readiness',
        'registry',
        'impact',
        'opportunities',
        'updates',
        'documents',
        'media',
        'team',
    ];

    if (access.projectRole === 'creator') {
        return new Set(allSections);
    }

    const visible = new Set<ProjectSectionKey>();

    for (const key of allSections) {
        const vis = project.sectionVisibility?.[key] ?? 'public';

        if (vis === 'public') {
            visible.add(key);
            continue;
        }

        if (vis === 'private' && access.canViewPrivateSections) {
            visible.add(key);
        }
    }

    return visible;
}

function shouldShowStageSection(section: ProjectSectionKey, stage: ProjectStage): boolean {
    switch (section) {
        case 'readiness':
            return !['Closed'].includes(stage);

        case 'registry':
            return ['Design', 'Listed', 'Validation', 'Registered', 'Issued', 'Closed'].includes(stage);

        case 'impact':
            return ['Registered', 'Issued', 'Closed'].includes(stage);

        case 'opportunities':
            return !['Closed'].includes(stage);

        case 'updates':
            return !['Exploration'].includes(stage);

        default:
            return true;
    }
}

const sectionHeaderIconButtonSx = {
    color: 'grey.700',
    bgcolor: 'white',
    border: 1,
    borderColor: 'grey.300',
    width: 28,
    height: 28,
    '&:hover': {
        color: 'primary.main',
        bgcolor: 'primary.50',
        borderColor: 'primary.main',
    },
} as const;

function CollaboratorsCard({
    project,
    canEdit,
    onOpenEditor,
    sidebarEditSx,
}: {
    project: ProjectProfileData;
    canEdit: boolean;
    onOpenEditor?: (section: ProjectEditorTarget) => void;
    sidebarEditSx: Record<string, unknown>;
}) {
    const developerName = project.companyName?.trim();
    const team = project.team || [];
    const hasDeveloper = Boolean(developerName);
    const hasTeam = team.length > 0;
    const hasPeople = hasDeveloper || hasTeam;

    const sectionLabelSx = {
        display: 'block',
        mb: 1,
        color: 'text.disabled',
        fontSize: '0.75rem',
        fontWeight: 500,
    } as const;

    const rowSx = {
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        mx: -1,
        px: 1,
        py: 0.875,
        borderRadius: 1.5,
        minWidth: 0,
        '&:hover': {
            bgcolor: 'grey.50',
        },
    } as const;

    const iconBoxSx = {
        width: 32,
        height: 32,
        borderRadius: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        border: '1px solid',
        borderColor: 'grey.200',
        bgcolor: 'grey.50',
    } as const;

    return (
        <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden', width: '100%' }}>
            <Box
                p={1.5}
                borderBottom={1}
                borderColor="grey.100"
                display="flex"
                alignItems="center"
                justifyContent="space-between"
                bgcolor="grey.50"
            >
                <Typography variant="caption" fontWeight="bold" color="text.primary">
                    Project Collaborators
                </Typography>

                {canEdit ? (
                    <IconButton size="small" onClick={() => onOpenEditor?.('team')} sx={sidebarEditSx}>
                        <AddRounded sx={{ fontSize: 16 }} />
                    </IconButton>
                ) : null}
            </Box>

            <Box p={2}>
                {hasPeople ? (
                    <Stack spacing={2}>
                        {hasDeveloper ? (
                            <Box>
                                <Typography sx={sectionLabelSx}>Developer</Typography>

                                <Box sx={rowSx}>
                                    <Box sx={{ ...iconBoxSx, bgcolor: 'grey.100', borderColor: 'transparent' }}>
                                        <BusinessRounded sx={{ fontSize: 16, color: 'grey.500' }} />
                                    </Box>

                                    <Box minWidth={0} flex={1}>
                                        <Typography variant="body2" fontWeight={600} color="text.primary" noWrap>
                                            {developerName}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            Lead Developer
                                        </Typography>
                                    </Box>
                                </Box>
                            </Box>
                        ) : null}

                        {hasTeam ? (
                            <Box>
                                <Typography sx={sectionLabelSx}>Team</Typography>

                                <Stack spacing={0.5}>
                                    {team.map((member) => {
                                        const key =
                                            member.memberId ||
                                            member.userId ||
                                            member.companyId ||
                                            member.id;

                                        const isCompanyMember = member.memberType === 'company';

                                        return (
                                            <Box key={key} sx={rowSx}>
                                                {isCompanyMember ? (
                                                    <Box sx={iconBoxSx}>
                                                        <BusinessRounded sx={{ fontSize: 16, color: 'grey.500' }} />
                                                    </Box>
                                                ) : member.avatarUrl ? (
                                                    <Avatar src={member.avatarUrl} alt={member.name} sx={{ width: 32, height: 32 }} />
                                                ) : (
                                                    <Box sx={iconBoxSx}>
                                                        <PeopleRounded sx={{ fontSize: 16, color: 'grey.500' }} />
                                                    </Box>
                                                )}

                                                <Box minWidth={0} flex={1}>
                                                    <Typography variant="body2" fontWeight={600} color="text.primary" noWrap>
                                                        {member.name}
                                                    </Typography>

                                                    <Typography variant="caption" color="text.secondary" noWrap>
                                                        {member.role ||
                                                            (member.permission === 'creator'
                                                                ? 'Owner'
                                                                : member.permission === 'viewer'
                                                                    ? 'Viewer'
                                                                    : isCompanyMember
                                                                        ? 'Company Collaborator'
                                                                        : 'Team Member')}
                                                        {member.companyName && !isCompanyMember ? ` • ${member.companyName}` : ''}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        );
                                    })}
                                </Stack>
                            </Box>
                        ) : null}
                    </Stack>
                ) : (
                    <Typography variant="body2" color="text.secondary">
                        No collaborators added yet.
                    </Typography>
                )}
            </Box>
        </Paper>
    );
}

function SectionCard(props: {
    title: string;
    subtitle?: string;
    children: React.ReactNode;
    editable?: boolean;
    addable?: boolean;
    onEdit?: () => void;
    onAdd?: () => void;
    empty?: boolean;
    emptyText?: string;
    emptyActionLabel?: string;
    onEmptyAction?: () => void;
    isOwner?: boolean;
    visibility?: SectionVisibility;
    onVisibilityChange?: (v: SectionVisibility) => void;
}) {
    const {
        title,
        subtitle,
        children,
        editable,
        addable,
        onEdit,
        onAdd,
        empty,
        emptyText,
        emptyActionLabel,
        onEmptyAction,
        isOwner = false,
        visibility = 'public',
        onVisibilityChange,
    } = props;

    const [visMenuAnchor, setVisMenuAnchor] = React.useState<null | HTMLElement>(null);
    const isPrivate = visibility === 'private';

    return (
        <Paper
            variant="outlined"
            sx={{
                borderRadius: 2,
                overflow: 'hidden',
                width: '100%',
                mb: 0,
                opacity: isPrivate ? 0.78 : 1,
                borderColor: isPrivate ? '#ffcc80' : undefined,
            }}
        >
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    p: 2,
                    borderBottom: 1,
                    borderColor: 'grey.100',
                    bgcolor: isPrivate ? '#fff8e1' : 'grey.50',
                    gap: 1,
                }}
            >
                <Box minWidth={0} display="flex" alignItems="center" gap={1} flexWrap="wrap">
                    <Typography variant="subtitle2" fontWeight="bold" color="text.primary">
                        {title}
                    </Typography>

                    {isPrivate && isOwner ? (
                        <Chip
                            icon={<LockRounded sx={{ fontSize: 14 }} />}
                            label="Private"
                            size="small"
                            sx={{
                                height: 22,
                                fontSize: '0.625rem',
                                bgcolor: '#fff3e0',
                                color: '#ed6c02',
                                border: 1,
                                borderColor: '#ffcc80',
                                fontWeight: 600,
                                '& .MuiChip-icon': {
                                    color: '#ed6c02',
                                },
                            }}
                        />
                    ) : null}

                    {subtitle ? (
                        <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ display: 'block', ml: { xs: 0, sm: 0.5 } }}
                        >
                            {subtitle}
                        </Typography>
                    ) : null}
                </Box>

                <Box display="flex" alignItems="center" gap={1} flexShrink={0}>
                    {isOwner && onVisibilityChange ? (
                        <>
                            <Tooltip
                                title={isPrivate ? 'Private: only users with project permission can view' : 'Public: anyone can view'}
                                arrow
                                placement="top"
                            >
                                <IconButton
                                    size="small"
                                    onClick={(e) => setVisMenuAnchor(e.currentTarget)}
                                    sx={{
                                        color: isPrivate ? '#ed6c02' : 'grey.500',
                                        p: 0.5,
                                        '&:hover': {
                                            color: 'grey.700',
                                            bgcolor: 'grey.100',
                                        },
                                    }}
                                >
                                    {isPrivate ? <LockRounded sx={{ fontSize: 16 }} /> : <ShieldRounded sx={{ fontSize: 16 }} />}
                                </IconButton>
                            </Tooltip>

                            <Menu
                                anchorEl={visMenuAnchor}
                                open={Boolean(visMenuAnchor)}
                                onClose={() => setVisMenuAnchor(null)}
                                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                                PaperProps={{
                                    sx: {
                                        minWidth: 180,
                                        boxShadow: 3,
                                        borderRadius: 1.5,
                                    },
                                }}
                            >
                                <Box px={1.5} pt={1} pb={0.5}>
                                    <Typography
                                        variant="caption"
                                        color="text.secondary"
                                        fontWeight={600}
                                        sx={{
                                            textTransform: 'uppercase',
                                            letterSpacing: 0.5,
                                            fontSize: '0.6rem',
                                        }}
                                    >
                                        Section visibility
                                    </Typography>
                                </Box>

                                <MenuItem
                                    selected={visibility === 'public'}
                                    onClick={() => {
                                        onVisibilityChange('public');
                                        setVisMenuAnchor(null);
                                    }}
                                >
                                    Public
                                </MenuItem>

                                <MenuItem
                                    selected={visibility === 'private'}
                                    onClick={() => {
                                        onVisibilityChange('private');
                                        setVisMenuAnchor(null);
                                    }}
                                >
                                    Private
                                </MenuItem>
                            </Menu>
                        </>
                    ) : null}

                    {addable ? (
                        <IconButton
                            size="small"
                            onClick={onAdd}
                            sx={{
                                color: 'grey.700',
                                bgcolor: 'white',
                                border: 1,
                                borderColor: 'grey.300',
                                width: 32,
                                height: 32,
                                '&:hover': {
                                    color: 'primary.main',
                                    bgcolor: 'primary.50',
                                    borderColor: 'primary.main',
                                },
                            }}
                        >
                            <AddRounded sx={{ fontSize: 18 }} />
                        </IconButton>
                    ) : null}

                    {editable ? (
                        <IconButton
                            size="small"
                            onClick={onEdit}
                            sx={{
                                color: 'grey.700',
                                bgcolor: 'white',
                                border: 1,
                                borderColor: 'grey.300',
                                width: 32,
                                height: 32,
                                '&:hover': {
                                    color: 'primary.main',
                                    bgcolor: 'primary.50',
                                    borderColor: 'primary.main',
                                },
                            }}
                        >
                            <EditRounded sx={{ fontSize: 18 }} />
                        </IconButton>
                    ) : null}
                </Box>
            </Box>

            <Box p={3}>
                {empty ? (
                    <Box textAlign="center" py={1}>
                        <Typography variant="body2" color="text.secondary">
                            {emptyText || 'Nothing added yet'}
                        </Typography>

                        {emptyActionLabel && onEmptyAction ? (
                            <Button
                                size="small"
                                startIcon={<AddRounded sx={{ fontSize: 14 }} />}
                                onClick={onEmptyAction}
                                sx={{ mt: 1, textTransform: 'none' }}
                            >
                                {emptyActionLabel}
                            </Button>
                        ) : null}
                    </Box>
                ) : (
                    children
                )}
            </Box>
        </Paper>
    );
}

function StagePill({ stage }: { stage: ProjectStage }) {
    const index = STAGE_ORDER.indexOf(stage);
    return (
        <Tooltip title={stageDescriptions[stage]}>
            <Chip
                label={stage}
                color={index >= 5 ? 'success' : index >= 3 ? 'primary' : 'default'}
                variant={index >= 3 ? 'filled' : 'outlined'}
            />
        </Tooltip>
    );
}

function ReadinessChip({ status }: { status: ProjectReadinessItem['status'] }) {
    const map: Record<
        ProjectReadinessItem['status'],
        { label: string; color: 'default' | 'success' | 'warning' | 'info' }
    > = {
        yes: { label: 'Ready', color: 'success' },
        progress: { label: 'In progress', color: 'info' },
        seeking: { label: 'Seeking', color: 'warning' },
        na: { label: 'Not started', color: 'default' },
    };

    return <Chip size="small" label={map[status].label} color={map[status].color} variant="outlined" />;
}

function SidebarCard({
    title,
    children,
    canEdit,
    onEdit,
    headerBg = 'white',
}: {
    title: string;
    children: React.ReactNode;
    canEdit?: boolean;
    onEdit?: () => void;
    headerBg?: string;
}) {
    return (
        <Paper
            variant="outlined"
            sx={{
                borderRadius: 2,
                overflow: 'hidden',
                width: '100%',
            }}
        >
            <Box
                p={1.5}
                borderBottom={1}
                borderColor="grey.100"
                display="flex"
                alignItems="center"
                justifyContent="space-between"
                bgcolor={headerBg}
            >
                <Typography
                    variant="caption"
                    fontWeight="bold"
                    color="text.primary"
                    sx={{ textTransform: 'uppercase', letterSpacing: '0.04em' }}
                >
                    {title}
                </Typography>

                {canEdit && onEdit ? (
                    <IconButton size="small" onClick={onEdit} sx={sectionHeaderIconButtonSx}>
                        <EditRounded sx={{ fontSize: 16 }} />
                    </IconButton>
                ) : null}
            </Box>

            <Box p={1.5}>{children}</Box>
        </Paper>
    );
}

function CompactStageTrack({ stage }: { stage: ProjectStage }) {
    const stageIndex = STAGE_ORDER.indexOf(stage);

    return (
        <Box
            sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                position: 'relative',
                py: 1,
            }}
        >
            <Box
                sx={{
                    position: 'absolute',
                    top: '50%',
                    left: 0,
                    right: 0,
                    height: 2,
                    bgcolor: 'grey.200',
                    zIndex: 0,
                    transform: 'translateY(-50%)',
                }}
            />

            <Box
                sx={{
                    position: 'absolute',
                    top: '50%',
                    left: 0,
                    width: `${(stageIndex / (STAGE_ORDER.length - 1)) * 100}%`,
                    height: 2,
                    bgcolor: 'grey.800',
                    zIndex: 0,
                    transform: 'translateY(-50%)',
                    transition: 'width 0.3s ease',
                }}
            />

            {STAGE_ORDER.map((item, i) => {
                const isActive = i === stageIndex;
                const isCompleted = i < stageIndex;

                return (
                    <Tooltip key={item} title={`${item}: ${stageDescriptions[item]}`} arrow placement="top">
                        <Box
                            sx={{
                                width: isActive ? 16 : 10,
                                height: isActive ? 16 : 10,
                                borderRadius: '50%',
                                bgcolor: isCompleted || isActive ? 'grey.800' : 'white',
                                border: 2,
                                borderColor: isCompleted || isActive ? 'grey.800' : 'grey.300',
                                zIndex: 1,
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                '&:hover': {
                                    transform: 'scale(1.2)',
                                },
                            }}
                        />
                    </Tooltip>
                );
            })}
        </Box>
    );
}

function isSectionEditable(section: ProjectSectionKey): boolean {
    switch (section) {
        case 'readiness':
            return false;
        default:
            return true;
    }
}

function ReadinessSidebarCard({
    stage,
    readiness,
    canEdit,
    onEdit,
}: {
    stage: ProjectStage;
    readiness?: ProjectReadinessItem[];
    canEdit: boolean;
    onEdit?: () => void;
}) {
    const [open, setOpen] = React.useState(false);

    return (
        <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden', width: '100%' }}>
            <Box
                p={1.5}
                borderBottom={1}
                borderColor="grey.100"
                display="flex"
                alignItems="center"
                justifyContent="space-between"
                bgcolor="white"
            >
                <Box display="flex" alignItems="center" gap={0.5}>
                    <Typography
                        variant="caption"
                        fontWeight="bold"
                        color="text.primary"
                        sx={{ textTransform: 'uppercase', letterSpacing: '0.04em' }}
                    >
                        Progress
                    </Typography>
                    <IconButton
                        size="small"
                        sx={{
                            width: 18,
                            height: 18,
                            color: 'grey.400',
                            '&:hover': { color: 'primary.main', bgcolor: 'primary.50' },
                        }}
                        title={stageDescriptions[stage]}
                    >
                        <InfoOutlined sx={{ fontSize: 14 }} />
                    </IconButton>
                </Box>

                {canEdit ? (
                    <IconButton size="small" onClick={onEdit} sx={sectionHeaderIconButtonSx}>
                        <EditRounded sx={{ fontSize: 16 }} />
                    </IconButton>
                ) : null}
            </Box>

            <Box p={1.5}>
                <CompactStageTrack stage={stage} />
            </Box>

            <Box borderTop={1} borderColor="grey.100">
                <Button
                    fullWidth
                    onClick={() => setOpen((v) => !v)}
                    endIcon={open ? <ExpandLessRounded sx={{ fontSize: 12 }} /> : <ExpandMoreRounded sx={{ fontSize: 12 }} />}
                    sx={{
                        justifyContent: 'space-between',
                        px: 1.5,
                        py: 1.5,
                        textTransform: 'none',
                        color: 'text.secondary',
                        fontSize: '0.75rem',
                    }}
                >
                    Readiness details
                </Button>

                <Collapse in={open}>
                    <Box px={1.5} pb={1.5}>
                        <Stack spacing={1}>
                            {(readiness || []).map((row) => (
                                <Box key={row.id} display="flex" alignItems="center" justifyContent="space-between" gap={1}>
                                    <Typography variant="caption" color="text.secondary">
                                        {row.label}
                                    </Typography>
                                    <ReadinessChip status={row.status} />
                                </Box>
                            ))}

                            {!readiness?.length ? (
                                <Typography variant="caption" color="text.secondary">
                                    No readiness details added.
                                </Typography>
                            ) : null}
                        </Stack>
                    </Box>
                </Collapse>
            </Box>
        </Paper>
    );
}

function formatDateLabel(value?: string | null) {
    if (!value) return null;

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;

    return date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}

function getFileLabelFromUrl(url?: string | null) {
    if (!url) return 'Untitled document';

    try {
        const clean = url.split('?')[0] || url;
        const parts = clean.split('/');
        return decodeURIComponent(parts[parts.length - 1] || 'Untitled document');
    } catch {
        return 'Untitled document';
    }
}

export default function ProjectProfileView({
    project,
    mode,
    currentUserRole,
    access,
    canEdit,
    isSaved,
    onToggleSave,
    onBack,
    onShare,
    onOpenEditor,
    onOpenSettings,
    headerBar,
}: ProjectProfileViewProps) {
    const visibleSections = getVisibleSections(project, access);
    const [coachMarkOpen, setCoachMarkOpen] = React.useState(false);
    const settingsButtonRef = React.useRef<HTMLButtonElement | null>(null);

    const canSee = (key: ProjectSectionKey) =>
        visibleSections.has(key) && shouldShowStageSection(key, project.stage);

    const editProps = (section: ProjectSectionKey) => ({
        editable: canEdit && isSectionEditable(section),
        onEdit: canEdit && isSectionEditable(section) ? () => onOpenEditor?.(section) : undefined,
    });

    const sidebarEditSx = {
        color: 'grey.700',
        bgcolor: 'white',
        border: 1,
        borderColor: 'grey.300',
        width: 28,
        height: 28,
        '&:hover': {
            color: 'primary.main',
            bgcolor: 'primary.50',
            borderColor: 'primary.main',
        },
    } as const;

    const completenessItems = getProjectCompletenessItems(project);

    const getSectionVisibility = (key: ProjectSectionKey): SectionVisibility =>
        project.sectionVisibility?.[key] ?? 'public';

    const galleryMediaItems = React.useMemo(
        () =>
            (project.media || []).map((item) => ({
                id: item.id,
                type: item.contentType?.startsWith('video/') ? 'video' : 'image',
                url: item.assetUrl,
                caption: item.caption || 'Untitled media',
                date: formatDateLabel(item.createdAt) || undefined,
            })),
        [project.media]
    );

    React.useEffect(() => {
        const seen = localStorage.getItem('project_settings_coachmark_seen');

        if (!seen && headerBar?.showSettingsButton) {
            setCoachMarkOpen(true);
            localStorage.setItem('project_settings_coachmark_seen', '1');
        }
    }, [headerBar?.showSettingsButton]);

    return (
        <Box sx={{ maxWidth: 1400, mx: 'auto', px: { xs: 2, md: 3 }, py: 3 }}>
            <Stack spacing={3}>
                <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
                    <Box
                        sx={{
                            px: { xs: 2, md: 3 },
                            py: 1.5,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 2,
                            flexWrap: 'wrap',
                            bgcolor: 'white',
                            borderBottom: '1px solid',
                            borderColor: 'grey.100',
                        }}
                    >
                        <Box display="flex" alignItems="center" gap={1.5} minWidth={0} flexWrap="wrap">
                            {onBack ? (
                                <Button
                                    startIcon={<ArrowBackRounded sx={{ fontSize: 16 }} />}
                                    onClick={onBack}
                                    sx={{
                                        textTransform: 'none',
                                        color: 'text.secondary',
                                        minWidth: 0,
                                        px: 1,
                                        '&:hover': {
                                            color: 'text.primary',
                                            bgcolor: 'grey.50',
                                        },
                                    }}
                                >
                                    {headerBar?.backLabel || 'Back'}
                                </Button>
                            ) : null}

                            {headerBar?.contextLabel ? (
                                <>
                                    <Typography color="grey.300">|</Typography>
                                    <Typography variant="body2" color="text.secondary" noWrap sx={{ maxWidth: 360 }}>
                                        {headerBar.contextLabel}
                                    </Typography>
                                </>
                            ) : null}
                        </Box>

                        <Popper
                            open={coachMarkOpen && Boolean(settingsButtonRef.current)}
                            anchorEl={settingsButtonRef.current}
                            placement="bottom-end"
                            sx={{ zIndex: 1300 }}
                            modifiers={[
                                {
                                    name: 'offset',
                                    options: { offset: [0, 8] },
                                },
                            ]}
                        >
                            <Box
                                sx={{
                                    bgcolor: 'grey.900',
                                    color: 'white',
                                    borderRadius: 2,
                                    p: 2,
                                    maxWidth: 220,
                                    boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                                    position: 'relative',
                                    '&::before': {
                                        content: '""',
                                        position: 'absolute',
                                        top: -6,
                                        right: 24,
                                        width: 12,
                                        height: 12,
                                        bgcolor: 'grey.900',
                                        clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
                                    },
                                }}
                            >
                                <Box display="flex" alignItems="flex-start" gap={1.5}>
                                    <Box flex={1}>
                                        <Typography variant="body2" fontWeight={700} color="white" mb={0.5}>
                                            Project Settings
                                        </Typography>
                                        <Typography
                                            variant="caption"
                                            sx={{
                                                color: 'rgba(255,255,255,0.7)',
                                                lineHeight: 1.4,
                                                display: 'block',
                                            }}
                                        >
                                            Control project visibility and team access from here.
                                        </Typography>
                                    </Box>

                                    <IconButton
                                        size="small"
                                        onClick={() => setCoachMarkOpen(false)}
                                        sx={{
                                            color: 'rgba(255,255,255,0.5)',
                                            p: 0.25,
                                            mt: -0.5,
                                            mr: -0.5,
                                            '&:hover': { color: 'white' },
                                        }}
                                    >
                                        <CloseRounded sx={{ fontSize: 14 }} />
                                    </IconButton>
                                </Box>
                            </Box>
                        </Popper>

                        {headerBar?.showSettingsButton && onOpenSettings ? (
                            <Button
                                variant="outlined"
                                size="small"
                                startIcon={<TuneRounded sx={{ fontSize: 15 }} />}
                                onClick={onOpenSettings}
                                ref={settingsButtonRef}
                                sx={{
                                    textTransform: 'none',
                                    borderColor: coachMarkOpen ? 'primary.main' : 'grey.300',
                                    color: coachMarkOpen ? 'primary.main' : 'text.secondary',
                                    '&:hover': {
                                        borderColor: 'grey.400',
                                        bgcolor: 'grey.50',
                                    },
                                }}
                            >
                                Settings
                            </Button>
                        ) : null}
                    </Box>
                </Paper>

                <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 }, borderRadius: 2 }}>
                    <Box display="flex" flexDirection={{ xs: 'column', md: 'row' }} gap={3}>
                        <Box flex={1} minWidth={0}>
                            <Box display="flex" alignItems="flex-start" gap={2} mb={2}>
                                <Box
                                    onClick={canEdit ? () => onOpenEditor?.('overview') : undefined}
                                    sx={{
                                        width: 80,
                                        height: 80,
                                        borderRadius: 2,
                                        bgcolor: project.coverImageUrl ? 'transparent' : 'grey.100',
                                        border: '2px dashed',
                                        borderColor: 'grey.300',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: canEdit ? 'pointer' : 'default',
                                        flexShrink: 0,
                                        position: 'relative',
                                        overflow: 'hidden',
                                        backgroundImage: project.coverImageUrl ? `url(${project.coverImageUrl})` : 'none',
                                        backgroundSize: 'cover',
                                        backgroundPosition: 'center',
                                        '&:hover': canEdit
                                            ? {
                                                borderColor: 'grey.400',
                                                bgcolor: project.coverImageUrl ? 'transparent' : 'grey.200',
                                            }
                                            : {},
                                    }}
                                >
                                    {!project.coverImageUrl ? (
                                        <PhotoCameraRounded sx={{ fontSize: 24, color: 'grey.400' }} />
                                    ) : null}

                                    {canEdit ? (
                                        <Box
                                            sx={{
                                                position: 'absolute',
                                                bottom: 0,
                                                left: 0,
                                                right: 0,
                                                bgcolor: 'rgba(0,0,0,0.5)',
                                                py: 0.25,
                                            }}
                                        >
                                            <Typography
                                                variant="caption"
                                                color="white"
                                                display="block"
                                                textAlign="center"
                                                fontSize="0.5rem"
                                            >
                                                {project.coverImageUrl ? 'Change' : 'Upload'}
                                            </Typography>
                                        </Box>
                                    ) : null}
                                </Box>

                                <Box flex={1} minWidth={0}>
                                    <Typography variant="h5" fontWeight="bold" color="text.primary" mb={1}>
                                        {project.name}
                                        {project.projectVisibility && project.projectVisibility !== 'Public' ? (
                                            <Tooltip title="Unpublished — only visible to permitted users" arrow placement="top">
                                                <LockRounded
                                                    sx={{
                                                        fontSize: 16,
                                                        color: 'grey.400',
                                                        cursor: 'help',
                                                        ml: 0.75,
                                                        verticalAlign: 'middle',
                                                    }}
                                                />
                                            </Tooltip>
                                        ) : null}
                                    </Typography>

                                    <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                                        {project.upid ? (
                                            <Typography variant="caption" fontFamily="monospace" color="text.disabled">
                                                {project.upid}
                                            </Typography>
                                        ) : null}

                                        {project.type ? (
                                            <Chip
                                                label={project.type}
                                                size="small"
                                                sx={{
                                                    height: 24,
                                                    fontSize: '0.75rem',
                                                    bgcolor: 'grey.100',
                                                    color: 'grey.700',
                                                    border: 1,
                                                    borderColor: 'grey.200',
                                                    fontWeight: 500,
                                                }}
                                            />
                                        ) : null}

                                        <Box sx={{ cursor: canEdit ? 'pointer' : 'default' }} onClick={canEdit ? () => onOpenEditor?.('overview') : undefined}>
                                            <StagePill stage={project.stage} />
                                        </Box>

                                        {mode === 'edit' ? (
                                            <Chip
                                                label="My Project"
                                                size="small"
                                                sx={{
                                                    height: 24,
                                                    fontSize: '0.75rem',
                                                    bgcolor: 'grey.900',
                                                    color: 'white',
                                                    fontWeight: 500,
                                                }}
                                            />
                                        ) : null}
                                    </Box>
                                </Box>
                            </Box>

                            {project.description ? (
                                <Typography variant="body2" color="text.secondary" mb={2}>
                                    {project.description}
                                </Typography>
                            ) : null}

                            <Box display="flex" flexWrap="wrap" alignItems="center" gap={2}>
                                {project.country || project.region ? (
                                    <Box display="flex" alignItems="center" gap={0.75}>
                                        <LocationOnRounded sx={{ fontSize: 16, color: 'text.secondary' }} />
                                        <Typography variant="body2" color="text.secondary">
                                            {[project.region, project.country].filter(Boolean).join(', ')}
                                        </Typography>
                                    </Box>
                                ) : null}

                                {project.companyName ? (
                                    <Chip
                                        icon={<BusinessRounded sx={{ fontSize: 14 }} />}
                                        label={project.companyName}
                                        size="small"
                                        variant="outlined"
                                        sx={{
                                            height: 24,
                                            fontSize: '0.75rem',
                                            borderColor: 'grey.300',
                                            color: 'text.secondary',
                                        }}
                                    />
                                ) : null}
                            </Box>
                        </Box>

                        <Box
                            sx={{
                                width: { xs: '100%', md: 224 },
                                flexShrink: 0,
                            }}
                            display="flex"
                            flexDirection="column"
                            gap={1.5}
                        >
                            {canEdit ? (
                                <Button
                                    variant="contained"
                                    fullWidth
                                    startIcon={<EditRounded sx={{ fontSize: 16 }} />}
                                    onClick={() => onOpenEditor?.('overview')}
                                    sx={{ textTransform: 'none' }}
                                >
                                    Edit Project
                                </Button>
                            ) : null}

                            <Stack direction="row" spacing={1}>
                                {onToggleSave ? (
                                    <Button
                                        variant="outlined"
                                        fullWidth
                                        startIcon={isSaved ? <BookmarkRounded sx={{ fontSize: 14 }} /> : <BookmarkBorderRounded sx={{ fontSize: 14 }} />}
                                        onClick={onToggleSave}
                                        sx={{
                                            borderColor: isSaved ? 'primary.main' : 'grey.200',
                                            color: isSaved ? 'primary.main' : 'text.secondary',
                                            textTransform: 'none',
                                            '&:hover': {
                                                bgcolor: isSaved ? 'primary.50' : 'grey.50',
                                                borderColor: isSaved ? 'primary.main' : 'grey.300',
                                            },
                                        }}
                                    >
                                        {isSaved ? 'Saved' : 'Save'}
                                    </Button>
                                ) : null}

                                {onShare ? (
                                    <Button
                                        variant="outlined"
                                        fullWidth
                                        startIcon={<ShareRounded sx={{ fontSize: 14 }} />}
                                        onClick={onShare}
                                        sx={{
                                            borderColor: 'grey.200',
                                            color: 'text.secondary',
                                            textTransform: 'none',
                                            '&:hover': {
                                                bgcolor: 'grey.50',
                                                borderColor: 'grey.300',
                                            },
                                        }}
                                    >
                                        Share
                                    </Button>
                                ) : null}
                            </Stack>
                        </Box>
                    </Box>

                    {currentUserRole === null ? (
                        <Alert severity="info" sx={{ mt: 2 }}>
                            Some sections may be hidden based on this project&apos;s visibility settings.
                        </Alert>
                    ) : null}
                </Paper>

                <Box display="flex" flexDirection={{ xs: 'column', lg: 'row' }} gap={3} alignItems="flex-start">
                    <Box sx={{ flex: { xs: '1 1 100%', lg: '1 1 66.666%' }, minWidth: 0 }}>
                        <Stack spacing={3}>
                            {canSee('story') ? (
                                <SectionCard
                                    title="Project Story"
                                    {...editProps('story')}
                                    isOwner={canEdit}
                                    visibility={getSectionVisibility('story')}
                                    empty={!project.storyProblem && !project.storyApproach}
                                    emptyText="No project story added"
                                    emptyActionLabel={canEdit ? 'Add Story' : undefined}
                                    onEmptyAction={canEdit ? () => onOpenEditor?.('story') : undefined}
                                >
                                    <Stack spacing={3}>
                                        {project.storyProblem || project.storyApproach ? (
                                            <Box display="flex" flexDirection={{ xs: 'column', sm: 'row' }} gap={3}>
                                                {project.storyProblem ? (
                                                    <Box flex={1}>
                                                        <Typography
                                                            variant="caption"
                                                            fontWeight="bold"
                                                            color="text.secondary"
                                                            sx={{
                                                                textTransform: 'uppercase',
                                                                letterSpacing: '0.05em',
                                                                display: 'block',
                                                                mb: 1,
                                                            }}
                                                        >
                                                            Problem and Context
                                                        </Typography>
                                                        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                                                            {project.storyProblem}
                                                        </Typography>
                                                    </Box>
                                                ) : null}

                                                {project.storyApproach ? (
                                                    <Box flex={1}>
                                                        <Typography
                                                            variant="caption"
                                                            fontWeight="bold"
                                                            color="text.secondary"
                                                            sx={{
                                                                textTransform: 'uppercase',
                                                                letterSpacing: '0.05em',
                                                                display: 'block',
                                                                mb: 1,
                                                            }}
                                                        >
                                                            Project Approach
                                                        </Typography>
                                                        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                                                            {project.storyApproach}
                                                        </Typography>
                                                    </Box>
                                                ) : null}
                                            </Box>
                                        ) : null}
                                    </Stack>
                                </SectionCard>
                            ) : null}

                            {canSee('media') ? (
                                <SectionCard
                                    title="Media"
                                    addable={canEdit}
                                    onAdd={canEdit ? () => onOpenEditor?.('media') : undefined}
                                    isOwner={canEdit}
                                    visibility={getSectionVisibility('media')}
                                >
                                    <MediaGallery
                                        items={galleryMediaItems}
                                        mode="carousel"
                                        isOwner={canEdit}
                                        onAdd={canEdit ? () => onOpenEditor?.('media') : undefined}
                                    />
                                </SectionCard>
                            ) : null}

                            {canSee('opportunities') ? (
                                <SectionCard
                                    title="Looking For"
                                    subtitle="What this project is currently seeking"
                                    addable={canEdit}
                                    isOwner={canEdit}
                                    visibility={getSectionVisibility('opportunities')}
                                    empty={!project.opportunities?.length}
                                    emptyText="No open opportunities listed"
                                    emptyActionLabel={canEdit ? 'Add Opportunity' : undefined}
                                    onEmptyAction={canEdit ? () => onOpenEditor?.('opportunities') : undefined}
                                    onAdd={canEdit ? () => onOpenEditor?.('opportunities') : undefined}
                                >
                                    <Stack spacing={1.5}>
                                        {project.opportunities?.length
                                            ? project.opportunities.map((item) => (
                                                <Paper key={item.id} variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                                                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                                                        <PeopleRounded sx={{ fontSize: 18, color: 'text.secondary' }} />
                                                        <Typography variant="body2" fontWeight={700}>
                                                            {item.type}
                                                        </Typography>
                                                        {item.urgent ? <Chip label="Priority" size="small" color="warning" /> : null}
                                                    </Stack>
                                                    {item.description ? (
                                                        <Typography variant="body2" color="text.secondary">
                                                            {item.description}
                                                        </Typography>
                                                    ) : null}
                                                </Paper>
                                            ))
                                            : null}
                                    </Stack>
                                </SectionCard>
                            ) : null}

                            {canSee('updates') ? (
                                <SectionCard
                                    title="Updates"
                                    subtitle="Latest project news and milestones"
                                    addable={canEdit}
                                    isOwner={canEdit}
                                    visibility={getSectionVisibility('updates')}
                                    empty={!project.updates?.length}
                                    emptyText="No updates yet"
                                    emptyActionLabel={canEdit ? 'Post Update' : undefined}
                                    onEmptyAction={canEdit ? () => onOpenEditor?.('updates') : undefined}
                                    onAdd={canEdit ? () => onOpenEditor?.('updates') : undefined}
                                >
                                    <Stack spacing={2}>
                                        {project.updates?.length
                                            ? project.updates.map((update) => (
                                                <Paper key={update.id} variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                                                    <Stack spacing={1}>
                                                        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={1}>
                                                            <Box>
                                                                <Typography variant="body2" fontWeight={700}>
                                                                    {update.title}
                                                                </Typography>
                                                                {update.authorName || update.dateLabel ? (
                                                                    <Typography variant="caption" color="text.secondary">
                                                                        {[update.authorName, update.dateLabel].filter(Boolean).join(' • ')}
                                                                    </Typography>
                                                                ) : null}
                                                            </Box>

                                                            {update.type ? (
                                                                <Chip
                                                                    size="small"
                                                                    label={update.type === 'stage' ? 'Stage change' : 'Progress'}
                                                                    variant="outlined"
                                                                    color={update.type === 'stage' ? 'primary' : 'default'}
                                                                />
                                                            ) : null}
                                                        </Stack>

                                                        {update.description ? (
                                                            <Typography variant="body2" color="text.secondary">
                                                                {update.description}
                                                            </Typography>
                                                        ) : null}
                                                    </Stack>
                                                </Paper>
                                            ))
                                            : null}
                                    </Stack>
                                </SectionCard>
                            ) : null}

                            {canSee('documents') ? (
                                <SectionCard
                                    title="Documents"
                                    addable={canEdit}
                                    isOwner={canEdit}
                                    visibility={getSectionVisibility('documents')}
                                    onAdd={canEdit ? () => onOpenEditor?.('documents') : undefined}
                                    empty={!project.documents?.length}
                                    emptyText="No documents uploaded"
                                    emptyActionLabel={canEdit ? 'Add Document' : undefined}
                                    onEmptyAction={canEdit ? () => onOpenEditor?.('documents') : undefined}
                                >
                                    <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden', width: '100%' }}>
                                        <Table size="small">
                                            <TableHead sx={{ bgcolor: 'grey.50' }}>
                                                <TableRow>
                                                    <TableCell sx={{ fontSize: '0.75rem', fontWeight: 600, color: 'text.secondary' }}>
                                                        Document
                                                    </TableCell>
                                                    <TableCell sx={{ fontSize: '0.75rem', fontWeight: 600, color: 'text.secondary' }}>
                                                        Type
                                                    </TableCell>
                                                    <TableCell sx={{ fontSize: '0.75rem', fontWeight: 600, color: 'text.secondary' }}>
                                                        Kind
                                                    </TableCell>
                                                    <TableCell sx={{ fontSize: '0.75rem', fontWeight: 600, color: 'text.secondary' }}>
                                                        Uploaded
                                                    </TableCell>
                                                </TableRow>
                                            </TableHead>

                                            <TableBody>
                                                {project.documents?.map((doc) => (
                                                    <TableRow key={doc.id} hover>
                                                        <TableCell>
                                                            <Box display="flex" alignItems="center" gap={1}>
                                                                <DescriptionRounded sx={{ fontSize: 16, color: 'grey.400' }} />
                                                                <Link
                                                                    href={doc.assetUrl}
                                                                    target="_blank"
                                                                    rel="noreferrer"
                                                                    underline="hover"
                                                                    color="inherit"
                                                                    sx={{
                                                                        display: 'inline-flex',
                                                                        alignItems: 'center',
                                                                        gap: 0.5,
                                                                        fontSize: '0.75rem',
                                                                        fontWeight: 500,
                                                                    }}
                                                                >
                                                                    {doc.name || getFileLabelFromUrl(doc.assetUrl)}
                                                                    <OpenInNewRounded sx={{ fontSize: 13 }} />
                                                                </Link>
                                                            </Box>
                                                        </TableCell>

                                                        <TableCell sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                                                            {doc.type || doc.contentType || '—'}
                                                        </TableCell>

                                                        <TableCell sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                                                            {doc.kind || '—'}
                                                        </TableCell>

                                                        <TableCell sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                                                            {formatDateLabel(doc.createdAt) || '—'}
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </Paper>
                                </SectionCard>
                            ) : null}
                        </Stack>
                    </Box>

                    <Box
                        sx={{
                            flex: { xs: '1 1 100%', lg: '0 0 33.333%' },
                            width: '100%',
                        }}
                    >
                        <Stack spacing={2}>
                            {canSee('impact') ? (
                                <SidebarCard
                                    title="Credits"
                                    canEdit={canEdit}
                                    onEdit={canEdit ? () => onOpenEditor?.('impact') : undefined}
                                    headerBg="grey.50"
                                >
                                    <Box display="grid" gridTemplateColumns="1fr 1fr" gap={1}>
                                        <Paper
                                            variant="outlined"
                                            sx={{
                                                p: 1.25,
                                                textAlign: 'center',
                                                bgcolor: 'grey.50',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                            }}
                                        >
                                            <Typography variant="subtitle2" fontWeight={700} color="text.primary">
                                                {project.estimatedAnnualRemoval || '—'}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.625rem' }}>
                                                Annual est.
                                            </Typography>
                                        </Paper>

                                        <Paper
                                            variant="outlined"
                                            sx={{
                                                p: 1.25,
                                                textAlign: 'center',
                                                bgcolor: 'grey.50',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                            }}
                                        >
                                            <Typography variant="subtitle2" fontWeight={700} color="text.primary">
                                                {project.totalAreaHa ? project.totalAreaHa.toLocaleString() : '—'}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.625rem' }}>
                                                Area (ha)
                                            </Typography>
                                        </Paper>
                                    </Box>
                                </SidebarCard>
                            ) : null}

                            {canEdit ? (
                                <Stack spacing={1}>
                                    <ProfileCompleteness
                                        title="Improve Listing"
                                        items={completenessItems}
                                        onItemClick={(item) => onOpenEditor?.(item.section as ProjectSectionKey)}
                                    />

                                    <Button
                                        component={RouterLink}
                                        to="/project-stages-guide"
                                        variant="text"
                                        size="small"
                                        sx={{
                                            alignSelf: 'flex-start',
                                            textTransform: 'none',
                                            px: 0,
                                            minWidth: 0,
                                        }}
                                    >
                                        View project stages guide
                                    </Button>
                                </Stack>
                            ) : null}

                            <Box display={{ xs: 'none', md: 'block' }}>
                                {canSee('team') ? (
                                    <CollaboratorsCard
                                        project={project}
                                        canEdit={canEdit}
                                        onOpenEditor={onOpenEditor}
                                        sidebarEditSx={sidebarEditSx}
                                    />
                                ) : null}
                            </Box>

                            {canSee('location') ? (
                                <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden', width: '100%' }}>
                                    <Box
                                        p={1.5}
                                        borderBottom={1}
                                        borderColor="grey.100"
                                        display="flex"
                                        alignItems="center"
                                        justifyContent="space-between"
                                        bgcolor="white"
                                    >
                                        <Typography
                                            variant="caption"
                                            fontWeight="bold"
                                            color="text.primary"
                                            sx={{ textTransform: 'uppercase', letterSpacing: '0.04em' }}
                                        >
                                            Location
                                        </Typography>

                                        {canEdit ? (
                                            <IconButton size="small" onClick={() => onOpenEditor?.('location')} sx={sidebarEditSx}>
                                                <EditRounded sx={{ fontSize: 16 }} />
                                            </IconButton>
                                        ) : null}
                                    </Box>

                                    <Box
                                        sx={{
                                            aspectRatio: '4/3',
                                            bgcolor: 'grey.100',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            borderBottom: 1,
                                            borderColor: 'grey.100',
                                        }}
                                    >
                                        <Stack alignItems="center" spacing={1}>
                                            <LocationOnRounded sx={{ fontSize: 24, color: 'grey.400' }} />
                                            <Typography variant="caption" color="text.secondary">
                                                Map preview
                                            </Typography>
                                        </Stack>
                                    </Box>

                                    <Box p={1.5} bgcolor="white" borderTop={1} borderColor="grey.100">
                                        <Box display="flex" alignItems="center" gap={1} color="text.secondary" mb={0.5}>
                                            <LocationOnRounded sx={{ fontSize: 12 }} />
                                            <Typography variant="caption">
                                                {project.region ? `${project.region}, ` : ''}
                                                {project.country || 'Location not specified'}
                                            </Typography>
                                        </Box>

                                        <Typography variant="caption" color="text.disabled" display="block">
                                            {project.totalAreaHa ? `${project.totalAreaHa.toLocaleString()} hectares` : 'Area not specified'}
                                        </Typography>
                                    </Box>
                                </Paper>
                            ) : null}

                            {canSee('readiness') ? (
                                <ReadinessSidebarCard
                                    stage={project.stage}
                                    readiness={project.readiness}
                                    canEdit={canEdit}
                                    onEdit={canEdit ? () => onOpenEditor?.('readiness') : undefined}
                                />
                            ) : null}

                            {canSee('registry') ? (
                                <SidebarCard
                                    title="Registry"
                                    canEdit={canEdit}
                                    onEdit={canEdit ? () => onOpenEditor?.('registry') : undefined}
                                >
                                    <Stack spacing={1.5}>
                                        <Box display="flex" justifyContent="space-between" alignItems="center" gap={1}>
                                            <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>
                                                Platform
                                            </Typography>
                                            <Typography variant="caption" fontWeight="medium" color="text.primary" textAlign="right">
                                                {project.registryName || '—'}
                                            </Typography>
                                        </Box>

                                        <Box display="flex" justifyContent="space-between" alignItems="center" gap={1}>
                                            <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>
                                                Status
                                            </Typography>
                                            <Typography variant="caption" fontWeight="medium" color="text.primary" textAlign="right">
                                                {project.registryStatus || '—'}
                                            </Typography>
                                        </Box>

                                        <Box display="flex" justifyContent="space-between" alignItems="center" gap={1}>
                                            <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>
                                                Project ID
                                            </Typography>
                                            <Typography variant="caption" fontWeight="medium" color="text.primary" textAlign="right">
                                                {project.registryProjectId || '—'}
                                            </Typography>
                                        </Box>
                                    </Stack>
                                </SidebarCard>
                            ) : null}
                        </Stack>
                    </Box>
                </Box>
            </Stack>
        </Box>
    );
}