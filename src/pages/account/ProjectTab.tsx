import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    Divider,
    IconButton,
    ListItemIcon,
    ListItemText,
    Menu,
    MenuItem,
    Snackbar,
    Typography,
} from '@mui/material';
import MuiAlert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';

import AddRounded from '@mui/icons-material/AddRounded';
import ContentCopyRounded from '@mui/icons-material/ContentCopyRounded';
import DeleteOutlineRounded from '@mui/icons-material/DeleteOutlineRounded';
import EditRounded from '@mui/icons-material/EditRounded';
import LocationOnRounded from '@mui/icons-material/LocationOnRounded';
import MoreVertRounded from '@mui/icons-material/MoreVertRounded';
import ShareRounded from '@mui/icons-material/ShareRounded';
import VisibilityOffRounded from '@mui/icons-material/VisibilityOffRounded';
import VisibilityRounded from '@mui/icons-material/VisibilityRounded';

import { ProjectStageIndicator, type ProjectStage } from '../../components/ProjectStageIndicator';
import { ProjectWizard, type WizardCloseResult } from '../../components/ProjectWizard';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

type ListProjectsResponse = {
    items?: BackendProject[];
    total?: number;
    page?: number;
    pageSize?: number;
    counts?: {
        all: number;
        my: number;
        saved: number;
    };
};

type BackendProject = {
    id: string;
    upid: string;
    name: string;
    developer: string;
    description: string | null;
    stage: string;
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
    visibility: 'public' | 'private' | null;
};

type ProjectCardItem = {
    id: string;
    upid: string;
    name: string;
    description: string;
    stage: ProjectStage;
    type: string;
    country: string;
    isMine: boolean;
    isSaved: boolean;
    isPublic: boolean;
};

function normalizeStage(stage: string): ProjectStage {
    const allowed: ProjectStage[] = [
        'Exploration',
        'Concept',
        'Design',
        'Listed',
        'Validation',
        'Registered',
        'Issued',
        'Closed',
    ];

    if (allowed.includes(stage as ProjectStage)) {
        return stage as ProjectStage;
    }

    return 'Concept';
}

function mapProject(item: BackendProject): ProjectCardItem {
    return {
        id: item.id,
        upid: item.upid ?? '',
        name: item.name ?? 'Untitled Project',
        description: item.description ?? '',
        stage: normalizeStage(item.stage),
        type: item.type ?? 'Project',
        country: item.country ?? '',
        isMine: Boolean(item.isMine),
        isSaved: Boolean(item.isSaved),
        isPublic: item.visibility !== 'private',
    };
}

export default function ProjectTab() {
    const navigate = useNavigate();

    const [projects, setProjects] = useState<ProjectCardItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState('');
    const [wizardOpen, setWizardOpen] = useState(false);

    const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
    const [selectedProject, setSelectedProject] = useState<ProjectCardItem | null>(null);

    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

    const [shareDialogOpen, setShareDialogOpen] = useState(false);

    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'info' | 'error'>(
        'success'
    );
    const [snackbarMessage, setSnackbarMessage] = useState('');

    const isSingleCard = useMemo(() => projects.length === 1, [projects.length]);

    const showSnackbar = useCallback(
        (severity: 'success' | 'info' | 'error', message: string) => {
            setSnackbarSeverity(severity);
            setSnackbarMessage(message);
            setSnackbarOpen(true);
        },
        []
    );

    const loadProjects = useCallback(async () => {
        try {
            setLoading(true);
            setErrorMessage('');

            const response = await fetch(
                `${API_BASE_URL}/projects?scope=my&page=1&pageSize=100&sortBy=updated&sortDir=desc`,
                {
                    method: 'GET',
                    credentials: 'include',
                    headers: {
                        Accept: 'application/json',
                    },
                }
            );

            if (!response.ok) {
                throw new Error(`Failed to load projects (${response.status})`);
            }

            const payload = (await response.json()) as ListProjectsResponse;
            const items = Array.isArray(payload.items) ? payload.items.map(mapProject) : [];
            setProjects(items);
        } catch (error) {
            console.error(error);
            setErrorMessage('Failed to load projects');
            setProjects([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadProjects();
    }, [loadProjects]);

    function handleCreate() {
        setWizardOpen(true);
    }

    function handleWizardClose(result?: WizardCloseResult) {
        setWizardOpen(false);

        if (result?.completed) {
            showSnackbar('success', 'Project created');
            void loadProjects();

            if (result.projectId) {
                navigate(`/projects/${result.projectId}?from=account`);
            }
        }
    }

    function handleCardClick(project: ProjectCardItem) {
        navigate(`/projects/${project.id}?from=account`);
    }

    function handleMenuOpen(
        event: React.MouseEvent<HTMLElement>,
        project: ProjectCardItem
    ) {
        event.stopPropagation();
        setMenuAnchor(event.currentTarget);
        setSelectedProject(project);
    }

    function handleMenuClose() {
        setMenuAnchor(null);
    }

    function handleEdit(project: ProjectCardItem) {
        navigate(`/projects/${project.id}?from=account`);
    }

    function handleShare() {
        setShareDialogOpen(true);
        handleMenuClose();
    }

    async function handleCopyLink() {
        if (!selectedProject) return;

        try {
            await navigator.clipboard.writeText(
                `${window.location.origin}/projects/${selectedProject.id}`
            );
            showSnackbar('success', 'Link copied to clipboard');
            setShareDialogOpen(false);
        } catch (error) {
            console.error(error);
            showSnackbar('error', 'Failed to copy link');
        }
    }

    function handleToggleVisibility() {
        if (!selectedProject) return;

        // TODO: replace with backend route when available
        setProjects((prev) =>
            prev.map((project) =>
                project.id === selectedProject.id
                    ? { ...project, isPublic: !project.isPublic }
                    : project
            )
        );

        showSnackbar(
            'info',
            `Project is now ${selectedProject.isPublic ? 'private' : 'public'}`
        );

        handleMenuClose();
    }

    function handleDeleteClick() {
        setDeleteDialogOpen(true);
        handleMenuClose();
    }

    function handleConfirmDelete() {
        if (!selectedProject) return;

        // TODO: wire to backend delete route when implemented
        showSnackbar('info', `Delete route for "${selectedProject.name}" is not wired yet`);
        setDeleteDialogOpen(false);
        setSelectedProject(null);
    }

    if (loading) {
        return (
            <Box maxWidth={1000}>
                <Box minHeight={240} display="flex" alignItems="center" justifyContent="center">
                    <CircularProgress />
                </Box>
            </Box>
        );
    }

    return (
        <Box maxWidth={1000}>
            <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                mb={3}
                gap={2}
                flexWrap="wrap"
            >
                <Box>
                    <Typography variant="h6" fontWeight="bold">
                        My Projects
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Create and manage your projects.
                    </Typography>
                </Box>

                <Button
                    variant="contained"
                    startIcon={<AddRounded />}
                    onClick={handleCreate}
                    sx={{
                        bgcolor: 'grey.900',
                        '&:hover': {
                            bgcolor: 'grey.800',
                        },
                    }}
                >
                    Create New Project
                </Button>
            </Box>

            {errorMessage ? (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {errorMessage}
                </Alert>
            ) : null}

            {!projects.length ? (
                <Card variant="outlined" sx={{ borderRadius: 2 }}>
                    <CardContent sx={{ p: 3 }}>
                        <Typography variant="subtitle1" fontWeight="bold" mb={1}>
                            No projects yet
                        </Typography>
                        <Typography variant="body2" color="text.secondary" mb={2}>
                            Create your first project to get started.
                        </Typography>
                        <Button
                            variant="contained"
                            startIcon={<AddRounded />}
                            onClick={handleCreate}
                            sx={{
                                bgcolor: 'grey.900',
                                '&:hover': {
                                    bgcolor: 'grey.800',
                                },
                            }}
                        >
                            Create Project
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <Box
                    sx={{
                        display: 'grid',
                        gridTemplateColumns: isSingleCard
                            ? '1fr'
                            : {
                                xs: '1fr',
                                md: 'repeat(2, 1fr)',
                            },
                        gap: 3,
                    }}
                >
                    {projects.map((project) => (
                        <Card
                            key={project.id}
                            variant="outlined"
                            sx={{
                                borderRadius: 2,
                                transition: 'all 0.2s',
                                cursor: 'pointer',
                                '&:hover': {
                                    borderColor: 'grey.300',
                                    boxShadow: 1,
                                },
                            }}
                            onClick={() => handleCardClick(project)}
                        >
                            <CardContent
                                sx={{
                                    p: 2.5,
                                    '&:last-child': {
                                        pb: 2.5,
                                    },
                                }}
                            >
                                <Box
                                    display="flex"
                                    justifyContent="space-between"
                                    alignItems="flex-start"
                                    mb={1}
                                >
                                    <Box flex={1} minWidth={0}>
                                        <Typography
                                            variant="subtitle1"
                                            fontWeight="bold"
                                            color="text.primary"
                                            sx={{ lineHeight: 1.3 }}
                                        >
                                            {project.name}
                                        </Typography>

                                        <Typography
                                            variant="caption"
                                            fontFamily="monospace"
                                            color="text.disabled"
                                        >
                                            {project.upid || project.id}
                                        </Typography>
                                    </Box>

                                    <Box
                                        display="flex"
                                        alignItems="center"
                                        gap={0.5}
                                        ml={1}
                                        flexShrink={0}
                                    >
                                        {!project.isPublic && (
                                            <VisibilityOffRounded
                                                sx={{
                                                    fontSize: 18,
                                                    color: 'grey.400',
                                                }}
                                            />
                                        )}

                                        <IconButton
                                            size="small"
                                            onClick={(e) => handleMenuOpen(e, project)}
                                        >
                                            <MoreVertRounded sx={{ fontSize: 20 }} />
                                        </IconButton>
                                    </Box>
                                </Box>

                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    sx={{
                                        mb: 2,
                                        lineHeight: 1.5,
                                        minHeight: 42,
                                    }}
                                >
                                    {project.description || 'No description available.'}
                                </Typography>

                                <Box
                                    display="flex"
                                    alignItems="center"
                                    gap={1}
                                    mb={2}
                                    flexWrap="wrap"
                                >
                                    <ProjectStageIndicator stage={project.stage} />
                                    <Chip
                                        label={project.type}
                                        size="small"
                                        sx={{
                                            height: 24,
                                            fontSize: '0.75rem',
                                            bgcolor: 'grey.100',
                                            color: 'grey.700',
                                            fontWeight: 500,
                                        }}
                                    />
                                </Box>

                                {!!project.country && (
                                    <Box display="flex" alignItems="center" gap={0.5} color="text.secondary">
                                        <LocationOnRounded sx={{ fontSize: 14 }} />
                                        <Typography variant="caption">{project.country}</Typography>
                                    </Box>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </Box>
            )}

            <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={handleMenuClose}>
                <MenuItem
                    onClick={() => {
                        if (selectedProject) handleEdit(selectedProject);
                        handleMenuClose();
                    }}
                >
                    <ListItemIcon>
                        <EditRounded fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Edit</ListItemText>
                </MenuItem>

                <MenuItem onClick={handleShare}>
                    <ListItemIcon>
                        <ShareRounded fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Share</ListItemText>
                </MenuItem>

                <MenuItem onClick={handleToggleVisibility}>
                    <ListItemIcon>
                        {selectedProject?.isPublic ? (
                            <VisibilityOffRounded fontSize="small" />
                        ) : (
                            <VisibilityRounded fontSize="small" />
                        )}
                    </ListItemIcon>
                    <ListItemText>
                        {selectedProject?.isPublic ? 'Make Private' : 'Make Public'}
                    </ListItemText>
                </MenuItem>

                <Divider />

                <MenuItem onClick={handleDeleteClick} sx={{ color: 'error.main' }}>
                    <ListItemIcon>
                        <DeleteOutlineRounded fontSize="small" sx={{ color: 'error.main' }} />
                    </ListItemIcon>
                    <ListItemText>Delete</ListItemText>
                </MenuItem>
            </Menu>

            <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
                <DialogTitle>Delete Project</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to delete "{selectedProject?.name}"?
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleConfirmDelete} color="error" variant="contained">
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog
                open={shareDialogOpen}
                onClose={() => setShareDialogOpen(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>Share Project</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary" mb={2}>
                        Share this project with others.
                    </Typography>

                    <Box
                        sx={{
                            p: 1.5,
                            border: 1,
                            borderColor: 'grey.300',
                            borderRadius: 1,
                            bgcolor: 'grey.50',
                            fontFamily: 'monospace',
                            fontSize: '0.875rem',
                            wordBreak: 'break-all',
                        }}
                    >
                        {window.location.origin}/projects/{selectedProject?.id}
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShareDialogOpen(false)}>Close</Button>
                    <Button
                        variant="contained"
                        startIcon={<ContentCopyRounded />}
                        onClick={handleCopyLink}
                        sx={{
                            bgcolor: 'grey.900',
                            '&:hover': {
                                bgcolor: 'grey.800',
                            },
                        }}
                    >
                        Copy
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar
                open={snackbarOpen}
                autoHideDuration={3000}
                onClose={() => setSnackbarOpen(false)}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'center',
                }}
            >
                <MuiAlert
                    onClose={() => setSnackbarOpen(false)}
                    severity={snackbarSeverity}
                    variant="filled"
                >
                    {snackbarMessage}
                </MuiAlert>
            </Snackbar>

            <ProjectWizard
                open={wizardOpen}
                onClose={handleWizardClose}
                hasCompanies={true}
            />
        </Box>
    );
}