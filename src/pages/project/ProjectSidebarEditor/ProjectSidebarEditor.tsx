import React, { useEffect, useMemo, useState } from 'react';
import {
    Alert,
    Paper,
    Box,
    Button,
    Divider,
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
import { SidebarPanel } from '../../../components/layout/SidebarPanel';
import ProjectLocationMap from '../../../components/ProjectLocationMap';
import SidebarMediaSection from './SidebarMediaSection';
import SidebarDocumentsSection from './SidebarDocumentsSection';
import SidebarOpportunitiesSection from './SidebarOpportunitiesSection';

import PublicRounded from '@mui/icons-material/PublicRounded';
import LockRounded from '@mui/icons-material/LockRounded';
import PhotoCameraRounded from '@mui/icons-material/PhotoCameraRounded';
import SearchRounded from '@mui/icons-material/SearchRounded';
import CloseRounded from '@mui/icons-material/CloseRounded';
import BusinessRounded from '@mui/icons-material/BusinessRounded';
import CloudUploadRounded from '@mui/icons-material/CloudUploadRounded';

import { PROJECT_TYPE_OPTIONS } from '../../../constants/projectTypes';

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
} from '../projectProfile.types';
import { PROJECT_STAGE_OPTIONS } from '../../../constants/projectStages';
import { stageDescriptions } from '../projectProfile.constants';

type EditableProjectPatch = Omit<
    Partial<ProjectProfileData>,
    'team' | 'sectionVisibility' | 'opportunities' | 'updates'
>;

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
        memberId?: string | null;
        userId?: string | null;
        companyId?: null;
        name: string;
        role?: string | null;
        companyName?: string;
        avatarUrl?: string | null;
        permission?: 'creator' | 'viewer' | null;
        isPlatformMember: boolean;
        manualName?: string | null;
        manualOrganization?: string | null;
    }
    | {
        id: string;
        memberType: 'company';
        memberId?: string | null;
        companyId?: string | null;
        userId?: null;
        name: string;
        role?: string | null;
        companyName?: string;
        avatarUrl?: string | null;
        permission?: null;
        isPlatformMember: boolean;
        manualName?: string | null;
        manualOrganization?: string | null;
    };

const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL ??
    (window as any).__API_BASE_URL__ ??
    '';

const TEAM_PROJECT_ROLE_OPTIONS = [
    'Developer',
    'MRV Provider',
    'Validator',
    'Verifier',
    'Consultancy',
    'Financing',
    'Insurance',
    'Legal',
    'Community Liaison',
    'Registry',
    'Buyer',
    'Other',
] as const;

const DOCUMENT_TYPE_OPTIONS = [
    'Concept Note',
    'Feasibility Study',
    'PDD',
    'Baseline Report',
    'Monitoring Report',
    'Validation Report',
    'Verification Report',
    'Other',
] as const;

type ProjectDocumentStatus = 'Draft' | 'Final';

export type SaveProjectPatch = EditableProjectPatch & {
    projectVisibility?: SectionVisibility;
    team?: Array<
        | {
            memberType: 'user';
            memberId?: string | null;
            userId?: string | null;
            companyId?: null;
            name?: string;
            companyName?: string;
            avatarUrl?: string | null;
            role?: string | null;
            permission?: 'creator' | 'viewer';
            isPlatformMember?: boolean;
            manualName?: string | null;
            manualOrganization?: string | null;
        }
        | {
            memberType: 'company';
            memberId?: string | null;
            companyId?: string | null;
            userId?: null;
            name?: string;
            companyName?: string;
            avatarUrl?: string | null;
            role?: string | null;
            permission?: null;
            isPlatformMember?: boolean;
            manualName?: string | null;
            manualOrganization?: string | null;
        }
    >;
    sectionVisibility?: Partial<Record<ProjectSectionKey, SectionVisibility>>;
};

export interface ProjectSidebarEditorProps {
    open: boolean;
    section: ProjectEditorTarget | null;
    project: ProjectProfileData | null;
    initialMediaId?: string | null;
    initialOpportunityId?: string | null;
    initialUpdateId?: string | null;
    initialDocumentId?: string | null;
    onClose: () => void;
    onSave: (patch: SaveProjectPatch) => Promise<void> | void;
    onProjectChange?: React.Dispatch<React.SetStateAction<ProjectProfileData | null>>;
}

const SECTION_LABELS: Record<ProjectEditorTarget, string> = {
    overview: 'Overview',
    cover: 'Project Cover',
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

function ProjectVisibilityField({
    value,
    onChange,
}: {
    value: SectionVisibility;
    onChange: (value: SectionVisibility) => void;
}) {
    return (
        <FormControl fullWidth size="small">
            <InputLabel>Project visibility</InputLabel>
            <Select
                value={value}
                label="Project visibility"
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

function normalizeTeamMember(member: ProjectTeamMember): TeamEditorMember | null {
    const isPlatformMember =
        typeof member.isPlatformMember === 'boolean'
            ? member.isPlatformMember
            : Boolean(member.userId ?? member.companyId ?? member.memberId);

    if (member.memberType === 'company') {
        const companyId = member.companyId ?? member.memberId ?? null;

        if (isPlatformMember && !companyId) return null;

        return {
            id: member.id ?? crypto.randomUUID(),
            memberType: 'company',
            memberId: companyId,
            companyId,
            userId: null,
            name:
                member.name ??
                member.companyName ??
                member.manualName ??
                member.manualOrganization ??
                '',
            role: member.role ?? '',
            companyName:
                member.companyName ??
                member.manualOrganization ??
                member.name ??
                '',
            avatarUrl: member.avatarUrl ?? null,
            permission: null,
            isPlatformMember,
            manualName: member.manualName ?? null,
            manualOrganization: member.manualOrganization ?? null,
        };
    }

    const userId = member.userId ?? member.memberId ?? null;

    if (isPlatformMember && !userId) return null;

    return {
        id: member.id ?? crypto.randomUUID(),
        memberType: 'user',
        memberId: userId,
        userId,
        companyId: null,
        name: member.name ?? member.manualName ?? '',
        role: member.role ?? '',
        companyName:
            member.companyName ??
            member.manualOrganization ??
            '',
        avatarUrl: member.avatarUrl ?? null,
        permission: member.permission ?? 'viewer',
        isPlatformMember,
        manualName: member.manualName ?? null,
        manualOrganization: member.manualOrganization ?? null,
    };
}

function getEditorMemberDisplayName(member: TeamEditorMember): string {
    if (!member.isPlatformMember) {
        if (member.memberType === 'company') {
            return (
                member.manualOrganization?.trim() ||
                member.companyName?.trim() ||
                member.manualName?.trim() ||
                member.name?.trim() ||
                ''
            );
        }

        return (
            member.manualName?.trim() ||
            member.name?.trim() ||
            ''
        );
    }

    if (member.memberType === 'company') {
        return member.companyName?.trim() || member.name?.trim() || '';
    }

    return member.name?.trim() || '';
}

function getEditorMemberSecondary(member: TeamEditorMember): string {
    const roleLabel = member.role?.trim();

    if (!member.isPlatformMember) {
        if (member.memberType === 'company') {
            return roleLabel || 'External company';
        }

        const org = member.manualOrganization?.trim() || member.companyName?.trim();
        return roleLabel ? (org ? `${roleLabel} · ${org}` : roleLabel) : org || 'External collaborator';
    }

    return roleLabel || member.companyName?.trim() || (member.memberType === 'company' ? 'Company' : 'Platform user');
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
    initialMediaId = null,
    initialOpportunityId = null,
    initialUpdateId = null,
    initialDocumentId = null,
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

    const [teamManualMode, setTeamManualMode] = useState(false);
    const [teamName, setTeamName] = useState('');
    const [teamProjectRole, setTeamProjectRole] = useState('');
    const [teamSelectedPlatform, setTeamSelectedPlatform] = useState<PlatformCollaboratorOption | null>(null);
    const [editingMediaId, setEditingMediaId] = useState<string | null>(null);
    const [mediaCaption, setMediaCaption] = useState('');

    const [pendingMediaFile, setPendingMediaFile] = useState<File | null>(null);
    const [pendingMediaPreviewUrl, setPendingMediaPreviewUrl] = useState<string | null>(null);
    const [pendingDocumentFile, setPendingDocumentFile] = useState<File | null>(null);
    const [editingDocumentId, setEditingDocumentId] = useState<string | null>(null);
    const [documentName, setDocumentName] = useState('');
    const [documentType, setDocumentType] = useState('');

    const [editingOpportunityId, setEditingOpportunityId] = useState<string | null>(null);
    const [opportunityType, setOpportunityType] = useState('');
    const [opportunityDescription, setOpportunityDescription] = useState('');
    const [opportunityUrgent, setOpportunityUrgent] = useState(false);

    const [editingUpdateId, setEditingUpdateId] = useState<string | null>(null);
    const [updateTitle, setUpdateTitle] = useState('');
    const [updateDescription, setUpdateDescription] = useState('');
    const [updateDateLabel, setUpdateDateLabel] = useState('');
    const [updateAuthorName, setUpdateAuthorName] = useState('');
    const [updateType, setUpdateType] = useState<'progress' | 'stage'>('progress');

    const [documentStatus, setDocumentStatus] = useState<ProjectDocumentStatus>('Draft');

    const commitProjectPatch = React.useCallback(
        (patch: Partial<ProjectProfileData>) => {
            if (!onProjectChange) return;

            onProjectChange((prev) => {
                if (!prev) return prev;

                return {
                    ...prev,
                    ...patch,
                    documents: patch.documents ?? prev.documents ?? [],
                    media: patch.media ?? prev.media ?? [],
                    opportunities: patch.opportunities ?? prev.opportunities ?? [],
                    updates: patch.updates ?? prev.updates ?? [],
                    team: patch.team ?? prev.team ?? [],
                    readiness: patch.readiness ?? prev.readiness ?? [],
                    serviceProviders: patch.serviceProviders ?? prev.serviceProviders ?? [],
                    sectionVisibility: patch.sectionVisibility ?? prev.sectionVisibility ?? {},
                    coverImageUrl:
                        patch.coverImageUrl !== undefined
                            ? patch.coverImageUrl
                            : (prev.coverImageUrl ?? null),
                };
            });
        },
        [onProjectChange]
    );

    const pushProjectMediaState = React.useCallback(
        (nextMedia: ProjectMediaItem[], nextCoverImageUrl?: string | null) => {
            commitProjectPatch({
                media: nextMedia,
                ...(nextCoverImageUrl !== undefined
                    ? { coverImageUrl: nextCoverImageUrl }
                    : {}),
            });
        },
        [commitProjectPatch]
    );

    const projectVisibilityValue = useMemo<SectionVisibility>(() => {
        return toUiVisibility(
            (form as any).projectVisibility ??
            (project as any)?.projectVisibility ??
            'private'
        );
    }, [form, project]);

    const getCurrentCoverMedia = React.useCallback(() => {
        const items: ProjectMediaItem[] = (form.media ?? project?.media ?? []) as ProjectMediaItem[];
        const explicitCover = items.find((item) => item.isCover);
        if (explicitCover) return explicitCover;

        if (project?.coverImageUrl) {
            return items.find((item) => item.assetUrl === project.coverImageUrl) ?? null;
        }

        return null;
    }, [form.media, project?.media, project?.coverImageUrl]);

    const handleCoverFilePicked = async (file: File) => {
        try {
            setMediaUpload({ busy: true, error: null });

            const currentItems = ((form.media ?? project?.media ?? []) as ProjectMediaItem[]);
            const existingCover = getCurrentCoverMedia();

            const upload = await getMediaUploadUrl(file);
            await uploadBinaryToSignedUrl(upload.uploadUrl, file);

            let nextMedia = currentItems.map((item) => ({
                ...item,
                isCover: false,
            }));

            if (existingCover?.id) {
                const updatedOldCover = await updateMediaRecord(existingCover.id, { isCover: false });
                nextMedia = nextMedia.map((item) =>
                    item.id === existingCover.id ? { ...item, ...updatedOldCover, isCover: false } : item
                );
            }

            const trimmedCaption = mediaCaption.trim();

            const created = await createMediaRecord({
                assetUrl: upload.assetUrl,
                s3Key: upload.s3Key ?? upload.key ?? null,
                contentType: file.type || 'application/octet-stream',
                caption: trimmedCaption || file.name,
                isCover: true,
            });

            nextMedia = [...nextMedia, { ...created, isCover: true }];
            const nextCoverImageUrl = created.assetUrl ?? upload.assetUrl;

            setForm((prev) => ({
                ...prev,
                media: nextMedia,
                coverImageUrl: nextCoverImageUrl,
            }));

            pushProjectMediaState(nextMedia, nextCoverImageUrl);
        } catch (error: any) {
            setMediaUpload({
                busy: false,
                error: error?.message ?? 'Failed to upload cover image',
            });
            return;
        }

        setMediaUpload({ busy: false, error: null });
    };

    const handleRemoveCover = async () => {
        const currentCover = getCurrentCoverMedia();
        if (!currentCover?.id) return;

        try {
            setMediaUpload({ busy: true, error: null });

            const updated = await updateMediaRecord(currentCover.id, {
                isCover: false,
            });

            const currentItems = ((form.media ?? project?.media ?? []) as ProjectMediaItem[]);
            const nextMedia = currentItems.map((item) =>
                item.id === currentCover.id
                    ? { ...item, ...updated, isCover: false }
                    : { ...item, isCover: false }
            );

            setForm((prev) => ({
                ...prev,
                media: nextMedia,
                coverImageUrl: '',
            }));

            pushProjectMediaState(nextMedia, null);
        } catch (error: any) {
            setMediaUpload({
                busy: false,
                error: error?.message ?? 'Failed to remove cover image',
            });
            return;
        }

        setMediaUpload({ busy: false, error: null });
    };

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
        if (!nextProject) return;
        commitProjectPatch(nextProject);
    };

    useEffect(() => {
        return () => {
            if (pendingMediaPreviewUrl) {
                URL.revokeObjectURL(pendingMediaPreviewUrl);
            }
        };
    }, [pendingMediaPreviewUrl]);

    const clearPendingMedia = React.useCallback(() => {
        if (pendingMediaPreviewUrl) {
            URL.revokeObjectURL(pendingMediaPreviewUrl);
        }
        setPendingMediaFile(null);
        setPendingMediaPreviewUrl(null);
    }, [pendingMediaPreviewUrl]);

    const clearPendingDocument = React.useCallback(() => {
        setPendingDocumentFile(null);
        setEditingDocumentId(null);
        setDocumentName('');
        setDocumentType('');
        setDocumentStatus('Draft');
    }, []);

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
            case 'cover':
                setForm({
                    coverImageUrl: project.coverImageUrl ?? '',
                    media: [...(project.media ?? [])],
                });
                break;

            case 'overview':
                setForm({
                    name: project.name ?? '',
                    stage: project.stage,
                    type: project.type ?? '',
                    description: project.description ?? '',
                    coverImageUrl: project.coverImageUrl ?? '',
                    estimatedAnnualRemoval: project.estimatedAnnualRemoval ?? '',
                    projectVisibility: toUiVisibility(
                        (project as any).projectVisibility ?? 'private'
                    ),
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
                    stage: project.stage,
                    sectionVisibility: {
                        ...project.sectionVisibility,
                        readiness: project.sectionVisibility?.readiness ?? 'public',
                    },
                });
                break;

            case 'registry':
                setForm({
                    registrationPlatform: project.registrationPlatform ?? '',
                    registryId: project.registryId ?? '',
                    registryProjectUrl: project.registryProjectUrl ?? '',
                    registryStatus: project.registryStatus ?? '',
                    methodology: project.methodology ?? '',
                    sectionVisibility: {
                        ...project.sectionVisibility,
                        registry: project.sectionVisibility?.registry ?? 'public',
                    },
                });
                break;

            case 'impact':
                setForm({
                    totalCreditsIssued: project.totalCreditsIssued ?? null,
                    annualEstimatedCredits: project.annualEstimatedCredits ?? null,
                    annualEstimateUnit: project.annualEstimateUnit ?? null,
                    creditingStart: project.creditingStart ?? null,
                    creditingEnd: project.creditingEnd ?? null,
                    sectionVisibility: {
                        ...project.sectionVisibility,
                        impact: project.sectionVisibility?.impact ?? 'public',
                    },
                });
                break;

            case 'opportunities': {
                const opportunityItems = [...(project.opportunities ?? [])];
                const selectedItem =
                    initialOpportunityId != null
                        ? opportunityItems.find((item) => item.id === initialOpportunityId) ?? null
                        : null;

                setForm({
                    sectionVisibility: {
                        ...project.sectionVisibility,
                        opportunities: project.sectionVisibility?.opportunities ?? 'public',
                    },
                });

                setEditingOpportunityId(selectedItem?.id ?? null);
                setOpportunityType(selectedItem?.type ?? '');
                setOpportunityDescription(selectedItem?.description ?? '');
                setOpportunityUrgent(Boolean(selectedItem?.urgent));
                break;
            }

            case 'updates': {
                const updateItems = [...(project.updates ?? [])];
                const selectedItem =
                    initialUpdateId != null
                        ? updateItems.find((item) => item.id === initialUpdateId) ?? null
                        : null;

                setForm({
                    sectionVisibility: {
                        ...project.sectionVisibility,
                        updates: project.sectionVisibility?.updates ?? 'public',
                    },
                });

                setEditingUpdateId(selectedItem?.id ?? null);
                setUpdateTitle(selectedItem?.title ?? '');
                setUpdateDescription(selectedItem?.description ?? '');
                setUpdateDateLabel(selectedItem?.dateLabel ?? '');
                setUpdateAuthorName(selectedItem?.authorName ?? currentUserName);
                // setUpdateType(selectedItem?.type === 'stage' ? 'stage' : 'progress');
                setUpdateType('progress');
                break;
            }

            case 'documents': {
                const documentItems = [...(project.documents ?? [])];
                const selectedItem =
                    initialDocumentId != null
                        ? documentItems.find((item) => item.id === initialDocumentId) ?? null
                        : null;

                setForm({
                    documents: documentItems,
                    sectionVisibility: {
                        ...project.sectionVisibility,
                        documents: project.sectionVisibility?.documents ?? 'public',
                    },
                });

                setEditingDocumentId(selectedItem?.id ?? null);
                setDocumentName(selectedItem?.name ?? '');
                setDocumentType(selectedItem?.kind ?? selectedItem?.type ?? '');
                setDocumentStatus((selectedItem?.status as ProjectDocumentStatus) ?? 'Draft');
                setPendingDocumentFile(null);
                break;
            }

            case 'media': {
                const mediaItems = [...(project.media ?? [])];
                const selectedItem =
                    initialMediaId
                        ? mediaItems.find((item) => item.id === initialMediaId) ?? null
                        : null;

                setForm({
                    media: mediaItems,
                    sectionVisibility: {
                        ...project.sectionVisibility,
                        media: project.sectionVisibility?.media ?? 'public',
                    },
                });

                setEditingMediaId(selectedItem?.id ?? null);
                setMediaCaption(selectedItem?.caption ?? '');
                break;
            }

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
            setTeamManualMode(false);
            setTeamName('');
            setTeamProjectRole('');
            setTeamSelectedPlatform(null);
        }

        if (section !== 'team') {
            setBaseTeam([]);
        }

        if (section !== 'media') {
            setEditingMediaId(null);
            setMediaCaption('');
            clearPendingMedia();
        }

        if (section !== 'documents') {
            clearPendingDocument();
        }

        if (section !== 'opportunities') {
            setEditingOpportunityId(null);
            setOpportunityType('');
            setOpportunityDescription('');
            setOpportunityUrgent(false);
        }

        if (section !== 'updates') {
            setEditingUpdateId(null);
            setUpdateTitle('');
            setUpdateDescription('');
            setUpdateDateLabel('');
            setUpdateAuthorName('');
            setUpdateType('progress');
        }

    }, [open, project, section, initialMediaId, clearPendingMedia, clearPendingDocument, editingDocumentId]);

    useEffect(() => {
        if (!open || section !== 'updates' || !currentUserName) return;

        if (!editingUpdateId && !updateAuthorName.trim()) {
            setUpdateAuthorName(currentUserName);
        }
    }, [open, section, currentUserName, editingUpdateId, updateAuthorName]);

    const reloadProjectSnapshot = async (): Promise<ProjectProfileData> => {
        const projectId = requireProjectId();

        const response = await fetch(`${API_BASE_URL}/projects/${projectId}/edit`, {
            method: 'GET',
            credentials: 'include',
            headers: { Accept: 'application/json' },
        });

        const payload = await parseJsonSafe(response);

        if (!response.ok) {
            throw new Error(getErrorMessage(payload, `Failed to reload project (${response.status})`));
        }

        const json = payload?.data ?? payload;

        const nextProject: ProjectProfileData = {
            id: json.id,
            upid: json.upid ?? null,
            name: json.name,
            stage: json.stage,
            type: json.type ?? null,
            description: json.description ?? null,
            companyName: json.companyName ?? null,
            country: json.country ?? null,
            region: json.region ?? null,
            latitude: json.latitude ?? null,
            longitude: json.longitude ?? null,
            coverImageUrl: json.coverImageUrl ?? null,
            projectVisibility: json.projectVisibility ?? null,
            storyProblem: json.storyProblem ?? null,
            storyApproach: json.storyApproach ?? null,
            methodology: json.methodology ?? null,
            registrationPlatform: json.registrationPlatform ?? null,
            registryStatus: json.registryStatus ?? null,
            registryId: json.registryId ?? null,
            registryProjectUrl: json.registryProjectUrl ?? null,
            totalAreaHa: json.totalAreaHa ?? null,
            estimatedAnnualRemoval: json.estimatedAnnualRemoval ?? null,
            readiness: json.readiness ?? [],
            serviceProviders: json.serviceProviders ?? [],
            opportunities: json.opportunities ?? [],
            updates: json.updates ?? [],
            documents: json.documents ?? [],
            media: json.media ?? [],
            team: json.team ?? [],
            sectionVisibility: json.sectionVisibility ?? {},

            creditingStart: json.creditingStart ?? null,
            creditingEnd: json.creditingEnd ?? null,

            totalCreditsIssued: json.totalCreditsIssued ?? null,
            annualEstimatedCredits: json.annualEstimatedCredits ?? null,
            annualEstimateUnit: json.annualEstimateUnit ?? null,
            firstVintageYear: json.firstVintageYear ?? null,
        };

        commitProjectPatch(nextProject);
        return nextProject;
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

    const handleMediaSave = async () => {
        try {
            setMediaUpload({ busy: true, error: null });

            if (editingMediaId) {
                await updateMediaRecord(editingMediaId, {
                    caption: mediaCaption.trim() || null,
                });

                const nextProject = await reloadProjectSnapshot();

                setForm((prev) => ({
                    ...prev,
                    media: [...(nextProject.media ?? [])],
                    coverImageUrl: nextProject.coverImageUrl ?? '',
                }));

                setEditingMediaId(null);
                setMediaCaption('');
                setMediaUpload({ busy: false, error: null });
                return;
            }

            if (!pendingMediaFile) {
                setMediaUpload({ busy: false, error: null });
                return;
            }

            const file = pendingMediaFile;
            const upload = await getMediaUploadUrl(file);
            await uploadBinaryToSignedUrl(upload.uploadUrl, file);

            await createMediaRecord({
                assetUrl: upload.assetUrl,
                s3Key: upload.s3Key ?? upload.key ?? null,
                contentType: file.type || 'application/octet-stream',
                caption: mediaCaption.trim() || file.name,
                isCover: false,
            });

            const nextProject = await reloadProjectSnapshot();

            setForm((prev) => ({
                ...prev,
                media: [...(nextProject.media ?? [])],
                coverImageUrl: nextProject.coverImageUrl ?? '',
            }));

            clearPendingMedia();
            setMediaCaption('');
            setEditingMediaId(null);
            setMediaUpload({ busy: false, error: null });
        } catch (error: any) {
            setMediaUpload({
                busy: false,
                error: error?.message ?? 'Failed to save media',
            });
        }
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

        console.log('document upload projectId', {
            projectId,
            project,
            projectIdType: typeof projectId,
        });


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

    const handleDocumentSave = async () => {
        try {
            setDocumentUpload({ busy: true, error: null });

            if (!documentName.trim()) {
                throw new Error('Document name is required');
            }

            if (!documentType.trim()) {
                throw new Error('Document type is required');
            }

            if (editingDocumentId) {
                await updateDocumentRecord(editingDocumentId, {
                    name: documentName.trim(),
                    kind: documentType.trim(),
                    status: documentStatus,
                });

                const nextProject = await reloadProjectSnapshot();

                setForm((prev) => ({
                    ...prev,
                    documents: [...(nextProject.documents ?? [])],
                }));

                clearPendingDocument();
                setDocumentUpload({ busy: false, error: null });
                return;
            }

            if (!pendingDocumentFile) {
                throw new Error('Please select a file to upload');
            }

            const file = pendingDocumentFile;
            const upload = await getDocumentUploadUrl(file);
            await uploadBinaryToSignedUrl(upload.uploadUrl, file);

            await createDocumentRecord({
                assetUrl: upload.assetUrl,
                s3Key: upload.s3Key ?? upload.key ?? null,
                contentType: file.type || 'application/octet-stream',
                name: documentName.trim(),
                kind: documentType.trim(),
                status: documentStatus,
            });

            const nextProject = await reloadProjectSnapshot();

            setForm((prev) => ({
                ...prev,
                documents: [...(nextProject.documents ?? [])],
            }));

            clearPendingDocument();
            setDocumentUpload({ busy: false, error: null });
        } catch (error: any) {
            setDocumentUpload({
                busy: false,
                error: error?.message ?? 'Failed to save document',
            });
        }
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

    const handleOpportunitySave = async () => {
        const input = {
            type: opportunityType.trim(),
            description: opportunityDescription.trim() || null,
            urgent: Boolean(opportunityUrgent),
        };

        if (!input.type) {
            throw new Error('Opportunity type is required');
        }

        let nextProject: Partial<ProjectProfileData>;

        if (editingOpportunityId) {
            nextProject = await updateOpportunityRecord(editingOpportunityId, input);
        } else {
            nextProject = await createOpportunityRecord(input);
        }

        syncProjectState(nextProject);

        const latestItems = nextProject.opportunities ?? project?.opportunities ?? [];
        const saved =
            latestItems.find((item) =>
                editingOpportunityId ? item.id === editingOpportunityId : (
                    item.type === input.type &&
                    (item.description ?? null) === input.description &&
                    Boolean(item.urgent) === input.urgent
                )
            ) ?? null;

        setEditingOpportunityId(saved?.id ?? null);
        setOpportunityType(saved?.type ?? '');
        setOpportunityDescription(saved?.description ?? '');
        setOpportunityUrgent(Boolean(saved?.urgent));
    };

    const createOpportunityRecord = async (
        input: Pick<ProjectOpportunity, 'type' | 'description' | 'urgent'>
    ) => {
        const projectId = requireProjectId();

        const response = await fetch(`${API_BASE_URL}/projects/${projectId}/opportunities`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                type: input.type?.trim() ?? '',
                description: input.description?.trim() || null,
                urgent: Boolean(input.urgent),
            }),
        });

        return refreshProjectFromResponse(response);
    };

    const updateOpportunityRecord = async (
        opportunityId: string,
        input: Pick<ProjectOpportunity, 'type' | 'description' | 'urgent'>
    ) => {
        const response = await fetch(`${API_BASE_URL}/projects/opportunities/${opportunityId}`, {
            method: 'PATCH',
            credentials: 'include',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                type: input.type?.trim() ?? '',
                description: input.description?.trim() || null,
                urgent: Boolean(input.urgent),
            }),
        });

        return refreshProjectFromResponse(response);
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

    const createDocumentRecord = async (input: {
        assetUrl: string;
        s3Key?: string | null;
        contentType?: string | null;
        name?: string | null;
        kind?: string | null;
        status?: ProjectDocumentStatus | null;
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
                kind: input.kind ?? 'Other',
                assetUrl: input.assetUrl,
                s3Key: input.s3Key ?? null,
                contentType: input.contentType ?? null,
                name: input.name ?? null,
                status: input.status ?? 'Draft',
                metadata: {},
            }),
        });

        return refreshProjectFromResponse(response);
    };

    const updateDocumentRecord = async (
        documentId: string,
        input: {
            name?: string | null;
            kind?: string | null;
            status?: ProjectDocumentStatus | null;
        }
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

    const handleMediaFilePicked = async (file: File) => {
        try {
            setMediaUpload({ busy: false, error: null });

            if (pendingMediaPreviewUrl) {
                URL.revokeObjectURL(pendingMediaPreviewUrl);
            }

            const previewUrl = URL.createObjectURL(file);

            setPendingMediaFile(file);
            setPendingMediaPreviewUrl(previewUrl);
            setEditingMediaId(null);

            if (!mediaCaption.trim()) {
                setMediaCaption('');
            }
        } catch (error: any) {
            setMediaUpload({
                busy: false,
                error: error?.message ?? 'Failed to prepare media preview',
            });
        }
    };

    const handleDocumentFilePicked = async (file: File) => {
        try {
            setDocumentUpload({ busy: false, error: null });

            setPendingDocumentFile(file);
            setEditingDocumentId(null);

            if (!documentName.trim()) {
                setDocumentName(file.name);
            }

            if (!documentType.trim()) {
                setDocumentType('');
            }
        } catch (error: any) {
            setDocumentUpload({
                busy: false,
                error: error?.message ?? 'Failed to prepare document',
            });
        }
    };

    const handleUpdateSave = async () => {
        const input = {
            title: updateTitle.trim(),
            description: updateDescription.trim() || null,
            dateLabel: updateDateLabel.trim() || null,
            authorName: updateAuthorName.trim() || null,
            type: 'progress' as const,
        };

        if (!input.title) {
            throw new Error('Update title is required');
        }

        let nextProject: Partial<ProjectProfileData>;

        if (editingUpdateId) {
            nextProject = await updateUpdateRecord(editingUpdateId, input);
        } else {
            nextProject = await createUpdateRecord(input);
        }

        syncProjectState(nextProject);

        const latestItems = nextProject.updates ?? project?.updates ?? [];
        const saved =
            latestItems.find((item) =>
                editingUpdateId ? item.id === editingUpdateId : (
                    item.title === input.title &&
                    (item.description ?? null) === input.description &&
                    (item.dateLabel ?? null) === input.dateLabel
                )
            ) ?? null;

        setEditingUpdateId(saved?.id ?? null);
        setUpdateTitle(saved?.title ?? input.title);
        setUpdateDescription(saved?.description ?? input.description ?? '');
        setUpdateDateLabel(saved?.dateLabel ?? input.dateLabel ?? '');
        setUpdateAuthorName(saved?.authorName ?? input.authorName ?? '');
        // setUpdateType(saved?.type === 'stage' ? 'stage' : 'progress');
        setUpdateType('progress');
    };

    const createUpdateRecord = async (input: {
        title: string;
        description?: string | null;
        dateLabel?: string | null;
        authorName?: string | null;
        type?: 'progress' | 'stage' | null;
    }) => {
        const projectId = requireProjectId();

        const response = await fetch(`${API_BASE_URL}/projects/${projectId}/updates`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                title: input.title.trim(),
                description: input.description?.trim() || null,
                dateLabel: input.dateLabel?.trim() || null,
                authorName: input.authorName?.trim() || null,
                type: input.type ?? 'progress',
            }),
        });

        return refreshProjectFromResponse(response);
    };

    const updateUpdateRecord = async (
        updateId: string,
        input: {
            title: string;
            description?: string | null;
            dateLabel?: string | null;
            authorName?: string | null;
            type?: 'progress' | 'stage' | null;
        }
    ) => {
        const response = await fetch(`${API_BASE_URL}/projects/updates/${updateId}`, {
            method: 'PATCH',
            credentials: 'include',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                title: input.title.trim(),
                description: input.description?.trim() || null,
                dateLabel: input.dateLabel?.trim() || null,
                authorName: input.authorName?.trim() || null,
                type: input.type ?? 'progress',
            }),
        });

        return refreshProjectFromResponse(response);
    };

    const handleSave = async () => {
        try {
            setSaving(true);

            const normalizedSectionVisibility = form.sectionVisibility ?? undefined;

            if (section === 'media') {
                await handleMediaSave();
                onClose();
                return;
            }

            if (section === 'documents') {
                await handleDocumentSave();
                onClose();
                return;
            }

            if (section === 'opportunities') {
                await handleOpportunitySave();
                onClose();
                return;
            }

            if (section === 'updates') {
                await handleUpdateSave();
                onClose();
                return;
            }

            let payload: SaveProjectPatch;

            if (section === 'team') {
                const combinedTeam = [...baseTeam, ...(form.team ?? [])];

                const dedupedTeam = Array.from(
                    new Map(
                        combinedTeam.map((member) => {
                            const key = member.isPlatformMember
                                ? member.memberType === 'company'
                                    ? `company:${member.companyId ?? member.memberId}`
                                    : `user:${member.userId ?? member.memberId}`
                                : `manual:${member.memberType}:${member.name.trim().toLowerCase()}:${member.role ?? ''}`;

                            return [key, member];
                        })
                    ).values()
                );

                payload = {
                    team: dedupedTeam.map((member) => {
                        if (member.memberType === 'company') {
                            return {
                                memberType: 'company' as const,
                                memberId: member.companyId ?? member.memberId ?? null,
                                companyId: member.companyId ?? member.memberId ?? null,
                                userId: null,
                                name: member.name,
                                companyName: member.companyName ?? member.name,
                                avatarUrl: member.avatarUrl ?? null,
                                role: member.role ?? null,
                                permission: null,
                                isPlatformMember: member.isPlatformMember,
                                manualName: member.isPlatformMember ? null : (member.manualName ?? member.name ?? null),
                                manualOrganization: member.isPlatformMember
                                    ? null
                                    : (member.manualOrganization ?? member.companyName ?? member.name ?? null),
                            };
                        }

                        return {
                            memberType: 'user' as const,
                            memberId: member.userId ?? member.memberId ?? null,
                            userId: member.userId ?? member.memberId ?? null,
                            companyId: null,
                            name: member.name,
                            companyName: member.companyName ?? '',
                            avatarUrl: member.avatarUrl ?? null,
                            role: member.role ?? null,
                            permission: member.permission === 'creator' ? 'creator' : 'viewer',
                            isPlatformMember: member.isPlatformMember,
                            manualName: member.isPlatformMember ? null : (member.manualName ?? member.name ?? null),
                            manualOrganization: member.isPlatformMember
                                ? null
                                : (member.manualOrganization ?? member.companyName ?? null),
                        };
                    }),
                };
            } else {
                const {
                    team,
                    sectionVisibility,
                    projectVisibility,
                    documents,
                    media,
                    coverImageUrl,
                    ...rest
                } = form as ProjectEditorForm & { projectVisibility?: SectionVisibility };

                payload = {
                    ...rest,
                    projectVisibility:
                        section === 'overview' && projectVisibility
                            ? toApiVisibility(projectVisibility)
                            : undefined,
                    sectionVisibility: normalizedSectionVisibility,
                };
            }

            await onSave(payload);
            onClose();
        } finally {
            setSaving(false);
        }
    };

    const renderSectionContent = () => {
        switch (section) {
            case 'settings':
                return renderSettings();
            case 'cover':
                return renderCover();
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
            default:
                return (
                    <Alert severity="info">
                        Select a section to edit.
                    </Alert>
                );
        }
    };

    if (!project || !section) {
        return (
            <SidebarPanel
                open={open}
                onClose={onClose}
                title="Project editor"
                width={460}
                showBackdrop
                cancelLabel="Close"
            >
                <Alert severity="info">
                    Select a section to edit.
                </Alert>
            </SidebarPanel>
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
                companyId: null,
                name: entry.name,
                role: '',
                companyName: entry.companyName ?? '',
                avatarUrl: entry.avatarUrl ?? null,
                permission: 'viewer',
                isPlatformMember: true,
                manualName: null,
                manualOrganization: null,
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
                                            {getEditorMemberDisplayName(member)
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
                                                {getEditorMemberDisplayName(member)}
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
                                                {getEditorMemberSecondary(member)}
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

    const renderCover = () => (
        <Stack spacing={3}>
            <Box>
                <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                    Project Cover
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Add a cover photo to make your project stand out in listings and search results.
                </Typography>
            </Box>

            {mediaUpload.error ? (
                <Alert severity="error">{mediaUpload.error}</Alert>
            ) : null}

            <Paper
                variant="outlined"
                sx={{
                    p: 3,
                    borderStyle: 'dashed',
                    textAlign: 'center',
                    cursor: mediaUpload.busy ? 'default' : 'pointer',
                    aspectRatio: '16/9',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 2,
                    overflow: 'hidden',
                    position: 'relative',
                    '&:hover': mediaUpload.busy
                        ? undefined
                        : {
                            bgcolor: 'grey.50',
                            borderColor: 'grey.400',
                        },
                }}
                component="label"
            >
                <input
                    type="file"
                    hidden
                    accept="image/*"
                    disabled={mediaUpload.busy}
                    onChange={async (e) => {
                        const file = e.target.files?.[0];
                        e.currentTarget.value = '';
                        if (!file) return;
                        await handleCoverFilePicked(file);
                    }}
                />

                {project.coverImageUrl || form.coverImageUrl ? (
                    <>
                        <Box
                            component="img"
                            src={String(form.coverImageUrl || project.coverImageUrl)}
                            alt="Project cover"
                            sx={{
                                position: 'absolute',
                                inset: 0,
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                            }}
                        />
                        <Box
                            sx={{
                                position: 'absolute',
                                inset: 0,
                                bgcolor: 'rgba(0,0,0,0.35)',
                            }}
                        />
                    </>
                ) : null}

                <Box sx={{ position: 'relative', zIndex: 1, px: 2 }}>
                    <PhotoCameraRounded
                        sx={{
                            fontSize: 40,
                            color: project.coverImageUrl || form.coverImageUrl ? 'common.white' : 'grey.400',
                            mb: 1,
                        }}
                    />

                    <Typography
                        variant="body2"
                        color={project.coverImageUrl || form.coverImageUrl ? 'common.white' : 'text.secondary'}
                    >
                        {mediaUpload.busy ? 'Uploading…' : 'Click to upload or drag and drop'}
                    </Typography>

                    <Typography
                        variant="caption"
                        color={project.coverImageUrl || form.coverImageUrl ? 'common.white' : 'text.disabled'}
                        sx={{ opacity: project.coverImageUrl || form.coverImageUrl ? 0.9 : 1 }}
                    >
                        Recommended: 1200×675px (16:9). PNG, JPG up to 10MB
                    </Typography>
                </Box>
            </Paper>

            <Typography variant="caption" color="text.secondary">
                This image will appear at the top of your project page and as a thumbnail in project listings.
            </Typography>
        </Stack>
    );

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

                {mediaUpload.error ? <Alert severity="error" sx={{ mb: 1.5 }}>{mediaUpload.error}</Alert> : null}

                <Paper
                    variant="outlined"
                    sx={{
                        p: 3,
                        borderStyle: 'dashed',
                        borderRadius: 2,
                        textAlign: 'center',
                        cursor: mediaUpload.busy ? 'default' : 'pointer',
                        aspectRatio: '16/9',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 1.25,
                        bgcolor: 'grey.50',
                        borderColor: 'grey.300',
                        overflow: 'hidden',
                        position: 'relative',
                        '&:hover': mediaUpload.busy
                            ? undefined
                            : {
                                bgcolor: 'grey.100',
                                borderColor: 'grey.400',
                            },
                    }}
                    component="label"
                >
                    <input
                        hidden
                        type="file"
                        accept="image/*"
                        disabled={mediaUpload.busy}
                        onChange={async (e) => {
                            const file = e.target.files?.[0];
                            e.currentTarget.value = '';
                            if (!file) return;
                            await handleCoverFilePicked(file);
                        }}
                    />

                    {(form.coverImageUrl || project.coverImageUrl) ? (
                        <>
                            <Box
                                component="img"
                                src={String(form.coverImageUrl || project.coverImageUrl)}
                                alt="Project cover preview"
                                sx={{
                                    position: 'absolute',
                                    inset: 0,
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                }}
                            />
                            <Box
                                sx={{
                                    position: 'absolute',
                                    inset: 0,
                                    bgcolor: 'rgba(0,0,0,0.35)',
                                }}
                            />
                            <Box
                                sx={{
                                    position: 'relative',
                                    zIndex: 1,
                                    color: 'common.white',
                                    px: 2,
                                }}
                            >
                                <PhotoCameraRounded sx={{ fontSize: 40, mb: 1 }} />
                                <Typography variant="body2" fontWeight={600}>
                                    {mediaUpload.busy ? 'Uploading…' : 'Click to replace or drag and drop'}
                                </Typography>
                                <Typography variant="caption" sx={{ opacity: 0.9 }}>
                                    Recommended: 1200×675px (16:9). PNG, JPG up to 10MB
                                </Typography>
                            </Box>
                        </>
                    ) : (
                        <>
                            <PhotoCameraRounded
                                sx={{
                                    fontSize: 40,
                                    color: 'grey.400',
                                }}
                            />
                            <Typography variant="body2" color="text.secondary">
                                {mediaUpload.busy ? 'Uploading…' : 'Click to upload or drag and drop'}
                            </Typography>
                            <Typography variant="caption" color="text.disabled">
                                Recommended: 1200×675px (16:9). PNG, JPG up to 10MB
                            </Typography>
                        </>
                    )}
                </Paper>

                <Stack
                    direction="row"
                    spacing={1}
                    sx={{ mt: 1.5 }}
                    flexWrap="wrap"
                    useFlexGap
                >
                    <Button
                        variant="outlined"
                        component="label"
                        disabled={mediaUpload.busy}
                        startIcon={<CloudUploadRounded />}
                    >
                        {form.coverImageUrl || project.coverImageUrl ? 'Replace cover' : 'Upload cover'}
                        <input
                            hidden
                            type="file"
                            accept="image/*"
                            onChange={async (e) => {
                                const file = e.target.files?.[0];
                                e.currentTarget.value = '';
                                if (!file) return;
                                await handleCoverFilePicked(file);
                            }}
                        />
                    </Button>

                    {(form.coverImageUrl || project.coverImageUrl) ? (
                        <Button
                            color="error"
                            variant="text"
                            disabled={mediaUpload.busy}
                            onClick={handleRemoveCover}
                        >
                            Remove cover
                        </Button>
                    ) : null}
                </Stack>

                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                    This image will appear at the top of your project page and as a thumbnail in project listings.
                </Typography>
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
                fullWidth
                value={(form.description as string) ?? ''}
                onChange={(e) => setField('description', e.target.value)}
                placeholder="A short, listing-friendly summary of the project"
            />

            <Stack spacing={0.5}>
                <FormControl fullWidth size="small">
                    <InputLabel>Project type</InputLabel>
                    <Select
                        value={(form.type as string) ?? ''}
                        label="Project type"
                        onChange={(e) => setField('type', e.target.value)}
                    >
                        {PROJECT_TYPE_OPTIONS.map((option) => (
                            <MenuItem key={option.id} value={option.id}>
                                {option.label}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>

                {form.type ? (
                    <Typography variant="caption" color="text.secondary">
                        {
                            PROJECT_TYPE_OPTIONS.find((option) => option.id === form.type)
                                ?.description ?? ''
                        }
                    </Typography>
                ) : null}
            </Stack>

            {/* <TextField
                label="Estimated annual removal"
                size="small"
                fullWidth
                value={(form.estimatedAnnualRemoval as string) ?? ''}
                onChange={(e) => setField('estimatedAnnualRemoval', e.target.value)}
                placeholder="e.g. 60,000 tCO₂e/year"
            /> */}

            <ProjectVisibilityField
                value={projectVisibilityValue}
                onChange={(value) => setField('projectVisibility' as any, value)}
            />
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
                    label="Project Area"
                    size="small"
                    fullWidth
                    type="number"
                    value={form.totalAreaHa ?? ''}
                    onChange={(e) =>
                        setField('totalAreaHa', e.target.value === '' ? null : Number(e.target.value))
                    }
                    placeholder="e.g., 15000"
                    InputProps={{
                        endAdornment: <InputAdornment position="end">ha</InputAdornment>,
                    }}
                    helperText="Optional — total project area in hectares"
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

                    <ProjectLocationMap
                        lat={form.latitude == null ? '' : String(form.latitude)}
                        lng={form.longitude == null ? '' : String(form.longitude)}
                        height={260}
                        onChange={({ lat, lng }) => {
                            setField('latitude', lat === '' ? null : Number(lat));
                            setField('longitude', lng === '' ? null : Number(lng));
                        }}
                    />
                </Box>

            </Stack>
        );
    };

    const renderReadiness = () => {
        const currentStage = (form.stage as ProjectStage) ?? project.stage;
        const selectedStageOption = PROJECT_STAGE_OPTIONS.find(
            (option) => option.value === currentStage
        );

        return (
            <Stack spacing={3}>
                <Box>
                    <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                        Project Stage
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Update the current stage of the project.
                    </Typography>
                </Box>

                <FormControl fullWidth size="small">
                    <InputLabel>Current Stage</InputLabel>
                    <Select
                        value={currentStage ?? ''}
                        label="Current Stage"
                        onChange={(e) => setField('stage', e.target.value as ProjectStage)}
                    >
                        {PROJECT_STAGE_OPTIONS.map((option) => (
                            <MenuItem key={option.value} value={option.value}>
                                {option.label}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>

                <Typography variant="caption" color="text.secondary">
                    {currentStage ? stageDescriptions[currentStage] : selectedStageOption?.description ?? ''}
                </Typography>
            </Stack>
        );
    };

    const REGISTRY_PLATFORM_OPTIONS = [
        { value: 'verra-vcs', label: 'Verra (VCS)' },
        { value: 'verra-ccb', label: 'Verra (CCB)' },
        { value: 'gold-standard', label: 'Gold Standard' },
        { value: 'acr', label: 'American Carbon Registry (ACR)' },
        { value: 'car', label: 'Climate Action Reserve (CAR)' },
        { value: 'plan-vivo', label: 'Plan Vivo' },
        { value: 'puro-earth', label: 'Puro.earth' },
        { value: 'isometric', label: 'Isometric' },
        { value: 'cercarbono', label: 'Cercarbono' },
        { value: 'biocarbon', label: 'BioCarbon Registry' },
        { value: 'other', label: 'Other' },
    ] as const;

    const renderRegistry = () => (
        <Stack spacing={3}>
            <Box>
                <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                    Registry Information
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Select the carbon registry and link to your project listing.
                </Typography>
            </Box>

            <FormControl fullWidth size="small">
                <InputLabel>Registry Platform</InputLabel>
                <Select
                    value={(form.registrationPlatform as string) ?? ''}
                    label="Registry Platform"
                    onChange={(e) => setField('registrationPlatform', e.target.value)}
                >
                    {REGISTRY_PLATFORM_OPTIONS.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                            {option.label}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>

            <TextField
                label="Registry ID"
                size="small"
                fullWidth
                value={(form.registryId as string) ?? ''}
                onChange={(e) => setField('registryId', e.target.value)}
                placeholder="e.g., VCS-2847"
            />

            <TextField
                label="Registry Listing URL"
                size="small"
                fullWidth
                value={(form.registryProjectUrl as string) ?? ''}
                onChange={(e) => setField('registryProjectUrl', e.target.value)}
                placeholder="https://registry.verra.org/..."
            />

            <TextField
                label="Registry status"
                size="small"
                fullWidth
                value={(form.registryStatus as string) ?? ''}
                onChange={(e) => setField('registryStatus', e.target.value)}
            />

            <TextField
                label="Methodology"
                size="small"
                fullWidth
                value={(form.methodology as string) ?? ''}
                onChange={(e) => setField('methodology', e.target.value)}
            />
        </Stack>
    );

    const renderImpact = () => (
        <Stack spacing={3}>
            <Box>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    Impact & Credits
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Update credit issuance and impact data.
                </Typography>
            </Box>

            <TextField
                label="Total Credits Issued"
                fullWidth
                value={form.totalCreditsIssued ?? ''}
                onChange={(e) =>
                    setForm((prev) => ({
                        ...prev,
                        totalCreditsIssued: e.target.value ? Number(e.target.value) : null,
                    }))
                }
                placeholder="e.g., 58000"
                type="number"
            />

            <TextField
                label="Annual Estimate"
                fullWidth
                value={
                    form.annualEstimatedCredits
                        ? `${form.annualEstimatedCredits}${form.annualEstimateUnit ? ` ${form.annualEstimateUnit}` : ''}`
                        : ''
                }
                onChange={(e) => {
                    const raw = e.target.value;

                    // simple parse: "62000 tCO2e/yr"
                    const [num, ...unitParts] = raw.split(' ');
                    setForm((prev) => ({
                        ...prev,
                        annualEstimatedCredits: num ? Number(num) : null,
                        annualEstimateUnit: unitParts.join(' ') || null,
                    }));
                }}
                placeholder="e.g., 62000 tCO2e/yr"
            />

            <Stack direction="row" spacing={2}>
                <TextField
                    label="Crediting Start"
                    type="date"
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    value={form.creditingStart ?? ''}
                    onChange={(e) =>
                        setForm((prev) => ({
                            ...prev,
                            creditingStart: e.target.value || null,
                        }))
                    }
                />

                <TextField
                    label="Crediting End"
                    type="date"
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    value={form.creditingEnd ?? ''}
                    onChange={(e) =>
                        setForm((prev) => ({
                            ...prev,
                            creditingEnd: e.target.value || null,
                        }))
                    }
                />
            </Stack>
        </Stack>

    );

    const OPPORTUNITY_TYPE_OPTIONS = [
        'Financing',
        'Technical Advisor',
        'Buyers',
        'MRV Provider',
        'Insurance',
        'Local Partners',
    ] as const;

    const renderOpportunities = () => (
        <SidebarOpportunitiesSection
            items={project?.opportunities ?? []}
            editingOpportunityId={editingOpportunityId}
            opportunityType={opportunityType}
            opportunityDescription={opportunityDescription}
            opportunityUrgent={opportunityUrgent}
            opportunityTypeOptions={OPPORTUNITY_TYPE_OPTIONS}
            onOpportunityTypeChange={setOpportunityType}
            onOpportunityDescriptionChange={setOpportunityDescription}
            onOpportunityUrgentChange={setOpportunityUrgent}
        />
    );

    const renderUpdates = () => {
        const items = project?.updates ?? [];
        const editingItem =
            editingUpdateId != null
                ? items.find((item) => item.id === editingUpdateId) ?? null
                : null;

        return (
            <Stack spacing={3}>
                <Box>
                    <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                        {editingItem ? 'Edit Update' : 'Post Update'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Share progress with followers.
                    </Typography>
                </Box>

                {/* <Box>
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
                            onClick={() => setUpdateType('progress')}
                            sx={{
                                flex: 1,
                                p: 1.5,
                                cursor: 'pointer',
                                borderColor:
                                    updateType === 'progress' ? 'primary.main' : 'grey.200',
                                bgcolor:
                                    updateType === 'progress' ? 'primary.50' : 'transparent',
                                '&:hover': {
                                    borderColor: 'primary.main',
                                },
                                transition: 'all 0.15s ease',
                            }}
                        >
                            <Typography
                                variant="caption"
                                fontWeight={updateType === 'progress' ? 700 : 500}
                                color={
                                    updateType === 'progress'
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
                            onClick={() => setUpdateType('stage')}
                            sx={{
                                flex: 1,
                                p: 1.5,
                                cursor: 'pointer',
                                borderColor:
                                    updateType === 'stage' ? 'primary.main' : 'grey.200',
                                bgcolor:
                                    updateType === 'stage' ? 'primary.50' : 'transparent',
                                '&:hover': {
                                    borderColor: 'primary.main',
                                },
                                transition: 'all 0.15s ease',
                            }}
                        >
                            <Typography
                                variant="caption"
                                fontWeight={updateType === 'stage' ? 700 : 500}
                                color={
                                    updateType === 'stage'
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
                </Box> */}

                {updateType === 'stage' && (
                    <FormControl fullWidth size="small">
                        <InputLabel>New Stage</InputLabel>
                        <Select
                            value={(form.stage as ProjectStage) ?? project.stage ?? ''}
                            label="New Stage"
                            onChange={(e) => setField('stage', e.target.value as ProjectStage)}
                        >
                            {PROJECT_STAGE_OPTIONS.map((option) => (
                                <MenuItem key={option.value} value={option.value}>
                                    {option.label}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                )}

                <TextField
                    label="Title"
                    fullWidth
                    size="small"
                    value={updateTitle}
                    onChange={(e) => setUpdateTitle(e.target.value)}
                    placeholder="e.g. Baseline survey completed"
                />

                <TextField
                    label="Date"
                    type="date"
                    fullWidth
                    size="small"
                    value={updateDateLabel}
                    onChange={(e) => setUpdateDateLabel(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                />

                <TextField
                    label="Description"
                    fullWidth
                    size="small"
                    multiline
                    minRows={4}
                    value={updateDescription}
                    onChange={(e) => setUpdateDescription(e.target.value)}
                    placeholder="Share what's new..."
                />
            </Stack>
        );
    };

    const renderDocuments = () => (
        <SidebarDocumentsSection
            items={(form.documents ?? []) as ProjectDocument[]}
            editingDocumentId={editingDocumentId}
            documentName={documentName}
            documentType={documentType}
            documentStatus={documentStatus}
            documentUpload={documentUpload}
            pendingDocumentFile={pendingDocumentFile}
            documentTypeOptions={DOCUMENT_TYPE_OPTIONS}
            onDocumentNameChange={setDocumentName}
            onDocumentTypeChange={setDocumentType}
            onDocumentStatusChange={setDocumentStatus}
            onPickFile={handleDocumentFilePicked}
        />
    );

    const renderMedia = () => (
        <SidebarMediaSection
            items={(form.media ?? project.media ?? []) as ProjectMediaItem[]}
            editingMediaId={editingMediaId}
            mediaCaption={mediaCaption}
            mediaUpload={mediaUpload}
            saving={saving}
            pendingMediaFile={pendingMediaFile}
            pendingMediaPreviewUrl={pendingMediaPreviewUrl}
            onMediaCaptionChange={setMediaCaption}
            onPickFile={handleMediaFilePicked}
            onClearPending={() => {
                clearPendingMedia();
                setMediaCaption('');
            }}
        />
    );

    const renderTeam = () => {
        const items = (form.team ?? []) as TeamEditorMember[];

        const selectedKeys = new Set(
            items.map((item) =>
                item.isPlatformMember
                    ? `${item.memberType}:${item.memberId ?? item.userId ?? item.companyId}`
                    : `manual:${item.id}`
            ),
        );

        const searchResults = collaboratorOptions.filter(
            (entry) => !selectedKeys.has(`${entry.entityType}:${entry.id}`),
        );

        const addSelectedTeamMember = () => {
            if (teamManualMode) {
                const trimmedName = teamName.trim();
                if (!trimmedName) return;

                const nextMember: TeamEditorMember =
                    teamRole === 'company'
                        ? {
                            id: crypto.randomUUID(),
                            memberType: 'company',
                            memberId: null,
                            companyId: null,
                            userId: null,
                            name: trimmedName,
                            companyName: trimmedName,
                            avatarUrl: null,
                            role: teamProjectRole || '',
                            permission: null,
                            isPlatformMember: false,
                            manualName: null,
                            manualOrganization: trimmedName,
                        }
                        : {
                            id: crypto.randomUUID(),
                            memberType: 'user',
                            memberId: null,
                            userId: null,
                            companyId: null,
                            name: trimmedName,
                            companyName: '',
                            avatarUrl: null,
                            role: teamProjectRole || '',
                            permission: 'viewer',
                            isPlatformMember: false,
                            manualName: trimmedName,
                            manualOrganization: '',
                        };

                setField('team', [...items, nextMember]);
                setTeamName('');
                setTeamProjectRole('');
                setTeamManualMode(false);
                return;
            }

            if (!teamSelectedPlatform) return;

            const nextMember: TeamEditorMember =
                teamSelectedPlatform.entityType === 'company'
                    ? {
                        id: crypto.randomUUID(),
                        memberType: 'company',
                        memberId: teamSelectedPlatform.id,
                        companyId: teamSelectedPlatform.id,
                        userId: null,
                        name: teamSelectedPlatform.name,
                        companyName: teamSelectedPlatform.companyName ?? teamSelectedPlatform.name,
                        avatarUrl: teamSelectedPlatform.avatarUrl ?? null,
                        role: teamProjectRole || '',
                        permission: null,
                        isPlatformMember: true,
                    }
                    : {
                        id: crypto.randomUUID(),
                        memberType: 'user',
                        memberId: teamSelectedPlatform.id,
                        userId: teamSelectedPlatform.id,
                        companyId: null,
                        name: teamSelectedPlatform.name,
                        companyName: teamSelectedPlatform.companyName ?? '',
                        avatarUrl: teamSelectedPlatform.avatarUrl ?? null,
                        role: teamProjectRole || '',
                        permission: 'viewer',
                        isPlatformMember: true,
                    };

            setField('team', [...items, nextMember]);
            setTeamSelectedPlatform(null);
            setTeamSearch('');
            setTeamProjectRole('');
            setCollaboratorOptions([]);
        };

        return (
            <Stack spacing={3}>
                <Box>
                    <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                        Project Team
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Add platform users/companies or manually add external collaborators.
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
                        setTeamManualMode(false);
                        setTeamName('');
                        setTeamProjectRole('');
                        setTeamSelectedPlatform(null);
                    }}
                >
                    <ToggleButton value="company" sx={{ textTransform: 'none', flex: 1 }}>
                        Company
                    </ToggleButton>
                    <ToggleButton value="user" sx={{ textTransform: 'none', flex: 1 }}>
                        Individual
                    </ToggleButton>
                </ToggleButtonGroup>

                {!teamManualMode ? (
                    <Box>
                        <TextField
                            fullWidth
                            size="small"
                            label={teamRole === 'company' ? 'Search companies' : 'Search users'}
                            placeholder={teamRole === 'company' ? 'Search companies...' : 'Search people...'}
                            value={teamSearch}
                            onChange={(e) => {
                                setTeamSearch(e.target.value);
                                setTeamSelectedPlatform(null);
                            }}
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
                                            onClick={() => {
                                                setTeamSelectedPlatform(result);
                                                setTeamSearch('');
                                            }}
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
                                                    <Chip label="On platform" size="small" sx={{ height: 18, fontSize: '0.65rem' }} />
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

                                <Box
                                    onClick={() => {
                                        setTeamManualMode(true);
                                        setTeamName(teamSearch);
                                        setTeamSearch('');
                                        setTeamSelectedPlatform(null);
                                    }}
                                    sx={{
                                        px: 1.5,
                                        py: 1.25,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 1,
                                        cursor: 'pointer',
                                        bgcolor: 'grey.50',
                                        '&:hover': { bgcolor: 'grey.100' },
                                        borderTop: '1px solid',
                                        borderColor: 'grey.100',
                                    }}
                                >
                                    <Typography variant="body2" color="text.secondary">
                                        Not on platform? Add manually
                                    </Typography>
                                </Box>
                            </Paper>
                        ) : null}

                        <Button
                            size="small"
                            onClick={() => {
                                setTeamManualMode(true);
                                setTeamSelectedPlatform(null);
                                setTeamSearch('');
                            }}
                            sx={{ mt: 1, textTransform: 'none' }}
                        >
                            + Add manually
                        </Button>
                    </Box>
                ) : (
                    <Stack spacing={2}>
                        <Box display="flex" alignItems="center" justifyContent="space-between">
                            <Typography variant="caption" color="text.secondary" fontWeight="medium">
                                Manual entry
                            </Typography>
                            <Button
                                size="small"
                                onClick={() => {
                                    setTeamManualMode(false);
                                    setTeamName('');
                                }}
                                sx={{ textTransform: 'none' }}
                            >
                                Search instead
                            </Button>
                        </Box>

                        <TextField
                            label={teamRole === 'company' ? 'Company name' : 'Full name'}
                            fullWidth
                            value={teamName}
                            onChange={(e) => setTeamName(e.target.value)}
                            placeholder={teamRole === 'company' ? 'e.g. South Pole' : 'e.g. Jane Smith'}
                        />
                    </Stack>
                )}

                {(teamSelectedPlatform || teamManualMode) ? (
                    <>
                        <FormControl fullWidth size="small">
                            <InputLabel>Project role</InputLabel>
                            <Select
                                value={teamProjectRole}
                                label="Project role"
                                onChange={(e) => setTeamProjectRole(e.target.value)}
                            >
                                {TEAM_PROJECT_ROLE_OPTIONS.map((option) => (
                                    <MenuItem key={option} value={option}>
                                        {option}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <Button variant="contained" onClick={addSelectedTeamMember}>
                            Add to team
                        </Button>
                    </>
                ) : null}

                <Stack spacing={2}>
                    {items.map((item, index) => {
                        const isCreator =
                            item.memberType === 'user' && item.permission === 'creator';

                        return (
                            <Paper
                                key={`${item.memberType}:${item.memberId ?? item.id}:${index}`}
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
                                            <Stack direction="row" spacing={0.75} alignItems="center">
                                                <Typography variant="body2" fontWeight={700} noWrap>
                                                    {item.name}
                                                </Typography>
                                                {item.isPlatformMember ? (
                                                    <Chip label="On platform" size="small" sx={{ height: 18, fontSize: '0.65rem' }} />
                                                ) : (
                                                    <Chip label="Manual" size="small" sx={{ height: 18, fontSize: '0.65rem' }} />
                                                )}
                                            </Stack>

                                            <Typography variant="caption" color="text.secondary" noWrap>
                                                {item.memberType === 'company'
                                                    ? item.companyName || 'Company'
                                                    : isCreator
                                                        ? 'Project creator'
                                                        : item.companyName || (item.isPlatformMember ? 'Platform user' : 'External individual')}
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

                                    <FormControl fullWidth size="small">
                                        <InputLabel>Project role</InputLabel>
                                        <Select
                                            value={item.role ?? ''}
                                            label="Project role"
                                            onChange={(e) => {
                                                const next = [...items];
                                                next[index] = {
                                                    ...next[index],
                                                    role: e.target.value,
                                                } as TeamEditorMember;
                                                setField('team', next);
                                            }}
                                        >
                                            {TEAM_PROJECT_ROLE_OPTIONS.map((option) => (
                                                <MenuItem key={option} value={option}>
                                                    {option}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>

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
                    })}
                </Stack>
            </Stack>
        );
    };

    return (
        <SidebarPanel
            open={open}
            onClose={onClose}
            title={SECTION_LABELS[section]}
            onSave={handleSave}
            saveLabel={saving ? 'Saving...' : 'Save'}
            saveDisabled={
                saving ||
                mediaUpload.busy ||
                documentUpload.busy ||
                (section === 'media' && !editingMediaId && !pendingMediaFile)
            }
            width={460}
            showBackdrop
        >
            {renderSectionContent()}
        </SidebarPanel>
    );
}