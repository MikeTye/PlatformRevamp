import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
    Alert,
    Box,
    Button,
    Chip,
    CircularProgress,
    Divider,
    Fade,
    FormControl,
    FormControlLabel,
    IconButton,
    InputLabel,
    MenuItem,
    Paper,
    Radio,
    RadioGroup,
    Select,
    Stack,
    TextField,
    Typography,
} from '@mui/material';
import AddRounded from '@mui/icons-material/AddRounded';
import ChevronLeftRounded from '@mui/icons-material/ChevronLeftRounded';
import ChevronRightRounded from '@mui/icons-material/ChevronRightRounded';
import CloseRounded from '@mui/icons-material/CloseRounded';
import InfoRounded from '@mui/icons-material/InfoRounded';
import ProjectLocationMap from './ProjectLocationMap';

import { PROJECT_TYPE_OPTIONS } from '../constants/projectTypes';
import { PROJECT_STAGE_OPTIONS } from '../constants/projectStages';
import { COUNTRIES, getStatesForCountry } from '../constants/countries';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000';

export type WizardCloseResult =
    | { completed: false }
    | { completed: true; companyId?: string | null; projectId?: string | null };

type CompanyOption = {
    id: string;
    name: string;
};

type ProjectWizardProps = {
    open: boolean;
    hasCompanies: boolean;
    onClose: (result?: WizardCloseResult) => void;
    draft?: Partial<ProjectFormData>;
    onDraftChange?: (draft: Partial<ProjectFormData>) => void;
    preferredCompanyId?: string | null;
    isOnboarding?: boolean;
};

export type ProjectFormData = {
    companyId: string;
    name: string;
    tagline: string;
    type: string;
    stage: string;
    visibility: 'Public' | 'Private';
    country: string;
    state: string;
    coordinates: {
        lat: string;
        lng: string;
    };
    story: string;
    approach: string;
    cobenefitItems: Array<{
        type: string;
        note: string;
    }>;
};

type CreateProjectResponse = {
    id: string;
};

const steps = ['Snapshot', 'Location', 'Story'];

const COBENEFIT_OPTIONS = [
    { label: '🌿 Biodiversity', value: 'Biodiversity' },
    { label: '👥 Community Livelihoods', value: 'Community Livelihoods' },
    { label: '💧 Water Quality', value: 'Water Quality' },
    { label: '🌱 Soil Health', value: 'Soil Health' },
    { label: '⚖️ Gender Equity', value: 'Gender Equity' },
    { label: '🍚 Food Security', value: 'Food Security' },
    { label: '🏛️ Cultural Heritage', value: 'Cultural Heritage' },
    { label: '📚 Education & Training', value: 'Education & Training' },
    { label: '❤️ Health & Wellbeing', value: 'Health & Wellbeing' },
    { label: '💰 Economic Development', value: 'Economic Development' },
] as const;

const INITIAL_FORM_DATA: ProjectFormData = {
    companyId: '',
    name: '',
    tagline: '',
    type: '',
    stage: 'Concept',
    visibility: 'Public',
    country: '',
    state: '',
    coordinates: {
        lat: '',
        lng: '',
    },
    story: '',
    approach: '',
    cobenefitItems: [],
};

function buildInitialProjectFormData(
    draft?: Partial<ProjectFormData>,
    preferredCompanyId?: string | null
): ProjectFormData {
    return {
        ...INITIAL_FORM_DATA,
        companyId:
            typeof draft?.companyId === 'string' && draft.companyId.trim()
                ? draft.companyId
                : preferredCompanyId ?? '',
        name: typeof draft?.name === 'string' ? draft.name : '',
        tagline: typeof draft?.tagline === 'string' ? draft.tagline : '',
        type: typeof draft?.type === 'string' ? draft.type : '',
        stage: typeof draft?.stage === 'string' ? draft.stage : 'Concept',
        visibility:
            draft?.visibility === 'Private' ? 'Private' : 'Public',
        country: typeof draft?.country === 'string' ? draft.country : '',
        state: typeof draft?.state === 'string' ? draft.state : '',
        coordinates: {
            lat:
                typeof draft?.coordinates?.lat === 'string'
                    ? draft.coordinates.lat
                    : '',
            lng:
                typeof draft?.coordinates?.lng === 'string'
                    ? draft.coordinates.lng
                    : '',
        },
        story: typeof draft?.story === 'string' ? draft.story : '',
        approach: typeof draft?.approach === 'string' ? draft.approach : '',
        cobenefitItems: Array.isArray(draft?.cobenefitItems)
            ? draft.cobenefitItems.filter(
                (item): item is { type: string; note: string } =>
                    Boolean(item) &&
                    typeof item === 'object' &&
                    typeof item.type === 'string' &&
                    typeof item.note === 'string'
            )
            : [],
    };
}

function isValidLatitude(value: string): boolean {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed >= -90 && parsed <= 90;
}

function isValidLongitude(value: string): boolean {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed >= -180 && parsed <= 180;
}

function toNullableNumber(value: string): number | null {
    const trimmed = value.trim();
    if (!trimmed) return null;

    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : null;
}

export function ProjectWizard({
    open,
    onClose,
    hasCompanies,
    draft,
    onDraftChange,
    preferredCompanyId,
    isOnboarding = false,
}: ProjectWizardProps) {

    const [activeStep, setActiveStep] = useState(0);
    const [formData, setFormData] = useState<ProjectFormData>(() =>
        buildInitialProjectFormData(draft, preferredCompanyId)
    );

    const [companies, setCompanies] = useState<CompanyOption[]>([]);
    const [isLoadingCompanies, setIsLoadingCompanies] = useState(false);

    const [isCreating, setIsCreating] = useState(false);

    const [cobenefitType, setCobenefitType] = useState('');
    const [cobenefitNote, setCobenefitNote] = useState('');

    const [errorMessage, setErrorMessage] = useState('');
    const [infoMessage, setInfoMessage] = useState('');

    const contentScrollRef = useRef<HTMLDivElement | null>(null);

    const availableStates = useMemo(
        () => getStatesForCountry(formData.country),
        [formData.country]
    );

    useEffect(() => {
        if (!open) {
            resetWizard();
            return;
        }

        setActiveStep(0);
        setFormData(buildInitialProjectFormData(draft, preferredCompanyId));
        setIsCreating(false);
        setErrorMessage('');
        setInfoMessage('');
        setCompanies([]);
        setIsLoadingCompanies(false);

        void loadCompanies();
    }, [open, preferredCompanyId]);

    useEffect(() => {
        if (!open) return;
        contentScrollRef.current?.scrollTo({ top: 0, behavior: 'auto' });
    }, [activeStep, open]);

    const resetWizard = () => {
        setActiveStep(0);
        setFormData(buildInitialProjectFormData(undefined, preferredCompanyId));
        setIsCreating(false);
        setCobenefitType('');
        setCobenefitNote('');
        setErrorMessage('');
        setInfoMessage('');
        setCompanies([]);
        setIsLoadingCompanies(false);
    };

    const selectedCompanyId =
        companies.some((company) => company.id === formData.companyId)
            ? formData.companyId
            : "";

    const updateForm = (patch: Partial<ProjectFormData>) => {
        setFormData((prev) => ({
            ...prev,
            ...patch,
        }));
    };

    const updateCoordinates = (patch: Partial<ProjectFormData['coordinates']>) => {
        setFormData((prev) => ({
            ...prev,
            coordinates: {
                ...prev.coordinates,
                ...patch,
            },
        }));
    };

    useEffect(() => {
        if (!open || !onDraftChange) return;
        onDraftChange(formData);
    }, [formData, open]);

    const loadCompanies = async () => {
        setIsLoadingCompanies(true);
        setErrorMessage('');

        try {
            const items = await fetchCompaniesForWizard();
            setCompanies(items);

            setFormData((prev) => {
                const hasCurrentCompany =
                    !!prev.companyId && items.some((item) => item.id === prev.companyId);

                if (hasCurrentCompany) {
                    return prev;
                }

                if (
                    preferredCompanyId &&
                    items.some((item) => item.id === preferredCompanyId)
                ) {
                    return {
                        ...prev,
                        companyId: preferredCompanyId,
                    };
                }

                if (items.length === 1) {
                    return {
                        ...prev,
                        companyId: items[0].id,
                    };
                }

                return prev;
            });
        } catch (error) {
            console.error('Failed to load companies for project wizard:', error);
            setErrorMessage('Unable to load companies right now.');
            setCompanies([]);
        } finally {
            setIsLoadingCompanies(false);
        }
    };

    const handleNext = () => {
        if (activeStep < steps.length - 1) {
            setActiveStep((prev) => prev + 1);
            setErrorMessage('');
            setInfoMessage('');
        }
    };

    const handleBack = () => {
        setActiveStep((prev) => Math.max(prev - 1, 0));
        setErrorMessage('');
        setInfoMessage('');
    };

    const handleClose = () => {
        onDraftChange?.(formData);
        onClose({ completed: false });
    };

    const handleCreate = async () => {
        setIsCreating(true);
        setErrorMessage('');
        setInfoMessage('');

        try {
            const createdProject = await createProject(formData);

            onClose({
                completed: true,
                companyId: formData.companyId,
                projectId: createdProject.id,
            });
        } catch (error) {
            console.error('Failed to create project:', error);
            setErrorMessage(
                error instanceof Error ? error.message : 'Unable to create project right now.'
            );
        } finally {
            setIsCreating(false);
        }
    };

    const canProceed = () => {
        switch (activeStep) {
            case 0:
                return Boolean(
                    hasCompanies &&
                    formData.companyId &&
                    formData.name.trim() &&
                    formData.type &&
                    formData.stage
                );
            case 1:
                return Boolean(formData.country);
            case 2:
                return true;
            default:
                return false;
        }
    };

    const selectedProjectType = PROJECT_TYPE_OPTIONS.find(
        (item) => item.id === formData.type
    );

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
                        Create Project
                    </Typography>

                    <Divider
                        orientation="vertical"
                        flexItem
                        sx={{
                            mx: 1,
                            height: 24,
                            alignSelf: 'center',
                        }}
                    />

                    <Typography variant="body2" color="text.secondary">
                        Step {activeStep + 1} of {steps.length}: {steps[activeStep]}
                    </Typography>
                </Box>

                <Button onClick={handleClose} sx={{ color: 'text.secondary' }}>
                    Cancel
                </Button>
            </Box>

            <Box
                sx={{
                    display: 'flex',
                    gap: 1,
                    px: 3,
                    py: 2,
                    bgcolor: 'grey.50',
                    borderBottom: 1,
                    borderColor: 'grey.200',
                }}
            >
                {steps.map((step, index) => (
                    <Box
                        key={step}
                        sx={{
                            flex: 1,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                        }}
                    >
                        <Box
                            sx={{
                                width: 24,
                                height: 24,
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                bgcolor: index <= activeStep ? 'grey.900' : 'grey.200',
                                color: index <= activeStep ? 'white' : 'grey.500',
                                fontSize: '0.75rem',
                                fontWeight: 'bold',
                            }}
                        >
                            {index + 1}
                        </Box>

                        <Typography
                            variant="caption"
                            fontWeight={index === activeStep ? 'bold' : 'normal'}
                            color={index <= activeStep ? 'text.primary' : 'text.secondary'}
                        >
                            {step}
                        </Typography>

                        {index < steps.length - 1 && (
                            <Box
                                sx={{
                                    flex: 1,
                                    height: 2,
                                    bgcolor: index < activeStep ? 'grey.900' : 'grey.200',
                                    ml: 1,
                                }}
                            />
                        )}
                    </Box>
                ))}
            </Box>

            <Box
                ref={contentScrollRef}
                sx={{
                    flex: 1,
                    overflowY: 'auto',
                    p: { xs: 2, md: 4 },
                }}
            >
                <Box maxWidth={720} mx="auto">
                    <Fade in key={activeStep}>
                        <Box>
                            {!hasCompanies && (
                                <Alert severity="warning" sx={{ mb: 3 }}>
                                    You need to create a company first before creating a project.
                                </Alert>
                            )}

                            {errorMessage && (
                                <Alert severity="error" sx={{ mb: 3 }}>
                                    {errorMessage}
                                </Alert>
                            )}

                            {infoMessage && (
                                <Alert severity="info" sx={{ mb: 3 }}>
                                    {infoMessage}
                                </Alert>
                            )}

                            {activeStep === 0 && (
                                <Stack spacing={4}>
                                    <Box>
                                        <Typography variant="h5" fontWeight="bold" gutterBottom>
                                            Project Snapshot
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            The minimum information needed to create a public project
                                            page.
                                        </Typography>
                                    </Box>

                                    {isOnboarding && (
                                        <>
                                            <Paper
                                                variant="outlined"
                                                sx={{
                                                    p: 3,
                                                    borderRadius: 2,
                                                    bgcolor: 'grey.50',
                                                }}
                                            >
                                                <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                                                    Create your first project
                                                </Typography>

                                                <Typography variant="body2" color="text.secondary">
                                                    Enter the basic project details below. You can add documents, media,
                                                    registry information, and deeper project content after onboarding.
                                                </Typography>
                                            </Paper>
                                        </>
                                    )}

                                    <Stack spacing={3}>
                                        <FormControl fullWidth disabled={!hasCompanies || isLoadingCompanies}>
                                            <InputLabel shrink id="project-company-label">
                                                Developer Organization
                                            </InputLabel>

                                            <Select
                                                labelId="project-company-label"
                                                value={formData.companyId ?? ''}
                                                label="Developer Organization"
                                                displayEmpty
                                                notched
                                                onChange={(e) =>
                                                    updateForm({ companyId: String(e.target.value) })
                                                }
                                                renderValue={(selected) => {
                                                    if (!selected) {
                                                        return (
                                                            <Box component="span" sx={{ color: 'text.disabled' }}>
                                                                Select developer organization
                                                            </Box>
                                                        );
                                                    }

                                                    const selectedCompany = companies.find((company) => company.id === selected);
                                                    return selectedCompany?.name ?? '';
                                                }}
                                            >
                                                <MenuItem value="" disabled>
                                                    Select developer organization
                                                </MenuItem>

                                                {companies.map((company) => (
                                                    <MenuItem key={company.id} value={company.id}>
                                                        {company.name}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                        {isLoadingCompanies && (
                                            <Box display="flex" alignItems="center" gap={1}>
                                                <CircularProgress size={16} />
                                                <Typography variant="body2" color="text.secondary">
                                                    Loading companies...
                                                </Typography>
                                            </Box>
                                        )}

                                        <TextField
                                            label="Project Name"
                                            fullWidth
                                            value={formData.name}
                                            onChange={(e) => updateForm({ name: e.target.value })}
                                            placeholder="e.g., Sarawak Peatland Restoration Initiative"
                                        />

                                        <TextField
                                            label="Short Tagline"
                                            fullWidth
                                            value={formData.tagline}
                                            onChange={(e) => updateForm({ tagline: e.target.value })}
                                            placeholder="One sentence describing the project"
                                            helperText="Shown in project listings"
                                        />

                                        <Box>
                                            <Typography
                                                variant="subtitle2"
                                                fontWeight="bold"
                                                gutterBottom
                                            >
                                                Project Type
                                            </Typography>

                                            <Box
                                                sx={{
                                                    display: 'flex',
                                                    flexWrap: 'wrap',
                                                    gap: 1,
                                                }}
                                            >
                                                {PROJECT_TYPE_OPTIONS.map((type) => (
                                                    <Chip
                                                        key={type.id}
                                                        label={type.label}
                                                        onClick={() => updateForm({ type: type.id })}
                                                        color={
                                                            formData.type === type.id ? 'primary' : 'default'
                                                        }
                                                        variant={
                                                            formData.type === type.id ? 'filled' : 'outlined'
                                                        }
                                                        sx={{
                                                            px: 1,
                                                            py: 2.5,
                                                            fontSize: '0.875rem',
                                                            fontWeight: formData.type === type.id ? 600 : 400,
                                                        }}
                                                    />
                                                ))}
                                            </Box>

                                            {selectedProjectType && (
                                                <Typography
                                                    variant="caption"
                                                    color="text.secondary"
                                                    sx={{ mt: 1, display: 'block' }}
                                                >
                                                    {selectedProjectType.description}
                                                </Typography>
                                            )}
                                        </Box>

                                        <Box>
                                            <Typography
                                                variant="subtitle2"
                                                fontWeight="bold"
                                                gutterBottom
                                            >
                                                Current Stage
                                            </Typography>

                                            <RadioGroup
                                                value={formData.stage}
                                                onChange={(e) =>
                                                    updateForm({ stage: String(e.target.value) })
                                                }
                                            >
                                                <Stack spacing={1}>
                                                    {PROJECT_STAGE_OPTIONS.map((stage) => (
                                                        <Paper
                                                            key={stage.value}
                                                            variant="outlined"
                                                            sx={{
                                                                p: 2,
                                                                cursor: 'pointer',
                                                                borderColor:
                                                                    formData.stage === stage.value
                                                                        ? 'primary.main'
                                                                        : 'grey.200',
                                                                bgcolor:
                                                                    formData.stage === stage.value
                                                                        ? 'primary.50'
                                                                        : 'transparent',
                                                                '&:hover': {
                                                                    borderColor: 'primary.main',
                                                                    bgcolor: 'grey.50',
                                                                },
                                                                transition: 'all 0.15s ease',
                                                            }}
                                                            onClick={() =>
                                                                updateForm({ stage: stage.value })
                                                            }
                                                        >
                                                            <FormControlLabel
                                                                value={stage.value}
                                                                control={<Radio size="small" />}
                                                                label={
                                                                    <Box>
                                                                        <Typography
                                                                            variant="body2"
                                                                            fontWeight="medium"
                                                                        >
                                                                            {stage.label}
                                                                        </Typography>
                                                                        <Typography
                                                                            variant="caption"
                                                                            color="text.secondary"
                                                                            sx={{ display: 'block', mt: 0.25 }}
                                                                        >
                                                                            {stage.description}
                                                                        </Typography>
                                                                    </Box>
                                                                }
                                                                sx={{
                                                                    m: 0,
                                                                    width: '100%',
                                                                    alignItems: 'flex-start',
                                                                }}
                                                            />
                                                        </Paper>
                                                    ))}
                                                </Stack>
                                            </RadioGroup>
                                        </Box>

                                        <FormControl fullWidth>
                                            <InputLabel>Visibility</InputLabel>
                                            <Select
                                                value={formData.visibility}
                                                label="Visibility"
                                                onChange={(e) =>
                                                    updateForm({
                                                        visibility: e.target.value as 'Public' | 'Private',
                                                    })
                                                }
                                            >
                                                <MenuItem value="Public">
                                                    Public - Visible to everyone
                                                </MenuItem>
                                                <MenuItem value="Private">
                                                    Private - Only visible to team
                                                </MenuItem>
                                            </Select>
                                        </FormControl>
                                    </Stack>
                                </Stack>
                            )}

                            {activeStep === 1 && (
                                <Stack spacing={4}>
                                    <Box>
                                        <Typography variant="h5" fontWeight="bold" gutterBottom>
                                            Location
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Where is the project located? Select on the map or enter
                                            details.
                                        </Typography>
                                    </Box>

                                    <FormControl fullWidth>
                                        <InputLabel>Country</InputLabel>
                                        <Select
                                            value={formData.country}
                                            label="Country"
                                            onChange={(e) =>
                                                updateForm({
                                                    country: String(e.target.value),
                                                    state: '',
                                                })
                                            }
                                        >
                                            {COUNTRIES.map((country) => (
                                                <MenuItem key={country.name} value={country.name}>
                                                    {country.name}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>

                                    {availableStates.length > 0 ? (
                                        <FormControl fullWidth>
                                            <InputLabel>State / Region</InputLabel>
                                            <Select
                                                value={formData.state}
                                                label="State / Region"
                                                onChange={(e) =>
                                                    updateForm({ state: String(e.target.value) })
                                                }
                                            >
                                                {availableStates.map((state) => (
                                                    <MenuItem key={state} value={state}>
                                                        {state}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    ) : (
                                        <TextField
                                            label="Region or State"
                                            fullWidth
                                            value={formData.state}
                                            onChange={(e) => updateForm({ state: e.target.value })}
                                            placeholder="e.g., Sarawak, Central Kalimantan"
                                        />
                                    )}

                                    <Paper
                                        variant="outlined"
                                        sx={{
                                            borderRadius: 2,
                                            overflow: 'hidden',
                                        }}
                                    >
                                        <ProjectLocationMap
                                            lat={formData.coordinates.lat}
                                            lng={formData.coordinates.lng}
                                            onChange={({ lat, lng }) => updateCoordinates({ lat, lng })}
                                            height={360}
                                        />

                                        <Box
                                            p={2}
                                            bgcolor="grey.50"
                                            borderTop={1}
                                            borderColor="grey.200"
                                        >
                                            <Typography
                                                variant="caption"
                                                color="text.secondary"
                                                display="block"
                                                mb={1.5}
                                            >
                                                Click the map to drop a pin, or enter coordinates manually:
                                            </Typography>

                                            <Box display="flex" gap={2}>
                                                <TextField
                                                    label="Latitude"
                                                    fullWidth
                                                    size="small"
                                                    value={formData.coordinates.lat}
                                                    onChange={(e) => updateCoordinates({ lat: e.target.value })}
                                                    placeholder="e.g., 2.550000"
                                                    error={
                                                        Boolean(formData.coordinates.lat) &&
                                                        !isValidLatitude(formData.coordinates.lat)
                                                    }
                                                    helperText={
                                                        Boolean(formData.coordinates.lat) &&
                                                            !isValidLatitude(formData.coordinates.lat)
                                                            ? 'Latitude must be between -90 and 90.'
                                                            : ' '
                                                    }
                                                />

                                                <TextField
                                                    label="Longitude"
                                                    fullWidth
                                                    size="small"
                                                    value={formData.coordinates.lng}
                                                    onChange={(e) => updateCoordinates({ lng: e.target.value })}
                                                    placeholder="e.g., 113.050000"
                                                    error={
                                                        Boolean(formData.coordinates.lng) &&
                                                        !isValidLongitude(formData.coordinates.lng)
                                                    }
                                                    helperText={
                                                        Boolean(formData.coordinates.lng) &&
                                                            !isValidLongitude(formData.coordinates.lng)
                                                            ? 'Longitude must be between -180 and 180.'
                                                            : ' '
                                                    }
                                                />
                                            </Box>
                                        </Box>
                                    </Paper>
                                </Stack>
                            )}

                            {activeStep === 2 && (
                                <Stack spacing={4}>
                                    <Box>
                                        <Typography variant="h5" fontWeight="bold" gutterBottom>
                                            Project Story
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Share the context and approach of your project. This is
                                            optional.
                                        </Typography>
                                    </Box>

                                    <TextField
                                        label="Problem and Context"
                                        fullWidth
                                        multiline
                                        minRows={4}
                                        maxRows={10}
                                        value={formData.story}
                                        onChange={(e) => updateForm({ story: e.target.value })}
                                        placeholder="What problem does this project address? What is the context?"
                                        helperText="You can add or refine this later on the project page"
                                    />

                                    <TextField
                                        label="Project Approach"
                                        fullWidth
                                        multiline
                                        minRows={4}
                                        maxRows={10}
                                        value={formData.approach}
                                        onChange={(e) => updateForm({ approach: e.target.value })}
                                        placeholder="How does the project work? What methods or activities are involved?"
                                        helperText="You can add or refine this later on the project page"
                                    />

                                    <Paper
                                        variant="outlined"
                                        sx={{
                                            p: 3,
                                            borderRadius: 2,
                                            bgcolor: 'grey.50',
                                        }}
                                    >
                                        <Box display="flex" alignItems="flex-start" gap={2}>
                                            <InfoRounded
                                                sx={{
                                                    color: 'grey.500',
                                                    mt: 0.5,
                                                }}
                                            />

                                            <Box>
                                                <Typography
                                                    variant="subtitle2"
                                                    fontWeight="bold"
                                                    gutterBottom
                                                >
                                                    What happens next?
                                                </Typography>

                                                <Typography variant="body2" color="text.secondary">
                                                    After creating your project, you can continue adding
                                                    media, documents, registry details, updates, and other
                                                    project information from the project page.
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </Paper>
                                </Stack>
                            )}
                        </Box>
                    </Fade>
                </Box>
            </Box>

            <Box
                sx={{
                    height: 72,
                    borderTop: 1,
                    borderColor: 'grey.200',
                    display: 'flex',
                    alignItems: 'center',
                    px: { xs: 2, md: 4 },
                    bgcolor: 'white',
                }}
            >
                {isOnboarding && (
                    <Button
                        disabled={activeStep === 0 || isCreating}
                        onClick={handleBack}
                        startIcon={<ChevronLeftRounded sx={{ fontSize: 16 }} />}
                        sx={{ color: 'text.secondary' }}
                    >
                        Back
                    </Button>
                )}

                <Box display="flex" gap={2} sx={{ ml: 'auto' }}>
                    {activeStep === steps.length - 1 ? (
                        <Button
                            variant="contained"
                            onClick={handleCreate}
                            disabled={!canProceed() || isCreating}
                            size="large"
                            sx={{ textTransform: 'none', px: 4 }}
                        >
                            {isCreating ? 'Creating Project...' : 'Create Project'}
                        </Button>
                    ) : (
                        <Button
                            variant="contained"
                            onClick={handleNext}
                            disabled={!canProceed()}
                            endIcon={<ChevronRightRounded sx={{ fontSize: 16 }} />}
                            size="large"
                            sx={{ textTransform: 'none', px: 4 }}
                        >
                            Continue
                        </Button>
                    )}
                </Box>
            </Box>
        </Box>
    );
}

async function fetchCompaniesForWizard(): Promise<CompanyOption[]> {
    const response = await fetch(`${API_BASE_URL}/companies?scope=mine&page=1&pageSize=100`, {
        method: 'GET',
        credentials: 'include',
        headers: {
            Accept: 'application/json',
        },
    });

    if (!response.ok) {
        throw new Error(`Failed to load companies: ${response.status}`);
    }

    const payload = await response.json();

    const rawItems = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.items)
            ? payload.items
            : Array.isArray(payload?.data)
                ? payload.data
                : Array.isArray(payload?.data?.items)
                    ? payload.data.items
                    : [];

    return rawItems
        .map((item: any) => ({
            id: String(item.id ?? ''),
            name: String(
                item.displayName ??
                item.display_name ??
                item.legalName ??
                item.legal_name ??
                item.name ??
                ''
            ).trim(),
        }))
        .filter((item: CompanyOption) => item.id && item.name);
}

async function createProject(
    formData: ProjectFormData
): Promise<CreateProjectResponse> {
    const lat = toNullableNumber(formData.coordinates.lat);
    const lng = toNullableNumber(formData.coordinates.lng);

    const response = await fetch(`${API_BASE_URL}/projects`, {
        method: 'POST',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
        },
        body: JSON.stringify({
            companyId: formData.companyId,
            name: formData.name,
            tagline: formData.tagline,
            type: formData.type,
            stage: formData.stage,
            visibility: formData.visibility,
            country: formData.country,
            state: formData.state,
            coordinates:
                lat !== null && lng !== null
                    ? {
                        lat,
                        lng,
                    }
                    : null,
            story: formData.story,
            approach: formData.approach,
            // cobenefitItems: formData.cobenefitItems,
            cobenefitItems: [],
        }),
    });

    if (!response.ok) {
        throw new Error(`Failed to create project: ${response.status}`);
    }

    const payload = await response.json();

    return {
        id: String(payload?.id ?? payload?.data?.id ?? payload?.projectId ?? ''),
    };
}