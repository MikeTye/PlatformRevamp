import React, { useMemo, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import ArrowBackRounded from '@mui/icons-material/ArrowBackRounded';
import EmailRounded from '@mui/icons-material/EmailRounded';
import LanguageRounded from '@mui/icons-material/LanguageRounded';
import ShareRounded from '@mui/icons-material/ShareRounded';
import DescriptionRounded from '@mui/icons-material/DescriptionRounded';
import {
    Box,
    Typography,
    Button,
    Chip,
    Paper,
    Stack,
    Avatar,
    Grid,
} from '@mui/material';

import { ProjectStage } from '../components/ProjectStageIndicator';
import { ProjectCard } from '../components/cards/ProjectCard';
import { MediaGallery, MediaItem } from '../components/MediaGallery';
import { ShareMenu as SharedShareMenu } from '../components/ShareMenu';
import { COMPANY_ROLE_OPTIONS } from '../constants/companies';

type CompanyType = (typeof COMPANY_ROLE_OPTIONS)[number]['id'];
type CompanyAccessRole = 'creator' | 'viewer' | null;
type CompanyPrivacyLevel = 'public' | 'company_users';

interface Project {
    upid: string;
    name: string;
    stage: ProjectStage;
    country?: string;
    countryCode?: string;
    type?: string;
    hectares?: number;
    expectedCredits?: string;
}

interface DocumentItem {
    id: string;
    name: string;
    type?: string | null;
    date?: string | null;
    url?: string | null;
}

interface CompanyPrivacyMap {
    overview: CompanyPrivacyLevel;
    team: CompanyPrivacyLevel;
    media: CompanyPrivacyLevel;
    documents: CompanyPrivacyLevel;
    projects: CompanyPrivacyLevel;
    services: CompanyPrivacyLevel;
    geographicalCoverage: CompanyPrivacyLevel;
    credits: CompanyPrivacyLevel;
}

interface CompanyDetailDto {
    id: string;
    slug: string;
    legalName: string;
    displayName?: string | null;
    type: CompanyType;
    serviceTypes?: string[];
    country?: string | null;
    countryCode?: string | null;
    description?: string | null;
    fullDescription?: string | null;
    logoUrl?: string | null;
    website?: string | null;

    isMyCompany: boolean;
    accessRole: CompanyAccessRole;

    privacy: CompanyPrivacyMap;

    projects?: Project[];
    projectsParticipated?: Project[];
    services?: string[];
    team?: { id: string; name: string; role: string; profileSlug?: string | null }[];
    media?: MediaItem[];
    geographicalCoverage?: string[];
    creditsIssuance?: {
        totalIssued?: string;
        annualCapacity?: string;
        standards?: string[];
    };
    documents?: DocumentItem[];
}


// Share Menu Component
function ShareMenu({
    anchorEl,
    onClose,
    title
}: { anchorEl: null | HTMLElement; onClose: () => void; title: string; }) {
    return (
        <SharedShareMenu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={onClose}
            shareUrl={window.location.href}
            shareTitle={title} />);
}

async function getCompanyDetail(companyIdOrSlug: string): Promise<CompanyDetailDto | null> {
    // stub for now; replace with real API later
    return {
        id: companyIdOrSlug,
        slug: companyIdOrSlug,
        legalName: 'Company Name',
        displayName: 'Company Name',
        type: 'Project Developer',
        country: 'Malaysia',
        countryCode: 'MY',
        description: 'Company description',
        fullDescription: 'Company full description',
        website: 'example.com',
        logoUrl: undefined,

        isMyCompany: false,
        accessRole: null,

        privacy: {
            overview: 'public',
            team: 'public',
            media: 'public',
            documents: 'company_users',
            projects: 'public',
            services: 'public',
            geographicalCoverage: 'public',
            credits: 'public'
        },

        team: [],
        media: [],
        documents: [],
        projects: [],
        projectsParticipated: [],
        services: [],
        geographicalCoverage: [],
        creditsIssuance: undefined,
        serviceTypes: [],
    };
}

export function CompanyDetailWireframe() {
    const { id } = useParams<{
        id: string;
    }>();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [shareAnchorEl, setShareAnchorEl] = useState<null | HTMLElement>(null);
    const [company, setCompany] = React.useState<CompanyDetailDto | null>(null);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        let cancelled = false;

        async function run() {
            if (!id) {
                setCompany(null);
                setLoading(false);
                return;
            }

            setLoading(true);
            try {
                const result = await getCompanyDetail(id);
                if (!cancelled) setCompany(result);
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        void run();
        return () => {
            cancelled = true;
        };
    }, [id]);

    const isMyCompany = company?.isMyCompany ?? false;
    const accessRole = company?.accessRole ?? null;
    const canEditCompany = accessRole === 'creator';
    const isCompanyUser = accessRole === 'creator' || accessRole === 'viewer';
    // Check where user came from for back navigation
    const fromParam = searchParams.get('from');
    // Universal back navigation based on 'from' param
    const handleBackNavigation = () => {
        if (fromParam === 'profile') {
            navigate('/account?tab=companies');
        } else if (isMyCompany) {
            navigate('/companies?tab=my');
        } else {
            navigate('/companies');
        }
    };

    const canViewPrivateSection = (section: keyof CompanyPrivacyMap) => {
        if (!company) return false;
        const isCompanyUser = company.accessRole === 'creator' || company.accessRole === 'viewer';
        return company.privacy[section] === 'public' || isCompanyUser;
    };

    const displayCompanyName = company?.displayName?.trim() || company?.legalName || '';

    // Get back button label
    const getBackLabel = () => {
        if (fromParam === 'profile') {
            return 'My Profile';
        }
        return isMyCompany ? 'My Companies' : 'Companies';
    };
    if (!company) {
        return (
            <Box minHeight="100vh" bgcolor="grey.50" p={3}>
                <Paper
                    variant="outlined"
                    sx={{
                        p: 6,
                        textAlign: 'center',
                        borderRadius: 2
                    }}>

                    <Typography color="text.secondary" mb={2}>
                        Company not found
                    </Typography>
                    <Button
                        variant="text"
                        onClick={() => navigate('/companies')}
                        sx={{
                            textTransform: 'none',
                            textDecoration: 'underline'
                        }}>

                        Back to Companies
                    </Button>
                </Paper>
            </Box>);

    }
    return (
        <Box minHeight="100vh" bgcolor="white" color="text.secondary">
            {/* Header Bar */}
            <Box
                bgcolor="white"
                borderBottom={1}
                borderColor="grey.200"
                px={3}
                py={1.5}>

                <Box display="flex" alignItems="center" gap={2}>
                    <Button
                        startIcon={
                            <ArrowBackRounded
                                sx={{
                                    fontSize: 16
                                }} />

                        }
                        onClick={handleBackNavigation}
                        sx={{
                            textTransform: 'none',
                            color: 'text.secondary',
                            '&:hover': {
                                color: 'text.primary'
                            }
                        }}>

                        {getBackLabel()}
                    </Button>
                    <Typography color="grey.300">|</Typography>
                    <Typography variant="body2" color="text.secondary">
                        {company.legalName}
                    </Typography>
                </Box>
            </Box>

            <Box p={3}>
                {/* Company Header + CTA */}
                <Paper
                    variant="outlined"
                    sx={{
                        p: 3,
                        mb: 3,
                        borderRadius: 2
                    }}>

                    <Box
                        display="flex"
                        flexDirection={{
                            xs: 'column',
                            md: 'row'
                        }}
                        gap={3}>

                        {/* Left: Company Info - Correct hierarchy */}
                        <Box flex={1} minWidth={0}>
                            {/* 1. Logo + Company Name row */}
                            <Box display="flex" alignItems="center" gap={2} mb={1}>
                                {/* Logo */}
                                <Box
                                    sx={{
                                        width: 56,
                                        height: 56,
                                        borderRadius: 2,
                                        flexShrink: 0,
                                        overflow: 'hidden',
                                        bgcolor: 'grey.100',
                                        border: '1px solid',
                                        borderColor: 'grey.200',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}>

                                    {company.logoUrl ?
                                        <Box
                                            component="img"
                                            src={company.logoUrl}
                                            alt={company.legalName}
                                            onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                                                e.currentTarget.style.display = 'none';
                                            }}
                                            sx={{
                                                width: '100%',
                                                height: '100%',
                                                objectFit: 'cover'
                                            }} /> :


                                        <Typography
                                            fontWeight="bold"
                                            color="grey.500"
                                            sx={{
                                                fontSize: '1.1rem',
                                                userSelect: 'none'
                                            }}>

                                            {company.legalName.substring(0, 2).toUpperCase()}
                                        </Typography>
                                    }
                                </Box>

                                {/* Name + verified badge */}
                                <Box display="flex" alignItems="center" gap={1}>
                                    <Typography
                                        variant="h5"
                                        fontWeight="bold"
                                        color="text.primary">

                                        {company.legalName}
                                    </Typography>
                                </Box>
                            </Box>

                            {/* 2. Chips - between title and description */}
                            <Box
                                display="flex"
                                alignItems="center"
                                gap={1}
                                mb={1.5}
                                flexWrap="wrap">

                                <Chip
                                    label={
                                        company.type === 'Project Developer' ?
                                            'Project Developer' :
                                            'Service Provider'
                                    }
                                    size="small"
                                    sx={{
                                        height: 24,
                                        fontSize: '0.75rem',
                                        bgcolor: 'grey.100',
                                        color: 'grey.700',
                                        border: 1,
                                        borderColor: 'grey.200',
                                        fontWeight: 500
                                    }} />

                                {company.type === 'Service Provider' &&
                                    company.serviceTypes?.map((type) =>
                                        <Chip
                                            key={type}
                                            label={type}
                                            size="small"
                                            sx={{
                                                height: 24,
                                                fontSize: '0.75rem',
                                                bgcolor: 'grey.100',
                                                color: 'grey.700',
                                                border: 1,
                                                borderColor: 'grey.200',
                                                fontWeight: 500
                                            }} />

                                    )}
                            </Box>

                            {/* 3. Description */}
                            <Typography variant="body2" color="text.secondary" mb={2}>
                                {company.description}
                            </Typography>

                            {/* 4. Meta: Country, Website */}
                            <Box
                                display="flex"
                                alignItems="center"
                                gap={2}
                                color="text.secondary"
                                flexWrap="wrap">

                                <Box display="flex" alignItems="center" gap={0.75}>
                                    <Typography variant="body2">{company.country}</Typography>
                                </Box>
                                {company.website &&
                                    <Box display="flex" alignItems="center" gap={0.75}>
                                        <LanguageRounded
                                            sx={{
                                                fontSize: 16
                                            }} />

                                        <Typography variant="body2">{company.website}</Typography>
                                    </Box>
                                }
                            </Box>
                        </Box>

                        {/* Right: CTA */}
                        <Box
                            sx={{
                                width: {
                                    xs: '100%',
                                    md: 256
                                },
                                flexShrink: 0
                            }}
                            display="flex"
                            flexDirection="column"
                            gap={1.5}>

                            <Button
                                variant="contained"
                                fullWidth
                                startIcon={
                                    <EmailRounded
                                        sx={{
                                            fontSize: 16
                                        }} />

                                }
                                sx={{
                                    textTransform: 'none'
                                }}>

                                Contact
                            </Button>
                            <Box>
                                <Button
                                    variant="outlined"
                                    fullWidth
                                    startIcon={
                                        <ShareRounded
                                            sx={{
                                                fontSize: 14
                                            }} />

                                    }
                                    onClick={(e) => setShareAnchorEl(e.currentTarget)}
                                    sx={{
                                        borderColor: 'grey.200',
                                        color: 'text.secondary',
                                        textTransform: 'none',
                                        '&:hover': {
                                            bgcolor: 'grey.50',
                                            borderColor: 'grey.300',
                                            color: 'text.primary'
                                        }
                                    }}>

                                    Share
                                </Button>
                                <SharedShareMenu
                                    anchorEl={shareAnchorEl}
                                    open={Boolean(shareAnchorEl)}
                                    onClose={() => setShareAnchorEl(null)}
                                    shareUrl={window.location.href}
                                    shareTitle={`${company.legalName} on The Carbon Economy`} />

                            </Box>
                        </Box>
                    </Box>
                </Paper>

                {/* TWO-COLUMN LAYOUT using Flexbox */}
                <Box
                    display="flex"
                    flexDirection={{
                        xs: 'column',
                        md: 'row'
                    }}
                    gap={3}>

                    {/* Main Content - 2/3 width on desktop */}
                    <Box
                        sx={{
                            flex: {
                                xs: '1 1 100%',
                                md: '1 1 66.666%'
                            },
                            minWidth: 0,
                            maxWidth: {
                                xs: '100%',
                                md: '66.666%'
                            }
                        }}>

                        <Stack spacing={3}>
                            {/* About Section */}
                            {canViewPrivateSection('overview') &&
                                <Paper
                                    variant="outlined"
                                    sx={{
                                        p: 2,
                                        borderRadius: 2,
                                        width: '100%'
                                    }}>

                                    <Typography
                                        variant="subtitle2"
                                        fontWeight="bold"
                                        color="text.primary"
                                        sx={{
                                            mb: 1.5
                                        }}>

                                        About
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" paragraph>
                                        {company.fullDescription || company.description}
                                    </Typography>
                                </Paper>
                            }

                            {/* Media Section */}
                            {canViewPrivateSection('media') && company.media && company.media.length > 0 && (
                                <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, width: '100%', position: 'relative' }}>
                                    <Typography variant="subtitle2" fontWeight="bold" color="text.primary" sx={{ mb: 1.5 }}>
                                        Media
                                    </Typography>
                                    <MediaGallery items={company.media} mode="carousel" />
                                </Paper>
                            )}

                            {/* Projects (for developers) */}
                            {canViewPrivateSection('projects') && company.type === 'Project Developer' && company.projects &&
                                <Paper
                                    variant="outlined"
                                    sx={{
                                        borderRadius: 2,
                                        overflow: 'hidden',
                                        width: '100%'
                                    }}>

                                    <Box p={2} borderBottom={1} borderColor="grey.100">
                                        <Typography
                                            variant="subtitle2"
                                            fontWeight="bold"
                                            color="text.primary">

                                            Projects{' '}
                                            <Typography
                                                component="span"
                                                color="text.disabled"
                                                fontWeight="normal">

                                                ({company.projects.length})
                                            </Typography>
                                        </Typography>
                                    </Box>
                                    <Box p={2}>
                                        <Grid container spacing={2}>
                                            {/* {company.projects.map((project) =>
                                                <Grid item xs={12} sm={6} key={project.upid}>
                                                    <ProjectCard
                                                        upid={project.upid}
                                                        name={project.name}
                                                        developer={company.legalName}
                                                        stage={project.stage}
                                                        type={project.type}
                                                        country={project.country}
                                                        countryCode={project.countryCode}
                                                        hectares={project.hectares}
                                                        expectedCredits={project.expectedCredits}
                                                        onClick={() =>
                                                            navigate(`/projects/${project.upid}`)
                                                        }
                                                        variant="compact" />

                                                </Grid>
                                            )} */}
                                        </Grid>
                                    </Box>
                                </Paper>
                            }

                            {/* Projects Participated (for service providers) */}
                            {canViewPrivateSection('projects') && company.type === 'Service Provider' &&
                                company.projectsParticipated &&
                                <Paper
                                    variant="outlined"
                                    sx={{
                                        borderRadius: 2,
                                        overflow: 'hidden',
                                        width: '100%'
                                    }}>

                                    <Box p={2} borderBottom={1} borderColor="grey.100">
                                        <Typography
                                            variant="subtitle2"
                                            fontWeight="bold"
                                            color="text.primary">

                                            Projects Participated{' '}
                                            <Typography
                                                component="span"
                                                color="text.disabled"
                                                fontWeight="normal">

                                                ({company.projectsParticipated.length})
                                            </Typography>
                                        </Typography>
                                    </Box>
                                    <Box p={2}>
                                        <Grid container spacing={2}>
                                            {/* {company.projectsParticipated.map((project) =>
                                                <Grid item xs={12} sm={6} key={project.upid}>
                                                    <ProjectCard
                                                        upid={project.upid}
                                                        name={project.name}
                                                        developer={company.legalName} // Or fetch actual developer if available
                                                        stage={project.stage}
                                                        type={project.type}
                                                        country={project.country}
                                                        countryCode={project.countryCode}
                                                        hectares={project.hectares}
                                                        expectedCredits={project.expectedCredits}
                                                        onClick={() =>
                                                            navigate(`/projects/${project.upid}`)
                                                        }
                                                        variant="compact" />

                                                </Grid>
                                            )} */}
                                        </Grid>
                                    </Box>
                                </Paper>
                            }

                            {/* Services (for providers) */}
                            {canViewPrivateSection('services') && company.type === 'Service Provider' && company.services &&
                                <Paper
                                    variant="outlined"
                                    sx={{
                                        borderRadius: 2,
                                        overflow: 'hidden',
                                        width: '100%'
                                    }}>

                                    <Box p={2} borderBottom={1} borderColor="grey.100">
                                        <Typography
                                            variant="subtitle2"
                                            fontWeight="bold"
                                            color="text.primary">

                                            Services Offered
                                        </Typography>
                                    </Box>
                                    <Box p={2}>
                                        <Box
                                            display="flex"
                                            flexDirection={{
                                                xs: 'column',
                                                sm: 'row'
                                            }}
                                            flexWrap="wrap"
                                            gap={1.5}>

                                            {company.services.map((service) =>
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
                                                            sm: '1 1 calc(50% - 6px)'
                                                        },
                                                        minWidth: {
                                                            xs: '100%',
                                                            sm: 'calc(50% - 6px)'
                                                        }
                                                    }}>

                                                    <Typography variant="body2" color="text.primary">
                                                        {service}
                                                    </Typography>
                                                </Box>
                                            )}
                                        </Box>
                                    </Box>
                                </Paper>
                            }
                        </Stack>
                    </Box>

                    {/* Sidebar - 1/3 width on desktop */}
                    <Box
                        sx={{
                            flex: {
                                xs: '1 1 100%',
                                md: '0 0 33.333%'
                            },
                            maxWidth: {
                                xs: '100%',
                                md: '33.333%'
                            }
                        }}>

                        <Stack spacing={2}>
                            {/* Team */}
                            {canViewPrivateSection('team') && company.team &&
                                <Paper
                                    variant="outlined"
                                    sx={{
                                        p: 2,
                                        borderRadius: 2,
                                        width: '100%'
                                    }}>

                                    <Typography
                                        variant="caption"
                                        fontWeight="bold"
                                        color="text.primary"
                                        sx={{
                                            display: 'block',
                                            mb: 1.5
                                        }}>

                                        Team
                                    </Typography>
                                    <Stack spacing={1.5}>
                                        {company.team.map((member) => {
                                            const userSlug = member.name.
                                                toLowerCase().
                                                replace(/\s+/g, '-');
                                            return (
                                                <Box
                                                    key={member.name}
                                                    display="flex"
                                                    alignItems="center"
                                                    gap={1.5}
                                                    onClick={() => navigate(`/users/${userSlug}`)}
                                                    sx={{
                                                        cursor: 'pointer',
                                                        borderRadius: 1,
                                                        p: 0.75,
                                                        mx: -0.75,
                                                        '&:hover': {
                                                            bgcolor: 'grey.50'
                                                        },
                                                        transition: 'background 0.15s'
                                                    }}>

                                                    <Avatar
                                                        sx={{
                                                            width: 32,
                                                            height: 32,
                                                            bgcolor: 'grey.100',
                                                            color: 'grey.500',
                                                            fontSize: '0.75rem',
                                                            fontWeight: 500,
                                                            flexShrink: 0
                                                        }}>

                                                        {member.name.
                                                            split(' ').
                                                            map((n) => n[0]).
                                                            join('').
                                                            slice(0, 2)}
                                                    </Avatar>
                                                    <Box minWidth={0}>
                                                        <Typography
                                                            variant="body2"
                                                            fontWeight="medium"
                                                            color="primary.main"
                                                            sx={{
                                                                '&:hover': {
                                                                    textDecoration: 'underline'
                                                                }
                                                            }}>

                                                            {member.name}
                                                        </Typography>
                                                        <Typography
                                                            variant="caption"
                                                            color="text.secondary">

                                                            {member.role}
                                                        </Typography>
                                                    </Box>
                                                </Box>);
                                        })}
                                    </Stack>
                                </Paper>
                            }

                            {/* Geographical Coverage */}
                            {canViewPrivateSection('geographicalCoverage') && company.geographicalCoverage &&
                                company.geographicalCoverage.length > 0 &&
                                <Paper
                                    variant="outlined"
                                    sx={{
                                        p: 2,
                                        borderRadius: 2,
                                        width: '100%'
                                    }}>

                                    <Typography
                                        variant="caption"
                                        fontWeight="bold"
                                        color="text.primary"
                                        sx={{
                                            display: 'block',
                                            mb: 1.5
                                        }}>

                                        Geographical Coverage
                                    </Typography>
                                    <Box display="flex" flexWrap="wrap" gap={1}>
                                        {company.geographicalCoverage.map((country) =>
                                            <Chip
                                                key={country}
                                                label={country}
                                                size="small"
                                                sx={{
                                                    bgcolor: 'grey.100',
                                                    color: 'grey.700'
                                                }} />

                                        )}
                                    </Box>
                                </Paper>
                            }

                            {/* Documents */}
                            {canViewPrivateSection('documents') && company.documents && company.documents.length > 0 && (
                                <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, width: '100%' }}>
                                    <Typography variant="caption" fontWeight="bold" color="text.primary" sx={{ display: 'block', mb: 1.5 }}>
                                        Documents
                                    </Typography>
                                    <Stack spacing={1}>
                                        {company.documents.map((doc) => (
                                            <Box
                                                key={doc.id}
                                                display="flex"
                                                alignItems="center"
                                                gap={1.5}
                                                p={1}
                                                borderRadius={1}
                                                sx={{ '&:hover': { bgcolor: 'grey.50', cursor: doc.url ? 'pointer' : 'default' } }}
                                            >
                                                <DescriptionRounded sx={{ fontSize: 16, color: 'grey.400' }} />
                                                <Box minWidth={0}>
                                                    <Typography variant="body2" fontWeight="medium" color="text.primary" noWrap>
                                                        {doc.name}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {[doc.type, doc.date].filter(Boolean).join(' • ')}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        ))}
                                    </Stack>
                                </Paper>
                            )}
                        </Stack>
                    </Box>
                </Box>
            </Box>
        </Box>);
}