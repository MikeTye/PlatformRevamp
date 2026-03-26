import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    Alert,
    Autocomplete,
    Avatar,
    Box,
    Button,
    Chip,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    Divider,
    FormControl,
    IconButton,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    Slide,
    Snackbar,
    Stack,
    TextField,
    Typography,
} from '@mui/material';
import PersonOutlineRounded from '@mui/icons-material/PersonOutlineRounded';
import AddRounded from '@mui/icons-material/AddRounded';
import DeleteOutlineRounded from '@mui/icons-material/DeleteOutlineRounded';
import CloudUploadRounded from '@mui/icons-material/CloudUploadRounded';
import LogoutRounded from '@mui/icons-material/LogoutRounded';

import countriesJson from "../data/countries.json";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

type CountryItem = {
    name: string;
    states?: string[];
};

const countries = (countriesJson as CountryItem[])
    .map((c) => c.name)
    .sort((a, b) => a.localeCompare(b));

type CompanyOption = {
    id: string;
    name: string;
};

type AffiliationItem = {
    id?: string;
    companyId: string | null;
    companyName: string;
    role: string;
    permission: 'creator' | 'viewer';
};

type AccountPayload = {
    user: {
        id: string;
        email: string;
    };
    profile: {
        fullName: string;
        headline: string;
        jobTitle: string;
        bio: string;
        phoneNumber: string;
        contactEmail: string;
        country: string;
        city: string;
        timezone: string;
        roleType: string;
        expertiseTags: string[];
        serviceOfferings: string[];
        sectors: string[];
        standards: string[];
        languages: string[];
        personalWebsite: string;
        linkedinUrl: string;
        portfolioUrl: string;
        isPublic: boolean;
        showPhone: boolean;
        showContactEmail: boolean;
    };
    affiliations: AffiliationItem[];
};

type SaveAccountPayload = {
    profile: AccountPayload['profile'];
    affiliations: Array<{
        id?: string;
        companyId: string | null;
        role: string;
        permission: 'creator' | 'viewer';
    }>;
};

// Country codes with flags and full names, sorted by country name
const countryCodes = [
{
  code: '+86',
  country: 'CN',
  name: 'China',
  flag: '🇨🇳'
},
{
  code: '+1',
  country: 'CA',
  name: 'Canada',
  flag: '🇨🇦'
},
{
  code: '+49',
  country: 'DE',
  name: 'Germany',
  flag: '🇩🇪'
},
{
  code: '+91',
  country: 'IN',
  name: 'India',
  flag: '🇮🇳'
},
{
  code: '+62',
  country: 'ID',
  name: 'Indonesia',
  flag: '🇮🇩'
},
{
  code: '+81',
  country: 'JP',
  name: 'Japan',
  flag: '🇯🇵'
},
{
  code: '+60',
  country: 'MY',
  name: 'Malaysia',
  flag: '🇲🇾'
},
{
  code: '+65',
  country: 'SG',
  name: 'Singapore',
  flag: '🇸🇬'
},
{
  code: '+66',
  country: 'TH',
  name: 'Thailand',
  flag: '🇹🇭'
},
{
  code: '+44',
  country: 'UK',
  name: 'United Kingdom',
  flag: '🇬🇧'
},
{
  code: '+1',
  country: 'US',
  name: 'United States',
  flag: '🇺🇸'
},
{
  code: '+84',
  country: 'VN',
  name: 'Vietnam',
  flag: '🇻🇳'
}]

const ROLE_OPTIONS = [
    'Founder',
    'Co-founder',
    'CEO',
    'Director',
    'Project Lead',
    'Technical Lead',
    'MRV Specialist',
    'Consultant',
    'Advisor',
    'Partner',
    'Operations Lead',
];

const EXPERTISE_OPTIONS = [
    'MRV',
    'Forestry',
    'Biochar',
    'Project Finance',
    'Due Diligence',
    'Auditing',
    'Remote Sensing',
];

const SERVICE_OPTIONS = [
    'Project development',
    'MRV services',
    'Methodology selection',
    'Registry support',
    'Due diligence',
    'Brokerage',
    'Advisory',
];

const SECTOR_OPTIONS = [
    'Nature-based',
    'Renewables',
    'Waste',
    'Industrials',
    'Agriculture',
    'Blue Carbon',
];

const STANDARD_OPTIONS = ['Verra', 'Gold Standard', 'CDM', 'ISO', 'Puro', 'ACR'];

const LANGUAGE_OPTIONS = [
    'English',
    'Spanish',
    'French',
    'Portuguese',
    'Indonesian',
    'Malay',
    'Vietnamese',
    'Thai',
    'Chinese',
    'Japanese',
    'Korean',
    'Arabic',
    'Hindi',
    'German',
    'Italian',
];

const TIMEZONE_OPTIONS = [
    'Asia/Kuala_Lumpur',
    'Asia/Singapore',
    'Asia/Jakarta',
    'UTC',
];

function emptyAccount(): AccountPayload {
    return {
        user: {
            id: '',
            email: '',
        },
        profile: {
            fullName: '',
            headline: '',
            jobTitle: '',
            bio: '',
            phoneNumber: '',
            contactEmail: '',
            country: '',
            city: '',
            timezone: 'Asia/Kuala_Lumpur',
            roleType: '',
            expertiseTags: [],
            serviceOfferings: [],
            sectors: [],
            standards: [],
            languages: [],
            personalWebsite: '',
            linkedinUrl: '',
            portfolioUrl: '',
            isPublic: true,
            showPhone: false,
            showContactEmail: false,
        },
        affiliations: [],
    };
}

function normalizeForCompare(payload: AccountPayload) {
    return JSON.stringify({
        ...payload,
        affiliations: [...payload.affiliations]
            .map((a) => ({
                id: a.id ?? null,
                companyId: a.companyId ?? null,
                companyName: a.companyName.trim(),
                role: a.role.trim(),
                permission: a.permission,
            }))
            .sort((a, b) => {
                const ak = `${a.companyId ?? ''}|${a.companyName}|${a.role}|${a.permission}`;
                const bk = `${b.companyId ?? ''}|${b.companyName}|${b.role}|${b.permission}`;
                return ak.localeCompare(bk);
            }),
    });
}

export function AccountPage() {
    const { logout } = useAuth();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [companiesLoading, setCompaniesLoading] = useState(false);

    const [initialData, setInitialData] = useState<AccountPayload>(emptyAccount());
    const [form, setForm] = useState<AccountPayload>(emptyAccount());
    const [companyOptions, setCompanyOptions] = useState<CompanyOption[]>([]);

    const [countryCode, setCountryCode] = useState('+60');
    const [countryFlag, setCountryFlag] = useState('🇲🇾');

    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deleteConfirmText, setDeleteConfirmText] = useState('');

    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');
    const [snackbarMessage, setSnackbarMessage] = useState('');

    const hasChanges = useMemo(() => {
        const left = {
            ...form,
            profile: {
                ...form.profile,
                phoneNumber: form.profile.phoneNumber.trim(),
            },
        };
        const right = {
            ...initialData,
            profile: {
                ...initialData.profile,
                phoneNumber: initialData.profile.phoneNumber.trim(),
            },
        };
        return normalizeForCompare(left) !== normalizeForCompare(right);
    }, [form, initialData]);

    useEffect(() => {
        void loadPage();
        void loadCompanies();
    }, []);

    async function handleDeleteAccount() {
        try {
            const response = await fetch(`${API_BASE_URL}/account`, {
                method: 'DELETE',
                credentials: 'include',
            });

            if (!response.ok) {
                const text = await response.text();
                throw new Error(text || `Failed to delete account (${response.status})`);
            }

            logout();
            navigate('/login');
        } catch (error) {
            console.error(error);
            showSnackbar('error', 'Failed to delete account');
        }
    }

    async function loadPage() {
        try {
            setLoading(true);

            const response = await fetch(`${API_BASE_URL}/account`, {
                method: 'GET',
                credentials: 'include',
            });

            if (!response.ok) {
                throw new Error(`Failed to load account (${response.status})`);
            }

            const data = (await response.json()) as AccountPayload;
            const hydrated = {
                ...emptyAccount(),
                ...data,
                profile: {
                    ...emptyAccount().profile,
                    ...data.profile,
                },
                affiliations: (data.affiliations ?? []).map((a) => ({
                    id: a.id,
                    companyId: a.companyId ?? null,
                    companyName: a.companyName ?? '',
                    role: a.role ?? '',
                    permission: a.permission ?? 'viewer',
                })),
            };

            setInitialData(hydrated);
            setForm(hydrated);

            syncCountryCodeFromPhone(hydrated.profile.phoneNumber);
        } catch (error) {
            console.error(error);
            showSnackbar('error', 'Failed to load account details');
        } finally {
            setLoading(false);
        }
    }

    async function loadCompanies() {
        try {
            setCompaniesLoading(true);

            const response = await fetch(`${API_BASE_URL}/companies/options`, {
                method: 'GET',
                credentials: 'include',
            });

            if (!response.ok) {
                throw new Error(`Failed to load companies (${response.status})`);
            }

            const data = (await response.json()) as { items: CompanyOption[] };
            setCompanyOptions(data.items ?? []);
        } catch (error) {
            console.error(error);
            showSnackbar('error', 'Failed to load company options');
        } finally {
            setCompaniesLoading(false);
        }
    }

    function syncCountryCodeFromPhone(phoneNumber: string) {
        const match = countryCodes.find((c) => phoneNumber.startsWith(c.code));
        if (match) {
            setCountryCode(match.code);
            setCountryFlag(match.flag);
            return;
        }
        setCountryCode('+60');
        setCountryFlag('🇲🇾');
    }

    function updateProfile<K extends keyof AccountPayload['profile']>(
        key: K,
        value: AccountPayload['profile'][K]
    ) {
        setForm((prev) => ({
            ...prev,
            profile: {
                ...prev.profile,
                [key]: value,
            },
        }));
    }

    function handlePhoneCodeChange(nextCode: string) {
        const selected = countryCodes.find((c) => c.code === nextCode);
        if (!selected) return;

        setCountryCode(selected.code);
        setCountryFlag(selected.flag);

        const current = form.profile.phoneNumber.trim();
        const withoutPrefix =
            countryCodes.find((c) => current.startsWith(c.code))
                ? current.replace(countryCodes.find((c) => current.startsWith(c.code))!.code, '').trim()
                : current;

        updateProfile('phoneNumber', `${selected.code} ${withoutPrefix}`.trim());
    }

    function handleAddAffiliation() {
        setForm((prev) => ({
            ...prev,
            affiliations: [
                ...prev.affiliations,
                {
                    companyId: null,
                    companyName: '',
                    role: '',
                    permission: 'viewer',
                },
            ],
        }));
    }

    function handleRemoveAffiliation(index: number) {
        setForm((prev) => ({
            ...prev,
            affiliations: prev.affiliations.filter((_, i) => i !== index),
        }));
    }

    function handleAffiliationChange(
        index: number,
        patch: Partial<AffiliationItem>
    ) {
        setForm((prev) => ({
            ...prev,
            affiliations: prev.affiliations.map((item, i) =>
                i === index ? { ...item, ...patch } : item
            ),
        }));
    }

    function handleCancel() {
        setForm(initialData);
        syncCountryCodeFromPhone(initialData.profile.phoneNumber);
    }

    async function handleSave() {
        try {
            setSaving(true);

            const payload: SaveAccountPayload = {
                profile: {
                    ...form.profile,
                    phoneNumber: form.profile.phoneNumber.trim(),
                    fullName: form.profile.fullName.trim(),
                    headline: form.profile.headline.trim(),
                    jobTitle: form.profile.jobTitle.trim(),
                    bio: form.profile.bio.trim(),
                    contactEmail: form.profile.contactEmail.trim(),
                    country: form.profile.country.trim(),
                    city: form.profile.city.trim(),
                    timezone: form.profile.timezone.trim(),
                    roleType: form.profile.roleType.trim(),
                    personalWebsite: form.profile.personalWebsite.trim(),
                    linkedinUrl: form.profile.linkedinUrl.trim(),
                    portfolioUrl: form.profile.portfolioUrl.trim(),
                },
                affiliations: form.affiliations
                    .map((a) => ({
                        id: a.id,
                        companyId: a.companyId,
                        role: a.role.trim(),
                        permission: a.permission,
                    }))
                    .filter((a) => a.companyId),
            };

            const response = await fetch('/api/account', {
                method: 'PUT',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const text = await response.text();
                throw new Error(text || `Failed to save account (${response.status})`);
            }

            const saved = (await response.json()) as AccountPayload;
            const hydrated = {
                ...emptyAccount(),
                ...saved,
                profile: {
                    ...emptyAccount().profile,
                    ...saved.profile,
                },
                affiliations: (saved.affiliations ?? []).map((a) => ({
                    id: a.id,
                    companyId: a.companyId ?? null,
                    companyName: a.companyName ?? '',
                    role: a.role ?? '',
                    permission: a.permission ?? 'viewer',
                })),
            };

            setInitialData(hydrated);
            setForm(hydrated);
            syncCountryCodeFromPhone(hydrated.profile.phoneNumber);
            showSnackbar('success', 'Account updated');
        } catch (error) {
            console.error(error);
            showSnackbar('error', 'Failed to save account');
        } finally {
            setSaving(false);
        }
    }

    function showSnackbar(severity: 'success' | 'error', message: string) {
        setSnackbarSeverity(severity);
        setSnackbarMessage(message);
        setSnackbarOpen(true);
    }

    if (loading) {
        return (
            <Box minHeight="100vh" bgcolor="white" color="text.secondary">
                <Box bgcolor="white" borderBottom={1} borderColor="grey.200" px={3} py={2}>
                    <Typography variant="h5" fontWeight="bold" color="text.primary">
                        Account
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Manage your account details and public profile
                    </Typography>
                </Box>

                <Box p={3} display="flex" justifyContent="center">
                    <CircularProgress />
                </Box>
            </Box>
        );
    }

    return (
        <Box minHeight="100vh" bgcolor="white" color="text.secondary">
            <Box bgcolor="white" borderBottom={1} borderColor="grey.200" px={3} py={2}>
                <Typography variant="h5" fontWeight="bold" color="text.primary">
                    Account
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Manage your account details and affiliations
                </Typography>
            </Box>

            <Box p={3}>
                <Box maxWidth={800} pb={hasChanges ? 10 : 0}>
                    <Paper variant="outlined" sx={{ p: 3, mb: 3, borderRadius: 2 }}>
                        <Typography variant="h6" fontWeight="bold" mb={3}>
                            Personal Information
                        </Typography>

                        <Box display="flex" gap={3} mb={3}>
                            <Box display="flex" flexDirection="column" alignItems="center" gap={1.5}>
                                <Avatar
                                    sx={{
                                        width: 88,
                                        height: 88,
                                        bgcolor: 'grey.200',
                                        color: 'grey.500',
                                    }}
                                >
                                    <PersonOutlineRounded sx={{ fontSize: 40 }} />
                                </Avatar>

                                <Button
                                    variant="outlined"
                                    size="small"
                                    startIcon={<CloudUploadRounded sx={{ fontSize: 16 }} />}
                                    sx={{ textTransform: 'none', fontSize: '0.75rem' }}
                                    disabled
                                >
                                    Upload
                                </Button>
                            </Box>

                            <Box flex={1}>
                                <Stack spacing={2.5}>
                                    <TextField
                                        fullWidth
                                        label="Full Name"
                                        value={form.profile.fullName}
                                        onChange={(e) => updateProfile('fullName', e.target.value)}
                                        required
                                    />

                                    <TextField
                                        fullWidth
                                        label="Email"
                                        value={form.user.email}
                                        disabled
                                        helperText="Email is managed by authentication"
                                    />

                                    <Box display="flex" gap={1.5}>
                                        <FormControl sx={{ minWidth: 150 }}>
                                            <InputLabel>Code</InputLabel>
                                            <Select
                                                value={countryCode}
                                                label="Code"
                                                onChange={(e) => handlePhoneCodeChange(String(e.target.value))}
                                                renderValue={() => (
                                                    <Box display="flex" alignItems="center" gap={1}>
                                                        <span>{countryFlag}</span>
                                                        <span>{countryCode}</span>
                                                    </Box>
                                                )}
                                            >
                                                {countries.map((country) => (
                                                    <MenuItem key={country} value={country}>
                                                        {country}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>

                                        <TextField
                                            fullWidth
                                            label="Phone"
                                            value={form.profile.phoneNumber}
                                            onChange={(e) => updateProfile('phoneNumber', e.target.value)}
                                            placeholder="+60 12-345 6789"
                                        />
                                    </Box>

                                    <TextField
                                        fullWidth
                                        label="Headline"
                                        value={form.profile.headline}
                                        onChange={(e) => updateProfile('headline', e.target.value)}
                                        placeholder="e.g. Carbon markets operator"
                                    />

                                    <TextField
                                        fullWidth
                                        label="Job Title"
                                        value={form.profile.jobTitle}
                                        onChange={(e) => updateProfile('jobTitle', e.target.value)}
                                        placeholder="e.g. Head of Sustainability"
                                    />
                                </Stack>
                            </Box>
                        </Box>
                    </Paper>

                    <Paper variant="outlined" sx={{ p: 3, mb: 3, borderRadius: 2 }}>
                        <Typography variant="h6" fontWeight="bold" mb={1}>
                            Professional Summary
                        </Typography>
                        <Typography variant="body2" color="text.secondary" mb={2}>
                            Short professional summary to help collaborators understand your background and focus.
                        </Typography>

                        <TextField
                            fullWidth
                            multiline
                            minRows={4}
                            maxRows={8}
                            value={form.profile.bio}
                            onChange={(e) => updateProfile('bio', e.target.value)}
                            placeholder="Share your experience, focus areas, and the kind of projects or partnerships you work on."
                        />
                    </Paper>

                    <Paper variant="outlined" sx={{ p: 3, mb: 3, borderRadius: 2 }}>
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                            <Typography variant="h6" fontWeight="bold">
                                Company Affiliation
                            </Typography>

                            <Button
                                startIcon={<AddRounded />}
                                size="small"
                                onClick={handleAddAffiliation}
                                sx={{ textTransform: 'none' }}
                                disabled={companiesLoading}
                            >
                                Add another
                            </Button>
                        </Box>

                        <Typography variant="body2" color="text.secondary" mb={3}>
                            You can manage your own affiliation labels here. This updates your membership rows in the platform.
                        </Typography>

                        <Stack spacing={2.5}>
                            {form.affiliations.map((affiliation, index) => (
                                <Box key={`${affiliation.id ?? 'new'}-${index}`} display="flex" gap={1.5} alignItems="flex-start">
                                    <Autocomplete
                                        options={companyOptions}
                                        getOptionLabel={(option) =>
                                            typeof option === 'string' ? option : option.name
                                        }
                                        isOptionEqualToValue={(option, value) => option.id === value.id}
                                        value={
                                            affiliation.companyId
                                                ? companyOptions.find((c) => c.id === affiliation.companyId) ?? null
                                                : null
                                        }
                                        onChange={(_, newValue) =>
                                            handleAffiliationChange(index, {
                                                companyId: newValue?.id ?? null,
                                                companyName: newValue?.name ?? '',
                                            })
                                        }
                                        sx={{ flex: 1 }}
                                        renderInput={(params) => (
                                            <TextField
                                                {...params}
                                                label="Company"
                                                helperText={index === 0 ? 'Select a company on the platform.' : ''}
                                            />
                                        )}
                                    />

                                    <Autocomplete
                                        freeSolo
                                        options={ROLE_OPTIONS}
                                        value={affiliation.role}
                                        onChange={(_, newValue) =>
                                            handleAffiliationChange(index, { role: String(newValue ?? '') })
                                        }
                                        onInputChange={(_, newInputValue) =>
                                            handleAffiliationChange(index, { role: newInputValue })
                                        }
                                        sx={{ flex: 1 }}
                                        renderInput={(params) => <TextField {...params} label="Role" />}
                                    />

                                    <IconButton
                                        onClick={() => handleRemoveAffiliation(index)}
                                        color="error"
                                        sx={{ mt: 1 }}
                                    >
                                        <DeleteOutlineRounded />
                                    </IconButton>
                                </Box>
                            ))}

                            {form.affiliations.length === 0 && (
                                <Typography variant="body2" color="text.secondary">
                                    No affiliations added yet.
                                </Typography>
                            )}
                        </Stack>
                    </Paper>

                    <Paper variant="outlined" sx={{ p: 3, mb: 3, borderRadius: 2 }}>
                        <Typography variant="h6" fontWeight="bold" mb={2}>
                            Expertise
                        </Typography>
                        <Autocomplete
                            multiple
                            freeSolo
                            options={EXPERTISE_OPTIONS}
                            value={form.profile.expertiseTags}
                            onChange={(_, newValue) => updateProfile('expertiseTags', newValue)}
                            renderTags={(value, getTagProps) =>
                                value.map((option, index) => (
                                    <Chip variant="outlined" label={option} {...getTagProps({ index })} key={`${option}-${index}`} />
                                ))
                            }
                            renderInput={(params) => <TextField {...params} placeholder="Select or type to add..." />}
                        />
                    </Paper>

                    <Paper variant="outlined" sx={{ p: 3, mb: 3, borderRadius: 2 }}>
                        <Typography variant="h6" fontWeight="bold" mb={2}>
                            Services You Can Support
                        </Typography>
                        <Autocomplete
                            multiple
                            freeSolo
                            options={SERVICE_OPTIONS}
                            value={form.profile.serviceOfferings}
                            onChange={(_, newValue) => updateProfile('serviceOfferings', newValue)}
                            renderTags={(value, getTagProps) =>
                                value.map((option, index) => (
                                    <Chip variant="outlined" label={option} {...getTagProps({ index })} key={`${option}-${index}`} />
                                ))
                            }
                            renderInput={(params) => <TextField {...params} placeholder="Select or type to add..." />}
                        />
                    </Paper>

                    <Paper variant="outlined" sx={{ p: 3, mb: 3, borderRadius: 2 }}>
                        <Typography variant="h6" fontWeight="bold" mb={2}>
                            Sectors of Focus
                        </Typography>
                        <Autocomplete
                            multiple
                            freeSolo
                            options={SECTOR_OPTIONS}
                            value={form.profile.sectors}
                            onChange={(_, newValue) => updateProfile('sectors', newValue)}
                            renderTags={(value, getTagProps) =>
                                value.map((option, index) => (
                                    <Chip variant="outlined" label={option} {...getTagProps({ index })} key={`${option}-${index}`} />
                                ))
                            }
                            renderInput={(params) => <TextField {...params} placeholder="Select or type to add..." />}
                        />
                    </Paper>

                    <Paper variant="outlined" sx={{ p: 3, mb: 3, borderRadius: 2 }}>
                        <Typography variant="h6" fontWeight="bold" mb={2}>
                            Standards and Methodologies
                        </Typography>
                        <Autocomplete
                            multiple
                            freeSolo
                            options={STANDARD_OPTIONS}
                            value={form.profile.standards}
                            onChange={(_, newValue) => updateProfile('standards', newValue)}
                            renderTags={(value, getTagProps) =>
                                value.map((option, index) => (
                                    <Chip variant="outlined" label={option} {...getTagProps({ index })} key={`${option}-${index}`} />
                                ))
                            }
                            renderInput={(params) => <TextField {...params} placeholder="Select or type to add..." />}
                        />
                    </Paper>

                    <Paper variant="outlined" sx={{ p: 3, mb: 3, borderRadius: 2 }}>
                        <Typography variant="h6" fontWeight="bold" mb={2}>
                            Languages
                        </Typography>
                        <Autocomplete
                            multiple
                            freeSolo
                            options={LANGUAGE_OPTIONS}
                            value={form.profile.languages}
                            onChange={(_, newValue) => updateProfile('languages', newValue)}
                            renderTags={(value, getTagProps) =>
                                value.map((option, index) => (
                                    <Chip variant="outlined" label={option} {...getTagProps({ index })} key={`${option}-${index}`} />
                                ))
                            }
                            renderInput={(params) => <TextField {...params} placeholder="Search and select languages..." />}
                        />
                    </Paper>

                    <Paper variant="outlined" sx={{ p: 3, mb: 3, borderRadius: 2 }}>
                        <Typography variant="h6" fontWeight="bold" mb={2}>
                            Additional Details
                        </Typography>

                        <Stack spacing={2.5}>
                            <TextField
                                fullWidth
                                label="Country"
                                value={form.profile.country}
                                onChange={(e) => updateProfile('country', e.target.value)}
                            />

                            <TextField
                                fullWidth
                                label="City"
                                value={form.profile.city}
                                onChange={(e) => updateProfile('city', e.target.value)}
                            />

                            <FormControl fullWidth>
                                <InputLabel>Timezone</InputLabel>
                                <Select
                                    value={form.profile.timezone}
                                    label="Timezone"
                                    onChange={(e) => updateProfile('timezone', String(e.target.value))}
                                >
                                    {TIMEZONE_OPTIONS.map((tz) => (
                                        <MenuItem key={tz} value={tz}>
                                            {tz}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            <TextField
                                fullWidth
                                label="Personal Website"
                                value={form.profile.personalWebsite}
                                onChange={(e) => updateProfile('personalWebsite', e.target.value)}
                            />

                            <TextField
                                fullWidth
                                label="LinkedIn URL"
                                value={form.profile.linkedinUrl}
                                onChange={(e) => updateProfile('linkedinUrl', e.target.value)}
                            />

                            <TextField
                                fullWidth
                                label="Portfolio URL"
                                value={form.profile.portfolioUrl}
                                onChange={(e) => updateProfile('portfolioUrl', e.target.value)}
                            />
                        </Stack>
                    </Paper>

                    <Paper
                        variant="outlined"
                        sx={{ p: 3, borderRadius: 2, borderColor: 'error.200', bgcolor: 'error.50' }}
                    >
                        <Typography variant="h6" fontWeight="bold" color="error.main" mb={2}>
                            Danger Zone
                        </Typography>

                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                            <Box>
                                <Typography variant="subtitle2" fontWeight="bold">
                                    Sign out
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    Sign out of your account on this device
                                </Typography>
                            </Box>

                            <Button
                                variant="outlined"
                                color="inherit"
                                startIcon={<LogoutRounded sx={{ fontSize: 18 }} />}
                                onClick={() => {
                                    logout();
                                    navigate('/login');
                                }}
                            >
                                Log out
                            </Button>
                        </Box>

                        <Divider sx={{ my: 2 }} />

                        <Box display="flex" justifyContent="space-between" alignItems="center">
                            <Box>
                                <Typography variant="subtitle2" fontWeight="bold" color="error.main">
                                    Delete Account
                                </Typography>
                                <Typography variant="caption" color="error.main">
                                    Permanently delete your account and all data
                                </Typography>
                            </Box>

                            <Button
                                variant="contained"
                                color="error"
                                startIcon={<DeleteOutlineRounded sx={{ fontSize: 18 }} />}
                                onClick={() => setDeleteDialogOpen(true)}
                            >
                                Delete Account
                            </Button>
                        </Box>

                        <Dialog
                            open={deleteDialogOpen}
                            onClose={() => {
                                setDeleteDialogOpen(false);
                                setDeleteConfirmText('');
                            }}
                            maxWidth="sm"
                            fullWidth
                            PaperProps={{ sx: { borderRadius: 2 } }}
                        >
                            <DialogTitle sx={{ pb: 1 }}>
                                <Typography variant="h6" fontWeight="bold" color="error.main">
                                    Delete Account
                                </Typography>
                            </DialogTitle>

                            <DialogContent>
                                <DialogContentText mb={2}>
                                    This action is permanent and cannot be undone.
                                </DialogContentText>

                                <Box
                                    sx={{
                                        p: 2,
                                        bgcolor: 'error.50',
                                        border: 1,
                                        borderColor: 'error.200',
                                        borderRadius: 1,
                                        mb: 2,
                                    }}
                                >
                                    <Typography variant="body2" color="error.main" fontWeight="medium" mb={1.5}>
                                        Type <strong>DELETE</strong> to confirm
                                    </Typography>

                                    <TextField
                                        fullWidth
                                        size="small"
                                        placeholder="DELETE"
                                        value={deleteConfirmText}
                                        onChange={(e) => setDeleteConfirmText(e.target.value)}
                                        autoComplete="off"
                                        sx={{
                                            bgcolor: 'white',
                                            '& .MuiOutlinedInput-root': {
                                                '&.Mui-focused fieldset': {
                                                    borderColor: 'error.main',
                                                },
                                            },
                                        }}
                                    />
                                </Box>
                            </DialogContent>

                            <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
                                <Button
                                    onClick={() => {
                                        setDeleteDialogOpen(false);
                                        setDeleteConfirmText('');
                                    }}
                                    sx={{ color: 'text.secondary' }}
                                >
                                    Cancel
                                </Button>

                                <Button
                                    variant="contained"
                                    color="error"
                                    disabled={deleteConfirmText !== 'DELETE'}
                                    onClick={handleDeleteAccount}
                                >
                                    Permanently Delete Account
                                </Button>
                            </DialogActions>
                        </Dialog>
                    </Paper>

                    <Slide direction="up" in={hasChanges} mountOnEnter unmountOnExit>
                        <Paper
                            elevation={8}
                            sx={{
                                position: 'fixed',
                                bottom: 0,
                                left: 0,
                                right: 0,
                                p: 2,
                                display: 'flex',
                                justifyContent: 'flex-end',
                                gap: 2,
                                bgcolor: 'white',
                                borderTop: 1,
                                borderColor: 'grey.200',
                                zIndex: 1100,
                            }}
                        >
                            <Box
                                sx={{
                                    maxWidth: 800,
                                    width: '100%',
                                    mx: 'auto',
                                    display: 'flex',
                                    justifyContent: 'flex-end',
                                    gap: 2,
                                    px: 3,
                                }}
                            >
                                <Button variant="outlined" onClick={handleCancel} sx={{ minWidth: 100 }}>
                                    Cancel
                                </Button>

                                <Button
                                    variant="contained"
                                    onClick={handleSave}
                                    disabled={saving}
                                    sx={{
                                        minWidth: 140,
                                        bgcolor: 'grey.900',
                                        '&:hover': { bgcolor: 'grey.800' },
                                    }}
                                >
                                    {saving ? 'Saving...' : 'Save Changes'}
                                </Button>
                            </Box>
                        </Paper>
                    </Slide>
                </Box>
            </Box>

            <Snackbar
                open={snackbarOpen}
                autoHideDuration={3500}
                onClose={() => setSnackbarOpen(false)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert
                    onClose={() => setSnackbarOpen(false)}
                    severity={snackbarSeverity}
                    variant="filled"
                >
                    {snackbarMessage}
                </Alert>
            </Snackbar>
        </Box>
    );
}

export default AccountPage;