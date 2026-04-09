import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, Button, Paper, ListItemIcon, ListItemText } from '@mui/material';
import { getCompanyDetail, patchCompanySection, getUserOptions } from './companyProfile.api';
import { CompanyProfileView } from './CompanyProfileView';
import type { CompanyPrivacyLevel, CompanyPrivacyMap, CompanyProfile } from './companyProfile.types';
import {
    CompanyEditorSection,
    CompanySidebarEditor,
    ExistingUserOption,
    SidebarSavePayload,
} from './CompanySidebarEditor';
import { canEditCompany, canViewCompanySection } from './companyProfile.access';
import MoreVertRounded from '@mui/icons-material/MoreVertRounded';
import { IconButton, Menu, MenuItem } from '@mui/material';
import { ProjectWizard, type ProjectFormData, type WizardCloseResult } from '../../components/ProjectWizard';
import MoreHorizRounded from '@mui/icons-material/MoreHorizRounded';
import EditRounded from '@mui/icons-material/EditRounded';
import DeleteRounded from '@mui/icons-material/DeleteRounded';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

export function MyCompany() {
    const { id = '' } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [company, setCompany] = useState<CompanyProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [shareAnchorEl, setShareAnchorEl] = useState<HTMLElement | null>(null);

    const [directoryUsers, setDirectoryUsers] = useState<ExistingUserOption[]>([]);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [sidebarSection, setSidebarSection] = useState<CompanyEditorSection>('');
    const [editingItem, setEditingItem] = useState<any>(null);

    const [teamMenuAnchorEl, setTeamMenuAnchorEl] = useState<HTMLElement | null>(null);
    const [teamMenuMember, setTeamMenuMember] = useState<any>(null);
    const [teamMenuIndex, setTeamMenuIndex] = useState<number | null>(null);

    const [projectWizardOpen, setProjectWizardOpen] = useState(false);
    const [projectWizardDraft, setProjectWizardDraft] = useState<Partial<ProjectFormData>>({});

    const [mediaMenuAnchorEl, setMediaMenuAnchorEl] = useState<HTMLElement | null>(null);
    const [mediaMenuItem, setMediaMenuItem] = useState<any>(null);
    const [mediaMenuIndex, setMediaMenuIndex] = useState<number | null>(null);

    const [documentMenuAnchorEl, setDocumentMenuAnchorEl] = useState<HTMLElement | null>(null);
    const [documentMenuItem, setDocumentMenuItem] = useState<any>(null);
    const [documentMenuIndex, setDocumentMenuIndex] = useState<number | null>(null);

    const handleMediaMenuOpen = (
        event: React.MouseEvent<HTMLElement>,
        item: any,
        index: number
    ) => {
        setMediaMenuAnchorEl(event.currentTarget);
        setMediaMenuItem(item);
        setMediaMenuIndex(index);
    };

    const handleMediaMenuClose = () => {
        setMediaMenuAnchorEl(null);
        setMediaMenuItem(null);
        setMediaMenuIndex(null);
    };

    const handleDocumentMenuOpen = (
        event: React.MouseEvent<HTMLElement>,
        item: any,
        index: number
    ) => {
        setDocumentMenuAnchorEl(event.currentTarget);
        setDocumentMenuItem(item);
        setDocumentMenuIndex(index);
    };

    const handleDocumentMenuClose = () => {
        setDocumentMenuAnchorEl(null);
        setDocumentMenuItem(null);
        setDocumentMenuIndex(null);
    };

    const handleEditDocument = () => {
        if (documentMenuItem == null || documentMenuIndex == null) return;
        openEditor('documents', { ...documentMenuItem, index: documentMenuIndex });
        handleDocumentMenuClose();
    };

    const handleDeleteDocument = async () => {
        if (!company || !documentMenuItem?.id) return;

        try {
            setSaveError(null);

            const res = await fetch(
                `${API_BASE_URL}/companies/${company.id}/documents/${documentMenuItem.id}`,
                {
                    method: 'DELETE',
                    credentials: 'include',
                    headers: {
                        Accept: 'application/json',
                    },
                }
            );

            const data = await readJsonSafe(res);

            if (!res.ok) {
                throw new Error(data?.error || data?.message || 'Failed to delete document');
            }

            await loadCompany();
        } catch (err) {
            setSaveError(err instanceof Error ? err.message : 'Failed to delete document');
        } finally {
            handleDocumentMenuClose();
        }
    };

    const handleEditMedia = () => {
        if (mediaMenuItem == null || mediaMenuIndex == null) return;
        openEditor('media', { ...mediaMenuItem, index: mediaMenuIndex });
        handleMediaMenuClose();
    };

    const handleDeleteMedia = async () => {
        if (!company || !mediaMenuItem?.id) return;

        try {
            setSaveError(null);

            const res = await fetch(
                `${API_BASE_URL}/companies/${company.id}/media/${mediaMenuItem.id}`,
                {
                    method: 'DELETE',
                    credentials: 'include',
                    headers: {
                        Accept: 'application/json',
                    },
                }
            );

            const data = await readJsonSafe(res);

            if (!res.ok) {
                throw new Error(data?.error || data?.message || 'Failed to delete media');
            }

            applyCompanyMediaItems(extractItemsArray<CompanyMediaItem>(data));
        } catch (err) {
            setSaveError(err instanceof Error ? err.message : 'Failed to delete media');
        } finally {
            handleMediaMenuClose();
        }
    };

    const handleTeamMenuOpen = (
        event: React.MouseEvent<HTMLElement>,
        member: any,
        index: number
    ) => {
        setTeamMenuAnchorEl(event.currentTarget);
        setTeamMenuMember(member);
        setTeamMenuIndex(index);
    };

    const handleTeamMenuClose = () => {
        setTeamMenuAnchorEl(null);
        setTeamMenuMember(null);
        setTeamMenuIndex(null);
    };

    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);

    const permissionUserOptions = useMemo<ExistingUserOption[]>(() => {
        if (!company) return [];

        const fromTeam = (company.team ?? []).map((member: any) => ({
            id: String(member.id ?? ''),
            name: String(member.name ?? ''),
            email: member.email ?? undefined,
        }));

        const fromPermissions = (company.permissions ?? []).map((member: any) => ({
            id: String(member.userId ?? member.id ?? ''),
            name: String(member.name ?? ''),
            email: member.email ?? undefined,
        }));

        const merged = [...fromTeam, ...fromPermissions].filter((item) => item.id && item.name);

        const deduped = new Map<string, ExistingUserOption>();
        for (const item of merged) {
            if (!deduped.has(item.id)) deduped.set(item.id, item);
        }

        return [...deduped.values()];
    }, [company]);

    const loadCompany = useCallback(async () => {
        setLoading(true);
        setSaveError(null);

        try {
            const companyData = await getCompanyDetail(id);
            setCompany(companyData);

            await loadUserOptions('');
        } catch (err) {
            setCompany(null);
            setSaveError(err instanceof Error ? err.message : 'Failed to load company');
        } finally {
            setLoading(false);
        }
    }, [id]);

    function getDefaultPrivacyMap(): CompanyPrivacyMap {
        return {
            header: 'public',
            about: 'public',
            media: 'public',
            documents: 'public',
            projects: 'public',
            projectTypes: 'public',
            services: 'public',
            serviceCategories: 'public',
            geographicalCoverage: 'public',
            permissions: 'public',
            team: 'public',
        };
    }

    function withSectionPrivacy(
        prev: CompanyProfile,
        section: Exclude<CompanyEditorSection, ''>,
        visibility: CompanyPrivacyLevel
    ): CompanyProfile {
        const currentPrivacy: CompanyPrivacyMap = prev.privacy ?? getDefaultPrivacyMap();

        return {
            ...prev,
            privacy: {
                ...currentPrivacy,
                [section]: visibility,
            },
        };
    }

    function applyLocalCompanyPatch(
        prev: CompanyProfile,
        payload: SidebarSavePayload
    ): CompanyProfile {
        switch (payload.section) {
            case 'header': {
                const nextLogoUrl = payload.values.logoFile
                    ? URL.createObjectURL(payload.values.logoFile)
                    : ((prev as any).logoUrl ?? null);

                return withSectionPrivacy(
                    {
                        ...prev,
                        displayName: payload.values.displayName,
                        roles: payload.values.roles,
                        type: payload.values.roles[0] as any,
                        website: payload.values.website,
                        description: payload.values.description,
                        country: payload.values.country,
                        countryCode: payload.values.countryCode ?? null,
                        logoUrl: nextLogoUrl,
                    } as CompanyProfile,
                    'header',
                    payload.values.visibility
                );
            }

            case 'about':
                return withSectionPrivacy(
                    {
                        ...prev,
                        fullDescription: payload.values.fullDescription,
                    },
                    'about',
                    payload.values.visibility
                );

            case 'services':
                return withSectionPrivacy(
                    {
                        ...prev,
                        services: payload.values.services,
                    },
                    'services',
                    payload.values.visibility
                );

            case 'serviceCategories':
                return withSectionPrivacy(
                    {
                        ...prev,
                        serviceCategories: payload.values.serviceCategories,
                        serviceTypes: payload.values.serviceCategories,
                    },
                    'serviceCategories',
                    payload.values.visibility
                );

            case 'projectTypes':
                return withSectionPrivacy(
                    {
                        ...prev,
                        projectTypes: payload.values.projectTypes,
                    },
                    'projectTypes',
                    payload.values.visibility
                );

            case 'geographicalCoverage':
                return withSectionPrivacy(
                    {
                        ...prev,
                        geographicalCoverage: payload.values.geographicalCoverage,
                    },
                    'geographicalCoverage',
                    payload.values.visibility
                );

            case 'team': {
                const values = payload.values;
                const nextTeam = [...(prev.team ?? [])];
                const nextPermissions = [...(prev.permissions ?? [])];

                const matchesMember = (member: any, userId?: string, email?: string, name?: string) => {
                    if (userId && member?.id === userId) return true;
                    if (email && member?.email && String(member.email).toLowerCase() === email.toLowerCase()) return true;
                    if (!userId && !email && name && member?.name === name) return true;
                    return false;
                };

                if (values.action === 'remove') {
                    const filteredTeam = nextTeam.filter(
                        (member) => !matchesMember(member, values.userId, values.email, values.name)
                    );

                    const filteredPermissions = nextPermissions.filter((p) => {
                        if (values.userId && p.userId === values.userId) return false;
                        if (values.email && p.email && p.email.toLowerCase() === values.email.toLowerCase()) {
                            return false;
                        }
                        if (!values.userId && !values.email && values.name && p.name === values.name) {
                            return false;
                        }
                        return true;
                    });

                    return {
                        ...prev,
                        team: filteredTeam,
                        permissions: filteredPermissions,
                    };
                }

                const item = {
                    id: values.userId ?? values.previousUserId ?? values.email ?? values.name,
                    name: values.name,
                    email: values.email,
                    role: values.role,
                };

                const matchIndex = nextTeam.findIndex((member) =>
                    matchesMember(
                        member,
                        values.previousUserId ?? values.userId,
                        values.previousEmail ?? values.email,
                        values.name
                    )
                );

                if (matchIndex >= 0) {
                    nextTeam[matchIndex] = item as any;
                } else {
                    nextTeam.push(item as any);
                }

                return {
                    ...prev,
                    team: nextTeam,
                };
            }

            case 'permissions':
                return withSectionPrivacy(
                    {
                        ...prev,
                        permissions: payload.values.permissions,
                        inheritCompanyPermissionsToProjects:
                            payload.values.inheritCompanyPermissionsToProjects ??
                            prev.inheritCompanyPermissionsToProjects ??
                            false,
                    },
                    'permissions',
                    payload.values.visibility
                );

            default:
                return prev;
        }
    }

    function toBackendSectionPayload(
        payload: SidebarSavePayload
    ):
        | {
            section: 'header' | 'about' | 'services' | 'serviceCategories' | 'geographicalCoverage' | 'permissions' | 'team' | 'projectTypes';
            data: Record<string, unknown>;
        }
        | null {
        switch (payload.section) {
            case 'header':
                return {
                    section: 'header',
                    data: {
                        displayName: payload.values.displayName,
                        description: payload.values.description,
                        website: payload.values.website,
                        country: payload.values.country,
                        countryCode: payload.values.countryCode,
                        roles: payload.values.roles,
                        sectionPrivacy: {
                            sectionKey: 'header',
                            visibility: payload.values.visibility,
                        },
                    },
                };

            case 'team':
                return {
                    section: 'team',
                    data:
                        payload.values.action === 'remove'
                            ? {
                                action: 'remove',
                                userId: payload.values.userId,
                                email: payload.values.email,
                                name: payload.values.name,
                                sectionPrivacy: {
                                    sectionKey: 'team',
                                    visibility: payload.values.visibility,
                                },
                            }
                            : {
                                action: 'upsert',
                                userId: payload.values.userId,
                                email: payload.values.email,
                                name: payload.values.name,
                                role: payload.values.role,
                                previousUserId: payload.values.previousUserId,
                                previousEmail: payload.values.previousEmail,
                                sectionPrivacy: {
                                    sectionKey: 'team',
                                    visibility: payload.values.visibility,
                                },
                            },
                };

            case 'about':
                return {
                    section: 'about',
                    data: {
                        fullDescription: payload.values.fullDescription,
                        sectionPrivacy: {
                            sectionKey: 'about',
                            visibility: payload.values.visibility,
                        },
                    },
                };

            case 'services':
                return {
                    section: 'services',
                    data: {
                        services: payload.values.services,
                        sectionPrivacy: {
                            sectionKey: 'services',
                            visibility: payload.values.visibility,
                        },
                    },
                };

            case 'serviceCategories':
                return {
                    section: 'serviceCategories',
                    data: {
                        serviceCategories: payload.values.serviceCategories,
                        sectionPrivacy: {
                            sectionKey: 'serviceCategories',
                            visibility: payload.values.visibility,
                        },
                    },
                };

            case 'projectTypes':
                return {
                    section: 'projectTypes',
                    data: {
                        projectTypes: payload.values.projectTypes,
                        sectionPrivacy: {
                            sectionKey: 'projectTypes',
                            visibility: payload.values.visibility,
                        },
                    },
                };

            case 'permissions':
                return {
                    section: 'permissions',
                    data: {
                        permissions: payload.values.permissions,
                        inheritCompanyPermissionsToProjects:
                            payload.values.inheritCompanyPermissionsToProjects ?? false,
                        sectionPrivacy: {
                            sectionKey: 'permissions',
                            visibility: payload.values.visibility,
                        },
                    },
                };

            case 'geographicalCoverage':
                return {
                    section: 'geographicalCoverage',
                    data: {
                        geographicalCoverage: payload.values.geographicalCoverage ?? [],
                        sectionPrivacy: {
                            sectionKey: 'geographicalCoverage',
                            visibility: payload.values.visibility,
                        },
                    },
                };

            default:
                return null;
        }
    }

    const getAuthJsonHeaders = () => ({
        Accept: 'application/json',
        'Content-Type': 'application/json',
    });

    function extractItemsArray<T = unknown>(payload: any): T[] {
        if (Array.isArray(payload?.items)) return payload.items;
        if (Array.isArray(payload?.data)) return payload.data;
        if (Array.isArray(payload)) return payload;
        return [];
    }

    type CompanyMediaItem = NonNullable<CompanyProfile['media']>[number];

    function applyCompanyMediaItems(items: CompanyMediaItem[]) {
        setCompany((prev) => {
            if (!prev) return prev;
            return {
                ...prev,
                media: items,
            };
        });
    }


    async function readJsonSafe(res: Response) {
        const text = await res.text();
        try {
            return text ? JSON.parse(text) : null;
        } catch {
            return null;
        }
    }

    async function requestPresignedUpload(params: {
        companyId: string;
        kind: 'media' | 'documents';
        file: File;
    }) {
        const query = new URLSearchParams({
            fileName: params.file.name,
            contentType: params.file.type || 'application/octet-stream',
        });

        const res = await fetch(
            `${API_BASE_URL}/companies/${params.companyId}/${params.kind}/upload-url?${query.toString()}`,
            {
                method: 'GET',
                credentials: 'include',
                headers: {
                    Accept: 'application/json',
                },
            }
        );

        const data = await readJsonSafe(res);

        if (!res.ok || !data?.data?.uploadUrl || !data?.data?.key || !data?.data?.assetUrl) {
            throw new Error(data?.error || data?.message || 'Failed to get upload URL');
        }

        return data.data as {
            uploadUrl: string;
            key: string;
            assetUrl: string;
        };
    }

    async function putFileToSignedUrl(uploadUrl: string, file: File) {
        const putRes = await fetch(uploadUrl, {
            method: 'PUT',
            headers: {
                'Content-Type': file.type || 'application/octet-stream',
            },
            body: file,
        });

        if (!putRes.ok) {
            throw new Error('Failed to upload file to storage');
        }
    }

    const uploadCompanyMedia = async (input: {
        file?: File | null;
        caption: string;
        visibility: 'public' | 'hidden';
        editingItem?: any;
        isCover?: boolean;
        kind?: string;
    }) => {
        if (!company) return;

        const isEdit = Boolean(input.editingItem?.id);
        const mediaId = input.editingItem?.id;

        if (isEdit) {
            if (input.file) {
                throw new Error(
                    'Replacing an existing media file is not supported yet. Update caption only, or delete and add a new file.'
                );
            }

            const res = await fetch(`${API_BASE_URL}/companies/${company.id}/media/${mediaId}`, {
                method: 'PATCH',
                credentials: 'include',
                headers: getAuthJsonHeaders(),
                body: JSON.stringify({
                    caption: input.caption,
                    ...(input.isCover !== undefined ? { isCover: input.isCover } : {}),
                }),
            });

            const data = await readJsonSafe(res);

            if (!res.ok) {
                throw new Error(data?.error || data?.message || 'Failed to update media');
            }

            applyCompanyMediaItems(extractItemsArray<CompanyMediaItem>(data));
            return;
        }

        if (!input.file) {
            throw new Error('Please choose a media file');
        }

        const upload = await requestPresignedUpload({
            companyId: company.id,
            kind: 'media',
            file: input.file,
        });

        await putFileToSignedUrl(upload.uploadUrl, input.file);

        const createRes = await fetch(`${API_BASE_URL}/companies/${company.id}/media`, {
            method: 'POST',
            credentials: 'include',
            headers: getAuthJsonHeaders(),
            body: JSON.stringify({
                kind: input.kind ?? 'gallery',
                caption: input.caption,
                assetUrl: upload.assetUrl,
                s3Key: upload.key,
                contentType: input.file.type || 'application/octet-stream',
                isCover: Boolean(input.isCover),
                metadata: {
                    originalName: input.file.name,
                    size: input.file.size,
                },
            }),
        });

        const createData = await readJsonSafe(createRes);

        if (!createRes.ok) {
            throw new Error(createData?.error || createData?.message || 'Failed to create media record');
        }

        applyCompanyMediaItems(extractItemsArray<CompanyMediaItem>(createData));
    };

    const uploadCompanyDocument = async (input: {
        file?: File | null;
        name: string;
        type: string;
        visibility: 'public' | 'hidden';
        editingItem?: any;
    }) => {
        if (!company) return;

        const isEdit = Boolean(input.editingItem?.id);
        const documentId = input.editingItem?.id;

        if (isEdit) {
            if (input.file) {
                throw new Error('Replacing an existing document file is not supported yet. Update document metadata only, or delete and add a new file.');
            }

            const res = await fetch(`${API_BASE_URL}/companies/${company.id}/documents/${documentId}`, {
                method: 'PATCH',
                credentials: 'include',
                headers: getAuthJsonHeaders(),
                body: JSON.stringify({
                    name: input.name,
                    type: input.type,
                }),
            });

            const data = await readJsonSafe(res);

            if (!res.ok) {
                throw new Error(data?.error || data?.message || 'Failed to update document');
            }

            await loadCompany();
            return;
        }

        if (!input.file) {
            throw new Error('Please choose a document file');
        }

        const upload = await requestPresignedUpload({
            companyId: company.id,
            kind: 'documents',
            file: input.file,
        });

        await putFileToSignedUrl(upload.uploadUrl, input.file);

        const createRes = await fetch(`${API_BASE_URL}/companies/${company.id}/documents`, {
            method: 'POST',
            credentials: 'include',
            headers: getAuthJsonHeaders(),
            body: JSON.stringify({
                kind: 'general',
                name: input.name,
                type: input.type,
                assetUrl: upload.assetUrl,
                s3Key: upload.key,
                contentType: input.file.type || 'application/octet-stream',
                metadata: {
                    originalName: input.file.name,
                    size: input.file.size,
                },
            }),
        });

        const createData = await readJsonSafe(createRes);

        if (!createRes.ok) {
            throw new Error(createData?.error || createData?.message || 'Failed to create document record');
        }

        await loadCompany();
    };

    const handleSidebarSave = async (payload: SidebarSavePayload) => {
        if (!company) return;

        const previous = company;
        const optimistic = applyLocalCompanyPatch(company, payload);

        setCompany(optimistic);
        setSaveError(null);
        setSidebarOpen(false);

        const backendPayload = toBackendSectionPayload(payload);

        try {
            setSaving(true);

            let updatedCompany = previous;

            if (backendPayload) {
                updatedCompany = await patchCompanySection(
                    company.id,
                    backendPayload.section,
                    backendPayload.data
                );
                setCompany(updatedCompany);
            }

            if (payload.section === 'header' && payload.values.logoFile) {
                await uploadCompanyMedia({
                    file: payload.values.logoFile,
                    caption: '',
                    visibility: payload.values.visibility,
                    kind: 'logo',
                });

                await loadCompany();
            }
        } catch (err) {
            setCompany(previous);
            setSaveError(err instanceof Error ? err.message : 'Failed to save changes');
        } finally {
            setSaving(false);
        }
    };

    const loadUserOptions = async (q = '') => {
        try {
            const options = await getUserOptions(q);
            setDirectoryUsers(options);
        } catch (err) {
            setSaveError(err instanceof Error ? err.message : 'Failed to load users');
        }
    };

    useEffect(() => {
        void loadCompany();
    }, [loadCompany]);

    const openEditor = (section: CompanyEditorSection, item?: any) => {
        setSidebarSection(section);
        setEditingItem(item ?? null);
        setSaveError(null);
        setSidebarOpen(true);
    };

    const handleOpenProjectWizard = () => {
        setProjectWizardDraft({
            companyId: company?.id ?? '',
        });
        setProjectWizardOpen(true);
    };

    const handleProjectWizardClose = async (result?: WizardCloseResult) => {
        setProjectWizardOpen(false);

        if (!result?.completed) {
            return;
        }

        setProjectWizardDraft({});

        // refresh company so the new project appears in the Projects section
        await loadCompany();

        // remain on the same company page
        navigate(`/companies/${id}`, { replace: true });
    };

    if (loading) return <Box p={3}>Loading...</Box>;
    if (!company) return <Box p={3}>Company not found.</Box>;

    return (
        <>
            {saveError && (
                <Paper
                    variant="outlined"
                    sx={{
                        mb: 2,
                        p: 2,
                        borderRadius: 2,
                        borderColor: 'error.light',
                        bgcolor: 'error.50',
                    }}
                >
                    <Typography variant="body2" color="error.main">
                        {saveError}
                    </Typography>
                </Paper>
            )}

            <CompanyProfileView
                company={company}
                mode="edit"
                backLabel="My Companies"
                onBack={() => navigate('/companies?tab=my')}
                canEdit={canEditCompany(company)}
                canContact={false}
                canShare
                showOwnerBadge
                shareAnchorEl={shareAnchorEl}
                onOpenShare={setShareAnchorEl}
                onCloseShare={() => setShareAnchorEl(null)}
                canViewPrivateSection={(section) => canViewCompanySection(company, section)}
                onEditSection={(section) => {
                    if (section === 'header') {
                        openEditor('header');
                        return;
                    }
                    openEditor(section as CompanyEditorSection);
                }}
                onAddTeam={() => openEditor('team')}
                onAddMedia={() => openEditor('media')}
                onAddDocument={() => openEditor('documents')}
                onOpenProjectWizard={handleOpenProjectWizard}
                onMediaMenuClick={(e, item, index) => handleMediaMenuOpen(e, item, index)}
                renderTeamActions={(member, index) => (
                    <IconButton
                        size="small"
                        onClick={(e) => handleTeamMenuOpen(e, member, index)}
                        sx={{
                            color: 'grey.400',
                            '&:hover': {
                                color: 'grey.600',
                            },
                        }}
                    >
                        <MoreVertRounded sx={{ fontSize: 18 }} />
                    </IconButton>
                )}

                renderDocumentActions={(doc, index) => (
                    <IconButton
                        size="small"
                        onClick={(e) => handleDocumentMenuOpen(e, doc, index)}
                        sx={{
                            color: 'grey.400',
                            '&:hover': {
                                color: 'grey.600',
                            },
                        }}
                    >
                        <MoreVertRounded sx={{ fontSize: 18 }} />
                    </IconButton>
                )}
            />

            <Menu
                anchorEl={mediaMenuAnchorEl}
                open={Boolean(mediaMenuAnchorEl)}
                onClose={handleMediaMenuClose}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                }}
                PaperProps={{
                    sx: {
                        minWidth: 160,
                        boxShadow: 3,
                    },
                }}
            >
                <MenuItem onClick={handleEditMedia}>
                    <ListItemIcon>
                        <EditRounded sx={{ fontSize: 18 }} />
                    </ListItemIcon>
                    <ListItemText
                        primary="Edit"
                        primaryTypographyProps={{
                            variant: 'body2',
                        }}
                    />
                </MenuItem>

                <MenuItem
                    onClick={handleDeleteMedia}
                    sx={{
                        color: 'error.main',
                    }}
                >
                    <ListItemIcon>
                        <DeleteRounded
                            sx={{
                                fontSize: 18,
                                color: 'error.main',
                            }}
                        />
                    </ListItemIcon>
                    <ListItemText
                        primary="Delete"
                        primaryTypographyProps={{
                            variant: 'body2',
                        }}
                    />
                </MenuItem>
            </Menu>

            <Menu
                anchorEl={documentMenuAnchorEl}
                open={Boolean(documentMenuAnchorEl)}
                onClose={handleDocumentMenuClose}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                }}
                PaperProps={{
                    sx: {
                        minWidth: 160,
                        boxShadow: 3,
                    },
                }}
            >
                <MenuItem onClick={handleEditDocument}>
                    <ListItemIcon>
                        <EditRounded sx={{ fontSize: 18 }} />
                    </ListItemIcon>
                    <ListItemText
                        primary="Edit"
                        primaryTypographyProps={{
                            variant: 'body2',
                        }}
                    />
                </MenuItem>

                <MenuItem
                    onClick={handleDeleteDocument}
                    sx={{
                        color: 'error.main',
                    }}
                >
                    <ListItemIcon>
                        <DeleteRounded
                            sx={{
                                fontSize: 18,
                                color: 'error.main',
                            }}
                        />
                    </ListItemIcon>
                    <ListItemText
                        primary="Delete"
                        primaryTypographyProps={{
                            variant: 'body2',
                        }}
                    />
                </MenuItem>
            </Menu>

            <CompanySidebarEditor
                open={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                section={sidebarSection}
                company={company}
                existingUsers={sidebarSection === 'permissions' ? permissionUserOptions : directoryUsers}
                editingItem={editingItem}
                onSave={handleSidebarSave}
                onUploadMedia={uploadCompanyMedia}
                onUploadDocument={uploadCompanyDocument}
            />

            <ProjectWizard
                open={projectWizardOpen}
                onClose={handleProjectWizardClose}
                hasCompanies
                preferredCompanyId={company.id}
                draft={projectWizardDraft}
                onDraftChange={setProjectWizardDraft}
                isOnboarding={false}
            />
        </>
    );
}