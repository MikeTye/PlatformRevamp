import React from 'react';
import {
    Alert,
    Button,
    FormControl,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    Stack,
    TextField,
    Typography,
    Box,
} from '@mui/material';
import DescriptionRounded from '@mui/icons-material/DescriptionRounded';

import type { ProjectDocument } from '../projectProfile.types';

type UploadState = {
    busy: boolean;
    error: string | null;
};

type ProjectDocumentStatus = 'Draft' | 'Final';

export interface ProjectDocumentsSectionProps {
    items: ProjectDocument[];
    editingDocumentId: string | null;
    documentName: string;
    documentType: string;
    documentStatus: ProjectDocumentStatus;
    documentUpload: UploadState;
    pendingDocumentFile: File | null;
    documentTypeOptions: readonly string[];
    onDocumentNameChange: (value: string) => void;
    onDocumentTypeChange: (value: string) => void;
    onDocumentStatusChange: (value: ProjectDocumentStatus) => void;
    onPickFile: (file: File) => Promise<void> | void;
}

export default function SidebarDocumentsSection({
    items,
    editingDocumentId,
    documentName,
    documentType,
    documentStatus,
    documentUpload,
    pendingDocumentFile,
    documentTypeOptions,
    onDocumentNameChange,
    onDocumentTypeChange,
    onDocumentStatusChange,
    onPickFile,
}: ProjectDocumentsSectionProps) {
    const editingItem =
        editingDocumentId != null
            ? items.find((item) => item.id === editingDocumentId) ?? null
            : null;

    return (
        <Stack spacing={3}>
            <Box>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    {editingItem ? 'Edit Document' : 'Add Document'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Upload project documents.
                </Typography>
            </Box>

            {documentUpload.error ? (
                <Alert severity="error">{documentUpload.error}</Alert>
            ) : null}

            {!editingItem && (
                <Paper
                    variant="outlined"
                    sx={{
                        p: 3,
                        borderStyle: 'dashed',
                        textAlign: 'center',
                        cursor: documentUpload.busy ? 'default' : 'pointer',
                        opacity: documentUpload.busy ? 0.7 : 1,
                    }}
                    component="label"
                >
                    <input
                        type="file"
                        hidden
                        onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) void onPickFile(file);
                            e.currentTarget.value = '';
                        }}
                    />

                    <DescriptionRounded
                        sx={{
                            fontSize: 32,
                            color: 'grey.400',
                            mb: 1,
                        }}
                    />

                    <Typography variant="body2" color="text.secondary">
                        {pendingDocumentFile
                            ? pendingDocumentFile.name
                            : 'Click to upload or drag and drop'}
                    </Typography>

                    <Typography variant="caption" color="text.disabled">
                        PDF, DOCX, XLSX up to 25MB
                    </Typography>
                </Paper>
            )}

            <TextField
                label="Document Name"
                fullWidth
                value={documentName}
                onChange={(e) => onDocumentNameChange(e.target.value)}
            />

            <FormControl fullWidth>
                <InputLabel>Document Type</InputLabel>
                <Select
                    value={documentType}
                    label="Document Type"
                    onChange={(e) => onDocumentTypeChange(e.target.value)}
                >
                    {documentTypeOptions.map((type) => (
                        <MenuItem key={type} value={type}>
                            {type}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>

            <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                    value={documentStatus}
                    label="Status"
                    onChange={(e) => onDocumentStatusChange(e.target.value as ProjectDocumentStatus)}
                >
                    <MenuItem value="Draft">Draft</MenuItem>
                    <MenuItem value="Final">Final</MenuItem>
                </Select>
            </FormControl>

            {editingItem?.assetUrl ? (
                <Stack direction="row" spacing={1}>
                    <Button
                        variant="text"
                        href={editingItem.assetUrl}
                        target="_blank"
                        rel="noreferrer"
                        sx={{ px: 0 }}
                    >
                        Open document
                    </Button>
                </Stack>
            ) : null}
        </Stack>
    );
}