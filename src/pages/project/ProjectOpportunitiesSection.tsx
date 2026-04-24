import React from 'react';
import {
    Box,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    Pagination,
    Paper,
    Stack,
    Typography,
    Button,
} from '@mui/material';
import MoreVertRounded from '@mui/icons-material/MoreVertRounded';
import PeopleRounded from '@mui/icons-material/PeopleRounded';

import type {
    ProjectEditorTarget,
    ProjectOpportunity,
    SectionVisibility,
} from './projectProfile.types';
import { ProjectSectionCard } from './ProjectSectionCard';
import CloseRounded from '@mui/icons-material/CloseRounded';

type Props = {
    opportunities?: ProjectOpportunity[];
    canEdit: boolean;
    visibility: SectionVisibility;
    projectName?: string | null;
    companyEmail?: string | null;
    onVisibilityChange?: (value: SectionVisibility) => void;
    onOpenEditor?: (section: ProjectEditorTarget, itemId?: string | null) => void;
    onOpportunityMenuClick?: (
        event: React.MouseEvent<HTMLElement>,
        item: ProjectOpportunity,
        index: number
    ) => void;
};


const MAX_OPPORTUNITY_ITEMS = 10;
const OPPORTUNITIES_PER_PAGE = 6;

function getOpportunityTitle(item: ProjectOpportunity) {
    return item.type || 'Opportunity';
}

function getOpportunityDescription(item: ProjectOpportunity) {
    return item.description?.trim() || 'No additional details provided.';
}

function formatDate(value?: string | null) {
    if (!value) return '—';

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';

    const day = String(date.getDate()).padStart(2, '0');
    const month = date.toLocaleString('en-GB', { month: 'short' });
    const year = date.getFullYear();

    return `${day}-${month}-${year}`;
}

function getUpdatedAtLabel(item: ProjectOpportunity) {
    if (!item.updatedAt) return null;
    // if (item.createdAt && item.updatedAt === item.createdAt) return null;
    return formatDate(item.updatedAt);
}

export default function ProjectOpportunitiesSection({
    opportunities,
    canEdit,
    visibility,
    projectName,
    companyEmail,
    onVisibilityChange,
    onOpenEditor,
    onOpportunityMenuClick,
}: Props) {
    const items = opportunities ?? [];
    const itemCount = items.length;
    const hasReachedLimit = itemCount >= MAX_OPPORTUNITY_ITEMS;
    const canAddMore = canEdit && !hasReachedLimit;

    const [page, setPage] = React.useState(1);
    const [selectedOpportunity, setSelectedOpportunity] =
        React.useState<ProjectOpportunity | null>(null);

    const pageCount = Math.max(1, Math.ceil(itemCount / OPPORTUNITIES_PER_PAGE));

    React.useEffect(() => {
        if (page > pageCount) {
            setPage(pageCount);
        }
    }, [page, pageCount]);

    const pagedOpportunities = React.useMemo(() => {
        const start = (page - 1) * OPPORTUNITIES_PER_PAGE;
        return items.slice(start, start + OPPORTUNITIES_PER_PAGE);
    }, [items, page]);

    const handleCloseDialog = () => {
        setSelectedOpportunity(null);
    };

    const contactDeveloperHref =
        companyEmail?.trim()
            ? `mailto:${companyEmail.trim()}?subject=${encodeURIComponent(
                `Enquiry about ${projectName || 'this project'}${selectedOpportunity?.type ? ` – ${selectedOpportunity.type}` : ''
                }`
            )}`
            : undefined;

    return (
        <>
            <ProjectSectionCard
                title="Looking For"
                subtitle="What this project is currently seeking"
                addable={canAddMore}
                isOwner={canEdit}
                visibility={visibility}
                onVisibilityChange={canEdit ? onVisibilityChange : undefined}
                empty={!items.length}
                emptyText="No open opportunities listed"
                emptyActionLabel={canAddMore ? 'Add Opportunity' : undefined}
                onEmptyAction={canAddMore ? () => onOpenEditor?.('opportunities', null) : undefined}
                onAdd={canAddMore ? () => onOpenEditor?.('opportunities', null) : undefined}
            >
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    <Box
                        sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: { xs: 'flex-start', sm: 'center' },
                            flexDirection: { xs: 'column', sm: 'row' },
                            gap: 0.5,
                        }}
                    >
                        <Typography variant="caption" color="text.secondary">
                            {itemCount} / {MAX_OPPORTUNITY_ITEMS} items
                        </Typography>

                        {hasReachedLimit ? (
                            <Typography variant="caption" color="warning.main" fontWeight={600}>
                                Maximum of {MAX_OPPORTUNITY_ITEMS} opportunities reached
                            </Typography>
                        ) : null}
                    </Box>

                    <Box
                        sx={{
                            display: 'grid',
                            gridTemplateColumns: {
                                xs: '1fr',
                                md: 'repeat(2, minmax(0, 1fr))',
                            },
                            gap: 1.5,
                        }}
                    >
                        {pagedOpportunities.map((item, index) => {
                            const absoluteIndex = (page - 1) * OPPORTUNITIES_PER_PAGE + index;
                            const updatedAtLabel = getUpdatedAtLabel(item);

                            return (
                                <Paper
                                    key={item.id}
                                    variant="outlined"
                                    onClick={() => setSelectedOpportunity(item)}
                                    sx={{
                                        p: 2,
                                        borderRadius: 2,
                                        height: '100%',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                        bgcolor: item.urgent ? 'grey.50' : 'white',
                                        borderColor: item.urgent ? 'grey.400' : 'grey.200',
                                        '&:hover': {
                                            borderColor: 'grey.400',
                                            boxShadow: 1,
                                        },
                                    }}
                                >
                                    <Stack spacing={1}>
                                        <Stack
                                            direction="row"
                                            justifyContent="space-between"
                                            alignItems="flex-start"
                                            spacing={1}
                                        >
                                            <Stack
                                                direction="row"
                                                spacing={1}
                                                alignItems="center"
                                                sx={{ minWidth: 0, flex: 1 }}
                                            >
                                                <PeopleRounded
                                                    sx={{
                                                        fontSize: 18,
                                                        color: 'text.secondary',
                                                        mt: '2px',
                                                        flexShrink: 0,
                                                    }}
                                                />

                                                <Box minWidth={0}>
                                                    <Typography variant="body2" fontWeight={700}>
                                                        {item.type}
                                                    </Typography>
                                                </Box>

                                                {item.urgent ? (
                                                    <Chip
                                                        label="Priority"
                                                        size="small"
                                                        color="warning"
                                                        sx={{ flexShrink: 0 }}
                                                    />
                                                ) : null}
                                            </Stack>

                                            {canEdit ? (
                                                <IconButton
                                                    size="small"
                                                    onClick={(event) => {
                                                        event.stopPropagation();
                                                        onOpportunityMenuClick?.(
                                                            event,
                                                            item,
                                                            absoluteIndex
                                                        );
                                                    }}
                                                    sx={{ color: 'grey.500', flexShrink: 0 }}
                                                >
                                                    <MoreVertRounded sx={{ fontSize: 18 }} />
                                                </IconButton>
                                            ) : null}
                                        </Stack>

                                        {item.description ? (
                                            <Typography
                                                variant="body2"
                                                color="text.secondary"
                                                sx={{
                                                    display: '-webkit-box',
                                                    WebkitLineClamp: 2,
                                                    WebkitBoxOrient: 'vertical',
                                                    overflow: 'hidden',
                                                }}
                                            >
                                                {item.description}
                                            </Typography>
                                        ) : null}

                                        <Stack spacing={0.25}>
                                            <Typography variant="caption" color="text.secondary">
                                                Created: {formatDate(item.createdAt)}
                                            </Typography>

                                            {updatedAtLabel ? (
                                                <Typography variant="caption" color="text.secondary">
                                                    Updated: {updatedAtLabel}
                                                </Typography>
                                            ) : null}
                                        </Stack>
                                    </Stack>
                                </Paper>
                            );
                        })}
                    </Box>

                    {pageCount > 1 ? (
                        <Box display="flex" justifyContent="center">
                            <Pagination
                                page={page}
                                count={pageCount}
                                onChange={(_, value) => setPage(value)}
                                size="small"
                                color="primary"
                            />
                        </Box>
                    ) : null}
                </Box>
            </ProjectSectionCard>

            <Dialog
                open={Boolean(selectedOpportunity)}
                onClose={handleCloseDialog}
                fullWidth
                maxWidth="sm"
                PaperProps={{
                    sx: {
                        borderRadius: 3,
                        overflow: 'hidden',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.12)',
                    },
                }}
            >
                {selectedOpportunity ? (
                    <>
                        <DialogTitle
                            sx={{
                                px: 3,
                                py: 2.25,
                                borderBottom: '1px solid',
                                borderColor: 'grey.100',
                                bgcolor: selectedOpportunity.urgent ? 'grey.50' : 'white',
                            }}
                        >
                            <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
                                <Stack direction="row" spacing={1.5} alignItems="flex-start" sx={{ minWidth: 0, flex: 1 }}>
                                    <Box
                                        sx={{
                                            width: 44,
                                            height: 44,
                                            borderRadius: 2,
                                            bgcolor: 'grey.100',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            border: '1px solid',
                                            borderColor: 'grey.200',
                                            flexShrink: 0,
                                        }}
                                    >
                                        <PeopleRounded sx={{ fontSize: 22, color: 'text.secondary' }} />
                                    </Box>

                                    <Box minWidth={0} flex={1}>
                                        <Stack
                                            direction="row"
                                            spacing={1}
                                            alignItems="center"
                                            flexWrap="wrap"
                                            useFlexGap
                                            sx={{ mb: 0.5 }}
                                        >
                                            <Typography
                                                variant="h6"
                                                fontWeight={700}
                                                color="text.primary"
                                                sx={{ lineHeight: 1.2 }}
                                            >
                                                {getOpportunityTitle(selectedOpportunity)}
                                            </Typography>

                                            {selectedOpportunity.urgent ? (
                                                <Chip
                                                    label="Priority"
                                                    size="small"
                                                    color="warning"
                                                    sx={{ fontWeight: 600 }}
                                                />
                                            ) : null}
                                        </Stack>

                                        <Typography variant="body2" color="text.secondary">
                                            Opportunity details and collaboration context
                                        </Typography>
                                    </Box>
                                </Stack>

                                <IconButton
                                    size="small"
                                    onClick={handleCloseDialog}
                                    sx={{
                                        color: 'grey.500',
                                        mt: -0.5,
                                        mr: -0.5,
                                    }}
                                >
                                    <CloseRounded sx={{ fontSize: 18 }} />
                                </IconButton>
                            </Stack>
                        </DialogTitle>

                        <DialogContent sx={{ px: 3, py: 3 }}>
                            <Stack spacing={2.5}>
                                <Box
                                    sx={{
                                        display: 'grid',
                                        gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' },
                                        gap: 1.25,
                                    }}
                                >
                                    <Paper
                                        variant="outlined"
                                        sx={{
                                            p: 1.5,
                                            borderRadius: 2,
                                            bgcolor: 'grey.50',
                                            borderColor: 'grey.200',
                                        }}
                                    >
                                        <Typography
                                            variant="caption"
                                            color="text.secondary"
                                            sx={{
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.04em',
                                                display: 'block',
                                                mb: 0.5,
                                            }}
                                        >
                                            Created
                                        </Typography>
                                        <Typography variant="body2" fontWeight={600} color="text.primary">
                                            {formatDate(selectedOpportunity.createdAt)}
                                        </Typography>
                                    </Paper>

                                    <Paper
                                        variant="outlined"
                                        sx={{
                                            p: 1.5,
                                            borderRadius: 2,
                                            bgcolor: 'grey.50',
                                            borderColor: 'grey.200',
                                        }}
                                    >
                                        <Typography
                                            variant="caption"
                                            color="text.secondary"
                                            sx={{
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.04em',
                                                display: 'block',
                                                mb: 0.5,
                                            }}
                                        >
                                            Last Updated
                                        </Typography>
                                        <Typography variant="body2" fontWeight={600} color="text.primary">
                                            {getUpdatedAtLabel(selectedOpportunity) ?? '—'}
                                        </Typography>
                                    </Paper>
                                </Box>

                                <Box>
                                    <Typography
                                        variant="caption"
                                        color="text.secondary"
                                        sx={{
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.04em',
                                            display: 'block',
                                            mb: 1,
                                        }}
                                    >
                                        Description
                                    </Typography>

                                    <Paper
                                        variant="outlined"
                                        sx={{
                                            p: 2,
                                            borderRadius: 2,
                                            borderColor: 'grey.200',
                                            bgcolor: 'white',
                                        }}
                                    >
                                        <Typography
                                            variant="body2"
                                            color="text.secondary"
                                            sx={{
                                                lineHeight: 1.75,
                                                whiteSpace: 'pre-line',
                                            }}
                                        >
                                            {getOpportunityDescription(selectedOpportunity)}
                                        </Typography>
                                    </Paper>
                                </Box>

                                <Paper
                                    variant="outlined"
                                    sx={{
                                        p: 2,
                                        borderRadius: 2.5,
                                        bgcolor: 'grey.50',
                                        borderColor: 'grey.200',
                                    }}
                                >
                                    <Stack spacing={0.75}>
                                        <Typography variant="subtitle2" fontWeight={700} color="text.primary">
                                            Interested in this opportunity?
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                                            Reach out to the project developer to discuss fit, scope, and next steps for collaboration.
                                        </Typography>
                                    </Stack>
                                </Paper>
                            </Stack>
                        </DialogContent>

                        <DialogActions
                            sx={{
                                px: 3,
                                py: 2,
                                borderTop: '1px solid',
                                borderColor: 'grey.100',
                                justifyContent: 'space-between',
                                flexWrap: 'wrap',
                                gap: 1,
                            }}
                        >
                            <Button
                                variant="outlined"
                                onClick={handleCloseDialog}
                                sx={{
                                    textTransform: 'none',
                                    borderColor: 'grey.300',
                                    color: 'text.secondary',
                                    '&:hover': {
                                        borderColor: 'grey.400',
                                        bgcolor: 'grey.50',
                                    },
                                }}
                            >
                                Close
                            </Button>

                            <Button
                                variant="contained"
                                startIcon={<PeopleRounded sx={{ fontSize: 18 }} />}
                                component={contactDeveloperHref ? 'a' : 'button'}
                                href={contactDeveloperHref}
                                disabled={!contactDeveloperHref}
                                sx={{
                                    textTransform: 'none',
                                    px: 2,
                                    borderRadius: 2,
                                }}
                            >
                                Contact Developer
                            </Button>
                        </DialogActions>
                    </>
                ) : null}
            </Dialog>
        </>
    );
}