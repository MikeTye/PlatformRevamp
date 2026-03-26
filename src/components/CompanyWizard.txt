import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
    Avatar,
    Box,
    Button,
    Card,
    CardActionArea,
    Checkbox,
    Chip,
    FormControl,
    Grid,
    IconButton,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    Stack,
    TextField,
    Typography,
} from '@mui/material';
import CloseRounded from '@mui/icons-material/CloseRounded';
import CloudUploadRounded from '@mui/icons-material/CloudUploadRounded';
import CheckCircleRounded from '@mui/icons-material/CheckCircleRounded';
import RadioButtonUncheckedRounded from '@mui/icons-material/RadioButtonUncheckedRounded';

import { PROJECT_TYPE_OPTIONS } from '../constants/projectTypes';
import { COUNTRIES } from '../constants/countries';
import {
    COMPANY_ROLE_OPTIONS,
    REGION_OPTIONS,
    SERVICE_CATEGORY_OPTIONS,
} from '../constants/companies';

export type WizardCloseResult =
    | { completed: false }
    | { completed: true; companyId?: string | null; projectId?: string | null };

interface CompanyWizardProps {
    open: boolean;
    onClose: (result?: WizardCloseResult) => void;
    draft?: Partial<CompanyFormData>;
    onDraftChange?: (draft: Partial<CompanyFormData>) => void;
}

export interface CompanyFormData {
    name: string;
    description: string;
    primaryGeography: string;
    roles: string[];
    serviceCategories: string[];
    projectTypes: string[];
    otherProjectType: string;
    regions: string[];

    // new
    logoPreview?: string;
}

type CreateCompanyResponse = {
    id: string;
};

const INITIAL_FORM_DATA: CompanyFormData = {
    name: '',
    roles: [],
    primaryGeography: '',
    description: '',
    serviceCategories: [],
    projectTypes: [],
    otherProjectType: '',
    regions: [],
    logoPreview: undefined,
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000';

function buildInitialFormData(draft?: Record<string, unknown>): CompanyFormData {
    return {
        ...INITIAL_FORM_DATA,
        name: typeof draft?.name === 'string' ? draft.name : '',
        description: typeof draft?.description === 'string' ? draft.description : '',
        primaryGeography:
            typeof draft?.primaryGeography === 'string' ? draft.primaryGeography : '',
        roles: Array.isArray(draft?.roles)
            ? draft.roles.filter((v): v is string => typeof v === 'string')
            : [],
        serviceCategories: Array.isArray(draft?.serviceCategories)
            ? draft.serviceCategories.filter((v): v is string => typeof v === 'string')
            : [],
        projectTypes: Array.isArray(draft?.projectTypes)
            ? draft.projectTypes.filter((v): v is string => typeof v === 'string')
            : [],
        otherProjectType:
            typeof draft?.otherProjectType === 'string' ? draft.otherProjectType : '',
        regions: Array.isArray(draft?.regions)
            ? draft.regions.filter((v): v is string => typeof v === 'string')
            : [],

        logoPreview:
            typeof draft?.logoPreview === 'string' ? draft.logoPreview : undefined,
    };
}

export function CompanyWizard({
    open,
    onClose,
    draft,
    onDraftChange,
}: CompanyWizardProps) {
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [submitError, setSubmitError] = useState('');
    const [formData, setFormData] = useState<CompanyFormData>(() => buildInitialFormData(draft));
    const lastPushedDraftRef = useRef<string>('');

    useEffect(() => {
        if (!open) return;

        setFormData(buildInitialFormData(draft as Record<string, unknown> | undefined));

        const draftLogoPreview =
            draft && typeof draft.logoPreview === 'string' ? draft.logoPreview : null;

        setLogoPreview(draftLogoPreview);
        setLogoFile(null);
        setSubmitError('');
    }, [open]);

    const countryOptions = useMemo(
        () => COUNTRIES.map((item) => item.name),
        []
    );

    const handleClose = () => {
        onDraftChange?.({
            ...formData,
            logoPreview: logoPreview ?? undefined,
        });

        onClose({ completed: false });
    };

    const updateFormData = (
        updater: CompanyFormData | ((prev: CompanyFormData) => CompanyFormData)
    ) => {
        setFormData((prev) => {
            return typeof updater === 'function' ? updater(prev) : updater;
        });
    };

    useEffect(() => {
        if (!open) return;

        const nextDraft = {
            ...formData,
            logoPreview: logoPreview ?? undefined,
        };

        const serialized = JSON.stringify(nextDraft);
        if (lastPushedDraftRef.current === serialized) {
            return;
        }

        lastPushedDraftRef.current = serialized;
        onDraftChange?.(nextDraft);
    }, [formData, logoPreview, open, onDraftChange]);

    const handleCreate = async () => {
        setIsCreating(true);
        setSubmitError('');

        try {
            const created = await createCompany(formData, logoFile);

            onClose({
                completed: true,
                companyId: created.id,
            });
        } catch (error) {
            const message =
                error instanceof Error ? error.message : 'Failed to create company';
            setSubmitError(message);
        } finally {
            setIsCreating(false);
        }
    };

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            console.error('Logo must be an image');
            return;
        }

        if (file.size > 1 * 1024 * 1024) {
            console.error('Logo must be 1MB or smaller');
            return;
        }

        setLogoFile(file);

        const reader = new FileReader();
        reader.onloadend = () => {
            const preview = reader.result as string;
            setLogoPreview(preview);
        };
        reader.readAsDataURL(file);
    };

    const toggleRole = (role: string) => {
        updateFormData((prev) => ({
            ...prev,
            roles: prev.roles.includes(role) ?
                prev.roles.filter((r) => r !== role) :
                [...prev.roles, role]
        }));
    };

    const toggleSelection = (
        field: 'serviceCategories' | 'projectTypes' | 'regions',
        value: string
    ) => {
        updateFormData((prev) => {
            const current = prev[field];
            const exists = current.includes(value);
            const updated = exists
                ? current.filter((item) => item !== value)
                : [...current, value];

            if (field === 'projectTypes' && value === 'other' && exists) {
                return {
                    ...prev,
                    projectTypes: updated,
                    otherProjectType: '',
                };
            }

            return {
                ...prev,
                [field]: updated,
            };
        });
    };

    const canCreate = formData.name && formData.roles.length > 0;
    const isServiceProvider = formData.roles.includes('Service Provider');
    const isDeveloper = formData.roles.includes('Project Developer');
    if (!open) return null;
    return (
        <Box
            sx={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                bgcolor: 'white',
                zIndex: 1300,
                display: 'flex',
                flexDirection: 'column'
            }}>

            {/* Header */}
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
                    flexShrink: 0
                }}>

                <Box display="flex" alignItems="center" gap={2}>
                    <IconButton onClick={handleClose} size="small">
                        <CloseRounded
                            sx={{
                                fontSize: 20
                            }} />

                    </IconButton>
                    <Typography variant="h6" fontWeight="bold">
                        Add Company
                    </Typography>
                </Box>
                <Box display="flex" gap={2}>
                    <Button
                        onClick={handleClose}
                        sx={{
                            color: 'text.secondary'
                        }}>

                        Cancel
                    </Button>
                    <Button variant="contained" onClick={handleCreate} disabled={!canCreate || isCreating}>
                        {isCreating ? 'Creating Company...' : 'Create Company'}
                    </Button>
                </Box>
            </Box>

            {submitError ? (
                <Typography color="error" variant="body2" sx={{ mt: 2 }}>
                    {submitError}
                </Typography>
            ) : null}

            {/* Content */}
            <Box
                sx={{
                    flex: 1,
                    overflowY: 'auto',
                    p: {
                        xs: 2,
                        md: 4
                    }
                }}>

                <Box maxWidth={800} mx="auto">
                    <Stack spacing={4}>
                        {/* Company Snapshot Section */}
                        <Box>
                            <Typography variant="h5" fontWeight="bold" gutterBottom>
                                Company Snapshot
                            </Typography>
                            <Typography variant="body2" color="text.secondary" mb={3}>
                                Basic information about your organization.
                            </Typography>

                            <Paper
                                variant="outlined"
                                sx={{
                                    p: 3,
                                    borderRadius: 2
                                }}>

                                <Grid container spacing={3}>
                                    <Grid size={{ xs: 12, sm: 3 }}>
                                        <Typography variant="subtitle2" gutterBottom>
                                            Logo
                                        </Typography>
                                        <Box
                                            component="label"
                                            sx={{
                                                width: 100,
                                                height: 100,
                                                borderRadius: 2,
                                                border: '2px dashed',
                                                borderColor: 'grey.300',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                cursor: 'pointer',
                                                bgcolor: 'grey.50',
                                                overflow: 'hidden',
                                                '&:hover': {
                                                    bgcolor: 'grey.100',
                                                    borderColor: 'grey.400'
                                                }
                                            }}>

                                            <input
                                                type="file"
                                                hidden
                                                accept="image/*"
                                                onChange={handleLogoUpload} />

                                            {logoPreview ?
                                                <img
                                                    src={logoPreview}
                                                    alt="Logo"
                                                    style={{
                                                        width: '100%',
                                                        height: '100%',
                                                        objectFit: 'cover'
                                                    }} /> :

                                                formData.name ?
                                                    <Avatar
                                                        sx={{
                                                            width: 80,
                                                            height: 80,
                                                            bgcolor: 'grey.300',
                                                            fontSize: '1.5rem'
                                                        }}>

                                                        {formData.name.substring(0, 2).toUpperCase()}
                                                    </Avatar> :

                                                    <Box textAlign="center">
                                                        <CloudUploadRounded
                                                            sx={{
                                                                color: 'grey.400',
                                                                fontSize: 28
                                                            }} />

                                                        <Typography
                                                            variant="caption"
                                                            display="block"
                                                            color="text.secondary"
                                                            sx={{
                                                                mt: 0.5
                                                            }}>

                                                            Upload
                                                        </Typography>
                                                    </Box>
                                            }
                                        </Box>
                                    </Grid>

                                    {/* Company Name */}
                                    <Grid size={{ xs: 12, sm: 9 }}>
                                        <TextField
                                            label="Company Name"
                                            fullWidth
                                            value={formData.name}
                                            onChange={(e) =>
                                                updateFormData({
                                                    ...formData,
                                                    name: e.target.value
                                                })
                                            }
                                            placeholder="e.g. Borneo Carbon Partners"
                                            sx={{
                                                mb: 2
                                            }} />


                                        <TextField
                                            label="Short Description"
                                            fullWidth
                                            multiline
                                            rows={2}
                                            value={formData.description}
                                            onChange={(e) =>
                                                updateFormData({
                                                    ...formData,
                                                    description: e.target.value
                                                })
                                            }
                                            placeholder="Brief description of your organization..." />

                                    </Grid>
                                </Grid>
                            </Paper>
                        </Box>

                        {/* Primary Geography */}
                        <Box>
                            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                                Country
                            </Typography>
                            <FormControl fullWidth>
                                <InputLabel>Country</InputLabel>
                                <Select
                                    value={formData.primaryGeography}
                                    label="Country"
                                    onChange={(e) =>
                                        updateFormData({
                                            ...formData,
                                            primaryGeography: e.target.value
                                        })
                                    }>

                                    {countryOptions.map((country) => (
                                        <MenuItem key={country} value={country}>
                                            {country}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Box>

                        {/* Company Role(s) */}
                        <Box>
                            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                                Company Role(s)
                            </Typography>
                            <Typography variant="body2" color="text.secondary" mb={2}>
                                Select all that apply.
                            </Typography>
                            <Box display="flex" gap={2} flexWrap="wrap">
                                {COMPANY_ROLE_OPTIONS.map((role) => (
                                    <Card
                                        key={role.id}
                                        variant="outlined"
                                        sx={{
                                            flex: '1 1 200px',
                                            maxWidth: 300,
                                            borderColor: formData.roles.includes(role.id) ? 'primary.main' : 'grey.200',
                                            borderWidth: formData.roles.includes(role.id) ? 2 : 1,
                                            bgcolor: formData.roles.includes(role.id) ? 'primary.50' : 'transparent',
                                        }}
                                    >
                                        <CardActionArea onClick={() => toggleRole(role.id)} sx={{ p: 2 }}>
                                            <Box display="flex" alignItems="flex-start" gap={1.5}>
                                                {formData.roles.includes(role.id) ? (
                                                    <CheckCircleRounded color="primary" />
                                                ) : (
                                                    <RadioButtonUncheckedRounded sx={{ color: 'grey.400' }} />
                                                )}

                                                <Box>
                                                    <Typography variant="subtitle2" fontWeight="bold">
                                                        {role.label}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {role.description}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        </CardActionArea>
                                    </Card>
                                ))}
                            </Box>
                        </Box>

                        {/* Capabilities Section */}
                        <Box>
                            <Typography variant="h5" fontWeight="bold" gutterBottom>
                                Capabilities
                            </Typography>
                            <Typography variant="body2" color="text.secondary" mb={3}>
                                Help us match you with the right opportunities.
                            </Typography>

                            {/* Service Categories - Only for Service Providers */}
                            {isServiceProvider &&
                                <Paper
                                    variant="outlined"
                                    sx={{
                                        p: 3,
                                        borderRadius: 2,
                                        mb: 3
                                    }}>

                                    <Typography
                                        variant="subtitle2"
                                        fontWeight="bold"
                                        gutterBottom>

                                        Service Categories
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" mb={2}>
                                        Select the services your organization provides.
                                    </Typography>
                                    <Box display="flex" flexWrap="wrap" gap={1}>
                                        {SERVICE_CATEGORY_OPTIONS.map((service) =>
                                            <Chip
                                                key={service}
                                                label={service}
                                                onClick={() =>
                                                    toggleSelection('serviceCategories', service)
                                                }
                                                color={
                                                    formData.serviceCategories.includes(service) ?
                                                        'primary' :
                                                        'default'
                                                }
                                                variant={
                                                    formData.serviceCategories.includes(service) ?
                                                        'filled' :
                                                        'outlined'
                                                }
                                                sx={{
                                                    fontWeight: 500
                                                }} />

                                        )}
                                    </Box>
                                </Paper>
                            }

                            {/* Project Types - For both, but different labels */}
                            {(isDeveloper || isServiceProvider) &&
                                <Paper
                                    variant="outlined"
                                    sx={{
                                        p: 3,
                                        borderRadius: 2,
                                        mb: 3
                                    }}>

                                    <Typography
                                        variant="subtitle2"
                                        fontWeight="bold"
                                        gutterBottom>

                                        {isDeveloper ? 'Project Focus' : 'Project Types Supported'}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" mb={2}>
                                        Select all that apply.
                                    </Typography>
                                    <Grid container spacing={1.5}>
                                        {PROJECT_TYPE_OPTIONS.map((type) => (
                                            <Grid size={12} key={type.id}>
                                                <Card
                                                    variant="outlined"
                                                    sx={{
                                                        borderColor: formData.projectTypes.includes(type.id) ? 'primary.main' : 'grey.200',
                                                        borderWidth: formData.projectTypes.includes(type.id) ? 2 : 1,
                                                        bgcolor: formData.projectTypes.includes(type.id) ? 'primary.50' : 'transparent',
                                                        transition: 'all 0.15s',
                                                    }}
                                                >
                                                    <CardActionArea
                                                        onClick={() => toggleSelection('projectTypes', type.id)}
                                                        sx={{ p: 1.5 }}
                                                    >
                                                        <Box display="flex" alignItems="flex-start" gap={1}>
                                                            <Checkbox
                                                                checked={formData.projectTypes.includes(type.id)}
                                                                size="small"
                                                                sx={{ p: 0, mt: 0.25 }}
                                                            />

                                                            <Box>
                                                                <Typography variant="body2" fontWeight="bold">
                                                                    {type.label}
                                                                </Typography>
                                                                <Typography
                                                                    variant="caption"
                                                                    color="text.secondary"
                                                                    sx={{
                                                                        display: '-webkit-box',
                                                                        WebkitLineClamp: 2,
                                                                        WebkitBoxOrient: 'vertical',
                                                                        overflow: 'hidden',
                                                                    }}
                                                                >
                                                                    {type.description}
                                                                </Typography>
                                                            </Box>
                                                        </Box>
                                                    </CardActionArea>
                                                </Card>
                                            </Grid>
                                        ))}

                                        {/* Other option */}
                                        <Grid size={12}>
                                            <Card
                                                variant="outlined"
                                                sx={{
                                                    borderColor: formData.projectTypes.includes('other') ?
                                                        'primary.main' :
                                                        'grey.200',
                                                    borderWidth: formData.projectTypes.includes('other') ?
                                                        2 :
                                                        1,
                                                    bgcolor: formData.projectTypes.includes('other') ?
                                                        'primary.50' :
                                                        'transparent',
                                                    transition: 'all 0.15s'
                                                }}>

                                                <CardActionArea
                                                    onClick={() =>
                                                        toggleSelection('projectTypes', 'other')
                                                    }
                                                    sx={{
                                                        p: 1.5
                                                    }}>

                                                    <Box display="flex" alignItems="flex-start" gap={1}>
                                                        <Checkbox
                                                            checked={formData.projectTypes.includes('other')}
                                                            size="small"
                                                            sx={{
                                                                p: 0,
                                                                mt: 0.25
                                                            }} />

                                                        <Box flex={1}>
                                                            <Typography variant="body2" fontWeight="bold">
                                                                Other
                                                            </Typography>
                                                            <Typography
                                                                variant="caption"
                                                                color="text.secondary">

                                                                Specify a project type not listed above.
                                                            </Typography>
                                                        </Box>
                                                    </Box>
                                                </CardActionArea>
                                                {formData.projectTypes.includes('other') &&
                                                    <Box
                                                        px={1.5}
                                                        pb={1.5}
                                                        onClick={(e) => e.stopPropagation()}>

                                                        <TextField
                                                            fullWidth
                                                            size="small"
                                                            placeholder="Describe the project type..."
                                                            value={formData.otherProjectType}
                                                            onChange={(e) =>
                                                                updateFormData({
                                                                    ...formData,
                                                                    otherProjectType: e.target.value
                                                                })
                                                            }
                                                            autoFocus
                                                            sx={{
                                                                bgcolor: 'white',
                                                                borderRadius: 1
                                                            }} />

                                                    </Box>
                                                }
                                            </Card>
                                        </Grid>
                                    </Grid>
                                </Paper>
                            }

                            {/* Regions of Operation */}
                            {formData.roles.length > 0 &&
                                <Paper
                                    variant="outlined"
                                    sx={{
                                        p: 3,
                                        borderRadius: 2
                                    }}>

                                    <Typography
                                        variant="subtitle2"
                                        fontWeight="bold"
                                        gutterBottom>

                                        Regions of Operation
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" mb={2}>
                                        Where does your organization operate?
                                    </Typography>
                                    <Box display="flex" flexWrap="wrap" gap={1}>
                                        {REGION_OPTIONS.map((region) =>
                                            <Chip
                                                key={region}
                                                label={region}
                                                onClick={() => toggleSelection('regions', region)}
                                                color={
                                                    formData.regions.includes(region) ?
                                                        'primary' :
                                                        'default'
                                                }
                                                variant={
                                                    formData.regions.includes(region) ?
                                                        'filled' :
                                                        'outlined'
                                                }
                                                sx={{
                                                    fontWeight: 500
                                                }} />

                                        )}
                                    </Box>
                                </Paper>
                            }
                        </Box>
                    </Stack>
                </Box>
            </Box>
        </Box>);

}

async function createCompany(
    formData: CompanyFormData,
    logoFile: File | null
): Promise<CreateCompanyResponse> {
    const body = new FormData();

    body.append('name', formData.name);
    body.append('description', formData.description);
    body.append('primaryGeography', formData.primaryGeography);
    body.append('roles', JSON.stringify(formData.roles));
    body.append('serviceCategories', JSON.stringify(formData.serviceCategories));
    body.append('projectTypes', JSON.stringify(formData.projectTypes));
    body.append('otherProjectType', formData.otherProjectType);
    body.append('regions', JSON.stringify(formData.regions));

    if (logoFile) {
        body.append('logo', logoFile);
    }

    const response = await fetch(`${API_BASE_URL}/companies`, {
        method: 'POST',
        credentials: 'include',
        body,
    });

    if (!response.ok) {
        let message = `Failed to create company: ${response.status}`;
        try {
            const payload = await response.json();
            message =
                payload?.error ||
                payload?.message ||
                payload?.details ||
                message;
        } catch {
            // ignore
        }
        throw new Error(message);
    }

    const payload = await response.json();

    return {
        id: String(payload?.id ?? payload?.data?.id ?? payload?.companyId ?? ''),
    };
}