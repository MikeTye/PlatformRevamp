import React, { useEffect, useMemo, useState } from 'react';
import {
    Box,
    Typography,
    Button,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    IconButton,
    Stack,
    CircularProgress,
    Alert,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material/Select';
import CloseRounded from '@mui/icons-material/CloseRounded';

export type UpdateWizardCloseResult =
    | { completed: false }
    | {
        completed: true;
        projectId: string;
        updateId?: string | null;
    };

interface UpdateWizardProps {
    open: boolean;
    onClose: (result?: UpdateWizardCloseResult) => void;
}

type ProjectOption = {
    id: string;
    name: string;
    stage?: string | null;
    type?: string | null;
    country?: string | null;
};

type ListProjectsResponse = {
    items?: Array<{
        id: string;
        name: string;
        stage?: string | null;
        type?: string | null;
        country?: string | null;
    }>;
};

type MeResponse = {
    ok?: boolean;
    user?: {
        id: string;
        email: string;
        name?: string | null;
        avatarUrl?: string | null;
    };
};

function extractCreatedUpdateId(payload: any): string | null {
    if (!payload || typeof payload !== 'object') return null;

    const directId =
        typeof payload.id === 'string'
            ? payload.id
            : typeof payload.updateId === 'string'
                ? payload.updateId
                : null;

    if (directId) return directId;

    const data = payload.data;
    if (data && typeof data === 'object') {
        if (typeof data.id === 'string') return data.id;
        if (typeof data.updateId === 'string') return data.updateId;

        if (data.update && typeof data.update === 'object') {
            if (typeof data.update.id === 'string') return data.update.id;
            if (typeof data.update.updateId === 'string') return data.update.updateId;
        }
    }

    return null;
}

export function UpdateWizard({ open, onClose }: UpdateWizardProps) {
    const [projects, setProjects] = useState<ProjectOption[]>([]);
    const [projectsLoading, setProjectsLoading] = useState(false);
    const [projectsError, setProjectsError] = useState<string | null>(null);

    const [selectedProject, setSelectedProject] = useState('');
    const [title, setTitle] = useState('');
    const [dateLabel, setDateLabel] = useState(new Date().toISOString().split('T')[0] ?? '');
    const [description, setDescription] = useState('');
    const [type, setType] = useState<'progress' | 'stage'>('progress');

    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    const [currentUserName, setCurrentUserName] = useState('');
    const [meLoading, setMeLoading] = useState(false);

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000';

    useEffect(() => {
        if (!open) return;

        let cancelled = false;

        async function loadMe() {
            setMeLoading(true);

            try {
                const res = await fetch(`${API_BASE_URL}/auth/me`, {
                    credentials: 'include',
                    headers: {
                        Accept: 'application/json',
                    },
                });

                if (!res.ok) {
                    throw new Error(`Failed to load current user (${res.status})`);
                }

                const data = (await res.json()) as MeResponse;
                const name = data?.user?.name?.trim() ?? '';

                if (!cancelled) {
                    setCurrentUserName(name);
                }
            } catch {
                if (!cancelled) {
                    setCurrentUserName('');
                }
            } finally {
                if (!cancelled) {
                    setMeLoading(false);
                }
            }
        }

        void loadMe();

        return () => {
            cancelled = true;
        };
    }, [open, API_BASE_URL]);

    useEffect(() => {
        if (!open) return;

        let cancelled = false;

        async function loadProjects() {
            setProjectsLoading(true);
            setProjectsError(null);

            try {
                const res = await fetch(
                    `${API_BASE_URL}/projects?scope=my&page=1&pageSize=100&sortBy=updated&sortDir=desc`,
                    {
                        credentials: 'include',
                    }
                );

                if (!res.ok) {
                    throw new Error(`Failed to load projects (${res.status})`);
                }

                const data = (await res.json()) as ListProjectsResponse;
                const items = Array.isArray(data?.items) ? data.items : [];

                if (!cancelled) {
                    setProjects(
                        items.map((item) => ({
                            id: item.id,
                            name: item.name,
                            stage: item.stage ?? null,
                            type: item.type ?? null,
                            country: item.country ?? null,
                        }))
                    );
                }
            } catch (err) {
                if (!cancelled) {
                    setProjectsError(err instanceof Error ? err.message : 'Failed to load projects');
                    setProjects([]);
                }
            } finally {
                if (!cancelled) {
                    setProjectsLoading(false);
                }
            }
        }

        void loadProjects();

        return () => {
            cancelled = true;
        };
    }, [open, API_BASE_URL]);

    useEffect(() => {
        if (!open) {
            setSelectedProject('');
            setTitle('');
            setDateLabel(new Date().toISOString().split('T')[0] ?? '');
            setDescription('');
            setType('progress');
            setSubmitError(null);
            setProjectsError(null);
            setCurrentUserName('');
        }
    }, [open]);

    const selectedProjectData = useMemo(
        () => projects.find((project) => project.id === selectedProject) ?? null,
        [projects, selectedProject]
    );

    const canPost =
        !!selectedProject &&
        title.trim().length > 0 &&
        description.trim().length > 0 &&
        !submitting;

    const handleProjectChange = (event: SelectChangeEvent<string>) => {
        setSelectedProject(event.target.value);
    };

    const handlePost = async () => {
        if (!canPost) return;

        setSubmitting(true);
        setSubmitError(null);

        try {
            const res = await fetch(`${API_BASE_URL}/projects/${selectedProject}/updates`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    title: title.trim(),
                    description: description.trim(),
                    dateLabel: dateLabel || null,
                    type,
                    authorName: currentUserName || null,
                }),
            });

            const payload = await res.json().catch(() => null);

            if (!res.ok) {
                throw new Error(payload?.message || `Failed to create update (${res.status})`);
            }

            const updateId = extractCreatedUpdateId(payload);

            onClose({
                completed: true,
                projectId: selectedProject,
                updateId,
            });
        } catch (err) {
            setSubmitError(err instanceof Error ? err.message : 'Failed to create update');
        } finally {
            setSubmitting(false);
        }
    };

    const handleClose = () => {
        onClose({ completed: false });
    };

    if (!open) return null;

    return (
        <Box
            sx={{
                position: 'fixed',
                inset: 0,
                bgcolor: 'white',
                zIndex: 1300,
                display: 'flex',
                flexDirection: 'column',
            }}
        >
            <Box
                sx={{
                    height: 64,
                    borderBottom: 1,
                    borderColor: 'grey.200',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    px: 3,
                    bgcolor: 'white',
                }}
            >
                <Box display="flex" alignItems="center" gap={2}>
                    <IconButton onClick={handleClose} size="small">
                        <CloseRounded sx={{ fontSize: 20 }} />
                    </IconButton>
                    <Typography variant="h6" fontWeight="bold">
                        Post Update
                    </Typography>
                </Box>

                <Button onClick={handleClose} sx={{ color: 'text.secondary' }}>
                    Cancel
                </Button>
            </Box>

            <Box sx={{ flex: 1, overflowY: 'auto', p: { xs: 2, md: 4 } }}>
                <Box maxWidth={640} mx="auto">
                    <Stack spacing={3}>
                        <Box>
                            <Typography variant="h5" fontWeight="bold" gutterBottom>
                                Share a Project Update
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Select one of your projects and publish a new update.
                            </Typography>
                        </Box>

                        {projectsError && <Alert severity="error">{projectsError}</Alert>}
                        {submitError && <Alert severity="error">{submitError}</Alert>}

                        <FormControl fullWidth disabled={projectsLoading || submitting}>
                            <InputLabel id="project-select-label">Project</InputLabel>
                            <Select
                                labelId="project-select-label"
                                value={selectedProject}
                                label="Project"
                                onChange={handleProjectChange}
                            >
                                {projects.map((project) => (
                                    <MenuItem key={project.id} value={project.id}>
                                        {project.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        {projectsLoading && (
                            <Box display="flex" alignItems="center" gap={1}>
                                <CircularProgress size={18} />
                                <Typography variant="body2" color="text.secondary">
                                    Loading your projects...
                                </Typography>
                            </Box>
                        )}

                        {selectedProjectData && (
                            <Box
                                sx={{
                                    px: 2,
                                    py: 1.5,
                                    borderRadius: 2,
                                    border: '1px solid',
                                    borderColor: 'grey.200',
                                    bgcolor: 'grey.50',
                                }}
                            >
                                <Typography variant="body2" fontWeight="medium">
                                    {selectedProjectData.name}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    {[selectedProjectData.stage, selectedProjectData.type, selectedProjectData.country]
                                        .filter(Boolean)
                                        .join(' • ')}
                                </Typography>
                            </Box>
                        )}

                        <TextField
                            label="Update Title"
                            fullWidth
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g. Baseline survey completed"
                            disabled={!selectedProject || submitting}
                        />

                        <FormControl fullWidth disabled={!selectedProject || submitting}>
                            <InputLabel id="update-type-label">Update Type</InputLabel>
                            <Select
                                labelId="update-type-label"
                                value={type}
                                label="Update Type"
                                onChange={(e) => setType(e.target.value as 'progress' | 'stage')}
                            >
                                <MenuItem value="progress">Progress</MenuItem>
                                <MenuItem value="stage">Stage</MenuItem>
                            </Select>
                        </FormControl>

                        <TextField
                            label="Date"
                            type="date"
                            fullWidth
                            value={dateLabel}
                            onChange={(e) => setDateLabel(e.target.value)}
                            InputLabelProps={{ shrink: true }}
                            disabled={!selectedProject || submitting}
                        />

                        <TextField
                            label="Posted by"
                            fullWidth
                            value={currentUserName}
                            disabled
                            placeholder={meLoading ? 'Loading...' : 'Your name'}
                        />

                        <TextField
                            label="Description"
                            fullWidth
                            multiline
                            minRows={5}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Share what changed, what was achieved, or what comes next..."
                            disabled={!selectedProject || submitting}
                        />
                    </Stack>
                </Box>
            </Box>

            <Box
                sx={{
                    height: 72,
                    borderTop: 1,
                    borderColor: 'grey.200',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    px: { xs: 2, md: 4 },
                    bgcolor: 'white',
                }}
            >
                <Button
                    variant="contained"
                    onClick={handlePost}
                    disabled={!canPost}
                    size="large"
                    sx={{ px: 4 }}
                >
                    {submitting ? 'Posting...' : 'Post Update'}
                </Button>
            </Box>
        </Box>
    );
}