import React from 'react';
import {
    Box,
    FormControl,
    FormControlLabel,
    InputLabel,
    MenuItem,
    Select,
    Stack,
    Switch,
    TextField,
    Typography,
} from '@mui/material';

import type { ProjectOpportunity } from '../ProjectProfileView';

export interface ProjectOpportunitiesSectionProps {
    items: ProjectOpportunity[];
    editingOpportunityId: string | null;
    opportunityType: string;
    opportunityDescription: string;
    opportunityUrgent: boolean;
    opportunityTypeOptions: readonly string[];
    onOpportunityTypeChange: (value: string) => void;
    onOpportunityDescriptionChange: (value: string) => void;
    onOpportunityUrgentChange: (value: boolean) => void;
}

export default function ProjectOpportunitiesSection({
    items,
    editingOpportunityId,
    opportunityType,
    opportunityDescription,
    opportunityUrgent,
    opportunityTypeOptions,
    onOpportunityTypeChange,
    onOpportunityDescriptionChange,
    onOpportunityUrgentChange,
}: ProjectOpportunitiesSectionProps) {
    const editingItem =
        editingOpportunityId != null
            ? items.find((item) => item.id === editingOpportunityId) ?? null
            : null;

    return (
        <Stack spacing={3}>
            <Box>
                <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                    {editingItem ? 'Edit Opportunity' : 'Add Opportunity'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    What does this project need?
                </Typography>
            </Box>

            <FormControl fullWidth size="small">
                <InputLabel>Type</InputLabel>
                <Select
                    value={opportunityType}
                    label="Type"
                    onChange={(e) => onOpportunityTypeChange(e.target.value)}
                >
                    {opportunityTypeOptions.map((type) => (
                        <MenuItem key={type} value={type}>
                            {type}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>

            <TextField
                label="Description"
                fullWidth
                size="small"
                multiline
                minRows={3}
                value={opportunityDescription}
                onChange={(e) => onOpportunityDescriptionChange(e.target.value)}
                placeholder="Describe what you're looking for..."
            />

            <FormControlLabel
                control={
                    <Switch
                        checked={opportunityUrgent}
                        onChange={(e) => onOpportunityUrgentChange(e.target.checked)}
                    />
                }
                label={<Typography variant="body2">Mark as priority</Typography>}
            />
        </Stack>
    );
}