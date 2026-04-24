import React from 'react';
import { Box, Paper, Stack, TextField, Typography } from '@mui/material';
import ImageRounded from '@mui/icons-material/ImageRounded';

interface CompanySidebarMediaProps {
    editingItem?: any;
    mediaCaption: string;
    onChangeCaption: (value: string) => void;
    mediaFile: File | null;
    onChangeFile: (file: File | null) => void;
    renderVisibilityToggle: () => React.ReactNode;
    renderUploadError: () => React.ReactNode;
}

export function CompanySidebarMedia({
    editingItem,
    mediaCaption,
    onChangeCaption,
    mediaFile,
    onChangeFile,
    renderVisibilityToggle,
    renderUploadError,
}: CompanySidebarMediaProps) {
    return (
        <Stack spacing={3}>
            <Box>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    {editingItem ? 'Edit Media' : 'Add Media'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    {editingItem
                        ? 'Update the media details. To replace the file, remove this item and upload a new one.'
                        : 'Upload photos and videos.'}
                </Typography>
            </Box>

            {renderVisibilityToggle()}
            {renderUploadError()}

            {!editingItem ? (
                <Paper
                    variant="outlined"
                    sx={{ p: 3, borderStyle: 'dashed', textAlign: 'center', cursor: 'pointer' }}
                    component="label"
                >
                    <input
                        type="file"
                        hidden
                        accept="image/*,video/*"
                        onChange={(e) => onChangeFile(e.target.files?.[0] ?? null)}
                    />
                    {mediaFile && (
                        <Typography variant="caption" color="text.secondary" display="block" mb={1}>
                            Selected: {mediaFile.name}
                        </Typography>
                    )}
                    <ImageRounded sx={{ fontSize: 32, color: 'grey.400', mb: 1 }} />
                    <Typography variant="body2" color="text.secondary">
                        Click to upload or drag and drop
                    </Typography>
                    <Typography variant="caption" color="text.disabled">
                        PNG, JPG, JPEG, WEBP, MP4
                    </Typography>
                </Paper>
            ) : (
                <Paper
                    variant="outlined"
                    sx={{
                        p: 2,
                        borderRadius: 2,
                        bgcolor: 'grey.50',
                        borderColor: 'grey.200',
                    }}
                >
                    <Typography variant="body2" fontWeight={500}>
                        Existing media
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        File replacement is not supported from this editor yet.
                    </Typography>
                </Paper>
            )}

            <TextField
                label="Caption"
                fullWidth
                value={mediaCaption}
                onChange={(e) => onChangeCaption(e.target.value)}
                placeholder="Describe this media..."
            />
        </Stack>
    );
}