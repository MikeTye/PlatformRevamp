import React from 'react';
import {
    Alert,
    Avatar,
    Box,
    Button,
    Chip,
    Divider,
    Grid,
    IconButton,
    Paper,
    Stack,
    Tooltip,
    Typography,
} from '@mui/material';
import EditRounded from '@mui/icons-material/EditRounded';
import AddRounded from '@mui/icons-material/AddRounded';
import LocationOnRounded from '@mui/icons-material/LocationOnRounded';
import BusinessRounded from '@mui/icons-material/BusinessRounded';
import DescriptionRounded from '@mui/icons-material/DescriptionRounded';
import ImageRounded from '@mui/icons-material/ImageRounded';
import AttachMoneyRounded from '@mui/icons-material/AttachMoneyRounded';
import PeopleRounded from '@mui/icons-material/PeopleRounded';
import TrendingUpRounded from '@mui/icons-material/TrendingUpRounded';
import ShieldRounded from '@mui/icons-material/ShieldRounded';
import PublicRounded from '@mui/icons-material/PublicRounded';
import LockRounded from '@mui/icons-material/LockRounded';

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
    name: string;
    roleLabel?: string;
    companyName?: string;
    avatarUrl?: string | null;
}

export interface ProjectOpportunity {
    id: string;
    type: string;
    description?: string | null;
    urgent?: boolean;
}

export interface ProjectUpdate {
    id: string;
    title: string;
    description?: string | null;
    dateLabel?: string | null;
    authorName?: string | null;
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

export interface ProjectServiceProvider {
    id: string;
    name: string;
    type?: string | null;
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
    coverImageUrl?: string | null;
    storyProblem?: string | null;
    storyApproach?: string | null;
    methodology?: string | null;
    registryName?: string | null;
    registryStatus?: string | null;
    registryProjectId?: string | null;
    totalAreaHa?: number | null;
    estimatedAnnualRemoval?: string | null;
    coBenefits?: Array<{ type: string; note?: string | null }>;
    readiness?: ProjectReadinessItem[];
    serviceProviders?: ProjectServiceProvider[];
    opportunities?: ProjectOpportunity[];
    updates?: ProjectUpdate[];
    documents?: ProjectDocument[];
    media?: ProjectMediaItem[];
    team?: ProjectTeamMember[];
    sectionVisibility?: Partial<Record<ProjectSectionKey, SectionVisibility>>;
}

export interface ProjectProfileViewProps {
    project: ProjectProfileData;
    mode: 'read' | 'edit';
    currentUserRole: ProjectRole | null;
    canEdit: boolean;
    isSaved?: boolean;
    onToggleSave?: () => void;
    onBack?: () => void;
    onOpenEditor?: (section: ProjectSectionKey) => void;
    onOpenSettings?: () => void;
    renderSidebarAnchor?: React.ReactNode;
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

function getVisibleSections(
    project: ProjectProfileData,
    currentUserRole: ProjectRole | null,
): Set<ProjectSectionKey> {
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

    if (currentUserRole === 'creator' || currentUserRole === 'viewer') {
        return new Set(allSections);
    }

    const visible = new Set<ProjectSectionKey>();
    for (const key of allSections) {
        const vis = project.sectionVisibility?.[key] ?? 'public';
        if (vis === 'public') visible.add(key);
    }
    return visible;
}

function shouldShowStageSection(
    section: ProjectSectionKey,
    stage: ProjectStage,
): boolean {
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

function SectionCard(props: {
    title: string;
    subtitle?: string;
    children: React.ReactNode;
    editable?: boolean;
    addable?: boolean;
    onEdit?: () => void;
    onAdd?: () => void;
}) {
    const { title, subtitle, children, editable, addable, onEdit, onAdd } = props;

    return (
        <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
            <Box
                sx={{
                    px: 3,
                    py: 2,
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: 2,
                }}
            >
                <Box minWidth={0}>
                    <Typography variant="h6" sx={{ fontSize: 18, fontWeight: 700 }}>
                        {title}
                    </Typography>
                    {subtitle ? (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                            {subtitle}
                        </Typography>
                    ) : null}
                </Box>

                <Stack direction="row" spacing={1} flexShrink={0}>
                    {addable ? (
                        <IconButton size="small" onClick={onAdd}>
                            <AddRounded fontSize="small" />
                        </IconButton>
                    ) : null}
                    {editable ? (
                        <IconButton size="small" onClick={onEdit}>
                            <EditRounded fontSize="small" />
                        </IconButton>
                    ) : null}
                </Stack>
            </Box>

            <Box sx={{ p: 3 }}>{children}</Box>
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
    const map: Record<ProjectReadinessItem['status'], { label: string; color: 'default' | 'success' | 'warning' | 'info' }> = {
        yes: { label: 'Ready', color: 'success' },
        progress: { label: 'In progress', color: 'info' },
        seeking: { label: 'Seeking', color: 'warning' },
        na: { label: 'Not started', color: 'default' },
    };

    return <Chip size="small" label={map[status].label} color={map[status].color} variant="outlined" />;
}

export default function ProjectProfileView({
    project,
    mode,
    currentUserRole,
    canEdit,
    isSaved,
    onToggleSave,
    onBack,
    onOpenEditor,
    onOpenSettings,
    renderSidebarAnchor,
}: ProjectProfileViewProps) {
    const visibleSections = getVisibleSections(project, currentUserRole);

    const canSee = (key: ProjectSectionKey) =>
        visibleSections.has(key) && shouldShowStageSection(key, project.stage);

    const editProps = (section: ProjectSectionKey) => ({
        editable: canEdit,
        onEdit: canEdit ? () => onOpenEditor?.(section) : undefined,
    });

    return (
        <Box sx={{ maxWidth: 1400, mx: 'auto', px: { xs: 2, md: 3 }, py: 3 }}>
            <Stack spacing={3}>
                <Paper
                    variant="outlined"
                    sx={{
                        borderRadius: 4,
                        overflow: 'hidden',
                    }}
                >
                    <Box
                        sx={{
                            minHeight: { xs: 180, md: 260 },
                            bgcolor: 'grey.100',
                            backgroundImage: project.coverImageUrl ? `url(${project.coverImageUrl})` : undefined,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            position: 'relative',
                        }}
                    >
                        {!project.coverImageUrl ? (
                            <Box
                                sx={{
                                    position: 'absolute',
                                    inset: 0,
                                    display: 'grid',
                                    placeItems: 'center',
                                }}
                            >
                                <Stack alignItems="center" spacing={1}>
                                    <ImageRounded sx={{ fontSize: 36, color: 'text.disabled' }} />
                                    <Typography variant="body2" color="text.secondary">
                                        No project cover yet
                                    </Typography>
                                </Stack>
                            </Box>
                        ) : null}
                    </Box>

                    <Box sx={{ p: { xs: 2, md: 3 } }}>
                        <Stack spacing={2.5}>
                            <Stack
                                direction={{ xs: 'column', md: 'row' }}
                                justifyContent="space-between"
                                alignItems={{ xs: 'flex-start', md: 'flex-start' }}
                                spacing={2}
                            >
                                <Box minWidth={0}>
                                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                        <StagePill stage={project.stage} />
                                        {project.type ? <Chip label={project.type} variant="outlined" /> : null}
                                        {project.upid ? <Chip label={project.upid} variant="outlined" /> : null}
                                    </Stack>

                                    <Typography
                                        variant="h4"
                                        sx={{
                                            mt: 1.5,
                                            fontWeight: 800,
                                            fontSize: { xs: 28, md: 36 },
                                        }}
                                    >
                                        {project.name}
                                    </Typography>

                                    <Stack
                                        direction="row"
                                        spacing={2}
                                        flexWrap="wrap"
                                        useFlexGap
                                        sx={{ mt: 1.25 }}
                                    >
                                        {project.companyName ? (
                                            <Stack direction="row" spacing={0.75} alignItems="center">
                                                <BusinessRounded sx={{ fontSize: 18, color: 'text.secondary' }} />
                                                <Typography variant="body2" color="text.secondary">
                                                    {project.companyName}
                                                </Typography>
                                            </Stack>
                                        ) : null}

                                        {project.country || project.region ? (
                                            <Stack direction="row" spacing={0.75} alignItems="center">
                                                <LocationOnRounded sx={{ fontSize: 18, color: 'text.secondary' }} />
                                                <Typography variant="body2" color="text.secondary">
                                                    {[project.region, project.country].filter(Boolean).join(', ')}
                                                </Typography>
                                            </Stack>
                                        ) : null}
                                    </Stack>

                                    {project.description ? (
                                        <Typography
                                            variant="body1"
                                            color="text.secondary"
                                            sx={{ mt: 2, maxWidth: 900 }}
                                        >
                                            {project.description}
                                        </Typography>
                                    ) : null}
                                </Box>

                                <Stack
                                    direction={{ xs: 'row', md: 'column' }}
                                    spacing={1}
                                    alignItems={{ xs: 'stretch', md: 'flex-end' }}
                                    sx={{ width: { xs: '100%', md: 'auto' } }}
                                >
                                    {onBack ? (
                                        <Button variant="outlined" onClick={onBack}>
                                            Back
                                        </Button>
                                    ) : null}

                                    {onToggleSave ? (
                                        <Button variant={isSaved ? 'contained' : 'outlined'} onClick={onToggleSave}>
                                            {isSaved ? 'Saved' : 'Save'}
                                        </Button>
                                    ) : null}

                                    {canEdit ? (
                                        <Button variant="contained" onClick={() => onOpenSettings?.()}>
                                            Project Settings
                                        </Button>
                                    ) : null}

                                    {renderSidebarAnchor}
                                </Stack>
                            </Stack>

                            {currentUserRole === null ? (
                                <Alert severity="info">
                                    Some sections may be hidden based on this project&apos;s visibility settings.
                                </Alert>
                            ) : null}
                        </Stack>
                    </Box>
                </Paper>

                <Grid container spacing={3}>
                    <Grid size={{ xs: 12, lg: 8 }}>
                        <Stack spacing={3}>
                            {canSee('overview') ? (
                                <SectionCard title="Overview" {...editProps('overview')}>
                                    <Grid container spacing={2}>
                                        <Grid size={{ xs: 12, md: 6 }}>
                                            <InfoLine label="Stage" value={project.stage} />
                                        </Grid>
                                        <Grid size={{ xs: 12, md: 6 }}>
                                            <InfoLine label="Project Type" value={project.type} />
                                        </Grid>
                                        <Grid size={{ xs: 12, md: 6 }}>
                                            <InfoLine
                                                label="Methodology"
                                                value={project.methodology}
                                            />
                                        </Grid>
                                        <Grid size={{ xs: 12, md: 6 }}>
                                            <InfoLine
                                                label="Registry Status"
                                                value={project.registryStatus}
                                            />
                                        </Grid>
                                        <Grid size={{ xs: 12, md: 6 }}>
                                            <InfoLine
                                                label="Project Area"
                                                value={project.totalAreaHa ? `${project.totalAreaHa.toLocaleString()} ha` : null}
                                            />
                                        </Grid>
                                        <Grid size={{ xs: 12, md: 6 }}>
                                            <InfoLine
                                                label="Estimated Annual Removal"
                                                value={project.estimatedAnnualRemoval}
                                            />
                                        </Grid>
                                    </Grid>
                                </SectionCard>
                            ) : null}

                            {canSee('story') ? (
                                <SectionCard title="Project Story" {...editProps('story')}>
                                    <Stack spacing={3}>
                                        {project.storyProblem ? (
                                            <Box>
                                                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                                                    Problem and Context
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    {project.storyProblem}
                                                </Typography>
                                            </Box>
                                        ) : null}

                                        {project.storyApproach ? (
                                            <Box>
                                                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                                                    Project Approach
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    {project.storyApproach}
                                                </Typography>
                                            </Box>
                                        ) : null}

                                        {project.coBenefits?.length ? (
                                            <Box>
                                                <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
                                                    Co-Benefits
                                                </Typography>
                                                <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                                                    {project.coBenefits.map((item, index) => (
                                                        <Chip
                                                            key={`${item.type}-${index}`}
                                                            label={item.note ? `${item.type}: ${item.note}` : item.type}
                                                            variant="outlined"
                                                        />
                                                    ))}
                                                </Stack>
                                            </Box>
                                        ) : null}
                                    </Stack>
                                </SectionCard>
                            ) : null}

                            {canSee('location') ? (
                                <SectionCard title="Location" {...editProps('location')}>
                                    <Grid container spacing={2}>
                                        <Grid size={{ xs: 12, md: 6 }}>
                                            <InfoLine label="Country" value={project.country} />
                                        </Grid>
                                        <Grid size={{ xs: 12, md: 6 }}>
                                            <InfoLine label="Region" value={project.region} />
                                        </Grid>
                                    </Grid>
                                </SectionCard>
                            ) : null}

                            {canSee('readiness') ? (
                                <SectionCard title="Readiness" {...editProps('readiness')}>
                                    <Stack spacing={1.5}>
                                        {project.readiness?.length ? (
                                            project.readiness.map((item) => (
                                                <Paper
                                                    key={item.id}
                                                    variant="outlined"
                                                    sx={{ borderRadius: 2, p: 2 }}
                                                >
                                                    <Stack
                                                        direction={{ xs: 'column', sm: 'row' }}
                                                        justifyContent="space-between"
                                                        spacing={1}
                                                    >
                                                        <Box>
                                                            <Typography variant="body2" fontWeight={700}>
                                                                {item.label}
                                                            </Typography>
                                                            {item.note ? (
                                                                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                                                    {item.note}
                                                                </Typography>
                                                            ) : null}
                                                        </Box>
                                                        <ReadinessChip status={item.status} />
                                                    </Stack>
                                                </Paper>
                                            ))
                                        ) : (
                                            <Typography variant="body2" color="text.secondary">
                                                No readiness items yet.
                                            </Typography>
                                        )}
                                    </Stack>
                                </SectionCard>
                            ) : null}

                            {canSee('registry') ? (
                                <SectionCard title="Registry and Methodology" {...editProps('registry')}>
                                    <Grid container spacing={2}>
                                        <Grid size={{ xs: 12, md: 6 }}>
                                            <InfoLine label="Registry" value={project.registryName} />
                                        </Grid>
                                        <Grid size={{ xs: 12, md: 6 }}>
                                            <InfoLine label="Registry Project ID" value={project.registryProjectId} />
                                        </Grid>
                                        <Grid size={{ xs: 12, md: 6 }}>
                                            <InfoLine label="Methodology" value={project.methodology} />
                                        </Grid>
                                        <Grid size={{ xs: 12, md: 6 }}>
                                            <InfoLine label="Status" value={project.registryStatus} />
                                        </Grid>
                                    </Grid>
                                </SectionCard>
                            ) : null}

                            {canSee('impact') ? (
                                <SectionCard title="Impact" {...editProps('impact')}>
                                    <Grid container spacing={2}>
                                        <Grid size={{ xs: 12, md: 6 }}>
                                            <InfoLine
                                                label="Estimated Annual Removal"
                                                value={project.estimatedAnnualRemoval}
                                            />
                                        </Grid>
                                        <Grid size={{ xs: 12, md: 6 }}>
                                            <InfoLine
                                                label="Project Area"
                                                value={project.totalAreaHa ? `${project.totalAreaHa.toLocaleString()} ha` : null}
                                            />
                                        </Grid>
                                    </Grid>
                                </SectionCard>
                            ) : null}

                            {canSee('opportunities') ? (
                                <SectionCard
                                    title="Opportunities"
                                    subtitle="What this project is currently seeking"
                                    addable={canEdit}
                                    onAdd={canEdit ? () => onOpenEditor?.('opportunities') : undefined}
                                    {...editProps('opportunities')}
                                >
                                    <Stack spacing={1.5}>
                                        {project.opportunities?.length ? (
                                            project.opportunities.map((item) => (
                                                <Paper key={item.id} variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                                                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                                                        <AttachMoneyRounded sx={{ fontSize: 18, color: 'text.secondary' }} />
                                                        <Typography variant="body2" fontWeight={700}>
                                                            {item.type}
                                                        </Typography>
                                                        {item.urgent ? <Chip label="Urgent" size="small" color="warning" /> : null}
                                                    </Stack>
                                                    {item.description ? (
                                                        <Typography variant="body2" color="text.secondary">
                                                            {item.description}
                                                        </Typography>
                                                    ) : null}
                                                </Paper>
                                            ))
                                        ) : (
                                            <Typography variant="body2" color="text.secondary">
                                                No opportunities posted.
                                            </Typography>
                                        )}
                                    </Stack>
                                </SectionCard>
                            ) : null}

                            {canSee('updates') ? (
                                <SectionCard
                                    title="Updates"
                                    addable={canEdit}
                                    onAdd={canEdit ? () => onOpenEditor?.('updates') : undefined}
                                    {...editProps('updates')}
                                >
                                    <Stack spacing={2}>
                                        {project.updates?.length ? (
                                            project.updates.map((item) => (
                                                <Paper key={item.id} variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                                                    <Stack spacing={0.75}>
                                                        <Typography variant="body1" fontWeight={700}>
                                                            {item.title}
                                                        </Typography>
                                                        {(item.dateLabel || item.authorName) && (
                                                            <Typography variant="caption" color="text.secondary">
                                                                {[item.dateLabel, item.authorName].filter(Boolean).join(' • ')}
                                                            </Typography>
                                                        )}
                                                        {item.description ? (
                                                            <Typography variant="body2" color="text.secondary">
                                                                {item.description}
                                                            </Typography>
                                                        ) : null}
                                                    </Stack>
                                                </Paper>
                                            ))
                                        ) : (
                                            <Typography variant="body2" color="text.secondary">
                                                No updates yet.
                                            </Typography>
                                        )}
                                    </Stack>
                                </SectionCard>
                            ) : null}

                            {canSee('documents') ? (
                                <SectionCard
                                    title="Documents"
                                    addable={canEdit}
                                    onAdd={canEdit ? () => onOpenEditor?.('documents') : undefined}
                                    {...editProps('documents')}
                                >
                                    <Stack spacing={1.5}>
                                        {project.documents?.length ? (
                                            project.documents.map((doc) => (
                                                <Paper key={doc.id} variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                                                    <Stack
                                                        direction={{ xs: 'column', md: 'row' }}
                                                        justifyContent="space-between"
                                                        spacing={1}
                                                    >
                                                        <Stack direction="row" spacing={1.25} alignItems="center">
                                                            <DescriptionRounded sx={{ fontSize: 18, color: 'text.secondary' }} />
                                                            <Box>
                                                                <Typography variant="body2" fontWeight={700}>
                                                                    {doc.name}
                                                                </Typography>
                                                                <Typography variant="caption" color="text.secondary">
                                                                    {[doc.type, doc.status, doc.dateLabel].filter(Boolean).join(' • ')}
                                                                </Typography>
                                                            </Box>
                                                        </Stack>
                                                    </Stack>
                                                </Paper>
                                            ))
                                        ) : (
                                            <Typography variant="body2" color="text.secondary">
                                                No documents uploaded.
                                            </Typography>
                                        )}
                                    </Stack>
                                </SectionCard>
                            ) : null}

                            {canSee('media') ? (
                                <SectionCard
                                    title="Media"
                                    addable={canEdit}
                                    onAdd={canEdit ? () => onOpenEditor?.('media') : undefined}
                                    {...editProps('media')}
                                >
                                    {project.media?.length ? (
                                        <Grid container spacing={2}>
                                            {project.media.map((item) => (
                                                <Grid key={item.id} size={{ xs: 12, sm: 6 }}>
                                                    <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
                                                        <Box
                                                            sx={{
                                                                aspectRatio: '16 / 10',
                                                                backgroundImage: `url(${item.url})`,
                                                                backgroundSize: 'cover',
                                                                backgroundPosition: 'center',
                                                                bgcolor: 'grey.100',
                                                            }}
                                                        />
                                                        <Box sx={{ p: 2 }}>
                                                            <Typography variant="body2" fontWeight={700}>
                                                                {item.caption || 'Untitled media'}
                                                            </Typography>
                                                            {item.dateLabel ? (
                                                                <Typography variant="caption" color="text.secondary">
                                                                    {item.dateLabel}
                                                                </Typography>
                                                            ) : null}
                                                        </Box>
                                                    </Paper>
                                                </Grid>
                                            ))}
                                        </Grid>
                                    ) : (
                                        <Typography variant="body2" color="text.secondary">
                                            No media uploaded.
                                        </Typography>
                                    )}
                                </SectionCard>
                            ) : null}
                        </Stack>
                    </Grid>

                    <Grid size={{ xs: 12, lg: 4 }}>
                        <Stack spacing={3}>
                            {canSee('team') ? (
                                <SectionCard title="Team and Service Providers" {...editProps('team')}>
                                    <Stack spacing={2}>
                                        {project.team?.length ? (
                                            <Box>
                                                <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
                                                    Team
                                                </Typography>
                                                <Stack spacing={1.5}>
                                                    {project.team.map((member) => (
                                                        <Stack key={member.id} direction="row" spacing={1.5} alignItems="center">
                                                            <Avatar src={member.avatarUrl ?? undefined}>
                                                                {member.name.slice(0, 1).toUpperCase()}
                                                            </Avatar>
                                                            <Box minWidth={0}>
                                                                <Typography variant="body2" fontWeight={700} noWrap>
                                                                    {member.name}
                                                                </Typography>
                                                                <Typography variant="caption" color="text.secondary" noWrap>
                                                                    {[member.roleLabel, member.companyName].filter(Boolean).join(' • ')}
                                                                </Typography>
                                                            </Box>
                                                        </Stack>
                                                    ))}
                                                </Stack>
                                            </Box>
                                        ) : null}

                                        {project.serviceProviders?.length ? (
                                            <>
                                                {project.team?.length ? <Divider /> : null}
                                                <Box>
                                                    <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
                                                        Service Providers
                                                    </Typography>
                                                    <Stack spacing={1.25}>
                                                        {project.serviceProviders.map((provider) => (
                                                            <Paper key={provider.id} variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
                                                                <Stack direction="row" spacing={1.25} alignItems="center">
                                                                    <PeopleRounded sx={{ fontSize: 18, color: 'text.secondary' }} />
                                                                    <Box minWidth={0}>
                                                                        <Typography variant="body2" fontWeight={700} noWrap>
                                                                            {provider.name}
                                                                        </Typography>
                                                                        {provider.type ? (
                                                                            <Typography variant="caption" color="text.secondary" noWrap>
                                                                                {provider.type}
                                                                            </Typography>
                                                                        ) : null}
                                                                    </Box>
                                                                </Stack>
                                                            </Paper>
                                                        ))}
                                                    </Stack>
                                                </Box>
                                            </>
                                        ) : null}

                                        {!project.team?.length && !project.serviceProviders?.length ? (
                                            <Typography variant="body2" color="text.secondary">
                                                No team or providers added yet.
                                            </Typography>
                                        ) : null}
                                    </Stack>
                                </SectionCard>
                            ) : null}

                            <SectionCard title="Access">
                                <Stack spacing={1.25}>
                                    <AccessRow
                                        icon={currentUserRole ? <ShieldRounded fontSize="small" /> : <PublicRounded fontSize="small" />}
                                        label="Your access"
                                        value={
                                            currentUserRole === 'creator'
                                                ? 'Creator'
                                                : currentUserRole === 'viewer'
                                                    ? 'Viewer'
                                                    : 'Public visitor'
                                        }
                                    />
                                    <AccessRow
                                        icon={
                                            project.sectionVisibility?.overview === 'private'
                                                ? <LockRounded fontSize="small" />
                                                : <PublicRounded fontSize="small" />
                                        }
                                        label="Visibility model"
                                        value="Section-based"
                                    />
                                    {mode === 'edit' ? (
                                        <Typography variant="caption" color="text.secondary">
                                            Sidebar editor is handled separately.
                                        </Typography>
                                    ) : null}
                                </Stack>
                            </SectionCard>
                        </Stack>
                    </Grid>
                </Grid>
            </Stack>
        </Box>
    );
}

function InfoLine({ label, value }: { label: string; value?: React.ReactNode | null }) {
    return (
        <Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                {label}
            </Typography>
            <Typography variant="body2" fontWeight={600}>
                {value || '—'}
            </Typography>
        </Box>
    );
}

function AccessRow({
    icon,
    label,
    value,
}: {
    icon: React.ReactNode;
    label: string;
    value: string;
}) {
    return (
        <Stack direction="row" spacing={1.25} alignItems="center">
            <Box
                sx={{
                    width: 32,
                    height: 32,
                    borderRadius: 2,
                    display: 'grid',
                    placeItems: 'center',
                    bgcolor: 'grey.100',
                    color: 'text.secondary',
                    flexShrink: 0,
                }}
            >
                {icon}
            </Box>
            <Box minWidth={0}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                    {label}
                </Typography>
                <Typography variant="body2" fontWeight={600}>
                    {value}
                </Typography>
            </Box>
        </Stack>
    );
}