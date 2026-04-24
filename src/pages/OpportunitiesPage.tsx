import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Typography,
    Paper,
    InputBase,
    IconButton,
    Button,
    Select,
    MenuItem,
    Chip,
    FormControl,
    InputLabel,
    Checkbox,
    ListItemText,
    Tabs,
    Tab,
    CircularProgress,
    Dialog,
    DialogContent,
    DialogTitle,
    Stack,
    Divider
} from '@mui/material';
import SearchRounded from '@mui/icons-material/SearchRounded';
import CloseRounded from '@mui/icons-material/CloseRounded';

import BookmarkRounded from '@mui/icons-material/BookmarkRounded';
import BookmarkBorderRounded from '@mui/icons-material/BookmarkBorderRounded';
import EmailRounded from '@mui/icons-material/EmailRounded';
import AttachMoneyRounded from '@mui/icons-material/AttachMoneyRounded';
import TrendingUpRounded from '@mui/icons-material/TrendingUpRounded';
import PeopleRounded from '@mui/icons-material/PeopleRounded';
import BarChartRounded from '@mui/icons-material/BarChartRounded';
import ShieldRounded from '@mui/icons-material/ShieldRounded';
import BusinessRounded from '@mui/icons-material/BusinessRounded';

import {
    OpportunityCard,
    OpportunityType
} from '../components/cards/OpportunityCard';
import { ProjectStage, ProjectStageIndicator } from '../components/ProjectStageIndicator';
import { MobileFilterSheet } from '../components/MobileFilterSheet';
import {
    CountryFlagLabel,
    resolveCountryCode
} from '../components/common/CountryFlagLabel';

import {
    trackBookmarkedItemRemoved,
    trackFirstOpportunityPostViewedInDetail,
    trackOpportunitiesDirectoryRefined,
    trackOpportunitiesDirectoryViewed,
    trackOpportunityContactClicked,
    trackOpportunityPostBookmarked,
    trackOpportunityPostViewedInDetail,
    type OpportunityTrackingEntryPoint,
} from '../lib/analytics';

type BackendProjectListItem = {
    id: string;
    upid: string | null;
    name: string;
    developer: string;
    description: string | null;
    stage: ProjectStage;
    type: string;
    country: string | null;
    countryCode: string | null;
    region: string | null;
    lat: number | null;
    lng: number | null;
    updatedAt: string;
    opportunities: string[];
    isSaved: boolean;
    isMine: boolean;
};

type BackendFacetOption = {
    value: string;
    count: number;
};

type BackendListProjectsResponse = {
    items: BackendProjectListItem[];
    total: number;
    page: number;
    pageSize: number;
    sortBy: string;
    sortDir: 'asc' | 'desc';
    counts: {
        all: number;
        my: number;
        saved: number;
    };
    filters: {
        stages: BackendFacetOption[];
        types: BackendFacetOption[];
        countries: BackendFacetOption[];
        opportunities: BackendFacetOption[];
    };
};

type BackendProjectDetailOpportunity = {
    id: string;
    type: string;
    description?: string | null;
    urgent?: boolean;
    isActive?: boolean;
    sortOrder?: number | null;
};

type BackendProjectDetail = {
    id: string;
    upid: string | null;
    name: string;
    companyName: string | null;
    stage: ProjectStage;
    country: string | null;
    opportunities: BackendProjectDetailOpportunity[];
};

type SavedOpportunityRow = {
    entityType: 'opportunity';
    savedAt: string;
    opportunity: {
        id: string;
        projectId: string;
        type: string;
        description: string;
        urgent: boolean;
        sortOrder: number;
        isActive: boolean;
        projectName: string;
        projectUpid: string | null;
        developer: string;
        stage: string | null;
        country: string | null;
        countryCode: string | null;
        isMine: boolean;
    };
};

type SavedItemsResponse = {
    projects: unknown[];
    companies: unknown[];
    opportunities: SavedOpportunityRow[];
};

type Opportunity = {
    id: string;
    projectId: string;
    companyId?: string;
    type: OpportunityType;
    description: string;
    projectName: string;
    projectUpid: string;
    developer: string;
    stage: ProjectStage;
    country: string;
    countryCode: string;
    urgent: boolean;
    isSaved: boolean;
    isMine?: boolean;
    savedAt?: string;
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

const FALLBACK_OPPORTUNITY_TYPES: OpportunityType[] = [
    'Financing',
    'Technical Advisor',
    'Buyers',
    'MRV Provider',
    'Insurance'
];

const FALLBACK_STAGES: ProjectStage[] = [
    'Exploration',
    'Concept',
    'Design',
    'Listed',
    'Validation',
    'Registered',
    'Issued',
    'Closed'
];

type BackendOpportunityListItem = {
    id: string;
    projectId: string;
    projectName: string;
    projectUpid?: string | null;
    companyId?: string | null;
    type: string;
    description: string | null;
    urgent: boolean;
    stage?: string | null;
    country?: string | null;
    developer?: string | null;
    createdAt: string;
};

type BackendListProjectOpportunitiesResponse = {
    items: BackendOpportunityListItem[];
};

function asOpportunityType(value: string): OpportunityType | null {
    const allowed: OpportunityType[] = [
        'Financing',
        'Technical Advisor',
        'Buyers',
        'MRV Provider',
        'Insurance'
    ];

    return allowed.includes(value as OpportunityType) ? (value as OpportunityType) : null;
}

function asProjectStage(value: string | null | undefined): ProjectStage | null {
    if (!value) return null;
    return FALLBACK_STAGES.includes(value as ProjectStage) ? (value as ProjectStage) : null;
}

function buildFallbackDescription(type: string, projectName: string) {
    return `Open ${type.toLowerCase()} opportunity for ${projectName}.`;
}

async function apiGet<T>(path: string): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${path}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
            Accept: 'application/json'
        }
    });

    if (!response.ok) {
        throw new Error(`Request failed: ${response.status}`);
    }

    const json = await response.json();
    return (json?.data ?? json) as T;
}

async function apiPost<T>(path: string, body: unknown): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${path}`, {
        method: 'POST',
        credentials: 'include',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    });

    if (!response.ok) {
        throw new Error(`Request failed: ${response.status}`);
    }

    const json = await response.json();
    return (json?.data ?? json) as T;
}

async function apiDelete(path: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}${path}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
            Accept: 'application/json'
        }
    });

    if (!response.ok) {
        throw new Error(`Request failed: ${response.status}`);
    }
}

function isOpportunity(item: Opportunity | null): item is Opportunity {
    return item !== null;
}

function mapSavedOpportunityToOpportunity(row: SavedOpportunityRow): Opportunity | null {
    const type = asOpportunityType(row.opportunity.type);
    const stage = asProjectStage(row.opportunity.stage);

    if (!type || !stage) return null;

    return {
        id: row.opportunity.id,
        projectId: row.opportunity.projectId,
        type,
        description:
            row.opportunity.description?.trim() ||
            buildFallbackDescription(type, row.opportunity.projectName),
        projectName: row.opportunity.projectName,
        projectUpid: row.opportunity.projectUpid || '',
        developer: row.opportunity.developer || 'Unknown developer',
        stage,
        country: row.opportunity.country || '',
        countryCode: resolveCountryCode(
            row.opportunity.country,
            row.opportunity.countryCode
        ),
        urgent: Boolean(row.opportunity.urgent),
        isSaved: true,
        isMine: row.opportunity.isMine,
        savedAt: row.savedAt
    };
}

function matchesSearch(opp: Opportunity, query: string) {
    if (!query) return true;

    const haystack = [
        opp.type,
        opp.description,
        opp.projectName,
        opp.projectUpid,
        opp.developer,
        opp.country,
        opp.stage
    ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

    return haystack.includes(query.toLowerCase());
}

function matchesFilters(
    opp: Opportunity,
    typeFilter: OpportunityType[],
    stageFilter: ProjectStage[],
    countryFilter: string[]
) {
    if (typeFilter.length && !typeFilter.includes(opp.type)) return false;
    if (stageFilter.length && !stageFilter.includes(opp.stage)) return false;
    if (countryFilter.length && !countryFilter.includes(opp.country)) return false;
    return true;
}

function getOpportunityTypeIcon(type: OpportunityType) {
    const iconSx = { fontSize: 24 };

    switch (type) {
        case 'Financing':
            return <AttachMoneyRounded sx={iconSx} />;
        case 'Technical Advisor':
            return <TrendingUpRounded sx={iconSx} />;
        case 'Buyers':
            return <PeopleRounded sx={iconSx} />;
        case 'MRV Provider':
            return <BarChartRounded sx={iconSx} />;
        case 'Insurance':
            return <ShieldRounded sx={iconSx} />;
        default:
            return <BusinessRounded sx={iconSx} />;
    }
}

export function OpportunitiesPage() {
    const navigate = useNavigate();

    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState<OpportunityType[]>([]);
    const [stageFilter, setStageFilter] = useState<ProjectStage[]>([]);
    const [countryFilter, setCountryFilter] = useState<string[]>([]);
    const [activeTab, setActiveTab] = useState<'all' | 'saved'>('all');

    const [savingIds, setSavingIds] = useState<Set<string>>(new Set());

    const [loading, setLoading] = useState(true);
    const [loadingSaved, setLoadingSaved] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [allOpportunities, setAllOpportunities] = useState<Opportunity[]>([]);
    const [savedOpportunities, setSavedOpportunities] = useState<Opportunity[]>([]);
    const [savedOpportunityIds, setSavedOpportunityIds] = useState<Set<string>>(new Set());

    const [availableTypes, setAvailableTypes] = useState<OpportunityType[]>(FALLBACK_OPPORTUNITY_TYPES);
    const [availableStages, setAvailableStages] = useState<ProjectStage[]>(FALLBACK_STAGES);
    const [availableCountries, setAvailableCountries] = useState<string[]>([]);

    const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);

    const hasTrackedDirectoryViewRef = useRef(false);
    const hasTrackedSearchRef = useRef(false);
    const hasTrackedTabRef = useRef(false);
    const hasTrackedTypeFilterRef = useRef(false);
    const hasTrackedStageFilterRef = useRef(false);
    const hasTrackedCountryFilterRef = useRef(false);

    const isPageLoading = loading || loadingSaved;

    const getDirectoryEntryPoint = (): OpportunityTrackingEntryPoint =>
        activeTab === 'saved'
            ? 'bookmarks_opportunities_tab'
            : 'opportunities_directory';

    const handleOpenOpportunityDetail = (
        opportunity: Opportunity,
        entryPoint: OpportunityTrackingEntryPoint
    ) => {
        trackOpportunityPostViewedInDetail({
            opportunityId: opportunity.id,
            projectId: opportunity.projectId,
            projectName: opportunity.projectName,
            opportunityType: opportunity.type,
            entryPoint,
            urgent: opportunity.urgent,
        });

        trackFirstOpportunityPostViewedInDetail({
            opportunityId: opportunity.id,
            projectId: opportunity.projectId,
            projectName: opportunity.projectName,
            opportunityType: opportunity.type,
            entryPoint,
            urgent: opportunity.urgent,
        });

        setSelectedOpportunity(opportunity);
    };

    const handleContactOpportunity = (
        opportunity: Opportunity,
        entryPoint: OpportunityTrackingEntryPoint,
        e?: React.MouseEvent
    ) => {
        e?.stopPropagation();

        trackOpportunityContactClicked({
            opportunityId: opportunity.id,
            projectId: opportunity.projectId,
            projectName: opportunity.projectName,
            opportunityType: opportunity.type,
            entryPoint,
            urgent: opportunity.urgent,
        });
    };

    const handleClearRefinements = () => {
        const hadSearch = Boolean(searchQuery.trim());
        const hadFilters =
            typeFilter.length > 0 ||
            stageFilter.length > 0 ||
            countryFilter.length > 0;

        if (!hadSearch && !hadFilters) return;

        trackOpportunitiesDirectoryRefined({
            refinementType: 'clear_filters',
            tab: activeTab,
            searchQuery: searchQuery.trim() || undefined,
            filterValues: [
                ...typeFilter.map((value) => `type:${value}`),
                ...stageFilter.map((value) => `stage:${value}`),
                ...countryFilter.map((value) => `country:${value}`),
            ],
        });

        setSearchQuery('');
        setTypeFilter([]);
        setStageFilter([]);
        setCountryFilter([]);
    };

    useEffect(() => {
        const timer = window.setTimeout(() => {
            setDebouncedSearch(searchQuery.trim());
        }, 250);

        return () => window.clearTimeout(timer);
    }, [searchQuery]);

    useEffect(() => {
        let cancelled = false;

        async function loadSavedOpportunities() {
            setLoadingSaved(true);

            try {
                const saved = await apiGet<SavedItemsResponse>(
                    '/saved-items?entityType=opportunity'
                );

                const mapped = (saved.opportunities ?? [])
                    .map(mapSavedOpportunityToOpportunity)
                    .filter(isOpportunity);

                if (cancelled) return;

                setSavedOpportunities(mapped);
                setSavedOpportunityIds(new Set(mapped.map((item) => item.id)));
            } catch {
                if (cancelled) return;
                setSavedOpportunities([]);
                setSavedOpportunityIds(new Set());
            } finally {
                if (!cancelled) setLoadingSaved(false);
            }
        }

        loadSavedOpportunities();

        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        let cancelled = false;

        async function loadAllOpportunities() {
            setLoading(true);
            setError(null);

            try {
                const result = await apiGet<BackendListProjectOpportunitiesResponse>(
                    '/projects/opportunities?limit=20'
                );

                const flattened: Opportunity[] = (result.items ?? [])
                    .map((item): Opportunity | null => {
                        const type = asOpportunityType(item.type);
                        const stage = asProjectStage(item.stage);

                        if (!type || !stage) return null;

                        return {
                            id: item.id,
                            projectId: item.projectId,
                            companyId: item.companyId ?? undefined,
                            type,
                            description:
                                item.description?.trim() ||
                                buildFallbackDescription(type, item.projectName),
                            projectName: item.projectName,
                            projectUpid: item.projectUpid || '',
                            developer: item.developer || 'Unknown developer',
                            stage,
                            country: item.country || '',
                            countryCode: resolveCountryCode(item.country),
                            urgent: Boolean(item.urgent),
                            isSaved: savedOpportunityIds.has(item.id),
                            isMine: false
                        };
                    })
                    .filter(isOpportunity);

                if (!cancelled) {
                    setAllOpportunities(flattened);
                }

            } catch (err) {
                if (!cancelled) {
                    setError(err instanceof Error ? err.message : 'Failed to load opportunities');
                    setAllOpportunities([]);
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        loadAllOpportunities();

        return () => {
            cancelled = true;
        };
    }, [savedOpportunityIds]);

    useEffect(() => {
        if (hasTrackedDirectoryViewRef.current) return;
        if (isPageLoading) return;

        trackOpportunitiesDirectoryViewed({ tab: activeTab });
        hasTrackedDirectoryViewRef.current = true;
    }, [activeTab, isPageLoading]);

    useEffect(() => {
        if (!hasTrackedSearchRef.current) {
            hasTrackedSearchRef.current = true;
            return;
        }

        if (!debouncedSearch) return;

        trackOpportunitiesDirectoryRefined({
            refinementType: 'search',
            tab: activeTab,
            searchQuery: debouncedSearch,
        });
    }, [debouncedSearch, activeTab]);

    useEffect(() => {
        if (!hasTrackedTabRef.current) {
            hasTrackedTabRef.current = true;
            return;
        }

        trackOpportunitiesDirectoryRefined({
            refinementType: 'tab',
            tab: activeTab,
        });
    }, [activeTab]);

    useEffect(() => {
        if (!hasTrackedTypeFilterRef.current) {
            hasTrackedTypeFilterRef.current = true;
            return;
        }

        trackOpportunitiesDirectoryRefined({
            refinementType: 'filter',
            tab: activeTab,
            filterName: 'type',
            filterValues: typeFilter,
        });
    }, [typeFilter, activeTab]);

    useEffect(() => {
        if (!hasTrackedStageFilterRef.current) {
            hasTrackedStageFilterRef.current = true;
            return;
        }

        trackOpportunitiesDirectoryRefined({
            refinementType: 'filter',
            tab: activeTab,
            filterName: 'stage',
            filterValues: stageFilter,
        });
    }, [stageFilter, activeTab]);

    useEffect(() => {
        if (!hasTrackedCountryFilterRef.current) {
            hasTrackedCountryFilterRef.current = true;
            return;
        }

        trackOpportunitiesDirectoryRefined({
            refinementType: 'filter',
            tab: activeTab,
            filterName: 'country',
            filterValues: countryFilter,
        });
    }, [countryFilter, activeTab]);

    const handleToggleSave = async (
        opportunity: Opportunity,
        e: React.MouseEvent,
        occurrencePoint: OpportunityTrackingEntryPoint = getDirectoryEntryPoint()
    ) => {
        e.stopPropagation();

        if (savingIds.has(opportunity.id)) return;

        setSavingIds((prev) => new Set(prev).add(opportunity.id));

        const wasSaved = savedOpportunityIds.has(opportunity.id);

        try {
            if (wasSaved) {
                await apiDelete(`/saved-items/opportunity/${opportunity.id}`);

                trackBookmarkedItemRemoved({
                    entityType: 'opportunity',
                    itemId: opportunity.id,
                    occurrencePoint,
                    projectId: opportunity.projectId,
                    projectName: opportunity.projectName,
                    itemType: opportunity.type,
                });

                setSavedOpportunityIds((prev) => {
                    const next = new Set(prev);
                    next.delete(opportunity.id);
                    return next;
                });

                setSavedOpportunities((prev) =>
                    prev.filter((item) => item.id !== opportunity.id)
                );

                setAllOpportunities((prev) =>
                    prev.map((item) =>
                        item.id === opportunity.id ? { ...item, isSaved: false } : item
                    )
                );
            } else {
                await apiPost('/saved-items', {
                    entityType: 'opportunity',
                    entityId: opportunity.id
                });

                trackOpportunityPostBookmarked({
                    opportunityId: opportunity.id,
                    projectId: opportunity.projectId,
                    projectName: opportunity.projectName,
                    opportunityType: opportunity.type,
                    occurrencePoint,
                    urgent: opportunity.urgent,
                });

                const savedVersion: Opportunity = {
                    ...opportunity,
                    isSaved: true,
                    savedAt: new Date().toISOString()
                };

                setSavedOpportunityIds((prev) => new Set(prev).add(opportunity.id));

                setSavedOpportunities((prev) => {
                    const exists = prev.some((item) => item.id === opportunity.id);
                    if (exists) {
                        return prev.map((item) =>
                            item.id === opportunity.id ? { ...item, isSaved: true } : item
                        );
                    }
                    return [savedVersion, ...prev];
                });

                setAllOpportunities((prev) =>
                    prev.map((item) =>
                        item.id === opportunity.id ? { ...item, isSaved: true } : item
                    )
                );
            }
        } catch (err) {
            console.error('Failed to toggle save for opportunity', err);
        } finally {
            setSavingIds((prev) => {
                const next = new Set(prev);
                next.delete(opportunity.id);
                return next;
            });
        }
    };

    const handleFilterChange =
        <T,>(setter: React.Dispatch<React.SetStateAction<T[]>>) =>
            (event: any) => {
                const {
                    target: { value }
                } = event;
                setter(typeof value === 'string' ? value.split(',') : value);
            };

    const visibleOpportunities = useMemo(() => {
        const base = activeTab === 'saved' ? savedOpportunities : allOpportunities;

        return base.filter(
            (opp) =>
                matchesSearch(opp, debouncedSearch) &&
                matchesFilters(opp, typeFilter, stageFilter, countryFilter)
        );
    }, [
        activeTab,
        allOpportunities,
        savedOpportunities,
        debouncedSearch,
        typeFilter,
        stageFilter,
        countryFilter
    ]);

    const activeFiltersCount =
        typeFilter.length + stageFilter.length + countryFilter.length;

    return (
        <Box
            minHeight="100vh"
            bgcolor="white"
            color="text.secondary"
            display="flex"
            flexDirection="column"
        >
            <Box
                bgcolor="white"
                borderBottom={1}
                borderColor="grey.200"
                flexShrink={0}
            >
                <Box px={3} pt={2} pb={1} display="flex" alignItems="center" gap={1.5}>
                    <Typography variant="h5" fontWeight="bold" color="text.primary">
                        Opportunities
                    </Typography>
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
                                    All opportunities
                                    <Chip
                                        label={allOpportunities.length}
                                        size="small"
                                        sx={{
                                            height: 20,
                                            fontSize: '0.75rem',
                                            bgcolor: 'grey.100'
                                        }}
                                    />
                                </Box>
                            }
                            sx={{
                                textTransform: 'none',
                                fontWeight: 500,
                                minHeight: 48
                            }}
                        />

                        <Tab
                            value="saved"
                            label={
                                <Box display="flex" alignItems="center" gap={1}>
                                    Saved
                                    <Chip
                                        label={savedOpportunities.length}
                                        size="small"
                                        sx={{
                                            height: 20,
                                            fontSize: '0.75rem',
                                            bgcolor: 'grey.100'
                                        }}
                                    />
                                </Box>
                            }
                            sx={{
                                textTransform: 'none',
                                fontWeight: 500,
                                minHeight: 48
                            }}
                        />
                    </Tabs>
                </Box>
            </Box>

            <Box p={3} flexGrow={1}>
                <Paper
                    variant="outlined"
                    sx={{
                        borderRadius: 2,
                        overflow: 'hidden',
                        mb: 3
                    }}
                >
                    <Box
                        display="flex"
                        alignItems="center"
                        gap={2}
                        p={2}
                        borderBottom={1}
                        borderColor="grey.100"
                        flexWrap="wrap"
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
                                boxShadow: 'none'
                            }}
                        >
                            <SearchRounded
                                sx={{
                                    ml: 1,
                                    color: 'grey.400',
                                    fontSize: 20
                                }}
                            />

                            <InputBase
                                sx={{
                                    ml: 1,
                                    flex: 1,
                                    fontSize: '0.875rem'
                                }}
                                placeholder="Search opportunities..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />

                            {searchQuery && (
                                <IconButton size="small" onClick={() => setSearchQuery('')}>
                                    <CloseRounded sx={{ fontSize: 16 }} />
                                </IconButton>
                            )}
                        </Paper>

                        <Box
                            sx={{
                                display: {
                                    xs: 'block',
                                    md: 'none'
                                }
                            }}
                        >
                            <MobileFilterSheet
                                activeCount={activeFiltersCount}
                                onClear={handleClearRefinements}
                            >
                                <FormControl size="small" fullWidth>
                                    <InputLabel sx={{ fontSize: '0.875rem' }}>Type</InputLabel>
                                    <Select
                                        multiple
                                        value={typeFilter}
                                        onChange={handleFilterChange(setTypeFilter)}
                                        label="Type"
                                        renderValue={(selected) => (selected as string[]).join(', ')}
                                        sx={{ fontSize: '0.875rem' }}
                                    >
                                        {availableTypes.map((type) => (
                                            <MenuItem key={type} value={type}>
                                                <Checkbox
                                                    checked={typeFilter.indexOf(type) > -1}
                                                    size="small"
                                                />
                                                <ListItemText primary={type} />
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>

                                <FormControl size="small" fullWidth>
                                    <InputLabel sx={{ fontSize: '0.875rem' }}>Stage</InputLabel>
                                    <Select
                                        multiple
                                        value={stageFilter}
                                        onChange={handleFilterChange(setStageFilter)}
                                        label="Stage"
                                        renderValue={(selected) => (selected as string[]).join(', ')}
                                        sx={{ fontSize: '0.875rem' }}
                                    >
                                        {availableStages.map((stage) => (
                                            <MenuItem key={stage} value={stage}>
                                                <Checkbox
                                                    checked={stageFilter.indexOf(stage) > -1}
                                                    size="small"
                                                />
                                                <ListItemText primary={stage} />
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
                                        label="Country"
                                        renderValue={(selected) => (selected as string[]).join(', ')}
                                        sx={{ fontSize: '0.875rem' }}
                                    >
                                        {availableCountries.map((country) => (
                                            <MenuItem key={country} value={country}>
                                                <Checkbox
                                                    checked={countryFilter.indexOf(country) > -1}
                                                    size="small"
                                                />
                                                <ListItemText primary={country} />
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </MobileFilterSheet>
                        </Box>

                        <Box
                            sx={{
                                display: {
                                    xs: 'none',
                                    md: 'flex'
                                },
                                alignItems: 'center',
                                gap: 2,
                                flexWrap: 'wrap'
                            }}
                        >
                            <FormControl size="small" sx={{ minWidth: 160 }}>
                                <InputLabel sx={{ fontSize: '0.875rem' }}>Type</InputLabel>
                                <Select
                                    multiple
                                    value={typeFilter}
                                    onChange={handleFilterChange(setTypeFilter)}
                                    label="Type"
                                    renderValue={(selected) => (selected as string[]).join(', ')}
                                    sx={{ fontSize: '0.875rem' }}
                                >
                                    {availableTypes.map((type) => (
                                        <MenuItem key={type} value={type}>
                                            <Checkbox
                                                checked={typeFilter.indexOf(type) > -1}
                                                size="small"
                                            />
                                            <ListItemText primary={type} />
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            <FormControl size="small" sx={{ minWidth: 140 }}>
                                <InputLabel sx={{ fontSize: '0.875rem' }}>Stage</InputLabel>
                                <Select
                                    multiple
                                    value={stageFilter}
                                    onChange={handleFilterChange(setStageFilter)}
                                    label="Stage"
                                    renderValue={(selected) => (selected as string[]).join(', ')}
                                    sx={{ fontSize: '0.875rem' }}
                                >
                                    {availableStages.map((stage) => (
                                        <MenuItem key={stage} value={stage}>
                                            <Checkbox
                                                checked={stageFilter.indexOf(stage) > -1}
                                                size="small"
                                            />
                                            <ListItemText primary={stage} />
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            <FormControl size="small" sx={{ minWidth: 140 }}>
                                <InputLabel sx={{ fontSize: '0.875rem' }}>Country</InputLabel>
                                <Select
                                    multiple
                                    value={countryFilter}
                                    onChange={handleFilterChange(setCountryFilter)}
                                    label="Country"
                                    renderValue={(selected) => (selected as string[]).join(', ')}
                                    sx={{ fontSize: '0.875rem' }}
                                >
                                    {availableCountries.map((country) => (
                                        <MenuItem key={country} value={country}>
                                            <Checkbox
                                                checked={countryFilter.indexOf(country) > -1}
                                                size="small"
                                            />
                                            <ListItemText primary={country} />
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            {(activeFiltersCount > 0 || searchQuery) && (
                                <Button
                                    size="small"
                                    onClick={handleClearRefinements}
                                    sx={{
                                        textTransform: 'none',
                                        color: 'text.secondary'
                                    }}
                                >
                                    Clear
                                </Button>
                            )}
                        </Box>
                    </Box>

                    <Box p={2} bgcolor="grey.50">
                        {isPageLoading ? (
                            <Box py={8} textAlign="center" color="text.secondary">
                                <CircularProgress size={24} sx={{ mb: 2 }} />
                                <Typography variant="body2">Loading opportunities...</Typography>
                            </Box>
                        ) : error ? (
                            <Box py={8} textAlign="center" color="error.main">
                                <Typography variant="body2">
                                    Failed to load opportunities.
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    {error}
                                </Typography>
                            </Box>
                        ) : visibleOpportunities.length === 0 ? (
                            <Box py={8} textAlign="center" color="text.disabled">
                                No opportunities found matching your criteria
                            </Box>
                        ) : (
                            <Box
                                display="grid"
                                gridTemplateColumns={{
                                    xs: '1fr',
                                    md: 'repeat(2, 1fr)',
                                    lg: 'repeat(3, 1fr)'
                                }}
                                gap={2}
                            >
                                {visibleOpportunities.map((opp) => (
                                    <Box key={opp.id}>
                                        <OpportunityCard
                                            id={opp.id}
                                            type={opp.type}
                                            description={opp.description}
                                            projectName={opp.projectName}
                                            projectUpid={opp.projectUpid}
                                            developer={opp.developer}
                                            stage={opp.stage}
                                            country={opp.country}
                                            countryCode={opp.countryCode}
                                            urgent={opp.urgent}
                                            isSaved={savedOpportunityIds.has(opp.id)}
                                            onClick={() => handleOpenOpportunityDetail(opp, getDirectoryEntryPoint())}
                                            onToggleSave={(e) => handleToggleSave(opp, e, getDirectoryEntryPoint())}
                                            onContactClick={(e) => {
                                                handleContactOpportunity(opp, getDirectoryEntryPoint(), e);
                                            }}
                                            onProjectClick={(e) => {
                                                e.stopPropagation();
                                                navigate(`/projects/${opp.projectId}`);
                                            }}
                                            onDeveloperClick={(e) => {
                                                e.stopPropagation();
                                                if (!opp.companyId) return;
                                                navigate(`/companies/${opp.companyId}`);
                                            }}
                                        />
                                    </Box>
                                ))}
                            </Box>
                        )}
                    </Box>

                    {!isPageLoading && !error && visibleOpportunities.length > 0 && (
                        <Box px={2} py={1.5} borderTop={1} borderColor="grey.100">
                            <Typography variant="caption" color="text.secondary">
                                Showing {visibleOpportunities.length} opportunities
                            </Typography>
                        </Box>
                    )}

                    <Dialog
                        open={!!selectedOpportunity}
                        onClose={() => setSelectedOpportunity(null)}
                        maxWidth="sm"
                        fullWidth
                        PaperProps={{
                            sx: {
                                borderRadius: 2
                            }
                        }}
                    >
                        {selectedOpportunity && (
                            <>
                                <DialogTitle
                                    sx={{
                                        pb: 0,
                                        pr: 6
                                    }}
                                >
                                    <Box display="flex" alignItems="flex-start" gap={2}>
                                        <Box
                                            sx={{
                                                width: 44,
                                                height: 44,
                                                borderRadius: 1.5,
                                                bgcolor: 'grey.100',
                                                color: 'grey.700',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                flexShrink: 0
                                            }}
                                        >
                                            {getOpportunityTypeIcon(selectedOpportunity.type)}
                                        </Box>

                                        <Box flex={1}>
                                            <Box display="flex" alignItems="center" gap={1.5} flexWrap="wrap">
                                                <Typography variant="h6" fontWeight="bold" lineHeight={1.3}>
                                                    {selectedOpportunity.type}
                                                </Typography>

                                                {selectedOpportunity.urgent && (
                                                    <Chip
                                                        label="Urgent"
                                                        size="small"
                                                        color="warning"
                                                        sx={{
                                                            height: 22,
                                                            fontSize: '0.7rem',
                                                            fontWeight: 600
                                                        }}
                                                    />
                                                )}
                                            </Box>

                                            {selectedOpportunity.urgent && (
                                                <Typography
                                                    variant="caption"
                                                    color="warning.main"
                                                    fontWeight="bold"
                                                >
                                                    Priority
                                                </Typography>
                                            )}
                                        </Box>

                                        <Box display="flex" alignItems="center" gap={0.5} flexShrink={0}>
                                            <IconButton
                                                size="small"
                                                onClick={(e) =>
                                                    handleToggleSave(selectedOpportunity, e, 'opportunity_detailed_view')
                                                }
                                                sx={{
                                                    color: savedOpportunityIds.has(selectedOpportunity.id)
                                                        ? 'primary.main'
                                                        : 'grey.400'
                                                }}
                                            >
                                                {savedOpportunityIds.has(selectedOpportunity.id) ? (
                                                    <BookmarkRounded />
                                                ) : (
                                                    <BookmarkBorderRounded />
                                                )}
                                            </IconButton>

                                            <IconButton
                                                size="small"
                                                onClick={() => setSelectedOpportunity(null)}
                                                sx={{ color: 'grey.500' }}
                                            >
                                                <CloseRounded />
                                            </IconButton>
                                        </Box>
                                    </Box>
                                </DialogTitle>

                                <DialogContent sx={{ pt: 2 }}>
                                    <Typography
                                        variant="body1"
                                        color="text.secondary"
                                        sx={{
                                            lineHeight: 1.6,
                                            mb: 3
                                        }}
                                    >
                                        {selectedOpportunity.description}
                                    </Typography>

                                    <Divider sx={{ mb: 2.5 }} />

                                    <Box mb={2.5}>
                                        <Typography
                                            variant="caption"
                                            color="text.disabled"
                                            fontWeight={600}
                                            sx={{
                                                textTransform: 'uppercase',
                                                letterSpacing: 0.5,
                                                mb: 1,
                                                display: 'block'
                                            }}
                                        >
                                            Project
                                        </Typography>

                                        <Typography
                                            variant="subtitle1"
                                            fontWeight="medium"
                                            color="text.primary"
                                            sx={{
                                                cursor: 'pointer',
                                                '&:hover': {
                                                    textDecoration: 'underline'
                                                },
                                                mb: 0.5
                                            }}
                                            onClick={() => {
                                                setSelectedOpportunity(null);
                                                navigate(`/projects/${selectedOpportunity.projectId}`);
                                            }}
                                        >
                                            {selectedOpportunity.projectName}
                                        </Typography>

                                        <Typography
                                            variant="body2"
                                            color="text.secondary"
                                            sx={{
                                                cursor: selectedOpportunity.companyId ? 'pointer' : 'default',
                                                '&:hover': selectedOpportunity.companyId
                                                    ? { textDecoration: 'underline' }
                                                    : undefined
                                            }}
                                            onClick={() => {
                                                if (!selectedOpportunity.companyId) return;
                                                setSelectedOpportunity(null);
                                                navigate(`/companies/${selectedOpportunity.companyId}`);
                                            }}
                                        >
                                            {selectedOpportunity.developer}
                                        </Typography>

                                        {!!selectedOpportunity.projectUpid && (
                                            <Typography variant="caption" color="text.disabled">
                                                {selectedOpportunity.projectUpid}
                                            </Typography>
                                        )}
                                    </Box>

                                    <Stack
                                        direction="row"
                                        spacing={1.5}
                                        alignItems="center"
                                        flexWrap="wrap"
                                        mb={3}
                                    >
                                        <ProjectStageIndicator stage={selectedOpportunity.stage} />

                                        {!!selectedOpportunity.country && (
                                            <CountryFlagLabel
                                                country={selectedOpportunity.country}
                                                code={selectedOpportunity.countryCode}
                                                size="md"
                                                textVariant="body2"
                                                color="text.secondary"
                                            />
                                        )}
                                    </Stack>

                                    <Button
                                        variant="outlined"
                                        fullWidth
                                        startIcon={<EmailRounded />}
                                        sx={{
                                            textTransform: 'none',
                                            borderColor: 'grey.300',
                                            color: 'text.primary',
                                            py: 1.25
                                        }}
                                        onClick={(e) => {
                                            handleContactOpportunity(
                                                selectedOpportunity,
                                                'opportunity_detailed_view',
                                                e
                                            );
                                        }}
                                    >
                                        Contact Developer
                                    </Button>
                                </DialogContent>
                            </>
                        )}
                    </Dialog>
                </Paper>
            </Box>
        </Box>
    );
}