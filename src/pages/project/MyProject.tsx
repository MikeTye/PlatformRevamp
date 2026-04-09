import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
    Alert,
    Box,
    CircularProgress,
    ListItemIcon,
    ListItemText,
    Menu,
    MenuItem,
    Stack,
    Typography,
} from '@mui/material';
import EditRounded from '@mui/icons-material/EditRounded';
import DeleteRounded from '@mui/icons-material/DeleteRounded';
import ProjectProfileView from './ProjectProfileView';
import ProjectSidebarEditor, { SaveProjectPatch } from './ProjectSidebarEditor/ProjectSidebarEditor';
import {
    ProjectProfileData,
    ProjectRole,
    ProjectSectionKey,
    ProjectEditorTarget,
    ProjectAccess,
    ProjectMediaItem,
    ProjectOpportunity,
    ProjectUpdate,
    ProjectDocument,
} from './projectProfile.types'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

type ProjectApiResponse = Omit<ProjectProfileData, 'documents' | 'media'> & {
    documents?: ProjectProfileData['documents'];
    media?: ProjectProfileData['media'];
    myRole?: ProjectRole | null;
    saved?: boolean;
};

export function MyProject() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    const focusSection = searchParams.get('section');
    const highlightedUpdateId = searchParams.get('highlightUpdate');

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [project, setProject] = useState<ProjectProfileData | null>(null);
    const [myRole, setMyRole] = useState<ProjectRole | null>(null);
    const [isSaved, setIsSaved] = useState(false);

    const [editorOpen, setEditorOpen] = useState(false);
    const [activeSection, setActiveSection] = useState<ProjectEditorTarget | null>(null);

    const [mediaMenuAnchor, setMediaMenuAnchor] = useState<{
        el: HTMLElement;
        media: ProjectMediaItem;
        index: number;
    } | null>(null);

    const [opportunityMenuAnchor, setOpportunityMenuAnchor] = useState<{
        el: HTMLElement;
        item: ProjectOpportunity;
        index: number;
    } | null>(null);

    const [updateMenuAnchor, setUpdateMenuAnchor] = useState<{
        el: HTMLElement;
        item: ProjectUpdate;
        index: number;
    } | null>(null);

    const [documentMenuAnchor, setDocumentMenuAnchor] = useState<{
        el: HTMLElement;
        item: ProjectDocument;
        index: number;
    } | null>(null);

    const [initialMediaId, setInitialMediaId] = useState<string | null>(null);
    const [initialOpportunityId, setInitialOpportunityId] = useState<string | null>(null);
    const [initialUpdateId, setInitialUpdateId] = useState<string | null>(null);
    const [initialDocumentId, setInitialDocumentId] = useState<string | null>(null);

    const canEdit = myRole === 'creator';

    const contextualMenuPaperSx = {
        minWidth: 160,
        boxShadow: 3,
    } as const;

    const contextualMenuItemSx = {
        '& .MuiListItemIcon-root': {
            minWidth: 28,
        },
    } as const;

    const access: ProjectAccess = useMemo(
        () => ({
            isProjectMember: Boolean(myRole),
            projectRole: myRole,
            canViewPrivateSections: myRole === 'creator' || myRole === 'viewer',
        }),
        [myRole],
    );

    const handleBack = useCallback(() => {
        if (window.history.length > 1) {
            navigate(-1);
            return;
        }

        navigate('/projects?tab=my', { replace: true });
    }, [navigate]);

    const handleOpenMediaEditor = useCallback(
        (mediaId?: string | null) => {
            if (!canEdit) return;
            setInitialMediaId(mediaId ?? null);
            setActiveSection('media');
            setEditorOpen(true);
        },
        [canEdit],
    );

    const handleSectionVisibilityChange = useCallback(
        async (section: ProjectSectionKey, visibility: 'public' | 'private') => {
            if (!project) return;

            const previous = project.sectionVisibility ?? {};
            const nextSectionVisibility = {
                ...previous,
                [section]: visibility,
            };

            setProject((prev) =>
                prev
                    ? {
                        ...prev,
                        sectionVisibility: nextSectionVisibility,
                    }
                    : prev
            );

            try {
                const res = await fetch(`${API_BASE_URL}/projects/${project.id}`, {
                    method: 'PATCH',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        sectionVisibility: {
                            [section]: visibility,
                        },
                    }),
                });

                if (!res.ok) {
                    throw new Error(`Failed to update section visibility (${res.status})`);
                }
            } catch (err) {
                setProject((prev) =>
                    prev
                        ? {
                            ...prev,
                            sectionVisibility: previous,
                        }
                        : prev
                );
                setError(
                    err instanceof Error
                        ? err.message
                        : 'Failed to update section visibility.'
                );
            }
        },
        [project]
    );

    const handleOpenEditor = useCallback(
        (section: ProjectEditorTarget, itemId?: string | null) => {
            if (!canEdit) return;

            setInitialMediaId(null);
            setInitialOpportunityId(null);
            setInitialUpdateId(null);
            setInitialDocumentId(null);

            if (section === 'media') {
                setInitialMediaId(itemId ?? null);
            }

            if (section === 'opportunities') {
                setInitialOpportunityId(itemId ?? null);
            }

            if (section === 'updates') {
                setInitialUpdateId(itemId ?? null);
            }

            if (section === 'documents') {
                setInitialDocumentId(itemId ?? null);
            }

            setActiveSection(section);
            setEditorOpen(true);
        },
        [canEdit],
    );

    const handleSectionFocusHandled = useCallback(() => {
        if (!focusSection && !highlightedUpdateId) return;

        const next = new URLSearchParams(searchParams);
        next.delete('section');
        next.delete('highlightUpdate');
        setSearchParams(next, { replace: true });
    }, [focusSection, highlightedUpdateId, searchParams, setSearchParams]);

    function mapProjectApiResponse(json: ProjectApiResponse): ProjectProfileData {
        return {
            id: json.id,
            upid: json.upid ?? null,
            name: json.name,
            stage: json.stage,
            type: json.type ?? null,
            description: json.description ?? null,
            companyName: json.companyName ?? null,
            country: json.country ?? null,
            region: json.region ?? null,
            coverImageUrl: json.coverImageUrl ?? null,
            projectVisibility: json.projectVisibility ?? null,
            storyProblem: json.storyProblem ?? null,
            storyApproach: json.storyApproach ?? null,
            methodology: json.methodology ?? null,
            registrationPlatform: json.registrationPlatform ?? null,
            registryStatus: json.registryStatus ?? null,
            registryProjectUrl: json.registryProjectUrl ?? null,
            registryId: json.registryId ?? null,
            totalAreaHa: json.totalAreaHa ?? null,
            estimatedAnnualRemoval: json.estimatedAnnualRemoval ?? null,

            totalCreditsIssued: json.totalCreditsIssued ?? null,
            annualEstimatedCredits: json.annualEstimatedCredits ?? null,
            annualEstimateUnit: json.annualEstimateUnit ?? null,
            firstVintageYear: json.firstVintageYear ?? null,
            creditIssuanceDate: json.creditIssuanceDate ?? null,
            creditingStart: json.creditingStart ?? null,
            creditingEnd: json.creditingEnd ?? null,
            tenureText: json.tenureText ?? null,

            readiness: json.readiness ?? [],
            serviceProviders: json.serviceProviders ?? [],
            opportunities: json.opportunities ?? [],
            updates: json.updates ?? [],
            documents: json.documents ?? [],
            media: json.media ?? [],
            team: json.team ?? [],
            latitude: json.latitude ?? null,
            longitude: json.longitude ?? null,
            sectionVisibility: json.sectionVisibility ?? {},
        };
    }

    function normalizePatchedTeamMember(
        member: NonNullable<ProjectProfileData['team']>[number],
        existing?: NonNullable<ProjectProfileData['team']>[number] | null,
    ) {
        const isCompany = member.memberType === 'company';

        if (isCompany) {
            const companyId = member.companyId ?? member.memberId ?? null;
            const isPlatformMember = member.isPlatformMember ?? Boolean(companyId);

            const manualOrganization =
                !isPlatformMember
                    ? (member.manualOrganization ?? member.companyName ?? member.name ?? null)
                    : null;

            return {
                id: existing?.id ?? crypto.randomUUID(),
                memberType: 'company' as const,
                memberId: companyId,
                companyId,
                userId: null,
                name: isPlatformMember
                    ? (member.name ?? existing?.name ?? '')
                    : (manualOrganization ?? ''),
                role: member.role ?? existing?.role ?? null,
                companyName: isPlatformMember
                    ? (member.companyName ?? existing?.companyName ?? '')
                    : (manualOrganization ?? ''),
                avatarUrl: member.avatarUrl ?? existing?.avatarUrl ?? null,
                permission: null,
                isPlatformMember,
                manualName: null,
                manualOrganization,
            };
        }

        const userId = member.userId ?? member.memberId ?? null;
        const isPlatformMember = member.isPlatformMember ?? Boolean(userId);

        const manualName =
            !isPlatformMember
                ? (member.manualName ?? member.name ?? null)
                : null;

        const manualOrganization =
            !isPlatformMember
                ? (member.manualOrganization ?? member.companyName ?? null)
                : null;

        return {
            id: existing?.id ?? crypto.randomUUID(),
            memberType: 'user' as const,
            memberId: userId,
            userId,
            companyId: null,
            name: isPlatformMember
                ? (member.name ?? existing?.name ?? '')
                : (manualName ?? ''),
            role: member.role ?? existing?.role ?? null,
            companyName: isPlatformMember
                ? (member.companyName ?? existing?.companyName ?? '')
                : (manualOrganization ?? ''),
            avatarUrl: member.avatarUrl ?? existing?.avatarUrl ?? null,
            permission: member.permission ?? existing?.permission ?? 'viewer',
            isPlatformMember,
            manualName,
            manualOrganization,
        };
    }

    const loadProject = useCallback(
        async ({ silent = false }: { silent?: boolean } = {}) => {
            if (!id) {
                setError('Missing project id.');
                setLoading(false);
                return;
            }

            if (!silent) {
                setLoading(true);
            }
            setError(null);

            try {
                const res = await fetch(`${API_BASE_URL}/projects/${id}/edit`, {
                    credentials: 'include',
                });

                if (!res.ok) {
                    throw new Error(`Failed to load project (${res.status})`);
                }

                const raw = await res.json();
                const json: ProjectApiResponse = raw?.data ?? raw;

                setProject(mapProjectApiResponse(json));
                setMyRole(json.myRole ?? null);
                setIsSaved(Boolean(json.saved));
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load project.');
            } finally {
                if (!silent) {
                    setLoading(false);
                }
            }
        },
        [id],
    );

    useEffect(() => {
        void loadProject();
    }, [loadProject]);

    const deleteOpportunity = useCallback(
        async (opportunityId: string) => {
            if (!project) return;

            const res = await fetch(`${API_BASE_URL}/projects/opportunities/${opportunityId}`, {
                method: 'DELETE',
                credentials: 'include',
                headers: { Accept: 'application/json' },
            });

            const payload = await res.json().catch(() => null);

            if (!res.ok) {
                throw new Error(
                    payload?.error ||
                    payload?.message ||
                    `Failed to delete opportunity (${res.status})`
                );
            }

            setProject((prev) =>
                prev
                    ? {
                        ...prev,
                        opportunities: (prev.opportunities ?? []).filter((item) => item.id !== opportunityId),
                    }
                    : prev
            );
        },
        [project]
    );

    const deleteUpdate = useCallback(
        async (updateId: string) => {
            if (!project) return;

            const res = await fetch(`${API_BASE_URL}/projects/updates/${updateId}`, {
                method: 'DELETE',
                credentials: 'include',
                headers: { Accept: 'application/json' },
            });

            const payload = await res.json().catch(() => null);

            if (!res.ok) {
                throw new Error(
                    payload?.error ||
                    payload?.message ||
                    `Failed to delete update (${res.status})`
                );
            }

            setProject((prev) =>
                prev
                    ? {
                        ...prev,
                        updates: (prev.updates ?? []).filter((item) => item.id !== updateId),
                    }
                    : prev
            );
        },
        [project]
    );

    const deleteMedia = useCallback(
        async (media: ProjectMediaItem) => {
            if (!project) return;

            const res = await fetch(
                `${API_BASE_URL}/projects/${project.id}/media/${media.id}`,
                {
                    method: 'DELETE',
                    credentials: 'include',
                    headers: { Accept: 'application/json' },
                }
            );

            const payload = await res.json().catch(() => null);

            if (!res.ok) {
                throw new Error(
                    payload?.error ||
                    payload?.message ||
                    `Failed to delete media (${res.status})`
                );
            }

            setProject((prev) => {
                if (!prev) return prev;

                const nextMedia = (prev.media ?? []).filter((item) => item.id !== media.id);
                const removedWasCover = media.isCover || prev.coverImageUrl === media.assetUrl;

                return {
                    ...prev,
                    media: nextMedia,
                    coverImageUrl: removedWasCover ? null : prev.coverImageUrl ?? null,
                };
            });
        },
        [project]
    );

    const deleteDocument = useCallback(
        async (documentId: string) => {
            if (!project) return;

            const res = await fetch(
                `${API_BASE_URL}/projects/${project.id}/documents/${documentId}`,
                {
                    method: 'DELETE',
                    credentials: 'include',
                    headers: { Accept: 'application/json' },
                }
            );

            const payload = await res.json().catch(() => null);

            if (!res.ok) {
                throw new Error(
                    payload?.error ||
                    payload?.message ||
                    `Failed to delete document (${res.status})`
                );
            }

            setProject((prev) =>
                prev
                    ? {
                        ...prev,
                        documents: (prev.documents ?? []).filter((item) => item.id !== documentId),
                    }
                    : prev
            );
        },
        [project]
    );

    const saveProjectPatch = useCallback(
        async (patch: SaveProjectPatch) => {
            if (!id || !project) {
                throw new Error('Project not found');
            }

            const previousProject = project;

            const nextTeam =
                patch.team === undefined
                    ? project.team
                    : patch.team.map((member) => {
                        const existing =
                            member.memberType === 'company'
                                ? (
                                    member.companyId || member.memberId
                                        ? project.team?.find(
                                            (item) =>
                                                item.memberType === 'company' &&
                                                (item.companyId ?? item.memberId) ===
                                                (member.companyId ?? member.memberId),
                                        ) ?? null
                                        : null
                                )
                                : (
                                    member.userId || member.memberId
                                        ? project.team?.find(
                                            (item) =>
                                                item.memberType === 'user' &&
                                                (item.userId ?? item.memberId) ===
                                                (member.userId ?? member.memberId),
                                        ) ?? null
                                        : null
                                );

                        return normalizePatchedTeamMember(
                            {
                                id: existing?.id ?? crypto.randomUUID(),
                                memberType: member.memberType,
                                memberId: member.memberId ?? null,
                                userId:
                                    member.memberType === 'user'
                                        ? (member.userId ?? member.memberId ?? null)
                                        : null,
                                companyId:
                                    member.memberType === 'company'
                                        ? (member.companyId ?? member.memberId ?? null)
                                        : null,
                                name: member.name ?? existing?.name ?? '',
                                role: member.role ?? existing?.role ?? null,
                                companyName: member.companyName ?? existing?.companyName ?? '',
                                avatarUrl: member.avatarUrl ?? existing?.avatarUrl ?? null,
                                permission:
                                    member.memberType === 'user'
                                        ? (member.permission ?? existing?.permission ?? 'viewer')
                                        : null,
                                isPlatformMember:
                                    member.isPlatformMember ?? existing?.isPlatformMember ?? true,
                                manualName: member.manualName ?? existing?.manualName ?? null,
                                manualOrganization:
                                    member.manualOrganization ?? existing?.manualOrganization ?? null,
                            },
                            existing,
                        );
                    });

            const optimisticProject: ProjectProfileData = {
                ...project,
                ...patch,
                team: nextTeam,
                sectionVisibility: patch.sectionVisibility
                    ? {
                        ...(project.sectionVisibility ?? {}),
                        ...(patch.sectionVisibility ?? {}),
                    }
                    : project.sectionVisibility,
                documents: project.documents ?? [],
                media: project.media ?? [],
                opportunities: project.opportunities ?? [],
                updates: project.updates ?? [],
            };

            setProject(optimisticProject);
            setError(null);

            try {
                const res = await fetch(`${API_BASE_URL}/projects/${id}`, {
                    method: 'PATCH',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
                        Accept: 'application/json',
                    },
                    body: JSON.stringify(patch),
                });

                const payload = await res.json().catch(() => null);

                if (!res.ok) {
                    throw new Error(
                        payload?.error ||
                        payload?.message ||
                        `Failed to save project (${res.status})`,
                    );
                }

                const returned = payload?.data ?? payload;

                if (returned?.id) {
                    setProject(mapProjectApiResponse(returned));
                    if ('myRole' in returned) {
                        setMyRole(returned.myRole ?? null);
                    }
                    if ('saved' in returned) {
                        setIsSaved(Boolean(returned.saved));
                    }
                } else {
                    await loadProject({ silent: true });
                }
            } catch (err) {
                setProject(previousProject);
                throw err;
            }
        },
        [id, project, loadProject],
    );

    const handleToggleSave = useCallback(async () => {
        if (!project) return;

        const next = !isSaved;
        setIsSaved(next);

        try {
            if (next) {
                const res = await fetch(`${API_BASE_URL}/saved-items`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        entityType: 'project',
                        entityId: project.id,
                    }),
                });

                if (!res.ok) {
                    throw new Error(`Failed to save item (${res.status})`);
                }
            } else {
                const res = await fetch(`${API_BASE_URL}/saved-items/project/${project.id}`, {
                    method: 'DELETE',
                    credentials: 'include',
                });

                if (!res.ok) {
                    throw new Error(`Failed to remove saved item (${res.status})`);
                }
            }
        } catch {
            setIsSaved(!next);
        }
    }, [project, isSaved]);

    if (loading) {
        return (
            <Box sx={{ minHeight: 360, display: 'grid', placeItems: 'center' }}>
                <Stack spacing={2} alignItems="center">
                    <CircularProgress />
                    <Typography variant="body2" color="text.secondary">
                        Loading project...
                    </Typography>
                </Stack>
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{ maxWidth: 900, mx: 'auto', px: 2, py: 3 }}>
                <Alert severity="error">{error}</Alert>
            </Box>
        );
    }

    if (!project) {
        return (
            <Box sx={{ maxWidth: 900, mx: 'auto', px: 2, py: 3 }}>
                <Alert severity="warning">Project not found.</Alert>
            </Box>
        );
    }

    return (
        <>
            <ProjectProfileView
                project={project}
                mode="edit"
                currentUserRole={myRole}
                access={access}
                canEdit={canEdit}
                isSaved={isSaved}
                onBack={handleBack}
                shareUrl={`${window.location.origin}/projects/${project.id}`}
                shareTitle={project.name}
                onToggleSave={handleToggleSave}
                onOpenEditor={handleOpenEditor}
                onOpenSettings={() => handleOpenEditor('settings')}
                onSectionVisibilityChange={handleSectionVisibilityChange}
                onMediaMenuClick={(e, item, index) => {
                    e.stopPropagation();
                    setMediaMenuAnchor({
                        el: e.currentTarget,
                        media: item,
                        index,
                    });
                }}
                onOpportunityMenuClick={(e, item, index) => {
                    e.stopPropagation();
                    setOpportunityMenuAnchor({
                        el: e.currentTarget,
                        item,
                        index,
                    });
                }}
                onUpdateMenuClick={(e, item, index) => {
                    e.stopPropagation();
                    setUpdateMenuAnchor({
                        el: e.currentTarget,
                        item,
                        index,
                    });
                }}
                onDocumentMenuClick={(e, item, index) => {
                    e.stopPropagation();
                    setDocumentMenuAnchor({
                        el: e.currentTarget,
                        item,
                        index,
                    });
                }}
                headerBar={{
                    backLabel: 'Back to My Projects',
                    contextLabel: project.companyName || project.name,
                    showSettingsButton: canEdit,
                }}
                focusSection={focusSection === 'updates' ? 'updates' : null}
                highlightedUpdateId={highlightedUpdateId}
                onSectionFocusHandled={handleSectionFocusHandled}
            />

            <Menu
                anchorEl={mediaMenuAnchor?.el ?? null}
                open={Boolean(mediaMenuAnchor)}
                onClose={() => setMediaMenuAnchor(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                PaperProps={{ sx: contextualMenuPaperSx }}
            >
                <MenuItem
                    sx={contextualMenuItemSx}
                    onClick={() => {
                        const mediaId = mediaMenuAnchor?.media.id ?? null;
                        setMediaMenuAnchor(null);
                        handleOpenMediaEditor(mediaId);
                    }}
                >
                    <ListItemIcon>
                        <EditRounded sx={{ fontSize: 16 }} />
                    </ListItemIcon>
                    <ListItemText
                        primary="Edit"
                        primaryTypographyProps={{ variant: 'body2' }}
                    />
                </MenuItem>

                <MenuItem
                    onClick={async () => {
                        const target = mediaMenuAnchor?.media;
                        setMediaMenuAnchor(null);

                        if (!target) return;

                        try {
                            await deleteMedia(target);
                        } catch (err) {
                            setError(err instanceof Error ? err.message : 'Failed to delete media.');
                        }
                    }}
                    sx={{
                        color: 'error.main',
                        ...contextualMenuItemSx,
                    }}
                >
                    <ListItemIcon>
                        <DeleteRounded sx={{ fontSize: 16, color: 'error.main' }} />
                    </ListItemIcon>
                    <ListItemText
                        primary="Delete"
                        primaryTypographyProps={{ variant: 'body2' }}
                    />
                </MenuItem>
            </Menu>

            <Menu
                anchorEl={opportunityMenuAnchor?.el ?? null}
                open={Boolean(opportunityMenuAnchor)}
                onClose={() => setOpportunityMenuAnchor(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                PaperProps={{ sx: contextualMenuPaperSx }}
            >
                <MenuItem
                    sx={contextualMenuItemSx}
                    onClick={() => {
                        const targetId = opportunityMenuAnchor?.item.id ?? null;
                        setOpportunityMenuAnchor(null);
                        handleOpenEditor('opportunities', targetId);
                    }}
                >
                    <ListItemIcon>
                        <EditRounded sx={{ fontSize: 16 }} />
                    </ListItemIcon>
                    <ListItemText
                        primary="Edit"
                        primaryTypographyProps={{ variant: 'body2' }}
                    />
                </MenuItem>

                <MenuItem
                    onClick={async () => {
                        const targetId = opportunityMenuAnchor?.item.id ?? null;
                        setOpportunityMenuAnchor(null);

                        if (!targetId) return;

                        try {
                            await deleteOpportunity(targetId);
                        } catch (err) {
                            setError(err instanceof Error ? err.message : 'Failed to delete opportunity.');
                        }
                    }}
                    sx={{
                        color: 'error.main',
                        ...contextualMenuItemSx,
                    }}
                >
                    <ListItemIcon>
                        <DeleteRounded sx={{ fontSize: 16, color: 'error.main' }} />
                    </ListItemIcon>
                    <ListItemText
                        primary="Delete"
                        primaryTypographyProps={{ variant: 'body2' }}
                    />
                </MenuItem>
            </Menu>

            <Menu
                anchorEl={updateMenuAnchor?.el ?? null}
                open={Boolean(updateMenuAnchor)}
                onClose={() => setUpdateMenuAnchor(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                PaperProps={{ sx: contextualMenuPaperSx }}
            >
                <MenuItem
                    sx={contextualMenuItemSx}
                    onClick={() => {
                        const targetId = updateMenuAnchor?.item.id ?? null;
                        setUpdateMenuAnchor(null);
                        handleOpenEditor('updates', targetId);
                    }}
                >
                    <ListItemIcon>
                        <EditRounded sx={{ fontSize: 16 }} />
                    </ListItemIcon>
                    <ListItemText
                        primary="Edit"
                        primaryTypographyProps={{ variant: 'body2' }}
                    />
                </MenuItem>

                <MenuItem
                    onClick={async () => {
                        const targetId = updateMenuAnchor?.item.id ?? null;
                        setUpdateMenuAnchor(null);

                        if (!targetId) return;

                        try {
                            await deleteUpdate(targetId);
                        } catch (err) {
                            setError(err instanceof Error ? err.message : 'Failed to delete update.');
                        }
                    }}
                    sx={{
                        color: 'error.main',
                        ...contextualMenuItemSx,
                    }}
                >
                    <ListItemIcon>
                        <DeleteRounded sx={{ fontSize: 16, color: 'error.main' }} />
                    </ListItemIcon>
                    <ListItemText
                        primary="Delete"
                        primaryTypographyProps={{ variant: 'body2' }}
                    />
                </MenuItem>
            </Menu>

            <Menu
                anchorEl={documentMenuAnchor?.el ?? null}
                open={Boolean(documentMenuAnchor)}
                onClose={() => setDocumentMenuAnchor(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                PaperProps={{ sx: contextualMenuPaperSx }}
            >
                <MenuItem
                    sx={contextualMenuItemSx}
                    onClick={() => {
                        setDocumentMenuAnchor(null);
                        handleOpenEditor('documents', documentMenuAnchor?.item.id ?? null);
                    }}
                >
                    <ListItemIcon>
                        <EditRounded sx={{ fontSize: 16 }} />
                    </ListItemIcon>
                    <ListItemText
                        primary="Edit"
                        primaryTypographyProps={{ variant: 'body2' }}
                    />
                </MenuItem>

                <MenuItem
                    onClick={async () => {
                        const targetId = documentMenuAnchor?.item.id ?? null;
                        setDocumentMenuAnchor(null);

                        if (!targetId) return;

                        try {
                            await deleteDocument(targetId);
                        } catch (err) {
                            setError(err instanceof Error ? err.message : 'Failed to delete document.');
                        }
                    }}
                    sx={{
                        color: 'error.main',
                        ...contextualMenuItemSx,
                    }}
                >
                    <ListItemIcon>
                        <DeleteRounded sx={{ fontSize: 16, color: 'error.main' }} />
                    </ListItemIcon>
                    <ListItemText
                        primary="Delete"
                        primaryTypographyProps={{ variant: 'body2' }}
                    />
                </MenuItem>
            </Menu>

            <ProjectSidebarEditor
                open={editorOpen}
                section={activeSection}
                project={project}
                initialMediaId={initialMediaId}
                initialOpportunityId={initialOpportunityId}
                initialUpdateId={initialUpdateId}
                initialDocumentId={initialDocumentId}
                onClose={() => {
                    setEditorOpen(false);
                    setInitialMediaId(null);
                    setInitialOpportunityId(null);
                    setInitialUpdateId(null);
                    setInitialDocumentId(null);
                }}
                onProjectChange={setProject}
                onSave={saveProjectPatch}
            />
        </>
    );
}