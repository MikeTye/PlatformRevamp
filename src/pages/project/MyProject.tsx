import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Alert, Box, CircularProgress, Stack, Typography } from '@mui/material';
import ProjectProfileView, {
    ProjectProfileData,
    ProjectRole,
    ProjectSectionKey,
    ProjectEditorTarget,
    ProjectAccess,
} from './ProjectProfileView';
import ProjectSidebarEditor from './ProjectSidebarEditor';

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

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [project, setProject] = useState<ProjectProfileData | null>(null);
    const [myRole, setMyRole] = useState<ProjectRole | null>(null);
    const [isSaved, setIsSaved] = useState(false);

    const [editorOpen, setEditorOpen] = useState(false);
    const [activeSection, setActiveSection] = useState<ProjectEditorTarget | null>(null);

    const canEdit = myRole === 'creator';

    const access: ProjectAccess = useMemo(
        () => ({
            isProjectMember: Boolean(myRole),
            projectRole: myRole,
            canViewPrivateSections: myRole === 'creator' || myRole === 'viewer',
        }),
        [myRole],
    );

    const handleBack = useCallback(() => {
        navigate('/projects?tab=my');
    }, [navigate]);

    const handleShare = useCallback(async () => {
        const shareUrl = window.location.href;
        const shareTitle = project?.name ?? 'Project';

        try {
            if (navigator.share) {
                await navigator.share({
                    title: shareTitle,
                    url: shareUrl,
                });
                return;
            }
        } catch {
            // fall through to clipboard
        }

        try {
            await navigator.clipboard.writeText(shareUrl);
        } catch {
            window.prompt('Copy this link:', shareUrl);
        }
    }, [project]);

    const loadProject = useCallback(async () => {
        if (!id) {
            setError('Missing project id.');
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const res = await fetch(`${API_BASE_URL}/projects/${id}/edit`, {
                credentials: 'include',
            });

            if (!res.ok) {
                throw new Error(`Failed to load project (${res.status})`);
            }

            const json: ProjectApiResponse = await res.json();

            setProject({
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
                registryName: json.registryName ?? null,
                registryStatus: json.registryStatus ?? null,
                registryProjectId: json.registryProjectId ?? null,
                totalAreaHa: json.totalAreaHa ?? null,
                estimatedAnnualRemoval: json.estimatedAnnualRemoval ?? null,
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
            });

            setMyRole(json.myRole ?? null);
            setIsSaved(Boolean(json.saved));
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load project.');
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        void loadProject();
    }, [loadProject]);

    const handleOpenEditor = useCallback(
        (section: ProjectEditorTarget) => {
            if (!canEdit) return;
            if (section === 'readiness') return;

            setActiveSection(section);
            setEditorOpen(true);
        },
        [canEdit],
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

    const content = useMemo(() => {
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
                    onShare={handleShare}
                    onToggleSave={handleToggleSave}
                    onOpenEditor={handleOpenEditor}
                    onOpenSettings={() => handleOpenEditor('settings')}
                    headerBar={{
                        backLabel: 'Back to My Projects',
                        contextLabel: project.companyName || project.name,
                        showSettingsButton: canEdit,
                    }}
                />

                <ProjectSidebarEditor
                    open={editorOpen}
                    section={activeSection}
                    project={project}
                    onClose={() => setEditorOpen(false)}
                    onProjectChange={(nextProject) => {
                        setProject(nextProject);
                    }}
                    onSave={async (patch) => {
                        if (!project) return;

                        const nextTeam =
                            patch.team === undefined
                                ? project.team
                                : patch.team.map((member) => {
                                    if (member.memberType === 'company') {
                                        const companyId = member.companyId ?? member.memberId;

                                        const existing =
                                            project.team?.find(
                                                (item) =>
                                                    item.memberType === 'company' &&
                                                    (item.companyId ?? item.memberId) === companyId,
                                            ) ?? null;

                                        return {
                                            id: existing?.id ?? crypto.randomUUID(),
                                            memberType: 'company' as const,
                                            memberId: companyId,
                                            userId: null,
                                            companyId,
                                            name: member.name ?? existing?.name ?? '',
                                            role: member.role ?? existing?.role ?? null,
                                            companyName: member.companyName ?? existing?.companyName ?? '',
                                            avatarUrl: member.avatarUrl ?? existing?.avatarUrl ?? null,
                                            permission: null,
                                        };
                                    }

                                    const memberUserId = member.userId ?? member.memberId;

                                    const existing =
                                        project.team?.find(
                                            (item) =>
                                                item.memberType === 'user' &&
                                                (item.userId ?? item.memberId) === memberUserId,
                                        ) ?? null;

                                    return {
                                        id: existing?.id ?? crypto.randomUUID(),
                                        memberType: 'user' as const,
                                        memberId: memberUserId,
                                        userId: memberUserId,
                                        companyId: null,
                                        name: member.name ?? existing?.name ?? '',
                                        role: member.role ?? existing?.role ?? null,
                                        companyName: member.companyName ?? existing?.companyName ?? '',
                                        avatarUrl: member.avatarUrl ?? existing?.avatarUrl ?? null,
                                        permission: member.permission ?? existing?.permission ?? 'viewer',
                                    };
                                });

                        const nextProject: ProjectProfileData = {
                            ...project,
                            ...patch,
                            team: nextTeam,
                            sectionVisibility: patch.sectionVisibility
                                ? {
                                    ...(project.sectionVisibility ?? {}),
                                    ...(patch.sectionVisibility ?? {}),
                                }
                                : project.sectionVisibility,
                        };

                        setProject(nextProject);

                        try {
                            const res = await fetch(`${API_BASE_URL}/projects/${project.id}`, {
                                method: 'PATCH',
                                credentials: 'include',
                                headers: {
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify(patch),
                            });

                            if (!res.ok) {
                                throw new Error(`Failed to save project (${res.status})`);
                            }
                        } catch (err) {
                            setProject(project);
                            throw err;
                        }
                    }}
                />
            </>
        );
    }, [
        loading,
        error,
        project,
        myRole,
        access,
        canEdit,
        isSaved,
        handleBack,
        handleShare,
        handleToggleSave,
        handleOpenEditor,
        editorOpen,
        activeSection,
    ]);

    return content;
}