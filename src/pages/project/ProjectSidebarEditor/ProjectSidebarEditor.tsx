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
    ProjectTeamSaveMember,
    ProjectUpdate,
    SectionVisibility,
    ProjectRole,
} from '../projectProfile.types';
import { PROJECT_STAGE_OPTIONS } from '../../../constants/projectStages';
import { stageDescriptions } from '../projectProfile.constants';

import ProjectTeamEditorSection from './SidebarTeamSection';
import ProjectPermissionEditorSection from './SidebarPermissionSection';

import {
    dedupeTeamMembers,
    getEditorMemberDisplayName,
    getEditorMemberSecondary,
    normalizeTeamMember,
    PlatformCollaboratorOption,
    toSaveTeamMember,
    type TeamEditorMember,
} from './projectTeamEditor.shared';
import SidebarUpdatesSection from './SidebarUpdatesSection';

type EditableProjectPatch = Omit<
    Partial<ProjectProfileData>,
    'team' | 'sectionVisibility'
>;

const REGISTRY_STATUS_OPTIONS = [
    'Not Started',
    'PDD Submitted',
    'PDD Approved',
    'Credits Issued',
] as const;

type MeResponse = {
    ok?: boolean;
    user?: {
        id: string;
        email: string;
        name?: string | null;
        avatarUrl?: string | null;
    };
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
    team?: ProjectTeamSaveMember[];
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
    team: 'Project Partners',
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

function normalizeRegistryStatus(value: unknown): string {
    const raw = typeof value === 'string' ? value.trim() : '';

    if (!raw) return 'Not Started';

    return REGISTRY_STATUS_OPTIONS.includes(raw as (typeof REGISTRY_STATUS_OPTIONS)[number])
        ? raw
        : 'Not Started';
}

function sanitizeEstimatedAnnualRemoval(value: unknown): string | null {
    if (value == null) return null;

    if (typeof value === 'string') {
        const trimmed = value.trim();

        if (!trimmed) return null;
        if (trimmed === '{}' || trimmed === '{"value":"{}"}') return null;

        try {
            const parsed = JSON.parse(trimmed);

            if (parsed == null) return null;

            if (typeof parsed === 'string') {
                const nested = parsed.trim();
                return nested && nested !== '{}' ? nested : null;
            }

            if (typeof parsed === 'object') {
                const nestedValue =
                    typeof (parsed as any).value === 'string'
                        ? (parsed as any).value.trim()
                        : '';

                return nestedValue && nestedValue !== '{}' ? nestedValue : null;
            }
        } catch {
            return trimmed;
        }

        return trimmed;
    }

    return String(value);
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
    const [mediaUpload, setMediaUpload] = useState<UploadState>({ busy: false, error: null });
    const [documentUpload, setDocumentUpload] = useState<UploadState>({ busy: false, error: null });
    const [currentUserName, setCurrentUserName] = useState('');
    const [meLoading, setMeLoading] = useState(false);

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

    const syncProjectState = React.useCallback(
        (nextProject: Partial<ProjectProfileData> | null | undefined) => {
            if (!nextProject) return;
            commitProjectPatch(nextProject);
        },
        [commitProjectPatch]
    );

    const reloadProjectUpdates = async (): Promise<ProjectUpdate[]> => {
        const projectId = requireProjectId();

        const response = await fetch(`${API_BASE_URL}/projects/${projectId}/updates`, {
            method: 'GET',
            credentials: 'include',
            headers: { Accept: 'application/json' },
        });

        const payload = await parseJsonSafe(response);

        if (!response.ok) {
            throw new Error(
                getErrorMessage(payload, `Failed to reload project updates (${response.status})`)
            );
        }

        const items = Array.isArray(payload?.items)
            ? payload.items
            : Array.isArray(payload?.data?.items)
                ? payload.data.items
                : [];

        const nextUpdates: ProjectUpdate[] = items.map((item: any) => ({
            id: item.id,
            title: item.title ?? '',
            description: item.description ?? null,
            dateLabel: item.dateLabel ?? null,
            authorName: item.authorName ?? null,
            type: item.type === 'stage' ? 'stage' : 'progress',
            sortOrder: Number(item.sortOrder ?? 0),
            isActive: Boolean(item.isActive ?? true),
            createdAt: item.createdAt ?? null,
        }));

        commitProjectPatch({ updates: nextUpdates });

        return nextUpdates;
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
                    estimatedAnnualRemoval: sanitizeEstimatedAnnualRemoval(project.estimatedAnnualRemoval) ?? '',
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
                    registryStatus: normalizeRegistryStatus(project.registryStatus),
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

                setForm({
                    team: existingTeam,
                });
                break;
            }

            case 'settings': {
                const permissionCandidates = (project.team ?? [])
                    .map(normalizeTeamMember)
                    .filter((member): member is TeamEditorMember => Boolean(member))
                    .filter(
                        (member) =>
                            member.memberType === 'user' &&
                            member.isPlatformMember
                    );

                setForm({
                    team: permissionCandidates,
                });
                break;
            }

            default:
                setForm({});
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

    }, [open, project, section, initialMediaId, clearPendingMedia, clearPendingDocument]);

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

    const refreshParentProject = React.useCallback(async () => {
        const nextProject = await reloadProjectSnapshot();
        syncProjectState(nextProject);
        return nextProject;
    }, [reloadProjectSnapshot, syncProjectState]);

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

                const nextProject = await refreshParentProject();

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

            const nextProject = await refreshParentProject();

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

                const nextProject = await refreshParentProject();

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

            const nextProject = await refreshParentProject();

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

        if (editingOpportunityId) {
            await updateOpportunityRecord(editingOpportunityId, input);
        } else {
            await createOpportunityRecord(input);
        }

        const nextProject = await refreshParentProject();
        const latestItems = nextProject.opportunities ?? [];

        const saved =
            latestItems.find((item) =>
                editingOpportunityId
                    ? item.id === editingOpportunityId
                    : (
                        item.type === input.type &&
                        (item.description ?? null) === input.description &&
                        Boolean(item.urgent) === input.urgent
                    )
            ) ?? null;

        setForm((prev) => ({
            ...prev,
            opportunities: [...latestItems],
        }));

        setEditingOpportunityId(saved?.id ?? null);
        setOpportunityType(saved?.type ?? input.type);
        setOpportunityDescription(saved?.description ?? input.description ?? '');
        setOpportunityUrgent(Boolean(saved?.urgent ?? input.urgent));
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

        if (editingUpdateId) {
            await updateUpdateRecord(editingUpdateId, input);
        } else {
            await createUpdateRecord(input);
        }

        const latestItems = await reloadProjectUpdates();

        const saved =
            latestItems.find((item) =>
                editingUpdateId
                    ? item.id === editingUpdateId
                    : (
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
        setUpdateType(saved?.type === 'stage' ? 'stage' : 'progress');
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

        const payload = await parseJsonSafe(response);

        if (!response.ok) {
            throw new Error(getErrorMessage(payload, `Failed to create update (${response.status})`));
        }

        return payload?.data ?? payload;
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

        const payload = await parseJsonSafe(response);

        if (!response.ok) {
            throw new Error(getErrorMessage(payload, `Failed to update update (${response.status})`));
        }

        return payload?.data ?? payload;
    };

    const handleSave = async () => {
        try {
            setSaving(true);

            const normalizedSectionVisibility = form.sectionVisibility
                ? Object.fromEntries(
                    Object.entries(form.sectionVisibility).map(([key, value]) => [
                        key,
                        toApiVisibility(value),
                    ])
                ) as Partial<Record<ProjectSectionKey, 'public' | 'private'>>
                : undefined;

            switch (section) {
                case 'cover': {
                    await refreshParentProject();
                    onClose();
                    return;
                }

                case 'media': {
                    await handleMediaSave();
                    onClose();
                    return;
                }

                case 'documents': {
                    await handleDocumentSave();
                    onClose();
                    return;
                }

                case 'opportunities': {
                    await handleOpportunitySave();
                    onClose();
                    return;
                }

                case 'updates': {
                    await handleUpdateSave();
                    onClose();
                    return;
                }

                case 'team': {
                    await onSave({
                        team: ((form.team ?? []) as TeamEditorMember[]).map(toSaveTeamMember),
                    });
                    onClose();
                    return;
                }

                case 'settings': {
                    await onSave({
                        team: ((form.team ?? []) as TeamEditorMember[]).map(toSaveTeamMember),
                    });
                    onClose();
                    return;
                }

                case 'overview': {
                    await onSave({
                        name: form.name ?? '',
                        stage: form.stage,
                        type: form.type ?? '',
                        description: form.description ?? '',
                        estimatedAnnualRemoval: form.estimatedAnnualRemoval ?? null,
                        projectVisibility: projectVisibilityValue,
                    });
                    onClose();
                    return;
                }

                case 'story': {
                    await onSave({
                        storyProblem: form.storyProblem ?? '',
                        storyApproach: form.storyApproach ?? '',
                        sectionVisibility: normalizedSectionVisibility,
                    });
                    onClose();
                    return;
                }

                case 'location': {
                    await onSave({
                        country: form.country ?? '',
                        region: form.region ?? '',
                        latitude: form.latitude ?? null,
                        longitude: form.longitude ?? null,
                        totalAreaHa: form.totalAreaHa ?? null,
                        sectionVisibility: normalizedSectionVisibility,
                    });
                    onClose();
                    return;
                }

                case 'readiness': {
                    await onSave({
                        stage: form.stage,
                        sectionVisibility: normalizedSectionVisibility,
                    });
                    onClose();
                    return;
                }

                case 'registry': {
                    await onSave({
                        registrationPlatform: form.registrationPlatform ?? '',
                        registryId: form.registryId ?? '',
                        registryProjectUrl: form.registryProjectUrl ?? '',
                        registryStatus: form.registryStatus ?? '',
                        methodology: form.methodology ?? '',
                        sectionVisibility: normalizedSectionVisibility,
                    });
                    onClose();
                    return;
                }

                case 'impact': {
                    await onSave({
                        totalCreditsIssued: form.totalCreditsIssued ?? null,
                        annualEstimatedCredits: form.annualEstimatedCredits ?? null,
                        annualEstimateUnit: form.annualEstimateUnit ?? null,
                        creditingStart: form.creditingStart ?? null,
                        creditingEnd: form.creditingEnd ?? null,
                        sectionVisibility: normalizedSectionVisibility,
                    });
                    onClose();
                    return;
                }

                default:
                    onClose();
                    return;
            }
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

    const renderSettings = () => (
        <ProjectPermissionEditorSection
            apiBaseUrl={API_BASE_URL}
            value={(form.team ?? []) as TeamEditorMember[]}
            onChange={(next) => setField('team', next)}
        />
    );

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

            <FormControl fullWidth size="small">
                <InputLabel>Registry status</InputLabel>
                <Select
                    value={normalizeRegistryStatus(form.registryStatus)}
                    label="Registry status"
                    onChange={(e) => setField('registryStatus', e.target.value)}
                >
                    {REGISTRY_STATUS_OPTIONS.map((option) => (
                        <MenuItem key={option} value={option}>
                            {option}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>

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
            <SidebarUpdatesSection
                editingItem={editingItem}
                updateType={updateType}
                stageValue={(form.stage as ProjectStage) ?? project.stage ?? ''}
                stageOptions={PROJECT_STAGE_OPTIONS}
                updateTitle={updateTitle}
                updateDateLabel={updateDateLabel}
                updateDescription={updateDescription}
                onStageChange={(value) => setField('stage', value)}
                onUpdateTitleChange={setUpdateTitle}
                onUpdateDateLabelChange={setUpdateDateLabel}
                onUpdateDescriptionChange={setUpdateDescription}
            />
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

    const renderTeam = () => (
        <ProjectTeamEditorSection
            apiBaseUrl={API_BASE_URL}
            value={(form.team ?? []) as TeamEditorMember[]}
            onChange={(next) => setField('team', next)}
        />
    );

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