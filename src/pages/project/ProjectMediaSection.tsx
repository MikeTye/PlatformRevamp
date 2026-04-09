import React from 'react';
import { Box, Typography } from '@mui/material';
import { MediaGallery } from '../../components/MediaGallery';

import type {
    ProjectEditorTarget,
    ProjectMediaItem,
    SectionVisibility,
} from './ProjectProfileView';
import { ProjectSectionCard } from './ProjectSectionCard';

type Props = {
    media?: ProjectMediaItem[];
    canEdit: boolean;
    visibility: SectionVisibility;
    onVisibilityChange?: (value: SectionVisibility) => void;
    onOpenEditor?: (section: ProjectEditorTarget, itemId?: string | null) => void;
    onMediaMenuClick?: (
        event: React.MouseEvent<HTMLElement>,
        item: ProjectMediaItem,
        index: number
    ) => void;
};

const MAX_MEDIA_ITEMS = 10;

export default function ProjectMediaSection({
    media,
    canEdit,
    visibility,
    onVisibilityChange,
    onOpenEditor,
    onMediaMenuClick,
}: Props) {
    const mediaItems = media || [];
    const mediaCount = mediaItems.length;
    const hasReachedLimit = mediaCount >= MAX_MEDIA_ITEMS;
    const canAddMore = canEdit && !hasReachedLimit;

    const galleryMediaItems = React.useMemo(
        () =>
            mediaItems.map((item) => ({
                id: item.id,
                type: item.contentType?.startsWith('video/') ? 'video' : 'image',
                url: item.assetUrl,
                caption: item.caption || 'Untitled media',
                date: item.createdAt || undefined,
                _source: item,
            })),
        [mediaItems]
    );

    return (
        <ProjectSectionCard
            title="Media"
            addable={canAddMore}
            onAdd={canAddMore ? () => onOpenEditor?.('media') : undefined}
            isOwner={canEdit}
            visibility={visibility}
            onVisibilityChange={canEdit ? onVisibilityChange : undefined}
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
                        {mediaCount} / {MAX_MEDIA_ITEMS} items
                    </Typography>

                    {hasReachedLimit ? (
                        <Typography variant="caption" color="warning.main" fontWeight={600}>
                            Maximum of {MAX_MEDIA_ITEMS} media items reached
                        </Typography>
                    ) : null}
                </Box>

                <MediaGallery
                    items={galleryMediaItems}
                    mode="carousel"
                    isOwner={canEdit}
                    onAdd={canAddMore ? () => onOpenEditor?.('media') : undefined}
                    onMenuClick={
                        canEdit
                            ? (e, item, index) => {
                                onMediaMenuClick?.(
                                    e,
                                    ((item as typeof item & { _source?: ProjectMediaItem })
                                        ._source ?? mediaItems[index]) as ProjectMediaItem,
                                    index
                                );
                            }
                            : undefined
                    }
                />
            </Box>
        </ProjectSectionCard>
    );
}