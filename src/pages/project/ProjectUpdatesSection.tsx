import React from 'react';
import { Box, IconButton, Paper, Stack, Typography } from '@mui/material';
import MoreVertRounded from '@mui/icons-material/MoreVertRounded';

import { ProjectSectionCard } from './ProjectSectionCard';

import type {
    ProjectEditorTarget,
    ProjectSectionKey,
    ProjectUpdate,
    SectionVisibility,
} from './projectProfile.types';

type ProjectUpdatesSectionProps = {
    updates?: ProjectUpdate[] | null;
    canEdit: boolean;
    visibility: SectionVisibility;
    onVisibilityChange?: (value: SectionVisibility) => void;
    onOpenEditor?: (section: ProjectEditorTarget, itemId?: string | null) => void;
    onUpdateMenuClick?: (
        event: React.MouseEvent<HTMLElement>,
        item: ProjectUpdate,
        index: number
    ) => void;
    highlightedUpdateId?: string | null;
    sectionRef?: React.Ref<HTMLDivElement>;
    sectionFlash?: boolean;
};

export default function ProjectUpdatesSection({
    updates,
    canEdit,
    visibility,
    onVisibilityChange,
    onOpenEditor,
    onUpdateMenuClick,
    highlightedUpdateId = null,
    sectionRef,
    sectionFlash = false,
}: ProjectUpdatesSectionProps) {
    const safeUpdates = updates ?? [];

    return (
        <Box
            ref={sectionRef}
            sx={{
                scrollMarginTop: 96,
                borderRadius: 2,
                transition: 'box-shadow 0.25s ease, background-color 0.25s ease',
                boxShadow: sectionFlash ? '0 0 0 3px rgba(0, 137, 147, 0.18)' : 'none',
                bgcolor: sectionFlash ? 'rgba(0, 137, 147, 0.04)' : 'transparent',
            }}
        >
            <ProjectSectionCard
                title="Updates"
                subtitle="Latest project news and milestones"
                addable={canEdit}
                isOwner={canEdit}
                visibility={visibility}
                onVisibilityChange={onVisibilityChange}
                empty={!safeUpdates.length}
                emptyText="No updates yet"
                emptyActionLabel={canEdit ? 'Post Update' : undefined}
                onEmptyAction={canEdit ? () => onOpenEditor?.('updates', null) : undefined}
                onAdd={canEdit ? () => onOpenEditor?.('updates', null) : undefined}
            >
                <Stack spacing={2}>
                    {safeUpdates.length
                        ? safeUpdates.map((update, index) => {
                            const isHighlighted = highlightedUpdateId === update.id;

                            return (
                                <Paper
                                    key={update.id}
                                    variant="outlined"
                                    sx={{
                                        p: 2,
                                        borderRadius: 2,
                                        transition:
                                            'box-shadow 0.25s ease, border-color 0.25s ease, background-color 0.25s ease',
                                        borderColor: isHighlighted ? 'primary.main' : 'grey.200',
                                        boxShadow: isHighlighted
                                            ? '0 0 0 3px rgba(0, 137, 147, 0.14)'
                                            : 'none',
                                        bgcolor: isHighlighted ? 'primary.50' : 'background.paper',
                                    }}
                                >
                                    <Stack spacing={1}>
                                        <Stack
                                            direction={{ xs: 'column', sm: 'row' }}
                                            justifyContent="space-between"
                                            spacing={1}
                                        >
                                            <Box sx={{ minWidth: 0, flex: 1 }}>
                                                <Typography variant="body2" fontWeight={700}>
                                                    {update.title}
                                                </Typography>

                                                {update.authorName || update.dateLabel ? (
                                                    <Typography
                                                        variant="caption"
                                                        color="text.secondary"
                                                    >
                                                        {[update.authorName, update.dateLabel]
                                                            .filter(Boolean)
                                                            .join(' • ')}
                                                    </Typography>
                                                ) : null}
                                            </Box>

                                            <Stack
                                                direction="row"
                                                spacing={1}
                                                alignItems="center"
                                                justifyContent="flex-end"
                                            >
                                                {canEdit ? (
                                                    <IconButton
                                                        size="small"
                                                        onClick={(event) =>
                                                            onUpdateMenuClick?.(
                                                                event,
                                                                update,
                                                                index
                                                            )
                                                        }
                                                        sx={{ color: 'grey.500' }}
                                                    >
                                                        <MoreVertRounded sx={{ fontSize: 18 }} />
                                                    </IconButton>
                                                ) : null}
                                            </Stack>
                                        </Stack>

                                        {update.description ? (
                                            <Typography
                                                variant="body2"
                                                color="text.secondary"
                                            >
                                                {update.description}
                                            </Typography>
                                        ) : null}
                                    </Stack>
                                </Paper>
                            );
                        })
                        : null}
                </Stack>
            </ProjectSectionCard>
        </Box>
    );
}