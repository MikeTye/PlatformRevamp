import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TrendingUpRounded from '@mui/icons-material/TrendingUpRounded';
import BusinessRounded from '@mui/icons-material/BusinessRounded';
import ParkRounded from '@mui/icons-material/ParkRounded';
import FolderRounded from '@mui/icons-material/FolderRounded';
import GroupRounded from '@mui/icons-material/GroupRounded';
import ArrowForwardRounded from '@mui/icons-material/ArrowForwardRounded';
import MoreHorizRounded from '@mui/icons-material/MoreHorizRounded';
import TimelineRounded from '@mui/icons-material/TimelineRounded';
import CalendarTodayRounded from '@mui/icons-material/CalendarTodayRounded';
import AttachMoneyRounded from '@mui/icons-material/AttachMoneyRounded';
import BuildRounded from '@mui/icons-material/BuildRounded';
import PeopleRounded from '@mui/icons-material/PeopleRounded';
import CloseRounded from '@mui/icons-material/CloseRounded';
import DescriptionRounded from '@mui/icons-material/DescriptionRounded';
import ShowChartRounded from '@mui/icons-material/ShowChartRounded';
import AddRounded from '@mui/icons-material/AddRounded';
import {
    Alert,
    Avatar,
    Box,
    Button,
    Chip,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    IconButton,
    Paper,
    Stack,
    Typography,
} from '@mui/material';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import * as L from 'leaflet';
import {
    ProjectStageIndicator,
    type ProjectStage,
} from '../components/ProjectStageIndicator';

import countryCodes from '../data/countrycode.json';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

const icon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    iconRetinaUrl:
        'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
});

type UpdateType = 'Milestone' | 'Registry' | 'Document' | 'Social';

interface ProjectUpdate {
    id: string;
    project: string;
    projectId: string;
    title: string;
    description: string | null;
    date: string;
    author: string;
    type: UpdateType;
}

interface DashboardProject {
    id: string;
    name: string;
    stage: ProjectStage;
    country: string;
    countryCode: string;
    dateAdded: string;
    lat: number | null;
    lng: number | null;
}

interface DashboardCompany {
    id: string;
    name: string;
    type: string;
    country: string;
    countryCode: string;
}

interface OpportunityItem {
    id: string;
    type: string;
    project: string;
    desc: string;
    urgent?: boolean;
}

interface MapPin {
    id: string;
    name: string;
    lat: number;
    lng: number;
    stage: ProjectStage;
    type: string;
    country: string;
    countryCode: string;
}

interface DashboardState {
    loading: boolean;
    error: string | null;
    metrics: {
        totalProjects: number;
        totalCompanies: number;
        totalCredits: number | null;
        totalOpportunities: number | null;
        newProjectsDelta: string | null;
        newCompaniesDelta: string | null;
        urgentOpportunitiesLabel: string | null;
        creditsChangeLabel: string | null;
    };
    recentProjects: DashboardProject[];
    newCompanies: DashboardCompany[];
    activeOpportunities: OpportunityItem[];
    recentUpdates: ProjectUpdate[];
    mapPins: MapPin[];
    savedProjectsCount: number | null;
    savedCompaniesCount: number | null;
}

interface DashboardProjectUpdatesResponse {
    items?: Array<{
        id: string;
        projectId: string;
        projectName: string;
        title: string;
        description?: string | null;
        dateLabel?: string | null;
        authorName?: string | null;
        type?: 'progress' | 'stage' | null;
        createdAt?: string;
    }>;
}

interface DashboardProjectOpportunitiesResponse {
    items?: Array<{
        id: string;
        projectId: string;
        projectName: string;
        type: string;
        description?: string | null;
        urgent?: boolean;
        createdAt?: string;
    }>;
}

function formatRelativeDate(value?: string | null): string {
    if (!value) return '—';

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';

    return date.toLocaleDateString(undefined, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
}

function normalizeStage(value: unknown): ProjectStage {
    const stage = String(value ?? '').trim();
    const allowed: ProjectStage[] = [
        'Exploration',
        'Concept',
        'Design',
        'Listed',
        'Validation',
        'Registered',
        'Issued',
        'Closed',
    ];

    return allowed.includes(stage as ProjectStage)
        ? (stage as ProjectStage)
        : 'Exploration';
}

type CountryCodeEntry = {
    country: string;
    code: string;
    iso: string;
};

const countryCodeList = countryCodes as CountryCodeEntry[];

const countryIsoLookup = new Map(
    countryCodeList.map((item) => [item.country.trim().toLowerCase(), item.iso.trim().toUpperCase()])
);

function buildCountryCode(country?: string | null): string {
    const value = String(country ?? '').trim().toLowerCase();
    return countryIsoLookup.get(value) ?? '';
}

function isoToFlagEmoji(iso?: string | null): string {
    const code = String(iso ?? '').trim().toUpperCase();

    if (!/^[A-Z]{2}$/.test(code)) {
        return '🌍';
    }

    return String.fromCodePoint(
        ...[...code].map((char) => 127397 + char.charCodeAt(0))
    );
}

async function fetchJson<T>(url: string): Promise<T> {
    const response = await fetch(url, {
        credentials: 'include',
    });

    if (!response.ok) {
        throw new Error(`Request failed: ${response.status}`);
    }

    return response.json() as Promise<T>;
}

function createStubDashboardState(): Omit<DashboardState, 'loading' | 'error'> {
    return {
        metrics: {
            totalProjects: 0,
            totalCompanies: 0,
            totalCredits: null,
            totalOpportunities: null,
            newProjectsDelta: null,
            newCompaniesDelta: null,
            urgentOpportunitiesLabel: null,
            creditsChangeLabel: null,
        },
        recentProjects: [],
        newCompanies: [],
        activeOpportunities: [],
        recentUpdates: [],
        mapPins: [],
        savedProjectsCount: null,
        savedCompaniesCount: null,
    };
}

async function fetchJsonOrNull<T>(url: string): Promise<T | null> {
    const response = await fetch(url, {
        credentials: 'include',
    });

    if (response.status === 401 || response.status === 403) {
        return null;
    }

    if (!response.ok) {
        throw new Error(`Request failed: ${response.status}`);
    }

    return response.json() as Promise<T>;
}

function extractListPayload(payload: any) {
    const items = Array.isArray(payload?.items)
        ? payload.items
        : Array.isArray(payload?.data?.items)
            ? payload.data.items
            : Array.isArray(payload?.data)
                ? payload.data
                : [];

    const total =
        typeof payload?.total === 'number'
            ? payload.total
            : typeof payload?.data?.total === 'number'
                ? payload.data.total
                : items.length;

    const counts =
        payload?.counts ??
        payload?.data?.counts ??
        null;

    return { items, total, counts };
}

function deriveCompanyType(company: any): string {
    const roles = Array.isArray(company?.companyRoles) ? company.companyRoles : [];
    if (roles.length > 0) return String(roles[0]);
    return 'Company';
}

function mapUpdateType(value?: string | null): UpdateType {
    switch (value) {
        case 'stage':
            return 'Registry';
        case 'progress':
        default:
            return 'Milestone';
    }
}

function normalizeIso(value?: string | null): string {
    const raw = String(value ?? '').trim();

    if (!raw) return '';

    if (/^[A-Za-z]{2}$/.test(raw)) {
        return raw.toUpperCase();
    }

    return buildCountryCode(raw);
}

async function loadDashboardData(): Promise<Omit<DashboardState, 'loading' | 'error'>> {
    const base = createStubDashboardState();

    const [
        projectsResult,
        companiesOverviewResult,
        latestCompaniesResult,
        updatesResult,
        opportunitiesResult,
    ] = await Promise.allSettled([
        fetchJsonOrNull<any>(`${API_BASE_URL}/projects?page=1&pageSize=5&sortBy=updated&sortDir=desc`),
        fetchJsonOrNull<any>(`${API_BASE_URL}/companies?page=1&pageSize=1`),
        fetchJsonOrNull<any>(`${API_BASE_URL}/companies?page=1&pageSize=5&sortField=createdAt&sortDirection=desc`),
        fetchJsonOrNull<DashboardProjectUpdatesResponse>(`${API_BASE_URL}/projects/updates?limit=5`),
        fetchJsonOrNull<DashboardProjectOpportunitiesResponse>(`${API_BASE_URL}/projects/opportunities?limit=5`),
    ]);

    const next = { ...base };

    if (projectsResult.status === 'fulfilled' && projectsResult.value) {
        const payload = projectsResult.value;
        const { items, total, counts } = extractListPayload(payload);

        next.metrics.totalProjects = total;
        next.savedProjectsCount =
            typeof counts?.saved === 'number' ? counts.saved : 0;

        next.recentProjects = items.slice(0, 5).map((project: any) => ({
            id: String(project.id),
            name: String(
                project.name ??
                project.displayName ??
                project.legalName ??
                'Untitled project'
            ),
            stage: normalizeStage(project.stage),
            country: String(project.country ?? project.hostCountry ?? ''),
            countryCode: normalizeIso(
                project.countryCode ?? project.country ?? project.hostCountry
            ),
            dateAdded: formatRelativeDate(project.updatedAt ?? project.createdAt),
            lat:
                typeof project.lat === 'number'
                    ? project.lat
                    : project.lat != null
                        ? Number(project.lat)
                        : null,
            lng:
                typeof project.lng === 'number'
                    ? project.lng
                    : project.lng != null
                        ? Number(project.lng)
                        : null,
        }));
    } else {
        next.savedProjectsCount = 0;
    }

    if (companiesOverviewResult.status === 'fulfilled' && companiesOverviewResult.value) {
        const { total, counts } = extractListPayload(companiesOverviewResult.value);

        next.metrics.totalCompanies = total;
        next.savedCompaniesCount =
            typeof counts?.saved === 'number' ? counts.saved : 0;
    } else {
        next.savedCompaniesCount = 0;
    }

    if (latestCompaniesResult.status === 'fulfilled' && latestCompaniesResult.value) {
        const { items } = extractListPayload(latestCompaniesResult.value);

        next.newCompanies = items.slice(0, 5).map((company: any) => ({
            id: String(company.id),
            name: String(company.displayName ?? 'Untitled company'),
            type: deriveCompanyType(company),
            country: String(company.country ?? 'Malaysia'),
            countryCode: normalizeIso(
                company.countryCode ?? company.country
            ),
        }));
    }

    if (updatesResult.status === 'fulfilled' && updatesResult.value) {
        const items = Array.isArray(updatesResult.value.items)
            ? updatesResult.value.items
            : [];

        next.recentUpdates = items.map((update) => ({
            id: String(update.id),
            project: String(update.projectName ?? 'Untitled project'),
            projectId: String(update.projectId),
            title: String(update.title ?? 'Untitled update'),
            description: update.description ?? null,
            date: formatRelativeDate(update.dateLabel ?? update.createdAt),
            author: String(update.authorName ?? 'Unknown'),
            type: mapUpdateType(update.type),
        }));
    }

    if (opportunitiesResult.status === 'fulfilled' && opportunitiesResult.value) {
        const items = Array.isArray(opportunitiesResult.value.items)
            ? opportunitiesResult.value.items
            : [];

        next.activeOpportunities = items.map((opportunity) => ({
            id: String(opportunity.id),
            type: String(opportunity.type ?? 'Opportunity'),
            project: String(opportunity.projectName ?? 'Untitled project'),
            desc: String(opportunity.description ?? 'No description provided'),
            urgent: Boolean(opportunity.urgent),
        }));

        next.metrics.totalOpportunities = items.length;

        const urgentCount = items.filter((item) => item.urgent).length;
        next.metrics.urgentOpportunitiesLabel =
            urgentCount > 0 ? `${urgentCount} urgent` : null;
    } else {
        next.activeOpportunities = [];
        next.metrics.totalOpportunities = 0;
        next.metrics.urgentOpportunitiesLabel = null;
    }

    next.mapPins = next.recentProjects
        .filter(
            (project) =>
                typeof project.lat === 'number' &&
                Number.isFinite(project.lat) &&
                typeof project.lng === 'number' &&
                Number.isFinite(project.lng)
        )
        .slice(0, 20)
        .map((project) => ({
            id: project.id,
            name: project.name,
            lat: project.lat as number,
            lng: project.lng as number,
            stage: project.stage,
            type: 'Project',
            country: project.country,
            countryCode: project.countryCode,
        }));

    return next;
}

export function DashboardPage() {
    const navigate = useNavigate();
    const [state, setState] = useState<DashboardState>({
        loading: true,
        error: null,
        ...createStubDashboardState(),
    });
    const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
    const [selectedUpdate, setSelectedUpdate] = useState<ProjectUpdate | null>(null);

    useEffect(() => {
        let active = true;

        const run = async () => {
            try {
                const data = await loadDashboardData();
                if (!active) return;

                setState({
                    loading: false,
                    error: null,
                    ...data,
                });
            } catch (error) {
                if (!active) return;

                setState((prev) => ({
                    ...prev,
                    loading: false,
                    error:
                        error instanceof Error
                            ? error.message
                            : 'Failed to load dashboard',
                }));
            }
        };

        void run();

        return () => {
            active = false;
        };
    }, []);

    const {
        metrics,
        recentProjects,
        newCompanies,
        activeOpportunities,
        recentUpdates,
        mapPins,
        savedProjectsCount,
        savedCompaniesCount,
        loading,
        error,
    } = state;

    const handleUpdateClick = (update: ProjectUpdate) => {
        setSelectedUpdate(update);
        setUpdateDialogOpen(true);
    };

    const handleUpdateDialogClose = () => {
        setUpdateDialogOpen(false);
        setSelectedUpdate(null);
    };

    const mapCenter: [number, number] =
        mapPins.length > 0
            ? [mapPins[0].lat, mapPins[0].lng]
            : [2.5, 110];

    const getUpdateIcon = (type: string) => {
        const iconSx = { fontSize: 14, color: 'grey.500' };

        switch (type) {
            case 'Milestone':
                return <TrendingUpRounded sx={iconSx} />;
            case 'Registry':
                return <BusinessRounded sx={iconSx} />;
            case 'Document':
                return <DescriptionRounded sx={iconSx} />;
            case 'Social':
                return <GroupRounded sx={iconSx} />;
            default:
                return <TimelineRounded sx={iconSx} />;
        }
    };

    const opportunityIcons = useMemo<Record<string, React.ReactNode>>(
        () => ({
            Financing: (
                <AttachMoneyRounded sx={{ fontSize: 18, color: 'warning.main' }} />
            ),
            'Technical advisor': (
                <BuildRounded sx={{ fontSize: 18, color: 'warning.main' }} />
            ),
            Buyers: <PeopleRounded sx={{ fontSize: 18, color: 'warning.main' }} />,
        }),
        []
    );

    return (
        <Box minHeight="100vh" bgcolor="white" color="text.secondary">
            <Box bgcolor="white" borderBottom={1} borderColor="grey.200" px={3} py={2}>
                <Typography variant="h6" fontWeight="bold" color="text.primary">
                    Dashboard
                </Typography>
                <Typography variant="caption" color="text.secondary">
                    Overview of your portfolio and market activity
                </Typography>
            </Box>

            <Box
                p={{ xs: 2, sm: 3 }}
                sx={{
                    width: '100%',
                    overflow: 'hidden',
                }}
            >
                {loading && (
                    <Box display="flex" alignItems="center" gap={1.5} mb={2}>
                        <CircularProgress size={18} />
                        <Typography variant="body2" color="text.secondary">
                            Loading dashboard...
                        </Typography>
                    </Box>
                )}

                {error && (
                    <Alert severity="warning" sx={{ mb: 2 }}>
                        Dashboard loaded with partial data. {error}
                    </Alert>
                )}

                <Box
                    sx={{
                        display: 'grid',
                        gridTemplateColumns: {
                            xs: 'repeat(2, 1fr)',
                            lg: 'repeat(4, 1fr)',
                        },
                        gap: { xs: 1.5, sm: 2 },
                        mb: 3,
                    }}
                >
                    <Paper
                        variant="outlined"
                        onClick={() => navigate('/projects')}
                        sx={{
                            p: { xs: 1.5, sm: 2 },
                            borderRadius: 2,
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            cursor: 'pointer',
                            '&:hover': { borderColor: 'grey.400' },
                            minHeight: { xs: 100, sm: 120 },
                        }}
                    >
                        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={0.5}>
                            <Box sx={{ p: { xs: 0.5, sm: 1 }, borderRadius: 1, color: 'grey.700' }}>
                                <FolderRounded sx={{ fontSize: 20 }} />
                            </Box>
                            {metrics.newProjectsDelta ? (
                                <Chip
                                    label={metrics.newProjectsDelta}
                                    size="small"
                                    color="success"
                                    variant="outlined"
                                    sx={{
                                        height: 18,
                                        fontSize: '0.625rem',
                                        '& .MuiChip-label': { px: 0.75 },
                                    }}
                                />
                            ) : null}
                        </Box>
                        <Box>
                            <Typography
                                variant="h4"
                                fontWeight="bold"
                                color="text.primary"
                                sx={{
                                    fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' },
                                    lineHeight: 1.2,
                                }}
                            >
                                {metrics.totalProjects}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Total projects
                            </Typography>
                        </Box>
                    </Paper>

                    <Paper
                        variant="outlined"
                        onClick={() => navigate('/companies')}
                        sx={{
                            p: { xs: 1.5, sm: 2 },
                            borderRadius: 2,
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            cursor: 'pointer',
                            '&:hover': { borderColor: 'grey.400' },
                            minHeight: { xs: 100, sm: 120 },
                        }}
                    >
                        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={0.5}>
                            <Box sx={{ p: { xs: 0.5, sm: 1 }, borderRadius: 1, color: 'grey.700' }}>
                                <BusinessRounded sx={{ fontSize: 20 }} />
                            </Box>
                            {metrics.newCompaniesDelta ? (
                                <Chip
                                    label={metrics.newCompaniesDelta}
                                    size="small"
                                    sx={{
                                        height: 18,
                                        fontSize: '0.625rem',
                                        '& .MuiChip-label': { px: 0.75 },
                                    }}
                                />
                            ) : null}
                        </Box>
                        <Box>
                            <Typography
                                variant="h4"
                                fontWeight="bold"
                                color="text.primary"
                                sx={{
                                    fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' },
                                    lineHeight: 1.2,
                                }}
                            >
                                {metrics.totalCompanies}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Total companies
                            </Typography>
                        </Box>
                    </Paper>

                    <Paper
                        variant="outlined"
                        sx={{
                            p: { xs: 1.5, sm: 2 },
                            borderRadius: 2,
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            minHeight: { xs: 100, sm: 120 },
                        }}
                    >
                        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={0.5}>
                            <Box sx={{ p: { xs: 0.5, sm: 1 }, borderRadius: 1, color: 'grey.700' }}>
                                <ParkRounded sx={{ fontSize: 20 }} />
                            </Box>
                            {metrics.creditsChangeLabel ? (
                                <Typography
                                    variant="caption"
                                    color="success.main"
                                    fontWeight="medium"
                                    display="flex"
                                    alignItems="center"
                                    gap={0.5}
                                    sx={{ fontSize: '0.625rem' }}
                                >
                                    <TrendingUpRounded sx={{ fontSize: 10 }} />
                                    {metrics.creditsChangeLabel}
                                </Typography>
                            ) : (
                                <Chip
                                    label="Stub"
                                    size="small"
                                    sx={{ height: 18, fontSize: '0.625rem' }}
                                />
                            )}
                        </Box>
                        <Box>
                            <Typography
                                variant="h4"
                                fontWeight="bold"
                                color="text.primary"
                                sx={{
                                    fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' },
                                    lineHeight: 1.2,
                                }}
                            >
                                {metrics.totalCredits ?? '—'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Credits (tCO2e)
                            </Typography>
                        </Box>
                    </Paper>

                    <Paper
                        variant="outlined"
                        onClick={() => navigate('/opportunities')}
                        sx={{
                            p: { xs: 1.5, sm: 2 },
                            borderRadius: 2,
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            cursor: 'pointer',
                            '&:hover': { borderColor: 'grey.400' },
                            minHeight: { xs: 100, sm: 120 },
                        }}
                    >
                        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={0.5}>
                            <Box sx={{ p: { xs: 0.5, sm: 1 }, borderRadius: 1, color: 'grey.700' }}>
                                <ShowChartRounded sx={{ fontSize: 20 }} />
                            </Box>
                            {metrics.urgentOpportunitiesLabel ? (
                                <Chip
                                    label={metrics.urgentOpportunitiesLabel}
                                    size="small"
                                    color="warning"
                                    variant="outlined"
                                    sx={{
                                        height: 18,
                                        fontSize: '0.625rem',
                                        '& .MuiChip-label': { px: 0.75 },
                                    }}
                                />
                            ) : (
                                <Chip
                                    label="Stub"
                                    size="small"
                                    sx={{ height: 18, fontSize: '0.625rem' }}
                                />
                            )}
                        </Box>
                        <Box>
                            <Typography
                                variant="h4"
                                fontWeight="bold"
                                color="text.primary"
                                sx={{
                                    fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' },
                                    lineHeight: 1.2,
                                }}
                            >
                                {metrics.totalOpportunities ?? '—'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Opportunities
                            </Typography>
                        </Box>
                    </Paper>
                </Box>

                <Box
                    sx={{
                        display: 'grid',
                        gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' },
                        gap: 3,
                        mb: 3,
                        minWidth: 0,
                        overflow: 'hidden',
                    }}
                >
                    <Stack spacing={3} sx={{ minWidth: 0, width: '100%' }}>
                        <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
                            <Box
                                p={2}
                                borderBottom={1}
                                borderColor="grey.100"
                                display="flex"
                                justifyContent="space-between"
                                alignItems="center"
                            >
                                <Typography variant="subtitle2" fontWeight="bold" color="text.primary">
                                    Active opportunities
                                </Typography>
                                <Button
                                    size="small"
                                    endIcon={<ArrowForwardRounded sx={{ fontSize: 14 }} />}
                                    onClick={() => navigate('/opportunities')}
                                    sx={{ textTransform: 'none', color: 'text.secondary', fontSize: '0.75rem' }}
                                >
                                    View all
                                </Button>
                            </Box>
                            <Box>
                                {activeOpportunities.length === 0 ? (
                                    <Box p={2}>
                                        <Typography variant="body2" color="text.secondary">
                                            No opportunities yet.
                                        </Typography>
                                    </Box>
                                ) : (
                                    activeOpportunities.map((opp, i) => (
                                        <Box
                                            key={opp.id}
                                            onClick={() =>
                                                navigate(`/projects?opportunity=${encodeURIComponent(opp.type)}`)
                                            }
                                            sx={{
                                                p: 2,
                                                borderBottom: i < activeOpportunities.length - 1 ? 1 : 0,
                                                borderColor: 'grey.100',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 2,
                                                cursor: 'pointer',
                                                '&:hover': { bgcolor: 'grey.50' },
                                            }}
                                        >
                                            <Box
                                                sx={{
                                                    width: 36,
                                                    height: 36,
                                                    bgcolor: opp.urgent ? 'warning.50' : 'grey.100',
                                                    borderRadius: 1,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    flexShrink: 0,
                                                }}
                                            >
                                                {opportunityIcons[opp.type] ?? (
                                                    <ShowChartRounded sx={{ fontSize: 18, color: 'grey.500' }} />
                                                )}
                                            </Box>
                                            <Box flex={1} minWidth={0} overflow="hidden">
                                                <Box display="flex" alignItems="center" gap={1}>
                                                    <Typography variant="body2" fontWeight="medium" color="text.primary" noWrap>
                                                        {opp.type}
                                                    </Typography>
                                                    {opp.urgent ? (
                                                        <Chip
                                                            label="Urgent"
                                                            size="small"
                                                            sx={{
                                                                height: 16,
                                                                fontSize: '0.625rem',
                                                                bgcolor: 'warning.100',
                                                                color: 'warning.800',
                                                                flexShrink: 0,
                                                            }}
                                                        />
                                                    ) : null}
                                                </Box>
                                                <Typography variant="caption" color="text.secondary" noWrap>
                                                    {opp.project} · {opp.desc}
                                                </Typography>
                                            </Box>
                                            <ArrowForwardRounded sx={{ fontSize: 14, color: 'grey.400' }} />
                                        </Box>
                                    ))
                                )}
                            </Box>
                        </Paper>

                        <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
                            <Box
                                p={2}
                                borderBottom={1}
                                borderColor="grey.100"
                                display="flex"
                                justifyContent="space-between"
                                alignItems="center"
                            >
                                <Typography variant="subtitle2" fontWeight="bold" color="text.primary">
                                    Recently added projects
                                </Typography>
                                <Button
                                    size="small"
                                    endIcon={<ArrowForwardRounded sx={{ fontSize: 14 }} />}
                                    onClick={() => navigate('/projects')}
                                    sx={{ textTransform: 'none', color: 'text.secondary', fontSize: '0.75rem' }}
                                >
                                    View all
                                </Button>
                            </Box>
                            <Box>
                                {recentProjects.length === 0 ? (
                                    <Box p={2}>
                                        <Typography variant="body2" color="text.secondary">
                                            No projects available yet.
                                        </Typography>
                                    </Box>
                                ) : (
                                    recentProjects.map((project, i) => (
                                        <Box
                                            key={project.id}
                                            onClick={() => navigate(`/projects/${project.id}`)}
                                            sx={{
                                                p: 2,
                                                borderBottom: i < recentProjects.length - 1 ? 1 : 0,
                                                borderColor: 'grey.100',
                                                cursor: 'pointer',
                                                '&:hover': { bgcolor: 'grey.50' },
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                gap: 2,
                                            }}
                                        >
                                            <Box display="flex" alignItems="center" gap={2} flex={1} minWidth={0}>
                                                <Box
                                                    sx={{
                                                        width: 40,
                                                        height: 40,
                                                        bgcolor: 'grey.100',
                                                        borderRadius: 1,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        flexShrink: 0,
                                                    }}
                                                >
                                                    <ParkRounded sx={{ fontSize: 20, color: 'grey.500' }} />
                                                </Box>
                                                <Box minWidth={0}>
                                                    <Typography variant="body2" fontWeight="medium" color="text.primary" noWrap>
                                                        {project.name}
                                                    </Typography>
                                                    <Box display="flex" alignItems="center" gap={1} mt={0.5}>
                                                        <ProjectStageIndicator stage={project.stage} />
                                                        <Typography variant="caption" color="text.secondary">
                                                            {isoToFlagEmoji(project.countryCode)} {project.country}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            </Box>
                                            <Typography variant="caption" color="text.disabled" sx={{ flexShrink: 0 }}>
                                                {project.dateAdded}
                                            </Typography>
                                        </Box>
                                    ))
                                )}
                            </Box>
                        </Paper>

                        <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
                            <Box
                                p={2}
                                borderBottom={1}
                                borderColor="grey.100"
                                display="flex"
                                justifyContent="space-between"
                                alignItems="center"
                            >
                                <Typography variant="subtitle2" fontWeight="bold" color="text.primary">
                                    Project updates
                                </Typography>
                                <IconButton size="small">
                                    <MoreHorizRounded sx={{ fontSize: 16 }} />
                                </IconButton>
                            </Box>
                            <Box>
                                {recentUpdates.length === 0 ? (
                                    <Box p={2}>
                                        <Typography variant="body2" color="text.secondary">
                                            No project updates yet.
                                        </Typography>
                                    </Box>
                                ) : (
                                    recentUpdates.map((update, i) => (
                                        <Box
                                            key={update.id}
                                            onClick={() => handleUpdateClick(update)}
                                            sx={{
                                                p: 2,
                                                borderBottom: i < recentUpdates.length - 1 ? 1 : 0,
                                                borderColor: 'grey.100',
                                                display: 'flex',
                                                gap: 2,
                                                cursor: 'pointer',
                                                '&:hover': { bgcolor: 'grey.50' },
                                            }}
                                        >
                                            <Box
                                                sx={{
                                                    width: 32,
                                                    height: 32,
                                                    borderRadius: '50%',
                                                    bgcolor: 'grey.100',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    flexShrink: 0,
                                                    mt: 0.5,
                                                }}
                                            >
                                                {getUpdateIcon(update.type)}
                                            </Box>
                                            <Box flex={1} minWidth={0}>
                                                <Box display="flex" justifyContent="space-between" alignItems="flex-start" gap={1}>
                                                    <Typography variant="caption" color="text.secondary" noWrap>
                                                        {update.project}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.disabled" sx={{ flexShrink: 0 }}>
                                                        {update.date}
                                                    </Typography>
                                                </Box>
                                                <Typography variant="body2" fontWeight="medium" color="text.primary" mt={0.5} noWrap>
                                                    {update.title}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary" mt={0.5} display="block">
                                                    by {update.author}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    ))
                                )}
                            </Box>
                        </Paper>
                    </Stack>

                    <Stack spacing={3} sx={{ minWidth: 0, width: '100%' }}>
                        <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
                            <Box
                                p={2}
                                borderBottom={1}
                                borderColor="grey.100"
                                display="flex"
                                justifyContent="space-between"
                                alignItems="center"
                            >
                                <Typography variant="subtitle2" fontWeight="bold" color="text.primary">
                                    Project locations
                                </Typography>
                                <Button
                                    size="small"
                                    endIcon={<ArrowForwardRounded sx={{ fontSize: 14 }} />}
                                    onClick={() => navigate('/projects')}
                                    sx={{ textTransform: 'none', color: 'text.secondary', fontSize: '0.75rem' }}
                                >
                                    View all projects
                                </Button>
                            </Box>

                            <Box
                                sx={{
                                    width: '100%',
                                    height: 280,
                                    bgcolor: 'grey.50',
                                    position: 'relative',
                                }}
                            >
                                <MapContainer
                                    center={mapCenter}
                                    zoom={mapPins.length > 0 ? 5 : 4}
                                    style={{ height: '100%', width: '100%' }}
                                    scrollWheelZoom={false}
                                >
                                    <TileLayer
                                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                    />

                                    {mapPins.map((pin) => (
                                        <Marker key={pin.id} position={[pin.lat, pin.lng]} icon={icon}>
                                            <Popup>
                                                <Box sx={{ minWidth: 200 }}>
                                                    <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                                                        {pin.name}
                                                    </Typography>
                                                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                                                        <ProjectStageIndicator stage={pin.stage} size="small" />
                                                        <Chip
                                                            label={pin.type}
                                                            size="small"
                                                            sx={{ height: 20, fontSize: '0.625rem' }}
                                                        />
                                                    </Box>
                                                    <Typography variant="caption" color="text.secondary" display="block" mb={1}>
                                                        {isoToFlagEmoji(pin.countryCode)} {pin.country}
                                                    </Typography>
                                                    <Button
                                                        size="small"
                                                        variant="outlined"
                                                        fullWidth
                                                        onClick={() => navigate(`/projects/${pin.id}`)}
                                                        sx={{ fontSize: '0.75rem', py: 0.5 }}
                                                    >
                                                        View details
                                                    </Button>
                                                </Box>
                                            </Popup>
                                        </Marker>
                                    ))}
                                </MapContainer>
                            </Box>

                            <Box p={2} borderTop={1} borderColor="grey.100">
                                <Typography variant="caption" color="text.secondary">
                                    Showing {mapPins.length} projects on the map
                                </Typography>
                            </Box>
                        </Paper>

                        <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
                            <Box
                                p={2}
                                borderBottom={1}
                                borderColor="grey.100"
                                display="flex"
                                justifyContent="space-between"
                                alignItems="center"
                            >
                                <Typography variant="subtitle2" fontWeight="bold" color="text.primary">
                                    New companies
                                </Typography>
                                <Button
                                    size="small"
                                    endIcon={<ArrowForwardRounded sx={{ fontSize: 14 }} />}
                                    onClick={() => navigate('/companies')}
                                    sx={{ textTransform: 'none', color: 'text.secondary', fontSize: '0.75rem' }}
                                >
                                    View all
                                </Button>
                            </Box>
                            <Box>
                                {newCompanies.length === 0 ? (
                                    <Box p={2}>
                                        <Typography variant="body2" color="text.secondary">
                                            No companies available yet.
                                        </Typography>
                                    </Box>
                                ) : (
                                    newCompanies.map((company, i) => (
                                        <Box
                                            key={company.id}
                                            onClick={() => navigate(`/companies/${company.id}`)}
                                            sx={{
                                                p: 2,
                                                borderBottom: i < newCompanies.length - 1 ? 1 : 0,
                                                borderColor: 'grey.100',
                                                cursor: 'pointer',
                                                '&:hover': { bgcolor: 'grey.50' },
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 2,
                                            }}
                                        >
                                            <Avatar
                                                sx={{
                                                    width: 32,
                                                    height: 32,
                                                    bgcolor: 'grey.100',
                                                    color: 'grey.600',
                                                    fontSize: '0.75rem',
                                                    fontWeight: 500,
                                                }}
                                            >
                                                {company.name.substring(0, 2).toUpperCase()}
                                            </Avatar>
                                            <Box flex={1} minWidth={0}>
                                                <Typography variant="body2" fontWeight="medium" color="text.primary" noWrap>
                                                    {company.name}
                                                </Typography>
                                                <Box display="flex" alignItems="center" gap={1} mt={0.5}>
                                                    <Chip
                                                        label={company.type}
                                                        size="small"
                                                        sx={{ height: 16, fontSize: '0.625rem', bgcolor: 'grey.100' }}
                                                    />
                                                    <Typography variant="caption" color="text.secondary">
                                                        {isoToFlagEmoji(company.countryCode)} {company.country}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        </Box>
                                    ))
                                )}
                            </Box>
                        </Paper>

                        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                            <Typography variant="subtitle2" fontWeight="bold" color="text.primary" mb={2}>
                                Saved items
                            </Typography>
                            <Stack spacing={2}>
                                <Box
                                    display="flex"
                                    alignItems="center"
                                    justifyContent="space-between"
                                    sx={{
                                        p: 1.5,
                                        bgcolor: 'grey.50',
                                        borderRadius: 1,
                                        cursor: 'pointer',
                                        '&:hover': { bgcolor: 'grey.100' },
                                    }}
                                    onClick={() => navigate('/projects?scope=saved')}
                                >
                                    <Box display="flex" alignItems="center" gap={1.5}>
                                        <FolderRounded sx={{ fontSize: 16, color: 'grey.500' }} />
                                        <Typography variant="body2" fontWeight="medium">
                                            Saved projects
                                        </Typography>
                                    </Box>
                                    <Chip
                                        label={savedProjectsCount ?? '—'}
                                        size="small"
                                        sx={{
                                            height: 20,
                                            bgcolor: 'white',
                                            border: 1,
                                            borderColor: 'grey.200',
                                        }}
                                    />
                                </Box>

                                <Box
                                    display="flex"
                                    alignItems="center"
                                    justifyContent="space-between"
                                    sx={{
                                        p: 1.5,
                                        bgcolor: 'grey.50',
                                        borderRadius: 1,
                                        cursor: 'pointer',
                                        '&:hover': { bgcolor: 'grey.100' },
                                    }}
                                    onClick={() => navigate('/companies?scope=saved')}
                                >
                                    <Box display="flex" alignItems="center" gap={1.5}>
                                        <BusinessRounded sx={{ fontSize: 16, color: 'grey.500' }} />
                                        <Typography variant="body2" fontWeight="medium">
                                            Saved companies
                                        </Typography>
                                    </Box>
                                    <Chip
                                        label={savedCompaniesCount ?? '—'}
                                        size="small"
                                        sx={{
                                            height: 20,
                                            bgcolor: 'white',
                                            border: 1,
                                            borderColor: 'grey.200',
                                        }}
                                    />
                                </Box>
                            </Stack>
                        </Paper>
                    </Stack>
                </Box>
            </Box>

            <Dialog
                open={updateDialogOpen}
                onClose={handleUpdateDialogClose}
                maxWidth="sm"
                fullWidth
                PaperProps={{ sx: { borderRadius: 2 } }}
            >
                {selectedUpdate ? (
                    <>
                        <DialogTitle
                            sx={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'flex-start',
                                pb: 1,
                            }}
                        >
                            <Box>
                                <Typography variant="h6" fontWeight="bold" color="text.primary">
                                    {selectedUpdate.title}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    {selectedUpdate.project}
                                </Typography>
                            </Box>
                            <IconButton
                                size="small"
                                onClick={handleUpdateDialogClose}
                                sx={{ mt: -0.5, mr: -1 }}
                            >
                                <CloseRounded sx={{ fontSize: 18 }} />
                            </IconButton>
                        </DialogTitle>

                        <Divider />

                        <DialogContent sx={{ pt: 2 }}>
                            <Box display="flex" alignItems="center" gap={2} mb={2}>
                                <Box
                                    sx={{
                                        width: 40,
                                        height: 40,
                                        borderRadius: '50%',
                                        bgcolor: 'grey.100',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                >
                                    {getUpdateIcon(selectedUpdate.type)}
                                </Box>
                                <Box>
                                    <Typography variant="body2" fontWeight="medium" color="text.primary">
                                        {selectedUpdate.author}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        {selectedUpdate.date}
                                    </Typography>
                                </Box>
                                <Chip
                                    label={selectedUpdate.type}
                                    size="small"
                                    sx={{ ml: 'auto', height: 24, bgcolor: 'grey.100' }}
                                />
                            </Box>

                            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                                {selectedUpdate.description}
                            </Typography>
                        </DialogContent>

                        <Divider />

                        <DialogActions sx={{ p: 2 }}>
                            <Button
                                variant="outlined"
                                size="small"
                                onClick={handleUpdateDialogClose}
                                sx={{
                                    textTransform: 'none',
                                    borderColor: 'grey.300',
                                    color: 'text.secondary',
                                }}
                            >
                                Close
                            </Button>
                            <Button
                                variant="contained"
                                startIcon={<AddRounded />}
                                onClick={() => navigate(`/projects/${selectedUpdate.projectId}`)}
                                sx={{ textTransform: 'none' }}
                            >
                                View project
                            </Button>
                        </DialogActions>
                    </>
                ) : null}
            </Dialog>
        </Box>
    );
}