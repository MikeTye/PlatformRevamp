import React from 'react';
import {
    Box,
    FormControl,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    Stack,
    TextField,
    Typography,
} from '@mui/material';
import DescriptionRounded from '@mui/icons-material/DescriptionRounded';

interface CompanySidebarDocumentsProps {
    editingItem?: any;
    docName: string;
    docType: string;
    documentFile: File | null;
    onChangeName: (value: string) => void;
    onChangeType: (value: string) => void;
    onChangeFile: (file: File | null) => void;
    renderVisibilityToggle: () => React.ReactNode;
    renderUploadError: () => React.ReactNode;
}

export function CompanySidebarDocuments({
    editingItem,
    docName,
    docType,
    documentFile,
    onChangeName,
    onChangeType,
    onChangeFile,
    renderVisibilityToggle,
    renderUploadError,
}: CompanySidebarDocumentsProps) {
    return (
        <Stack spacing={3}>
            <Box>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    {editingItem ? 'Edit Document' : 'Add Document'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Upload company documents.
                </Typography>
            </Box>

            {renderVisibilityToggle()}
            {renderUploadError()}

            {!editingItem && (
                <Paper
                    variant="outlined"
                    sx={{ p: 3, borderStyle: 'dashed', textAlign: 'center', cursor: 'pointer' }}
                    component="label"
                >
                    <input
                        type="file"
                        hidden
                        onChange={(e) => {
                            const file = e.target.files?.[0] ?? null;
                            onChangeFile(file);
                            if (file && !docName.trim()) {
                                const inferredName = file.name.replace(/\.[^/.]+$/, '');
                                onChangeName(inferredName);
                            }
                        }}
                    />
                    {documentFile && (
                        <Typography variant="caption" color="text.secondary" display="block" mb={1}>
                            Selected: {documentFile.name}
                        </Typography>
                    )}
                    <DescriptionRounded sx={{ fontSize: 32, color: 'grey.400', mb: 1 }} />
                    <Typography variant="body2" color="text.secondary">
                        {editingItem ? 'Click to replace file' : 'Click to upload or drag and drop'}
                    </Typography>
                    <Typography variant="caption" color="text.disabled">
                        PDF, DOCX, XLSX
                    </Typography>
                </Paper>
            )}

            <TextField
                label="Document Name"
                fullWidth
                value={docName}
                onChange={(e) => onChangeName(e.target.value)}
            />

            <FormControl fullWidth>
                <InputLabel>Document Type</InputLabel>
                <Select
                    value={docType}
                    label="Document Type"
                    onChange={(e) => onChangeType(String(e.target.value))}
                >
                    <MenuItem value="General">General</MenuItem>
                    <MenuItem value="Report">Report</MenuItem>
                    <MenuItem value="Legal">Legal</MenuItem>
                    <MenuItem value="Financial">Financial</MenuItem>
                </Select>
            </FormControl>
        </Stack>
    );
}