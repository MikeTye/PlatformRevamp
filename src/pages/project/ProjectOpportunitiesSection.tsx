import React from 'react';
import {
    Box,
    Chip,
    IconButton,
    Pagination,
    Paper,
    Stack,
    Typography,
} from '@mui/material';
import MoreVertRounded from '@mui/icons-material/MoreVertRounded';
import PeopleRounded from '@mui/icons-material/PeopleRounded';

import type {
    ProjectEditorTarget,
    ProjectOpportunity,
    SectionVisibility,
} from './ProjectProfileView';
import { ProjectSectionCard } from './ProjectSectionCard';

type Props = {
    opportunities?: ProjectOpportunity[];
    canEdit: boolean;
    visibility: SectionVisibility;
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

export default function ProjectOpportunitiesSection({
    opportunities,
    canEdit,
    visibility,
    onVisibilityChange,
    onOpenEditor,
    onOpportunityMenuClick,
}: Props) {
    const items = opportunities ?? [];
    const itemCount = items.length;
    const hasReachedLimit = itemCount >= MAX_OPPORTUNITY_ITEMS;
    const canAddMore = canEdit && !hasReachedLimit;

    const [page, setPage] = React.useState(1);

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

    return (
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

                        return (
                            <Paper
                                key={item.id}
                                variant="outlined"
                                sx={{
                                    p: 2,
                                    borderRadius: 2,
                                    height: '100%',
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
                                                onClick={(event) =>
                                                    onOpportunityMenuClick?.(
                                                        event,
                                                        item,
                                                        absoluteIndex
                                                    )
                                                }
                                                sx={{ color: 'grey.500', flexShrink: 0 }}
                                            >
                                                <MoreVertRounded sx={{ fontSize: 18 }} />
                                            </IconButton>
                                        ) : null}
                                    </Stack>

                                    {item.description ? (
                                        <Typography variant="body2" color="text.secondary">
                                            {item.description}
                                        </Typography>
                                    ) : null}
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
    );
}