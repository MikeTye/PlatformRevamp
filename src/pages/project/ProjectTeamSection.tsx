import React from 'react';
import {
    Box,
    IconButton,
    Paper,
    Stack,
    Typography,
} from '@mui/material';
import BusinessRounded from '@mui/icons-material/BusinessRounded';
import PeopleRounded from '@mui/icons-material/PeopleRounded';
import MoreVertRounded from '@mui/icons-material/MoreVertRounded';
import { Link as RouterLink } from 'react-router-dom';

import { ProjectSectionCard } from './ProjectSectionCard';
import type {
    ProjectEditorTarget,
    ProjectProfileData,
    ProjectSectionKey,
    ProjectTeamMember,
    SectionVisibility,
} from './projectProfile.types';

function getTeamMemberDisplayName(member: ProjectTeamMember): string {
    if (member.isPlatformMember === false) {
        if (member.memberType === 'company') {
            return (
                member.manualOrganization?.trim() ||
                member.companyName?.trim() ||
                member.manualName?.trim() ||
                member.name?.trim() ||
                'External company'
            );
        }

        return (
            member.manualName?.trim() ||
            member.name?.trim() ||
            member.manualOrganization?.trim() ||
            'External collaborator'
        );
    }

    if (member.memberType === 'company') {
        return member.companyName?.trim() || member.name?.trim() || 'Company';
    }

    return member.name?.trim() || member.manualName?.trim() || 'User';
}

function getTeamMemberSubtitle(member: ProjectTeamMember): string {
    const roleLabel = member.role?.trim();
    const permissionLabel =
        member.memberType === 'user' && member.permission === 'viewer'
            ? 'Viewer'
            : null;

    if (member.isPlatformMember === false) {
        if (member.memberType === 'company') {
            return roleLabel || 'External company';
        }

        const org = member.manualOrganization?.trim() || member.companyName?.trim();
        const left = roleLabel || permissionLabel || 'External collaborator';
        return org ? `${left} · ${org}` : left;
    }

    if (member.memberType === 'company') {
        return roleLabel || 'Company Collaborator';
    }

    if (roleLabel && permissionLabel) {
        return `${roleLabel} · ${permissionLabel}`;
    }

    if (roleLabel) return roleLabel;
    if (permissionLabel) return permissionLabel;

    return 'Team Member';
}

function getMemberHref(member: ProjectTeamMember): string | null {
    if (member.isPlatformMember === false) return null;

    if (member.memberType === 'company' && (member.companyId ?? member.memberId)) {
        return `/companies/${member.companyId ?? member.memberId}`;
    }

    if (member.memberType === 'user' && (member.userId ?? member.memberId)) {
        return `/users/${member.userId ?? member.memberId}`;
    }

    return null;
}

type ProjectTeamSectionProps = {
    project: ProjectProfileData;
    canEdit: boolean;
    visibility: SectionVisibility;
    onVisibilityChange?: (value: SectionVisibility) => void;
    onOpenEditor?: (section: ProjectEditorTarget) => void;
    onTeamMenuClick?: (
        event: React.MouseEvent<HTMLElement>,
        member: ProjectTeamMember
    ) => void;
};
export default function ProjectTeamSection({
    project,
    canEdit,
    visibility,
    onVisibilityChange,
    onOpenEditor,
    onTeamMenuClick,
}: ProjectTeamSectionProps) {
    const developerName = project.companyName?.trim();

    const visibleTeam = React.useMemo(
        () => (project.team || []).filter((member) => member.permission !== 'creator'),
        [project.team]
    );

    const hasDeveloper = Boolean(developerName);
    const hasTeam = visibleTeam.length > 0;
    const hasPeople = hasDeveloper || hasTeam;

    const developerHref = project.companyId ? `/companies/${project.companyId}` : null;

    const sectionLabelSx = {
        display: 'block',
        mb: 1,
        color: 'text.disabled',
        fontSize: '0.75rem',
        fontWeight: 500,
    } as const;

    const rowContainerSx = {
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        mx: -1,
        px: 1,
        py: 0.75,
        borderRadius: 1,
        minWidth: 0,
        '&:hover': {
            bgcolor: 'grey.50',
        },
    } as const;

    const rowContentSx = {
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        minWidth: 0,
        flex: 1,
        textDecoration: 'none',
        color: 'inherit',
    } as const;

    const clickableRowContentSx = {
        ...rowContentSx,
        cursor: 'pointer',
    } as const;

    const iconBoxSx = {
        width: 32,
        height: 32,
        borderRadius: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        border: '1px solid',
        borderColor: 'grey.200',
        bgcolor: 'grey.50',
    } as const;

    return (
        <ProjectSectionCard
            title="Project Partners"
            addable={canEdit}
            isOwner={canEdit}
            visibility={visibility}
            onVisibilityChange={canEdit ? onVisibilityChange : undefined}
            empty={!hasPeople}
            emptyText="No project partners added yet"
            emptyActionLabel={canEdit ? 'Add Project Partner' : undefined}
            onEmptyAction={canEdit ? () => onOpenEditor?.('team') : undefined}
            onAdd={canEdit ? () => onOpenEditor?.('team') : undefined}
        >
            <Stack spacing={2}>
                {hasDeveloper ? (
                    <Box>
                        <Typography sx={sectionLabelSx}>Developer</Typography>

                        <Paper variant="outlined" sx={{ p: 0.5, borderRadius: 2 }}>
                            {developerHref ? (
                                <Box component={RouterLink} to={developerHref} sx={clickableRowContentSx}>
                                    <Box
                                        sx={{
                                            ...iconBoxSx,
                                            bgcolor: 'grey.100',
                                            borderColor: 'transparent',
                                        }}
                                    >
                                        <BusinessRounded sx={{ fontSize: 16, color: 'grey.400' }} />
                                    </Box>

                                    <Box minWidth={0} flex={1}>
                                        <Typography variant="body2" fontWeight={500} color="text.primary">
                                            {developerName}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            Lead Developer
                                        </Typography>
                                    </Box>
                                </Box>
                            ) : (
                                <Box sx={rowContentSx}>
                                    <Box
                                        sx={{
                                            ...iconBoxSx,
                                            bgcolor: 'grey.100',
                                            borderColor: 'transparent',
                                        }}
                                    >
                                        <BusinessRounded sx={{ fontSize: 16, color: 'grey.400' }} />
                                    </Box>

                                    <Box minWidth={0} flex={1}>
                                        <Typography variant="body2" fontWeight={500} color="text.primary">
                                            {developerName}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            Lead Developer
                                        </Typography>
                                    </Box>
                                </Box>
                            )}
                        </Paper>
                    </Box>
                ) : null}

                {hasTeam ? (
                    <Box>
                        <Typography sx={sectionLabelSx}>Service Providers</Typography>

                        <Paper variant="outlined" sx={{ p: 0.5, borderRadius: 2 }}>
                            <Stack spacing={0.5}>
                                {visibleTeam.map((member) => {
                                    const href = getMemberHref(member);
                                    const content = (
                                        <>
                                            <Box
                                                sx={{
                                                    ...iconBoxSx,
                                                    borderRadius: member.memberType === 'user' ? '50%' : 1,
                                                }}
                                            >
                                                {member.memberType === 'company' ? (
                                                    <BusinessRounded sx={{ fontSize: 16, color: 'grey.400' }} />
                                                ) : (
                                                    <PeopleRounded sx={{ fontSize: 16, color: 'grey.400' }} />
                                                )}
                                            </Box>

                                            <Box minWidth={0} flex={1}>
                                                <Typography
                                                    variant="caption"
                                                    fontWeight={500}
                                                    color="text.primary"
                                                    display="block"
                                                    noWrap
                                                >
                                                    {getTeamMemberDisplayName(member)}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {getTeamMemberSubtitle(member)}
                                                </Typography>
                                            </Box>
                                        </>
                                    );

                                    return (
                                        <Box key={member.id} sx={rowContainerSx}>
                                            {href ? (
                                                <Box component={RouterLink} to={href} sx={clickableRowContentSx}>
                                                    {content}
                                                </Box>
                                            ) : (
                                                <Box sx={rowContentSx}>{content}</Box>
                                            )}

                                            {canEdit ? (
                                                <IconButton
                                                    size="small"
                                                    aria-label={`Open actions for ${getTeamMemberDisplayName(member)}`}
                                                    onClick={(event) => {
                                                        event.preventDefault();
                                                        event.stopPropagation();
                                                        onTeamMenuClick?.(event, member);
                                                    }}
                                                    sx={{
                                                        color: 'grey.500',
                                                        width: 28,
                                                        height: 28,
                                                        flexShrink: 0,
                                                        '&:hover': {
                                                            bgcolor: 'grey.100',
                                                            color: 'text.primary',
                                                        },
                                                    }}
                                                >
                                                    <MoreVertRounded sx={{ fontSize: 16 }} />
                                                </IconButton>
                                            ) : null}
                                        </Box>
                                    );
                                })}
                            </Stack>
                        </Paper>
                    </Box>
                ) : null}
            </Stack>
        </ProjectSectionCard>
    );
}