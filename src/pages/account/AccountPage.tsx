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
    UploadedProfilePhoto,
} from './account.types';

import { trackEvent } from '../../lib/analytics';

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

async function uploadProfilePhoto(file: File): Promise<UploadedProfilePhoto> {
    const body = new FormData();
    body.append('photo', file);

    const response = await fetch(`${API_BASE_URL}/account/profile-photo`, {
        method: 'POST',
        credentials: 'include',
        body,
    });

    if (!response.ok) {
        let message = `Failed to upload profile photo: ${response.status}`;
        try {
            const payload = await response.json();
            message = payload?.error || payload?.message || message;
        } catch {
            // ignore
        }
        throw new Error(message);
    }

    const payload = await response.json();

    return {
        tempKey: String(payload?.data?.tempKey ?? ''),
        tempAssetUrl: String(payload?.data?.tempAssetUrl ?? ''),
        contentType: String(payload?.data?.contentType ?? file.type),
        originalName: String(payload?.data?.originalName ?? file.name),
        sha256: typeof payload?.data?.sha256 === 'string' ? payload.data.sha256 : undefined,
    };
}

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
            avatarUrl: '',
            profilePhoto: undefined,
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

    const [profilePhotoPreview, setProfilePhotoPreview] = useState<string>('');
    const [profilePhotoUploading, setProfilePhotoUploading] = useState(false);

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

    useEffect(() => {
        setProfilePhotoPreview(
            form.profile.profilePhoto?.tempAssetUrl ||
            form.profile.avatarUrl ||
            ''
        );
    }, [form.profile.profilePhoto?.tempAssetUrl, form.profile.avatarUrl]);

    const profileViewTrackedRef = React.useRef(false);

    function getEntryPoint(): string {
        return searchParams.get('from') || 'direct';
    }

    function getChangedProfileFields(
        previous: AccountPayload,
        next: AccountPayload
    ): string[] {
        const changed: string[] = [];

        const prevProfile = previous.profile;
        const nextProfile = next.profile;

        const scalarFields: Array<keyof AccountPayload['profile']> = [
            'fullName',
            'phoneNumber',
            'headline',
            'jobTitle',
            'bio',
            'country',
            'city',
            'timezone',
            'personalWebsite',
            'linkedinUrl',
            'portfolioUrl',
            'avatarUrl',
        ];

        for (const field of scalarFields) {
            const prevValue = String(prevProfile[field] ?? '').trim();
            const nextValue = String(nextProfile[field] ?? '').trim();
            if (prevValue !== nextValue) {
                changed.push(String(field));
            }
        }

        const arrayFields = [
            'languages',
            'expertiseTags',
            'serviceOfferings',
            'sectors',
            'standards',
        ] as const;

        for (const field of arrayFields) {
            const prevArray = [...(prevProfile[field] ?? [])];
            const nextArray = [...(nextProfile[field] ?? [])];

            const prevValue = JSON.stringify(prevArray.sort());
            const nextValue = JSON.stringify(nextArray.sort());

            if (prevValue !== nextValue) {
                changed.push(field);
            }
        }

        return changed;
    }

    function getAffiliationChangeType(
        previous: AccountPayload,
        next: AccountPayload
    ): 'add' | 'remove' | 'update' | 'mixed' | 'none' {
        const prev = previous.affiliations ?? [];
        const curr = next.affiliations ?? [];

        if (prev.length === curr.length) {
            const prevNormalized = normalizeForCompare({ ...previous, profile: previous.profile });
            const currNormalized = normalizeForCompare({ ...next, profile: next.profile });
            return prevNormalized !== currNormalized ? 'update' : 'none';
        }

        if (curr.length > prev.length) return 'add';
        if (curr.length < prev.length) return 'remove';

        return 'mixed';
    }

    function trackProfileSaveEvents(previous: AccountPayload, next: AccountPayload) {
        const changedFields = getChangedProfileFields(previous, next);

        const identityFields = changedFields.filter((field) =>
            [
                'avatarUrl',
                'fullName',
                'phoneNumber',
                'headline',
                'jobTitle',
                'bio',
                'languages',
                'country',
                'city',
                'timezone',
                'personalWebsite',
                'linkedinUrl',
                'portfolioUrl',
            ].includes(field)
        );

        const professionalFields = changedFields.filter((field) =>
            ['expertiseTags', 'serviceOfferings', 'sectors', 'standards'].includes(field)
        );

        if (identityFields.length > 0) {
            trackEvent('User profile identity updated', {
                fields_updated: identityFields,
                updated_field_count: identityFields.length,
                page: 'user_profile',
                profile_type: 'own',
            });
        }

        if (professionalFields.length > 0) {
            trackEvent('User professional profile updated', {
                fields_updated: professionalFields,
                updated_field_count: professionalFields.length,
                page: 'user_profile',
                profile_type: 'own',
            });
        }

        const affiliationChangeType = getAffiliationChangeType(previous, next);
        if (affiliationChangeType !== 'none') {
            trackEvent('User company affiliations updated', {
                change_type: affiliationChangeType,
                affiliation_count_before: previous.affiliations.length,
                affiliation_count_after: next.affiliations.length,
                page: 'user_profile',
                profile_type: 'own',
            });
        }
    }

    useEffect(() => {
        if (loading) return;
        if (profileViewTrackedRef.current) return;

        profileViewTrackedRef.current = true;

        trackEvent('User profile viewed', {
            profile_type: 'own',
            entry_point: getEntryPoint(),
            page: 'user_profile',
            tab,
        });
    }, [loading, tab, searchParams]);

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

            trackProfileSaveEvents(initialData, hydrated);

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

    async function handleProfilePhotoUpload(file: File) {
        if (!file.type.startsWith('image/')) {
            showSnackbar('error', 'Profile photo must be an image');
            return;
        }

        if (file.size > 1 * 1024 * 1024) {
            showSnackbar('error', 'Profile photo must be 1MB or smaller');
            return;
        }

        setProfilePhotoUploading(true);

        try {
            const localPreview = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });

            setProfilePhotoPreview(localPreview);

            const uploaded = await uploadProfilePhoto(file);

            setForm((prev) => ({
                ...prev,
                profile: {
                    ...prev.profile,
                    avatarUrl: uploaded.tempAssetUrl,
                    profilePhoto: uploaded,
                },
            }));

            setProfilePhotoPreview(uploaded.tempAssetUrl);
            showSnackbar('success', 'Profile photo uploaded');
        } catch (error) {
            console.error(error);
            setProfilePhotoPreview(
                form.profile.profilePhoto?.tempAssetUrl || form.profile.avatarUrl || ''
            );
            showSnackbar('error', error instanceof Error ? error.message : 'Failed to upload profile photo');
        } finally {
            setProfilePhotoUploading(false);
        }
    }

    function handleRemoveProfilePhoto() {
        setProfilePhotoPreview('');

        setForm((prev) => ({
            ...prev,
            profile: {
                ...prev.profile,
                avatarUrl: '',
                profilePhoto: undefined,
            },
        }));
    }

    async function handleSave() {
        try {
            setSaving(true);

            const { profilePhoto, ...profileWithoutNestedUpload } = form.profile;

            const payload: SaveAccountPayload = {
                profile: {
                    ...profileWithoutNestedUpload,
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
                    avatarUrl: form.profile.avatarUrl?.trim() || "",
                    profilePhotoTempKey: profilePhoto?.tempKey || "",
                    profilePhotoContentType: profilePhoto?.contentType || "",
                    profilePhotoOriginalName: profilePhoto?.originalName || "",
                    profilePhotoSha256: profilePhoto?.sha256 || "",
                },
                affiliations: []
                // affiliations: form.affiliations
                //     .map((a) => ({
                //         id: a.id,
                //         companyId: a.companyId,
                //         role: a.role.trim(),
                //         permission: a.permission,
                //     }))
                //     .filter((a) => a.companyId),
            };

            const response = await fetch(`${API_BASE_URL}/account`, {
                method: "PUT",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const text = await response.text();
                throw new Error(text || `Failed to save account (${response.status})`);
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
                    companyName: a.companyName ?? "",
                    role: a.role ?? "",
                    permission: a.permission ?? "viewer",
                })),
            };

            setInitialData(hydrated);
            setForm(hydrated);
            setProfilePhotoPreview(hydrated.profile.avatarUrl || "");
            syncCountryCodeFromPhone(hydrated.profile.phoneNumber);

            showSnackbar("success", "Account updated successfully");
        } catch (error) {
            console.error(error);
            showSnackbar(
                "error",
                error instanceof Error ? error.message : "Failed to save account"
            );
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

            trackEvent('Account deleted', {
                page: 'user_profile',
                profile_type: 'own',
            });

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
                <Box bgcolor="white" borderBottom={1} borderColor="grey.200" flexShrink={0}>
                    <Box px={3} pt={2} pb={1}>
                        <Typography variant="h5" fontWeight="bold" color="text.primary">
                            My Profile
                        </Typography>
                    </Box>

                    <Box px={3}>
                        <Tabs
                            value={tab}
                            onChange={handleTabChange}
                            textColor="primary"
                            indicatorColor="primary"
                            sx={{ minHeight: 48 }}
                        >
                            <Tab
                                label="Profile"
                                value="profile"
                                sx={{ textTransform: 'none', fontWeight: 500, minHeight: 48 }}
                            />
                        </Tabs>
                    </Box>
                </Box>

                <Box p={3} display="flex" justifyContent="center">
                    <CircularProgress />
                </Box>
            </Box>
        );
    }

    return (
        <Box minHeight="100vh" bgcolor="white">
            <Box bgcolor="white" borderBottom={1} borderColor="grey.200" flexShrink={0}>
                <Box px={3} pt={2} pb={1}>
                    <Typography variant="h5" fontWeight="bold" color="text.primary">
                        My Profile
                    </Typography>
                </Box>

                <Box px={3}>
                    <Tabs
                        value={tab}
                        onChange={handleTabChange}
                        textColor="primary"
                        indicatorColor="primary"
                        sx={{ minHeight: 48 }}
                    >
                        <Tab
                            label="Profile"
                            value="profile"
                            sx={{ textTransform: 'none', fontWeight: 500, minHeight: 48 }}
                        />
                        {/* <Tab
                        label="My Companies"
                        value="companies"
                        sx={{ textTransform: 'none', fontWeight: 500, minHeight: 48 }}
                    />
                    <Tab
                        label="My Projects"
                        value="projects"
                        sx={{ textTransform: 'none', fontWeight: 500, minHeight: 48 }}
                    />
                    <Tab
                        label="My Opportunities"
                        value="opportunities"
                        sx={{ textTransform: 'none', fontWeight: 500, minHeight: 48 }}
                    /> */}
                    </Tabs>
                </Box>
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
                            trackEvent('User logged out', {
                                page: 'user_profile',
                                profile_type: 'own',
                            });
                            logout();
                            navigate('/login');
                        }}
                        onDeleteDialogOpen={() => {
                            trackEvent('Delete account button clicked', {
                                page: 'user_profile',
                                profile_type: 'own',
                            });
                            setDeleteDialogOpen(true);
                        }}
                        onDeleteDialogClose={() => {
                            setDeleteDialogOpen(false);
                            setDeleteConfirmText('');
                        }}
                        onDeleteConfirmTextChange={setDeleteConfirmText}
                        onDeleteAccount={handleDeleteAccount}
                        onSnackbarClose={() => setSnackbarOpen(false)}
                        profilePhotoPreview={profilePhotoPreview}
                        profilePhotoUploading={profilePhotoUploading}
                        onProfilePhotoUpload={handleProfilePhotoUpload}
                        onRemoveProfilePhoto={handleRemoveProfilePhoto}
                    />
                )}

                {tab === 'companies' && <CompaniesTab />}
                {tab === 'projects' && <ProjectsTab />}
                {tab === 'opportunities' && <OpportunitiesTab />}
            </Box>
        </Box>
    );

    // return (
    //     <Box minHeight="100vh" bgcolor="white">
    //         <Box bgcolor="white" borderBottom={1} borderColor="grey.200" px={3} py={2}>
    //             <Typography variant="h5" fontWeight="bold" color="text.primary">
    //                 Account
    //             </Typography>
    //             <Typography variant="body2" color="text.secondary">
    //                 Manage your account details and workspace
    //             </Typography>
    //         </Box>

    //         <Box px={3} pt={2} borderBottom={1} borderColor="grey.200">
    //             <Tabs value={tab} onChange={handleTabChange}>
    //                 <Tab label="Profile" value="profile" />
    //                 {/* <Tab label="Companies" value="companies" />
    //                 <Tab label="Projects" value="projects" />
    //                 <Tab label="Opportunities" value="opportunities" /> */}
    //             </Tabs>
    //         </Box>

    //         <Box p={3}>
    //             {tab === 'profile' && (
    //                 <ProfileTab
    //                     form={form}
    //                     initialData={initialData}
    //                     hasChanges={hasChanges}
    //                     saving={saving}
    //                     companiesLoading={companiesLoading}
    //                     companyOptions={companyOptions}
    //                     countryCode={countryCode}
    //                     countryFlag={countryFlag}
    //                     timezoneOptions={timezoneOptions}
    //                     countryCodeOptions={countryCodeOptions}
    //                     deleteDialogOpen={deleteDialogOpen}
    //                     deleteConfirmText={deleteConfirmText}
    //                     snackbarOpen={snackbarOpen}
    //                     snackbarSeverity={snackbarSeverity}
    //                     snackbarMessage={snackbarMessage}
    //                     onUpdateProfile={updateProfile}
    //                     onHandlePhoneCodeChange={handlePhoneCodeChange}
    //                     onAddAffiliation={handleAddAffiliation}
    //                     onRemoveAffiliation={handleRemoveAffiliation}
    //                     onAffiliationChange={handleAffiliationChange}
    //                     onCancel={handleCancel}
    //                     onSave={handleSave}
    //                     onLogout={() => {
    //                         logout();
    //                         navigate('/login');
    //                     }}
    //                     onDeleteDialogOpen={() => setDeleteDialogOpen(true)}
    //                     onDeleteDialogClose={() => {
    //                         setDeleteDialogOpen(false);
    //                         setDeleteConfirmText('');
    //                     }}
    //                     onDeleteConfirmTextChange={setDeleteConfirmText}
    //                     onDeleteAccount={handleDeleteAccount}
    //                     onSnackbarClose={() => setSnackbarOpen(false)}
    //                 />
    //             )}

    //             {tab === 'companies' && <CompaniesTab />}
    //             {tab === 'projects' && <ProjectsTab />}
    //             {tab === 'opportunities' && <OpportunitiesTab />}
    //         </Box>
    //     </Box>
    // );
}