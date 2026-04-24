import React from 'react';
import {
    Avatar,
    Box,
    Button,
    FormControl,
    IconButton,
    InputAdornment,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    Stack,
    TextField,
    ToggleButton,
    ToggleButtonGroup,
    Typography,
    Divider,
} from '@mui/material';
import SearchRounded from '@mui/icons-material/SearchRounded';
import CloseRounded from '@mui/icons-material/CloseRounded';
import BusinessRounded from '@mui/icons-material/BusinessRounded';

import type {
    PlatformCollaboratorOption,
    TeamEditorMember,
} from './projectTeamEditor.shared';
import {
    dedupeTeamMembers,
    getEditorMemberDisplayName,
    getEditorMemberSecondary,
} from './projectTeamEditor.shared';

type Props = {
    apiBaseUrl: string;
    value: TeamEditorMember[];
    onChange: (next: TeamEditorMember[]) => void;
};

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

function getStableMemberKey(member: TeamEditorMember): string {
    if (member.isPlatformMember) {
        return member.memberType === 'company'
            ? `company:${member.companyId ?? member.memberId ?? member.id}`
            : `user:${member.userId ?? member.memberId ?? member.id}`;
    }

    return `manual:${member.memberType}:${member.manualName ?? member.name}:${member.manualOrganization ?? member.companyName ?? ''}:${member.role ?? ''}`;
}

export default function SidebarTeamSection({
    apiBaseUrl,
    value,
    onChange,
}: Props) {
    const [teamRole, setTeamRole] = React.useState<'user' | 'company'>('user');
    const [teamSearch, setTeamSearch] = React.useState('');
    const [teamManualMode, setTeamManualMode] = React.useState(false);
    const [teamName, setTeamName] = React.useState('');
    const [teamOrganization, setTeamOrganization] = React.useState('');
    const [teamProjectRole, setTeamProjectRole] = React.useState('');
    const [optionsLoading, setOptionsLoading] = React.useState(false);
    const [collaboratorOptions, setCollaboratorOptions] = React.useState<PlatformCollaboratorOption[]>([]);

    const initialMembersRef = React.useRef<TeamEditorMember[] | null>(null);

    React.useEffect(() => {
        if (initialMembersRef.current === null) {
            initialMembersRef.current = value;
        }
    }, [value]);

    const items = React.useMemo(() => value ?? [], [value]);

    const initialKeys = React.useMemo(
        () => new Set((initialMembersRef.current ?? []).map(getStableMemberKey)),
        []
    );

    const existingMembers = React.useMemo(
        () => items.filter((member) => initialKeys.has(getStableMemberKey(member))),
        [items, initialKeys]
    );

    const pendingMembers = React.useMemo(
        () => items.filter((member) => !initialKeys.has(getStableMemberKey(member))),
        [items, initialKeys]
    );

    const loadCollaboratorOptions = React.useCallback(
        async (q: string, mode: 'user' | 'company') => {
            try {
                setOptionsLoading(true);

                const endpoint =
                    mode === 'company'
                        ? `${apiBaseUrl}/companies/options?q=${encodeURIComponent(q)}`
                        : `${apiBaseUrl}/users/options?q=${encodeURIComponent(q)}`;

                const response = await fetch(endpoint, {
                    method: 'GET',
                    credentials: 'include',
                    headers: { Accept: 'application/json' },
                });

                const payload = await response.json().catch(() => null);

                if (!response.ok) {
                    throw new Error(payload?.error || `Failed to load ${mode}s (${response.status})`);
                }

                const rows = Array.isArray(payload?.items)
                    ? payload.items
                    : Array.isArray(payload?.data)
                        ? payload.data
                        : [];

                const mapped: PlatformCollaboratorOption[] =
                    mode === 'company'
                        ? rows.map((item: any) => ({
                            id: String(item.id),
                            entityType: 'company',
                            name: String(item.displayName ?? item.name ?? ''),
                            companyName: String(item.displayName ?? item.name ?? ''),
                            avatarUrl: item.logoUrl ?? item.avatarUrl ?? null,
                            subtitle: item.primaryCountry ?? item.businessFunction ?? 'Company',
                        }))
                        : rows.map((item: any) => ({
                            id: String(item.id),
                            entityType: 'user',
                            name: String(item.name ?? ''),
                            email: item.email ?? undefined,
                            companyName: item.companyName ?? undefined,
                            avatarUrl: item.avatarUrl ?? null,
                            subtitle: item.email ?? item.companyName ?? 'User',
                        }));

                setCollaboratorOptions(mapped);
            } catch {
                setCollaboratorOptions([]);
            } finally {
                setOptionsLoading(false);
            }
        },
        [apiBaseUrl]
    );

    React.useEffect(() => {
        if (teamManualMode) {
            setCollaboratorOptions([]);
            return;
        }

        const q = teamSearch.trim();
        if (!q) {
            setCollaboratorOptions([]);
            return;
        }

        const timeout = window.setTimeout(() => {
            void loadCollaboratorOptions(q, teamRole);
        }, 250);

        return () => window.clearTimeout(timeout);
    }, [teamSearch, teamRole, teamManualMode, loadCollaboratorOptions]);

    const resetInputs = React.useCallback(() => {
        setTeamSearch('');
        setTeamName('');
        setTeamOrganization('');
        setCollaboratorOptions([]);
    }, []);

    const getInitials = React.useCallback((name: string) => {
        return name
            .trim()
            .split(/\s+/)
            .map((part) => part[0])
            .join('')
            .slice(0, 2)
            .toUpperCase();
    }, []);

    const addPlatformMember = React.useCallback((selected: PlatformCollaboratorOption) => {
        const nextMember: TeamEditorMember =
            teamRole === 'company'
                ? {
                    id: crypto.randomUUID(),
                    memberType: 'company',
                    memberId: selected.id,
                    companyId: selected.id,
                    userId: null,
                    name: selected.name,
                    role: teamProjectRole || null,
                    companyName: selected.companyName ?? selected.name,
                    avatarUrl: selected.avatarUrl ?? null,
                    permission: null,
                    isPlatformMember: true,
                    manualName: null,
                    manualOrganization: null,
                }
                : {
                    id: crypto.randomUUID(),
                    memberType: 'user',
                    memberId: selected.id,
                    userId: selected.id,
                    companyId: null,
                    name: selected.name,
                    role: teamProjectRole || null,
                    companyName: selected.companyName ?? '',
                    avatarUrl: selected.avatarUrl ?? null,
                    permission: null,
                    isPlatformMember: true,
                    manualName: null,
                    manualOrganization: null,
                };

        onChange(dedupeTeamMembers([...items, nextMember]));
        resetInputs();
    }, [items, onChange, resetInputs, teamProjectRole, teamRole]);

    const addManualMember = () => {
        const trimmedName = teamName.trim();
        const trimmedOrg = teamOrganization.trim();

        if (teamRole === 'company' && !trimmedOrg && !trimmedName) return;
        if (teamRole === 'user' && !trimmedName) return;

        const nextMember: TeamEditorMember =
            teamRole === 'company'
                ? {
                    id: crypto.randomUUID(),
                    memberType: 'company',
                    memberId: null,
                    companyId: null,
                    userId: null,
                    name: trimmedOrg || trimmedName,
                    role: teamProjectRole || null,
                    companyName: trimmedOrg || trimmedName,
                    avatarUrl: null,
                    permission: null,
                    isPlatformMember: false,
                    manualName: trimmedName || null,
                    manualOrganization: trimmedOrg || trimmedName || null,
                }
                : {
                    id: crypto.randomUUID(),
                    memberType: 'user',
                    memberId: null,
                    userId: null,
                    companyId: null,
                    name: trimmedName,
                    role: teamProjectRole || null,
                    companyName: trimmedOrg || '',
                    avatarUrl: null,
                    permission: null,
                    isPlatformMember: false,
                    manualName: trimmedName || null,
                    manualOrganization: trimmedOrg || null,
                };

        onChange(dedupeTeamMembers([...items, nextMember]));
        resetInputs();
        setTeamManualMode(false);
    };

    const removeMember = (memberId: string) => {
        onChange(items.filter((member) => member.id !== memberId));
    };

    const updateMemberRole = (memberId: string, nextRole: string) => {
        onChange(
            items.map((member) =>
                member.id === memberId
                    ? {
                        ...member,
                        role: nextRole || null,
                    }
                    : member
            )
        );
    };

    const renderMemberCard = (
        member: TeamEditorMember,
        opts?: {
            muted?: boolean;
        }
    ) => (
        <Paper
            key={member.id}
            variant="outlined"
            sx={{
                p: 1.25,
                borderRadius: 1.5,
                borderColor: 'grey.200',
                ...(opts?.muted ? { bgcolor: 'grey.50' } : null),
            }}
        >
            <Stack spacing={1.25}>
                <Box display="flex" alignItems="center" gap={1.25}>
                    <Avatar
                        src={member.avatarUrl ?? undefined}
                        sx={{
                            width: 32,
                            height: 32,
                            borderRadius: member.memberType === 'company' ? 1 : '50%',
                            flexShrink: 0,
                        }}
                    >
                        {member.memberType === 'company' ? (
                            <BusinessRounded sx={{ fontSize: 18 }} />
                        ) : (
                            getInitials(getEditorMemberDisplayName(member))
                        )}
                    </Avatar>

                    <Box flex={1} minWidth={0}>
                        <Typography variant="body2" fontWeight={600} noWrap>
                            {getEditorMemberDisplayName(member)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" noWrap>
                            {getEditorMemberSecondary(member)}
                        </Typography>
                    </Box>

                    <IconButton
                        size="small"
                        onClick={() => removeMember(member.id)}
                        aria-label={`Remove ${getEditorMemberDisplayName(member)}`}
                    >
                        <CloseRounded sx={{ fontSize: 16 }} />
                    </IconButton>
                </Box>

                <FormControl size="small" fullWidth>
                    <InputLabel>Project Role</InputLabel>
                    <Select
                        label="Project Role"
                        value={member.role ?? ''}
                        onChange={(e) => updateMemberRole(member.id, e.target.value)}
                    >
                        <MenuItem value="">
                            <em>No role</em>
                        </MenuItem>
                        {TEAM_PROJECT_ROLE_OPTIONS.map((option) => (
                            <MenuItem key={option} value={option}>
                                {option}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Stack>
        </Paper>
    );

    return (
        <Stack spacing={3}>
            <Box>
                <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                    Add Project Partner
                </Typography>

                <Typography variant="body2" color="text.secondary">
                    Add new partners here. Existing partners can also have their project role updated below before you save.
                </Typography>
            </Box>

            <ToggleButtonGroup
                value={teamRole}
                exclusive
                fullWidth
                size="small"
                onChange={(_, nextValue) => {
                    if (!nextValue) return;
                    setTeamRole(nextValue);
                    setTeamManualMode(false);
                    setTeamSearch('');
                    setTeamName('');
                    setTeamOrganization('');
                    setCollaboratorOptions([]);
                }}
                sx={{
                    '& .MuiToggleButton-root': {
                        flex: 1,
                        textTransform: 'none',
                    },
                }}
            >
                <ToggleButton value="company">Company</ToggleButton>
                <ToggleButton value="user">Individual</ToggleButton>
            </ToggleButtonGroup>

            <FormControl size="small" fullWidth>
                <InputLabel>Project Role</InputLabel>
                <Select
                    label="Project Role"
                    value={teamProjectRole}
                    onChange={(e) => setTeamProjectRole(e.target.value)}
                >
                    <MenuItem value="">
                        <em>No role</em>
                    </MenuItem>
                    {TEAM_PROJECT_ROLE_OPTIONS.map((option) => (
                        <MenuItem key={option} value={option}>
                            {option}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>

            {!teamManualMode ? (
                <Stack spacing={2}>
                    <TextField
                        size="small"
                        fullWidth
                        label={teamRole === 'company' ? 'Search company' : 'Search individual'}
                        value={teamSearch}
                        onChange={(e) => setTeamSearch(e.target.value)}
                        placeholder={teamRole === 'company' ? 'Search companies' : 'Search users'}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchRounded fontSize="small" />
                                </InputAdornment>
                            ),
                        }}
                    />

                    {teamSearch.trim() ? (
                        <Paper
                            variant="outlined"
                            sx={{
                                borderRadius: 1.5,
                                borderColor: 'grey.200',
                                overflow: 'hidden',
                            }}
                        >
                            {optionsLoading ? (
                                <Box px={1.5} py={1.25}>
                                    <Typography variant="body2" color="text.secondary">
                                        Searching...
                                    </Typography>
                                </Box>
                            ) : collaboratorOptions.length > 0 ? (
                                collaboratorOptions.map((option) => (
                                    <Box
                                        key={`${option.entityType}:${option.id}`}
                                        component="button"
                                        type="button"
                                        onClick={() => addPlatformMember(option)}
                                        sx={{
                                            width: '100%',
                                            border: 0,
                                            background: 'transparent',
                                            cursor: 'pointer',
                                            textAlign: 'left',
                                            px: 1.5,
                                            py: 1.25,
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 1.25,
                                            borderBottom: '1px solid',
                                            borderColor: 'grey.100',
                                            '&:last-of-type': {
                                                borderBottom: 'none',
                                            },
                                            '&:hover': {
                                                backgroundColor: 'grey.50',
                                            },
                                        }}
                                    >
                                        <Avatar
                                            src={option.avatarUrl ?? undefined}
                                            sx={{
                                                width: 34,
                                                height: 34,
                                                borderRadius: option.entityType === 'company' ? 1 : '50%',
                                            }}
                                        >
                                            {option.entityType === 'company' ? (
                                                <BusinessRounded sx={{ fontSize: 18 }} />
                                            ) : (
                                                getInitials(option.name)
                                            )}
                                        </Avatar>

                                        <Box minWidth={0} flex={1}>
                                            <Typography variant="body2" fontWeight={600} noWrap>
                                                {option.name}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary" noWrap>
                                                {option.subtitle ?? (option.entityType === 'company' ? 'Company' : 'User')}
                                            </Typography>
                                        </Box>
                                    </Box>
                                ))
                            ) : (
                                <Box px={1.5} py={1.25}>
                                    <Typography variant="body2" color="text.secondary">
                                        No results found.
                                    </Typography>
                                </Box>
                            )}
                        </Paper>
                    ) : null}

                    <Button
                        size="small"
                        onClick={() => {
                            setTeamManualMode(true);
                            setTeamSearch('');
                            setCollaboratorOptions([]);
                        }}
                        sx={{
                            textTransform: 'none',
                            color: 'text.secondary',
                            alignSelf: 'flex-start',
                            fontSize: '0.75rem',
                        }}
                    >
                        + Add manually (not on platform)
                    </Button>
                </Stack>
            ) : (
                <Stack spacing={2}>
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                        <Typography
                            variant="caption"
                            color="text.secondary"
                            fontWeight={600}
                            sx={{ textTransform: 'uppercase', letterSpacing: 0.4 }}
                        >
                            Manual entry
                        </Typography>

                        <Button
                            size="small"
                            onClick={() => {
                                setTeamManualMode(false);
                                setTeamName('');
                                setTeamOrganization('');
                            }}
                            sx={{
                                textTransform: 'none',
                                fontSize: '0.7rem',
                            }}
                        >
                            Search instead
                        </Button>
                    </Box>

                    <TextField
                        size="small"
                        fullWidth
                        label={teamRole === 'company' ? 'Company Name' : 'Full Name'}
                        value={teamName}
                        onChange={(e) => setTeamName(e.target.value)}
                        placeholder={teamRole === 'company' ? 'e.g. Pachama' : 'e.g. Jane Smith'}
                    />

                    <TextField
                        size="small"
                        fullWidth
                        label={teamRole === 'company' ? 'Display / Organization Name' : 'Organization'}
                        value={teamOrganization}
                        onChange={(e) => setTeamOrganization(e.target.value)}
                        placeholder={teamRole === 'company' ? 'Optional display name' : 'Optional organization'}
                    />

                    <Button
                        variant="contained"
                        onClick={addManualMember}
                        disabled={teamRole === 'user' ? !teamName.trim() : !(teamName.trim() || teamOrganization.trim())}
                        sx={{ textTransform: 'none', alignSelf: 'flex-start' }}
                    >
                        Add
                    </Button>
                </Stack>
            )}

            {existingMembers.length > 0 ? (
                <Stack spacing={1.25}>
                    <Typography variant="subtitle2" fontWeight={700}>
                        Existing project partners
                    </Typography>

                    {existingMembers.map((member) =>
                        renderMemberCard(member, { muted: true })
                    )}
                </Stack>
            ) : null}

            {pendingMembers.length > 0 ? (
                <>
                    <Divider />
                    <Stack spacing={1.25}>
                        <Typography variant="subtitle2" fontWeight={700}>
                            Added in this edit session
                        </Typography>

                        {pendingMembers.map((member) => renderMemberCard(member))}
                    </Stack>
                </>
            ) : null}
        </Stack>
    );
}