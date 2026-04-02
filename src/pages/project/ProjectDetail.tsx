import React, { useMemo } from 'react';
import { Box, Button, Paper, Typography } from '@mui/material';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import ProjectProfileView, {
    ProjectProfileData,
    ProjectRole,
} from './ProjectProfileView';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000';

type ProjectApiResponse = Omit<ProjectProfileData, 'documents' | 'media'> & {
    documents?: ProjectProfileData['documents'];
    media?: ProjectProfileData['media'];
    myRole?: ProjectRole | null;
    saved?: boolean;
};

type ProjectReadOnlyPageProps = {
    project?: ProjectProfileData | null;
    currentUserRole?: ProjectRole | null;
    isSaved?: boolean;
    onToggleSave?: () => void;
    onBack?: () => void;
    onShare?: () => void;
};

export type ProjectAccess = {
    isProjectMember: boolean;
    projectRole: ProjectRole | null;
    canViewPrivateSections: boolean;
};

export function ProjectDetail({
    project: externalProject,
    currentUserRole: externalCurrentUserRole = null,
    isSaved: externalIsSaved = false,
    onToggleSave,
    onBack,
    onShare,
}: ProjectReadOnlyPageProps) {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const [project, setProject] = React.useState<ProjectProfileData | null>(
        externalProject ?? null
    );
    const [myRole, setMyRole] = React.useState<ProjectRole | null>(
        externalCurrentUserRole
    );
    const [isSaved, setIsSaved] = React.useState<boolean>(externalIsSaved);
    const [loading, setLoading] = React.useState<boolean>(!externalProject);
    const [error, setError] = React.useState<string | null>(null);

    const loadProject = React.useCallback(async () => {
        if (externalProject) {
            setProject(externalProject);
            setMyRole(externalCurrentUserRole);
            setIsSaved(externalIsSaved);
            setLoading(false);
            return;
        }

        if (!id) {
            setError('Missing project id.');
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const res = await fetch(`${API_BASE_URL}/projects/${id}`, {
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
    }, [id, externalProject, externalCurrentUserRole, externalIsSaved]);

    React.useEffect(() => {
        void loadProject();
    }, [loadProject]);

    const fromParam = searchParams.get('from');
    const isMyProject = myRole === 'creator';

    const access: ProjectAccess = useMemo(
        () => ({
            isProjectMember: Boolean(myRole),
            projectRole: myRole,
            canViewPrivateSections: myRole === 'creator' || myRole === 'viewer',
        }),
        [myRole],
    );

    const handleBackNavigation = () => {
        if (onBack) {
            onBack();
            return;
        }

        if (fromParam === 'profile') {
            navigate('/account?tab=projects');
        } else if (isMyProject) {
            navigate('/projects?tab=my');
        } else {
            navigate('/projects');
        }
    };

    const getBackLabel = () => {
        if (fromParam === 'profile') return 'My Profile';
        return isMyProject ? 'My Projects' : 'Projects';
    };

    const handleToggleSave = React.useCallback(async () => {
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

    const handleShare = async () => {
        if (onShare) {
            onShare();
            return;
        }

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

            await navigator.clipboard.writeText(shareUrl);
        } catch {
            // no-op
        }
    };

    if (loading) {
        return (
            <Box minHeight="100vh" bgcolor="grey.50" p={3}>
                <Paper variant="outlined" sx={{ p: 6, textAlign: 'center', borderRadius: 2 }}>
                    <Typography color="text.secondary">Loading project...</Typography>
                </Paper>
            </Box>
        );
    }

    if (error) {
        return (
            <Box minHeight="100vh" bgcolor="grey.50" p={3}>
                <Paper variant="outlined" sx={{ p: 6, textAlign: 'center', borderRadius: 2 }}>
                    <Typography color="error" mb={2}>
                        {error}
                    </Typography>
                    <Button
                        variant="text"
                        onClick={() => navigate('/projects')}
                        sx={{ textTransform: 'none', textDecoration: 'underline' }}
                    >
                        Back to Projects
                    </Button>
                </Paper>
            </Box>
        );
    }

    if (!project) {
        return (
            <Box minHeight="100vh" bgcolor="grey.50" p={3}>
                <Paper variant="outlined" sx={{ p: 6, textAlign: 'center', borderRadius: 2 }}>
                    <Typography color="text.secondary" mb={2}>
                        Project not found
                    </Typography>
                    <Button
                        variant="text"
                        onClick={() => navigate('/projects')}
                        sx={{ textTransform: 'none', textDecoration: 'underline' }}
                    >
                        Back to Projects
                    </Button>
                </Paper>
            </Box>
        );
    }

    return (
        <ProjectProfileView
            project={project}
            mode="read"
            currentUserRole={myRole}
            access={access}
            canEdit={false}
            isSaved={isSaved}
            onToggleSave={handleToggleSave}
            onBack={handleBackNavigation}
            onShare={handleShare}
            headerBar={{
                backLabel: getBackLabel(),
                contextLabel: project.companyName || null,
                showSettingsButton: false,
            }}
        />
    );
}