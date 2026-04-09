import React from 'react';
import { Box, Typography, IconButton } from '@mui/material';
import AddRounded from '@mui/icons-material/AddRounded';
import EditRounded from '@mui/icons-material/EditRounded';

interface CompanySectionHeaderProps {
    title: string;
    count?: number;
    onEdit?: () => void;
    onAdd?: () => void;
}

export function CompanySectionHeader({
    title,
    count,
    onEdit,
    onAdd,
}: CompanySectionHeaderProps) {
    return (
        <Box
            sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                p: 2,
                borderBottom: 1,
                borderColor: 'grey.100',
                bgcolor: 'grey.50',
            }}
        >
            <Typography variant="subtitle2" fontWeight="bold" color="text.primary">
                {title}
                {count !== undefined && (
                    <Typography component="span" color="text.disabled" fontWeight="normal">
                        {' '}
                        ({count})
                    </Typography>
                )}
            </Typography>

            <Box display="flex" alignItems="center" gap={1}>
                {onAdd && (
                    <IconButton
                        size="small"
                        onClick={onAdd}
                        sx={{
                            color: 'grey.700',
                            bgcolor: 'white',
                            border: 1,
                            borderColor: 'grey.300',
                            width: 28,
                            height: 28,
                            '&:hover': {
                                color: 'primary.main',
                                bgcolor: 'primary.50',
                                borderColor: 'primary.main',
                            },
                        }}
                    >
                        <AddRounded sx={{ fontSize: 16 }} />
                    </IconButton>
                )}

                {onEdit && (
                    <IconButton
                        size="small"
                        onClick={onEdit}
                        sx={{
                            color: 'grey.700',
                            bgcolor: 'white',
                            border: 1,
                            borderColor: 'grey.300',
                            width: 28,
                            height: 28,
                            '&:hover': {
                                color: 'primary.main',
                                bgcolor: 'primary.50',
                                borderColor: 'primary.main',
                            },
                        }}
                    >
                        <EditRounded sx={{ fontSize: 16 }} />
                    </IconButton>
                )}
            </Box>
        </Box>
    );
}