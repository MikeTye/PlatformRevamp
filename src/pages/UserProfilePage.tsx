import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ArrowBackRounded from '@mui/icons-material/ArrowBackRounded';
import EmailRounded from '@mui/icons-material/EmailRounded';
import BusinessRounded from '@mui/icons-material/BusinessRounded';
import ShareRounded from '@mui/icons-material/ShareRounded';
import {
    Box,
    Typography,
    Button,
    Chip,
    Paper,
    Stack,
    Avatar,
    CircularProgress,
} from '@mui/material';
import {
    ProjectStage,
    ProjectStageIndicator,
} from '../components/ProjectStageIndicator';
import { ShareMenu as SharedShareMenu } from '../components/ShareMenu';
import countryCodes from '../data/countrycode.json';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

type AccountResponse = {
    user: {
        id: string;
        email: string;
    };
    profile: {
        fullName: string;
        headline: string;
        jobTitle: string;
        bio: string;
        phoneNumber: string;
        contactEmail: string;
        country: string;
        city: string;
        timezone: string;
        roleType: string;
        expertiseTags: string[];
        serviceOfferings: string[];
        sectors: string[];
        standards: string[];
        languages: string[];
        personalWebsite: string;
        linkedinUrl: string;
        portfolioUrl: string;
        isPublic: boolean;
        showPhone: boolean;
        showContactEmail: boolean;
    };
    affiliations?: Array<{
        id?: string;
        companyId: string | null;
        companyName: string;
        role: string;
        permission: 'creator' | 'viewer';
    }>;
    stats?: {
        companyCount: number;
        projectCount: number;
    };
};

type AccountCompaniesResponse = {
    items: Array<{
        id?: string;
        companyId: string | null;
        companyName: string;
        role: string;
        permission: 'creator' | 'viewer';
    }>;
};

type AccountProjectsResponse = {
    items: Array<{
        id?: string;
        projectId: string;
        projectName: string;
        stage: string;
        type: string;
        country: string;
        role: string;
        permission: 'creator' | 'viewer';
        memberType: 'user' | 'company';
        source: 'direct' | 'company';
        companyId: string | null;
        companyName: string;
    }>;
};

interface UserProfile {
    id: string;
    name: string;
    title: string;
    company: string;
    companyId: string;
    companyRole: string;
    country: string;
    countryCode: string;
    summary: string;
    services: string[];
    expertise: string[];
    sectors: string[];
    standards: string[];
    languages: string[];
    contactEmail: string;
    projects: {
        upid: string;
        name: string;
        stage: ProjectStage;
        type: string;
        country: string;
        countryCode: string;
        role: string;
    }[];
}
type CountryCodeItem = {
    country: string;
    code: string;
    iso: string;
};

const countryCodeMap = new Map(
    (countryCodes as CountryCodeItem[]).map((item) => [
        item.country.trim().toLowerCase(),
        item.iso.trim().toUpperCase(),
    ])
);

function getCountryCode(country: string): string {
    if (!country) return '';
    return countryCodeMap.get(country.trim().toLowerCase()) ?? '';
}


function getInitials(name: string): string {
    const safeName = (name || '').trim();
    if (!safeName) return 'U';

    const parts = safeName.split(/\s+/);
    if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return safeName.substring(0, 2).toUpperCase();
}

function SectionPlaceholder({ text }: { text: string }) {
    return (
        <Typography
            variant="body2"
            color="text.disabled"
            sx={{
                fontStyle: 'italic',
                lineHeight: 1.6,
            }}
        >
            {text}
        </Typography>
    );
}

function normalizeProjectStage(stage: string): ProjectStage {
    const value = (stage || '').trim().toLowerCase();

    switch (value) {
        case 'exploration':
            return 'Exploration';

        case 'concept':
        case 'idea':
            return 'Concept';

        case 'design':
        case 'development':
        case 'in_development':
        case 'active':
            return 'Design';

        case 'listed':
            return 'Listed';

        case 'validation':
        case 'validated':
            return 'Validation';

        case 'registered':
            return 'Registered';

        case 'issued':
            return 'Issued';

        case 'closed':
        case 'completed':
            return 'Closed';

        default:
            return 'Concept'; // safe fallback
    }
}

function mapAccountToUserProfile(
    data: AccountResponse,
    companies: AccountCompaniesResponse['items'] = [],
    projects: AccountProjectsResponse['items'] = []
): UserProfile {
    const primaryAffiliation =
        companies[0] ??
        data.affiliations?.[0] ??
        null;

    const countryCode = getCountryCode(data.profile.country);

    return {
        id: data.user.id,
        name: data.profile.fullName || 'Unnamed User',
        title:
            data.profile.jobTitle ||
            data.profile.headline ||
            data.profile.roleType ||
            '',
        company: primaryAffiliation?.companyName ?? '',
        companyId: primaryAffiliation?.companyId ?? '',
        companyRole: primaryAffiliation?.role ?? '',
        country: data.profile.country || '',
        countryCode,
        summary: data.profile.bio || '',
        services: data.profile.serviceOfferings ?? [],
        expertise: data.profile.expertiseTags ?? [],
        sectors: data.profile.sectors ?? [],
        standards: data.profile.standards ?? [],
        languages: data.profile.languages ?? [],
        contactEmail: data.profile.contactEmail || '',
        projects: projects.map((project) => ({
            upid: project.projectId,
            name: project.projectName || 'Untitled Project',
            stage: normalizeProjectStage(project.stage),
            type: project.type || '',
            country: project.country || '',
            countryCode: getCountryCode(project.country || ''),
            role: project.role || project.companyName || '',
        })),
    };
}

async function fetchOwnAccountProfile(): Promise<AccountResponse> {
    const response = await fetch(`${API_BASE_URL}/account`, {
        method: 'GET',
        credentials: 'include',
        headers: {
            Accept: 'application/json',
        },
    });

    if (response.status === 401) {
        throw new Error('UNAUTHORIZED');
    }

    if (response.status === 404) {
        throw new Error('NOT_FOUND');
    }

    if (!response.ok) {
        throw new Error(`Failed to load profile (${response.status})`);
    }

    return response.json();
}

async function fetchOwnCompanies(): Promise<AccountCompaniesResponse['items']> {
    const response = await fetch(`${API_BASE_URL}/account/companies`, {
        method: 'GET',
        credentials: 'include',
        headers: {
            Accept: 'application/json',
        },
    });

    if (response.status === 401) {
        throw new Error('UNAUTHORIZED');
    }

    if (!response.ok) {
        throw new Error(`Failed to load companies (${response.status})`);
    }

    const data: AccountCompaniesResponse = await response.json();
    return Array.isArray(data.items) ? data.items : [];
}

async function fetchOwnProjects(): Promise<AccountProjectsResponse['items']> {
    const response = await fetch(`${API_BASE_URL}/account/projects`, {
        method: 'GET',
        credentials: 'include',
        headers: {
            Accept: 'application/json',
        },
    });

    if (response.status === 401) {
        throw new Error('UNAUTHORIZED');
    }

    if (!response.ok) {
        throw new Error(`Failed to load projects (${response.status})`);
    }

    const data: AccountProjectsResponse = await response.json();
    return Array.isArray(data.items) ? data.items : [];
}

async function fetchPublicProfile(userId: string): Promise<AccountResponse> {
    const response = await fetch(`${API_BASE_URL}/account/${encodeURIComponent(userId)}/profile`, {
        method: 'GET',
        credentials: 'include',
        headers: {
            Accept: 'application/json',
        },
    });

    if (response.status === 404) {
        throw new Error('NOT_FOUND');
    }

    if (!response.ok) {
        throw new Error(`Failed to load profile (${response.status})`);
    }

    return response.json();
}

async function fetchPublicCompanies(userId: string): Promise<AccountCompaniesResponse['items']> {
    const response = await fetch(`${API_BASE_URL}/account/${encodeURIComponent(userId)}/companies`, {
        method: 'GET',
        credentials: 'include',
        headers: {
            Accept: 'application/json',
        },
    });

    if (response.status === 404) {
        throw new Error('NOT_FOUND');
    }

    if (!response.ok) {
        throw new Error(`Failed to load companies (${response.status})`);
    }

    const data: AccountCompaniesResponse = await response.json();
    return Array.isArray(data.items) ? data.items : [];
}

async function fetchPublicProjects(userId: string): Promise<AccountProjectsResponse['items']> {
    const response = await fetch(`${API_BASE_URL}/account/${encodeURIComponent(userId)}/projects`, {
        method: 'GET',
        credentials: 'include',
        headers: {
            Accept: 'application/json',
        },
    });

    if (response.status === 404) {
        throw new Error('NOT_FOUND');
    }

    if (!response.ok) {
        throw new Error(`Failed to load projects (${response.status})`);
    }

    const data: AccountProjectsResponse = await response.json();
    return Array.isArray(data.items) ? data.items : [];
}

export function UserProfilePage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [shareAnchorEl, setShareAnchorEl] = useState<null | HTMLElement>(null);
    const [user, setUser] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const isOwnProfileMode = useMemo(() => {
        // current backend only supports GET /account for the authenticated user.
        // keep route param in place for future public profile endpoint support.
        return !id || id === 'me';
    }, [id]);

    useEffect(() => {
        let isMounted = true;

        async function load() {
            setLoading(true);
            setError(null);

            try {
                const isOwn = !id || id === 'me';

                const [account, companies, projects] = isOwn
                    ? await Promise.all([
                        fetchOwnAccountProfile(),
                        fetchOwnCompanies(),
                        fetchOwnProjects(),
                    ])
                    : await Promise.all([
                        fetchPublicProfile(id),
                        fetchPublicCompanies(id),
                        fetchPublicProjects(id),
                    ]);

                if (!isMounted) return;

                setUser(mapAccountToUserProfile(account, companies, projects));
            } catch (err) {
                if (!isMounted) return;

                const message =
                    err instanceof Error ? err.message : 'Failed to load profile';
                setError(message);
                setUser(null);
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        }

        load();

        return () => {
            isMounted = false;
        };
    }, [id]);

    if (loading) {
        return (
            <Box minHeight="100vh" bgcolor="white" p={3}>
                <Paper
                    variant="outlined"
                    sx={{
                        p: 6,
                        textAlign: 'center',
                        borderRadius: 2,
                    }}
                >
                    <CircularProgress size={28} />
                    <Typography color="text.secondary" mt={2}>
                        Loading profile...
                    </Typography>
                </Paper>
            </Box>
        );
    }

    if (error || !user) {
        return (
            <Box minHeight="100vh" bgcolor="white" p={3}>
                <Paper
                    variant="outlined"
                    sx={{
                        p: 6,
                        textAlign: 'center',
                        borderRadius: 2,
                    }}
                >
                    <Typography color="text.secondary" mb={2}>
                        {error === 'UNAUTHORIZED'
                            ? 'Please sign in to view this profile'
                            : 'User profile not found'}
                    </Typography>
                    <Button
                        variant="text"
                        onClick={() => navigate(-1)}
                        sx={{ textTransform: 'none' }}
                    >
                        Go back
                    </Button>
                </Paper>
            </Box>
        );
    }

    const canShowCompany = Boolean(user.company && user.companyId);
    const canContact = Boolean(user.contactEmail);

    return (
        <Box minHeight="100vh" bgcolor="white" color="text.secondary">
            <Box bgcolor="white" borderBottom={1} borderColor="grey.200" px={3} py={1.5}>
                <Box display="flex" alignItems="center" gap={2}>
                    <Button
                        startIcon={<ArrowBackRounded sx={{ fontSize: 16 }} />}
                        onClick={() => navigate(-1)}
                        sx={{
                            textTransform: 'none',
                            color: 'text.secondary',
                            '&:hover': {
                                color: 'text.primary',
                            },
                        }}
                    >
                        Back
                    </Button>
                    <Typography color="grey.300">|</Typography>
                    <Typography variant="body2" color="text.secondary">
                        {user.name}
                    </Typography>
                </Box>
            </Box>

            <Box p={3}>
                <Paper
                    variant="outlined"
                    sx={{
                        p: 3,
                        mb: 3,
                        borderRadius: 2,
                    }}
                >
                    <Box
                        display="flex"
                        flexDirection={{ xs: 'column', sm: 'row' }}
                        gap={3}
                        alignItems={{ xs: 'flex-start', sm: 'center' }}
                    >
                        <Avatar
                            sx={{
                                width: 72,
                                height: 72,
                                bgcolor: 'grey.800',
                                color: 'white',
                                fontSize: '1.5rem',
                                fontWeight: 700,
                                flexShrink: 0,
                            }}
                        >
                            {getInitials(user.name)}
                        </Avatar>

                        <Box flex={1} minWidth={0}>
                            <Typography
                                variant="h5"
                                fontWeight="bold"
                                color="text.primary"
                                mb={0.5}
                            >
                                {user.name}
                            </Typography>

                            <Typography variant="caption" color="text.secondary">
                                {user.companyRole || user.title || 'Member'}
                            </Typography>

                            <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                                {canShowCompany && (
                                    <Chip
                                        icon={<BusinessRounded sx={{ fontSize: 14 }} />}
                                        label={user.company}
                                        size="small"
                                        onClick={() => navigate(`/companies/${user.companyId}`)}
                                        sx={{
                                            height: 24,
                                            fontSize: '0.75rem',
                                            bgcolor: 'grey.100',
                                            color: 'grey.700',
                                            cursor: 'pointer',
                                            '&:hover': {
                                                bgcolor: 'grey.200',
                                            },
                                        }}
                                    />
                                )}

                                {user.country && (
                                    <Box display="flex" alignItems="center" gap={0.5}>
                                        {user.countryCode && (
                                            <Typography fontSize="0.875rem">{user.countryCode}</Typography>
                                        )}
                                        <Typography variant="caption" color="text.secondary">
                                            {user.country}
                                        </Typography>
                                    </Box>
                                )}
                            </Box>
                        </Box>

                        <Box display="flex" gap={1} flexShrink={0}>
                            <Button
                                variant="contained"
                                startIcon={<EmailRounded sx={{ fontSize: 16 }} />}
                                onClick={() => {
                                    if (!canContact) return;
                                    window.location.href = `mailto:${user.contactEmail}`;
                                }}
                                disabled={!canContact}
                                sx={{ textTransform: 'none' }}
                            >
                                Contact
                            </Button>

                            <Button
                                variant="outlined"
                                startIcon={<ShareRounded sx={{ fontSize: 14 }} />}
                                onClick={(e) => setShareAnchorEl(e.currentTarget)}
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

                            <SharedShareMenu
                                anchorEl={shareAnchorEl}
                                open={Boolean(shareAnchorEl)}
                                onClose={() => setShareAnchorEl(null)}
                                shareUrl={window.location.href}
                                shareTitle={`${user.name}${user.title ? ` — ${user.title}` : ''}${user.company ? ` at ${user.company}` : ''}`}
                            />
                        </Box>
                    </Box>
                </Paper>

                <Box
                    display="flex"
                    flexDirection={{ xs: 'column', md: 'row' }}
                    gap={3}
                >
                    <Box
                        sx={{
                            flex: { xs: '1 1 100%', md: '1 1 66.666%' },
                            minWidth: 0,
                            maxWidth: { xs: '100%', md: '66.666%' },
                        }}
                    >
                        <Stack spacing={3}>
                            <Paper
                                variant="outlined"
                                sx={{
                                    p: 2.5,
                                    borderRadius: 2,
                                }}
                            >
                                <Typography
                                    variant="subtitle2"
                                    fontWeight="bold"
                                    color="text.primary"
                                    mb={1.5}
                                >
                                    Professional Summary
                                </Typography>
                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    sx={{ lineHeight: 1.7 }}
                                >
                                    <Box sx={{ lineHeight: 1.7 }}>
                                        {user.summary ? (
                                            <Typography variant="body2" color="text.secondary">
                                                {user.summary}
                                            </Typography>
                                        ) : (
                                            <SectionPlaceholder text="No professional summary added yet." />
                                        )}
                                    </Box>
                                </Typography>
                            </Paper>

                            <Paper
                                variant="outlined"
                                sx={{
                                    p: 2.5,
                                    borderRadius: 2,
                                }}
                            >
                                <Typography
                                    variant="subtitle2"
                                    fontWeight="bold"
                                    color="text.primary"
                                    mb={1.5}
                                >
                                    Services Supported
                                </Typography>

                                {user.services.length > 0 ? (
                                    <Box display="flex" flexWrap="wrap" gap={1}>
                                        {user.services.map((s) => (
                                            <Chip
                                                key={s}
                                                label={s}
                                                size="small"
                                                sx={{
                                                    bgcolor: 'grey.100',
                                                    color: 'grey.700',
                                                    borderColor: 'grey.200',
                                                    border: 1,
                                                    fontWeight: 500,
                                                }}
                                            />
                                        ))}
                                    </Box>
                                ) : (
                                    <SectionPlaceholder text="No services added yet." />
                                )}
                            </Paper>

                            <Paper
                                variant="outlined"
                                sx={{
                                    p: 2.5,
                                    borderRadius: 2,
                                }}
                            >
                                <Typography
                                    variant="subtitle2"
                                    fontWeight="bold"
                                    color="text.primary"
                                    mb={1.5}
                                >
                                    Expertise Areas
                                </Typography>

                                {user.expertise.length > 0 ? (
                                    <Box display="flex" flexWrap="wrap" gap={1}>
                                        {user.expertise.map((e) => (
                                            <Chip
                                                key={e}
                                                label={e}
                                                size="small"
                                                variant="outlined"
                                                sx={{ fontWeight: 500 }}
                                            />
                                        ))}
                                    </Box>
                                ) : (
                                    <SectionPlaceholder text="No expertise areas added yet." />
                                )}
                            </Paper>

                            <Paper
                                variant="outlined"
                                sx={{
                                    borderRadius: 2,
                                    overflow: 'hidden',
                                }}
                            >
                                <Box p={2} borderBottom={1} borderColor="grey.100">
                                    <Typography
                                        variant="subtitle2"
                                        fontWeight="bold"
                                        color="text.primary"
                                    >
                                        Projects{' '}
                                        <Typography
                                            component="span"
                                            color="text.disabled"
                                            fontWeight="normal"
                                        >
                                            ({user.projects.length})
                                        </Typography>
                                    </Typography>
                                </Box>

                                {user.projects.length > 0 ? (
                                    <Stack spacing={0}>
                                        {user.projects.map((project, i) => (
                                            <Box
                                                key={project.upid}
                                                onClick={() => navigate(`/projects/${project.upid}`)}
                                                sx={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 2,
                                                    px: 2,
                                                    py: 1.75,
                                                    borderBottom: i < user.projects.length - 1 ? 1 : 0,
                                                    borderColor: 'grey.100',
                                                    cursor: 'pointer',
                                                    '&:hover': {
                                                        bgcolor: 'grey.50',
                                                    },
                                                }}
                                            >
                                                <Box flex={1} minWidth={0}>
                                                    <Typography
                                                        variant="body2"
                                                        fontWeight="medium"
                                                        color="text.primary"
                                                        noWrap
                                                    >
                                                        {project.name}
                                                    </Typography>

                                                    <Box
                                                        display="flex"
                                                        alignItems="center"
                                                        gap={1}
                                                        mt={0.5}
                                                        flexWrap="wrap"
                                                    >
                                                        <Typography variant="caption" color="text.disabled">
                                                            {project.countryCode} {project.country}
                                                        </Typography>
                                                        <Typography variant="caption" color="text.disabled">
                                                            ·
                                                        </Typography>
                                                        <Typography
                                                            variant="caption"
                                                            color="text.secondary"
                                                            fontStyle="italic"
                                                        >
                                                            {project.role}
                                                        </Typography>
                                                    </Box>
                                                </Box>

                                                <Box
                                                    display="flex"
                                                    alignItems="center"
                                                    gap={1}
                                                    flexShrink={0}
                                                >
                                                    <ProjectStageIndicator stage={project.stage} />
                                                    <Chip
                                                        label={project.type}
                                                        size="small"
                                                        sx={{
                                                            height: 22,
                                                            fontSize: '0.7rem',
                                                            bgcolor: 'grey.100',
                                                        }}
                                                    />
                                                </Box>
                                            </Box>
                                        ))}
                                    </Stack>
                                ) : (
                                    <Box p={2}>
                                        <SectionPlaceholder text="No projects added yet." />
                                    </Box>
                                )}
                            </Paper>
                        </Stack>
                    </Box>

                    <Box
                        sx={{
                            flex: { xs: '1 1 100%', md: '0 0 33.333%' },
                            maxWidth: { xs: '100%', md: '33.333%' },
                        }}
                    >
                        <Stack spacing={2}>
                            <Paper
                                variant="outlined"
                                sx={{
                                    p: 2,
                                    borderRadius: 2,
                                }}
                            >
                                <Typography
                                    variant="caption"
                                    fontWeight="bold"
                                    color="text.primary"
                                    display="block"
                                    mb={1.5}
                                >
                                    Company Affiliation
                                </Typography>

                                {canShowCompany ? (
                                    <Box
                                        display="flex"
                                        alignItems="center"
                                        gap={1.5}
                                        onClick={() => navigate(`/companies/${user.companyId}`)}
                                        sx={{
                                            cursor: 'pointer',
                                            borderRadius: 1,
                                            p: 1,
                                            mx: -1,
                                            '&:hover': {
                                                bgcolor: 'grey.50',
                                            },
                                        }}
                                    >
                                        <Avatar
                                            sx={{
                                                width: 32,
                                                height: 32,
                                                bgcolor: 'grey.100',
                                                color: 'grey.600',
                                                fontSize: '0.75rem',
                                                fontWeight: 600,
                                            }}
                                        >
                                            {user.company.substring(0, 2).toUpperCase()}
                                        </Avatar>

                                        <Box minWidth={0}>
                                            <Typography
                                                variant="body2"
                                                fontWeight="medium"
                                                color="text.primary"
                                                noWrap
                                            >
                                                {user.company}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {user.title}
                                            </Typography>
                                        </Box>
                                    </Box>
                                ) : (
                                    <SectionPlaceholder text="No company affiliation added yet." />
                                )}
                            </Paper>

                            <Paper
                                variant="outlined"
                                sx={{
                                    p: 2,
                                    borderRadius: 2,
                                }}
                            >
                                <Typography
                                    variant="caption"
                                    fontWeight="bold"
                                    color="text.primary"
                                    display="block"
                                    mb={1.5}
                                >
                                    Sectors of Focus
                                </Typography>

                                {user.sectors.length > 0 ? (
                                    <Box display="flex" flexWrap="wrap" gap={0.75}>
                                        {user.sectors.map((s) => (
                                            <Chip
                                                key={s}
                                                label={s}
                                                size="small"
                                                sx={{
                                                    bgcolor: 'grey.100',
                                                    color: 'grey.700',
                                                }}
                                            />
                                        ))}
                                    </Box>
                                ) : (
                                    <SectionPlaceholder text="No sectors added yet." />
                                )}
                            </Paper>

                            <Paper
                                variant="outlined"
                                sx={{
                                    p: 2,
                                    borderRadius: 2,
                                }}
                            >
                                <Typography
                                    variant="caption"
                                    fontWeight="bold"
                                    color="text.primary"
                                    display="block"
                                    mb={1.5}
                                >
                                    Standards & Methodologies
                                </Typography>

                                {user.standards.length > 0 ? (
                                    <Box display="flex" flexWrap="wrap" gap={0.75}>
                                        {user.standards.map((s) => (
                                            <Chip
                                                key={s}
                                                label={s}
                                                size="small"
                                                variant="outlined"
                                                sx={{
                                                    height: 22,
                                                    fontSize: '0.7rem',
                                                }}
                                            />
                                        ))}
                                    </Box>
                                ) : (
                                    <SectionPlaceholder text="No standards or methodologies added yet." />
                                )}
                            </Paper>

                            <Paper
                                variant="outlined"
                                sx={{
                                    p: 2,
                                    borderRadius: 2,
                                }}
                            >
                                <Typography
                                    variant="caption"
                                    fontWeight="bold"
                                    color="text.primary"
                                    display="block"
                                    mb={1.5}
                                >
                                    Languages
                                </Typography>

                                {user.languages.length > 0 ? (
                                    <Stack spacing={0.75}>
                                        {user.languages.map((lang, i) => (
                                            <Box
                                                key={lang}
                                                display="flex"
                                                alignItems="center"
                                                gap={1}
                                            >
                                                <Box
                                                    sx={{
                                                        width: 6,
                                                        height: 6,
                                                        borderRadius: '50%',
                                                        bgcolor: i === 0 ? 'primary.main' : 'grey.300',
                                                        flexShrink: 0,
                                                    }}
                                                />

                                                <Typography variant="body2" color="text.primary">
                                                    {lang}
                                                </Typography>

                                                {i === 0 && (
                                                    <Typography
                                                        variant="caption"
                                                        color="text.disabled"
                                                        ml="auto"
                                                    >
                                                        Native
                                                    </Typography>
                                                )}
                                            </Box>
                                        ))}
                                    </Stack>
                                ) : (
                                    <SectionPlaceholder text="No languages added yet." />
                                )}
                            </Paper>
                        </Stack>
                    </Box>
                </Box>
            </Box>
        </Box>
    );
}