import React, { useEffect, useMemo, useState } from 'react';
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    FormControl,
    FormControlLabel,
    IconButton,
    InputLabel,
    Menu,
    MenuItem,
    Paper,
    Select,
    Snackbar,
    Stack,
    Switch,
    TextField,
    Typography,
} from '@mui/material';
import { SidebarPanel } from '../../components/layout/SidebarPanel';
import type { SelectChangeEvent } from '@mui/material/Select';
import {
    AddRounded,
    AttachMoneyRounded,
    BusinessRounded,
    ContentCopyRounded,
    DeleteOutlineRounded,
    EditRounded,
    LocationOnRounded,
    MoreVertRounded,
    ShareRounded,
} from '@mui/icons-material';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

type ProjectOption = {
    id: string;
    name: string;
    upid?: string | null;
    stage?: string | null;
    country?: string | null;
};

type OpportunityListItem = {
    id: string;
    projectId: string;
    projectName: string;
    projectUpid?: string | null;
    type: string;
    description: string | null;
    urgent: boolean;
    stage?: string | null;
    country?: string | null;
    developer?: string | null;
    createdAt: string;
};

function StageChip({ stage }: { stage?: string | null }) {
    if (!stage) return null;
    return <Chip label={stage} size="small" />;
}

export default function OpportunitiesTab() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [projectsLoading, setProjectsLoading] = useState(false);

    const [projects, setProjects] = useState<ProjectOption[]>([]);
    const [opportunities, setOpportunities] = useState<OpportunityListItem[]>([]);

    const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
    const [selectedOpp, setSelectedOpp] = useState<OpportunityListItem | null>(null);

    const [editorOpen, setEditorOpen] = useState(false);
    const [editingOpp, setEditingOpp] = useState<OpportunityListItem | null>(null);

    const [oppProjectId, setOppProjectId] = useState('');
    const [oppType, setOppType] = useState('Financing');
    const [oppDesc, setOppDesc] = useState('');
    const [oppUrgent, setOppUrgent] = useState(false);

    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [shareDialogOpen, setShareDialogOpen] = useState(false);

    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');
    const [snackbarMessage, setSnackbarMessage] = useState('');

    const selectedProject = useMemo(
        () => projects.find((project) => project.id === oppProjectId) ?? null,
        [projects, oppProjectId]
    );

    useEffect(() => {
        void Promise.all([loadProjects(), loadOpportunities()]);
    }, []);

    function showSnackbar(severity: 'success' | 'error', message: string) {
        setSnackbarSeverity(severity);
        setSnackbarMessage(message);
        setSnackbarOpen(true);
    }

    function normalizeProject(raw: any): ProjectOption {
        return {
            id: String(raw.id),
            name: String(raw.name ?? raw.displayName ?? ''),
            upid: raw.upid ?? null,
            stage: raw.stage ?? null,
            country: raw.country ?? null,
        };
    }

    function normalizeOpportunity(raw: any): OpportunityListItem {
        return {
            id: String(raw.id),
            projectId: String(raw.projectId),
            projectName: String(raw.projectName),
            projectUpid: raw.projectUpid ?? null,
            type: String(raw.type),
            description: raw.description ?? null,
            urgent: Boolean(raw.urgent),
            stage: raw.stage ?? null,
            country: raw.country ?? null,
            developer: raw.developer ?? null,
            createdAt: String(raw.createdAt),
        };
    }

    async function loadProjects() {
        try {
            setProjectsLoading(true);

            const response = await fetch(
                `${API_BASE_URL}/projects?scope=my&page=1&pageSize=100&sortBy=updated&sortDir=desc`,
                {
                    method: 'GET',
                    credentials: 'include',
                }
            );

            if (!response.ok) {
                throw new Error(`Failed to load projects (${response.status})`);
            }

            const payload = await response.json();
            const items = Array.isArray(payload?.items) ? payload.items.map(normalizeProject) : [];
            setProjects(items);
        } catch (error) {
            console.error(error);
            showSnackbar('error', 'Failed to load projects');
        } finally {
            setProjectsLoading(false);
        }
    }

    async function loadOpportunities() {
        try {
            setLoading(true);

            const response = await fetch(`${API_BASE_URL}/projects/opportunities?limit=100`, {
                method: 'GET',
                credentials: 'include',
            });

            if (!response.ok) {
                throw new Error(`Failed to load opportunities (${response.status})`);
            }

            const payload = await response.json();
            const items = Array.isArray(payload?.items)
                ? payload.items.map(normalizeOpportunity)
                : [];
            setOpportunities(items);
        } catch (error) {
            console.error(error);
            showSnackbar('error', 'Failed to load opportunities');
        } finally {
            setLoading(false);
        }
    }

    function openCreateEditor() {
        setEditingOpp(null);
        setOppProjectId(projects[0]?.id ?? '');
        setOppType('Financing');
        setOppDesc('');
        setOppUrgent(false);
        setEditorOpen(true);
    }

    function openEditEditor(opp: OpportunityListItem) {
        setEditingOpp(opp);
        setOppProjectId(opp.projectId);
        setOppType(opp.type);
        setOppDesc(opp.description ?? '');
        setOppUrgent(Boolean(opp.urgent));
        setEditorOpen(true);
    }

    function handleMenuOpen(event: React.MouseEvent<HTMLElement>, opp: OpportunityListItem) {
        event.stopPropagation();
        setMenuAnchor(event.currentTarget);
        setSelectedOpp(opp);
    }

    function handleMenuClose() {
        setMenuAnchor(null);
    }

    async function createOpportunity(projectId: string) {
        const response = await fetch(`${API_BASE_URL}/projects/${projectId}/opportunities`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                type: oppType.trim(),
                description: oppDesc.trim() || null,
                urgent: oppUrgent,
            }),
        });

        if (!response.ok) {
            const text = await response.text();
            throw new Error(text || `Failed to create opportunity (${response.status})`);
        }

        return response.json();
    }

    async function updateOpportunity(opportunityId: string) {
        const response = await fetch(`${API_BASE_URL}/projects/opportunities/${opportunityId}`, {
            method: 'PATCH',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                projectId: oppProjectId || undefined,
                type: oppType.trim(),
                description: oppDesc.trim() || null,
                urgent: oppUrgent,
            }),
        });

        if (!response.ok) {
            const text = await response.text();
            throw new Error(text || `Failed to update opportunity (${response.status})`);
        }

        return response.json();
    }

    async function deleteOpportunity(opportunityId: string) {
        const response = await fetch(`${API_BASE_URL}/projects/opportunities/${opportunityId}`, {
            method: 'DELETE',
            credentials: 'include',
        });

        if (!response.ok) {
            const text = await response.text();
            throw new Error(text || `Failed to delete opportunity (${response.status})`);
        }

        return response.json();
    }

    async function handleSaveOpportunity() {
        if (!oppProjectId) {
            showSnackbar('error', 'Please select a project');
            return;
        }

        if (!oppType.trim()) {
            showSnackbar('error', 'Please enter an opportunity type');
            return;
        }

        try {
            setSaving(true);

            if (editingOpp) {
                await updateOpportunity(editingOpp.id);
            } else {
                await createOpportunity(oppProjectId);
            }

            setEditorOpen(false);
            setEditingOpp(null);
            setOppProjectId('');
            setOppType('Financing');
            setOppDesc('');
            setOppUrgent(false);

            await loadOpportunities();

            showSnackbar('success', editingOpp ? 'Opportunity updated' : 'Opportunity added');
        } catch (error) {
            console.error(error);
            showSnackbar('error', 'Failed to save opportunity');
        } finally {
            setSaving(false);
        }
    }

    async function handleDeleteOpportunity() {
        if (!selectedOpp) return;

        try {
            setSaving(true);

            await deleteOpportunity(selectedOpp.id);

            setDeleteDialogOpen(false);
            setSelectedOpp(null);
            await loadOpportunities();

            showSnackbar('success', 'Opportunity deleted');
        } catch (error) {
            console.error(error);
            showSnackbar('error', 'Failed to delete opportunity');
        } finally {
            setSaving(false);
        }
    }

    async function handleCopyLink() {
        if (!selectedOpp) return;

        try {
            await navigator.clipboard.writeText(
                `${window.location.origin}/projects/${selectedOpp.projectId}`
            );
            setShareDialogOpen(false);
            showSnackbar('success', 'Link copied to clipboard');
        } catch (error) {
            console.error(error);
            showSnackbar('error', 'Failed to copy link');
        }
    }

    return (
        <Box maxWidth={1200}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Box>
                    <Typography variant="h6" fontWeight="bold">
                        My Opportunities
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Manage opportunities linked to your projects.
                    </Typography>
                </Box>

                <Button
                    variant="contained"
                    startIcon={<AddRounded />}
                    onClick={openCreateEditor}
                    disabled={projectsLoading || projects.length === 0}
                    sx={{
                        bgcolor: 'grey.900',
                        '&:hover': { bgcolor: 'grey.800' },
                    }}
                >
                    Add Opportunity
                </Button>
            </Box>

            {loading ? (
                <Box py={6} display="flex" justifyContent="center">
                    <CircularProgress />
                </Box>
            ) : opportunities.length === 0 ? (
                <Paper
                    variant="outlined"
                    sx={{
                        p: 6,
                        textAlign: 'center',
                        borderRadius: 2,
                        borderStyle: 'dashed',
                    }}
                >
                    <AttachMoneyRounded sx={{ fontSize: 48, color: 'grey.300', mb: 1 }} />
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                        No opportunities yet
                    </Typography>
                    <Typography variant="body2" color="text.disabled">
                        Opportunities created on your projects will appear here.
                    </Typography>
                </Paper>
            ) : (
                <Box
                    sx={{
                        display: 'grid',
                        gridTemplateColumns: {
                            xs: '1fr',
                            md: opportunities.length === 1 ? '1fr' : 'repeat(2, 1fr)',
                        },
                        gap: 3,
                    }}
                >
                    {opportunities.map((opp) => (
                        <Card
                            key={opp.id}
                            variant="outlined"
                            sx={{
                                borderRadius: 2,
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                '&:hover': {
                                    borderColor: 'grey.300',
                                    boxShadow: 1,
                                },
                            }}
                            onClick={() => openEditEditor(opp)}
                        >
                            <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                                    <Box flex={1} minWidth={0}>
                                        <Typography variant="subtitle1" fontWeight="bold" sx={{ lineHeight: 1.3 }}>
                                            {opp.type}
                                        </Typography>
                                        <Typography variant="caption" color="text.disabled">
                                            {opp.projectName}
                                            {opp.projectUpid ? ` · ${opp.projectUpid}` : ''}
                                        </Typography>
                                    </Box>

                                    <IconButton size="small" onClick={(e) => handleMenuOpen(e, opp)}>
                                        <MoreVertRounded sx={{ fontSize: 20 }} />
                                    </IconButton>
                                </Box>

                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    sx={{ mb: 2, lineHeight: 1.5 }}
                                >
                                    {opp.description || 'No description available.'}
                                </Typography>

                                <Box display="flex" alignItems="center" gap={1} mb={2} flexWrap="wrap">
                                    <StageChip stage={opp.stage} />
                                    <Chip
                                        label={opp.type}
                                        size="small"
                                        sx={{
                                            height: 24,
                                            fontSize: '0.75rem',
                                            bgcolor: 'grey.100',
                                            color: 'grey.700',
                                            fontWeight: 500,
                                        }}
                                    />
                                    {opp.urgent && (
                                        <Chip
                                            label="Urgent"
                                            size="small"
                                            sx={{
                                                height: 24,
                                                fontSize: '0.75rem',
                                                bgcolor: '#fff3e0',
                                                color: '#e65100',
                                                fontWeight: 500,
                                            }}
                                        />
                                    )}
                                </Box>

                                <Box display="flex" alignItems="center" gap={2} color="text.secondary" flexWrap="wrap">
                                    {opp.country && (
                                        <Box display="flex" alignItems="center" gap={0.5}>
                                            <LocationOnRounded sx={{ fontSize: 14 }} />
                                            <Typography variant="caption">{opp.country}</Typography>
                                        </Box>
                                    )}

                                    {opp.developer && (
                                        <Box display="flex" alignItems="center" gap={0.5}>
                                            <BusinessRounded sx={{ fontSize: 14 }} />
                                            <Typography variant="caption">{opp.developer}</Typography>
                                        </Box>
                                    )}
                                </Box>
                            </CardContent>
                        </Card>
                    ))}
                </Box>
            )}

            <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={handleMenuClose}>
                <MenuItem
                    onClick={() => {
                        handleMenuClose();
                        if (selectedOpp) openEditEditor(selectedOpp);
                    }}
                >
                    <EditRounded fontSize="small" sx={{ mr: 1 }} />
                    Edit
                </MenuItem>

                <MenuItem
                    onClick={() => {
                        handleMenuClose();
                        setShareDialogOpen(true);
                    }}
                >
                    <ShareRounded fontSize="small" sx={{ mr: 1 }} />
                    Share
                </MenuItem>

                <MenuItem
                    onClick={() => {
                        handleMenuClose();
                        setDeleteDialogOpen(true);
                    }}
                    sx={{ color: 'error.main' }}
                >
                    <DeleteOutlineRounded fontSize="small" sx={{ mr: 1, color: 'error.main' }} />
                    Delete
                </MenuItem>
            </Menu>

            <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
                <DialogTitle>Delete Opportunity</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to delete this {selectedOpp?.type} opportunity
                        {selectedOpp?.projectName ? ` for "${selectedOpp.projectName}"` : ''}?
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialogOpen(false)} disabled={saving}>
                        Cancel
                    </Button>
                    <Button onClick={handleDeleteOpportunity} color="error" variant="contained" disabled={saving}>
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog open={shareDialogOpen} onClose={() => setShareDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Share Opportunity</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary" mb={2}>
                        Copy the project link for this opportunity.
                    </Typography>
                    <Box display="flex" gap={1}>
                        <TextField
                            fullWidth
                            size="small"
                            value={selectedOpp ? `${window.location.origin}/projects/${selectedOpp.projectId}` : ''}
                            InputProps={{ readOnly: true }}
                        />
                        <Button
                            variant="contained"
                            startIcon={<ContentCopyRounded />}
                            onClick={handleCopyLink}
                            sx={{
                                bgcolor: 'grey.900',
                                '&:hover': { bgcolor: 'grey.800' },
                            }}
                        >
                            Copy
                        </Button>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShareDialogOpen(false)}>Close</Button>
                </DialogActions>
            </Dialog>

            <SidebarPanel
                open={editorOpen}
                onClose={() => setEditorOpen(false)}
                title={editingOpp ? 'Edit Opportunity' : 'Add Opportunity'}
                onSave={handleSaveOpportunity}
                saveLabel={editingOpp ? 'Save Changes' : 'Add Opportunity'}
                saveDisabled={saving || projectsLoading || !oppProjectId || !oppType.trim()}
                width={420}
            >
                <Stack spacing={3}>
                    <Box>
                        <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                            {editingOpp ? 'Edit Opportunity' : 'Add Opportunity'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Link this opportunity to one of your projects.
                        </Typography>
                    </Box>

                    <FormControl fullWidth disabled={saving || projectsLoading}>
                        <InputLabel>Project</InputLabel>
                        <Select
                            value={oppProjectId}
                            label="Project"
                            onChange={(event: SelectChangeEvent) => setOppProjectId(event.target.value)}
                        >
                            {projects.map((project) => (
                                <MenuItem key={project.id} value={project.id}>
                                    {project.name}
                                    {project.upid ? ` · ${project.upid}` : ''}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <FormControl fullWidth disabled={saving}>
                        <InputLabel>Opportunity Type</InputLabel>
                        <Select
                            value={oppType}
                            label="Opportunity Type"
                            onChange={(event: SelectChangeEvent) => setOppType(event.target.value)}
                        >
                            <MenuItem value="Financing">Financing</MenuItem>
                            <MenuItem value="Technical Partner">Technical Partner</MenuItem>
                            <MenuItem value="Buyer">Buyer</MenuItem>
                            <MenuItem value="Community Partner">Community Partner</MenuItem>
                            <MenuItem value="Implementation Partner">Implementation Partner</MenuItem>
                            <MenuItem value="Investor">Investor</MenuItem>
                            <MenuItem value="Offtake">Offtake</MenuItem>
                            <MenuItem value="Other">Other</MenuItem>
                        </Select>
                    </FormControl>

                    <TextField
                        label="Description"
                        multiline
                        minRows={4}
                        fullWidth
                        value={oppDesc}
                        onChange={(event) => setOppDesc(event.target.value)}
                        disabled={saving}
                        placeholder="Describe what kind of collaboration or support is needed."
                    />

                    <FormControlLabel
                        control={
                            <Switch
                                checked={oppUrgent}
                                onChange={(event) => setOppUrgent(event.target.checked)}
                                disabled={saving}
                            />
                        }
                        label="Mark as urgent"
                    />

                    {selectedProject && (
                        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                            <Stack spacing={1}>
                                <Typography variant="subtitle2" fontWeight="bold">
                                    Linked project
                                </Typography>
                                <Typography variant="body2">{selectedProject.name}</Typography>
                                <Box display="flex" gap={1} flexWrap="wrap">
                                    {selectedProject.stage && <Chip size="small" label={selectedProject.stage} />}
                                    {selectedProject.country && <Chip size="small" label={selectedProject.country} />}
                                </Box>
                            </Stack>
                        </Paper>
                    )}
                </Stack>
            </SidebarPanel>

            <Snackbar
                open={snackbarOpen}
                autoHideDuration={3500}
                onClose={() => setSnackbarOpen(false)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert onClose={() => setSnackbarOpen(false)} severity={snackbarSeverity} variant="filled">
                    {snackbarMessage}
                </Alert>
            </Snackbar>
        </Box>
    );
}