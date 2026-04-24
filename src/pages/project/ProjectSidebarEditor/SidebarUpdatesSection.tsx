// ProjectSidebarEditor/SidebarUpdatesSection.tsx
import React from 'react';
import {
    Box,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
    Stack,
    TextField,
    Typography,
} from '@mui/material';

import type { ProjectStage } from '../projectProfile.types';

type StageOption = {
    value: string;
    label: string;
};

type SidebarUpdatesSectionProps = {
    editingItem?: {
        id?: string | null;
    } | null;
    updateType: 'progress' | 'stage';
    stageValue: ProjectStage | '';
    stageOptions: readonly StageOption[];
    updateTitle: string;
    updateDateLabel: string;
    updateDescription: string;
    onStageChange: (value: ProjectStage) => void;
    onUpdateTitleChange: (value: string) => void;
    onUpdateDateLabelChange: (value: string) => void;
    onUpdateDescriptionChange: (value: string) => void;
};

export default function SidebarUpdatesSection({
    editingItem,
    updateType,
    stageValue,
    stageOptions,
    updateTitle,
    updateDateLabel,
    updateDescription,
    onStageChange,
    onUpdateTitleChange,
    onUpdateDateLabelChange,
    onUpdateDescriptionChange,
}: SidebarUpdatesSectionProps) {
    return (
        <Stack spacing={3}>
            <Box>
                <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                    {editingItem ? 'Edit Update' : 'Post Update'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Share progress with followers.
                </Typography>
            </Box>

            {updateType === 'stage' && (
                <FormControl fullWidth size="small">
                    <InputLabel>New Stage</InputLabel>
                    <Select
                        value={stageValue}
                        label="New Stage"
                        onChange={(e) => onStageChange(e.target.value as ProjectStage)}
                    >
                        {stageOptions.map((option) => (
                            <MenuItem key={option.value} value={option.value}>
                                {option.label}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            )}

            <TextField
                label="Title"
                fullWidth
                size="small"
                value={updateTitle}
                onChange={(e) => onUpdateTitleChange(e.target.value)}
                placeholder="e.g. Baseline survey completed"
            />

            <TextField
                label="Date"
                type="date"
                fullWidth
                size="small"
                value={updateDateLabel}
                onChange={(e) => onUpdateDateLabelChange(e.target.value)}
                InputLabelProps={{ shrink: true }}
            />

            <TextField
                label="Description"
                fullWidth
                size="small"
                multiline
                minRows={4}
                value={updateDescription}
                onChange={(e) => onUpdateDescriptionChange(e.target.value)}
                placeholder="Share what's new..."
            />
        </Stack>
    );
}