import React from 'react';
import {
    Alert,
    Avatar,
    Box,
    Button,
    Chip,
    Collapse,
    IconButton,
    Paper,
    Stack,
    Tooltip,
    Typography,
    Popper,
} from '@mui/material';
import EditRounded from '@mui/icons-material/EditRounded';
import AddRounded from '@mui/icons-material/AddRounded';
import LocationOnRounded from '@mui/icons-material/LocationOnRounded';
import BusinessRounded from '@mui/icons-material/BusinessRounded';
import PeopleRounded from '@mui/icons-material/PeopleRounded';
import LockRounded from '@mui/icons-material/LockRounded';
import MoreVertRounded from '@mui/icons-material/MoreVertRounded';
import PhotoCameraRounded from '@mui/icons-material/PhotoCameraRounded';
import BookmarkBorderRounded from '@mui/icons-material/BookmarkBorderRounded';
import BookmarkRounded from '@mui/icons-material/BookmarkRounded';
import ShareRounded from '@mui/icons-material/ShareRounded';
import ExpandMoreRounded from '@mui/icons-material/ExpandMoreRounded';
import ExpandLessRounded from '@mui/icons-material/ExpandLessRounded';
import InfoOutlined from '@mui/icons-material/InfoOutlined';
import ArrowBackRounded from '@mui/icons-material/ArrowBackRounded';
import TuneRounded from '@mui/icons-material/TuneRounded';
import { Link as RouterLink } from 'react-router-dom';

import { ProfileCompleteness, type CompletenessItem } from '../../components/ProfileCompleteness';
import { ShareMenu } from '../../components/ShareMenu';
import ProjectLocationMap from '../../components/ProjectLocationMap';

import ProjectMediaSection from './ProjectMediaSection';
import ProjectOpportunitiesSection from './ProjectOpportunitiesSection';
import ProjectDocumentsSection from './ProjectDocumentsSection';

import { CloseRounded } from '@mui/icons-material';
import { ProjectSectionCard } from './ProjectSectionCard';

import {
    STAGE_ORDER,
    stageDescriptions,
    getProjectCompletenessItems
} from './projectProfile.constants.ts';

import { CountryFlagLabel } from '../../components/common/CountryFlagLabel';

import type {
    ProjectAccess,
    ProjectDocument,
    ProjectEditorTarget,
    ProjectMediaItem,
    ProjectOpportunity,
    ProjectProfileData,
    ProjectReadinessItem,
    ProjectRole,
    ProjectSectionKey,
    ProjectServiceProvider,
    ProjectStage,
    ProjectTeamMember,
    ProjectUpdate,
    SectionVisibility,
} from './projectProfile.types';
import ProjectUpdatesSection from './ProjectUpdatesSection.tsx';
import ProjectTeamSection from './ProjectTeamSection.tsx';

export type CollaboratorEntityType = 'user' | 'company';

export type ProjectDocumentStatus = 'Draft' | 'Final';

export interface ProjectProfileViewProps {
    project: ProjectProfileData;
    mode: 'read' | 'edit';
    currentUserRole: ProjectRole | null;
    access: ProjectAccess;
    canEdit: boolean;
    isSaved?: boolean;
    onToggleSave?: () => void;
    onBack?: () => void;

    shareAnchorEl: HTMLElement | null;
    onOpenShare: (el: HTMLElement) => void;
    onCloseShare: () => void;
    resolveShareUrl?: () => Promise<string>;

    onOpenEditor?: (
        section: ProjectEditorTarget,
        itemId?: string | null
    ) => void;
    onOpenSettings?: () => void;
    onMediaMenuClick?: (
        event: React.MouseEvent<HTMLElement>,
        item: ProjectMediaItem,
        index: number
    ) => void;
    onOpportunityMenuClick?: (
        event: React.MouseEvent<HTMLElement>,
        item: ProjectOpportunity,
        index: number
    ) => void;
    onUpdateMenuClick?: (
        event: React.MouseEvent<HTMLElement>,
        item: ProjectUpdate,
        index: number
    ) => void;
    onDocumentMenuClick?: (
        event: React.MouseEvent<HTMLElement>,
        item: ProjectDocument,
        index: number
    ) => void;
    onSectionVisibilityChange?: (
        section: ProjectSectionKey,
        visibility: SectionVisibility
    ) => void;
    renderSidebarAnchor?: React.ReactNode;
    headerBar?: {
        backLabel?: string;
        contextLabel?: string | null;
        showSettingsButton?: boolean;
    };
    focusSection?: ProjectSectionKey | null;
    highlightedUpdateId?: string | null;
    onSectionFocusHandled?: () => void;
    onTeamMenuClick?: (
        event: React.MouseEvent<HTMLElement>,
        member: ProjectTeamMember
    ) => void;
}

type ChecklistStageColumn =
    | 'Exploration'
    | 'Concept'
    | 'Design'
    | 'Listed'
    | 'Validation'
    | 'Registered'
    | 'Issued';

type ProjectChecklistDefinition = {
    id: string;
    label: string;
    description?: string;
    section: ProjectSectionKey;
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

function hasCoordinates(project: ProjectProfileData): boolean {
    return project.latitude != null && project.longitude != null;
}

function formatCompactNumber(value?: number | null): string {
    if (value == null || Number.isNaN(value)) return '—';

    return new Intl.NumberFormat(undefined, {
        notation: 'compact',
        maximumFractionDigits: 1,
    }).format(value);
}

function formatFullNumber(value?: number | null): string {
    if (value == null || Number.isNaN(value)) return '—';

    return new Intl.NumberFormat(undefined, {
        maximumFractionDigits: 0,
    }).format(value);
}

function formatMonthYear(value?: string | null): string {
    if (!value) return '—';

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;

    return date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
    });
}

function getCreditingPeriodLabel(project: ProjectProfileData): string {
    if (project.tenureText?.trim()) return project.tenureText.trim();

    if (project.creditingStart || project.creditingEnd) {
        const start = project.creditingStart ? formatMonthYear(project.creditingStart) : '—';
        const end = project.creditingEnd ? formatMonthYear(project.creditingEnd) : '—';
        return `${start} – ${end}`;
    }

    return '—';
}

function sanitizeEstimatedAnnualRemoval(value: unknown): string | null {
    if (value == null) return null;

    if (typeof value === 'string') {
        const trimmed = value.trim();

        if (!trimmed) return null;
        if (trimmed === '{}' || trimmed === '{"value":"{}"}') return null;

        try {
            const parsed = JSON.parse(trimmed);

            if (parsed == null) return null;

            if (typeof parsed === 'string') {
                const nested = parsed.trim();
                return nested && nested !== '{}' ? nested : null;
            }

            if (typeof parsed === 'object') {
                const nestedValue =
                    typeof (parsed as any).value === 'string'
                        ? (parsed as any).value.trim()
                        : '';

                return nestedValue && nestedValue !== '{}' ? nestedValue : null;
            }
        } catch {
            return trimmed;
        }

        return trimmed;
    }

    return String(value);
}

function getAnnualRemovalLabel(project: ProjectProfileData): string {
    return sanitizeEstimatedAnnualRemoval(project.estimatedAnnualRemoval) ?? '—';
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
        // case 'readiness':
        //     return !['Closed'].includes(stage);

        // case 'registry':
        //     return ['Design', 'Listed', 'Validation', 'Registered', 'Issued', 'Closed'].includes(stage);

        // case 'impact':
        //     return ['Registered', 'Issued', 'Closed'].includes(stage);

        case 'impact':
            return !['Exploration', 'Concept', 'Design'].includes(stage);

        case 'registry':
            return !['Exploration', 'Concept', 'Design'].includes(stage);


        // case 'opportunities':
        //     return !['Closed'].includes(stage);

        // case 'updates':
        //     return !['Exploration'].includes(stage);

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

function isSectionEditable(_section: ProjectSectionKey): boolean {
    return true;
    // always return true for now
}
function ReadinessSidebarCard({
    stage,
    canEdit,
    onEdit,
}: {
    stage: ProjectStage;
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
                <Box display="flex" alignItems="center">
                    <Typography
                        variant="caption"
                        fontWeight="bold"
                        color="text.primary"
                        sx={{ textTransform: 'uppercase', letterSpacing: '0.04em' }}
                    >
                        Progress
                    </Typography>
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
                            <Typography variant="body2" fontWeight={700} color="text.primary">
                                {stage}
                            </Typography>

                            <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                                {stageDescriptions[stage]}
                            </Typography>
                        </Stack>
                    </Box>
                </Collapse>
            </Box>
        </Paper>
    );
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
    shareAnchorEl,
    onOpenShare,
    onCloseShare,
    resolveShareUrl,
    onOpenEditor,
    onOpenSettings,
    onMediaMenuClick,
    onOpportunityMenuClick,
    onUpdateMenuClick,
    onDocumentMenuClick,
    onSectionVisibilityChange,
    headerBar,
    focusSection = null,
    highlightedUpdateId = null,
    onSectionFocusHandled,
    onTeamMenuClick,
}: ProjectProfileViewProps) {
    const visibleSections = getVisibleSections(project, access);
    const [coachMarkOpen, setCoachMarkOpen] = React.useState(false);
    const settingsButtonRef = React.useRef<HTMLButtonElement | null>(null);

    const updatesSectionRef = React.useRef<HTMLDivElement | null>(null);
    const [updatesSectionFlash, setUpdatesSectionFlash] = React.useState(false);
    const [highlightedUpdateFlashId, setHighlightedUpdateFlashId] = React.useState<string | null>(null);

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

    const completenessItems = React.useMemo(
        () => getProjectCompletenessItems(project),
        [project]
    );

    const getSectionVisibility = (key: ProjectSectionKey): SectionVisibility =>
        project.sectionVisibility?.[key] ?? 'public';

    React.useEffect(() => {
        const seen = localStorage.getItem('project_settings_coachmark_seen');

        if (!seen && headerBar?.showSettingsButton) {
            setCoachMarkOpen(true);
            localStorage.setItem('project_settings_coachmark_seen', '1');
        }
    }, [headerBar?.showSettingsButton]);

    React.useEffect(() => {
        if (focusSection !== 'updates') return;
        if (!canSee('updates')) return;

        const sectionEl = updatesSectionRef.current;
        if (!sectionEl) return;

        sectionEl.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
        });

        setUpdatesSectionFlash(true);

        if (highlightedUpdateId) {
            setHighlightedUpdateFlashId(highlightedUpdateId);
        }

        const timer = window.setTimeout(() => {
            setUpdatesSectionFlash(false);
            setHighlightedUpdateFlashId(null);
            onSectionFocusHandled?.();
        }, 2200);

        return () => {
            window.clearTimeout(timer);
        };
    }, [focusSection, highlightedUpdateId, onSectionFocusHandled, canSee]);

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
                                    onClick={canEdit ? () => onOpenEditor?.('cover') : undefined}
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
                                        {project.projectVisibility && project.projectVisibility !== 'public' ? (
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
                                    <Box display="flex" alignItems="center" gap={0.75} flexWrap="wrap">
                                        <LocationOnRounded sx={{ fontSize: 16, color: 'text.secondary' }} />

                                        {project.region ? (
                                            <Typography variant="body2" color="text.secondary">
                                                {project.region}
                                            </Typography>
                                        ) : null}

                                        {project.region && project.country ? (
                                            <Typography variant="body2" color="text.secondary">
                                                ,
                                            </Typography>
                                        ) : null}

                                        {project.country ? (
                                            <CountryFlagLabel
                                                country={project.country}
                                                size="sm"
                                                textVariant="body2"
                                                color="text.secondary"
                                                gap={0.5}
                                            />
                                        ) : null}
                                    </Box>
                                ) : null}

                                {project.companyName ? (
                                    <Chip
                                        icon={<BusinessRounded sx={{ fontSize: 14 }} />}
                                        label={project.companyName}
                                        size="small"
                                        variant="outlined"
                                        component={project.companyId ? RouterLink : 'div'}
                                        to={project.companyId ? `/companies/${project.companyId}` : undefined}
                                        clickable={Boolean(project.companyId)}
                                        sx={{
                                            height: 24,
                                            fontSize: '0.75rem',
                                            borderColor: 'grey.300',
                                            color: project.companyId ? 'primary.main' : 'text.secondary',
                                            textDecoration: 'none',
                                            '&:hover': project.companyId
                                                ? { bgcolor: 'grey.50' }
                                                : undefined,
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
                            ) : project.companyEmail ? (
                                <Button
                                    variant="contained"
                                    fullWidth
                                    component="a"
                                    href={`mailto:${project.companyEmail}?subject=${encodeURIComponent(
                                        `Enquiry about ${project.name}`
                                    )}`}
                                    startIcon={<BusinessRounded sx={{ fontSize: 16 }} />}
                                    sx={{ textTransform: 'none' }}
                                >
                                    Contact Developer
                                </Button>
                            ) : null}

                            <Stack direction="row" spacing={1}>
                                {onToggleSave ? (
                                    <Button
                                        variant="outlined"
                                        fullWidth
                                        startIcon={
                                            isSaved ? (
                                                <BookmarkRounded sx={{ fontSize: 14 }} />
                                            ) : (
                                                <BookmarkBorderRounded sx={{ fontSize: 14 }} />
                                            )
                                        }
                                        onClick={onToggleSave}
                                        sx={{
                                            borderColor: isSaved ? 'primary.main' : 'grey.200',
                                            color: isSaved ? 'primary.main' : 'text.secondary',
                                            textTransform: 'none',
                                            '&:hover': {
                                                bgcolor: isSaved ? 'primary.50' : 'grey.50',
                                            },
                                        }}
                                    >
                                        {isSaved ? 'Saved' : 'Save'}
                                    </Button>
                                ) : null}

                                <Button
                                    variant="outlined"
                                    fullWidth
                                    startIcon={<ShareRounded sx={{ fontSize: 14 }} />}
                                    onClick={(event) => onOpenShare(event.currentTarget)}
                                    sx={{
                                        borderColor: 'grey.200',
                                        color: 'text.secondary',
                                        textTransform: 'none',
                                        '&:hover': {
                                            bgcolor: 'grey.50',
                                        },
                                    }}
                                >
                                    Share
                                </Button>
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
                                <ProjectSectionCard
                                    title="Project Story"
                                    {...editProps('story')}
                                    isOwner={canEdit}
                                    visibility={getSectionVisibility('story')}
                                    onVisibilityChange={
                                        canEdit
                                            ? (value) => onSectionVisibilityChange?.('story', value)
                                            : undefined
                                    }
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
                                </ProjectSectionCard>
                            ) : null}

                            {canSee('media') ? (
                                <ProjectMediaSection
                                    media={project.media}
                                    canEdit={canEdit}
                                    visibility={getSectionVisibility('media')}
                                    onVisibilityChange={
                                        canEdit
                                            ? (value) => onSectionVisibilityChange?.('media', value)
                                            : undefined
                                    }
                                    onOpenEditor={onOpenEditor}
                                    onMediaMenuClick={onMediaMenuClick}
                                />
                            ) : null}

                            {canSee('opportunities') ? (
                                <ProjectOpportunitiesSection
                                    opportunities={project.opportunities}
                                    canEdit={canEdit}
                                    visibility={getSectionVisibility('opportunities')}
                                    onVisibilityChange={
                                        canEdit
                                            ? (value) => onSectionVisibilityChange?.('opportunities', value)
                                            : undefined
                                    }
                                    onOpenEditor={onOpenEditor}
                                    onOpportunityMenuClick={onOpportunityMenuClick}
                                />
                            ) : null}

                            {canSee('updates') ? (
                                <ProjectUpdatesSection
                                    updates={project.updates}
                                    canEdit={canEdit}
                                    visibility={getSectionVisibility('updates')}
                                    onVisibilityChange={
                                        canEdit
                                            ? (value) => onSectionVisibilityChange?.('updates', value)
                                            : undefined
                                    }
                                    onOpenEditor={onOpenEditor}
                                    onUpdateMenuClick={onUpdateMenuClick}
                                    highlightedUpdateId={highlightedUpdateFlashId}
                                    sectionRef={updatesSectionRef}
                                    sectionFlash={updatesSectionFlash}
                                />
                            ) : null}

                            {canSee('documents') ? (
                                <ProjectDocumentsSection
                                    documents={project.documents}
                                    canEdit={canEdit}
                                    visibility={getSectionVisibility('documents')}
                                    onVisibilityChange={
                                        canEdit
                                            ? (value) => onSectionVisibilityChange?.('documents', value)
                                            : undefined
                                    }
                                    onOpenEditor={onOpenEditor}
                                    onDocumentMenuClick={onDocumentMenuClick}
                                />
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
                                        bgcolor="grey.50"
                                    >
                                        <Typography variant="caption" fontWeight="bold" color="text.primary">
                                            Credits
                                        </Typography>

                                        {canEdit ? (
                                            <IconButton
                                                size="small"
                                                onClick={() => onOpenEditor?.('impact')}
                                                sx={sectionHeaderIconButtonSx}
                                            >
                                                <EditRounded sx={{ fontSize: 16 }} />
                                            </IconButton>
                                        ) : null}
                                    </Box>

                                    <Box p={1.5}>
                                        <Box display="grid" gridTemplateColumns="1fr 1fr" gap={1}>
                                            {[
                                                {
                                                    value: formatFullNumber(project.totalCreditsIssued),
                                                    label: 'Credits Issued',
                                                },
                                                {
                                                    value:
                                                        project.firstVintageYear != null
                                                            ? String(project.firstVintageYear)
                                                            : '—',
                                                    label: 'First Vintage',
                                                },
                                                {
                                                    value:
                                                        project.annualEstimatedCredits != null
                                                            ? `${formatCompactNumber(project.annualEstimatedCredits)}${project.annualEstimateUnit ? ` ${project.annualEstimateUnit}` : ''}`
                                                            : getAnnualRemovalLabel(project),
                                                    label:
                                                        project.annualEstimatedCredits != null
                                                            ? 'Annual Estimate'
                                                            : 'Annual Removal',
                                                },
                                                {
                                                    value: getCreditingPeriodLabel(project),
                                                    label: 'Crediting Period',
                                                },
                                            ].map((item, i) => (
                                                <Paper
                                                    key={i}
                                                    variant="outlined"
                                                    sx={{
                                                        p: 1.25,
                                                        textAlign: 'center',
                                                        bgcolor: 'grey.50',
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        minHeight: 72,
                                                    }}
                                                >
                                                    <Typography
                                                        variant="subtitle2"
                                                        fontWeight="bold"
                                                        color="text.primary"
                                                        sx={{
                                                            lineHeight: 1.2,
                                                            wordBreak: 'break-word',
                                                        }}
                                                    >
                                                        {item.value}
                                                    </Typography>

                                                    <Typography
                                                        variant="caption"
                                                        color="text.secondary"
                                                        sx={{
                                                            fontSize: '0.625rem',
                                                            mt: 0.5,
                                                        }}
                                                    >
                                                        {item.label}
                                                    </Typography>
                                                </Paper>
                                            ))}
                                        </Box>
                                    </Box>
                                </Paper>
                            ) : null}

                            {canEdit && completenessItems.length > 0 ? (
                                <ProfileCompleteness
                                    title={`${project.stage} checklist`}
                                    items={completenessItems}
                                    onItemClick={(item) => onOpenEditor?.(item.section as ProjectEditorTarget)}
                                />
                            ) : null}

                            <Box display={{ xs: 'none', md: 'block' }}>
                                {canSee('team') ? (
                                    <ProjectTeamSection
                                        project={project}
                                        canEdit={canEdit}
                                        visibility={getSectionVisibility('team')}
                                        onVisibilityChange={
                                            canEdit
                                                ? (value) => onSectionVisibilityChange?.('team', value)
                                                : undefined
                                        }
                                        onOpenEditor={onOpenEditor}
                                        onTeamMenuClick={onTeamMenuClick}
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
                                            borderBottom: 1,
                                            borderColor: 'grey.100',
                                            overflow: 'hidden',
                                            bgcolor: 'grey.100',
                                        }}
                                    >
                                        {project.latitude != null && project.longitude != null ? (
                                            <ProjectLocationMap
                                                lat={String(project.latitude)}
                                                lng={String(project.longitude)}
                                                height={320}
                                                readOnly
                                            />
                                        ) : (
                                            <Box
                                                sx={{
                                                    width: '100%',
                                                    height: '100%',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                }}
                                            >
                                                <Stack alignItems="center" spacing={1}>
                                                    <LocationOnRounded sx={{ fontSize: 24, color: 'grey.400' }} />
                                                    <Typography variant="caption" color="text.secondary">
                                                        Map preview unavailable
                                                    </Typography>
                                                </Stack>
                                            </Box>
                                        )}
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
                                            {project.totalAreaHa != null
                                                ? `${project.totalAreaHa.toLocaleString()} hectares`
                                                : 'Area not specified'}
                                        </Typography>
                                    </Box>
                                </Paper>
                            ) : null}

                            {canSee('readiness') ? (
                                <ReadinessSidebarCard
                                    stage={project.stage}
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
                                                {project.registrationPlatform || '—'}
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
                                                Registry ID
                                            </Typography>
                                            <Typography variant="caption" fontWeight="medium" color="text.primary" textAlign="right">
                                                {project.registryId || '—'}
                                            </Typography>
                                        </Box>

                                        <Box display="flex" justifyContent="space-between" alignItems="flex-start" gap={1}>
                                            <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0, pt: 0.25 }}>
                                                Registry Link
                                            </Typography>

                                            {project.registryProjectUrl ? (
                                                <Typography
                                                    component="a"
                                                    href={project.registryProjectUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    variant="caption"
                                                    fontWeight="medium"
                                                    color="primary.main"
                                                    textAlign="right"
                                                    sx={{
                                                        textDecoration: 'none',
                                                        wordBreak: 'break-all',
                                                        '&:hover': { textDecoration: 'underline' },
                                                    }}
                                                >
                                                    {project.registryProjectUrl}
                                                </Typography>
                                            ) : (
                                                <Typography variant="caption" fontWeight="medium" color="text.primary" textAlign="right">
                                                    —
                                                </Typography>
                                            )}
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