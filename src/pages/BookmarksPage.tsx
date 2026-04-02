import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Tabs, Tab, Chip, Stack, CircularProgress } from '@mui/material';
import BookmarkBorderRoundedIcon from '@mui/icons-material/BookmarkBorderRounded';
import FolderRoundedIcon from '@mui/icons-material/FolderRounded';
import BusinessRoundedIcon from '@mui/icons-material/BusinessRounded';
import ShowChartRoundedIcon from '@mui/icons-material/ShowChartRounded';

import { ProjectCard } from '../components/cards/ProjectCard';
import type { ProjectStage } from '../components/ProjectStageIndicator';
import type { FreshnessStatus } from '../components/ReportingFreshness';
import { CompanyCard, type CompanyType } from '../components/cards/CompanyCard';
import { OpportunityCard, type OpportunityType } from '../components/cards/OpportunityCard';

type SavedProjectItem = {
    entityType: 'project';
    savedAt: string;
    project: {
        id: string;
        upid?: string | null;
        name: string;
        developer: string;
        description?: string | null;
        stage: ProjectStage;
        type: string;
        country?: string | null;
        countryCode?: string | null;
        hectares?: number | null;
        expectedCredits?: string | null;
        freshness?: FreshnessStatus;
        verifiedFields?: number;
        totalFields?: number;
        photoUrl?: string | null;
        isMine?: boolean;
    };
};

type SavedCompanyItem = {
    entityType: 'company';
    savedAt: string;
    company: {
        id: string;
        name: string;
        type: CompanyType;
        description: string;
        country: string;
        countryCode: string;
        logoUrl?: string;
        isMine?: boolean;
        isVerified?: boolean;
        projectsCount?: number;
        servicesCount?: number;
        serviceTypes?: string[];
        certifications?: string[];
    };
};

type SavedOpportunityItem = {
    entityType: 'opportunity';
    savedAt: string;
    opportunity: {
        id: string;
        type: OpportunityType;
        description: string;
        projectName: string;
        projectUpid: string;
        developer: string;
        stage: ProjectStage;
        country: string;
        countryCode: string;
        urgent: boolean;
    };
};

type SavedItemsResponse = {
    ok: boolean;
    data: {
        projects: SavedProjectItem[];
        companies: SavedCompanyItem[];
        opportunities: SavedOpportunityItem[];
    };
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

async function fetchSavedItems(signal?: AbortSignal): Promise<SavedItemsResponse['data']> {
    const response = await fetch(`${API_BASE_URL}/saved-items`, {
        method: 'GET',
        credentials: 'include',
        signal,
    });

    if (!response.ok) {
        throw new Error(`Failed to load saved items (${response.status})`);
    }

    const json = (await response.json()) as SavedItemsResponse;

    if (!json.ok) {
        throw new Error('Failed to load saved items');
    }

    return json.data;
}

async function removeSavedItem(entityType: 'project' | 'company' | 'opportunity', entityId: string) {
    const response = await fetch(`${API_BASE_URL}/saved-items/${entityType}/${entityId}`, {
        method: 'DELETE',
        credentials: 'include',
    });

    if (!response.ok) {
        throw new Error(`Failed to remove saved item (${response.status})`);
    }
}

export function BookmarksPage() {
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState<'all' | 'projects' | 'companies' | 'opportunities'>('all');
    const [projects, setProjects] = useState<SavedProjectItem[]>([]);
    const [companies, setCompanies] = useState<SavedCompanyItem[]>([]);
    const [opportunities, setOpportunities] = useState<SavedOpportunityItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);

    const [fadingItems, setFadingItems] = useState<Set<string>>(new Set());
    const removalTimersRef = useRef<Map<string, number>>(new Map());

    const loadData = useCallback(async () => {
        setLoading(true);
        setLoadError(null);

        try {
            const controller = new AbortController();
            const data = await fetchSavedItems(controller.signal);

            setProjects(data.projects ?? []);
            setCompanies(data.companies ?? []);
            setOpportunities(data.opportunities ?? []);
        } catch (err) {
            setLoadError(err instanceof Error ? err.message : 'Failed to load saved items');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    useEffect(() => {
        return () => {
            removalTimersRef.current.forEach((timerId) => window.clearTimeout(timerId));
            removalTimersRef.current.clear();
        };
    }, []);

    const totalCount = projects.length + companies.length + opportunities.length;

    const beginRemove = useCallback(
        (
            key: string,
            entityType: 'project' | 'company' | 'opportunity',
            entityId: string,
            localRemove: () => void
        ) => {
            if (fadingItems.has(key)) {
                return;
            }

            setFadingItems((prev) => new Set(prev).add(key));

            const timerId = window.setTimeout(async () => {
                try {
                    if (entityType === 'opportunity') {
                        localRemove();
                        return;
                    }

                    await removeSavedItem(entityType, entityId);
                    localRemove();
                } catch (err) {
                    setFadingItems((prev) => {
                        const next = new Set(prev);
                        next.delete(key);
                        return next;
                    });
                } finally {
                    removalTimersRef.current.delete(key);
                }
            }, 350);

            removalTimersRef.current.set(key, timerId);
        },
        [fadingItems]
    );

    const allEmpty = useMemo(
        () => projects.length === 0 && companies.length === 0 && opportunities.length === 0,
        [projects.length, companies.length, opportunities.length]
    );

    const renderProjects = () => (
        <Box
            display="grid"
            gridTemplateColumns={{ xs: '1fr', md: '1fr 1fr' }}
            gap={2}
        >
            {projects.map((item) => {
                const project = item.project;
                const key = `project:${project.id}`;

                return (
                    <Box
                        key={key}
                        sx={{
                            opacity: fadingItems.has(key) ? 0.4 : 1,
                            transition: 'opacity 0.25s ease',
                        }}
                    >
                        <ProjectCard
                            upid={project.upid}
                            name={project.name}
                            developer={project.developer}
                            description={project.description}
                            stage={project.stage}
                            type={project.type}
                            country={project.country ?? null}
                            countryCode={project.countryCode ?? null}
                            hectares={project.hectares ?? null}
                            expectedCredits={project.expectedCredits ?? null}
                            freshness={project.freshness}
                            verifiedFields={project.verifiedFields}
                            totalFields={project.totalFields}
                            photoUrl={project.photoUrl ?? null}
                            isMine={project.isMine ?? false}
                            isSaved={!fadingItems.has(key)}
                            onClick={() => navigate(`/projects/${project.upid ?? project.id}`)}
                            onToggleSave={() =>
                                beginRemove(key, 'project', project.id, () => {
                                    setProjects((prev) => prev.filter((p) => p.project.id !== project.id));
                                })
                            }
                        />
                    </Box>
                );
            })}
        </Box>
    );

    const renderCompanies = () => (
        <Box
            display="grid"
            gridTemplateColumns={{ xs: '1fr', md: '1fr 1fr' }}
            gap={2}
        >
            {companies.map((item) => {
                const company = item.company;
                const key = `company:${company.id}`;

                return (
                    <Box
                        key={key}
                        sx={{
                            opacity: fadingItems.has(key) ? 0.4 : 1,
                            transition: 'opacity 0.25s ease',
                        }}
                    >
                        <CompanyCard
                            id={company.id}
                            name={company.name}
                            type={company.type}
                            description={company.description}
                            country={company.country}
                            countryCode={company.countryCode}
                            logoUrl={company.logoUrl}
                            isSaved={!fadingItems.has(key)}
                            isMine={company.isMine ?? false}
                            isVerified={company.isVerified ?? false}
                            projectsCount={company.projectsCount ?? 0}
                            servicesCount={company.servicesCount ?? 0}
                            serviceTypes={company.serviceTypes ?? []}
                            certifications={company.certifications ?? []}
                            onClick={() => navigate(`/companies/${company.id}`)}
                            onToggleSave={() =>
                                beginRemove(key, 'company', company.id, () => {
                                    setCompanies((prev) => prev.filter((c) => c.company.id !== company.id));
                                })
                            }
                        />
                    </Box>
                );
            })}
        </Box>
    );

    const renderOpportunities = () => (
        <Box
            display="grid"
            gridTemplateColumns={{ xs: '1fr', md: '1fr 1fr' }}
            gap={2}
        >
            {opportunities.map((item) => {
                const opp = item.opportunity;
                const key = `opportunity:${opp.id}`;

                return (
                    <Box
                        key={key}
                        sx={{
                            opacity: fadingItems.has(key) ? 0.4 : 1,
                            transition: 'opacity 0.25s ease',
                        }}
                    >
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
                            isSaved={!fadingItems.has(key)}
                            onClick={() => navigate(`/projects/${opp.projectUpid}`)}
                            onToggleSave={() =>
                                beginRemove(key, 'opportunity', opp.id, () => {
                                    setOpportunities((prev) => prev.filter((o) => o.opportunity.id !== opp.id));
                                })
                            }
                            onProjectClick={(e) => {
                                e.stopPropagation();
                                navigate(`/projects/${opp.projectUpid}`);
                            }}
                            onContactClick={(e) => {
                                e.stopPropagation();
                            }}
                        />
                    </Box>
                );
            })}
        </Box>
    );

    return (
        <Box minHeight="100vh" bgcolor="white" display="flex" flexDirection="column">
            <Box bgcolor="white" borderBottom={1} borderColor="grey.200" flexShrink={0}>
                <Box px={3} pt={2} pb={1} display="flex" alignItems="center" gap={1.5}>
                    <Typography variant="h5" fontWeight="bold" color="text.primary">
                        Bookmarks
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
                        <Tab value="all" label={`All Items (${totalCount})`} sx={{ textTransform: 'none', fontWeight: 500, minHeight: 48 }} />
                        <Tab value="projects" label={`Projects (${projects.length})`} sx={{ textTransform: 'none', fontWeight: 500, minHeight: 48 }} />
                        <Tab value="companies" label={`Companies (${companies.length})`} sx={{ textTransform: 'none', fontWeight: 500, minHeight: 48 }} />
                        <Tab value="opportunities" label={`Opportunities (${opportunities.length})`} sx={{ textTransform: 'none', fontWeight: 500, minHeight: 48 }} />
                    </Tabs>
                </Box>
            </Box>

            <Box p={3} flexGrow={1} bgcolor="grey.50">
                {loading ? (
                    <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" py={10} gap={2}>
                        <CircularProgress size={28} />
                        <Typography variant="body2" color="text.secondary">
                            Loading bookmarks...
                        </Typography>
                    </Box>
                ) : loadError ? (
                    <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" py={10}>
                        <Typography variant="h6" fontWeight="bold" color="text.primary" mb={1}>
                            Failed to load bookmarks
                        </Typography>
                        <Typography variant="body2" color="text.secondary" textAlign="center" maxWidth={420}>
                            {loadError}
                        </Typography>
                    </Box>
                ) : allEmpty ? (
                    <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" py={10}>
                        <BookmarkBorderRoundedIcon sx={{ fontSize: 48, color: 'grey.300', mb: 2 }} />
                        <Typography variant="h6" fontWeight="bold" color="text.primary" mb={1}>
                            No bookmarks yet
                        </Typography>
                        <Typography variant="body2" color="text.secondary" textAlign="center" maxWidth={360}>
                            Save projects, companies, and opportunities you&apos;re interested in. They&apos;ll appear here for easy access.
                        </Typography>
                    </Box>
                ) : (
                    <Stack spacing={4}>
                        {(activeTab === 'all' || activeTab === 'projects') && (
                            <>
                                {projects.length > 0 ? (
                                    <Box>
                                        {activeTab === 'all' && (
                                            <Box display="flex" alignItems="center" gap={1} mb={2}>
                                                <FolderRoundedIcon color="action" />
                                                <Typography variant="h6" fontWeight="bold">
                                                    Projects
                                                </Typography>
                                            </Box>
                                        )}
                                        {renderProjects()}
                                    </Box>
                                ) : activeTab !== 'all' ? (
                                    <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" py={8}>
                                        <FolderRoundedIcon sx={{ fontSize: 40, color: 'grey.300', mb: 1.5 }} />
                                        <Typography variant="subtitle1" fontWeight="bold" color="text.primary" mb={0.5}>
                                            No saved projects
                                        </Typography>
                                    </Box>
                                ) : null}
                            </>
                        )}

                        {(activeTab === 'all' || activeTab === 'companies') && (
                            <>
                                {companies.length > 0 ? (
                                    <Box>
                                        {activeTab === 'all' && (
                                            <Box display="flex" alignItems="center" gap={1} mb={2}>
                                                <BusinessRoundedIcon color="action" />
                                                <Typography variant="h6" fontWeight="bold">
                                                    Companies
                                                </Typography>
                                            </Box>
                                        )}
                                        {renderCompanies()}
                                    </Box>
                                ) : activeTab !== 'all' ? (
                                    <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" py={8}>
                                        <BusinessRoundedIcon sx={{ fontSize: 40, color: 'grey.300', mb: 1.5 }} />
                                        <Typography variant="subtitle1" fontWeight="bold" color="text.primary" mb={0.5}>
                                            No saved companies
                                        </Typography>
                                    </Box>
                                ) : null}
                            </>
                        )}

                        {(activeTab === 'all' || activeTab === 'opportunities') && (
                            <>
                                {opportunities.length > 0 ? (
                                    <Box>
                                        {activeTab === 'all' && (
                                            <Box display="flex" alignItems="center" gap={1} mb={2}>
                                                <ShowChartRoundedIcon color="action" />
                                                <Typography variant="h6" fontWeight="bold">
                                                    Opportunities
                                                </Typography>
                                            </Box>
                                        )}
                                        {renderOpportunities()}
                                    </Box>
                                ) : activeTab !== 'all' ? (
                                    <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" py={8}>
                                        <ShowChartRoundedIcon sx={{ fontSize: 40, color: 'grey.300', mb: 1.5 }} />
                                        <Typography variant="subtitle1" fontWeight="bold" color="text.primary" mb={0.5}>
                                            No saved opportunities
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary" textAlign="center" maxWidth={360}>
                                            Bookmark opportunities you'd like to track. They'll show up here.
                                        </Typography>
                                    </Box>
                                ) : null}
                            </>
                        )}
                    </Stack>
                )}
            </Box>
        </Box>
    );
}