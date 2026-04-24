import React from 'react';
import {
    Card,
    Box,
    Typography,
    Chip,
    IconButton,
    Stack,
    CardContent,
} from '@mui/material';
import LocationOnRounded from '@mui/icons-material/LocationOnRounded';
import BookmarkRounded from '@mui/icons-material/BookmarkRounded';
import BookmarkBorderRounded from '@mui/icons-material/BookmarkBorderRounded';
import ParkRounded from '@mui/icons-material/ParkRounded';
import ForestRounded from '@mui/icons-material/ForestRounded';
import WaterRounded from '@mui/icons-material/WaterRounded';
import AgricultureRounded from '@mui/icons-material/AgricultureRounded';
import VerifiedRounded from '@mui/icons-material/VerifiedRounded';

import { ProjectStageIndicator, type ProjectStage } from '../ProjectStageIndicator';
import { ReportingFreshness, type FreshnessStatus } from '../ReportingFreshness';
import { CountryFlagLabel } from '../common/CountryFlagLabel';
import ScienceRounded from '@mui/icons-material/ScienceRounded';
import PrecisionManufacturingRounded from '@mui/icons-material/PrecisionManufacturingRounded';
import GrainRounded from '@mui/icons-material/GrainRounded';
import BoltRounded from '@mui/icons-material/BoltRounded';
import RecyclingRounded from '@mui/icons-material/RecyclingRounded';
import HomeRounded from '@mui/icons-material/HomeRounded';
import NatureRounded from '@mui/icons-material/NatureRounded';

export interface ProjectCardProps {
    upid?: string | null;
    name: string;
    developer: string;
    description?: string | null;
    stage: ProjectStage;
    type: string;
    country: string | null;
    countryCode: string | null;
    hectares?: number | null;
    expectedCredits?: string | null;
    freshness?: FreshnessStatus;
    verifiedFields?: number;
    totalFields?: number;

    /**
     * Full/original cover image URL.
     */
    photoUrl?: string | null;

    /**
     * System-generated thumbnail/logo variant URL.
     * Preferred for cards and list/grid views.
     */
    thumbUrl?: string | null;

    isSaved?: boolean;
    isMine?: boolean;
    onClick?: () => void;
    onToggleSave?: (e: React.MouseEvent<HTMLButtonElement>) => void;
    onDeveloperClick?: (e: React.MouseEvent<HTMLElement>) => void;
    variant?: 'default' | 'compact';
}

const typeIconMap: Record<
    string,
    {
        icon: React.ElementType;
        color: string;
        bg: string;
    }
> = {
    arr: {
        icon: ParkRounded,
        color: '#558b2f',
        bg: '#f1f8e9',
    },
    redd: {
        icon: ForestRounded,
        color: '#388e3c',
        bg: '#e8f5e9',
    },
    'regenerative-ag': {
        icon: AgricultureRounded,
        color: '#8d6e63',
        bg: '#f5f0e6',
    },
    ifm: {
        icon: ForestRounded,
        color: '#2e7d32',
        bg: '#e8f5e9',
    },
    'blue-carbon': {
        icon: WaterRounded,
        color: '#0277bd',
        bg: '#e1f5fe',
    },
    biochar: {
        icon: ScienceRounded,
        color: '#5d4037',
        bg: '#efebe9',
    },
    dac: {
        icon: PrecisionManufacturingRounded,
        color: '#546e7a',
        bg: '#eceff1',
    },
    erw: {
        icon: GrainRounded,
        color: '#6d4c41',
        bg: '#efebe9',
    },
    beccs: {
        icon: PrecisionManufacturingRounded,
        color: '#455a64',
        bg: '#eceff1',
    },
    'renewable-energy': {
        icon: BoltRounded,
        color: '#f9a825',
        bg: '#fff8e1',
    },
    'waste-management': {
        icon: RecyclingRounded,
        color: '#00897b',
        bg: '#e0f2f1',
    },
    'household-devices': {
        icon: HomeRounded,
        color: '#6d4c41',
        bg: '#efebe9',
    },
    awd: {
        icon: AgricultureRounded,
        color: '#2e7d32',
        bg: '#e8f5e9',
    },
};

const PROJECT_TYPE_LABEL_MAP: Record<string, string> = {
    arr: 'ARR',
    redd: 'REDD+',
    'regenerative-ag': 'Regenerative Agriculture',
    ifm: 'IFM',
    'blue-carbon': 'Blue Carbon',
    biochar: 'Biochar',
    dac: 'DAC',
    erw: 'ERW',
    beccs: 'BECCS',
    'renewable-energy': 'Renewable Energy',
    'waste-management': 'Waste Management',
    'household-devices': 'Household Devices',
    awd: 'AWD',
};

function formatUpid(id?: string | null) {
    if (!id) return '—';
    if (id.startsWith('CUP-')) {
        return id.replace(/^CUP-/, '').replace(/-/g, '');
    }
    return id;
}

function MediaStub({ type, name }: { type: string; name: string }) {
    const config = typeIconMap[type];
    const Icon = config?.icon ?? NatureRounded;
    const iconColor = config?.color ?? '#757575';
    const bgColor = config?.bg ?? 'grey.100';
    const typeLabel = PROJECT_TYPE_LABEL_MAP[type] ?? type;

    return (
        <Box
            sx={{
                width: '100%',
                height: '100%',
                minHeight: 120,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: bgColor,
                px: 1,
                textAlign: 'center',
            }}
            aria-label={`${name} media placeholder`}
        >
            <Box
                display="flex"
                flexDirection="column"
                alignItems="center"
                gap={0.5}
            >
                <Icon
                    sx={{
                        fontSize: 32,
                        color: iconColor,
                    }}
                />

                <Typography
                    variant="caption"
                    sx={{
                        fontSize: '0.6rem',
                        color: iconColor,
                        fontWeight: 500,
                        textAlign: 'center',
                        px: 0.5,
                        lineHeight: 1.2,
                    }}
                >
                    {typeLabel}
                </Typography>
            </Box>
        </Box>
    );
}

function ProjectCardImage({
    imageUrl,
    name,
    type,
    minHeight = 120,
}: {
    imageUrl?: string | null;
    name: string;
    type: string;
    minHeight?: number;
}) {
    const [failed, setFailed] = React.useState(false);
    const showImage = Boolean(imageUrl) && !failed;

    if (!showImage) {
        return <MediaStub type={type} name={name} />;
    }

    return (
        <Box
            component="img"
            src={imageUrl!}
            alt={name}
            loading="lazy"
            decoding="async"
            onError={() => setFailed(true)}
            sx={{
                width: '100%',
                height: '100%',
                minHeight,
                objectFit: 'cover',
                display: 'block',
                bgcolor: 'grey.100',
            }}
        />
    );
}

export function ProjectCard({
    upid,
    name,
    developer,
    description,
    stage,
    type,
    country,
    countryCode,
    hectares,
    expectedCredits,
    freshness,
    verifiedFields,
    totalFields,
    photoUrl,
    thumbUrl,
    isSaved = false,
    isMine = false,
    onClick,
    onToggleSave,
    onDeveloperClick,
    variant = 'default',
}: ProjectCardProps) {
    const imageUrl = thumbUrl || photoUrl || null;

    const normalizedType = type;
    const typeConfig = typeIconMap[normalizedType];
    const typeLabel = PROJECT_TYPE_LABEL_MAP[normalizedType] ?? normalizedType;


    if (variant === 'compact') {
        return (
            <Card
                onClick={onClick}
                sx={{
                    cursor: onClick ? 'pointer' : 'default',
                    height: '100%',
                    minWidth: 328,
                    display: 'flex',
                    flexDirection: 'row',
                    border: '1px solid',
                    borderColor: 'divider',
                    transition: 'box-shadow 0.2s',
                    overflow: 'hidden',
                    borderRadius: 2,
                    '&:hover': onClick ? { boxShadow: 4 } : undefined,
                }}
            >
                <Box
                    sx={{
                        width: 128,
                        flexShrink: 0,
                        bgcolor: 'grey.100',
                        overflow: 'hidden',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <ProjectCardImage
                        imageUrl={imageUrl}
                        name={name}
                        type={type}
                        minHeight={120}
                    />
                </Box>

                <CardContent
                    sx={{
                        flexGrow: 1,
                        minWidth: 0,
                        p: 1.5,
                        '&:last-child': { pb: 1.5 },
                        display: 'flex',
                        flexDirection: 'column',
                    }}
                >
                    <Box
                        display="flex"
                        justifyContent="space-between"
                        alignItems="flex-start"
                        sx={{ flexShrink: 0 }}
                    >
                        <Box flex={1} minWidth={0}>
                            <Box
                                display="flex"
                                alignItems="center"
                                gap={1}
                                flexWrap="wrap"
                                mb={0.5}
                            >
                                <Typography
                                    variant="caption"
                                    fontFamily="monospace"
                                    color="text.disabled"
                                >
                                    {formatUpid(upid)}
                                </Typography>

                                <Typography
                                    variant="subtitle2"
                                    fontWeight="bold"
                                    color="text.primary"
                                    sx={{
                                        display: '-webkit-box',
                                        WebkitLineClamp: 2,
                                        WebkitBoxOrient: 'vertical',
                                        overflow: 'hidden',
                                        lineHeight: 1.3,
                                    }}
                                >
                                    {name}
                                </Typography>

                                {isMine && (
                                    <Chip
                                        label="My Project"
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

                            <Typography
                                variant="caption"
                                color="text.secondary"
                                display="block"
                                noWrap
                                onClick={onDeveloperClick}
                                sx={{
                                    cursor: onDeveloperClick ? 'pointer' : 'default',
                                    '&:hover': onDeveloperClick
                                        ? {
                                            textDecoration: 'underline',
                                            color: 'text.primary',
                                        }
                                        : undefined,
                                }}
                            >
                                {developer}
                            </Typography>
                        </Box>

                        {onToggleSave && (
                            <IconButton
                                size="small"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onToggleSave(e);
                                }}
                                sx={{
                                    ml: 1,
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

                    <Stack
                        direction="row"
                        spacing={0.5}
                        sx={{
                            mt: 1,
                            mb: 1,
                            flexShrink: 0,
                        }}
                    >
                        <ProjectStageIndicator stage={stage} />
                        <Chip
                            label={typeLabel}
                            size="small"
                            icon={
                                typeConfig ? (
                                    <typeConfig.icon style={{ fontSize: 16 }} />
                                ) : undefined
                            }
                            sx={{
                                height: 24,
                                fontSize: '0.75rem',
                                bgcolor: typeConfig?.bg ?? 'grey.100',
                                color: typeConfig?.color ?? 'text.primary',
                                '& .MuiChip-icon': {
                                    color: typeConfig?.color ?? 'inherit',
                                },
                            }}
                        />
                    </Stack>

                    <Box
                        display="flex"
                        alignItems="center"
                        gap={2}
                        color="text.secondary"
                        sx={{
                            flexShrink: 0,
                            mt: 'auto',
                            pt: 2,
                            borderTop: 1,
                            borderColor: 'grey.100',
                            flexWrap: 'wrap',
                        }}
                    >
                        <CountryFlagLabel
                            country={country}
                            code={countryCode}
                            size="md"
                            textVariant="caption"
                            color="text.secondary"
                        />

                        {Boolean(hectares) && (
                            <Box display="flex" alignItems="center" gap={0.75}>
                                <LocationOnRounded sx={{ fontSize: 14, color: 'grey.400' }} />
                                <Typography variant="caption" color="text.secondary">
                                    {Number(hectares).toLocaleString()} ha
                                </Typography>
                            </Box>
                        )}

                        {expectedCredits && (
                            <Box display="flex" alignItems="center" gap={0.75}>
                                <ParkRounded sx={{ fontSize: 14, color: 'grey.400' }} />
                                <Typography variant="caption" color="text.secondary">
                                    {expectedCredits}
                                </Typography>
                            </Box>
                        )}

                        {(freshness || verifiedFields !== undefined) && (
                            <Box display="flex" alignItems="center" gap={1} ml="auto">
                                {freshness && (
                                    <ReportingFreshness status={freshness} showLabel={false} />
                                )}

                                {verifiedFields !== undefined && (
                                    <Box display="flex" alignItems="center" gap={0.5}>
                                        <VerifiedRounded sx={{ fontSize: 14, color: 'grey.400' }} />
                                        <Typography variant="caption" color="text.secondary">
                                            {verifiedFields}/{totalFields || 6}
                                        </Typography>
                                    </Box>
                                )}
                            </Box>
                        )}
                    </Box>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card
            variant="outlined"
            onClick={onClick}
            sx={{
                cursor: onClick ? 'pointer' : 'default',
                transition: 'border-color 0.2s, box-shadow 0.2s',
                '&:hover': onClick ? { borderColor: 'grey.300', boxShadow: 1 } : undefined,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
            }}
        >
            <Box
                sx={{
                    width: '100%',
                    height: 160,
                    flexShrink: 0,
                    bgcolor: 'grey.100',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderBottom: 1,
                    borderColor: 'grey.100',
                }}
            >
                <ProjectCardImage
                    imageUrl={imageUrl}
                    name={name}
                    type={type}
                    minHeight={160}
                />
            </Box>

            <CardContent
                sx={{
                    p: 2,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    '&:last-child': { pb: 2 },
                }}
            >
                <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                    <Box flex={1} minWidth={0}>
                        <Box display="flex" alignItems="center" gap={1} flexWrap="wrap" mb={0.5}>
                            <Typography
                                variant="caption"
                                fontFamily="monospace"
                                color="text.disabled"
                            >
                                {formatUpid(upid)}
                            </Typography>

                            <Typography
                                variant="subtitle2"
                                fontWeight="bold"
                                color="text.primary"
                                sx={{
                                    display: '-webkit-box',
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden',
                                    lineHeight: 1.3,
                                }}
                            >
                                {name}
                            </Typography>

                            {isMine && (
                                <Chip
                                    label="My Project"
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

                        <Typography
                            variant="caption"
                            color="text.secondary"
                            display="block"
                            noWrap
                            onClick={onDeveloperClick}
                            sx={{
                                cursor: onDeveloperClick ? 'pointer' : 'default',
                                '&:hover': onDeveloperClick
                                    ? { textDecoration: 'underline', color: 'text.primary' }
                                    : undefined,
                            }}
                        >
                            {developer}
                        </Typography>
                    </Box>

                    {onToggleSave && (
                        <IconButton
                            size="small"
                            onClick={(e) => {
                                e.stopPropagation();
                                onToggleSave(e);
                            }}
                            sx={{
                                ml: 1,
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

                <Stack direction="row" spacing={0.5} sx={{ mt: 1, mb: 1, flexShrink: 0 }}>
                    <ProjectStageIndicator stage={stage} />
                    <Chip
                        label={typeLabel}
                        size="small"
                        icon={
                            typeConfig ? (
                                <typeConfig.icon style={{ fontSize: 16 }} />
                            ) : undefined
                        }
                        sx={{
                            height: 24,
                            fontSize: '0.75rem',
                            bgcolor: typeConfig?.bg ?? 'grey.100',
                            color: typeConfig?.color ?? 'text.primary',
                            '& .MuiChip-icon': {
                                color: typeConfig?.color ?? 'inherit',
                            },
                        }}
                    />
                </Stack>

                {description && (
                    <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                            display: '-webkit-box',
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            lineHeight: 1.4,
                            mb: 1.5,
                            flexGrow: 1,
                        }}
                    >
                        {description}
                    </Typography>
                )}

                <Box
                    display="flex"
                    alignItems="center"
                    gap={2}
                    color="text.secondary"
                    sx={{
                        flexShrink: 0,
                        mt: 'auto',
                        pt: 2,
                        borderTop: 1,
                        borderColor: 'grey.100',
                        flexWrap: 'wrap',
                    }}
                >
                    <Box display="flex" alignItems="center" gap={0.75}>
                        <Typography fontSize="0.875rem">
                            {countryCode || '🏳️'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            {country || 'Unknown'}
                        </Typography>
                    </Box>

                    {Boolean(hectares) && (
                        <Box display="flex" alignItems="center" gap={0.75}>
                            <LocationOnRounded sx={{ fontSize: 14, color: 'grey.400' }} />
                            <Typography variant="caption" color="text.secondary">
                                {Number(hectares).toLocaleString()} ha
                            </Typography>
                        </Box>
                    )}

                    {expectedCredits && (
                        <Box display="flex" alignItems="center" gap={0.75}>
                            <ParkRounded sx={{ fontSize: 14, color: 'grey.400' }} />
                            <Typography variant="caption" color="text.secondary">
                                {expectedCredits}
                            </Typography>
                        </Box>
                    )}

                    {(freshness || verifiedFields !== undefined) && (
                        <Box display="flex" alignItems="center" gap={1} ml="auto">
                            {freshness && (
                                <ReportingFreshness status={freshness} showLabel={false} />
                            )}

                            {verifiedFields !== undefined && (
                                <Box display="flex" alignItems="center" gap={0.5}>
                                    <VerifiedRounded sx={{ fontSize: 14, color: 'grey.400' }} />
                                    <Typography variant="caption" color="text.secondary">
                                        {verifiedFields}/{totalFields || 6}
                                    </Typography>
                                </Box>
                            )}
                        </Box>
                    )}
                </Box>
            </CardContent>
        </Card>
    );
}