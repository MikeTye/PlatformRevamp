import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    CircularProgress,
    Divider,
    IconButton,
    ListItemIcon,
    ListItemText,
    Menu,
    MenuItem,
    Paper,
    Snackbar,
    Stack,
    Typography,
} from '@mui/material';
import AddRounded from '@mui/icons-material/AddRounded';
import BusinessRounded from '@mui/icons-material/BusinessRounded';
import EditRounded from '@mui/icons-material/EditRounded';
import FolderRounded from '@mui/icons-material/FolderRounded';
import GroupRounded from '@mui/icons-material/GroupRounded';
import LanguageRounded from '@mui/icons-material/LanguageRounded';
import LinkRounded from '@mui/icons-material/LinkRounded';
import LocationOnRounded from '@mui/icons-material/LocationOnRounded';
import MoreVertRounded from '@mui/icons-material/MoreVertRounded';
import PersonAddAltRounded from '@mui/icons-material/PersonAddAltRounded';
import CheckCircleRounded from '@mui/icons-material/CheckCircleRounded';

import { CompanyWizard, type WizardCloseResult } from '../../components/CompanyWizard';
import DeleteOutlineRounded from '@mui/icons-material/DeleteOutlineRounded';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

type CompaniesApiItem = {
    id: string;
    displayName?: string;
    companyRoles?: string[];
    services?: string[];
    serviceCategories?: string[];
    geographicalCoverage?: string[];
    country?: string | null;
    countryCode?: string | null;
    functionDescription?: string | null;
    websiteUrl?: string | null;
    logoUrl?: string | null;
    projectsCount?: number;
    createdAt?: string;
    isMine?: boolean;
    isSaved?: boolean;
    isVerified?: boolean;
};

type CompaniesApiResponse = {
    ok?: boolean;
    data?: CompaniesApiItem[];
    items?: CompaniesApiItem[];
    total?: number;
    page?: number;
    pageSize?: number;
};

type CompanyCardModel = {
    id: string;
    name: string;
    description: string;
    roles: string[];
    geographicalCoverage: string[];
    country: string | null;
    websiteUrl: string | null;
    projectsCount: number;
    isVerified: boolean;
};

function normalizeCompany(item: CompaniesApiItem): CompanyCardModel {
    return {
        id: item.id,
        name: typeof item.displayName === 'string' && item.displayName.trim()
            ? item.displayName.trim()
            : 'Untitled company',
        description:
            typeof item.functionDescription === 'string'
                ? item.functionDescription.trim()
                : '',
        roles: Array.isArray(item.companyRoles) ? item.companyRoles.filter(Boolean) : [],
        geographicalCoverage: Array.isArray(item.geographicalCoverage)
            ? item.geographicalCoverage.filter(Boolean)
            : [],
        country: typeof item.country === 'string' && item.country.trim() ? item.country.trim() : null,
        websiteUrl:
            typeof item.websiteUrl === 'string' && item.websiteUrl.trim()
                ? item.websiteUrl.trim()
                : null,
        projectsCount: typeof item.projectsCount === 'number' ? item.projectsCount : 0,
        isVerified: Boolean(item.isVerified),
    };
}

function formatWebsiteLabel(url: string | null): string {
    if (!url) return '';
    return url
        .replace(/^https?:\/\//i, '')
        .replace(/^www\./i, '')
        .replace(/\/$/, '');
}

export default function CompanyTab() {
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [companies, setCompanies] = useState<CompanyCardModel[]>([]);
    const [error, setError] = useState('');

    const [wizardOpen, setWizardOpen] = useState(false);

    const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
    const [selectedCompany, setSelectedCompany] = useState<CompanyCardModel | null>(null);

    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');

    const isSingleCard = companies.length === 1;

    const publicBaseUrl = useMemo(() => window.location.origin, []);

    const showSnackbar = useCallback(
        (severity: 'success' | 'error', message: string) => {
            setSnackbarSeverity(severity);
            setSnackbarMessage(message);
            setSnackbarOpen(true);
        },
        []
    );

    const loadCompanies = useCallback(async () => {
        try {
            setLoading(true);
            setError('');

            const response = await fetch(
                `${API_BASE_URL}/companies?scope=mine&page=1&pageSize=24&sortField=createdAt&sortDirection=desc`,
                {
                    method: 'GET',
                    credentials: 'include',
                }
            );

            if (!response.ok) {
                throw new Error(`Failed to load companies (${response.status})`);
            }

            const payload = (await response.json()) as CompaniesApiResponse;
            const items = Array.isArray(payload.items)
                ? payload.items
                : Array.isArray(payload.data)
                    ? payload.data
                    : [];

            setCompanies(items.map(normalizeCompany));
        } catch (err) {
            console.error(err);
            setError('Failed to load companies');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadCompanies();
    }, [loadCompanies]);

    function handleMenuOpen(event: React.MouseEvent<HTMLElement>, company: CompanyCardModel) {
        event.stopPropagation();
        setMenuAnchor(event.currentTarget);
        setSelectedCompany(company);
    }

    function handleMenuClose() {
        setMenuAnchor(null);
    }

    function handleEdit(company: CompanyCardModel) {
        navigate(`/my-company/${company.id}?from=profile`);
    }

    function handleCreate() {
        setWizardOpen(true);
    }

    async function handleCopyPublicLink() {
        if (!selectedCompany) return;

        try {
            const url = `${publicBaseUrl}/companies/${selectedCompany.id}`;
            await navigator.clipboard.writeText(url);
            showSnackbar('success', 'Company link copied');
        } catch (err) {
            console.error(err);
            showSnackbar('error', 'Failed to copy company link');
        } finally {
            handleMenuClose();
        }
    }

    async function handleDeleteCompany() {
        if (!selectedCompany) return;

        const confirmed = window.confirm(
            `Delete "${selectedCompany.name}"? This action cannot be easily undone.`
        );

        if (!confirmed) {
            handleMenuClose();
            return;
        }

        try {
            const response = await fetch(
                `${API_BASE_URL}/companies/${selectedCompany.id}`,
                {
                    method: 'DELETE',
                    credentials: 'include',
                }
            );

            if (!response.ok) {
                throw new Error(`Failed to delete company (${response.status})`);
            }

            const deletedCompanyId = selectedCompany.id;

            handleMenuClose();
            await loadCompanies();

            showSnackbar('success', 'Company deleted');

            if (window.location.pathname.includes(`/my-company/${deletedCompanyId}`)) {
                navigate('/profile');
            }
        } catch (err) {
            console.error(err);
            handleMenuClose();
            showSnackbar('error', 'Failed to delete company');
        }
    }

    async function handleCopyInviteLink() {
        if (!selectedCompany) return;

        try {
            const response = await fetch(
                `${API_BASE_URL}/companies/${selectedCompany.id}/invite-link`,
                {
                    method: 'GET',
                    credentials: 'include',
                }
            );

            if (!response.ok) {
                throw new Error(`Failed to get invite link (${response.status})`);
            }

            const payload = await response.json();
            const inviteUrl =
                payload?.data?.externalInviteUrl ??
                payload?.externalInviteUrl ??
                '';

            if (!inviteUrl || typeof inviteUrl !== 'string') {
                throw new Error('Invite link missing in response');
            }

            await navigator.clipboard.writeText(inviteUrl);
            showSnackbar('success', 'Invite link copied');
        } catch (err) {
            console.error(err);
            showSnackbar('error', 'Failed to copy invite link');
        } finally {
            handleMenuClose();
        }
    }

    async function handleWizardClose(result?: WizardCloseResult) {
        setWizardOpen(false);

        if (!result?.completed) return;

        await loadCompanies();

        if (result.companyId) {
            showSnackbar('success', 'Company created');
            navigate(`/my-company/${result.companyId}?from=profile`);
            return;
        }

        showSnackbar('success', 'Company created');
    }

    if (loading) {
        return (
            <Box maxWidth={1100}>
                <Paper variant="outlined" sx={{ p: 4, borderRadius: 3 }}>
                    <Box display="flex" alignItems="center" justifyContent="center" minHeight={240}>
                        <CircularProgress />
                    </Box>
                </Paper>
            </Box>
        );
    }

    if (error) {
        return (
            <Box maxWidth={1100}>
                <Paper variant="outlined" sx={{ p: 4, borderRadius: 3 }}>
                    <Stack spacing={2}>
                        <Alert severity="error">{error}</Alert>
                        <Box>
                            <Button variant="outlined" onClick={() => void loadCompanies()}>
                                Retry
                            </Button>
                        </Box>
                    </Stack>
                </Paper>
            </Box>
        );
    }

    return (
        <Box maxWidth={1100}>
            <Box
                display="flex"
                justifyContent="space-between"
                alignItems={{ xs: 'stretch', sm: 'center' }}
                flexDirection={{ xs: 'column', sm: 'row' }}
                gap={2}
                mb={3}
            >
                <Box>
                    <Typography variant="h6" fontWeight="bold">
                        My Companies
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Manage your company profiles and jump into editing quickly.
                    </Typography>
                </Box>

                <Button
                    variant="contained"
                    startIcon={<AddRounded />}
                    onClick={handleCreate}
                    sx={{
                        alignSelf: { xs: 'flex-start', sm: 'center' },
                        bgcolor: 'grey.900',
                        '&:hover': { bgcolor: 'grey.800' },
                    }}
                >
                    Add Company
                </Button>
            </Box>

            {companies.length === 0 ? (
                <Paper
                    variant="outlined"
                    sx={{
                        p: 6,
                        textAlign: 'center',
                        borderRadius: 3,
                        bgcolor: 'grey.50',
                    }}
                >
                    <BusinessRounded sx={{ fontSize: 48, color: 'grey.400', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                        No companies yet
                    </Typography>
                    <Typography variant="body2" color="text.secondary" mb={3}>
                        Create a company profile to start managing projects.
                    </Typography>
                    <Button variant="outlined" onClick={handleCreate}>
                        Create Company
                    </Button>
                </Paper>
            ) : (
                <Box
                    sx={{
                        display: 'grid',
                        gridTemplateColumns: isSingleCard
                            ? '1fr'
                            : { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
                        gap: 3,
                    }}
                >
                    {companies.map((company) => (
                        <Card
                            key={company.id}
                            variant="outlined"
                            onClick={() => handleEdit(company)}
                            sx={{
                                borderRadius: 3,
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                '&:hover': {
                                    borderColor: 'grey.300',
                                    boxShadow: 2,
                                },
                            }}
                        >
                            <CardContent
                                sx={{
                                    p: 2.5,
                                    '&:last-child': { pb: 2.5 },
                                }}
                            >
                                <Box
                                    display="flex"
                                    justifyContent="space-between"
                                    alignItems="flex-start"
                                    gap={1}
                                    mb={1}
                                >
                                    <Box minWidth={0}>
                                        <Typography variant="subtitle1" fontWeight="bold" color="text.primary">
                                            {company.name}
                                        </Typography>

                                        {company.isVerified && (
                                            <Box mt={0.5} display="flex" alignItems="center" gap={0.5}>
                                                <CheckCircleRounded sx={{ fontSize: 14, color: 'success.main' }} />
                                                <Typography variant="caption" color="success.main">
                                                    Verified
                                                </Typography>
                                            </Box>
                                        )}
                                    </Box>

                                    <IconButton
                                        size="small"
                                        onClick={(event) => handleMenuOpen(event, company)}
                                    >
                                        <MoreVertRounded sx={{ fontSize: 20 }} />
                                    </IconButton>
                                </Box>

                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    sx={{
                                        mb: 2,
                                        lineHeight: 1.5,
                                        display: '-webkit-box',
                                        WebkitLineClamp: 3,
                                        WebkitBoxOrient: 'vertical',
                                        overflow: 'hidden',
                                        minHeight: 63,
                                    }}
                                >
                                    {company.description || 'No company description added yet.'}
                                </Typography>

                                <Box display="flex" alignItems="center" gap={1} mb={2} flexWrap="wrap">
                                    {company.roles.slice(0, 2).map((role) => (
                                        <Chip
                                            key={role}
                                            label={role}
                                            size="small"
                                            sx={{
                                                height: 24,
                                                fontSize: '0.75rem',
                                                bgcolor: 'grey.100',
                                                color: 'grey.700',
                                                fontWeight: 500,
                                            }}
                                        />
                                    ))}

                                    {company.geographicalCoverage.slice(0, 2).map((region) => (
                                        <Chip
                                            key={region}
                                            label={region}
                                            size="small"
                                            sx={{
                                                height: 22,
                                                fontSize: '0.7rem',
                                                bgcolor: 'grey.50',
                                                color: 'grey.600',
                                                border: 1,
                                                borderColor: 'grey.200',
                                            }}
                                        />
                                    ))}
                                </Box>

                                <Box
                                    display="flex"
                                    alignItems="center"
                                    gap={2}
                                    color="text.secondary"
                                    mb={2}
                                    flexWrap="wrap"
                                >
                                    {company.country && (
                                        <Box display="flex" alignItems="center" gap={0.5}>
                                            <LocationOnRounded sx={{ fontSize: 14 }} />
                                            <Typography variant="caption">{company.country}</Typography>
                                        </Box>
                                    )}

                                    {company.websiteUrl && (
                                        <Box display="flex" alignItems="center" gap={0.5}>
                                            <LanguageRounded sx={{ fontSize: 14, color: 'grey.400' }} />
                                            <Typography variant="caption">
                                                {formatWebsiteLabel(company.websiteUrl)}
                                            </Typography>
                                        </Box>
                                    )}
                                </Box>

                                <Divider sx={{ mb: 2 }} />

                                <Box display="flex" alignItems="center" gap={3} color="text.secondary">
                                    <Box display="flex" alignItems="center" gap={0.5}>
                                        <FolderRounded sx={{ fontSize: 16 }} />
                                        <Typography variant="caption">
                                            {company.projectsCount} projects
                                        </Typography>
                                    </Box>

                                    <Box display="flex" alignItems="center" gap={0.5}>
                                        <GroupRounded sx={{ fontSize: 16 }} />
                                        <Typography variant="caption">
                                            Team managed in company page
                                        </Typography>
                                    </Box>
                                </Box>
                            </CardContent>
                        </Card>
                    ))}
                </Box>
            )}

            <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={handleMenuClose}>
                <MenuItem
                    onClick={() => {
                        if (selectedCompany) handleEdit(selectedCompany);
                        handleMenuClose();
                    }}
                >
                    <ListItemIcon>
                        <EditRounded fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Edit</ListItemText>
                </MenuItem>

                <MenuItem onClick={() => void handleCopyPublicLink()}>
                    <ListItemIcon>
                        <LinkRounded fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Copy public link</ListItemText>
                </MenuItem>

                <MenuItem onClick={() => void handleCopyInviteLink()}>
                    <ListItemIcon>
                        <PersonAddAltRounded fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Copy invite link</ListItemText>
                </MenuItem>

                <MenuItem
                    onClick={() => void handleDeleteCompany()}
                    sx={{ color: 'error.main' }}
                >
                    <ListItemIcon sx={{ color: 'error.main' }}>
                        <DeleteOutlineRounded fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Delete company</ListItemText>
                </MenuItem>
            </Menu>

            <Snackbar
                open={snackbarOpen}
                autoHideDuration={3000}
                onClose={() => setSnackbarOpen(false)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert
                    severity={snackbarSeverity}
                    variant="filled"
                    onClose={() => setSnackbarOpen(false)}
                >
                    {snackbarMessage}
                </Alert>
            </Snackbar>

            <CompanyWizard open={wizardOpen} onClose={handleWizardClose} />
        </Box>
    );
}