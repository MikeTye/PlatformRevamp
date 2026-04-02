import React, { useEffect, useMemo, useState } from 'react';
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
    CircularProgress
} from '@mui/material';
import SearchRounded from '@mui/icons-material/SearchRounded';
import CloseRounded from '@mui/icons-material/CloseRounded';
import {
    OpportunityCard,
    OpportunityType
} from '../components/cards/OpportunityCard';
import { ProjectStage } from '../components/ProjectStageIndicator';
import { MobileFilterSheet } from '../components/MobileFilterSheet';
import countryCodes from '../data/countrycode.json';

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

type CountryCodeEntry = {
    country: string;
    code: string;
    iso: string;
};

type BackendOpportunityListItem = {
    id: string;
    projectId: string;
    projectName: string;
    type: string;
    description: string | null;
    urgent: boolean;
    createdAt: string;
};

type BackendListProjectOpportunitiesResponse = {
    items: BackendOpportunityListItem[];
};

const COUNTRY_CODE_MAP = new Map(
    (countryCodes as CountryCodeEntry[]).map((item) => [
        item.country.trim().toLowerCase(),
        item.iso.trim().toUpperCase()
    ])
);

function toCountryCode(country: string | null | undefined, fallback?: string | null) {
    if (fallback && fallback.trim()) return fallback.trim().toUpperCase();
    if (!country) return '';
    return COUNTRY_CODE_MAP.get(country.trim().toLowerCase()) ?? country.slice(0, 2).toUpperCase();
}

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
        countryCode: toCountryCode(
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
                        if (!type) return null;

                        return {
                            id: item.id,
                            projectId: item.projectId,
                            type,
                            description:
                                item.description?.trim() ||
                                buildFallbackDescription(type, item.projectName),
                            projectName: item.projectName,
                            projectUpid: '',
                            developer: '',
                            stage: 'Exploration' as ProjectStage,
                            country: '',
                            countryCode: '',
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
    }, [debouncedSearch, typeFilter, stageFilter, countryFilter, savedOpportunityIds]);

    const handleToggleSave = async (opportunity: Opportunity, e: React.MouseEvent) => {
        e.stopPropagation();

        if (savingIds.has(opportunity.id)) return;

        setSavingIds((prev) => new Set(prev).add(opportunity.id));

        const wasSaved = savedOpportunityIds.has(opportunity.id);

        try {
            if (wasSaved) {
                await apiDelete(`/saved-items/opportunity/${opportunity.id}`);

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

    const isPageLoading = loading || loadingSaved;

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
                                onClear={() => {
                                    setSearchQuery('');
                                    setTypeFilter([]);
                                    setStageFilter([]);
                                    setCountryFilter([]);
                                }}
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
                                    onClick={() => {
                                        setSearchQuery('');
                                        setTypeFilter([]);
                                        setStageFilter([]);
                                        setCountryFilter([]);
                                    }}
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
                                            onToggleSave={(e) => handleToggleSave(opp, e)}
                                            onProjectClick={(e) => {
                                                e.stopPropagation();
                                                navigate(`/projects/${opp.projectId}`);
                                            }}
                                            onContactClick={(e) => {
                                                e.stopPropagation();
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
                </Paper>
            </Box>
        </Box>
    );
}