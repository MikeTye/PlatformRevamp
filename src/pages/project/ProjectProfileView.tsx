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
    STAGE_COMPLETENESS_RULES,
} from './projectProfile.constants.ts';

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

export type CollaboratorEntityType = 'user' | 'company';

function getTeamMemberDisplayName(member: ProjectTeamMember): string {
    if (member.isPlatformMember === false) {
        if (member.memberType === 'company') {
            return (
                member.manualOrganization?.trim() ||
                member.companyName?.trim() ||
                member.manualName?.trim() ||
                member.name?.trim() ||
                'External company'
            );
        }

        return (
            member.manualName?.trim() ||
            member.name?.trim() ||
            member.manualOrganization?.trim() ||
            'External collaborator'
        );
    }

    if (member.memberType === 'company') {
        return member.companyName?.trim() || member.name?.trim() || 'Company';
    }

    return member.name?.trim() || member.manualName?.trim() || 'User';
}

function getTeamMemberSubtitle(member: ProjectTeamMember): string {
    const roleLabel = member.role?.trim();

    if (member.isPlatformMember === false) {
        if (member.memberType === 'company') {
            return roleLabel || 'External company';
        }

        const org = member.manualOrganization?.trim() || member.companyName?.trim();
        return roleLabel ? (org ? `${roleLabel} · ${org}` : roleLabel) : org || 'External collaborator';
    }

    if (roleLabel) return roleLabel;

    if (member.permission === 'viewer') return 'Viewer';
    if (member.memberType === 'company') return 'Company Collaborator';

    return 'Team Member';
}

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
    shareUrl?: string;
    shareTitle?: string;
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
}

function getProjectCompletenessItems(project: ProjectProfileData): CompletenessItem[] {
    const rules = STAGE_COMPLETENESS_RULES[project.stage] || [];

    return rules.map((rule) => ({
        id: rule.id,
        label: rule.label,
        description: rule.description,
        isComplete: rule.isComplete(project),
        section: rule.section,
        requiredForStage: project.stage,
    }));
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

        case 'impact':
            return ['Registered', 'Issued', 'Closed'].includes(stage);

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

    const visibleTeam = React.useMemo(
        () => (project.team || []).filter((member) => member.permission !== 'creator'),
        [project.team]
    );

    const hasDeveloper = Boolean(developerName);
    const hasTeam = visibleTeam.length > 0;
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
                    Project Partners
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
                                <Typography sx={sectionLabelSx}>Partners</Typography>

                                <Stack spacing={0.5}>
                                    {visibleTeam.map((member) => {
                                        const key =
                                            member.memberId ||
                                            member.userId ||
                                            member.companyId ||
                                            member.id;

                                        const isCompanyMember = member.memberType === 'company';
                                        const isExternal = member.isPlatformMember === false;

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
                                                    <Stack minWidth={0} flex={1} spacing={0.5}>
                                                        <Typography variant="body2" fontWeight={600} color="text.primary" noWrap>
                                                            {getTeamMemberDisplayName(member)}
                                                        </Typography>

                                                        <Stack direction="row" spacing={0.75} alignItems="center" minWidth={0}>
                                                            <Typography variant="caption" color="text.secondary" noWrap>
                                                                {getTeamMemberSubtitle(member)}
                                                            </Typography>

                                                            {isExternal ? (
                                                                <Chip
                                                                    label="External"
                                                                    size="small"
                                                                    sx={{ height: 20, fontSize: '0.6rem', flexShrink: 0 }}
                                                                />
                                                            ) : null}
                                                        </Stack>
                                                    </Stack>
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
    shareUrl,
    shareTitle,
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
}: ProjectProfileViewProps) {
    const visibleSections = getVisibleSections(project, access);
    const [coachMarkOpen, setCoachMarkOpen] = React.useState(false);
    const settingsButtonRef = React.useRef<HTMLButtonElement | null>(null);

    const updatesSectionRef = React.useRef<HTMLDivElement | null>(null);
    const [updatesSectionFlash, setUpdatesSectionFlash] = React.useState(false);
    const [highlightedUpdateFlashId, setHighlightedUpdateFlashId] = React.useState<string | null>(null);

    const [shareAnchorEl, setShareAnchorEl] = React.useState<HTMLElement | null>(null);

    const handleOpenShareMenu = (event: React.MouseEvent<HTMLElement>) => {
        setShareAnchorEl(event.currentTarget);
    };

    const handleCloseShareMenu = () => {
        setShareAnchorEl(null);
    };

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

                                {shareUrl ? (
                                    <Button
                                        variant="outlined"
                                        fullWidth
                                        startIcon={<ShareRounded sx={{ fontSize: 14 }} />}
                                        onClick={handleOpenShareMenu}
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
                                <Box
                                    ref={updatesSectionRef}
                                    sx={{
                                        scrollMarginTop: 96,
                                        borderRadius: 2,
                                        transition: 'box-shadow 0.25s ease, background-color 0.25s ease',
                                        boxShadow: updatesSectionFlash ? '0 0 0 3px rgba(0, 137, 147, 0.18)' : 'none',
                                        bgcolor: updatesSectionFlash ? 'rgba(0, 137, 147, 0.04)' : 'transparent',
                                    }}
                                >
                                    <ProjectSectionCard
                                        title="Updates"
                                        subtitle="Latest project news and milestones"
                                        addable={canEdit}
                                        isOwner={canEdit}
                                        visibility={getSectionVisibility('updates')}
                                        onVisibilityChange={
                                            canEdit
                                                ? (value) => onSectionVisibilityChange?.('updates', value)
                                                : undefined
                                        }
                                        empty={!project.updates?.length}
                                        emptyText="No updates yet"
                                        emptyActionLabel={canEdit ? 'Post Update' : undefined}
                                        onEmptyAction={canEdit ? () => onOpenEditor?.('updates', null) : undefined}
                                        onAdd={canEdit ? () => onOpenEditor?.('updates', null) : undefined}
                                    >
                                        <Stack spacing={2}>
                                            {project.updates?.length
                                                ? project.updates.map((update, index) => {
                                                    const isHighlighted = highlightedUpdateFlashId === update.id;

                                                    return (
                                                        <Paper
                                                            key={update.id}
                                                            variant="outlined"
                                                            sx={{
                                                                p: 2,
                                                                borderRadius: 2,
                                                                transition: 'box-shadow 0.25s ease, border-color 0.25s ease, background-color 0.25s ease',
                                                                borderColor: isHighlighted ? 'primary.main' : 'grey.200',
                                                                boxShadow: isHighlighted
                                                                    ? '0 0 0 3px rgba(0, 137, 147, 0.14)'
                                                                    : 'none',
                                                                bgcolor: isHighlighted ? 'primary.50' : 'background.paper',
                                                            }}
                                                        >
                                                            <Stack spacing={1}>
                                                                <Stack
                                                                    direction={{ xs: 'column', sm: 'row' }}
                                                                    justifyContent="space-between"
                                                                    spacing={1}
                                                                >
                                                                    <Box sx={{ minWidth: 0, flex: 1 }}>
                                                                        <Typography variant="body2" fontWeight={700}>
                                                                            {update.title}
                                                                        </Typography>

                                                                        {update.authorName || update.dateLabel ? (
                                                                            <Typography variant="caption" color="text.secondary">
                                                                                {[update.authorName, update.dateLabel]
                                                                                    .filter(Boolean)
                                                                                    .join(' • ')}
                                                                            </Typography>
                                                                        ) : null}
                                                                    </Box>

                                                                    <Stack direction="row" spacing={1} alignItems="center" justifyContent="flex-end">
                                                                        {/* {update.type ? (
                                                                            <Chip
                                                                                size="small"
                                                                                label={update.type === 'stage' ? 'Stage change' : 'Progress'}
                                                                                variant="outlined"
                                                                                color={update.type === 'stage' ? 'primary' : 'default'}
                                                                            />
                                                                        ) : null} */}

                                                                        {canEdit ? (
                                                                            <IconButton
                                                                                size="small"
                                                                                onClick={(event) => onUpdateMenuClick?.(event, update, index)}
                                                                                sx={{ color: 'grey.500' }}
                                                                            >
                                                                                <MoreVertRounded sx={{ fontSize: 18 }} />
                                                                            </IconButton>
                                                                        ) : null}
                                                                    </Stack>
                                                                </Stack>

                                                                {update.description ? (
                                                                    <Typography variant="body2" color="text.secondary">
                                                                        {update.description}
                                                                    </Typography>
                                                                ) : null}
                                                            </Stack>
                                                        </Paper>
                                                    );
                                                })
                                                : null}
                                        </Stack>
                                    </ProjectSectionCard>
                                </Box>
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
                                                            : project.estimatedAnnualRemoval || '—',
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
            <ShareMenu
                anchorEl={shareAnchorEl}
                open={Boolean(shareAnchorEl)}
                onClose={handleCloseShareMenu}
                shareUrl={shareUrl || window.location.href}
                shareTitle={shareTitle || project.name}
            />
        </Box>
    );
}