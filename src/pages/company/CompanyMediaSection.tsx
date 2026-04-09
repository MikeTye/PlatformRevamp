import React from 'react';
import { Box, Paper } from '@mui/material';
import { MediaGallery } from '../../components/MediaGallery';
import { EmptyState } from '../../components/EmptyState';
import ImageRounded from '@mui/icons-material/ImageRounded';
import type { CompanyProfile } from './companyProfile.types';
import { CompanySectionHeader } from './CompanyHeaderSection';

interface CompanyMediaSectionProps {
    company: CompanyProfile;
    isEditMode: boolean;
    canEdit: boolean;
    onAddMedia?: () => void;
    onMediaMenuClick?: (
        event: React.MouseEvent<HTMLElement>,
        item: any,
        index: number
    ) => void;
}

export function CompanyMediaSection({
    company,
    isEditMode,
    canEdit,
    onAddMedia,
    onMediaMenuClick,
}: CompanyMediaSectionProps) {
    const mediaItems = (company.media || []).map((item: any) => ({
        id: item.id,
        type: item.contentType?.startsWith('video/') ? 'video' : 'image',
        url: item.url || item.assetUrl || '',
        caption: item.caption || 'Untitled media',
        date: item.date || item.createdAt || undefined,
        kind: item.kind,
        contentType: item.contentType,
        isCover: item.isCover,
        _source: item,
    }));

    const showAdd = isEditMode && canEdit ? onAddMedia : undefined;
    const showMenu = isEditMode && canEdit && onMediaMenuClick;

    return (
        <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
            <CompanySectionHeader title="Media" onAdd={showAdd} />
            <Box p={3}>
                {mediaItems.length ? (
                    <MediaGallery
                        items={mediaItems}
                        mode="carousel"
                        isOwner={isEditMode && canEdit}
                        onAdd={showAdd}
                        onMenuClick={
                            showMenu
                                ? (e, item, index) => {
                                    onMediaMenuClick?.(
                                        e,
                                        (item as typeof item & { _source?: any })._source ?? company.media?.[index],
                                        index
                                    );
                                }
                                : undefined
                        }
                        emptyStateMessage="No media yet. Add photos and videos to showcase your work."
                    />
                ) : (
                    <EmptyState
                        icon={ImageRounded}
                        title="No media yet"
                        description="Add photos and videos to showcase your work."
                        actionLabel={isEditMode && canEdit ? 'Add Media' : undefined}
                        onAction={showAdd}
                    />
                )}
            </Box>
        </Paper>
    );
}