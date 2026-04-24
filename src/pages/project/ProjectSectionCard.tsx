import React from 'react';
import {
    Box,
    Button,
    Chip,
    IconButton,
    Menu,
    MenuItem,
    ListItemIcon,
    ListItemText,
    Paper,
    Tooltip,
    Typography,
} from '@mui/material';
import AddRounded from '@mui/icons-material/AddRounded';
import EditRounded from '@mui/icons-material/EditRounded';
import LockRounded from '@mui/icons-material/LockRounded';
import PublicRounded from '@mui/icons-material/PublicRounded';

import type { SectionVisibility } from './projectProfile.types';

export interface ProjectSectionCardProps {
    title: string;
    subtitle?: string;
    children: React.ReactNode;
    editable?: boolean;
    addable?: boolean;
    onEdit?: () => void;
    onAdd?: () => void;
    empty?: boolean;
    emptyText?: string;
    emptyActionLabel?: string;
    onEmptyAction?: () => void;
    isOwner?: boolean;
    visibility?: SectionVisibility;
    onVisibilityChange?: (v: SectionVisibility) => void;
}

export function ProjectSectionCard(props: ProjectSectionCardProps) {
    const {
        title,
        subtitle,
        children,
        editable,
        addable,
        onEdit,
        onAdd,
        empty,
        emptyText,
        emptyActionLabel,
        onEmptyAction,
        isOwner = false,
        visibility = 'public',
        onVisibilityChange,
    } = props;

    const [visMenuAnchor, setVisMenuAnchor] = React.useState<null | HTMLElement>(null);
    const isPrivate = visibility === 'private';

    const visibilityMeta: Record<
        SectionVisibility,
        {
            icon: React.ReactNode;
            label: string;
            desc: string;
            iconColor?: string;
        }
    > = {
        public: {
            icon: <PublicRounded sx={{ fontSize: 16 }} />,
            label: 'Public',
            desc: 'Anyone can view',
        },
        private: {
            icon: <LockRounded sx={{ fontSize: 16 }} />,
            label: 'Private',
            desc: 'Only users with project permission can view',
            iconColor: '#ed6c02',
        },
    };

    const currentMeta = visibilityMeta[visibility];

    return (
        <Paper
            variant="outlined"
            sx={{
                borderRadius: 2,
                overflow: 'hidden',
                width: '100%',
                mb: 0,
                opacity: isPrivate ? 0.78 : 1,
                borderColor: isPrivate ? '#ffcc80' : undefined,
            }}
        >
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    p: 2,
                    borderBottom: 1,
                    borderColor: 'grey.100',
                    bgcolor: isPrivate ? '#fff8e1' : 'grey.50',
                    gap: 1,
                }}
            >
                <Box minWidth={0} display="flex" alignItems="center" gap={1} flexWrap="wrap">
                    <Typography variant="subtitle2" fontWeight="bold" color="text.primary">
                        {title}
                    </Typography>

                    {isPrivate && isOwner ? (
                        <Chip
                            icon={<LockRounded sx={{ fontSize: 14 }} />}
                            label="Private"
                            size="small"
                            sx={{
                                height: 22,
                                fontSize: '0.625rem',
                                bgcolor: '#fff3e0',
                                color: '#ed6c02',
                                border: 1,
                                borderColor: '#ffcc80',
                                fontWeight: 600,
                                '& .MuiChip-icon': {
                                    color: '#ed6c02',
                                },
                            }}
                        />
                    ) : null}

                    {subtitle ? (
                        <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ display: 'block', ml: { xs: 0, sm: 0.5 } }}
                        >
                            {subtitle}
                        </Typography>
                    ) : null}
                </Box>

                <Box display="flex" alignItems="center" gap={1} flexShrink={0}>
                    {isOwner && onVisibilityChange ? (
                        <>
                            <Tooltip title={`${currentMeta.label}: ${currentMeta.desc}`} arrow placement="top">
                                <IconButton
                                    size="small"
                                    onClick={(e) => setVisMenuAnchor(e.currentTarget)}
                                    sx={{
                                        color: currentMeta.iconColor || 'grey.500',
                                        p: 0.5,
                                        '&:hover': {
                                            color: currentMeta.iconColor || 'grey.700',
                                            bgcolor: 'grey.100',
                                        },
                                    }}
                                >
                                    {currentMeta.icon}
                                </IconButton>
                            </Tooltip>

                            <Menu
                                anchorEl={visMenuAnchor}
                                open={Boolean(visMenuAnchor)}
                                onClose={() => setVisMenuAnchor(null)}
                                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                                PaperProps={{
                                    sx: {
                                        minWidth: 220,
                                        boxShadow: 3,
                                        borderRadius: 1.5,
                                    },
                                }}
                            >
                                <Box px={1.5} pt={1} pb={0.5}>
                                    <Typography
                                        variant="caption"
                                        color="text.secondary"
                                        fontWeight={600}
                                        sx={{
                                            textTransform: 'uppercase',
                                            letterSpacing: 0.5,
                                            fontSize: '0.6rem',
                                        }}
                                    >
                                        Section visibility
                                    </Typography>
                                </Box>

                                {(['public', 'private'] as SectionVisibility[]).map((option) => {
                                    const meta = visibilityMeta[option];

                                    return (
                                        <MenuItem
                                            key={option}
                                            selected={visibility === option}
                                            onClick={() => {
                                                onVisibilityChange(option);
                                                setVisMenuAnchor(null);
                                            }}
                                            sx={{ py: 0.75 }}
                                        >
                                            <ListItemIcon
                                                sx={{
                                                    minWidth: 28,
                                                    color: meta.iconColor || 'grey.600',
                                                }}
                                            >
                                                {meta.icon}
                                            </ListItemIcon>

                                            <ListItemText
                                                primary={
                                                    <Typography
                                                        variant="body2"
                                                        fontWeight={visibility === option ? 600 : 400}
                                                    >
                                                        {meta.label}
                                                    </Typography>
                                                }
                                                secondary={
                                                    <Typography
                                                        variant="caption"
                                                        color="text.secondary"
                                                        sx={{ fontSize: '0.65rem' }}
                                                    >
                                                        {meta.desc}
                                                    </Typography>
                                                }
                                            />
                                        </MenuItem>
                                    );
                                })}
                            </Menu>
                        </>
                    ) : null}

                    {addable ? (
                        <IconButton
                            size="small"
                            onClick={onAdd}
                            sx={{
                                color: 'grey.700',
                                bgcolor: 'white',
                                border: 1,
                                borderColor: 'grey.300',
                                width: 32,
                                height: 32,
                                '&:hover': {
                                    color: 'primary.main',
                                    bgcolor: 'primary.50',
                                    borderColor: 'primary.main',
                                },
                            }}
                        >
                            <AddRounded sx={{ fontSize: 18 }} />
                        </IconButton>
                    ) : null}

                    {editable ? (
                        <IconButton
                            size="small"
                            onClick={onEdit}
                            sx={{
                                color: 'grey.700',
                                bgcolor: 'white',
                                border: 1,
                                borderColor: 'grey.300',
                                width: 32,
                                height: 32,
                                '&:hover': {
                                    color: 'primary.main',
                                    bgcolor: 'primary.50',
                                    borderColor: 'primary.main',
                                },
                            }}
                        >
                            <EditRounded sx={{ fontSize: 18 }} />
                        </IconButton>
                    ) : null}
                </Box>
            </Box>

            <Box p={3}>
                {empty ? (
                    <Box textAlign="center" py={1}>
                        <Typography variant="body2" color="text.secondary">
                            {emptyText || 'Nothing added yet'}
                        </Typography>

                        {emptyActionLabel && onEmptyAction ? (
                            <Button
                                size="small"
                                startIcon={<AddRounded sx={{ fontSize: 14 }} />}
                                onClick={onEmptyAction}
                                sx={{ mt: 1, textTransform: 'none' }}
                            >
                                {emptyActionLabel}
                            </Button>
                        ) : null}
                    </Box>
                ) : (
                    children
                )}
            </Box>
        </Paper>
    );
}