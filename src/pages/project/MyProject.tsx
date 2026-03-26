import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Alert, Box, Button, CircularProgress, Drawer, Stack, Typography } from '@mui/material';
import SettingsRounded from '@mui/icons-material/SettingsRounded';
import ProjectProfileView, {
    ProjectProfileData,
    ProjectRole,
    ProjectSectionKey,
} from './ProjectProfileView';
import ProjectSidebarEditor from './ProjectSidebarEditor';

// Replace this with your actual editor component later.
function ProjectSidebarEditorPlaceholder({
    section,
    open,
    onClose,
}: {
    section: ProjectSectionKey | null;
    open: boolean;
    onClose: () => void;
}) {
    return (
        <Drawer anchor="right" open={open} onClose={onClose}>
            <Box sx={{ width: 420, p: 3 }}>
                <Stack spacing={2}>
                    <Typography variant="h6" fontWeight={700}>
                        Sidebar Editor
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Active section: {section || '—'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Keep this as the separate editing surface. The profile view should stay presentation-first.
                    </Typography>
                    <Button variant="contained" onClick={onClose}>
                        Close
                    </Button>
                </Stack>
            </Box>
        </Drawer>
    );
}

type ProjectApiResponse = ProjectProfileData & {
    myRole?: ProjectRole | null;
    saved?: boolean;
};

export default function MyProject() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [project, setProject] = useState<ProjectProfileData | null>(null);
    const [myRole, setMyRole] = useState<ProjectRole | null>(null);
    const [isSaved, setIsSaved] = useState(false);

    const [editorOpen, setEditorOpen] = useState(false);
    const [activeSection, setActiveSection] = useState<ProjectSectionKey | null>(null);

    const canEdit = myRole === 'creator';

    const loadProject = useCallback(async () => {
        if (!id) {
            setError('Missing project id.');
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // Replace with your real endpoint.
            const res = await fetch(`/api/projects/${id}`, {
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
                storyProblem: json.storyProblem ?? null,
                storyApproach: json.storyApproach ?? null,
                methodology: json.methodology ?? null,
                registryName: json.registryName ?? null,
                registryStatus: json.registryStatus ?? null,
                registryProjectId: json.registryProjectId ?? null,
                totalAreaHa: json.totalAreaHa ?? null,
                estimatedAnnualRemoval: json.estimatedAnnualRemoval ?? null,
                coBenefits: json.coBenefits ?? [],
                readiness: json.readiness ?? [],
                serviceProviders: json.serviceProviders ?? [],
                opportunities: json.opportunities ?? [],
                updates: json.updates ?? [],
                documents: json.documents ?? [],
                media: json.media ?? [],
                team: json.team ?? [],
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

    const handleOpenEditor = useCallback((section: ProjectSectionKey) => {
        if (!canEdit) return;
        setActiveSection(section);
        setEditorOpen(true);
    }, [canEdit]);

    const handleOpenSettings = useCallback(() => {
        if (!canEdit) return;
        setActiveSection('overview');
        setEditorOpen(true);
    }, [canEdit]);

    const handleToggleSave = useCallback(async () => {
        if (!project) return;

        const next = !isSaved;
        setIsSaved(next);

        try {
            const res = await fetch(`/api/saved-projects/${project.id}`, {
                method: next ? 'POST' : 'DELETE',
                credentials: 'include',
            });

            if (!res.ok) {
                throw new Error('Failed to update saved state');
            }
        } catch {
            setIsSaved(!next);
        }
    }, [project, isSaved]);

    const handleBack = useCallback(() => {
        navigate('/projects?tab=my');
    }, [navigate]);

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
                    canEdit={canEdit}
                    isSaved={isSaved}
                    onToggleSave={handleToggleSave}
                    onBack={handleBack}
                    onOpenEditor={handleOpenEditor}
                    onOpenSettings={handleOpenSettings}
                    renderSidebarAnchor={
                        canEdit ? (
                            <Button
                                variant="outlined"
                                startIcon={<SettingsRounded />}
                                onClick={handleOpenSettings}
                            >
                                Edit
                            </Button>
                        ) : null
                    }
                />

                <ProjectSidebarEditor
                    open={editorOpen}
                    section={activeSection}
                    project={project}
                    onClose={() => setEditorOpen(false)}
                    onSave={async (patch) => {
                        if (!project) return;

                        const nextProject = {
                            ...project,
                            ...patch,
                            sectionVisibility: {
                                ...(project.sectionVisibility ?? {}),
                                ...(patch.sectionVisibility ?? {}),
                            },
                        };

                        setProject(nextProject);

                        try {
                            const res = await fetch(`/api/projects/${project.id}`, {
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
        canEdit,
        isSaved,
        handleToggleSave,
        handleBack,
        handleOpenEditor,
        handleOpenSettings,
        editorOpen,
        activeSection,
    ]);

    return content;
}