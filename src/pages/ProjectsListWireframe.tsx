import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
    Box,
    Typography,
    Paper,
    Tabs,
    Tab,
    InputBase,
    IconButton,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    Stack,
    TableSortLabel,
    Select,
    MenuItem,
    Checkbox,
    ListItemText,
    ToggleButton,
    ToggleButtonGroup,
    FormControl,
    InputLabel,
    useMediaQuery,
    useTheme,
    Tooltip,
} from '@mui/material';
import SearchRounded from '@mui/icons-material/SearchRounded';
import BookmarkRounded from '@mui/icons-material/BookmarkRounded';
import BookmarkBorderRounded from '@mui/icons-material/BookmarkBorderRounded';
import CloseRounded from '@mui/icons-material/CloseRounded';
import ViewListRounded from '@mui/icons-material/ViewListRounded';
import WaterRounded from '@mui/icons-material/Water';
import ForestRounded from '@mui/icons-material/Forest';
import AgricultureRounded from '@mui/icons-material/Agriculture';
import ParkRounded from '@mui/icons-material/ParkRounded';

import {
    ProjectStageIndicator,
    type ProjectStage,
} from '../components/ProjectStageIndicator';
import { ProjectCard } from '../components/cards/ProjectCard';
import { MobileFilterSheet } from '../components/MobileFilterSheet';

import {
    type OpportunityType,
    type SortField,
    type SortDirection,
} from '../constants/projects';

import MapRounded from '@mui/icons-material/MapRounded';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

type ProjectType = string;

interface Project {
    id: string;
    upid: string;
    name: string;
    developer: string;
    description: string | null;
    stage: ProjectStage;
    type: ProjectType;
    country: string | null;
    countryCode: string | null;
    region?: string | null;
    updatedAt: string;
    opportunities: OpportunityType[];
    isSaved: boolean;
    isMine?: boolean;
    lat?: number | null;
    lng?: number | null;

    coverImageUrl?: string | null;
    coverThumbUrl?: string | null;

    creditTotals?: {
        toDateIssued?: number | null;
        toDateOfftake?: number | null;
        toDateRetired?: number | null;
    };
}

interface FacetOption {
    value: string;
    count: number;
}

interface ProjectsListResponse {
    items: Project[];
    total: number;
    page: number;
    pageSize: number;
    sortBy: SortField;
    sortDir: SortDirection;
    counts: {
        all: number;
        my: number;
        saved: number;
    };
    filters: {
        stages: FacetOption[];
        types: FacetOption[];
        countries: FacetOption[];
        opportunities: FacetOption[];
    };
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';
const SAVED_ITEMS_BASE_PATH = `${API_BASE_URL}/saved-items`;

function formatUpdatedLabel(value?: string | null) {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';

    const diffMs = Date.now() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) return 'Today';
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) {
        const weeks = Math.floor(diffDays / 7);
        return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
    }
    if (diffDays < 365) {
        const months = Math.floor(diffDays / 30);
        return `${months} month${months > 1 ? 's' : ''} ago`;
    }

    const years = Math.floor(diffDays / 365);
    return `${years} year${years > 1 ? 's' : ''} ago`;
}

function getProjectListImage(project: Project): string | null {
    return project.coverThumbUrl || project.coverImageUrl || null;
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
    const res = await fetch(url, {
        headers: {
            'Content-Type': 'application/json',
            ...(init?.headers ?? {}),
        },
        credentials: 'include',
        ...init,
    });

    if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(text || `Request failed: ${res.status}`);
    }

    return res.json();
}

const typeIconMap: Record<
    string,
    {
        icon: React.ElementType;
        color: string;
        bg: string;
    }
> = {
    ARR: {
        icon: ParkRounded,
        color: '#558b2f',
        bg: '#f1f8e9',
    },
    'REDD+': {
        icon: ForestRounded,
        color: '#388e3c',
        bg: '#e8f5e9',
    },
    'Regenerative Agriculture': {
        icon: AgricultureRounded,
        color: '#6d4c41',
        bg: '#efebe9',
    },
    IFM: {
        icon: ForestRounded,
        color: '#2e7d32',
        bg: '#e8f5e9',
    },
    'Blue Carbon': {
        icon: WaterRounded,
        color: '#0277bd',
        bg: '#e1f5fe',
    },
};

const defaultMarkerIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
});

type ProjectMapPin = {
    id: string;
    name: string;
    upid: string;
    developer: string;
    country: string | null;
    region?: string | null;
    lat: number;
    lng: number;
};

function isFiniteNumber(value: unknown): value is number {
    return typeof value === 'number' && Number.isFinite(value);
}

function MapBounds({ pins }: { pins: ProjectMapPin[] }) {
    const map = useMap();

    useEffect(() => {
        if (!pins.length) return;

        if (pins.length === 1) {
            map.setView([pins[0].lat, pins[0].lng], 7);
            return;
        }

        const bounds = L.latLngBounds(pins.map((pin) => [pin.lat, pin.lng] as [number, number]));
        map.fitBounds(bounds, { padding: [32, 32] });
    }, [map, pins]);

    return null;
}

export function ProjectsListWireframe() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const isSmallViewport = useMediaQuery(theme.breakpoints.down('lg'));

    const [activeTab, setActiveTab] = useState<'all' | 'my' | 'saved'>('all');
    const [viewMode, setViewMode] = useState<'list' | 'map'>('list');

    const [projects, setProjects] = useState<Project[]>([]);
    const [totalProjects, setTotalProjects] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [page, setPage] = useState(1);
    const [pageSize] = useState(20);

    const [myProjectsCount, setMyProjectsCount] = useState<number>(0);
    const [savedProjectsCount, setSavedProjectsCount] = useState<number>(0);
    const [allProjectsCount, setAllProjectsCount] = useState<number>(0);

    const [stageOptions, setStageOptions] = useState<FacetOption[]>([]);
    const [typeOptions, setTypeOptions] = useState<FacetOption[]>([]);
    const [countryOptions, setCountryOptions] = useState<FacetOption[]>([]);
    const [opportunityOptions, setOpportunityOptions] = useState<FacetOption[]>([]);

    const [searchQuery, setSearchQuery] = useState('');
    const [stageFilter, setStageFilter] = useState<ProjectStage[]>([]);
    const [typeFilter, setTypeFilter] = useState<ProjectType[]>([]);
    const [countryFilter, setCountryFilter] = useState<string[]>([]);
    const [opportunityFilter, setOpportunityFilter] = useState<OpportunityType[]>([]);
    const [sortField, setSortField] = useState<SortField>('updated');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

    useEffect(() => {
        const tab = searchParams.get('tab');
        if (tab === 'my' || tab === 'saved' || tab === 'all') {
            setActiveTab(tab);
        }

        const q = searchParams.get('q');
        if (q) setSearchQuery(q);

        const stage = searchParams.get('stage');
        if (stage) {
            setStageFilter(stage.split(',').filter(Boolean) as ProjectStage[]);
        }

        const projectType = searchParams.get('projectType');
        if (projectType) {
            setTypeFilter(projectType.split(',').filter(Boolean) as ProjectType[]);
        }

        const hostCountry = searchParams.get('hostCountry');
        if (hostCountry) {
            setCountryFilter(hostCountry.split(',').filter(Boolean));
        }

        const opportunity = searchParams.get('opportunity');
        if (opportunity) {
            setOpportunityFilter(
                opportunity.split(',').filter(Boolean) as OpportunityType[]
            );
        }

        const sortBy = searchParams.get('sortBy');
        if (
            sortBy &&
            ['name', 'developer', 'stage', 'type', 'country', 'updated'].includes(
                sortBy
            )
        ) {
            setSortField(sortBy as SortField);
        }

        const sortDir = searchParams.get('sortDir');
        if (sortDir === 'asc' || sortDir === 'desc') {
            setSortDirection(sortDir);
        }

        const pageParam = Number(searchParams.get('page') ?? '1');
        if (!Number.isNaN(pageParam) && pageParam > 0) {
            setPage(pageParam);
        }
    }, [searchParams]);

    useEffect(() => {
        setPage(1);
    }, [
        activeTab,
        searchQuery,
        stageFilter,
        typeFilter,
        countryFilter,
        opportunityFilter,
        sortField,
        sortDirection,
    ]);

    useEffect(() => {
        const next = new URLSearchParams();

        if (activeTab !== 'all') next.set('tab', activeTab);
        if (searchQuery) next.set('q', searchQuery);
        if (stageFilter.length) next.set('stage', stageFilter.join(','));
        if (typeFilter.length) next.set('projectType', typeFilter.join(','));
        if (countryFilter.length) next.set('hostCountry', countryFilter.join(','));
        if (opportunityFilter.length) {
            next.set('opportunity', opportunityFilter.join(','));
        }

        next.set('sortBy', sortField);
        next.set('sortDir', sortDirection);
        next.set('page', String(page));

        setSearchParams(next, { replace: true });
    }, [
        activeTab,
        searchQuery,
        stageFilter,
        typeFilter,
        countryFilter,
        opportunityFilter,
        sortField,
        sortDirection,
        page,
        setSearchParams,
    ]);

    useEffect(() => {
        const controller = new AbortController();

        async function loadProjects() {
            try {
                setLoading(true);
                setError(null);

                const qs = new URLSearchParams();
                qs.set('page', String(page));
                qs.set('pageSize', String(pageSize));
                qs.set('sortBy', sortField);
                qs.set('sortDir', sortDirection);
                qs.set('scope', activeTab);

                if (searchQuery.trim()) qs.set('q', searchQuery.trim());
                if (stageFilter.length) qs.set('stage', stageFilter.join(','));
                if (typeFilter.length) qs.set('projectType', typeFilter.join(','));
                if (countryFilter.length) qs.set('hostCountry', countryFilter.join(','));
                if (opportunityFilter.length) {
                    qs.set('opportunity', opportunityFilter.join(','));
                }

                const data = await fetchJson<ProjectsListResponse>(
                    `${API_BASE_URL}/projects?${qs.toString()}`,
                    { signal: controller.signal }
                );

                setProjects(data.items);
                setTotalProjects(data.total);
                setMyProjectsCount(data.counts?.my ?? 0);
                setSavedProjectsCount(data.counts?.saved ?? 0);

                setAllProjectsCount(data.counts?.all ?? 0);

                setStageOptions(data.filters?.stages ?? []);
                setTypeOptions(data.filters?.types ?? []);
                setCountryOptions(data.filters?.countries ?? []);
                setOpportunityOptions(data.filters?.opportunities ?? []);
            } catch (err: any) {
                if (err?.name === 'AbortError') return;
                setError(err?.message || 'Failed to load projects');
            } finally {
                setLoading(false);
            }
        }

        loadProjects();

        return () => controller.abort();
    }, [
        page,
        pageSize,
        activeTab,
        searchQuery,
        stageFilter,
        typeFilter,
        countryFilter,
        opportunityFilter,
        sortField,
        sortDirection,
    ]);

    const toggleSave = async (projectId: string, e: React.MouseEvent) => {
        e.stopPropagation();

        const target = projects.find((p) => p.id === projectId);
        if (!target) return;

        const nextSaved = !target.isSaved;

        setProjects((prev) =>
            prev.map((p) => (p.id === projectId ? { ...p, isSaved: nextSaved } : p))
        );
        setSavedProjectsCount((prev) => Math.max(0, prev + (nextSaved ? 1 : -1)));

        try {
            if (nextSaved) {
                await fetchJson(`${SAVED_ITEMS_BASE_PATH}`, {
                    method: 'POST',
                    body: JSON.stringify({
                        entityType: 'project',
                        entityId: target.id,
                    }),
                });
            } else {
                await fetchJson(
                    `${SAVED_ITEMS_BASE_PATH}/project/${target.id}`,
                    {
                        method: 'DELETE',
                    }
                );

                if (activeTab === 'saved') {
                    setProjects((prev) => prev.filter((p) => p.id !== projectId));
                    setTotalProjects((prev) => Math.max(0, prev - 1));
                }
            }
        } catch (err) {
            setProjects((prev) =>
                prev.map((p) => (p.id === projectId ? { ...p, isSaved: !nextSaved } : p))
            );
            setSavedProjectsCount((prev) => Math.max(0, prev + (nextSaved ? -1 : 1)));
            console.error('toggle save failed', err);
        }
    };

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
            return;
        }

        setSortField(field);
        setSortDirection('asc');
    };

    const handleProjectClick = (projectId: string) => {
        const target = projects.find((project) => project.id === projectId);
        if (!target) return;

        navigate(target.isMine ? `/my-projects/${projectId}` : `/projects/${projectId}`);
    };

    const handleFilterChange =
        (setter: React.Dispatch<React.SetStateAction<any[]>>) => (event: any) => {
            const {
                target: { value },
            } = event;
            setter(typeof value === 'string' ? value.split(',') : value);
        };

    const clearFilters = () => {
        setStageFilter([]);
        setTypeFilter([]);
        setCountryFilter([]);
        setOpportunityFilter([]);
    };

    const activeFiltersCount =
        stageFilter.length +
        typeFilter.length +
        countryFilter.length +
        opportunityFilter.length;

    const filteredAndSortedProjects = useMemo(() => projects, [projects]);

    const mapPins = useMemo<ProjectMapPin[]>(() => {
        return filteredAndSortedProjects
            .filter((project) => isFiniteNumber(project.lat) && isFiniteNumber(project.lng))
            .map((project) => ({
                id: project.id,
                name: project.name,
                upid: project.upid,
                developer: project.developer,
                country: project.country,
                region: project.region ?? null,
                lat: project.lat as number,
                lng: project.lng as number,
            }));
    }, [filteredAndSortedProjects]);

    return (
        <Box minHeight="100vh" bgcolor="white" display="flex" flexDirection="column">
            <Box bgcolor="white" borderBottom={1} borderColor="grey.200" flexShrink={0}>
                <Box
                    px={3}
                    pt={2}
                    pb={1}
                    display="flex"
                    alignItems="center"
                    justifyContent="space-between"
                >
                    <Box>
                        <Typography variant="h5" fontWeight="bold" color="text.primary">
                            Projects
                        </Typography>
                    </Box>
                </Box>

                <Box px={3}>
                    <Tabs
                        value={activeTab}
                        onChange={(_, v) => setActiveTab(v)}
                        textColor="primary"
                        indicatorColor="primary"
                        sx={{ minHeight: 48 }}
                    >
                        <Tab
                            value="all"
                            label={
                                <Box display="flex" alignItems="center" gap={1}>
                                    All projects
                                    <Chip
                                        label={activeTab === 'all' ? totalProjects : allProjectsCount}
                                        size="small"
                                        sx={{
                                            height: 20,
                                            fontSize: '0.75rem',
                                            bgcolor: 'grey.100',
                                        }}
                                    />
                                </Box>
                            }
                            sx={{
                                textTransform: 'none',
                                fontWeight: 500,
                                minHeight: 48,
                            }}
                        />

                        {myProjectsCount > 0 && (
                            <Tab
                                value="my"
                                label={
                                    <Box display="flex" alignItems="center" gap={1}>
                                        My projects
                                        <Chip
                                            label={
                                                activeTab === 'my'
                                                    ? totalProjects
                                                    : myProjectsCount
                                            }
                                            size="small"
                                            sx={{
                                                height: 20,
                                                fontSize: '0.75rem',
                                                bgcolor: 'grey.100',
                                            }}
                                        />
                                    </Box>
                                }
                                sx={{
                                    textTransform: 'none',
                                    fontWeight: 500,
                                    minHeight: 48,
                                }}
                            />
                        )}

                        <Tab
                            value="saved"
                            label={
                                <Box display="flex" alignItems="center" gap={1}>
                                    Saved
                                    {savedProjectsCount > 0 && (
                                        <Chip
                                            label={
                                                activeTab === 'saved'
                                                    ? totalProjects
                                                    : savedProjectsCount
                                            }
                                            size="small"
                                            sx={{
                                                height: 20,
                                                fontSize: '0.75rem',
                                                bgcolor: 'grey.100',
                                            }}
                                        />
                                    )}
                                </Box>
                            }
                            sx={{
                                textTransform: 'none',
                                fontWeight: 500,
                                minHeight: 48,
                            }}
                        />
                    </Tabs>
                </Box>
            </Box>

            <Box p={3} flexGrow={1} display="flex" flexDirection="column" overflow="hidden">
                <Paper
                    variant="outlined"
                    sx={{
                        borderRadius: 2,
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
                        flexGrow: 1,
                    }}
                >
                    <Box
                        display="flex"
                        flexDirection="column"
                        px={2}
                        py={1.5}
                        borderBottom={1}
                        borderColor="grey.100"
                        gap={1.5}
                    >
                        <Box
                            display="flex"
                            alignItems="center"
                            justifyContent="space-between"
                            gap={2}
                        >
                            <Paper
                                component="form"
                                onSubmit={(e) => e.preventDefault()}
                                sx={{
                                    p: '2px 4px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    width: 280,
                                    border: 1,
                                    borderColor: 'grey.200',
                                    boxShadow: 'none',
                                }}
                            >
                                <SearchRounded
                                    sx={{
                                        ml: 1,
                                        color: 'grey.400',
                                        fontSize: 20,
                                    }}
                                />

                                <InputBase
                                    sx={{
                                        ml: 1,
                                        flex: 1,
                                        fontSize: '0.875rem',
                                    }}
                                    placeholder="Search projects..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />

                                {searchQuery && (
                                    <IconButton size="small" onClick={() => setSearchQuery('')}>
                                        <CloseRounded sx={{ fontSize: 16 }} />
                                    </IconButton>
                                )}
                            </Paper>

                            <ToggleButtonGroup
                                value={viewMode}
                                exclusive
                                onChange={(_, v) => v && setViewMode(v)}
                                size="small"
                                sx={{
                                    '& .MuiToggleButton-root.Mui-selected': {
                                        color: 'teal',
                                        bgcolor: 'rgba(0,128,128,0.08)',
                                        '&:hover': {
                                            bgcolor: 'rgba(0,128,128,0.12)',
                                        },
                                    },
                                }}
                            >
                                <ToggleButton value="list">
                                    <Tooltip title="List">
                                        <ViewListRounded fontSize="small" />
                                    </Tooltip>
                                </ToggleButton>
                                {/* <ToggleButton value="cards">
                                    <Tooltip title="Cards">
                                        <ViewAgendaRounded fontSize="small" />
                                    </Tooltip>
                                </ToggleButton> */}
                                <ToggleButton value="map" disabled={isSmallViewport}>
                                    <Tooltip title="Map">
                                        <MapRounded fontSize="small" />
                                    </Tooltip>
                                </ToggleButton>
                            </ToggleButtonGroup>
                        </Box>

                        <Box display="flex" alignItems="center" gap={2} flexWrap="wrap">
                            <Box sx={{ display: { xs: 'block', md: 'none' } }}>
                                <MobileFilterSheet
                                    activeCount={activeFiltersCount}
                                    onClear={clearFilters}
                                >
                                    <FormControl size="small" fullWidth>
                                        <InputLabel sx={{ fontSize: '0.875rem' }}>Stage</InputLabel>
                                        <Select
                                            multiple
                                            value={stageFilter}
                                            onChange={handleFilterChange(setStageFilter)}
                                            renderValue={(selected) =>
                                                (selected as string[]).join(', ')
                                            }
                                            label="Stage"
                                            sx={{ fontSize: '0.875rem' }}
                                        >
                                            {stageOptions.map((option) => (
                                                <MenuItem key={option.value} value={option.value}>
                                                    <Checkbox size="small" checked={stageFilter.includes(option.value as ProjectStage)} />
                                                    <ListItemText primary={`${option.value} (${option.count})`} />
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>

                                    <FormControl size="small" fullWidth>
                                        <InputLabel sx={{ fontSize: '0.875rem' }}>Type</InputLabel>
                                        <Select
                                            multiple
                                            value={typeFilter}
                                            onChange={handleFilterChange(setTypeFilter)}
                                            renderValue={(selected) =>
                                                (selected as string[]).join(', ')
                                            }
                                            label="Type"
                                            sx={{ fontSize: '0.875rem' }}
                                        >
                                            {typeOptions.map((option) => (
                                                <MenuItem key={option.value} value={option.value}>
                                                    <Checkbox size="small" checked={typeFilter.includes(option.value as ProjectType)} />
                                                    <ListItemText primary={`${option.value} (${option.count})`} />
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>

                                    <FormControl size="small" fullWidth>
                                        <InputLabel sx={{ fontSize: '0.875rem' }}>Country</InputLabel>
                                        <Select
                                            multiple
                                            value={countryFilter}
                                            onChange={handleFilterChange(setCountryFilter)}
                                            renderValue={(selected) =>
                                                (selected as string[]).join(', ')
                                            }
                                            label="Country"
                                            sx={{ fontSize: '0.875rem' }}
                                        >
                                            {countryOptions.map((option) => (
                                                <MenuItem key={option.value} value={option.value}>
                                                    <Checkbox size="small" checked={countryFilter.includes(option.value)} />
                                                    <ListItemText primary={`${option.value} (${option.count})`} />
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>

                                    <FormControl size="small" fullWidth>
                                        <InputLabel sx={{ fontSize: '0.875rem' }}>Opportunity</InputLabel>
                                        <Select
                                            multiple
                                            value={opportunityFilter}
                                            onChange={handleFilterChange(setOpportunityFilter)}
                                            renderValue={(selected) =>
                                                (selected as string[]).join(', ')
                                            }
                                            label="Opportunity"
                                            sx={{ fontSize: '0.875rem' }}
                                        >
                                            {opportunityOptions.map((option) => (
                                                <MenuItem key={option.value} value={option.value}>
                                                    <Checkbox size="small" checked={opportunityFilter.includes(option.value as OpportunityType)} />
                                                    <ListItemText primary={`${option.value} (${option.count})`} />
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </MobileFilterSheet>
                            </Box>

                            <Box
                                sx={{
                                    display: { xs: 'none', md: 'flex' },
                                    alignItems: 'center',
                                    gap: 2,
                                    flex: 1,
                                }}
                            >
                                <FormControl size="small" sx={{ flex: 1 }}>
                                    <InputLabel sx={{ fontSize: '0.875rem' }}>Stage</InputLabel>
                                    <Select
                                        multiple
                                        value={stageFilter}
                                        onChange={handleFilterChange(setStageFilter)}
                                        renderValue={(selected) =>
                                            (selected as string[]).join(', ')
                                        }
                                        label="Stage"
                                        sx={{ fontSize: '0.875rem' }}
                                    >
                                        {stageOptions.map((option) => (
                                            <MenuItem key={option.value} value={option.value}>
                                                <Checkbox size="small" checked={stageFilter.includes(option.value as ProjectStage)} />
                                                <ListItemText primary={`${option.value} (${option.count})`} />
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>

                                <FormControl size="small" sx={{ flex: 1 }}>
                                    <InputLabel sx={{ fontSize: '0.875rem' }}>Type</InputLabel>
                                    <Select
                                        multiple
                                        value={typeFilter}
                                        onChange={handleFilterChange(setTypeFilter)}
                                        renderValue={(selected) =>
                                            (selected as string[]).join(', ')
                                        }
                                        label="Type"
                                        sx={{ fontSize: '0.875rem' }}
                                    >
                                        {typeOptions.map((option) => (
                                            <MenuItem key={option.value} value={option.value}>
                                                <Checkbox size="small" checked={typeFilter.includes(option.value as ProjectType)} />
                                                <ListItemText primary={`${option.value} (${option.count})`} />
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>

                                <FormControl size="small" sx={{ flex: 1 }}>
                                    <InputLabel sx={{ fontSize: '0.875rem' }}>Country</InputLabel>
                                    <Select
                                        multiple
                                        value={countryFilter}
                                        onChange={handleFilterChange(setCountryFilter)}
                                        renderValue={(selected) =>
                                            (selected as string[]).join(', ')
                                        }
                                        label="Country"
                                        sx={{ fontSize: '0.875rem' }}
                                    >
                                        {countryOptions.map((option) => (
                                            <MenuItem key={option.value} value={option.value}>
                                                <Checkbox size="small" checked={countryFilter.includes(option.value)} />
                                                <ListItemText primary={`${option.value} (${option.count})`} />
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>

                                <FormControl size="small" sx={{ flex: 1 }}>
                                    <InputLabel sx={{ fontSize: '0.875rem' }}>Opportunity</InputLabel>
                                    <Select
                                        multiple
                                        value={opportunityFilter}
                                        onChange={handleFilterChange(setOpportunityFilter)}
                                        renderValue={(selected) =>
                                            (selected as string[]).join(', ')
                                        }
                                        label="Opportunity"
                                        sx={{ fontSize: '0.875rem' }}
                                    >
                                        {opportunityOptions.map((option) => (
                                            <MenuItem key={option.value} value={option.value}>
                                                <Checkbox size="small" checked={opportunityFilter.includes(option.value as OpportunityType)} />
                                                <ListItemText primary={`${option.value} (${option.count})`} />
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>

                                {activeFiltersCount > 0 && (
                                    <Button
                                        size="small"
                                        onClick={clearFilters}
                                        sx={{
                                            textTransform: 'none',
                                            color: 'text.secondary',
                                            flexShrink: 0,
                                        }}
                                    >
                                        Clear
                                    </Button>
                                )}
                            </Box>
                        </Box>
                    </Box>

                    {loading ? (
                        <Box flexGrow={1} display="flex" alignItems="center" justifyContent="center">
                            <Typography color="text.secondary">Loading projects...</Typography>
                        </Box>
                    ) : error ? (
                        <Box flexGrow={1} display="flex" alignItems="center" justifyContent="center">
                            <Typography color="error">{error}</Typography>
                        </Box>
                    ) : viewMode === 'list' ? (
                        <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
                            {filteredAndSortedProjects.length === 0 ? (
                                <Box p={3}>
                                    <Typography color="text.secondary">
                                        No projects found matching your criteria.
                                    </Typography>
                                </Box>
                            ) : (
                                <TableContainer>
                                    <Table>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell
                                                    sortDirection={sortField === 'name' ? sortDirection : false}
                                                >
                                                    <TableSortLabel
                                                        active={sortField === 'name'}
                                                        direction={
                                                            sortField === 'name' ? sortDirection : 'asc'
                                                        }
                                                        onClick={() => handleSort('name')}
                                                    >
                                                        Project
                                                    </TableSortLabel>
                                                </TableCell>

                                                <TableCell
                                                    sortDirection={
                                                        sortField === 'developer' ? sortDirection : false
                                                    }
                                                >
                                                    <TableSortLabel
                                                        active={sortField === 'developer'}
                                                        direction={
                                                            sortField === 'developer'
                                                                ? sortDirection
                                                                : 'asc'
                                                        }
                                                        onClick={() => handleSort('developer')}
                                                    >
                                                        Developer
                                                    </TableSortLabel>
                                                </TableCell>

                                                <TableCell
                                                    sortDirection={sortField === 'stage' ? sortDirection : false}
                                                >
                                                    <TableSortLabel
                                                        active={sortField === 'stage'}
                                                        direction={
                                                            sortField === 'stage' ? sortDirection : 'asc'
                                                        }
                                                        onClick={() => handleSort('stage')}
                                                    >
                                                        Stage
                                                    </TableSortLabel>
                                                </TableCell>

                                                <TableCell
                                                    sortDirection={sortField === 'type' ? sortDirection : false}
                                                >
                                                    <TableSortLabel
                                                        active={sortField === 'type'}
                                                        direction={
                                                            sortField === 'type' ? sortDirection : 'asc'
                                                        }
                                                        onClick={() => handleSort('type')}
                                                    >
                                                        Type
                                                    </TableSortLabel>
                                                </TableCell>

                                                <TableCell
                                                    sortDirection={sortField === 'country' ? sortDirection : false}
                                                >
                                                    <TableSortLabel
                                                        active={sortField === 'country'}
                                                        direction={
                                                            sortField === 'country' ? sortDirection : 'asc'
                                                        }
                                                        onClick={() => handleSort('country')}
                                                    >
                                                        Country
                                                    </TableSortLabel>
                                                </TableCell>

                                                <TableCell
                                                    sortDirection={sortField === 'updated' ? sortDirection : false}
                                                >
                                                    <TableSortLabel
                                                        active={sortField === 'updated'}
                                                        direction={
                                                            sortField === 'updated'
                                                                ? sortDirection
                                                                : 'asc'
                                                        }
                                                        onClick={() => handleSort('updated')}
                                                    >
                                                        Updated
                                                    </TableSortLabel>
                                                </TableCell>

                                                <TableCell align="right">Save</TableCell>
                                            </TableRow>
                                        </TableHead>

                                        <TableBody>
                                            {filteredAndSortedProjects.map((project) => (
                                                <TableRow
                                                    key={project.id}
                                                    hover
                                                    onClick={() => handleProjectClick(project.id)}
                                                    sx={{ cursor: 'pointer' }}
                                                >
                                                    <TableCell>
                                                        <Box>
                                                            <Typography variant="body2" fontWeight={600}>
                                                                {project.name}
                                                            </Typography>
                                                        </Box>
                                                    </TableCell>

                                                    <TableCell>{project.developer}</TableCell>
                                                    <TableCell>
                                                        <ProjectStageIndicator stage={project.stage} />
                                                    </TableCell>
                                                    <TableCell>{project.type}</TableCell>
                                                    <TableCell>
                                                        {project.countryCode
                                                            ? `${project.countryCode} · ${project.country ?? ''}`
                                                            : project.country ?? '-'}
                                                    </TableCell>
                                                    <TableCell>
                                                        {formatUpdatedLabel(project.updatedAt)}
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        <IconButton
                                                            size="small"
                                                            onClick={(e) => toggleSave(project.id, e)}
                                                        >
                                                            {project.isSaved ? (
                                                                <BookmarkRounded fontSize="small" />
                                                            ) : (
                                                                <BookmarkBorderRounded fontSize="small" />
                                                            )}
                                                        </IconButton>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            )}
                        </Box>
                    ) : (
                        <Box
                            sx={{
                                display: 'flex',
                                flex: 1,
                                minHeight: 0,
                                flexDirection: { xs: 'column', lg: 'row' },
                            }}
                        >
                            <Box
                                sx={{
                                    flex: { xs: '0 0 auto', lg: '0 0 44%' },
                                    minWidth: 0,
                                    minHeight: 0,
                                    overflow: 'auto',
                                    position: 'relative',
                                    bgcolor: 'background.paper',
                                    boxShadow: { xs: 'none', lg: '2px 0 8px rgba(0,0,0,0.04)' },

                                    '&::after': {
                                        content: '""',
                                        position: 'absolute',
                                        top: 0,
                                        right: 0,
                                        width: '1px',
                                        height: '100%',
                                        background: 'linear-gradient(to bottom, rgba(0,0,0,0.08), rgba(0,0,0,0.02))',
                                        display: { xs: 'none', lg: 'block' },
                                    },
                                    p: 2,
                                }}
                            >
                                {filteredAndSortedProjects.length === 0 ? (
                                    <Box textAlign="center" py={8}>
                                        <Typography color="text.secondary">
                                            No projects found matching your criteria.
                                        </Typography>
                                    </Box>
                                ) : isMobile ? (
                                    <Stack spacing={1}>
                                        {filteredAndSortedProjects.map((project) => {
                                            const typeInfo = typeIconMap[project.type];
                                            const Icon = typeInfo?.icon;

                                            return (
                                                <Paper
                                                    key={project.id}
                                                    variant="outlined"
                                                    onClick={() => handleProjectClick(project.id)}
                                                    sx={{
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        p: 2,
                                                        gap: 1.5,
                                                        cursor: 'pointer',
                                                        borderRadius: 2,
                                                        overflow: 'hidden',
                                                        transition: 'all 0.15s ease',
                                                        '&:hover': {
                                                            bgcolor: 'grey.50',
                                                            borderColor: 'grey.300',
                                                            boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                                                        },
                                                    }}
                                                >
                                                    <Box display="flex" alignItems="flex-start" gap={1.5}>
                                                        <Box flex={1} minWidth={0}>
                                                            <Typography
                                                                variant="subtitle2"
                                                                fontWeight="bold"
                                                                color="text.primary"
                                                            >
                                                                {project.name}
                                                            </Typography>

                                                            <Typography
                                                                variant="caption"
                                                                color="text.secondary"
                                                                sx={{ display: 'block' }}
                                                            >
                                                                {project.developer}
                                                            </Typography>
                                                        </Box>

                                                        <IconButton
                                                            size="small"
                                                            onClick={(e) => toggleSave(project.id, e)}
                                                            sx={{
                                                                color: project.isSaved
                                                                    ? 'primary.main'
                                                                    : 'grey.300',
                                                                flexShrink: 0,
                                                            }}
                                                        >
                                                            {project.isSaved ? (
                                                                <BookmarkRounded sx={{ fontSize: 18 }} />
                                                            ) : (
                                                                <BookmarkBorderRounded sx={{ fontSize: 18 }} />
                                                            )}
                                                        </IconButton>
                                                    </Box>

                                                    <Typography
                                                        variant="body2"
                                                        color="text.secondary"
                                                        sx={{
                                                            display: '-webkit-box',
                                                            WebkitLineClamp: 3,
                                                            WebkitBoxOrient: 'vertical',
                                                            overflow: 'hidden',
                                                            lineHeight: 1.5,
                                                        }}
                                                    >
                                                        {project.description || 'No description available.'}
                                                    </Typography>

                                                    <Box
                                                        display="flex"
                                                        alignItems="center"
                                                        gap={1}
                                                        flexWrap="wrap"
                                                    >
                                                        <Box display="flex" alignItems="center" gap={0.5}>
                                                            <Typography fontSize="1rem">
                                                                {project.countryCode ?? ''}
                                                            </Typography>
                                                            <Typography
                                                                variant="caption"
                                                                color="text.secondary"
                                                            >
                                                                {project.country ?? '-'}
                                                            </Typography>
                                                        </Box>

                                                        <Chip
                                                            label={project.type}
                                                            size="small"
                                                            sx={{
                                                                bgcolor: 'grey.100',
                                                                fontSize: '0.7rem',
                                                                height: 22,
                                                            }}
                                                        />

                                                        <ProjectStageIndicator stage={project.stage} />

                                                        {!getProjectListImage(project) && Icon ? (
                                                            <Box
                                                                sx={{
                                                                    display: 'inline-flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center',
                                                                    width: 24,
                                                                    height: 24,
                                                                    borderRadius: 1,
                                                                    bgcolor: typeInfo.bg,
                                                                }}
                                                            >
                                                                <Icon
                                                                    sx={{
                                                                        fontSize: 16,
                                                                        color: typeInfo.color,
                                                                    }}
                                                                />
                                                            </Box>
                                                        ) : null}
                                                    </Box>

                                                    <Typography variant="caption" color="text.disabled">
                                                        Updated {formatUpdatedLabel(project.updatedAt)}
                                                    </Typography>
                                                </Paper>
                                            );
                                        })}
                                    </Stack>
                                ) : (
                                    <Stack spacing={2}>
                                        {filteredAndSortedProjects.map((project) => (
                                            <ProjectCard
                                                key={project.id}
                                                upid={project.id}
                                                name={project.name}
                                                developer={project.developer}
                                                description={project.description}
                                                stage={project.stage}
                                                type={project.type}
                                                country={project.country}
                                                countryCode={project.countryCode}
                                                photoUrl={getProjectListImage(project)}
                                                isSaved={project.isSaved}
                                                isMine={project.isMine ?? false}
                                                onClick={() => handleProjectClick(project.id)}
                                                onToggleSave={(e) => toggleSave(project.id, e)}
                                                variant="compact"
                                            />
                                        ))}
                                    </Stack>
                                )}
                            </Box>

                            <Box
                                sx={{
                                    flex: { xs: '1 1 auto', lg: '0 0 56%' },
                                    minHeight: { xs: 320, lg: 0 },
                                }}
                            >
                                {mapPins.length === 0 ? (
                                    <Box
                                        height="100%"
                                        display="flex"
                                        alignItems="center"
                                        justifyContent="center"
                                        p={3}
                                    >
                                        <Typography color="text.secondary">
                                            No map coordinates available for the current result.
                                        </Typography>
                                    </Box>
                                ) : (
                                    <MapContainer
                                        center={[4.5, 109.5]}
                                        zoom={4}
                                        style={{ height: '100%', width: '100%' }}
                                        scrollWheelZoom
                                    >
                                        <TileLayer
                                            attribution='&copy; OpenStreetMap contributors'
                                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                        />

                                        <MapBounds pins={mapPins} />

                                        {mapPins.map((pin) => (
                                            <Marker
                                                key={pin.id}
                                                position={[pin.lat, pin.lng]}
                                                icon={defaultMarkerIcon}
                                                eventHandlers={{
                                                    click: () => handleProjectClick(pin.id),
                                                }}
                                            >
                                                <Popup>
                                                    <Box>
                                                        <Typography variant="subtitle2" fontWeight={700}>
                                                            {pin.name}
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary">
                                                            {pin.developer}
                                                        </Typography>
                                                        <Typography
                                                            variant="caption"
                                                            color="text.secondary"
                                                            display="block"
                                                        >
                                                            {[pin.region, pin.country]
                                                                .filter(Boolean)
                                                                .join(', ')}
                                                        </Typography>
                                                    </Box>
                                                </Popup>
                                            </Marker>
                                        ))}
                                    </MapContainer>
                                )}
                            </Box>
                        </Box>
                    )}
                </Paper>
            </Box>
        </Box>
    );
}