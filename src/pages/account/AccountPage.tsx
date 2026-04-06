import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
    Box,
    CircularProgress,
    Tab,
    Tabs,
    Typography,
} from '@mui/material';
import { useAuth } from '../../context/AuthContext';
import countriesJson from '../../data/countries.json';
import rawCountryCodes from '../../data/countrycode.json';
import { buildPhoneCodeOptions } from '../../utils/countryPhone';
import ProfileTab from './ProfileTab';
import CompaniesTab from './CompanyTab';
import ProjectsTab from './ProjectTab';
import OpportunitiesTab from './OpportunityTab';
import type {
    AccountPayload,
    AccountTabKey,
    AffiliationItem,
    CompanyOption,
    SaveAccountPayload,
} from './account.types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

import rawCountries from '../../data/country.json';

type CountryTimezoneItem = {
    name: string;
};

type CountryRecord = {
    code: string;
    name: string;
    locale: string;
    language: string;
    currency: string;
    phoneCode: string;
    timezones?: CountryTimezoneItem[];
};

type TimezoneOption = {
    value: string;
    label: string;
};

const timezoneOptions: TimezoneOption[] = (rawCountries as CountryRecord[])
    .flatMap((country) =>
        (country.timezones ?? []).map((tz) => ({
            value: tz.name,
            label: `${country.name} — ${tz.name.replace(/_/g, ' ')}`,
        }))
    )
    .sort((a, b) => a.label.localeCompare(b.label));

type CountryItem = {
    name: string;
    states?: string[];
};

const countryCodeOptions = buildPhoneCodeOptions(rawCountryCodes);

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

function replacePhonePrefix(currentPhone: string, selectedDialCode: string): string {
    const existing = countryCodeOptions.find((c) => currentPhone.startsWith(c.dialCode));
    const withoutPrefix = existing
        ? currentPhone.slice(existing.dialCode.length).trim()
        : currentPhone.trim();

    return `${selectedDialCode} ${withoutPrefix}`.trim();
}

export function AccountPage() {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    const tab = (searchParams.get('tab') as AccountTabKey) || 'profile';

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

    function syncCountryCodeFromPhone(phoneNumber: string) {
        const match = countryCodeOptions.find((c) => phoneNumber.startsWith(c.dialCode));
        if (match) {
            setCountryCode(match.dialCode);
            setCountryFlag(match.flag);
            return;
        }

        const fallback =
            countryCodeOptions.find((c) => c.iso === 'MY') ?? countryCodeOptions[0];

        if (fallback) {
            setCountryCode(fallback.dialCode);
            setCountryFlag(fallback.flag);
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
        const selected = countryCodeOptions.find((c) => c.dialCode === nextCode);
        if (!selected) return;

        setCountryCode(selected.dialCode);
        setCountryFlag(selected.flag);

        updateProfile(
            'phoneNumber',
            replacePhonePrefix(form.profile.phoneNumber, selected.dialCode)
        );
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

    function handleAffiliationChange(index: number, patch: Partial<AffiliationItem>) {
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

            const response = await fetch(`${API_BASE_URL}/account`, {
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

    function showSnackbar(severity: 'success' | 'error', message: string) {
        setSnackbarSeverity(severity);
        setSnackbarMessage(message);
        setSnackbarOpen(true);
    }

    function handleTabChange(_: React.SyntheticEvent, value: AccountTabKey) {
        setSearchParams({ tab: value });
    }

    if (loading) {
        return (
            <Box minHeight="100vh" bgcolor="white">
                <Box bgcolor="white" borderBottom={1} borderColor="grey.200" px={3} py={2}>
                    <Typography variant="h5" fontWeight="bold" color="text.primary">
                        Account
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Manage your account details and workspace
                    </Typography>
                </Box>

                <Box p={3} display="flex" justifyContent="center">
                    <CircularProgress />
                </Box>
            </Box>
        );
    }

    return (
        <Box minHeight="100vh" bgcolor="white">
            <Box bgcolor="white" borderBottom={1} borderColor="grey.200" px={3} py={2}>
                <Typography variant="h5" fontWeight="bold" color="text.primary">
                    Account
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Manage your account details and workspace
                </Typography>
            </Box>

            <Box px={3} pt={2} borderBottom={1} borderColor="grey.200">
                <Tabs value={tab} onChange={handleTabChange}>
                    <Tab label="Profile" value="profile" />
                    <Tab label="Companies" value="companies" />
                    <Tab label="Projects" value="projects" />
                    <Tab label="Opportunities" value="opportunities" />
                </Tabs>
            </Box>

            <Box p={3}>
                {tab === 'profile' && (
                    <ProfileTab
                        form={form}
                        initialData={initialData}
                        hasChanges={hasChanges}
                        saving={saving}
                        companiesLoading={companiesLoading}
                        companyOptions={companyOptions}
                        countryCode={countryCode}
                        countryFlag={countryFlag}
                        timezoneOptions={timezoneOptions}
                        countryCodeOptions={countryCodeOptions}
                        deleteDialogOpen={deleteDialogOpen}
                        deleteConfirmText={deleteConfirmText}
                        snackbarOpen={snackbarOpen}
                        snackbarSeverity={snackbarSeverity}
                        snackbarMessage={snackbarMessage}
                        onUpdateProfile={updateProfile}
                        onHandlePhoneCodeChange={handlePhoneCodeChange}
                        onAddAffiliation={handleAddAffiliation}
                        onRemoveAffiliation={handleRemoveAffiliation}
                        onAffiliationChange={handleAffiliationChange}
                        onCancel={handleCancel}
                        onSave={handleSave}
                        onLogout={() => {
                            logout();
                            navigate('/login');
                        }}
                        onDeleteDialogOpen={() => setDeleteDialogOpen(true)}
                        onDeleteDialogClose={() => {
                            setDeleteDialogOpen(false);
                            setDeleteConfirmText('');
                        }}
                        onDeleteConfirmTextChange={setDeleteConfirmText}
                        onDeleteAccount={handleDeleteAccount}
                        onSnackbarClose={() => setSnackbarOpen(false)}
                    />
                )}

                {tab === 'companies' && <CompaniesTab />}
                {tab === 'projects' && <ProjectsTab />}
                {tab === 'opportunities' && <OpportunitiesTab />}
            </Box>
        </Box>
    );
}