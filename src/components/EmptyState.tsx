import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import AddRounded from '@mui/icons-material/AddRounded';
interface EmptyStateProps {
  icon: React.ElementType;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}
export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction
}: EmptyStateProps) {
  return (
    <Box
      sx={{
        p: 4,
        borderRadius: 1,
        border: '1px dashed',
        borderColor: 'grey.300',
        bgcolor: 'grey.50',
        textAlign: 'center'
      }}>

      <Box
        sx={{
          width: 48,
          height: 48,
          borderRadius: '50%',
          bgcolor: 'grey.200',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mx: 'auto',
          mb: 2
        }}>

        <Icon
          sx={{
            fontSize: 24,
            color: 'grey.500'
          }} />

      </Box>
      <Typography
        variant="subtitle2"
        fontWeight="bold"
        color="text.primary"
        gutterBottom>

        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={2}>
        {description}
      </Typography>
      {actionLabel && onAction &&
      <Button
        variant="outlined"
        size="small"
        startIcon={
        <AddRounded
          sx={{
            fontSize: 16
          }} />

        }
        onClick={onAction}
        sx={{
          textTransform: 'none',
          borderColor: 'grey.300',
          color: 'text.secondary'
        }}>

          {actionLabel}
        </Button>
      }
    </Box>);

}