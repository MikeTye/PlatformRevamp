import React, { useEffect, useMemo, useState } from 'react';
import {
    Alert,
    Paper,
    Box,
    Button,
    Divider,
    Drawer,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
    Stack,
    Switch,
    Tab,
    Tabs,
    TextField,
    Typography,
    FormControlLabel,
} from '@mui/material';
import ImageRounded from '@mui/icons-material/ImageRounded';
import PublicRounded from '@mui/icons-material/PublicRounded';
import LockRounded from '@mui/icons-material/LockRounded';

import type {
    ProjectDocument,
    ProjectMediaItem,
    ProjectOpportunity,
    ProjectProfileData,
    ProjectReadinessItem,
    ProjectSectionKey,
    ProjectStage,
    ProjectTeamMember,
    ProjectUpdate,
    SectionVisibility,
} from './ProjectProfileView';

type EditableProjectPatch = Partial<ProjectProfileData>;

export interface ProjectSidebarEditorProps {
    open: boolean;
    section: ProjectSectionKey | null;
    project: ProjectProfileData | null;
    onClose: () => void;
    onSave: (patch: EditableProjectPatch) => Promise<void> | void;
}

type StoryTab = 'story' | 'cobenefits';

const SECTION_LABELS: Record<ProjectSectionKey, string> = {
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
};

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

const READINESS_STATUS_OPTIONS: ProjectReadinessItem['status'][] = [
    'yes',
    'progress',
    'seeking',
    'na',
];

const CO_BENEFIT_OPTIONS = [
    'Climate',
    'Community',
    'Biodiversity',
    'Water',
    'Soil',
    'Livelihoods',
    'Education',
    'Health',
    'Gender Equality',
    'Other',
];

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
        type: 'Financing',
        description: '',
        urgent: false,
    };
}

function emptyUpdate(): ProjectUpdate {
    return {
        id: crypto.randomUUID(),
        title: '',
        description: '',
        dateLabel: '',
        authorName: '',
    };
}

function emptyDocument(): ProjectDocument {
    return {
        id: crypto.randomUUID(),
        name: '',
        type: '',
        status: '',
        dateLabel: '',
    };
}

function emptyMedia(): ProjectMediaItem {
    return {
        id: crypto.randomUUID(),
        url: '',
        caption: '',
        dateLabel: '',
    };
}

function emptyTeamMember(): ProjectTeamMember {
    return {
        id: crypto.randomUUID(),
        name: '',
        roleLabel: '',
        companyName: '',
        avatarUrl: null,
    };
}

function emptyReadiness(): ProjectReadinessItem {
    return {
        id: crypto.randomUUID(),
        label: '',
        status: 'na',
        note: '',
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

export default function ProjectSidebarEditor({
    open,
    section,
    project,
    onClose,
    onSave,
}: ProjectSidebarEditorProps) {
    const [saving, setSaving] = useState(false);
    const [storyTab, setStoryTab] = useState<StoryTab>('story');

    const [form, setForm] = useState<EditableProjectPatch>({});
    const visibilityValue = useMemo<SectionVisibility>(() => {
        if (!section || !project) return 'public';
        return project.sectionVisibility?.[section] ?? 'public';
    }, [project, section]);

    useEffect(() => {
        if (!open || !project || !section) return;

        switch (section) {
            case 'overview':
                setForm({
                    name: project.name ?? '',
                    stage: project.stage,
                    type: project.type ?? '',
                    description: project.description ?? '',
                    methodology: project.methodology ?? '',
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
                    coBenefits: [...(project.coBenefits ?? [])],
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
                    sectionVisibility: {
                        ...project.sectionVisibility,
                        location: project.sectionVisibility?.location ?? 'public',
                    },
                });
                break;

            case 'readiness':
                setForm({
                    readiness: [...(project.readiness ?? [])],
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
                    coBenefits: [...(project.coBenefits ?? [])],
                    sectionVisibility: {
                        ...project.sectionVisibility,
                        impact: project.sectionVisibility?.impact ?? 'public',
                    },
                });
                break;

            case 'opportunities':
                setForm({
                    opportunities: [...(project.opportunities ?? [])],
                    sectionVisibility: {
                        ...project.sectionVisibility,
                        opportunities: project.sectionVisibility?.opportunities ?? 'public',
                    },
                });
                break;

            case 'updates':
                setForm({
                    updates: [...(project.updates ?? [])],
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

            case 'team':
                setForm({
                    team: [...(project.team ?? [])],
                    sectionVisibility: {
                        ...project.sectionVisibility,
                        team: project.sectionVisibility?.team ?? 'public',
                    },
                });
                break;

            default:
                setForm({});
        }
    }, [open, project, section]);

    const updateVisibility = (value: SectionVisibility) => {
        if (!section) return;
        setForm((prev) => ({
            ...prev,
            sectionVisibility: {
                ...(project?.sectionVisibility ?? {}),
                ...(prev.sectionVisibility ?? {}),
                [section]: value,
            },
        }));
    };

    const handleSave = async () => {
        if (!section) return;
        setSaving(true);
        try {
            await onSave(form);
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

    const setField = <K extends keyof EditableProjectPatch>(key: K, value: EditableProjectPatch[K]) => {
        setForm((prev) => ({ ...prev, [key]: value }));
    };

    const renderOverview = () => (
        <Stack spacing={3}>
            <TextField
                label="Project name"
                size="small"
                fullWidth
                value={(form.name as string) ?? ''}
                onChange={(e) => setField('name', e.target.value)}
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
                label="Short description"
                size="small"
                multiline
                minRows={4}
                fullWidth
                value={(form.description as string) ?? ''}
                onChange={(e) => setField('description', e.target.value)}
            />

            <TextField
                label="Methodology"
                size="small"
                fullWidth
                value={(form.methodology as string) ?? ''}
                onChange={(e) => setField('methodology', e.target.value)}
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

    const renderStory = () => {
        const coBenefits = (form.coBenefits ?? []) as Array<{ type: string; note?: string | null }>;

        return (
            <Stack spacing={3}>
                <Tabs
                    value={storyTab}
                    onChange={(_, value) => setStoryTab(value)}
                    sx={{ minHeight: 36, '& .MuiTab-root': { minHeight: 36, textTransform: 'none' } }}
                >
                    <Tab value="story" label="Story" />
                    <Tab value="cobenefits" label="Co-benefits" />
                </Tabs>

                {storyTab === 'story' ? (
                    <Stack spacing={3}>
                        <TextField
                            label="Problem and context"
                            size="small"
                            fullWidth
                            multiline
                            minRows={4}
                            value={(form.storyProblem as string) ?? ''}
                            onChange={(e) => setField('storyProblem', e.target.value)}
                        />

                        <TextField
                            label="Project approach"
                            size="small"
                            fullWidth
                            multiline
                            minRows={4}
                            value={(form.storyApproach as string) ?? ''}
                            onChange={(e) => setField('storyApproach', e.target.value)}
                        />
                    </Stack>
                ) : (
                    <Stack spacing={2}>
                        {coBenefits.map((item, index) => (
                            <Paper key={`${item.type}-${index}`} variant="outlined" sx={{ p: 2 }}>
                                <Stack spacing={2}>
                                    <FormControl fullWidth size="small">
                                        <InputLabel>Type</InputLabel>
                                        <Select
                                            value={item.type}
                                            label="Type"
                                            onChange={(e) => {
                                                const next = [...coBenefits];
                                                next[index] = { ...next[index], type: e.target.value };
                                                setField('coBenefits', next);
                                            }}
                                        >
                                            {CO_BENEFIT_OPTIONS.map((option) => (
                                                <MenuItem key={option} value={option}>
                                                    {option}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>

                                    <TextField
                                        label="Description"
                                        size="small"
                                        fullWidth
                                        value={item.note ?? ''}
                                        onChange={(e) => {
                                            const next = [...coBenefits];
                                            next[index] = { ...next[index], note: e.target.value };
                                            setField('coBenefits', next);
                                        }}
                                    />

                                    <Box>
                                        <Button
                                            color="error"
                                            onClick={() => {
                                                const next = coBenefits.filter((_, i) => i !== index);
                                                setField('coBenefits', next);
                                            }}
                                        >
                                            Remove
                                        </Button>
                                    </Box>
                                </Stack>
                            </Paper>
                        ))}

                        <Button
                            variant="outlined"
                            onClick={() =>
                                setField('coBenefits', [...coBenefits, { type: 'Climate', note: '' }])
                            }
                        >
                            Add Co-benefit
                        </Button>
                    </Stack>
                )}

                <VisibilityField value={visibilityValue} onChange={updateVisibility} />
            </Stack>
        );
    };

    const renderLocation = () => (
        <Stack spacing={3}>
            <TextField
                label="Country"
                size="small"
                fullWidth
                value={(form.country as string) ?? ''}
                onChange={(e) => setField('country', e.target.value)}
            />
            <TextField
                label="Region"
                size="small"
                fullWidth
                value={(form.region as string) ?? ''}
                onChange={(e) => setField('region', e.target.value)}
            />
            <VisibilityField value={visibilityValue} onChange={updateVisibility} />
        </Stack>
    );

    const renderReadiness = () => {
        const items = (form.readiness ?? []) as ProjectReadinessItem[];

        return (
            <Stack spacing={2}>
                {items.map((item, index) => (
                    <Paper key={item.id || index} variant="outlined" sx={{ p: 2 }}>
                        <Stack spacing={2}>
                            <TextField
                                label="Readiness item"
                                size="small"
                                fullWidth
                                value={item.label}
                                onChange={(e) => {
                                    const next = [...items];
                                    next[index] = { ...next[index], label: e.target.value };
                                    setField('readiness', next);
                                }}
                            />

                            <FormControl fullWidth size="small">
                                <InputLabel>Status</InputLabel>
                                <Select
                                    value={item.status}
                                    label="Status"
                                    onChange={(e) => {
                                        const next = [...items];
                                        next[index] = {
                                            ...next[index],
                                            status: e.target.value as ProjectReadinessItem['status'],
                                        };
                                        setField('readiness', next);
                                    }}
                                >
                                    {READINESS_STATUS_OPTIONS.map((status) => (
                                        <MenuItem key={status} value={status}>
                                            {status}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            <TextField
                                label="Note"
                                size="small"
                                fullWidth
                                value={item.note ?? ''}
                                onChange={(e) => {
                                    const next = [...items];
                                    next[index] = { ...next[index], note: e.target.value };
                                    setField('readiness', next);
                                }}
                            />

                            <Button
                                color="error"
                                onClick={() => {
                                    const next = items.filter((_, i) => i !== index);
                                    setField('readiness', next);
                                }}
                            >
                                Remove
                            </Button>
                        </Stack>
                    </Paper>
                ))}

                <Button variant="outlined" onClick={() => setField('readiness', [...items, emptyReadiness()])}>
                    Add Readiness Item
                </Button>

                <VisibilityField value={visibilityValue} onChange={updateVisibility} />
            </Stack>
        );
    };

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
        const items = (form.opportunities ?? []) as ProjectOpportunity[];

        return (
            <Stack spacing={2}>
                {items.map((item, index) => (
                    <Paper key={item.id || index} variant="outlined" sx={{ p: 2 }}>
                        <Stack spacing={2}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Opportunity type</InputLabel>
                                <Select
                                    value={item.type}
                                    label="Opportunity type"
                                    onChange={(e) => {
                                        const next = [...items];
                                        next[index] = { ...next[index], type: e.target.value };
                                        setField('opportunities', next);
                                    }}
                                >
                                    {OPPORTUNITY_TYPES.map((option) => (
                                        <MenuItem key={option} value={option}>
                                            {option}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            <TextField
                                label="Description"
                                size="small"
                                fullWidth
                                multiline
                                minRows={3}
                                value={item.description ?? ''}
                                onChange={(e) => {
                                    const next = [...items];
                                    next[index] = { ...next[index], description: e.target.value };
                                    setField('opportunities', next);
                                }}
                            />

                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={Boolean(item.urgent)}
                                        onChange={(e) => {
                                            const next = [...items];
                                            next[index] = { ...next[index], urgent: e.target.checked };
                                            setField('opportunities', next);
                                        }}
                                    />
                                }
                                label="Mark as urgent"
                            />

                            <Button
                                color="error"
                                onClick={() => {
                                    const next = items.filter((_, i) => i !== index);
                                    setField('opportunities', next);
                                }}
                            >
                                Remove
                            </Button>
                        </Stack>
                    </Paper>
                ))}

                <Button variant="outlined" onClick={() => setField('opportunities', [...items, emptyOpportunity()])}>
                    Add Opportunity
                </Button>

                <VisibilityField value={visibilityValue} onChange={updateVisibility} />
            </Stack>
        );
    };

    const renderUpdates = () => {
        const items = (form.updates ?? []) as ProjectUpdate[];

        return (
            <Stack spacing={2}>
                {items.map((item, index) => (
                    <Paper key={item.id || index} variant="outlined" sx={{ p: 2 }}>
                        <Stack spacing={2}>
                            <TextField
                                label="Title"
                                size="small"
                                fullWidth
                                value={item.title}
                                onChange={(e) => {
                                    const next = [...items];
                                    next[index] = { ...next[index], title: e.target.value };
                                    setField('updates', next);
                                }}
                            />
                            <TextField
                                label="Description"
                                size="small"
                                fullWidth
                                multiline
                                minRows={3}
                                value={item.description ?? ''}
                                onChange={(e) => {
                                    const next = [...items];
                                    next[index] = { ...next[index], description: e.target.value };
                                    setField('updates', next);
                                }}
                            />
                            <TextField
                                label="Date label"
                                size="small"
                                fullWidth
                                value={item.dateLabel ?? ''}
                                onChange={(e) => {
                                    const next = [...items];
                                    next[index] = { ...next[index], dateLabel: e.target.value };
                                    setField('updates', next);
                                }}
                            />
                            <TextField
                                label="Author"
                                size="small"
                                fullWidth
                                value={item.authorName ?? ''}
                                onChange={(e) => {
                                    const next = [...items];
                                    next[index] = { ...next[index], authorName: e.target.value };
                                    setField('updates', next);
                                }}
                            />
                            <Button
                                color="error"
                                onClick={() => {
                                    const next = items.filter((_, i) => i !== index);
                                    setField('updates', next);
                                }}
                            >
                                Remove
                            </Button>
                        </Stack>
                    </Paper>
                ))}

                <Button variant="outlined" onClick={() => setField('updates', [...items, emptyUpdate()])}>
                    Add Update
                </Button>

                <VisibilityField value={visibilityValue} onChange={updateVisibility} />
            </Stack>
        );
    };

    const renderDocuments = () => {
        const items = (form.documents ?? []) as ProjectDocument[];

        return (
            <Stack spacing={2}>
                {items.map((item, index) => (
                    <Paper key={item.id || index} variant="outlined" sx={{ p: 2 }}>
                        <Stack spacing={2}>
                            <TextField
                                label="Document name"
                                size="small"
                                fullWidth
                                value={item.name}
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
                            <TextField
                                label="Status"
                                size="small"
                                fullWidth
                                value={item.status ?? ''}
                                onChange={(e) => {
                                    const next = [...items];
                                    next[index] = { ...next[index], status: e.target.value };
                                    setField('documents', next);
                                }}
                            />
                            <TextField
                                label="Date label"
                                size="small"
                                fullWidth
                                value={item.dateLabel ?? ''}
                                onChange={(e) => {
                                    const next = [...items];
                                    next[index] = { ...next[index], dateLabel: e.target.value };
                                    setField('documents', next);
                                }}
                            />
                            <Button
                                color="error"
                                onClick={() => {
                                    const next = items.filter((_, i) => i !== index);
                                    setField('documents', next);
                                }}
                            >
                                Remove
                            </Button>
                        </Stack>
                    </Paper>
                ))}

                <Button variant="outlined" onClick={() => setField('documents', [...items, emptyDocument()])}>
                    Add Document
                </Button>

                <VisibilityField value={visibilityValue} onChange={updateVisibility} />
            </Stack>
        );
    };

    const renderMedia = () => {
        const items = (form.media ?? []) as ProjectMediaItem[];

        return (
            <Stack spacing={3}>
                <Alert severity="info">
                    Keeping this aligned with the current core: media is URL-based for now. File upload can be wired later.
                </Alert>

                <TextField
                    label="Cover image URL"
                    size="small"
                    fullWidth
                    value={(form.coverImageUrl as string) ?? ''}
                    onChange={(e) => setField('coverImageUrl', e.target.value)}
                    InputProps={{
                        startAdornment: <ImageRounded sx={{ mr: 1, color: 'text.secondary' }} />,
                    }}
                />

                {items.map((item, index) => (
                    <Paper key={item.id || index} variant="outlined" sx={{ p: 2 }}>
                        <Stack spacing={2}>
                            <TextField
                                label="Media URL"
                                size="small"
                                fullWidth
                                value={item.url}
                                onChange={(e) => {
                                    const next = [...items];
                                    next[index] = { ...next[index], url: e.target.value };
                                    setField('media', next);
                                }}
                            />
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
                            <TextField
                                label="Date label"
                                size="small"
                                fullWidth
                                value={item.dateLabel ?? ''}
                                onChange={(e) => {
                                    const next = [...items];
                                    next[index] = { ...next[index], dateLabel: e.target.value };
                                    setField('media', next);
                                }}
                            />
                            <Button
                                color="error"
                                onClick={() => {
                                    const next = items.filter((_, i) => i !== index);
                                    setField('media', next);
                                }}
                            >
                                Remove
                            </Button>
                        </Stack>
                    </Paper>
                ))}

                <Button variant="outlined" onClick={() => setField('media', [...items, emptyMedia()])}>
                    Add Media
                </Button>

                <VisibilityField value={visibilityValue} onChange={updateVisibility} />
            </Stack>
        );
    };

    const renderTeam = () => {
        const items = (form.team ?? []) as ProjectTeamMember[];

        return (
            <Stack spacing={2}>
                {items.map((item, index) => (
                    <Paper key={item.id || index} variant="outlined" sx={{ p: 2 }}>
                        <Stack spacing={2}>
                            <TextField
                                label="Name"
                                size="small"
                                fullWidth
                                value={item.name}
                                onChange={(e) => {
                                    const next = [...items];
                                    next[index] = { ...next[index], name: e.target.value };
                                    setField('team', next);
                                }}
                            />
                            <TextField
                                label="Role label"
                                size="small"
                                fullWidth
                                value={item.roleLabel ?? ''}
                                onChange={(e) => {
                                    const next = [...items];
                                    next[index] = { ...next[index], roleLabel: e.target.value };
                                    setField('team', next);
                                }}
                            />
                            <TextField
                                label="Company"
                                size="small"
                                fullWidth
                                value={item.companyName ?? ''}
                                onChange={(e) => {
                                    const next = [...items];
                                    next[index] = { ...next[index], companyName: e.target.value };
                                    setField('team', next);
                                }}
                            />
                            <TextField
                                label="Avatar URL"
                                size="small"
                                fullWidth
                                value={item.avatarUrl ?? ''}
                                onChange={(e) => {
                                    const next = [...items];
                                    next[index] = { ...next[index], avatarUrl: e.target.value };
                                    setField('team', next);
                                }}
                            />
                            <Button
                                color="error"
                                onClick={() => {
                                    const next = items.filter((_, i) => i !== index);
                                    setField('team', next);
                                }}
                            >
                                Remove
                            </Button>
                        </Stack>
                    </Paper>
                ))}

                <Button variant="outlined" onClick={() => setField('team', [...items, emptyTeamMember()])}>
                    Add Team Member
                </Button>

                <VisibilityField value={visibilityValue} onChange={updateVisibility} />
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
            default:
                return (
                    <Alert severity="info">
                        No editor configured for this section yet.
                    </Alert>
                );
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
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        Keep the profile view presentation-first and edit through this sidebar.
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