import React, { useEffect, useMemo, useState } from 'react';
import {
    Alert,
    Paper,
    Box,
    Button,
    Divider,
    Drawer,
    FormControl,
    InputAdornment,
    InputLabel,
    MenuItem,
    Select,
    Stack,
    Switch,
    TextField,
    Typography,
    FormControlLabel,
    IconButton,
    Avatar,
    ToggleButtonGroup,
    ToggleButton,
    Chip,
} from '@mui/material';
import ImageRounded from '@mui/icons-material/ImageRounded';
import PublicRounded from '@mui/icons-material/PublicRounded';
import LockRounded from '@mui/icons-material/LockRounded';
import PhotoCameraRounded from '@mui/icons-material/PhotoCameraRounded';
import LocationOnRounded from '@mui/icons-material/LocationOnRounded';
import SearchRounded from '@mui/icons-material/SearchRounded';
import CloseRounded from '@mui/icons-material/CloseRounded';
import BusinessRounded from '@mui/icons-material/BusinessRounded';
import PeopleRounded from '@mui/icons-material/PeopleRounded';
import DeleteOutlineRounded from '@mui/icons-material/DeleteOutlineRounded';
import CloudUploadRounded from '@mui/icons-material/CloudUploadRounded';
import InsertDriveFileRounded from '@mui/icons-material/InsertDriveFileRounded';
import StarRounded from '@mui/icons-material/StarRounded';

import type {
    ProjectDocument,
    ProjectEditorTarget,
    ProjectMediaItem,
    ProjectOpportunity,
    ProjectProfileData,
    ProjectSectionKey,
    ProjectStage,
    ProjectTeamMember,
    ProjectUpdate,
    SectionVisibility,
} from './ProjectProfileView';

type EditableProjectPatch = Partial<ProjectProfileData>;

type MeResponse = {
    ok?: boolean;
    user?: {
        id: string;
        email: string;
        name?: string | null;
        avatarUrl?: string | null;
    };
};

type PlatformCollaboratorOption = {
    id: string;
    entityType: 'user' | 'company';
    name: string;
    email?: string;
    companyName?: string;
    avatarUrl?: string | null;
    subtitle?: string;
};

type TeamEditorMember =
    | {
        id: string;
        memberType: 'user';
        memberId: string;
        userId?: string | null;
        companyId?: null;
        name: string;
        role?: string | null;
        companyName?: string;
        avatarUrl?: string | null;
        permission?: 'creator' | 'viewer' | null;
    }
    | {
        id: string;
        memberType: 'company';
        memberId: string;
        companyId?: string | null;
        userId?: null;
        name: string;
        role?: string | null;
        companyName?: string;
        avatarUrl?: string | null;
        permission?: null;
    };

const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL ??
    (window as any).__API_BASE_URL__ ??
    '';

export type SaveProjectPatch = Omit<EditableProjectPatch, 'team' | 'sectionVisibility'> & {
    team?: Array<
        | {
            memberType: 'user';
            memberId: string;
            userId?: string | null;
            companyId?: null;
            name?: string;
            companyName?: string;
            avatarUrl?: string | null;
            role?: string | null;
            permission?: 'creator' | 'viewer';
        }
        | {
            memberType: 'company';
            memberId: string;
            companyId?: string | null;
            userId?: null;
            name?: string;
            companyName?: string;
            avatarUrl?: string | null;
            role?: string | null;
            permission?: null;
        }
    >;
    sectionVisibility?: Partial<Record<ProjectSectionKey, SectionVisibility>>;
};

export interface ProjectSidebarEditorProps {
    open: boolean;
    section: ProjectEditorTarget | null;
    project: ProjectProfileData | null;
    onClose: () => void;
    onSave: (patch: SaveProjectPatch) => Promise<void> | void;
    onProjectChange?: (nextProject: ProjectProfileData) => void;
}

const SECTION_LABELS: Record<ProjectEditorTarget, string> = {
    overview: 'Overview',
    story: 'Project Story',
    location: 'Location',
    readiness: 'Readiness',
    registry: 'Registry',
    impact: 'Impact',
    opportunities: 'Opportunities',
    updates: 'Updates',
    documents: 'Documents',
    media: 'Media',
    team: 'Team',
    settings: 'Settings',
};

function toUiVisibility(value: string | null | undefined): SectionVisibility {
    return value === 'private' ? 'private' : 'public';
}

function toApiVisibility(value: SectionVisibility | null | undefined): 'public' | 'private' {
    return value === 'private' ? 'private' : 'public';
}

const STAGES: ProjectStage[] = [
    'Exploration',
    'Concept',
    'Design',
    'Listed',
    'Validation',
    'Registered',
    'Issued',
    'Closed',
];

function permissionLabel(value: 'creator' | 'viewer' | null | undefined) {
    return value === 'creator' ? 'Owner' : 'Viewer';
}

const OPPORTUNITY_TYPES = [
    'Financing',
    'MRV Provider',
    'Buyer',
    'Insurance',
    'Legal',
    'Technical Advisor',
    'Community Partner',
    'Other',
];

function emptyOpportunity(): ProjectOpportunity {
    return {
        id: crypto.randomUUID(),
        type: '',
        description: '',
        urgent: false,
    };
}

function ensureOpportunityDraft(items?: ProjectOpportunity[] | null): ProjectOpportunity[] {
    const normalized = Array.isArray(items) ? items : [];
    return normalized.length > 0 ? normalized : [emptyOpportunity()];
}

function emptyUpdate(authorName = ''): ProjectUpdate {
    return {
        id: crypto.randomUUID(),
        title: '',
        description: '',
        dateLabel: '',
        authorName,
        type: 'progress',
    };
}

function ensureUpdateDraft(
    items?: ProjectUpdate[] | null,
    authorName = ''
): ProjectUpdate[] {
    const normalized = Array.isArray(items) ? items : [];
    return normalized.length > 0
        ? normalized.map((item) => ({
            ...item,
            authorName: item.authorName ?? authorName,
        }))
        : [emptyUpdate(authorName)];
}

function normalizeTeamMember(member: ProjectTeamMember): TeamEditorMember | null {
    if (member.memberType === 'company') {
        const companyId = member.companyId ?? member.memberId ?? member.id;
        if (!companyId) return null;

        return {
            id: member.id ?? crypto.randomUUID(),
            memberType: 'company',
            memberId: companyId,
            companyId,
            userId: null,
            name: member.name ?? member.companyName ?? '',
            role: member.role ?? '',
            companyName: member.companyName ?? member.name ?? '',
            avatarUrl: member.avatarUrl ?? null,
            permission: null,
        };
    }

    const userId = member.userId ?? member.memberId ?? member.id;
    if (!userId) return null;

    return {
        id: member.id ?? crypto.randomUUID(),
        memberType: 'user',
        memberId: userId,
        userId,
        companyId: null,
        name: member.name ?? '',
        role: member.role ?? '',
        companyName: member.companyName ?? '',
        avatarUrl: member.avatarUrl ?? null,
        permission: member.permission ?? 'viewer',
    };
}

function VisibilityField({
    value,
    onChange,
}: {
    value: SectionVisibility;
    onChange: (value: SectionVisibility) => void;
}) {
    return (
        <FormControl fullWidth size="small">
            <InputLabel>Section visibility</InputLabel>
            <Select
                value={value}
                label="Section visibility"
                onChange={(e) => onChange(e.target.value as SectionVisibility)}
            >
                <MenuItem value="public">
                    <Stack direction="row" spacing={1} alignItems="center">
                        <PublicRounded fontSize="small" />
                        <span>Public</span>
                    </Stack>
                </MenuItem>
                <MenuItem value="private">
                    <Stack direction="row" spacing={1} alignItems="center">
                        <LockRounded fontSize="small" />
                        <span>Private</span>
                    </Stack>
                </MenuItem>
            </Select>
        </FormControl>
    );
}

type ProjectEditorForm = Omit<Partial<ProjectProfileData>, 'team' | 'sectionVisibility'> & {
    team?: TeamEditorMember[];
    sectionVisibility?: Partial<Record<ProjectSectionKey, SectionVisibility>>;
};

type UploadState = {
    busy: boolean;
    error: string | null;
};

type ProjectAssetUploadResponse = {
    ok: boolean;
    data?: {
        uploadUrl: string;
        assetUrl: string;
        s3Key: string;
        key?: string;
    };
    error?: string;
};

async function parseJsonSafe(response: Response) {
    try {
        return await response.json();
    } catch {
        return null;
    }
}

function getErrorMessage(payload: any, fallback: string) {
    return (
        payload?.error ||
        payload?.message ||
        payload?.detail ||
        fallback
    );
}

export default function ProjectSidebarEditor({
    open,
    section,
    project,
    onClose,
    onSave,
    onProjectChange,
}: ProjectSidebarEditorProps) {
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState<ProjectEditorForm>({});
    const [teamSearch, setTeamSearch] = useState('');
    const [collaboratorOptions, setCollaboratorOptions] = useState<PlatformCollaboratorOption[]>([]);
    const [optionsLoading, setOptionsLoading] = useState(false);
    const [mediaUpload, setMediaUpload] = useState<UploadState>({ busy: false, error: null });
    const [documentUpload, setDocumentUpload] = useState<UploadState>({ busy: false, error: null });
    const [teamRole, setTeamRole] = useState<'user' | 'company'>('user');
    const [baseTeam, setBaseTeam] = useState<TeamEditorMember[]>([]);
    const [currentUserName, setCurrentUserName] = useState('');
    const [meLoading, setMeLoading] = useState(false);

    const visibilityValue = useMemo<SectionVisibility>(() => {
        if (!section || section === 'settings') return 'public';

        return toUiVisibility(
            form.sectionVisibility?.[section] ??
            project?.sectionVisibility?.[section] ??
            'public'
        );
    }, [form.sectionVisibility, project, section]);

    const loadCollaboratorOptions = async (q = '', mode: 'user' | 'company' = 'user') => {
        try {
            setOptionsLoading(true);

            const endpoint =
                mode === 'company'
                    ? `${API_BASE_URL}/companies/options?q=${encodeURIComponent(q)}`
                    : `${API_BASE_URL}/users/options?q=${encodeURIComponent(q)}`;

            const response = await fetch(endpoint, {
                method: 'GET',
                credentials: 'include',
                headers: { Accept: 'application/json' },
            });

            const payload = await response.json().catch(() => null);

            if (!response.ok) {
                throw new Error(payload?.error || `Failed to load ${mode}s (${response.status})`);
            }

            const items = Array.isArray(payload?.items)
                ? payload.items
                : Array.isArray(payload?.data)
                    ? payload.data
                    : [];

            const mapped: PlatformCollaboratorOption[] =
                mode === 'company'
                    ? items.map((item: any) => ({
                        id: String(item.id),
                        entityType: 'company',
                        name: String(item.displayName ?? item.name ?? ''),
                        companyName: String(item.displayName ?? item.name ?? ''),
                        avatarUrl: item.logoUrl ?? item.avatarUrl ?? null,
                        subtitle: item.primaryCountry ?? item.businessFunction ?? 'Company',
                    }))
                    : items.map((item: any) => ({
                        id: String(item.id),
                        entityType: 'user',
                        name: String(item.name ?? ''),
                        email: item.email ?? undefined,
                        companyName: item.companyName ?? undefined,
                        avatarUrl: item.avatarUrl ?? null,
                        subtitle: item.email ?? item.companyName ?? 'User',
                    }));

            setCollaboratorOptions(mapped);
        } catch (error) {
            console.error(error);
            setCollaboratorOptions([]);
        } finally {
            setOptionsLoading(false);
        }
    };

    const syncProjectState = (nextProject: Partial<ProjectProfileData> | null | undefined) => {
        if (!project || !nextProject) return;

        const merged: ProjectProfileData = {
            ...project,
            ...nextProject,
            documents: nextProject.documents ?? project.documents ?? [],
            media: nextProject.media ?? project.media ?? [],
            team: nextProject.team ?? project.team ?? [],
            opportunities: nextProject.opportunities ?? project.opportunities ?? [],
            updates: nextProject.updates ?? project.updates ?? [],
            readiness: nextProject.readiness ?? project.readiness ?? [],
            serviceProviders: nextProject.serviceProviders ?? project.serviceProviders ?? [],
            sectionVisibility: nextProject.sectionVisibility ?? project.sectionVisibility ?? {},
            coverImageUrl:
                nextProject.coverImageUrl ??
                project.coverImageUrl ??
                null,
        };

        onProjectChange?.(merged);
    };

    useEffect(() => {
        if (!open || section !== 'updates') return;

        let cancelled = false;

        async function loadMe() {
            setMeLoading(true);

            try {
                const response = await fetch(`${API_BASE_URL}/auth/me`, {
                    method: 'GET',
                    credentials: 'include',
                    headers: { Accept: 'application/json' },
                });

                const payload = (await parseJsonSafe(response)) as MeResponse | null;

                if (!response.ok) {
                    throw new Error(getErrorMessage(payload, `Failed to load current user (${response.status})`));
                }

                const nextName = payload?.user?.name?.trim() ?? '';

                if (!cancelled) {
                    setCurrentUserName(nextName);
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
    }, [open, section]);


    useEffect(() => {
        if (!open || (section !== 'team' && section !== 'settings')) return;

        const q = teamSearch.trim();
        if (!q) {
            setCollaboratorOptions([]);
            return;
        }

        const timeout = window.setTimeout(() => {
            void loadCollaboratorOptions(q, teamRole);
        }, 250);

        return () => window.clearTimeout(timeout);
    }, [open, section, teamSearch, teamRole]);

    useEffect(() => {
        if (!open || !project || !section) return;

        switch (section) {
            case 'overview':
                setForm({
                    name: project.name ?? '',
                    stage: project.stage,
                    type: project.type ?? '',
                    description: project.description ?? '',
                    coverImageUrl: project.coverImageUrl ?? '',
                    estimatedAnnualRemoval: project.estimatedAnnualRemoval ?? '',
                    totalAreaHa: project.totalAreaHa ?? null,
                    sectionVisibility: {
                        ...project.sectionVisibility,
                        overview: project.sectionVisibility?.overview ?? 'public',
                    },
                });
                break;

            case 'story':
                setForm({
                    storyProblem: project.storyProblem ?? '',
                    storyApproach: project.storyApproach ?? '',
                    sectionVisibility: {
                        ...project.sectionVisibility,
                        story: project.sectionVisibility?.story ?? 'public',
                    },
                });
                break;

            case 'location':
                setForm({
                    country: project.country ?? '',
                    region: project.region ?? '',
                    latitude: project.latitude ?? null,
                    longitude: project.longitude ?? null,
                    totalAreaHa: project.totalAreaHa ?? null,
                    sectionVisibility: {
                        ...project.sectionVisibility,
                        location: project.sectionVisibility?.location ?? 'public',
                    },
                });
                break;

            case 'readiness':
                setForm({
                    sectionVisibility: {
                        ...project.sectionVisibility,
                        readiness: project.sectionVisibility?.readiness ?? 'public',
                    },
                });
                break;

            case 'registry':
                setForm({
                    registryName: project.registryName ?? '',
                    registryStatus: project.registryStatus ?? '',
                    registryProjectId: project.registryProjectId ?? '',
                    methodology: project.methodology ?? '',
                    sectionVisibility: {
                        ...project.sectionVisibility,
                        registry: project.sectionVisibility?.registry ?? 'public',
                    },
                });
                break;

            case 'impact':
                setForm({
                    totalAreaHa: project.totalAreaHa ?? null,
                    estimatedAnnualRemoval: project.estimatedAnnualRemoval ?? '',
                    sectionVisibility: {
                        ...project.sectionVisibility,
                        impact: project.sectionVisibility?.impact ?? 'public',
                    },
                });
                break;

            case 'opportunities':
                setForm({
                    opportunities: ensureOpportunityDraft(project.opportunities),
                    sectionVisibility: {
                        ...project.sectionVisibility,
                        opportunities: project.sectionVisibility?.opportunities ?? 'public',
                    },
                });
                break;

            case 'updates':
                setForm({
                    updates: ensureUpdateDraft(project.updates, currentUserName),
                    sectionVisibility: {
                        ...project.sectionVisibility,
                        updates: project.sectionVisibility?.updates ?? 'public',
                    },
                });
                break;

            case 'documents':
                setForm({
                    documents: [...(project.documents ?? [])],
                    sectionVisibility: {
                        ...project.sectionVisibility,
                        documents: project.sectionVisibility?.documents ?? 'public',
                    },
                });
                break;

            case 'media':
                setForm({
                    coverImageUrl: project.coverImageUrl ?? '',
                    media: [...(project.media ?? [])],
                    sectionVisibility: {
                        ...project.sectionVisibility,
                        media: project.sectionVisibility?.media ?? 'public',
                    },
                });
                break;

            case 'team': {
                const existingTeam = (project.team ?? [])
                    .map(normalizeTeamMember)
                    .filter((member): member is TeamEditorMember => Boolean(member));

                setBaseTeam(existingTeam);
                setForm({
                    team: [],
                });
                setTeamSearch('');
                setCollaboratorOptions([]);
                setTeamRole('user');
                break;
            }

            case 'settings':
                setForm({
                    team: (project.team ?? [])
                        .map(normalizeTeamMember)
                        .filter((member): member is TeamEditorMember => Boolean(member)),
                });
                setTeamSearch('');
                setCollaboratorOptions([]);
                setTeamRole('user');
                break;

            default:
                setForm({});
        }

        if (section === 'team' || section === 'settings') {
            setTeamSearch('');
            setCollaboratorOptions([]);
            setTeamRole('user');
        }

        if (section !== 'team') {
            setBaseTeam([]);
        }

    }, [open, project, section]);

    useEffect(() => {
        if (!open || section !== 'updates' || !currentUserName) return;

        setForm((prev) => {
            const existing = Array.isArray(prev.updates) ? prev.updates : [];
            if (existing.length === 0) {
                return {
                    ...prev,
                    updates: [emptyUpdate(currentUserName)],
                };
            }

            return {
                ...prev,
                updates: existing.map((item) => ({
                    ...item,
                    authorName: item.authorName?.trim() ? item.authorName : currentUserName,
                })),
            };
        });
    }, [open, section, currentUserName]);

    const updateVisibility = (value: SectionVisibility) => {
        if (!section || section === 'settings') return;

        setForm((prev) => ({
            ...prev,
            sectionVisibility: {
                ...(project?.sectionVisibility ?? {}),
                ...(prev.sectionVisibility ?? {}),
                [section]: value,
            },
        }));
    };

    const requireProjectId = () => {
        if (!project?.id) {
            throw new Error('Project id is missing');
        }
        return project.id;
    };

    const refreshProjectFromResponse = async (response: Response) => {
        const payload = await parseJsonSafe(response);

        if (!response.ok) {
            throw new Error(getErrorMessage(payload, `Request failed (${response.status})`));
        }

        return payload?.data ?? payload;
    };

    const getMediaUploadUrl = async (file: File) => {
        const projectId = requireProjectId();

        const response = await fetch(
            `${API_BASE_URL}/projects/${projectId}/media/upload-url?fileName=${encodeURIComponent(file.name)}&contentType=${encodeURIComponent(file.type || 'application/octet-stream')}`,
            {
                method: 'GET',
                credentials: 'include',
                headers: { Accept: 'application/json' },
            }
        );

        const payload = (await parseJsonSafe(response)) as ProjectAssetUploadResponse | null;

        if (!response.ok || !payload?.data?.uploadUrl || !payload?.data?.assetUrl) {
            throw new Error(getErrorMessage(payload, 'Failed to get media upload URL'));
        }

        return payload.data;
    };

    const getDocumentUploadUrl = async (file: File) => {
        const projectId = requireProjectId();

        const response = await fetch(
            `${API_BASE_URL}/projects/${projectId}/documents/upload-url?fileName=${encodeURIComponent(file.name)}&contentType=${encodeURIComponent(file.type || 'application/octet-stream')}`,
            {
                method: 'GET',
                credentials: 'include',
                headers: { Accept: 'application/json' },
            }
        );

        const payload = (await parseJsonSafe(response)) as ProjectAssetUploadResponse | null;

        if (!response.ok || !payload?.data?.uploadUrl || !payload?.data?.assetUrl) {
            throw new Error(getErrorMessage(payload, 'Failed to get document upload URL'));
        }

        return payload.data;
    };

    const uploadBinaryToSignedUrl = async (uploadUrl: string, file: File) => {
        const uploadResponse = await fetch(uploadUrl, {
            method: 'PUT',
            body: file,
            headers: {
                'Content-Type': file.type || 'application/octet-stream',
            },
        });

        if (!uploadResponse.ok) {
            throw new Error(`Binary upload failed (${uploadResponse.status})`);
        }
    };

    const createMediaRecord = async (input: {
        assetUrl: string;
        s3Key?: string | null;
        contentType?: string | null;
        caption?: string | null;
        isCover?: boolean;
    }) => {
        const projectId = requireProjectId();

        const response = await fetch(`${API_BASE_URL}/projects/${projectId}/media`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                kind: 'gallery',
                assetUrl: input.assetUrl,
                s3Key: input.s3Key ?? null,
                contentType: input.contentType ?? null,
                caption: input.caption ?? null,
                isCover: Boolean(input.isCover),
                metadata: {},
            }),
        });

        return refreshProjectFromResponse(response);
    };

    const updateMediaRecord = async (
        mediaId: string,
        input: { caption?: string | null; isCover?: boolean }
    ) => {
        const projectId = requireProjectId();

        const response = await fetch(`${API_BASE_URL}/projects/${projectId}/media/${mediaId}`, {
            method: 'PATCH',
            credentials: 'include',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(input),
        });

        return refreshProjectFromResponse(response);
    };

    const deleteMediaRecord = async (mediaId: string) => {
        const projectId = requireProjectId();

        const response = await fetch(`${API_BASE_URL}/projects/${projectId}/media/${mediaId}`, {
            method: 'DELETE',
            credentials: 'include',
            headers: { Accept: 'application/json' },
        });

        return refreshProjectFromResponse(response);
    };

    const createDocumentRecord = async (input: {
        assetUrl: string;
        s3Key?: string | null;
        contentType?: string | null;
        name?: string | null;
        type?: string | null;
    }) => {
        const projectId = requireProjectId();

        const response = await fetch(`${API_BASE_URL}/projects/${projectId}/documents`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                kind: 'general',
                assetUrl: input.assetUrl,
                s3Key: input.s3Key ?? null,
                contentType: input.contentType ?? null,
                name: input.name ?? null,
                type: input.type ?? null,
                metadata: {},
            }),
        });

        return refreshProjectFromResponse(response);
    };

    const updateDocumentRecord = async (
        documentId: string,
        input: { name?: string | null; type?: string | null }
    ) => {
        const projectId = requireProjectId();

        const response = await fetch(`${API_BASE_URL}/projects/${projectId}/documents/${documentId}`, {
            method: 'PATCH',
            credentials: 'include',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(input),
        });

        return refreshProjectFromResponse(response);
    };

    const deleteDocumentRecord = async (documentId: string) => {
        const projectId = requireProjectId();

        const response = await fetch(`${API_BASE_URL}/projects/${projectId}/documents/${documentId}`, {
            method: 'DELETE',
            credentials: 'include',
            headers: { Accept: 'application/json' },
        });

        return refreshProjectFromResponse(response);
    };

    const handleMediaFilePicked = async (file: File, isCover = false) => {
        try {
            setMediaUpload({ busy: true, error: null });

            const upload = await getMediaUploadUrl(file);
            await uploadBinaryToSignedUrl(upload.uploadUrl, file);

            const nextProject = await createMediaRecord({
                assetUrl: upload.assetUrl,
                s3Key: upload.s3Key ?? upload.key ?? null,
                contentType: file.type || 'application/octet-stream',
                caption: file.name,
                isCover,
            });

            setForm((prev) => ({
                ...prev,
                media: [...(nextProject?.media ?? [])],
                coverImageUrl: nextProject?.coverImageUrl ?? '',
            }));

            syncProjectState(nextProject);
        } catch (error: any) {
            setMediaUpload({
                busy: false,
                error: error?.message ?? 'Failed to upload media',
            });
            return;
        }

        setMediaUpload({ busy: false, error: null });
    };

    const handleDocumentFilePicked = async (file: File) => {
        try {
            setDocumentUpload({ busy: true, error: null });

            const upload = await getDocumentUploadUrl(file);
            await uploadBinaryToSignedUrl(upload.uploadUrl, file);

            const nextProject = await createDocumentRecord({
                assetUrl: upload.assetUrl,
                s3Key: upload.s3Key ?? upload.key ?? null,
                contentType: file.type || 'application/octet-stream',
                name: file.name,
                type: file.type || null,
            });

            setForm((prev) => ({
                ...prev,
                documents: [...(nextProject?.documents ?? [])],
            }));

            syncProjectState(nextProject);
        } catch (error: any) {
            setDocumentUpload({
                busy: false,
                error: error?.message ?? 'Failed to upload document',
            });
            return;
        }

        setDocumentUpload({ busy: false, error: null });
    };

    const handleMediaMetaSave = async (item: ProjectMediaItem) => {
        if (!item.id) return;

        const nextProject = await updateMediaRecord(item.id, {
            caption: item.caption ?? null,
            isCover: Boolean((item as any).isCover),
        });

        setForm((prev) => ({
            ...prev,
            media: [...(nextProject?.media ?? [])],
            coverImageUrl: nextProject?.coverImageUrl ?? '',
        }));

        syncProjectState(nextProject);
    };

    const handleMediaDelete = async (mediaId: string) => {
        const nextProject = await deleteMediaRecord(mediaId);

        setForm((prev) => ({
            ...prev,
            media: [...(nextProject?.media ?? [])],
            coverImageUrl: nextProject?.coverImageUrl ?? '',
        }));

        syncProjectState(nextProject);
    };

    const handleDocumentMetaSave = async (item: ProjectDocument) => {
        if (!item.id) return;

        const nextProject = await updateDocumentRecord(item.id, {
            name: item.name ?? null,
            type: item.type ?? null,
        });

        setForm((prev) => ({
            ...prev,
            documents: [...(nextProject?.documents ?? [])],
        }));

        syncProjectState(nextProject);
    };

    const handleDocumentDelete = async (documentId: string) => {
        const nextProject = await deleteDocumentRecord(documentId);

        setForm((prev) => ({
            ...prev,
            documents: [...(nextProject?.documents ?? [])],
        }));

        syncProjectState(nextProject);
    };

    const handleSave = async () => {
        if (!section) return;

        setSaving(true);

        try {
            let payload: SaveProjectPatch;

            const normalizedSectionVisibility = form.sectionVisibility
                ? Object.fromEntries(
                    Object.entries(form.sectionVisibility).map(([key, value]) => [
                        key,
                        toApiVisibility(value as SectionVisibility),
                    ])
                ) as SaveProjectPatch['sectionVisibility']
                : undefined;

            if (section === 'team') {
                const combinedTeam = [...baseTeam, ...(form.team ?? [])];

                const dedupedTeam = Array.from(
                    new Map(
                        combinedTeam
                            .filter((member) => Boolean(member.memberId))
                            .map((member) => {
                                const key =
                                    member.memberType === 'company'
                                        ? `company:${member.companyId ?? member.memberId}`
                                        : `user:${member.userId ?? member.memberId}`;
                                return [key, member];
                            })
                    ).values()
                );

                payload = {
                    team: dedupedTeam.map((member) => {
                        if (member.memberType === 'company') {
                            return {
                                memberType: 'company' as const,
                                memberId: member.companyId ?? member.memberId,
                                companyId: member.companyId ?? member.memberId,
                                userId: null,
                                name: member.name,
                                companyName: member.companyName ?? member.name,
                                avatarUrl: member.avatarUrl ?? null,
                                role: member.role ?? null,
                                permission: null,
                            };
                        }

                        return {
                            memberType: 'user' as const,
                            memberId: member.userId ?? member.memberId,
                            userId: member.userId ?? member.memberId,
                            companyId: null,
                            name: member.name,
                            companyName: member.companyName ?? '',
                            avatarUrl: member.avatarUrl ?? null,
                            role: member.role ?? null,
                            permission: member.permission === 'creator' ? 'creator' : 'viewer',
                        };
                    }),
                };
            } else {
                const { team, sectionVisibility, opportunities, updates, documents, media, coverImageUrl, ...rest } = form;

                payload = {
                    ...rest,
                    sectionVisibility: normalizedSectionVisibility,

                    ...(section === 'opportunities'
                        ? {
                            opportunities: (opportunities ?? [])
                                .map((item) => ({
                                    id: item.id,
                                    type: item.type?.trim() ?? '',
                                    description: item.description?.trim() || null,
                                    urgent: Boolean(item.urgent),
                                }))
                                .filter((item) => item.type),
                        }
                        : {}),

                    ...(section === 'updates'
                        ? {
                            updates: (updates ?? [])
                                .map((item) => ({
                                    id: item.id,
                                    title: item.title?.trim() ?? '',
                                    description: item.description?.trim() || null,
                                    dateLabel: item.dateLabel?.trim() || null,
                                    authorName: item.authorName?.trim() || null,
                                    type: item.type ?? 'progress',
                                }))
                                .filter((item) => item.title),
                        }
                        : {}),
                };
            }

            await onSave(payload);
            onClose();
        } finally {
            setSaving(false);
        }
    };

    if (!project || !section) {
        return (
            <Drawer anchor="right" open={open} onClose={onClose}>
                <Box sx={{ width: { xs: '100vw', sm: 460 }, p: 3 }}>
                    <Typography variant="h6" fontWeight={700}>
                        Project editor
                    </Typography>
                    <Alert severity="info" sx={{ mt: 2 }}>
                        Select a section to edit.
                    </Alert>
                </Box>
            </Drawer>
        );
    }

    const setField = <K extends keyof ProjectEditorForm>(
        key: K,
        value: ProjectEditorForm[K]
    ) => {
        setForm((prev) => ({ ...prev, [key]: value }));
    };

    const renderSettings = () => {
        const items = (form.team ?? []) as TeamEditorMember[];

        const selectedKeys = new Set(items.map((item) => item.memberId));

        const searchResults = collaboratorOptions.filter(
            (entry) => !selectedKeys.has(entry.id)
        );

        const addPermissionMember = (entry: PlatformCollaboratorOption) => {
            const nextMember: TeamEditorMember = {
                id: crypto.randomUUID(),
                memberType: 'user',
                memberId: entry.id,
                userId: entry.id,
                name: entry.name,
                role: '',
                companyName: entry.companyName ?? '',
                avatarUrl: entry.avatarUrl ?? null,
                permission: 'viewer',
            };

            setField('team', [...items, nextMember]);
            setTeamSearch('');
            setCollaboratorOptions([]);
        };

        return (
            <Stack spacing={3}>
                <Box>
                    <Typography
                        variant="caption"
                        fontWeight={600}
                        color="text.secondary"
                        sx={{
                            textTransform: 'uppercase',
                            letterSpacing: 0.5,
                            display: 'block',
                            mb: 0.5,
                        }}
                    >
                        Permissions
                    </Typography>

                    <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{
                            display: 'block',
                            mb: 1.5,
                        }}
                    >
                        Control who can access this project. Only existing platform users can be added here.
                    </Typography>

                    <Stack spacing={1} mb={3.5}>
                        {items.length > 0 ? (
                            items.map((member, index) => {
                                const isCreator = member.permission === 'creator';

                                return (
                                    <Box
                                        key={`${member.memberId}:${index}`}
                                        display="flex"
                                        alignItems="center"
                                        gap={1.5}
                                        p={1.25}
                                        borderRadius={1}
                                        sx={{
                                            border: '1px solid',
                                            borderColor: 'grey.100',
                                            bgcolor: 'white',
                                        }}
                                    >
                                        <Avatar
                                            src={member.avatarUrl ?? undefined}
                                            sx={{
                                                width: 32,
                                                height: 32,
                                                bgcolor: 'grey.200',
                                                fontSize: '0.7rem',
                                                fontWeight: 600,
                                                flexShrink: 0,
                                            }}
                                        >
                                            {member.name
                                                .split(' ')
                                                .map((n) => n[0])
                                                .join('')
                                                .slice(0, 2)
                                                .toUpperCase()}
                                        </Avatar>

                                        <Box flex={1} minWidth={0} overflow="hidden">
                                            <Typography
                                                variant="body2"
                                                fontWeight={500}
                                                sx={{
                                                    display: '-webkit-box',
                                                    WebkitLineClamp: 2,
                                                    WebkitBoxOrient: 'vertical',
                                                    overflow: 'hidden',
                                                    wordBreak: 'break-word',
                                                    lineHeight: 1.4,
                                                }}
                                            >
                                                {member.name}
                                            </Typography>

                                            <Typography
                                                variant="caption"
                                                color="text.secondary"
                                                sx={{
                                                    display: 'block',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap',
                                                }}
                                            >
                                                {member.companyName
                                                    ? `${member.companyName}${member.role ? ` · ${member.role}` : ''}`
                                                    : member.role || 'Platform user'}
                                            </Typography>
                                        </Box>

                                        <FormControl
                                            size="small"
                                            sx={{
                                                minWidth: 100,
                                                flexShrink: 0,
                                            }}
                                        >
                                            <Select
                                                value={isCreator ? 'creator' : 'viewer'}
                                                disabled
                                                sx={{
                                                    fontSize: '0.75rem',
                                                    height: 28,
                                                }}
                                            >
                                                {isCreator ? (
                                                    <MenuItem value="creator">
                                                        <Typography variant="caption">Owner</Typography>
                                                    </MenuItem>
                                                ) : (
                                                    <MenuItem value="viewer">
                                                        <Typography variant="caption">Viewer</Typography>
                                                    </MenuItem>
                                                )}
                                            </Select>
                                        </FormControl>

                                        {!isCreator && (
                                            <IconButton
                                                size="small"
                                                sx={{
                                                    color: 'grey.400',
                                                    flexShrink: 0,
                                                }}
                                                onClick={() => {
                                                    const next = items.filter((_, i) => i !== index);
                                                    setField('team', next);
                                                }}
                                            >
                                                <CloseRounded sx={{ fontSize: 14 }} />
                                            </IconButton>
                                        )}
                                    </Box>
                                );
                            })
                        ) : (
                            <Alert severity="info">No users with project permissions yet.</Alert>
                        )}
                    </Stack>

                    <Typography
                        variant="caption"
                        fontWeight={600}
                        color="text.secondary"
                        sx={{
                            textTransform: 'uppercase',
                            letterSpacing: 0.5,
                            display: 'block',
                            mb: 2.5,
                        }}
                    >
                        Add Member
                    </Typography>

                    <Stack spacing={2}>
                        <Box>
                            <TextField
                                size="small"
                                fullWidth
                                label="Search existing users"
                                placeholder="Name or email address..."
                                value={teamSearch}
                                onChange={(e) => setTeamSearch(e.target.value)}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <SearchRounded
                                                sx={{
                                                    fontSize: 16,
                                                    color: 'grey.400',
                                                }}
                                            />
                                        </InputAdornment>
                                    ),
                                    endAdornment: teamSearch ? (
                                        <InputAdornment position="end">
                                            <IconButton size="small" onClick={() => setTeamSearch('')}>
                                                <CloseRounded sx={{ fontSize: 16 }} />
                                            </IconButton>
                                        </InputAdornment>
                                    ) : undefined,
                                }}
                            />

                            {teamSearch.trim() ? (
                                <Paper
                                    variant="outlined"
                                    sx={{
                                        mt: 1,
                                        borderRadius: 1.5,
                                        overflow: 'hidden',
                                    }}
                                >
                                    {optionsLoading ? (
                                        <Box px={1.5} py={1.5}>
                                            <Typography variant="body2" color="text.secondary">
                                                Loading users...
                                            </Typography>
                                        </Box>
                                    ) : searchResults.length > 0 ? (
                                        searchResults.map((result, index) => (
                                            <Box
                                                key={result.id}
                                                onClick={() => addPermissionMember(result)}
                                                sx={{
                                                    px: 1.5,
                                                    py: 1.25,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 1.25,
                                                    cursor: 'pointer',
                                                    borderBottom:
                                                        index === searchResults.length - 1
                                                            ? 'none'
                                                            : '1px solid',
                                                    borderColor: 'grey.100',
                                                    '&:hover': { bgcolor: 'grey.50' },
                                                }}
                                            >
                                                <Avatar
                                                    src={result.avatarUrl ?? undefined}
                                                    sx={{
                                                        width: 32,
                                                        height: 32,
                                                        bgcolor: 'grey.200',
                                                        color: 'text.primary',
                                                    }}
                                                >
                                                    {result.name
                                                        .split(' ')
                                                        .map((part) => part[0])
                                                        .join('')
                                                        .slice(0, 2)
                                                        .toUpperCase()}
                                                </Avatar>

                                                <Box flex={1} minWidth={0}>
                                                    <Typography variant="body2" fontWeight={600} noWrap>
                                                        {result.name}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary" noWrap>
                                                        {result.email || result.companyName || 'User'}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        ))
                                    ) : (
                                        <Box px={1.5} py={1.5}>
                                            <Typography variant="body2" color="text.secondary">
                                                No matching users found.
                                            </Typography>
                                        </Box>
                                    )}
                                </Paper>
                            ) : null}
                        </Box>

                        <FormControl size="small" fullWidth disabled>
                            <InputLabel>Permission Level</InputLabel>
                            <Select value="viewer" label="Permission Level">
                                <MenuItem value="viewer">Viewer</MenuItem>
                            </Select>
                        </FormControl>
                    </Stack>
                </Box>

                <Divider />

                <Paper
                    variant="outlined"
                    sx={{
                        p: 2,
                        borderRadius: 1.5,
                        bgcolor: 'grey.50',
                    }}
                >
                    <Typography
                        variant="caption"
                        fontWeight={600}
                        color="text.secondary"
                        display="block"
                        mb={1}
                    >
                        Permission Levels
                    </Typography>

                    <Box display="flex" gap={1} mb={0.5}>
                        <Typography variant="caption" fontWeight={600} sx={{ minWidth: 48 }}>
                            Owner
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            Original project owner. This role cannot currently be reassigned here.
                        </Typography>
                    </Box>

                    <Box display="flex" gap={1}>
                        <Typography variant="caption" fontWeight={600} sx={{ minWidth: 48 }}>
                            Viewer
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            Read-only access.
                        </Typography>
                    </Box>
                </Paper>
            </Stack>
        );
    };

    const renderOverview = () => (
        <Stack spacing={3}>
            <Box>
                <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                    Project Details
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Basic identity and headline information for this project.
                </Typography>
            </Box>

            <Box>
                <Typography variant="body2" fontWeight={600} mb={1}>
                    Cover image
                </Typography>

                <Paper
                    variant="outlined"
                    sx={{
                        p: 2.5,
                        borderStyle: 'dashed',
                        borderRadius: 2,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 1,
                        textAlign: 'center',
                        bgcolor: 'grey.50',
                    }}
                >
                    {form.coverImageUrl ? (
                        <Box
                            component="img"
                            src={String(form.coverImageUrl)}
                            alt="Project cover preview"
                            sx={{
                                width: '100%',
                                maxHeight: 180,
                                objectFit: 'cover',
                                borderRadius: 1.5,
                                border: '1px solid',
                                borderColor: 'grey.200',
                            }}
                        />
                    ) : (
                        <PhotoCameraRounded sx={{ fontSize: 32, color: 'grey.400' }} />
                    )}

                    <TextField
                        label="Cover image URL"
                        size="small"
                        fullWidth
                        value={(form.coverImageUrl as string) ?? ''}
                        onChange={(e) => setField('coverImageUrl', e.target.value)}
                        placeholder="Paste image URL for now"
                    />

                    <Typography variant="caption" color="text.secondary">
                        This keeps the current backend-compatible flow. You can swap this for an upload flow later.
                    </Typography>
                </Paper>
            </Box>

            <TextField
                label="Project name"
                size="small"
                fullWidth
                value={(form.name as string) ?? ''}
                onChange={(e) => setField('name', e.target.value)}
            />

            <TextField
                label="Short description"
                size="small"
                multiline
                minRows={4}
                fullWidth
                value={(form.description as string) ?? ''}
                onChange={(e) => setField('description', e.target.value)}
                placeholder="A short, listing-friendly summary of the project"
            />

            <FormControl fullWidth size="small">
                <InputLabel>Stage</InputLabel>
                <Select
                    value={(form.stage as ProjectStage) ?? project.stage}
                    label="Stage"
                    onChange={(e) => setField('stage', e.target.value as ProjectStage)}
                >
                    {STAGES.map((stage) => (
                        <MenuItem key={stage} value={stage}>
                            {stage}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>

            <TextField
                label="Project type"
                size="small"
                fullWidth
                value={(form.type as string) ?? ''}
                onChange={(e) => setField('type', e.target.value)}
            />

            <TextField
                label="Project area (ha)"
                size="small"
                fullWidth
                type="number"
                value={form.totalAreaHa ?? ''}
                onChange={(e) =>
                    setField('totalAreaHa', e.target.value === '' ? null : Number(e.target.value))
                }
                InputProps={{
                    endAdornment: <InputAdornment position="end">ha</InputAdornment>,
                }}
            />

            <TextField
                label="Estimated annual removal"
                size="small"
                fullWidth
                value={(form.estimatedAnnualRemoval as string) ?? ''}
                onChange={(e) => setField('estimatedAnnualRemoval', e.target.value)}
                placeholder="e.g. 60,000 tCO₂e/year"
            />

            <VisibilityField value={visibilityValue} onChange={updateVisibility} />
        </Stack>
    );

    const renderStory = () => (
        <Stack spacing={3}>
            <Box>
                <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                    Project Story
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Tell the story of the project clearly. Keep this section focused on the
                    problem, context, and the project approach.
                </Typography>
            </Box>

            <TextField
                label="Problem and context"
                size="small"
                fullWidth
                multiline
                minRows={5}
                value={(form.storyProblem as string) ?? ''}
                onChange={(e) => setField('storyProblem', e.target.value)}
                placeholder="What problem is this project addressing? What is the local context?"
            />

            <TextField
                label="Project approach"
                size="small"
                fullWidth
                multiline
                minRows={5}
                value={(form.storyApproach as string) ?? ''}
                onChange={(e) => setField('storyApproach', e.target.value)}
                placeholder="How does the project work? What is the intervention or pathway?"
            />

            <VisibilityField value={visibilityValue} onChange={updateVisibility} />
        </Stack>
    );

    const renderLocation = () => {
        const latitude = typeof form.latitude === 'number' ? form.latitude : null;
        const longitude = typeof form.longitude === 'number' ? form.longitude : null;

        return (
            <Stack spacing={3}>
                <Box>
                    <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                        Location
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Add the project geography and approximate coordinates.
                    </Typography>
                </Box>

                <TextField
                    label="Country"
                    size="small"
                    fullWidth
                    value={(form.country as string) ?? ''}
                    onChange={(e) => setField('country', e.target.value)}
                    placeholder="e.g. Malaysia"
                />

                <TextField
                    label="Region / State / Province"
                    size="small"
                    fullWidth
                    value={(form.region as string) ?? ''}
                    onChange={(e) => setField('region', e.target.value)}
                    placeholder="e.g. Sarawak"
                />

                <TextField
                    label="Project area (ha)"
                    size="small"
                    fullWidth
                    type="number"
                    value={form.totalAreaHa ?? ''}
                    onChange={(e) =>
                        setField('totalAreaHa', e.target.value === '' ? null : Number(e.target.value))
                    }
                    InputProps={{
                        endAdornment: <InputAdornment position="end">ha</InputAdornment>,
                    }}
                />

                <Box>
                    <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                        Coordinates
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block" mb={1.5}>
                        Optional. You can enter coordinates manually or click the map preview.
                    </Typography>

                    <Stack direction="row" spacing={1.5}>
                        <TextField
                            label="Latitude"
                            size="small"
                            fullWidth
                            type="number"
                            value={latitude ?? ''}
                            onChange={(e) =>
                                setField('latitude', e.target.value === '' ? null : Number(e.target.value))
                            }
                            inputProps={{ step: 'any', min: -90, max: 90 }}
                        />

                        <TextField
                            label="Longitude"
                            size="small"
                            fullWidth
                            type="number"
                            value={longitude ?? ''}
                            onChange={(e) =>
                                setField('longitude', e.target.value === '' ? null : Number(e.target.value))
                            }
                            inputProps={{ step: 'any', min: -180, max: 180 }}
                        />
                    </Stack>
                </Box>

                <Box>
                    <Typography variant="body2" fontWeight={600} mb={1}>
                        Approximate map preview
                    </Typography>

                    <Box
                        sx={{
                            width: '100%',
                            height: 200,
                            borderRadius: 2,
                            overflow: 'hidden',
                            border: '1px solid',
                            borderColor: 'grey.300',
                            position: 'relative',
                            bgcolor: '#e8f5e9',
                            cursor: 'crosshair',
                        }}
                        onClick={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            const x = (e.clientX - rect.left) / rect.width;
                            const y = (e.clientY - rect.top) / rect.height;

                            const minLat = -5;
                            const maxLat = 20;
                            const minLng = 95;
                            const maxLng = 125;

                            const nextLat = Number((maxLat - y * (maxLat - minLat)).toFixed(4));
                            const nextLng = Number((minLng + x * (maxLng - minLng)).toFixed(4));

                            setField('latitude', nextLat);
                            setField('longitude', nextLng);
                        }}
                    >
                        <Box
                            sx={{
                                width: '100%',
                                height: '100%',
                                background:
                                    'linear-gradient(135deg, #c8e6c9 0%, #a5d6a7 30%, #81c784 60%, #66bb6a 100%)',
                                position: 'relative',
                            }}
                        >
                            <Typography
                                variant="caption"
                                sx={{
                                    position: 'absolute',
                                    bottom: 8,
                                    right: 10,
                                    color: 'rgba(0,0,0,0.32)',
                                    fontSize: '0.65rem',
                                    fontWeight: 700,
                                }}
                            >
                                Southeast Asia
                            </Typography>

                            {latitude == null || longitude == null ? (
                                <Box
                                    sx={{
                                        position: 'absolute',
                                        inset: 0,
                                        display: 'grid',
                                        placeItems: 'center',
                                        textAlign: 'center',
                                    }}
                                >
                                    <Box>
                                        <LocationOnRounded sx={{ fontSize: 28, color: 'rgba(0,0,0,0.18)' }} />
                                        <Typography variant="caption" color="text.disabled" display="block">
                                            Click to drop pin
                                        </Typography>
                                    </Box>
                                </Box>
                            ) : (() => {
                                const minLat = -5;
                                const maxLat = 20;
                                const minLng = 95;
                                const maxLng = 125;
                                const pinX = ((longitude - minLng) / (maxLng - minLng)) * 100;
                                const pinY = ((maxLat - latitude) / (maxLat - minLat)) * 100;

                                if (pinX < 0 || pinX > 100 || pinY < 0 || pinY > 100) return null;

                                return (
                                    <Box
                                        sx={{
                                            position: 'absolute',
                                            left: `${pinX}%`,
                                            top: `${pinY}%`,
                                            transform: 'translate(-50%, -100%)',
                                            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
                                        }}
                                    >
                                        <LocationOnRounded sx={{ fontSize: 32, color: '#d32f2f' }} />
                                    </Box>
                                );
                            })()}
                        </Box>
                    </Box>
                </Box>

                <VisibilityField value={visibilityValue} onChange={updateVisibility} />
            </Stack>
        );
    };

    const renderReadiness = () => (
        <Stack spacing={3}>
            <Alert severity="info">
                Project readiness is derived from the rest of the project data and is not directly editable here.
                Update the project stage and the related sections instead.
            </Alert>

            <VisibilityField value={visibilityValue} onChange={updateVisibility} />
        </Stack>
    );

    const renderRegistry = () => (
        <Stack spacing={3}>
            <TextField
                label="Registry name"
                size="small"
                fullWidth
                value={(form.registryName as string) ?? ''}
                onChange={(e) => setField('registryName', e.target.value)}
            />
            <TextField
                label="Registry status"
                size="small"
                fullWidth
                value={(form.registryStatus as string) ?? ''}
                onChange={(e) => setField('registryStatus', e.target.value)}
            />
            <TextField
                label="Registry project ID"
                size="small"
                fullWidth
                value={(form.registryProjectId as string) ?? ''}
                onChange={(e) => setField('registryProjectId', e.target.value)}
            />
            <TextField
                label="Methodology"
                size="small"
                fullWidth
                value={(form.methodology as string) ?? ''}
                onChange={(e) => setField('methodology', e.target.value)}
            />
            <VisibilityField value={visibilityValue} onChange={updateVisibility} />
        </Stack>
    );

    const renderImpact = () => (
        <Stack spacing={3}>
            <TextField
                label="Project area (ha)"
                size="small"
                fullWidth
                type="number"
                value={form.totalAreaHa ?? ''}
                onChange={(e) =>
                    setField('totalAreaHa', e.target.value === '' ? null : Number(e.target.value))
                }
            />
            <TextField
                label="Estimated annual removal"
                size="small"
                fullWidth
                value={(form.estimatedAnnualRemoval as string) ?? ''}
                onChange={(e) => setField('estimatedAnnualRemoval', e.target.value)}
            />
            <VisibilityField value={visibilityValue} onChange={updateVisibility} />
        </Stack>
    );

    const renderOpportunities = () => {
        const items = ensureOpportunityDraft((form.opportunities ?? []) as ProjectOpportunity[]);

        const updateOpportunity = (
            index: number,
            patch: Partial<ProjectOpportunity>
        ) => {
            const next = [...items];
            next[index] = { ...next[index], ...patch };
            setField('opportunities', next);
        };

        const removeOpportunity = (index: number) => {
            const next = items.filter((_, i) => i !== index);
            setField('opportunities', ensureOpportunityDraft(next));
        };

        return (
            <Stack spacing={3}>
                <Box>
                    <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                        Opportunities
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        What does this project need?
                    </Typography>
                </Box>

                {items.map((item, index) => {
                    const isFirstEmptyDraft =
                        items.length === 1 &&
                        !item.type &&
                        !(item.description ?? '').trim() &&
                        !item.urgent;

                    return (
                        <Paper key={item.id || index} variant="outlined" sx={{ p: 2 }}>
                            <Stack spacing={3}>
                                {!isFirstEmptyDraft && (
                                    <Box
                                        display="flex"
                                        alignItems="center"
                                        justifyContent="space-between"
                                    >
                                        <Typography variant="subtitle2" fontWeight={600}>
                                            Opportunity {index + 1}
                                        </Typography>

                                        <Button
                                            color="error"
                                            size="small"
                                            onClick={() => removeOpportunity(index)}
                                        >
                                            Remove
                                        </Button>
                                    </Box>
                                )}

                                <FormControl fullWidth>
                                    <InputLabel>Type</InputLabel>
                                    <Select
                                        value={item.type || ''}
                                        label="Type"
                                        onChange={(e) =>
                                            updateOpportunity(index, { type: e.target.value })
                                        }
                                    >
                                        {[
                                            'Financing',
                                            'Technical Advisor',
                                            'Buyers',
                                            'MRV Provider',
                                            'Insurance',
                                            'Local Partners',
                                        ].map((type) => (
                                            <MenuItem key={type} value={type}>
                                                {type}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>

                                <TextField
                                    label="Description"
                                    fullWidth
                                    multiline
                                    minRows={2}
                                    value={item.description ?? ''}
                                    onChange={(e) =>
                                        updateOpportunity(index, { description: e.target.value })
                                    }
                                    placeholder="Describe what you're looking for..."
                                />

                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={Boolean(item.urgent)}
                                            onChange={(e) =>
                                                updateOpportunity(index, { urgent: e.target.checked })
                                            }
                                        />
                                    }
                                    label={
                                        <Typography variant="body2">
                                            Mark as priority
                                        </Typography>
                                    }
                                />

                                {isFirstEmptyDraft ? null : (
                                    <Button
                                        color="error"
                                        onClick={() => removeOpportunity(index)}
                                        sx={{ alignSelf: 'flex-start' }}
                                    >
                                        Remove
                                    </Button>
                                )}
                            </Stack>
                        </Paper>
                    );
                })}

                <Button
                    variant="outlined"
                    onClick={() =>
                        setField('opportunities', [...items, emptyOpportunity()])
                    }
                >
                    Add Another Opportunity
                </Button>

                <VisibilityField value={visibilityValue} onChange={updateVisibility} />
            </Stack>
        );
    };

    const renderUpdates = () => {
        const items = ensureUpdateDraft((form.updates ?? []) as ProjectUpdate[]);

        const updateItem = (index: number, patch: Partial<ProjectUpdate>) => {
            const next = [...items];
            next[index] = { ...next[index], ...patch };
            setField('updates', next);
        };

        const removeItem = (index: number) => {
            const next = items.filter((_, i) => i !== index);
            setField('updates', ensureUpdateDraft(next));
        };

        return (
            <Stack spacing={3}>
                <Box>
                    <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                        Post Update
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Share progress with followers.
                    </Typography>
                </Box>

                {items.map((item, index) => {
                    const isSingleBlankDraft =
                        items.length === 1 &&
                        !(item.title ?? '').trim() &&
                        !(item.description ?? '').trim() &&
                        !(item.dateLabel ?? '').trim() &&
                        !(item.authorName ?? '').trim() &&
                        (item.type ?? 'progress') === 'progress';

                    return (
                        <Paper key={item.id || index} variant="outlined" sx={{ p: 2 }}>
                            <Stack spacing={3}>
                                {!isSingleBlankDraft && (
                                    <Box display="flex" alignItems="center" justifyContent="space-between">
                                        <Typography variant="subtitle2" fontWeight={600}>
                                            Update {index + 1}
                                        </Typography>

                                        <Button
                                            color="error"
                                            size="small"
                                            onClick={() => removeItem(index)}
                                        >
                                            Remove
                                        </Button>
                                    </Box>
                                )}

                                <Box>
                                    <Typography
                                        variant="caption"
                                        fontWeight={600}
                                        color="text.secondary"
                                        sx={{
                                            textTransform: 'uppercase',
                                            letterSpacing: 0.5,
                                            display: 'block',
                                            mb: 1,
                                        }}
                                    >
                                        Update Type
                                    </Typography>

                                    <Box display="flex" gap={1}>
                                        <Paper
                                            variant="outlined"
                                            onClick={() => updateItem(index, { type: 'progress' })}
                                            sx={{
                                                flex: 1,
                                                p: 1.5,
                                                cursor: 'pointer',
                                                borderColor:
                                                    (item.type ?? 'progress') === 'progress'
                                                        ? 'primary.main'
                                                        : 'grey.200',
                                                bgcolor:
                                                    (item.type ?? 'progress') === 'progress'
                                                        ? 'primary.50'
                                                        : 'transparent',
                                                '&:hover': {
                                                    borderColor: 'primary.main',
                                                },
                                                transition: 'all 0.15s ease',
                                            }}
                                        >
                                            <Typography
                                                variant="caption"
                                                fontWeight={
                                                    (item.type ?? 'progress') === 'progress'
                                                        ? 'bold'
                                                        : 'medium'
                                                }
                                                color={
                                                    (item.type ?? 'progress') === 'progress'
                                                        ? 'primary.main'
                                                        : 'text.primary'
                                                }
                                            >
                                                Progress
                                            </Typography>
                                            <Typography
                                                variant="caption"
                                                color="text.secondary"
                                                display="block"
                                                sx={{ fontSize: '0.65rem' }}
                                            >
                                                Milestones & activities
                                            </Typography>
                                        </Paper>

                                        <Paper
                                            variant="outlined"
                                            onClick={() => updateItem(index, { type: 'stage' })}
                                            sx={{
                                                flex: 1,
                                                p: 1.5,
                                                cursor: 'pointer',
                                                borderColor:
                                                    item.type === 'stage'
                                                        ? 'primary.main'
                                                        : 'grey.200',
                                                bgcolor:
                                                    item.type === 'stage'
                                                        ? 'primary.50'
                                                        : 'transparent',
                                                '&:hover': {
                                                    borderColor: 'primary.main',
                                                },
                                                transition: 'all 0.15s ease',
                                            }}
                                        >
                                            <Typography
                                                variant="caption"
                                                fontWeight={item.type === 'stage' ? 'bold' : 'medium'}
                                                color={
                                                    item.type === 'stage'
                                                        ? 'primary.main'
                                                        : 'text.primary'
                                                }
                                            >
                                                Stage Change
                                            </Typography>
                                            <Typography
                                                variant="caption"
                                                color="text.secondary"
                                                display="block"
                                                sx={{ fontSize: '0.65rem' }}
                                            >
                                                New project stage
                                            </Typography>
                                        </Paper>
                                    </Box>
                                </Box>

                                <TextField
                                    label="Title"
                                    fullWidth
                                    value={item.title ?? ''}
                                    onChange={(e) => updateItem(index, { title: e.target.value })}
                                    placeholder={
                                        item.type === 'stage'
                                            ? 'e.g., Project advanced to Validation'
                                            : 'e.g., Baseline survey completed'
                                    }
                                />

                                <TextField
                                    label="Date"
                                    type="date"
                                    fullWidth
                                    value={item.dateLabel ?? ''}
                                    onChange={(e) => updateItem(index, { dateLabel: e.target.value })}
                                    InputLabelProps={{ shrink: true }}
                                />

                                <TextField
                                    label="Posted by"
                                    fullWidth
                                    value={item.authorName ?? currentUserName}
                                    disabled
                                    placeholder={meLoading ? 'Loading...' : 'Your name'}
                                />

                                <TextField
                                    label="Description"
                                    fullWidth
                                    multiline
                                    minRows={4}
                                    value={item.description ?? ''}
                                    onChange={(e) =>
                                        updateItem(index, { description: e.target.value })
                                    }
                                    placeholder={
                                        item.type === 'stage'
                                            ? 'Describe what triggered this stage change...'
                                            : "Share what's new..."
                                    }
                                />

                                {isSingleBlankDraft ? null : (
                                    <Button
                                        color="error"
                                        onClick={() => removeItem(index)}
                                        sx={{ alignSelf: 'flex-start' }}
                                    >
                                        Remove
                                    </Button>
                                )}
                            </Stack>
                        </Paper>
                    );
                })}

                <Button
                    variant="outlined"
                    onClick={() => setField('updates', [...items, emptyUpdate(currentUserName)])}
                >
                    Add Another Update
                </Button>

                <VisibilityField value={visibilityValue} onChange={updateVisibility} />
            </Stack>
        );
    };

    const renderDocuments = () => {
        const items = (form.documents ?? []) as ProjectDocument[];

        return (
            <Stack spacing={2}>
                <Box>
                    <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                        Project Documents
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Upload and manage project documents through the dedicated backend endpoints.
                    </Typography>
                </Box>

                {documentUpload.error ? <Alert severity="error">{documentUpload.error}</Alert> : null}

                <Button
                    variant="outlined"
                    component="label"
                    startIcon={<CloudUploadRounded />}
                    disabled={documentUpload.busy}
                >
                    {documentUpload.busy ? 'Uploading…' : 'Upload Document'}
                    <input
                        hidden
                        type="file"
                        onChange={async (e) => {
                            const file = e.target.files?.[0];
                            e.currentTarget.value = '';
                            if (!file) return;
                            await handleDocumentFilePicked(file);
                        }}
                    />
                </Button>

                {items.length === 0 ? (
                    <Alert severity="info">No documents uploaded yet.</Alert>
                ) : null}

                {items.map((item, index) => (
                    <Paper key={item.id || index} variant="outlined" sx={{ p: 2 }}>
                        <Stack spacing={2}>
                            <Stack direction="row" spacing={1.25} alignItems="center">
                                <InsertDriveFileRounded fontSize="small" />
                                <Typography variant="body2" fontWeight={600} sx={{ wordBreak: 'break-word' }}>
                                    {item.name || 'Untitled document'}
                                </Typography>
                            </Stack>

                            <TextField
                                label="Document name"
                                size="small"
                                fullWidth
                                value={item.name ?? ''}
                                onChange={(e) => {
                                    const next = [...items];
                                    next[index] = { ...next[index], name: e.target.value };
                                    setField('documents', next);
                                }}
                            />

                            <TextField
                                label="Type"
                                size="small"
                                fullWidth
                                value={item.type ?? ''}
                                onChange={(e) => {
                                    const next = [...items];
                                    next[index] = { ...next[index], type: e.target.value };
                                    setField('documents', next);
                                }}
                            />

                            {'assetUrl' in item && item.assetUrl ? (
                                <Button
                                    variant="text"
                                    href={(item as any).assetUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    sx={{ alignSelf: 'flex-start' }}
                                >
                                    Open document
                                </Button>
                            ) : null}

                            <Stack direction="row" spacing={1}>
                                <Button
                                    variant="outlined"
                                    onClick={() => handleDocumentMetaSave(item)}
                                >
                                    Save metadata
                                </Button>

                                <Button
                                    color="error"
                                    startIcon={<DeleteOutlineRounded />}
                                    onClick={() => handleDocumentDelete(item.id)}
                                >
                                    Remove
                                </Button>
                            </Stack>
                        </Stack>
                    </Paper>
                ))}

                <VisibilityField value={visibilityValue} onChange={updateVisibility} />
            </Stack>
        );
    };

    const renderMedia = () => {
        const items = (form.media ?? []) as ProjectMediaItem[];

        return (
            <Stack spacing={2}>
                <Box>
                    <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                        Project Media
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Upload media assets and optionally mark one as the cover image.
                    </Typography>
                </Box>

                {mediaUpload.error ? <Alert severity="error">{mediaUpload.error}</Alert> : null}

                <Stack direction="row" spacing={1} flexWrap="wrap">
                    <Button
                        variant="outlined"
                        component="label"
                        startIcon={<CloudUploadRounded />}
                        disabled={mediaUpload.busy}
                    >
                        {mediaUpload.busy ? 'Uploading…' : 'Upload Media'}
                        <input
                            hidden
                            type="file"
                            accept="image/*,video/*"
                            onChange={async (e) => {
                                const file = e.target.files?.[0];
                                e.currentTarget.value = '';
                                if (!file) return;
                                await handleMediaFilePicked(file, false);
                            }}
                        />
                    </Button>

                    <Button
                        variant="outlined"
                        component="label"
                        startIcon={<StarRounded />}
                        disabled={mediaUpload.busy}
                    >
                        Upload as Cover
                        <input
                            hidden
                            type="file"
                            accept="image/*"
                            onChange={async (e) => {
                                const file = e.target.files?.[0];
                                e.currentTarget.value = '';
                                if (!file) return;
                                await handleMediaFilePicked(file, true);
                            }}
                        />
                    </Button>
                </Stack>

                {items.length === 0 ? (
                    <Alert severity="info">No media uploaded yet.</Alert>
                ) : null}

                {items.map((item, index) => {
                    const isCover = project?.coverImageUrl && 'assetUrl' in item
                        ? project.coverImageUrl === (item as any).assetUrl
                        : false;

                    return (
                        <Paper key={item.id || index} variant="outlined" sx={{ p: 2 }}>
                            <Stack spacing={2}>
                                {'assetUrl' in item && (item as any).assetUrl ? (
                                    <Box
                                        component="img"
                                        src={(item as any).assetUrl}
                                        alt={item.caption || 'Project media'}
                                        sx={{
                                            width: '100%',
                                            maxHeight: 180,
                                            objectFit: 'cover',
                                            borderRadius: 1.5,
                                            border: '1px solid',
                                            borderColor: 'grey.200',
                                        }}
                                    />
                                ) : null}

                                <TextField
                                    label="Caption"
                                    size="small"
                                    fullWidth
                                    value={item.caption ?? ''}
                                    onChange={(e) => {
                                        const next = [...items];
                                        next[index] = { ...next[index], caption: e.target.value };
                                        setField('media', next);
                                    }}
                                />

                                {'assetUrl' in item && (item as any).assetUrl ? (
                                    <Button
                                        variant="text"
                                        href={(item as any).assetUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        sx={{ alignSelf: 'flex-start' }}
                                    >
                                        Open media
                                    </Button>
                                ) : null}

                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={isCover}
                                            onChange={(e) => {
                                                const next = [...items];
                                                next[index] = {
                                                    ...next[index],
                                                    isCover: e.target.checked,
                                                } as any;
                                                setField('media', next);
                                            }}
                                        />
                                    }
                                    label="Use as cover image"
                                />

                                <Stack direction="row" spacing={1}>
                                    <Button
                                        variant="outlined"
                                        onClick={() => handleMediaMetaSave(item)}
                                    >
                                        Save metadata
                                    </Button>

                                    <Button
                                        color="error"
                                        startIcon={<DeleteOutlineRounded />}
                                        onClick={() => handleMediaDelete(item.id)}
                                    >
                                        Remove
                                    </Button>
                                </Stack>
                            </Stack>
                        </Paper>
                    );
                })}

                <VisibilityField value={visibilityValue} onChange={updateVisibility} />
            </Stack>
        );
    };

    const renderTeam = () => {
        const items = (form.team ?? []) as TeamEditorMember[];

        const selectedKeys = new Set(
            items.map((item) => `${item.memberType}:${item.memberId}`),
        );

        const searchResults = collaboratorOptions.filter(
            (entry) => !selectedKeys.has(`${entry.entityType}:${entry.id}`),
        );

        const addCollaborator = (entry: PlatformCollaboratorOption) => {
            const nextMember: TeamEditorMember =
                entry.entityType === 'company'
                    ? {
                        id: crypto.randomUUID(),
                        memberType: 'company',
                        memberId: entry.id,
                        companyId: entry.id,
                        userId: null,
                        name: entry.name,
                        role: '',
                        companyName: entry.companyName ?? entry.name,
                        avatarUrl: entry.avatarUrl ?? null,
                        permission: null,
                    }
                    : {
                        id: crypto.randomUUID(),
                        memberType: 'user',
                        memberId: entry.id,
                        userId: entry.id,
                        companyId: null,
                        name: entry.name,
                        role: '',
                        companyName: entry.companyName ?? '',
                        avatarUrl: entry.avatarUrl ?? null,
                        permission: 'viewer',
                    };

            setField('team', [...items, nextMember]);
            setTeamSearch('');
            setCollaboratorOptions([]);
        };

        return (
            <Stack spacing={3}>
                <Box>
                    <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                        Project Team
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Add platform users as viewers and platform companies as collaborators.
                    </Typography>
                </Box>

                <ToggleButtonGroup
                    value={teamRole}
                    exclusive
                    fullWidth
                    size="small"
                    onChange={(_, value) => {
                        if (!value) return;
                        setTeamRole(value);
                        setTeamSearch('');
                        setCollaboratorOptions([]);
                    }}
                >
                    <ToggleButton value="company" sx={{ textTransform: 'none', flex: 1 }}>
                        Company
                    </ToggleButton>
                    <ToggleButton value="user" sx={{ textTransform: 'none', flex: 1 }}>
                        Individual
                    </ToggleButton>
                </ToggleButtonGroup>

                <Box>
                    <TextField
                        fullWidth
                        size="small"
                        label={teamRole === 'company' ? 'Search companies' : 'Search users'}
                        placeholder={teamRole === 'company' ? 'Search companies...' : 'Search people...'}
                        value={teamSearch}
                        onChange={(e) => setTeamSearch(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchRounded sx={{ fontSize: 18, color: 'grey.500' }} />
                                </InputAdornment>
                            ),
                            endAdornment: teamSearch ? (
                                <InputAdornment position="end">
                                    <IconButton size="small" onClick={() => setTeamSearch('')}>
                                        <CloseRounded sx={{ fontSize: 16 }} />
                                    </IconButton>
                                </InputAdornment>
                            ) : undefined,
                        }}
                    />

                    {teamSearch.trim() ? (
                        <Paper variant="outlined" sx={{ mt: 1, borderRadius: 2, overflow: 'hidden' }}>
                            {optionsLoading ? (
                                <Box px={1.5} py={1.5}>
                                    <Typography variant="body2" color="text.secondary">
                                        Loading {teamRole === 'company' ? 'companies' : 'users'}...
                                    </Typography>
                                </Box>
                            ) : searchResults.length > 0 ? (
                                searchResults.map((result, index) => (
                                    <Box
                                        key={`${result.entityType}:${result.id}`}
                                        onClick={() => addCollaborator(result)}
                                        sx={{
                                            px: 1.5,
                                            py: 1.25,
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 1.25,
                                            cursor: 'pointer',
                                            borderBottom: index === searchResults.length - 1 ? 'none' : '1px solid',
                                            borderColor: 'grey.100',
                                            '&:hover': { bgcolor: 'grey.50' },
                                        }}
                                    >
                                        <Avatar
                                            src={result.avatarUrl ?? undefined}
                                            sx={{
                                                width: 32,
                                                height: 32,
                                                bgcolor: 'grey.200',
                                                color: 'text.primary',
                                                borderRadius: result.entityType === 'company' ? 1 : '50%',
                                            }}
                                        >
                                            {result.entityType === 'company' ? (
                                                <BusinessRounded sx={{ fontSize: 16, color: 'grey.600' }} />
                                            ) : (
                                                result.name
                                                    .split(' ')
                                                    .map((part) => part[0])
                                                    .join('')
                                                    .slice(0, 2)
                                                    .toUpperCase()
                                            )}
                                        </Avatar>

                                        <Box flex={1} minWidth={0}>
                                            <Stack direction="row" spacing={0.75} alignItems="center">
                                                <Typography variant="body2" fontWeight={600} noWrap>
                                                    {result.name}
                                                </Typography>
                                                <Chip
                                                    label="On platform"
                                                    size="small"
                                                    sx={{ height: 18, fontSize: '0.65rem' }}
                                                />
                                            </Stack>
                                            <Typography variant="caption" color="text.secondary" noWrap>
                                                {result.subtitle ?? (result.entityType === 'company' ? 'Company' : 'User')}
                                            </Typography>
                                        </Box>
                                    </Box>
                                ))
                            ) : (
                                <Box px={1.5} py={1.5}>
                                    <Typography variant="body2" color="text.secondary">
                                        No matching {teamRole === 'company' ? 'companies' : 'users'} found.
                                    </Typography>
                                </Box>
                            )}
                        </Paper>
                    ) : null}
                </Box>

                <Stack spacing={2}>
                    {(
                        items.map((item, index) => {
                            const isCreator =
                                item.memberType === 'user' && item.permission === 'creator';

                            return (
                                <Paper
                                    key={`${item.memberType}:${item.memberId}:${index}`}
                                    variant="outlined"
                                    sx={{ p: 2, borderRadius: 2 }}
                                >
                                    <Stack spacing={2}>
                                        <Stack direction="row" spacing={1.5} alignItems="center">
                                            <Avatar
                                                src={item.avatarUrl ?? undefined}
                                                sx={{
                                                    width: 40,
                                                    height: 40,
                                                    bgcolor: 'grey.200',
                                                    color: 'text.primary',
                                                    borderRadius: item.memberType === 'company' ? 1 : '50%',
                                                }}
                                            >
                                                {item.memberType === 'company' ? (
                                                    <BusinessRounded sx={{ fontSize: 18, color: 'grey.600' }} />
                                                ) : (
                                                    item.name
                                                        .split(' ')
                                                        .map((part) => part[0])
                                                        .join('')
                                                        .slice(0, 2)
                                                        .toUpperCase()
                                                )}
                                            </Avatar>

                                            <Box flex={1} minWidth={0}>
                                                <Typography variant="body2" fontWeight={700} noWrap>
                                                    {item.name}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary" noWrap>
                                                    {item.memberType === 'company'
                                                        ? item.companyName || 'Platform company'
                                                        : isCreator
                                                            ? 'Project creator'
                                                            : item.companyName || 'Platform user'}
                                                </Typography>
                                            </Box>

                                            {!isCreator && (
                                                <IconButton
                                                    size="small"
                                                    onClick={() => {
                                                        const next = items.filter((_, i) => i !== index);
                                                        setField('team', next);
                                                    }}
                                                >
                                                    <CloseRounded sx={{ fontSize: 18 }} />
                                                </IconButton>
                                            )}
                                        </Stack>

                                        <TextField
                                            label="Project role"
                                            size="small"
                                            fullWidth
                                            value={item.role ?? ''}
                                            onChange={(e) => {
                                                const next = [...items];
                                                next[index] = { ...next[index], role: e.target.value } as TeamEditorMember;
                                                setField('team', next);
                                            }}
                                            placeholder="e.g. MRV Provider, Developer, Advisor"
                                        />

                                        {item.memberType === 'user' ? (
                                            <FormControl fullWidth size="small" disabled={isCreator}>
                                                <InputLabel>Permission</InputLabel>
                                                <Select
                                                    value={isCreator ? 'creator' : item.permission ?? 'viewer'}
                                                    label="Permission"
                                                    onChange={(e) => {
                                                        const next = [...items];
                                                        next[index] = {
                                                            ...next[index],
                                                            permission: e.target.value as 'creator' | 'viewer',
                                                        } as TeamEditorMember;
                                                        setField('team', next);
                                                    }}
                                                >
                                                    {isCreator && <MenuItem value="creator">Creator</MenuItem>}
                                                    <MenuItem value="viewer">Viewer</MenuItem>
                                                </Select>
                                            </FormControl>
                                        ) : (
                                            <Alert severity="info" sx={{ py: 0 }}>
                                                Company collaborators do not carry project permissions.
                                            </Alert>
                                        )}
                                    </Stack>
                                </Paper>
                            );
                        })
                    )}
                </Stack>
            </Stack>
        );
    };

    const content = (() => {
        switch (section) {
            case 'overview':
                return renderOverview();
            case 'story':
                return renderStory();
            case 'location':
                return renderLocation();
            case 'readiness':
                return renderReadiness();
            case 'registry':
                return renderRegistry();
            case 'impact':
                return renderImpact();
            case 'opportunities':
                return renderOpportunities();
            case 'updates':
                return renderUpdates();
            case 'documents':
                return renderDocuments();
            case 'media':
                return renderMedia();
            case 'team':
                return renderTeam();
            case 'settings':
                return renderSettings();
            default:
                return <Alert severity="info">No editor configured for this section yet.</Alert>;
        }
    })();

    return (
        <Drawer anchor="right" open={open} onClose={onClose}>
            <Box
                sx={{
                    width: { xs: '100vw', sm: 460 },
                    maxWidth: '100vw',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                }}
            >
                <Box sx={{ px: 3, py: 2.5 }}>
                    <Typography variant="h6" fontWeight={700}>
                        Edit {SECTION_LABELS[section]}
                    </Typography>
                </Box>

                <Divider />

                <Box sx={{ flex: 1, overflowY: 'auto', px: 3, py: 3 }}>
                    <Stack spacing={3}>{content}</Stack>
                </Box>

                <Divider />

                <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-end', gap: 1.5 }}>
                    <Button variant="text" onClick={onClose} disabled={saving}>
                        Cancel
                    </Button>
                    <Button variant="contained" onClick={handleSave} disabled={saving}>
                        Save
                    </Button>
                </Box>
            </Box>
        </Drawer>
    );
}