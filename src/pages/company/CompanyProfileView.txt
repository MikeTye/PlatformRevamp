import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Typography,
    Button,
    Chip,
    Paper,
    Stack,
    Avatar,
    IconButton,
} from '@mui/material';
import ArrowBackRounded from '@mui/icons-material/ArrowBackRounded';
import EmailRounded from '@mui/icons-material/EmailRounded';
import LanguageRounded from '@mui/icons-material/LanguageRounded';
import ShareRounded from '@mui/icons-material/ShareRounded';
import AddRounded from '@mui/icons-material/AddRounded';
import EditRounded from '@mui/icons-material/EditRounded';
import DescriptionRounded from '@mui/icons-material/DescriptionRounded';
import GroupRounded from '@mui/icons-material/GroupRounded';
import FolderRounded from '@mui/icons-material/FolderRounded';
import ImageRounded from '@mui/icons-material/ImageRounded';
import CheckCircleRounded from '@mui/icons-material/CheckCircleRounded';
import RadioButtonUncheckedRounded from '@mui/icons-material/RadioButtonUncheckedRounded';
import SecurityRounded from '@mui/icons-material/Security';
import PhotoCameraRounded from '@mui/icons-material/PhotoCameraRounded';
import { ProfileCompleteness, CompletenessItem } from '../../components/ProfileCompleteness';
import MoreVertRounded from '@mui/icons-material/MoreVertRounded';

import { ProjectCard } from '../../components/cards/ProjectCard';
import { MediaGallery } from '../../components/MediaGallery';
import { ShareMenu as SharedShareMenu } from '../../components/ShareMenu';
import { EmptyState } from '../../components/EmptyState';
import {
    CompanyProfile,
    CompanyTeamMember,
    CompanyDocument,
    CompanySectionKey,
} from './companyProfile.types';

type Mode = 'view' | 'edit';

interface CompanyProfileViewProps {
    company: CompanyProfile;
    mode: Mode;

    backLabel: string;
    onBack: () => void;

    canEdit?: boolean;
    canContact?: boolean;
    canShare?: boolean;
    showOwnerBadge?: boolean;

    shareAnchorEl: HTMLElement | null;
    onOpenShare: (el: HTMLElement) => void;
    onCloseShare: () => void;

    onEditSection?: (section: CompanySectionKey) => void;
    canViewPrivateSection?: (section: CompanySectionKey) => boolean;

    onAddTeam?: () => void;
    onAddMedia?: () => void;
    onAddDocument?: () => void;
    onOpenProjectWizard?: () => void;

    renderTeamActions?: (member: CompanyTeamMember, index: number) => React.ReactNode;
    renderDocumentActions?: (doc: CompanyDocument, index: number) => React.ReactNode;
}

function defaultCanView() {
    return true;
}

function SectionHeader({
    title,
    count,
    onEdit,
    onAdd,
}: {
    title: string;
    count?: number;
    onEdit?: () => void;
    onAdd?: () => void;
}) {
    return (
        <Box
            sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                p: 2,
                borderBottom: 1,
                borderColor: 'grey.100',
                bgcolor: 'grey.50',
            }}
        >
            <Typography variant="subtitle2" fontWeight="bold" color="text.primary">
                {title}
                {count !== undefined && (
                    <Typography component="span" color="text.disabled" fontWeight="normal">
                        {' '}
                        ({count})
                    </Typography>
                )}
            </Typography>

            <Box display="flex" alignItems="center" gap={1}>
                {onAdd && (
                    <IconButton
                        size="small"
                        onClick={onAdd}
                        sx={{
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
                        }}
                    >
                        <AddRounded sx={{ fontSize: 16 }} />
                    </IconButton>
                )}
                {onEdit && (
                    <IconButton
                        size="small"
                        onClick={onEdit}
                        sx={{
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
                        }}
                    >
                        <EditRounded sx={{ fontSize: 16 }} />
                    </IconButton>
                )}
            </Box>
        </Box>
    );
}

function getInitials(name: string) {
    return name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? '')
        .join('');
}

function getFlagEmoji(countryCode?: string | null) {
    if (!countryCode) return '🌍';
    const code = countryCode.trim().toUpperCase();
    if (code.length !== 2) return '🌍';

    return String.fromCodePoint(
        ...[...code].map((char) => 127397 + char.charCodeAt(0))
    );
}

export function CompanyProfileView({
    company,
    mode,
    backLabel,
    onBack,
    canEdit = false,
    canContact = true,
    canShare = true,
    showOwnerBadge = false,
    shareAnchorEl,
    onOpenShare,
    onCloseShare,
    canViewPrivateSection = defaultCanView,
    onEditSection,
    onAddTeam,
    onAddMedia,
    onAddDocument,
    onOpenProjectWizard,
    renderTeamActions,
    renderDocumentActions,
}: CompanyProfileViewProps) {
    const isEditMode = mode === 'edit';
    const displayCompanyName =
        company.displayName?.trim() ||
        (company as any).name?.trim() ||
        'Untitled Company';

    const logoUrl = undefined;

    const companyType = company.type;
    const shortDescription = company.description?.trim();
    const fullDescription = company.fullDescription?.trim();
    const countryLabel = company.country?.trim();
    const countryFlag = getFlagEmoji(company.countryCode);
    const websiteHref =
        company.website && company.website.trim()
            ? company.website.startsWith('http')
                ? company.website
                : `https://${company.website}`
            : null;
    const isDraft = Boolean((company as any).isDraft);

    const navigate = useNavigate();

    const headerEdit = isEditMode && canEdit && onEditSection ? () => onEditSection('header') : undefined;
    const aboutEdit = isEditMode && canEdit && onEditSection ? () => onEditSection('about') : undefined;
    const teamEdit = isEditMode && canEdit && onEditSection ? () => onEditSection('team') : undefined;
    const docsEdit = isEditMode && canEdit && onEditSection ? () => onEditSection('documents') : undefined;
    const servicesEdit =
        isEditMode && canEdit && onEditSection ? () => onEditSection('services' as CompanySectionKey) : undefined;
    const serviceCategoriesEdit =
        isEditMode && canEdit && onEditSection
            ? () => onEditSection('serviceCategories' as CompanySectionKey)
            : undefined;
    const permissionsEdit =
        isEditMode && canEdit && onEditSection ? () => onEditSection('permissions') : undefined;
    const geographicalCoverageEdit =
        isEditMode && canEdit && onEditSection
            ? () => onEditSection('geographicalCoverage' as CompanySectionKey)
            : undefined;

    const roles: string[] =
        Array.isArray((company as any).roles) && (company as any).roles.length > 0
            ? (company as any).roles
            : Array.isArray((company as any).companyRoles) && (company as any).companyRoles.length > 0
                ? (company as any).companyRoles
                : companyType
                    ? [companyType]
                    : [];

    const isProjectDeveloper =
        roles.includes('Project Developer') || companyType === 'Project Developer';

    const isServiceProvider =
        roles.includes('Service Provider') || companyType === 'Service Provider';

    const completenessItems: CompletenessItem[] = [
        {
            id: 'basic-details',
            label: 'Basic company details',
            isComplete: Boolean(displayCompanyName && shortDescription),
            section: 'header',
        },
        {
            id: 'about',
            label: 'About section',
            isComplete: Boolean(fullDescription),
            section: 'about',
        },
        {
            id: 'project-types',
            label: 'Project types',
            isComplete:
                Array.isArray((company as any).projectTypes) &&
                (company as any).projectTypes.length > 0,
            section: 'projectTypes',
        },
        {
            id: 'team',
            label: 'Team',
            isComplete: Array.isArray(company.team) && company.team.length > 0,
            section: 'team',
        },
        {
            id: 'documents-media',
            label: 'Documents or media',
            isComplete:
                (Array.isArray(company.documents) && company.documents.length > 0) ||
                (Array.isArray(company.media) && company.media.length > 0),
            section: 'documents',
        },
        {
            id: 'services-offered',
            label: 'Services offered',
            isComplete: Array.isArray((company as any).services) && (company as any).services.length > 0,
            section: 'services',
        },
        {
            id: 'service-categories',
            label: 'Service categories',
            isComplete:
                isServiceProvider &&
                Array.isArray((company as any).serviceCategories) &&
                (company as any).serviceCategories.length > 0,
            section: 'serviceCategories',
        },
    ];

    return (
        <Box minHeight="100vh" bgcolor="grey.50">
            <Box bgcolor="white" borderBottom={1} borderColor="grey.200" px={3} py={1.5}>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box display="flex" alignItems="center" gap={2}>
                        <Button
                            startIcon={<ArrowBackRounded sx={{ fontSize: 16 }} />}
                            onClick={onBack}
                            sx={{
                                textTransform: 'none',
                                color: 'text.secondary',
                                '&:hover': { color: 'text.primary' },
                            }}
                        >
                            {backLabel}
                        </Button>

                        <Typography color="grey.300">|</Typography>

                        <Typography variant="body2" color="text.secondary">
                            {displayCompanyName}
                        </Typography>

                        {showOwnerBadge && (
                            <Chip
                                label="My Company"
                                size="small"
                                color="primary"
                                sx={{ height: 20, fontSize: '0.625rem' }}
                            />
                        )}
                    </Box>
                </Box>
            </Box>

            <Box p={3}>
                <Paper variant="outlined" sx={{ p: 3, mb: 3, borderRadius: 2 }}>
                    <Box display="flex" flexDirection={{ xs: 'column', md: 'row' }} gap={3}>
                        <Box flex={1} minWidth={0}>
                            <Box display="flex" alignItems="flex-start" gap={2} mb={2}>
                                <Box
                                    onClick={headerEdit}
                                    sx={{
                                        width: 80,
                                        height: 80,
                                        borderRadius: 2,
                                        bgcolor: 'grey.100',
                                        border: logoUrl ? 'none' : '2px dashed',
                                        borderColor: 'grey.300',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: headerEdit ? 'pointer' : 'default',
                                        flexShrink: 0,
                                        position: 'relative',
                                        overflow: 'hidden',
                                        '&:hover': headerEdit
                                            ? {
                                                borderColor: 'grey.400',
                                                bgcolor: logoUrl ? 'transparent' : 'grey.200',
                                                '& .edit-overlay': {
                                                    opacity: 1,
                                                },
                                            }
                                            : undefined,
                                    }}
                                >
                                    {logoUrl ? (
                                        <>
                                            <Box
                                                component="img"
                                                src={logoUrl}
                                                alt={displayCompanyName}
                                                sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                            />
                                            <Box
                                                className="edit-overlay"
                                                sx={{
                                                    position: 'absolute',
                                                    inset: 0,
                                                    bgcolor: 'rgba(0,0,0,0.5)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    opacity: 0,
                                                    transition: 'opacity 0.2s',
                                                }}
                                            >
                                                <EditRounded sx={{ color: 'white', fontSize: 20 }} />
                                            </Box>
                                        </>
                                    ) : displayCompanyName ? (
                                        <>
                                            <Avatar
                                                sx={{
                                                    width: 60,
                                                    height: 60,
                                                    bgcolor: 'grey.300',
                                                    fontSize: '1.25rem',
                                                }}
                                            >
                                                {getInitials(displayCompanyName)}
                                            </Avatar>
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
                                                    Edit
                                                </Typography>
                                            </Box>
                                        </>
                                    ) : (
                                        <>
                                            <PhotoCameraRounded sx={{ fontSize: 24, color: 'grey.400' }} />
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
                                                    Edit
                                                </Typography>
                                            </Box>
                                        </>
                                    )}
                                </Box>

                                <Box flex={1} minWidth={0}>
                                    <Box display="flex" alignItems="center" gap={1.5} mb={1} flexWrap="wrap">
                                        {roles.map((role) => (
                                            <Chip
                                                key={role}
                                                label={role}
                                                size="small"
                                                sx={{
                                                    height: 24,
                                                    fontSize: '0.75rem',
                                                    bgcolor: role === 'Project Developer' ? 'grey.100' : 'grey.200',
                                                    color: 'grey.700',
                                                    fontWeight: 500,
                                                }}
                                            />
                                        ))}
                                    </Box>

                                    <Box display="flex" alignItems="center" gap={1.5} mb={0.5} flexWrap="wrap">
                                        <Typography variant="h5" fontWeight="bold" color="text.primary">
                                            {displayCompanyName}
                                        </Typography>

                                        {isDraft && (
                                            <Chip
                                                label="Draft"
                                                size="small"
                                                sx={{
                                                    height: 24,
                                                    fontSize: '0.75rem',
                                                    bgcolor: '#fff3e0',
                                                    color: '#e65100',
                                                    fontWeight: 500,
                                                    '& .MuiChip-label': {
                                                        px: 1,
                                                    },
                                                }}
                                            />
                                        )}
                                    </Box>

                                    <Box
                                        display="flex"
                                        alignItems="center"
                                        gap={2}
                                        color="text.secondary"
                                        flexWrap="wrap"
                                        mb={1.5}
                                    >
                                        {countryLabel && (
                                            <Box display="flex" alignItems="center" gap={0.75}>
                                                <Typography fontSize="1rem">{countryFlag}</Typography>
                                                <Typography variant="body2">{countryLabel}</Typography>
                                            </Box>
                                        )}

                                        {company.website && websiteHref && (
                                            <Box display="flex" alignItems="center" gap={0.75}>
                                                <LanguageRounded sx={{ fontSize: 16 }} />
                                                <Typography
                                                    variant="body2"
                                                    component="a"
                                                    href={websiteHref}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    sx={{
                                                        color: 'primary.main',
                                                        textDecoration: 'none',
                                                        '&:hover': {
                                                            textDecoration: 'underline',
                                                        },
                                                    }}
                                                >
                                                    {company.website}
                                                </Typography>
                                            </Box>
                                        )}
                                    </Box>
                                </Box>
                            </Box>

                            {shortDescription ? (
                                <Typography variant="body2" color="text.secondary">
                                    {shortDescription}
                                </Typography>
                            ) : (
                                <Box
                                    onClick={headerEdit}
                                    sx={{
                                        p: 2,
                                        border: '1px dashed',
                                        borderColor: 'grey.300',
                                        borderRadius: 1,
                                        bgcolor: 'grey.50',
                                        cursor: headerEdit ? 'pointer' : 'default',
                                        '&:hover': headerEdit ? { bgcolor: 'grey.100' } : undefined,
                                    }}
                                >
                                    <Typography variant="body2" color="text.disabled" fontStyle="italic">
                                        Add a short description to help others understand what your company does...
                                    </Typography>
                                </Box>
                            )}
                        </Box>

                        <Box
                            sx={{
                                width: { xs: '100%', md: 200 },
                                flexShrink: 0,
                            }}
                            display="flex"
                            flexDirection="column"
                            gap={1.5}
                        >
                            {isEditMode && canEdit ? (
                                <Button
                                    variant="contained"
                                    fullWidth
                                    startIcon={<EditRounded sx={{ fontSize: 18 }} />}
                                    onClick={headerEdit}
                                    sx={{
                                        bgcolor: 'grey.900',
                                        textTransform: 'none',
                                        '&:hover': { bgcolor: 'grey.800' },
                                    }}
                                >
                                    Edit Company
                                </Button>
                            ) : canContact ? (
                                <Button
                                    variant="contained"
                                    fullWidth
                                    startIcon={<EmailRounded sx={{ fontSize: 16 }} />}
                                    sx={{ textTransform: 'none' }}
                                >
                                    Contact
                                </Button>
                            ) : null}

                            {isEditMode && canEdit && isProjectDeveloper && onOpenProjectWizard && (
                                <Button
                                    variant="outlined"
                                    fullWidth
                                    startIcon={<AddRounded sx={{ fontSize: 16 }} />}
                                    onClick={onOpenProjectWizard}
                                    sx={{ textTransform: 'none' }}
                                >
                                    Add Project
                                </Button>
                            )}

                            {canShare && (
                                <Button
                                    variant="outlined"
                                    fullWidth
                                    startIcon={<ShareRounded sx={{ fontSize: 14 }} />}
                                    onClick={(e) => onOpenShare(e.currentTarget)}
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
                            )}

                            <SharedShareMenu
                                anchorEl={shareAnchorEl}
                                open={Boolean(shareAnchorEl)}
                                onClose={onCloseShare}
                                shareUrl={window.location.href}
                                shareTitle={`${displayCompanyName} on The Carbon Economy`}
                            />
                        </Box>
                    </Box>
                </Paper>

                <Box display="flex" flexDirection={{ xs: 'column', md: 'row' }} gap={3}>
                    {/* Main column - mirrors MyCompanyPage left column */}
                    <Box
                        sx={{
                            flex: { xs: '1 1 100%', md: '0 0 66.666%' },
                            maxWidth: { xs: '100%', md: '66.666%' },
                            minWidth: 0,
                        }}
                    >
                        <Stack spacing={2}>
                            {canViewPrivateSection('about') && (
                                <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
                                    <SectionHeader title="About" onEdit={aboutEdit} />
                                    <Box p={3}>
                                        {fullDescription ? (
                                            <Typography variant="body2" color="text.secondary">
                                                {fullDescription}
                                            </Typography>
                                        ) : (
                                            <EmptyState
                                                icon={DescriptionRounded}
                                                title="Tell your company's story"
                                                description="Add a detailed description to help others understand your work"
                                                actionLabel={isEditMode && canEdit ? 'Add Description' : undefined}
                                                onAction={aboutEdit}
                                            />
                                        )}
                                    </Box>
                                </Paper>
                            )}

                            {canViewPrivateSection('media') && (
                                <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
                                    <SectionHeader title="Media" onAdd={isEditMode && canEdit ? onAddMedia : undefined} />
                                    <Box p={3}>
                                        <MediaGallery
                                            items={company.media || []}
                                            mode="grid"
                                            isOwner={isEditMode && canEdit}
                                            onAdd={isEditMode && canEdit ? onAddMedia : undefined}
                                            emptyStateMessage="No media yet. Add photos and videos to showcase your work."
                                        />
                                    </Box>
                                </Paper>
                            )}

                            {canViewPrivateSection('projects') && isProjectDeveloper && (
                                <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
                                    <SectionHeader
                                        title="Projects"
                                        count={company.projects?.length ?? 0}
                                        onAdd={isEditMode && canEdit ? onOpenProjectWizard : undefined}
                                    />
                                    <Box p={3}>
                                        {company.projects?.length ? (
                                            <Stack spacing={2}>
                                                {company.projects.map((project: any, index: number) => {
                                                    const projectRef =
                                                        project.upid?.trim() ||
                                                        project.id?.trim() ||
                                                        `project-${index}`;

                                                    return (
                                                        <ProjectCard
                                                            key={projectRef}
                                                            upid={projectRef}
                                                            name={project.name || 'Untitled Project'}
                                                            developer={displayCompanyName}
                                                            description={null}
                                                            stage={project.stage ?? 'Unknown'}
                                                            type={project.type ?? 'Unknown'}
                                                            country={project.country ?? null}
                                                            countryCode={project.countryCode ?? null}
                                                            hectares={project.hectares ?? null}
                                                            expectedCredits={project.expectedCredits ?? null}
                                                            photoUrl={null}
                                                            isSaved={false}
                                                            isMine={false}
                                                            variant="compact"
                                                        />
                                                    );
                                                })}
                                            </Stack>
                                        ) : (
                                            <EmptyState
                                                icon={AddRounded}
                                                title="No projects yet"
                                                description="Create your first project to start showcasing your pipeline."
                                                actionLabel={isEditMode && canEdit ? 'Add Project' : undefined}
                                                onAction={onOpenProjectWizard}
                                            />
                                        )}
                                    </Box>
                                </Paper>
                            )}

                            {canViewPrivateSection('projects') && isServiceProvider && (
                                <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
                                    <SectionHeader
                                        title="Projects Participated"
                                        count={(company as any).projectsParticipated?.length ?? 0}
                                    />
                                    <Box p={3}>
                                        {(company as any).projectsParticipated?.length ? (
                                            <Stack spacing={2}>
                                                {(company as any).projectsParticipated.map((project: any, index: number) => {
                                                    const projectRef =
                                                        project.upid?.trim() ||
                                                        project.id?.trim() ||
                                                        `project-participated-${index}`;

                                                    return (
                                                        <ProjectCard
                                                            key={projectRef}
                                                            upid={projectRef}
                                                            name={project.name || 'Untitled Project'}
                                                            developer={project.developer || displayCompanyName}
                                                            description={null}
                                                            stage={project.stage ?? 'Unknown'}
                                                            type={project.type ?? 'Unknown'}
                                                            country={project.country ?? null}
                                                            countryCode={project.countryCode ?? null}
                                                            hectares={project.hectares ?? null}
                                                            expectedCredits={project.expectedCredits ?? null}
                                                            photoUrl={null}
                                                            isSaved={false}
                                                            isMine={false}
                                                            variant="compact"
                                                        />
                                                    );
                                                })}
                                            </Stack>
                                        ) : (
                                            <Typography variant="body2" color="text.disabled" fontStyle="italic">
                                                No projects listed yet.
                                            </Typography>
                                        )}
                                    </Box>
                                </Paper>
                            )}

                            {isServiceProvider && canViewPrivateSection('services') && (
                                <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
                                    <SectionHeader
                                        title="Services Offered"
                                        count={Array.isArray((company as any).services) ? (company as any).services.length : 0}
                                        onEdit={servicesEdit}
                                    />
                                    <Box p={3}>
                                        {Array.isArray((company as any).services) && (company as any).services.length > 0 ? (
                                            <Box display="flex" flexDirection="column" gap={1.5}>
                                                <Box
                                                    display="flex"
                                                    flexDirection={{ xs: 'column', sm: 'row' }}
                                                    flexWrap="wrap"
                                                    gap={1.5}
                                                >
                                                    {(company as any).services.map((service: string) => (
                                                        <Box
                                                            key={service}
                                                            p={1.5}
                                                            bgcolor="grey.50"
                                                            border={1}
                                                            borderColor="grey.100"
                                                            borderRadius={1}
                                                            sx={{
                                                                flex: {
                                                                    xs: '1 1 100%',
                                                                    sm: '1 1 calc(50% - 6px)',
                                                                },
                                                                minWidth: {
                                                                    xs: '100%',
                                                                    sm: 'calc(50% - 6px)',
                                                                },
                                                            }}
                                                        >
                                                            <Typography variant="body2" color="text.primary">
                                                                {service}
                                                            </Typography>
                                                        </Box>
                                                    ))}
                                                </Box>
                                            </Box>
                                        ) : (
                                            <EmptyState
                                                icon={GroupRounded}
                                                title="No services listed"
                                                description="Add the services your company offers"
                                                actionLabel={isEditMode && canEdit ? 'Add Services' : undefined}
                                                onAction={servicesEdit}
                                            />
                                        )}
                                    </Box>
                                </Paper>
                            )}

                            {canViewPrivateSection('documents') && (
                                <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
                                    <SectionHeader
                                        title="Documents"
                                        count={company.documents?.length ?? 0}
                                        onAdd={isEditMode && canEdit ? onAddDocument : undefined}
                                        onEdit={docsEdit}
                                    />
                                    <Box p={3}>
                                        {company.documents?.length ? (
                                            <Stack spacing={1.5}>
                                                {company.documents.map((doc, index) => (
                                                    <Box
                                                        key={`${doc.name}-${index}`}
                                                        display="flex"
                                                        alignItems="center"
                                                        gap={1.5}
                                                    >
                                                        <Avatar
                                                            variant="rounded"
                                                            sx={{
                                                                width: 40,
                                                                height: 40,
                                                                bgcolor: 'grey.100',
                                                                color: 'text.secondary',
                                                            }}
                                                        >
                                                            <FolderRounded sx={{ fontSize: 18 }} />
                                                        </Avatar>

                                                        <Box flex={1} minWidth={0}>
                                                            <Typography variant="body2" fontWeight={500} noWrap>
                                                                {doc.name}
                                                            </Typography>
                                                            <Typography variant="caption" color="text.secondary" noWrap>
                                                                {[doc.type, (doc as any).date].filter(Boolean).join(' • ')}
                                                            </Typography>
                                                        </Box>

                                                        {renderDocumentActions?.(doc, index)}
                                                    </Box>
                                                ))}
                                            </Stack>
                                        ) : (
                                            <EmptyState
                                                icon={FolderRounded}
                                                title="No documents yet"
                                                description="Upload company documents such as profiles, reports, or supporting files."
                                                actionLabel={isEditMode && canEdit ? 'Add Document' : undefined}
                                                onAction={onAddDocument}
                                            />
                                        )}
                                    </Box>
                                </Paper>
                            )}
                        </Stack>
                    </Box>

                    {/* Sidebar - mirrors MyCompanyPage right column */}
                    <Box
                        sx={{
                            flex: { xs: '1 1 100%', md: '0 0 33.333%' },
                            maxWidth: { xs: '100%', md: '33.333%' },
                            minWidth: 0,
                        }}
                    >
                        <Stack spacing={2}>
                            <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
                                <SectionHeader title="Profile Completeness" onEdit={headerEdit} />
                                <Box p={2}>
                                    <ProfileCompleteness
                                        items={completenessItems}
                                        onItemClick={(item) => {
                                            if (isEditMode && canEdit && onEditSection) {
                                                onEditSection(item.section as CompanySectionKey);
                                            }
                                        }}
                                        title="Profile Completeness"
                                    />
                                </Box>
                            </Paper>

                            {canViewPrivateSection('team') && (
                                <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
                                    <SectionHeader
                                        title="Team"
                                        onAdd={isEditMode && canEdit ? onAddTeam : undefined}
                                    />
                                    <Box p={2}>
                                        {company.team?.length ? (
                                            <Stack spacing={1.5}>
                                                {company.team.map((member, index) => {

                                                    return (
                                                        <Box
                                                            key={`${member.name}-${index}`}
                                                            display="flex"
                                                            alignItems="center"
                                                            gap={1.5}
                                                        >
                                                            <Avatar
                                                                onClick={() => navigate(`/users/${member.id}`)}
                                                                sx={{
                                                                    width: 32,
                                                                    height: 32,
                                                                    bgcolor: 'grey.100',
                                                                    color: 'grey.500',
                                                                    fontSize: '0.75rem',
                                                                    fontWeight: 500,
                                                                    cursor: 'pointer',
                                                                }}
                                                            >
                                                                {getInitials(member.name)}
                                                            </Avatar>

                                                            <Box minWidth={0} flex={1}>
                                                                <Typography
                                                                    variant="body2"
                                                                    fontWeight="medium"
                                                                    color="primary.main"
                                                                    noWrap
                                                                    onClick={() => navigate(`/users/${member.id}`)}
                                                                    sx={{
                                                                        cursor: 'pointer',
                                                                        '&:hover': {
                                                                            textDecoration: 'underline',
                                                                        },
                                                                    }}
                                                                >
                                                                    {member.name}
                                                                </Typography>

                                                                <Typography
                                                                    variant="caption"
                                                                    color="text.secondary"
                                                                    noWrap
                                                                >
                                                                    {member.role}
                                                                </Typography>
                                                            </Box>

                                                            {renderTeamActions?.(member, index)}
                                                        </Box>
                                                    );
                                                })}
                                            </Stack>
                                        ) : (
                                            <Box
                                                onClick={onAddTeam}
                                                sx={{
                                                    p: 2,
                                                    border: '1px dashed',
                                                    borderColor: 'grey.300',
                                                    borderRadius: 1,
                                                    bgcolor: 'grey.50',
                                                    textAlign: 'center',
                                                    cursor: isEditMode && canEdit ? 'pointer' : 'default',
                                                    '&:hover': isEditMode && canEdit
                                                        ? { bgcolor: 'grey.100' }
                                                        : undefined,
                                                }}
                                            >
                                                <GroupRounded
                                                    sx={{
                                                        fontSize: 20,
                                                        color: 'grey.400',
                                                        mb: 0.5,
                                                    }}
                                                />
                                                <Typography
                                                    variant="caption"
                                                    color="text.disabled"
                                                    display="block"
                                                >
                                                    Add team members
                                                </Typography>
                                            </Box>
                                        )}
                                    </Box>
                                </Paper>
                            )}

                            {canViewPrivateSection('geographicalCoverage') && (
                                <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
                                    <SectionHeader
                                        title="Geographical Coverage"
                                        onEdit={geographicalCoverageEdit}
                                    />
                                    <Box p={2}>
                                        {company.geographicalCoverage?.length ? (
                                            <Box display="flex" flexWrap="wrap" gap={1}>
                                                {company.geographicalCoverage.map((item) => (
                                                    <Chip key={item} label={item} size="small" />
                                                ))}
                                            </Box>
                                        ) : (
                                            <Typography variant="body2" color="text.disabled" fontStyle="italic">
                                                No geographical coverage added yet.
                                            </Typography>
                                        )}
                                    </Box>
                                </Paper>
                            )}

                            <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
                                <SectionHeader title="Permissions" onEdit={permissionsEdit} />
                                <Box p={2}>
                                    {company.permissions?.length ? (
                                        <Stack spacing={1}>
                                            {company.permissions.slice(0, 3).map((member, index) => (
                                                <Box
                                                    key={`${member.name}-${index}`}
                                                    display="flex"
                                                    alignItems="center"
                                                    gap={1.5}
                                                >
                                                    <Avatar
                                                        sx={{
                                                            width: 28,
                                                            height: 28,
                                                            bgcolor: 'grey.100',
                                                            color: 'grey.600',
                                                            fontSize: '0.65rem',
                                                            fontWeight: 600,
                                                        }}
                                                    >
                                                        {getInitials(member.name)}
                                                    </Avatar>
                                                    <Box flex={1} minWidth={0}>
                                                        <Typography variant="body2" fontWeight={500} noWrap>
                                                            {member.name}
                                                        </Typography>
                                                    </Box>
                                                    <Chip
                                                        label={(member as any).permission ?? (member as any).role ?? 'Viewer'}
                                                        size="small"
                                                        sx={{ height: 20, fontSize: '0.65rem', fontWeight: 600 }}
                                                    />
                                                </Box>
                                            ))}

                                            {permissionsEdit && (
                                                <Button
                                                    size="small"
                                                    onClick={permissionsEdit}
                                                    sx={{
                                                        textTransform: 'none',
                                                        color: 'text.secondary',
                                                        justifyContent: 'flex-start',
                                                        pl: 0,
                                                        mt: 0.5,
                                                    }}
                                                >
                                                    Manage permissions →
                                                </Button>
                                            )}
                                        </Stack>
                                    ) : (
                                        <EmptyState
                                            icon={SecurityRounded}
                                            title="No permissions configured"
                                            description="Manage who can view and edit this company"
                                            actionLabel={permissionsEdit ? 'Manage Permissions' : undefined}
                                            onAction={permissionsEdit}
                                        />
                                    )}
                                </Box>
                            </Paper>

                            {canViewPrivateSection('projectTypes') && (
                                <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
                                    <SectionHeader
                                        title="Project Types"
                                        onEdit={
                                            isEditMode && canEdit && onEditSection
                                                ? () => onEditSection('projectTypes' as CompanySectionKey)
                                                : undefined
                                        }
                                    />
                                    <Box p={2}>
                                        {(company as any).projectTypes?.length ? (
                                            <Box display="flex" flexWrap="wrap" gap={1}>
                                                {(company as any).projectTypes.map((type: string) => (
                                                    <Chip
                                                        key={type}
                                                        label={type.toUpperCase()}
                                                        size="small"
                                                        variant="outlined"
                                                        sx={{ height: 24, fontSize: '0.625rem' }}
                                                    />
                                                ))}
                                            </Box>
                                        ) : (
                                            <Typography
                                                variant="body2"
                                                color="text.disabled"
                                                fontStyle="italic"
                                                sx={{ cursor: isEditMode && canEdit ? 'pointer' : 'default' }}
                                                onClick={
                                                    isEditMode && canEdit && onEditSection
                                                        ? () => onEditSection('projectTypes' as CompanySectionKey)
                                                        : undefined
                                                }
                                            >
                                                Add project types you work with
                                            </Typography>
                                        )}
                                    </Box>
                                </Paper>
                            )}

                            {isServiceProvider && canViewPrivateSection('serviceCategories') && (
                                <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
                                    <SectionHeader
                                        title="Service Categories"
                                        onEdit={serviceCategoriesEdit}
                                    />
                                    <Box p={2}>
                                        {(company as any).serviceCategories?.length ? (
                                            <Box display="flex" flexWrap="wrap" gap={1}>
                                                {(company as any).serviceCategories.map((cat: string) => (
                                                    <Chip
                                                        key={cat}
                                                        label={cat}
                                                        size="small"
                                                        sx={{
                                                            height: 24,
                                                            fontSize: '0.75rem',
                                                            bgcolor: 'grey.100',
                                                            color: 'grey.700',
                                                            fontWeight: 500,
                                                        }}
                                                    />
                                                ))}
                                            </Box>
                                        ) : (
                                            <Typography
                                                variant="body2"
                                                color="text.disabled"
                                                fontStyle="italic"
                                                sx={{ cursor: isEditMode && canEdit ? 'pointer' : 'default' }}
                                                onClick={serviceCategoriesEdit}
                                            >
                                                Add service categories
                                            </Typography>
                                        )}
                                    </Box>
                                </Paper>
                            )}
                        </Stack>
                    </Box>
                </Box>
            </Box>
        </Box>
    );
}