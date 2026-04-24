import React from 'react';
import {
    Card,
    Box,
    Typography,
    Chip,
    IconButton,
    Stack,
    CardContent,
    Tooltip,
} from '@mui/material';
import BookmarkRounded from '@mui/icons-material/BookmarkRounded';
import BookmarkBorderRounded from '@mui/icons-material/BookmarkBorderRounded';
import FolderRounded from '@mui/icons-material/FolderRounded';
import WorkOutlineRounded from '@mui/icons-material/WorkOutlineRounded';
import VerifiedIcon from '@mui/icons-material/Verified';
import { CountryFlagLabel } from '../common/CountryFlagLabel';

export type CompanyType = 'Project Developer' | 'Service Provider';

export interface CompanyCardProps {
    id: string;
    name: string;
    type: CompanyType;
    description: string;
    country: string;
    countryCode: string;
    logoUrl?: string;
    founded?: string;
    isSaved?: boolean;
    isMine?: boolean;
    isVerified?: boolean;
    projectsCount?: number;
    servicesCount?: number;
    serviceTypes?: string[];
    certifications?: string[];
    onClick?: () => void;
    onToggleSave?: (e: React.MouseEvent) => void;
}

function getInitials(name: string): string {
    const trimmed = name.trim();
    if (!trimmed) return '—';

    const parts = trimmed.split(/\s+/).filter(Boolean);
    if (parts.length === 1) {
        return parts[0].slice(0, 2).toUpperCase();
    }

    return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase();
}

export function CompanyCard({
    name,
    type,
    description,
    country,
    countryCode,
    logoUrl,
    isSaved = false,
    isMine = false,
    isVerified = false,
    projectsCount = 0,
    servicesCount = 0,
    serviceTypes = [],
    onClick,
    onToggleSave,
}: CompanyCardProps) {
    const primaryTypeLabel =
        type === 'Project Developer' ? 'Developer' : 'Service Provider';

    const projectsLabel =
        type === 'Project Developer'
            ? `${projectsCount} project${projectsCount === 1 ? '' : 's'}`
            : `${projectsCount} project${projectsCount === 1 ? '' : 's'} supported`;

    const visibleServiceTypes = serviceTypes.filter(Boolean).slice(0, 3);

    return (
        <Card
            variant="outlined"
            onClick={onClick}
            sx={{
                cursor: onClick ? 'pointer' : 'default',
                transition: 'border-color 0.2s, box-shadow 0.2s, transform 0.2s',
                '&:hover': onClick
                    ? {
                        borderColor: 'grey.300',
                        boxShadow: 2,
                    }
                    : undefined,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                borderRadius: 2,
            }}
        >
            <CardContent
                sx={{
                    p: 2,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    '&:last-child': { pb: 2 },
                }}
            >
                <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="flex-start"
                    gap={1.5}
                    mb={1.5}
                >
                    <Box display="flex" alignItems="flex-start" gap={1.5} minWidth={0} flex={1}>
                        <Box
                            sx={{
                                width: 44,
                                height: 44,
                                borderRadius: 1.5,
                                flexShrink: 0,
                                overflow: 'hidden',
                                bgcolor: 'grey.100',
                                border: '1px solid',
                                borderColor: 'grey.200',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            {logoUrl ? (
                                <Box
                                    component="img"
                                    src={logoUrl}
                                    alt={name}
                                    onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                                        e.currentTarget.style.display = 'none';
                                    }}
                                    sx={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover',
                                    }}
                                />
                            ) : (
                                <Typography
                                    variant="caption"
                                    fontWeight="bold"
                                    color="grey.500"
                                    sx={{ fontSize: '0.75rem', userSelect: 'none' }}
                                >
                                    {getInitials(name)}
                                </Typography>
                            )}
                        </Box>

                        <Box minWidth={0} flex={1}>
                            <Box
                                display="flex"
                                alignItems="center"
                                gap={0.75}
                                flexWrap="wrap"
                                mb={0.5}
                            >
                                <Typography
                                    variant="subtitle2"
                                    fontWeight={700}
                                    color="text.primary"
                                    sx={{
                                        lineHeight: 1.3,
                                        display: '-webkit-box',
                                        WebkitLineClamp: 2,
                                        WebkitBoxOrient: 'vertical',
                                        overflow: 'hidden',
                                        minWidth: 0,
                                    }}
                                >
                                    {name}
                                </Typography>

                                {isVerified && (
                                    <Tooltip title="Verified" arrow placement="top">
                                        <VerifiedIcon
                                            sx={{
                                                fontSize: 16,
                                                color: '#1d9bf0',
                                                flexShrink: 0,
                                                cursor: 'help',
                                            }}
                                        />
                                    </Tooltip>
                                )}

                                {isMine && (
                                    <Chip
                                        label="My Company"
                                        size="small"
                                        color="primary"
                                        sx={{
                                            height: 18,
                                            fontSize: '0.625rem',
                                            flexShrink: 0,
                                            '& .MuiChip-label': { px: 1 },
                                        }}
                                    />
                                )}
                            </Box>

                            <Box display="flex" alignItems="center" gap={0.75} flexWrap="wrap">
                                <CountryFlagLabel
                                    country={country}
                                    code={countryCode}
                                    size="md"
                                    textVariant="caption"
                                    color="text.secondary"
                                />
                            </Box>
                        </Box>
                    </Box>

                    {onToggleSave && (
                        <IconButton
                            size="small"
                            onClick={onToggleSave}
                            sx={{
                                flexShrink: 0,
                                p: 0.5,
                                color: isSaved ? 'primary.main' : 'grey.300',
                            }}
                        >
                            {isSaved ? (
                                <BookmarkRounded sx={{ fontSize: 18 }} />
                            ) : (
                                <BookmarkBorderRounded sx={{ fontSize: 18 }} />
                            )}
                        </IconButton>
                    )}
                </Box>

                <Box mb={1.25}>
                    <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap">
                        <Chip
                            label={primaryTypeLabel}
                            size="small"
                            sx={{
                                height: 24,
                                fontSize: '0.75rem',
                                bgcolor: 'grey.100',
                                color: 'text.primary',
                                fontWeight: 500,
                            }}
                        />

                        {visibleServiceTypes.map((service) => (
                            <Chip
                                key={service}
                                label={service}
                                size="small"
                                sx={{
                                    height: 24,
                                    fontSize: '0.75rem',
                                    bgcolor: 'grey.50',
                                    color: 'text.secondary',
                                    border: 1,
                                    borderColor: 'grey.100',
                                }}
                            />
                        ))}
                    </Stack>
                </Box>

                <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        lineHeight: 1.45,
                        mb: 1.5,
                        minHeight: '4.1em',
                    }}
                >
                    {description || '—'}
                </Typography>

                <Box
                    sx={{
                        mt: 'auto',
                        pt: 1.5,
                        borderTop: 1,
                        borderColor: 'grey.100',
                    }}
                >
                    <Stack direction="row" spacing={2.5} useFlexGap flexWrap="wrap">
                        <Box display="flex" alignItems="center" gap={0.75} color="text.secondary">
                            {type === 'Project Developer' ? (
                                <FolderRounded sx={{ fontSize: 18 }} />
                            ) : (
                                <WorkOutlineRounded sx={{ fontSize: 18 }} />
                            )}
                            <Typography variant="body2">{projectsLabel}</Typography>
                        </Box>

                        {type === 'Service Provider' && (
                            <Box display="flex" alignItems="center" gap={0.75} color="text.secondary">
                                <Typography variant="body2">
                                    {servicesCount} service{servicesCount === 1 ? '' : 's'}
                                </Typography>
                            </Box>
                        )}
                    </Stack>
                </Box>
            </CardContent>
        </Card>
    );
}