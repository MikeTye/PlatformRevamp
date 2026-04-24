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
    Select,
    MenuItem,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    FormControl,
    InputLabel,
    TableSortLabel,
    Checkbox,
    ListItemText,
    Tooltip,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material/Select';
import SearchRounded from '@mui/icons-material/SearchRounded';
import CloseRounded from '@mui/icons-material/CloseRounded';
import BookmarkRounded from '@mui/icons-material/BookmarkRounded';
import BookmarkBorderRounded from '@mui/icons-material/BookmarkBorderRounded';
import ViewListRounded from '@mui/icons-material/ViewListRounded';
import GridViewRounded from '@mui/icons-material/GridViewRounded';
import VerifiedRounded from '@mui/icons-material/Verified';
import { ToggleButton, ToggleButtonGroup } from '@mui/material';

import { CompanyCard, CompanyType } from '../components/cards/CompanyCard';
import { MobileFilterSheet } from '../components/MobileFilterSheet';
import {
    COMPANY_TABS,
    type CompanyTab,
} from '../constants/companies';

import {
    CountryFlagLabel,
    resolveCountryCode,
} from '../components/common/CountryFlagLabel';

import { trackEvent, trackCompanyDirectoryRefined } from '../lib/analytics';

type SortDirection = 'asc' | 'desc';
type SortField = 'displayName' | 'country' | 'projects' | 'createdAt';

interface Company {
    id: string;
    displayName: string;
    companyRoles?: string[];
    services?: string[];
    serviceCategories?: string[];
    geographicalCoverage?: string[];
    country?: string | null;
    countryCode?: string | null;
    functionDescription?: string | null;
    websiteUrl?: string | null;
    projectsCount?: number;
    createdAt?: string;
    isMine?: boolean;
    isSaved?: boolean;
    isVerified?: boolean;
}

type FacetOption = {
    value: string;
    count: number;
};

type CompaniesResponse = {
    ok?: boolean;
    data?: Company[];
    items?: Company[];
    page?: number;
    pageSize?: number;
    total?: number;
    sortField?: SortField;
    sortDirection?: SortDirection;
    counts?: {
        all: number;
        mine: number;
        saved: number;
    };
    filters?: {
        roles: FacetOption[];
        serviceCategories: FacetOption[];
        countries: FacetOption[];
    };
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

function mapCompanyFromApi(item: any): Company {
    return {
        id: String(item.id),
        displayName: String(item.display_name ?? item.displayName ?? item.name ?? ''),
        companyRoles: Array.isArray(item.company_roles)
            ? item.company_roles
            : Array.isArray(item.companyRoles)
                ? item.companyRoles
                : Array.isArray(item.roles)
                    ? item.roles
                    : [],
        services: Array.isArray(item.services) ? item.services : [],
        serviceCategories: Array.isArray(item.service_categories)
            ? item.service_categories
            : Array.isArray(item.serviceCategories)
                ? item.serviceCategories
                : [],
        geographicalCoverage: Array.isArray(item.geographical_coverage)
            ? item.geographical_coverage
            : Array.isArray(item.geographicalCoverage)
                ? item.geographicalCoverage
                : Array.isArray(item.regions)
                    ? item.regions
                    : [],
        country:
            item.country ??
            item.primary_country ??
            item.primaryCountry ??
            item.geographical_coverage?.[0] ??
            item.geographicalCoverage?.[0] ??
            item.regions?.[0] ??
            null,
        countryCode: resolveCountryCode(
            item.country ??
            item.primary_country ??
            item.primaryCountry ??
            item.geographical_coverage?.[0] ??
            item.geographicalCoverage?.[0] ??
            item.regions?.[0] ??
            null,
            item.country_code ?? item.countryCode ?? null
        ),
        functionDescription: item.function_description ?? item.functionDescription ?? null,
        websiteUrl: item.website_url ?? item.websiteUrl ?? null,
        projectsCount:
            typeof item.projects_count === 'number'
                ? item.projects_count
                : typeof item.projectsCount === 'number'
                    ? item.projectsCount
                    : 0,
        createdAt: item.created_at ?? item.createdAt ?? '',
        isMine: Boolean(item.isMine),
        isSaved: Boolean(item.isSaved),
        isVerified: Boolean(item.isVerified),
    };
}

function buildCompaniesQuery(params: {
    scope: CompanyTab;
    q: string;
    roles: string[];
    serviceCategories: string[];
    countries: string[];
    sortField: SortField;
    sortDirection: SortDirection;
}) {
    const qs = new URLSearchParams();

    qs.set('scope', params.scope);
    if (params.q.trim()) qs.set('q', params.q.trim());

    for (const role of params.roles) qs.append('roles', role);
    for (const category of params.serviceCategories) qs.append('serviceCategories', category);
    for (const country of params.countries) qs.append('countries', country);

    qs.set('sortField', params.sortField);
    qs.set('sortDirection', params.sortDirection);
    qs.set('page', '1');
    qs.set('pageSize', '100');

    return qs.toString();
}

async function fetchCompanies(params: {
    scope: CompanyTab;
    q: string;
    roles: string[];
    serviceCategories: string[];
    countries: string[];
    sortField: SortField;
    sortDirection: SortDirection;
}): Promise<{
    items: Company[];
    counts: { all: number; mine: number; saved: number };
    filters: {
        roles: FacetOption[];
        serviceCategories: FacetOption[];
        countries: FacetOption[];
    };
    total: number;
}> {
    const query = buildCompaniesQuery(params);

    const response = await fetch(`${API_BASE_URL}/companies?${query}`, {
        method: 'GET',
        credentials: 'include',
        headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
        throw new Error(`Failed to load companies: ${response.status}`);
    }

    const payload: CompaniesResponse = await response.json();

    const rawItems = Array.isArray(payload.items)
        ? payload.items
        : Array.isArray(payload.data)
            ? payload.data
            : [];

    return {
        items: rawItems.map(mapCompanyFromApi),
        counts: payload.counts ?? { all: 0, mine: 0, saved: 0 },
        filters: payload.filters ?? {
            roles: [],
            serviceCategories: [],
            countries: [],
        },
        total: typeof payload.total === 'number' ? payload.total : rawItems.length,
    };
}

async function saveCompany(entityId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/saved-items`, {
        method: 'POST',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
        },
        body: JSON.stringify({
            entityType: 'company',
            entityId,
        }),
    });

    if (!response.ok) {
        throw new Error(`Failed to save company: ${response.status}`);
    }
}

async function removeSavedCompany(entityId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/saved-items/company/${entityId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
        throw new Error(`Failed to remove saved company: ${response.status}`);
    }
}

function getCompanyCardType(company: Company): CompanyType {
    return getDisplayType(company);
}

function getDisplayCountry(company: Company): string {
    if (company.country) return company.country;
    if (company.geographicalCoverage?.length) return company.geographicalCoverage[0];
    return '—';
}

function getDisplayType(company: Company): 'Project Developer' | 'Service Provider' {
    const roles = company.companyRoles ?? [];

    if (roles.includes('Project Developer')) {
        return 'Project Developer';
    }

    return 'Service Provider';
}

function getProjectsDisplay(company: Company): string {
    const count = company.projectsCount ?? 0;

    return getDisplayType(company) === 'Project Developer'
        ? `${count} projects`
        : `${count} projects supported`;
}

export function CompaniesList() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const [activeTab, setActiveTab] = useState<CompanyTab>('all');
    const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

    const [searchInput, setSearchInput] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    const [roleFilter, setRoleFilter] = useState<string[]>([]);
    const [serviceCategoryFilter, setServiceCategoryFilter] = useState<string[]>([]);
    const [countryFilter, setCountryFilter] = useState<string[]>([]);

    const [sortField, setSortField] = useState<SortField>('displayName');
    const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

    const [companies, setCompanies] = useState<Company[]>([]);
    const [counts, setCounts] = useState({ all: 0, mine: 0, saved: 0 });
    const [filters, setFilters] = useState<{
        roles: FacetOption[];
        serviceCategories: FacetOption[];
        countries: FacetOption[];
    }>({
        roles: [],
        serviceCategories: [],
        countries: [],
    });

    const hasTrackedDirectoryViewRef = React.useRef(false);
    const submitSearch = () => {
        const nextQuery = searchInput.trim();
        setSearchQuery(nextQuery);

        trackCompanyDirectoryRefined({
            refinementType: 'search',
            tab: activeTab,
            searchQuery: nextQuery,
            viewMode,
        });
    };

    useEffect(() => {
        if (hasTrackedDirectoryViewRef.current) return;

        trackEvent('Company directory viewed', {
            tab: activeTab,
            view_mode: viewMode,
        });

        hasTrackedDirectoryViewRef.current = true;
    }, [activeTab, viewMode]);

    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState('');

    useEffect(() => {
        const tab = searchParams.get('tab');
        if (tab === 'mine' || tab === 'saved' || tab === 'all') {
            setActiveTab(tab);
        }
    }, [searchParams]);

    useEffect(() => {
        const timer = window.setTimeout(() => {
            submitSearch();
        }, 300);

        return () => window.clearTimeout(timer);
    }, [searchInput]);

    const loadCompanies = async () => {
        setIsLoading(true);
        setLoadError('');

        try {
            const result = await fetchCompanies({
                scope: activeTab,
                q: searchQuery,
                roles: [],
                serviceCategories: serviceCategoryFilter,
                countries: countryFilter,
                sortField,
                sortDirection,
            });

            setCompanies(result.items);
            setCounts(result.counts);
            setFilters(result.filters);
        } catch (error) {
            setLoadError(error instanceof Error ? error.message : 'Failed to load companies');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        void loadCompanies();
    }, [
        activeTab,
        searchQuery,
        roleFilter,
        serviceCategoryFilter,
        countryFilter,
        sortField,
        sortDirection,
    ]);

    const handleSort = (field: SortField) => {
        const nextDirection =
            sortField === field
                ? (sortDirection === 'asc' ? 'desc' : 'asc')
                : 'asc';

        if (sortField === field) {
            setSortDirection(nextDirection);
        } else {
            setSortField(field);
            setSortDirection('asc');
        }

        trackCompanyDirectoryRefined({
            refinementType: 'sort',
            tab: activeTab,
            sortField: field,
            sortDirection: nextDirection,
            viewMode,
        });
    };

    const handleServiceCategoryFilterChange = (event: SelectChangeEvent<string[]>) => {
        const value = event.target.value;
        const nextValue = typeof value === 'string' ? value.split(',') : value;

        setServiceCategoryFilter(nextValue);

        trackCompanyDirectoryRefined({
            refinementType: 'filter',
            tab: activeTab,
            filterName: 'service_category',
            filterValues: nextValue,
            viewMode,
        });
    };

    const handleCountryFilterChange = (event: SelectChangeEvent<string[]>) => {
        const value = event.target.value;
        const nextValue = typeof value === 'string' ? value.split(',') : value;

        setCountryFilter(nextValue);

        trackCompanyDirectoryRefined({
            refinementType: 'filter',
            tab: activeTab,
            filterName: 'country',
            filterValues: nextValue,
            viewMode,
        });
    };

    const clearFilters = () => {
        setRoleFilter([]);
        setServiceCategoryFilter([]);
        setCountryFilter([]);

        trackCompanyDirectoryRefined({
            refinementType: 'clear_filters',
            tab: activeTab,
            viewMode,
        });
    };

    const toggleSave = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();

        const company = companies.find((item) => item.id === id);
        if (!company) return;

        const wasSaved = Boolean(company.isSaved);

        setCompanies((prev) =>
            prev.map((item) =>
                item.id === id ? { ...item, isSaved: !wasSaved } : item
            )
        );
        setCounts((prev) => ({
            ...prev,
            saved: Math.max(0, prev.saved + (wasSaved ? -1 : 1)),
        }));

        try {
            if (wasSaved) {
                await removeSavedCompany(id);
            } else {
                await saveCompany(id);
            }

            if (activeTab === 'saved') {
                await loadCompanies();
            }

            if (!wasSaved) {
                trackEvent('Company page bookmarked', {
                    company_id: id,
                    occurrence_point: 'company_directory',
                    tab: activeTab,
                    view_mode: viewMode,
                });
            }
        } catch (error) {
            setCompanies((prev) =>
                prev.map((item) =>
                    item.id === id ? { ...item, isSaved: wasSaved } : item
                )
            );
            setCounts((prev) => ({
                ...prev,
                saved: Math.max(0, prev.saved + (wasSaved ? 1 : -1)),
            }));
            setLoadError(
                error instanceof Error ? error.message : 'Failed to update saved company'
            );
        }
    };

    return (
        <Box minHeight="100vh" bgcolor="white" display="flex" flexDirection="column">
            <Box bgcolor="white" borderBottom={1} borderColor="grey.200" flexShrink={0}>
                <Box px={3} pt={2} pb={1}>
                    <Typography variant="h5" fontWeight="bold" color="text.primary">
                        Companies
                    </Typography>
                </Box>

                <Box px={3}>
                    <Tabs
                        value={activeTab}
                        onChange={(_, value: CompanyTab) => {
                            setActiveTab(value);
                            clearFilters();

                            trackCompanyDirectoryRefined({
                                refinementType: 'tab',
                                tab: value,
                                viewMode,
                            });
                        }}
                        textColor="primary"
                        indicatorColor="primary"
                        sx={{ minHeight: 48 }}
                    >
                        {COMPANY_TABS.map((tab) => (
                            <Tab
                                key={tab.value}
                                value={tab.value}
                                label={
                                    <Box display="flex" alignItems="center" gap={1}>
                                        {tab.label}
                                        <Chip
                                            label={counts[tab.value]}
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
                        ))}
                    </Tabs>
                </Box>
            </Box>

            <Box p={3}>
                <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
                    <Box
                        display="flex"
                        alignItems="center"
                        justifyContent="space-between"
                        px={2}
                        py={1.5}
                        borderBottom={1}
                        borderColor="grey.100"
                        flexWrap="wrap"
                        gap={2}
                    >
                        <Paper
                            component="form"
                            onSubmit={(e) => {
                                e.preventDefault();
                                submitSearch();
                            }}
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
                            <SearchRounded sx={{ ml: 1, color: 'grey.400', fontSize: 20 }} />
                            <InputBase
                                sx={{ ml: 1, flex: 1, fontSize: '0.875rem' }}
                                placeholder="Search companies..."
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                            />
                            {searchInput && (
                                <IconButton
                                    size="small"
                                    onClick={() => {
                                        setSearchInput('');
                                        setSearchQuery('');
                                    }}
                                >
                                    <CloseRounded sx={{ fontSize: 16 }} />
                                </IconButton>
                            )}
                        </Paper>

                        <Box display="flex" alignItems="center" gap={2} flexWrap="wrap">
                            <Box sx={{ display: { xs: 'block', md: 'none' } }}>
                                <MobileFilterSheet
                                    activeCount={
                                        serviceCategoryFilter.length +
                                        countryFilter.length
                                    }
                                    onClear={clearFilters}
                                >
                                    {/* <FormControl size="small" fullWidth>
            <InputLabel sx={{ fontSize: '0.875rem' }}>Company role</InputLabel>
            <Select
                multiple
                value={roleFilter}
                label="Company role"
                onChange={handleRoleFilterChange}
                renderValue={(selected) => (selected as string[]).join(', ')}
                sx={{ fontSize: '0.875rem' }}
            >
                {filters.roles.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                        <Checkbox
                            checked={roleFilter.includes(option.value)}
                            size="small"
                        />
                        <ListItemText
                            primary={option.value}
                            secondary={`${option.count} companies`}
                        />
                    </MenuItem>
                ))}
            </Select>
        </FormControl> */}

                                    <FormControl size="small" fullWidth>
                                        <InputLabel sx={{ fontSize: '0.875rem' }}>
                                            Service category
                                        </InputLabel>
                                        <Select
                                            multiple
                                            value={serviceCategoryFilter}
                                            label="Service category"
                                            onChange={handleServiceCategoryFilterChange}
                                            renderValue={(selected) => (selected as string[]).join(', ')}
                                            sx={{ fontSize: '0.875rem' }}
                                        >
                                            {filters.serviceCategories.map((option) => (
                                                <MenuItem key={option.value} value={option.value}>
                                                    <Checkbox
                                                        checked={serviceCategoryFilter.includes(option.value)}
                                                        size="small"
                                                    />
                                                    <ListItemText
                                                        primary={option.value}
                                                        secondary={`${option.count} companies`}
                                                    />
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>

                                    <FormControl size="small" fullWidth>
                                        <InputLabel sx={{ fontSize: '0.875rem' }}>Country</InputLabel>
                                        <Select
                                            multiple
                                            value={countryFilter}
                                            label="Country"
                                            onChange={handleCountryFilterChange}
                                            renderValue={(selected) => (selected as string[]).join(', ')}
                                            sx={{ fontSize: '0.875rem' }}
                                        >
                                            {filters.countries.map((option) => (
                                                <MenuItem key={option.value} value={option.value}>
                                                    <Checkbox
                                                        checked={countryFilter.includes(option.value)}
                                                        size="small"
                                                    />
                                                    <ListItemText
                                                        primary={option.value}
                                                        secondary={`${option.count} companies`}
                                                    />
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
                                    flexWrap: 'wrap',
                                }}
                            >
                                {/* <FormControl size="small" sx={{ minWidth: 220 }}>
        <InputLabel sx={{ fontSize: '0.875rem' }}>Company role</InputLabel>
        <Select
            multiple
            value={roleFilter}
            label="Company role"
            onChange={handleRoleFilterChange}
            renderValue={(selected) => (selected as string[]).join(', ')}
            sx={{ fontSize: '0.875rem' }}
        >
            {filters.roles.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                    <Checkbox
                        checked={roleFilter.includes(option.value)}
                        size="small"
                    />
                    <ListItemText
                        primary={option.value}
                        secondary={`${option.count} companies`}
                    />
                </MenuItem>
            ))}
        </Select>
    </FormControl> */}

                                <FormControl size="small" sx={{ minWidth: 220 }}>
                                    <InputLabel sx={{ fontSize: '0.875rem' }}>
                                        Service category
                                    </InputLabel>
                                    <Select
                                        multiple
                                        value={serviceCategoryFilter}
                                        label="Service category"
                                        onChange={handleServiceCategoryFilterChange}
                                        renderValue={(selected) => (selected as string[]).join(', ')}
                                        sx={{ fontSize: '0.875rem' }}
                                    >
                                        {filters.serviceCategories.map((option) => (
                                            <MenuItem key={option.value} value={option.value}>
                                                <Checkbox
                                                    checked={serviceCategoryFilter.includes(option.value)}
                                                    size="small"
                                                />
                                                <ListItemText
                                                    primary={option.value}
                                                    secondary={`${option.count} companies`}
                                                />
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>

                                <FormControl size="small" sx={{ minWidth: 220 }}>
                                    <InputLabel sx={{ fontSize: '0.875rem' }}>Country</InputLabel>
                                    <Select
                                        multiple
                                        value={countryFilter}
                                        label="Country"
                                        onChange={handleCountryFilterChange}
                                        renderValue={(selected) => (selected as string[]).join(', ')}
                                        sx={{ fontSize: '0.875rem' }}
                                    >
                                        {filters.countries.map((option) => (
                                            <MenuItem key={option.value} value={option.value}>
                                                <Checkbox
                                                    checked={countryFilter.includes(option.value)}
                                                    size="small"
                                                />
                                                <ListItemText
                                                    primary={option.value}
                                                    secondary={`${option.count} companies`}
                                                />
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>

                                {(serviceCategoryFilter.length > 0 || countryFilter.length > 0) && (
                                    <Button
                                        size="small"
                                        onClick={clearFilters}
                                        sx={{ textTransform: 'none', color: 'text.secondary' }}
                                    >
                                        Clear
                                    </Button>
                                )}
                            </Box>
                        </Box>

                        <ToggleButtonGroup
                            value={viewMode}
                            exclusive
                            onChange={(_, value) => {
                                if (!value) return;

                                setViewMode(value);

                                trackCompanyDirectoryRefined({
                                    refinementType: 'view_mode',
                                    tab: activeTab,
                                    viewMode: value,
                                });
                            }}
                            size="small"
                        >
                            <ToggleButton value="table" aria-label="table view">
                                <ViewListRounded sx={{ fontSize: 18 }} />
                            </ToggleButton>
                            <ToggleButton value="grid" aria-label="grid view">
                                <GridViewRounded sx={{ fontSize: 18 }} />
                            </ToggleButton>
                        </ToggleButtonGroup>
                    </Box>

                    {loadError && (
                        <Box px={2} py={1.5} borderBottom={1} borderColor="grey.100">
                            <Typography variant="body2" color="error">
                                {loadError}
                            </Typography>
                        </Box>
                    )}

                    {viewMode === 'table' ? (
                        <TableContainer>
                            <Table>
                                <TableHead sx={{ bgcolor: 'grey.50' }}>
                                    <TableRow>
                                        <TableCell
                                            sx={{
                                                fontWeight: 600,
                                                color: 'text.secondary',
                                                bgcolor: 'white',
                                                borderBottom: '1px solid #e5e7eb',
                                            }}
                                        >
                                            <TableSortLabel
                                                active={sortField === 'displayName'}
                                                direction={sortField === 'displayName' ? sortDirection : 'asc'}
                                                onClick={() => handleSort('displayName')}
                                            >
                                                Company
                                            </TableSortLabel>
                                        </TableCell>

                                        <TableCell
                                            sx={{
                                                fontWeight: 600,
                                                color: 'text.secondary',
                                                bgcolor: 'white',
                                                borderBottom: '1px solid #e5e7eb',
                                            }}
                                        >
                                            Type
                                        </TableCell>

                                        <TableCell
                                            sx={{
                                                fontWeight: 600,
                                                color: 'text.secondary',
                                                bgcolor: 'white',
                                                borderBottom: '1px solid #e5e7eb',
                                            }}
                                        >
                                            <TableSortLabel
                                                active={sortField === 'country'}
                                                direction={sortField === 'country' ? sortDirection : 'asc'}
                                                onClick={() => handleSort('country')}
                                            >
                                                Country
                                            </TableSortLabel>
                                        </TableCell>

                                        <TableCell
                                            sx={{
                                                fontWeight: 600,
                                                color: 'text.secondary',
                                                bgcolor: 'white',
                                                borderBottom: '1px solid #e5e7eb',
                                            }}
                                        >
                                            <TableSortLabel
                                                active={sortField === 'projects'}
                                                direction={sortField === 'projects' ? sortDirection : 'asc'}
                                                onClick={() => handleSort('projects')}
                                            >
                                                Projects
                                            </TableSortLabel>
                                        </TableCell>

                                        <TableCell
                                            width={40}
                                            sx={{
                                                bgcolor: 'white',
                                                borderBottom: '1px solid #e5e7eb',
                                            }}
                                        />
                                    </TableRow>
                                </TableHead>

                                <TableBody>
                                    {isLoading ? (
                                        <TableRow>
                                            <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                                                Loading companies...
                                            </TableCell>
                                        </TableRow>
                                    ) : companies.length === 0 ? (
                                        <TableRow>
                                            <TableCell
                                                colSpan={5}
                                                align="center"
                                                sx={{ py: 6, color: 'text.disabled' }}
                                            >
                                                {activeTab === 'saved'
                                                    ? 'No saved companies'
                                                    : activeTab === 'mine'
                                                        ? 'No companies yet'
                                                        : 'No companies found'}
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        companies.map((company) => (
                                            <TableRow
                                                key={company.id}
                                                hover
                                                onClick={() => {
                                                    trackEvent('Company page viewed', {
                                                        company_id: company.id,
                                                        company_name: company.displayName,
                                                        is_own_company: Boolean(company.isMine),
                                                        entry_point: 'company_directory',
                                                    });
                                                    if (company.isMine) {
                                                        navigate(`/my-company/${company.id}?from=companies`);
                                                    } else {
                                                        navigate(`/companies/${company.id}`);
                                                    }
                                                }}
                                                sx={{ cursor: 'pointer' }}
                                            >
                                                <TableCell>
                                                    <Box display="flex" alignItems="center" gap={1.5}>
                                                        {/* <Box
                                                            sx={{
                                                                width: 32,
                                                                height: 32,
                                                                borderRadius: 1,
                                                                flexShrink: 0,
                                                                overflow: 'hidden',
                                                                bgcolor: 'grey.100',
                                                                border: '1px solid',
                                                                borderColor: 'grey.200',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                            }}
                                                        >
                                                            {company.logoUrl ? (
                                                                <Box
                                                                    component="img"
                                                                    src={company.logoUrl}
                                                                    alt={company.legalName}
                                                                    sx={{
                                                                        width: '100%',
                                                                        height: '100%',
                                                                        objectFit: 'cover',
                                                                    }}
                                                                />
                                                            ) : (
                                                                <Typography
                                                                    variant="caption"
                                                                    fontWeight="bold"
                                                                    color="grey.500"
                                                                    sx={{
                                                                        fontSize: '0.625rem',
                                                                        userSelect: 'none',
                                                                    }}
                                                                >
                                                                    {company.displayName.substring(0, 2).toUpperCase()}
                                                                </Typography>
                                                            )}
                                                        </Box> */}

                                                        <Box>
                                                            <Box display="flex" alignItems="center" gap={1}>
                                                                <Typography
                                                                    variant="subtitle2"
                                                                    fontWeight="bold"
                                                                    color="text.primary"
                                                                >
                                                                    {company.displayName}
                                                                </Typography>

                                                                {company.isVerified && (
                                                                    <Tooltip title="Verified" arrow placement="top">
                                                                        <VerifiedRounded
                                                                            sx={{
                                                                                fontSize: 16,
                                                                                color: '#1d9bf0',
                                                                                cursor: 'help',
                                                                            }}
                                                                        />
                                                                    </Tooltip>
                                                                )}

                                                                {company.isMine && (
                                                                    <Chip
                                                                        label="My Company"
                                                                        size="small"
                                                                        color="primary"
                                                                        sx={{
                                                                            height: 18,
                                                                            fontSize: '0.625rem',
                                                                            '& .MuiChip-label': { px: 1 },
                                                                        }}
                                                                    />
                                                                )}
                                                            </Box>

                                                            <Typography
                                                                variant="caption"
                                                                color="text.secondary"
                                                                noWrap
                                                                sx={{ maxWidth: 250, display: 'block' }}
                                                            >
                                                                {company.functionDescription || '—'}
                                                            </Typography>
                                                        </Box>
                                                    </Box>
                                                </TableCell>

                                                <TableCell>
                                                    {company.serviceCategories?.length ? (
                                                        <Box display="flex" gap={0.5} flexWrap="wrap">
                                                            {company.serviceCategories.slice(0, 2).map((category) => (
                                                                <Chip
                                                                    key={category}
                                                                    label={category}
                                                                    size="small"
                                                                    sx={{
                                                                        height: 20,
                                                                        fontSize: '0.625rem',
                                                                        bgcolor: 'grey.100',
                                                                        color: 'grey.700',
                                                                        fontWeight: 500,
                                                                    }}
                                                                />
                                                            ))}
                                                            {company.serviceCategories.length > 2 && (
                                                                <Chip
                                                                    label={`+${company.serviceCategories.length - 2}`}
                                                                    size="small"
                                                                    sx={{
                                                                        height: 20,
                                                                        fontSize: '0.625rem',
                                                                        bgcolor: 'grey.50',
                                                                        color: 'grey.700',
                                                                        fontWeight: 500,
                                                                    }}
                                                                />
                                                            )}
                                                        </Box>
                                                    ) : (
                                                        <Typography variant="caption" color="text.disabled">
                                                            —
                                                        </Typography>
                                                    )}
                                                </TableCell>

                                                <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                                                    <CountryFlagLabel
                                                        country={getDisplayCountry(company)}
                                                        code={company.countryCode}
                                                        size="md"
                                                        textVariant="body2"
                                                        color="text.primary"
                                                        gap={1}
                                                    />
                                                </TableCell>

                                                <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {getProjectsDisplay(company)}
                                                    </Typography>
                                                </TableCell>

                                                <TableCell>
                                                    <IconButton
                                                        size="small"
                                                        onClick={(e) => void toggleSave(company.id, e)}
                                                        sx={{
                                                            color: company.isSaved
                                                                ? 'primary.main'
                                                                : 'grey.300',
                                                        }}
                                                    >
                                                        {company.isSaved ? (
                                                            <BookmarkRounded sx={{ fontSize: 18 }} />
                                                        ) : (
                                                            <BookmarkBorderRounded sx={{ fontSize: 18 }} />
                                                        )}
                                                    </IconButton>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    ) : (
                        <Box p={2}>
                            {isLoading ? (
                                <Box py={6} textAlign="center" color="text.secondary">
                                    Loading companies...
                                </Box>
                            ) : companies.length === 0 ? (
                                <Box py={6} textAlign="center" color="text.disabled">
                                    {activeTab === 'saved'
                                        ? 'No saved companies'
                                        : activeTab === 'mine'
                                            ? 'No companies yet'
                                            : 'No companies found'}
                                </Box>
                            ) : (
                                <Box
                                    sx={{
                                        display: 'grid',
                                        gridTemplateColumns: {
                                            xs: '1fr',
                                            md: 'repeat(2, 1fr)',
                                            lg: 'repeat(3, 1fr)',
                                        },
                                        gap: 2,
                                    }}
                                >
                                    {companies.map((company) => (
                                        <CompanyCard
                                            key={company.id}
                                            id={company.id}
                                            name={company.displayName}
                                            type={getCompanyCardType(company)}
                                            description={company.functionDescription ?? ''}
                                            country={getDisplayCountry(company)}
                                            countryCode={company.countryCode ?? ''}
                                            logoUrl={undefined}
                                            founded={
                                                company.createdAt
                                                    ? new Date(company.createdAt).getFullYear().toString()
                                                    : undefined
                                            }
                                            isSaved={Boolean(company.isSaved)}
                                            isMine={company.isMine}
                                            isVerified={company.isVerified}
                                            projectsCount={company.projectsCount}
                                            servicesCount={company.serviceCategories?.length}
                                            serviceTypes={company.serviceCategories}
                                            certifications={[]}
                                            onClick={() => {
                                                trackEvent('Company page viewed', {
                                                    company_id: company.id,
                                                    company_name: company.displayName,
                                                    is_own_company: Boolean(company.isMine),
                                                    entry_point: 'company_directory',
                                                });
                                                if (company.isMine) {
                                                    navigate(`/my-company/${company.id}?from=companies`);
                                                } else {
                                                    navigate(`/companies/${company.id}`);
                                                }
                                            }}
                                            onToggleSave={(e) => void toggleSave(company.id, e)}
                                        />
                                    ))}
                                </Box>
                            )}
                        </Box>
                    )}

                    {!isLoading && companies.length > 0 && (
                        <Box
                            borderTop={1}
                            borderColor="grey.100"
                            px={2}
                            py={1.5}
                            display="flex"
                            alignItems="center"
                            justifyContent="space-between"
                        >
                            <Typography variant="caption" color="text.secondary">
                                Showing {companies.length} companies
                            </Typography>
                        </Box>
                    )}
                </Paper>
            </Box>
        </Box>
    );
}