import React from 'react';
import {
    Alert,
    Box,
    Button,
    Paper,
    Stack,
    TextField,
    Typography,
} from '@mui/material';
import ImageRounded from '@mui/icons-material/ImageRounded';

import type { ProjectMediaItem } from '../projectProfile.types';

type UploadState = {
    busy: boolean;
    error: string | null;
};

export interface ProjectMediaSectionProps {
    items: ProjectMediaItem[];
    editingMediaId: string | null;
    mediaCaption: string;
    mediaUpload: UploadState;
    saving: boolean;
    pendingMediaFile: File | null;
    pendingMediaPreviewUrl: string | null;
    onMediaCaptionChange: (value: string) => void;
    onPickFile: (file: File) => Promise<void> | void;
    onClearPending: () => void;
}

export default function SidebarMediaSection({
    items,
    editingMediaId,
    mediaCaption,
    mediaUpload,
    saving,
    pendingMediaFile,
    pendingMediaPreviewUrl,
    onMediaCaptionChange,
    onPickFile,
    onClearPending,
}: ProjectMediaSectionProps) {
    const editingItem =
        editingMediaId != null
            ? items.find((item) => item.id === editingMediaId) ?? null
            : null;

    const isAddingPendingMedia = !editingItem && !!pendingMediaFile;

    return (
        <Stack spacing={3}>
            {mediaUpload.error ? <Alert severity="error">{mediaUpload.error}</Alert> : null}

            {editingItem ? (
                <>
                    <Box>
                        <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                            Edit media
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Update the caption for this media item.
                        </Typography>
                    </Box>

                    <Paper variant="outlined" sx={{ p: 1.5 }}>
                        {'assetUrl' in editingItem && editingItem.assetUrl ? (
                            <Box
                                component="img"
                                src={editingItem.assetUrl}
                                alt={editingItem.caption || 'Project media'}
                                sx={{
                                    width: '100%',
                                    maxHeight: 280,
                                    objectFit: 'cover',
                                    borderRadius: 1.5,
                                    display: 'block',
                                }}
                            />
                        ) : (
                            <Box
                                sx={{
                                    height: 220,
                                    borderRadius: 1.5,
                                    bgcolor: 'grey.100',
                                    display: 'grid',
                                    placeItems: 'center',
                                }}
                            >
                                <ImageRounded sx={{ fontSize: 40, color: 'grey.500' }} />
                            </Box>
                        )}
                    </Paper>

                    <TextField
                        label="Caption"
                        fullWidth
                        value={mediaCaption}
                        onChange={(e) => onMediaCaptionChange(e.target.value)}
                        placeholder="Describe this media."
                        disabled={mediaUpload.busy || saving}
                    />
                </>
            ) : (
                <>
                    <Box>
                        <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                            Add media
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Upload a new media item to this project.
                        </Typography>
                    </Box>

                    {!isAddingPendingMedia ? (
                        <Paper
                            variant="outlined"
                            sx={{
                                p: 3,
                                borderStyle: 'dashed',
                                textAlign: 'center',
                                cursor: mediaUpload.busy ? 'default' : 'pointer',
                            }}
                            component="label"
                        >
                            <input
                                type="file"
                                hidden
                                accept="image/*,video/*"
                                disabled={mediaUpload.busy || saving}
                                onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    e.currentTarget.value = '';
                                    if (!file) return;
                                    await onPickFile(file);
                                }}
                            />

                            <ImageRounded
                                sx={{
                                    fontSize: 32,
                                    color: 'grey.400',
                                    mb: 1,
                                }}
                            />

                            <Typography variant="body2" color="text.secondary">
                                Click to upload or drag and drop
                            </Typography>

                            <Typography variant="caption" color="text.disabled">
                                PNG, JPG up to 10MB
                            </Typography>
                        </Paper>
                    ) : (
                        <Stack spacing={2}>
                            <Paper variant="outlined" sx={{ p: 1.5 }}>
                                {pendingMediaFile?.type?.startsWith('image/') && pendingMediaPreviewUrl ? (
                                    <Box
                                        component="img"
                                        src={pendingMediaPreviewUrl}
                                        alt="Pending media preview"
                                        sx={{
                                            width: '100%',
                                            maxHeight: 280,
                                            objectFit: 'cover',
                                            borderRadius: 1.5,
                                            display: 'block',
                                        }}
                                    />
                                ) : pendingMediaFile?.type?.startsWith('video/') && pendingMediaPreviewUrl ? (
                                    <Box
                                        component="video"
                                        src={pendingMediaPreviewUrl}
                                        controls
                                        sx={{
                                            width: '100%',
                                            maxHeight: 280,
                                            borderRadius: 1.5,
                                            display: 'block',
                                        }}
                                    />
                                ) : (
                                    <Box
                                        sx={{
                                            height: 220,
                                            borderRadius: 1.5,
                                            bgcolor: 'grey.100',
                                            display: 'grid',
                                            placeItems: 'center',
                                        }}
                                    >
                                        <ImageRounded sx={{ fontSize: 40, color: 'grey.500' }} />
                                    </Box>
                                )}
                            </Paper>

                            <Typography variant="caption" color="text.secondary">
                                {pendingMediaFile?.name}
                            </Typography>

                            <Stack direction="row" spacing={1}>
                                <Button
                                    variant="outlined"
                                    component="label"
                                    disabled={mediaUpload.busy || saving}
                                >
                                    Replace file
                                    <input
                                        type="file"
                                        hidden
                                        accept="image/*,video/*"
                                        onChange={async (e) => {
                                            const file = e.target.files?.[0];
                                            e.currentTarget.value = '';
                                            if (!file) return;
                                            await onPickFile(file);
                                        }}
                                    />
                                </Button>

                                <Button
                                    color="inherit"
                                    variant="text"
                                    onClick={onClearPending}
                                    disabled={mediaUpload.busy || saving}
                                >
                                    Cancel
                                </Button>
                            </Stack>
                        </Stack>
                    )}

                    <TextField
                        label="Caption"
                        fullWidth
                        value={mediaCaption}
                        onChange={(e) => onMediaCaptionChange(e.target.value)}
                        placeholder="Describe this media."
                        disabled={mediaUpload.busy || saving}
                    />
                </>
            )}
        </Stack>
    );
}