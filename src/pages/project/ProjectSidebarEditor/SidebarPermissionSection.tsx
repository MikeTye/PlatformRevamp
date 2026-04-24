import React from 'react';
import {
    Alert,
    Avatar,
    Box,
    FormControl,
    IconButton,
    InputAdornment,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    Stack,
    TextField,
    Typography,
} from '@mui/material';
import SearchRounded from '@mui/icons-material/SearchRounded';
import CloseRounded from '@mui/icons-material/CloseRounded';

import type { ProjectRole } from '../projectProfile.types';
import type {
    PlatformCollaboratorOption,
    TeamEditorMember,
} from './projectTeamEditor.shared';
import {
    getEditorMemberDisplayName,
    getEditorMemberSecondary,
} from './projectTeamEditor.shared';

type Props = {
    apiBaseUrl: string;
    value: TeamEditorMember[];
    onChange: (next: TeamEditorMember[]) => void;
};

export default function SidebarPermissionSection({
    apiBaseUrl,
    value,
    onChange,
}: Props) {
    const [teamSearch, setTeamSearch] = React.useState('');
    const [optionsLoading, setOptionsLoading] = React.useState(false);
    const [collaboratorOptions, setCollaboratorOptions] = React.useState<PlatformCollaboratorOption[]>([]);

    const items = React.useMemo(
        () =>
            value.filter(
                (
                    item
                ): item is Extract<TeamEditorMember, { memberType: 'user' }> =>
                    item.memberType === 'user' && item.isPlatformMember
            ),
        [value]
    );

    const selectedKeys = React.useMemo(
        () => new Set(items.map((item) => item.userId ?? item.memberId)),
        [items]
    );

    const searchResults = React.useMemo(
        () => collaboratorOptions.filter((entry) => !selectedKeys.has(entry.id)),
        [collaboratorOptions, selectedKeys]
    );

    const loadUserOptions = React.useCallback(
        async (q: string) => {
            try {
                setOptionsLoading(true);

                const response = await fetch(`${apiBaseUrl}/users/options?q=${encodeURIComponent(q)}`, {
                    method: 'GET',
                    credentials: 'include',
                    headers: { Accept: 'application/json' },
                });

                const payload = await response.json().catch(() => null);

                if (!response.ok) {
                    throw new Error(payload?.error || `Failed to load users (${response.status})`);
                }

                const rows = Array.isArray(payload?.items)
                    ? payload.items
                    : Array.isArray(payload?.data)
                        ? payload.data
                        : [];

                const mapped: PlatformCollaboratorOption[] = rows.map((item: any) => ({
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
        const q = teamSearch.trim();
        if (!q) {
            setCollaboratorOptions([]);
            return;
        }

        const timeout = window.setTimeout(() => {
            void loadUserOptions(q);
        }, 250);

        return () => window.clearTimeout(timeout);
    }, [teamSearch, loadUserOptions]);

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

        onChange([...items, nextMember]);
        setTeamSearch('');
        setCollaboratorOptions([]);
    };

    const updatePermission = (index: number, permission: ProjectRole | null) => {
        const next: Extract<TeamEditorMember, { memberType: 'user' }>[] = items.map((item, i) =>
            i === index ? { ...item, permission } : item
        );
        onChange(next);
    };

    const removeMember = (index: number) => {
        onChange(items.filter((_, i) => i !== index));
    };

    return (
        <Stack spacing={3}>
            <Box>
                <Typography
                    variant="caption"
                    fontWeight={600}
                    color="text.secondary"
                    sx={{ textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', mb: 0.5 }}
                >
                    Permissions
                </Typography>

                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
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
                                    sx={{ border: '1px solid', borderColor: 'grey.100', bgcolor: 'white' }}
                                >
                                    <Avatar
                                        src={member.avatarUrl ?? undefined}
                                        sx={{ width: 32, height: 32, bgcolor: 'grey.200', fontSize: '0.7rem', fontWeight: 600, flexShrink: 0 }}
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
                                            sx={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                                        >
                                            {getEditorMemberSecondary(member)}
                                        </Typography>
                                    </Box>

                                    <FormControl size="small" sx={{ minWidth: 110, flexShrink: 0 }}>
                                        <InputLabel>Access</InputLabel>
                                        <Select
                                            label="Access"
                                            value={isCreator ? 'creator' : (member.permission ?? 'viewer')}
                                            disabled={isCreator}
                                            onChange={(e) => updatePermission(index, e.target.value as ProjectRole)}
                                            sx={{ fontSize: '0.75rem', height: 36 }}
                                        >
                                            <MenuItem value="viewer">Viewer</MenuItem>
                                            <MenuItem value="creator">Owner</MenuItem>
                                        </Select>
                                    </FormControl>

                                    {!isCreator && (
                                        <IconButton size="small" sx={{ color: 'grey.400', flexShrink: 0 }} onClick={() => removeMember(index)}>
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
                    sx={{ textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', mb: 2.5 }}
                >
                    Add Member
                </Typography>

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
                                    <SearchRounded sx={{ fontSize: 16, color: 'grey.400' }} />
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
                        <Paper variant="outlined" sx={{ mt: 1, borderRadius: 1.5, overflow: 'hidden' }}>
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
                                            borderBottom: index === searchResults.length - 1 ? 'none' : '1px solid',
                                            borderColor: 'grey.100',
                                            '&:hover': { bgcolor: 'grey.50' },
                                        }}
                                    >
                                        <Avatar
                                            src={result.avatarUrl ?? undefined}
                                            sx={{ width: 32, height: 32, bgcolor: 'grey.200', color: 'text.primary' }}
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
            </Box>
        </Stack>
    );
}