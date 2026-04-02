import React, { useState } from 'react';
import {
    Box,
    Typography,
    LinearProgress,
    Paper,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Button,
    Collapse,
    IconButton
} from
    '@mui/material';
import CheckCircleRounded from '@mui/icons-material/CheckCircleRounded';
import RadioButtonUncheckedRounded from '@mui/icons-material/RadioButtonUncheckedRounded';
import ExpandMoreRounded from '@mui/icons-material/ExpandMoreRounded';
import ExpandLessRounded from '@mui/icons-material/ExpandLessRounded';
import ArrowForwardRounded from '@mui/icons-material/ArrowForwardRounded';
import { ProjectStage } from './ProjectStageIndicator';
export interface CompletenessItem {
    id: string;
    label: string;
    isComplete: boolean;
    section: string;
    requiredForStage?: ProjectStage;
    description?: string;
}
interface ProfileCompletenessProps {
    items: CompletenessItem[];
    onItemClick?: (item: CompletenessItem) => void;
    title?: string;
}
export function ProfileCompleteness({
    items,
    onItemClick,
    title = 'Completeness'
}: ProfileCompletenessProps) {
    const [expanded, setExpanded] = useState(false);
    const completedCount = items.filter((i) => i.isComplete).length;
    const totalCount = items.length;
    const percentage = totalCount ? Math.round((completedCount / totalCount) * 100) : 0;
    // Get next incomplete item for the "Next step" prompt
    const nextAction = items.find((i) => !i.isComplete);
    return (
        <Paper
            variant="outlined"
            sx={{
                p: 2,
                bgcolor: 'grey.50',
                borderColor: 'grey.200',
                borderRadius: 2
            }}>

            <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
                mb={1}>

                <Typography variant="subtitle2" fontWeight="bold" color="text.primary">
                    {title}
                </Typography>
                <Typography variant="caption" fontWeight="bold" color="text.primary">
                    {percentage}%
                </Typography>
            </Box>

            <LinearProgress
                variant="determinate"
                value={percentage}
                sx={{
                    height: 8,
                    borderRadius: 4,
                    bgcolor: 'grey.200',
                    mb: 2,
                    '& .MuiLinearProgress-bar': {
                        bgcolor: percentage === 100 ? 'success.main' : 'primary.main',
                        borderRadius: 4
                    }
                }} />


            {nextAction && !expanded &&
                <Box
                    display="flex"
                    alignItems="center"
                    justifyContent="space-between"
                    sx={{
                        p: 1.5,
                        bgcolor: 'white',
                        borderRadius: 1,
                        border: 1,
                        borderColor: 'grey.200',
                        cursor: 'pointer',
                        '&:hover': {
                            borderColor: 'primary.main',
                            bgcolor: 'primary.50'
                        }
                    }}
                    onClick={() => onItemClick && onItemClick(nextAction)}>

                    <Box>
                        <Typography
                            variant="caption"
                            color="text.secondary"
                            display="block">

                            Next step
                        </Typography>
                        <Typography variant="body2" fontWeight="medium">
                            {nextAction.label}
                        </Typography>
                    </Box>
                    <ArrowForwardRounded
                        sx={{
                            fontSize: 16,
                            color: 'primary.main'
                        }} />

                </Box>
            }

            <Box mt={2}>
                <Button
                    fullWidth
                    size="small"
                    onClick={() => setExpanded(!expanded)}
                    endIcon={expanded ? <ExpandLessRounded /> : <ExpandMoreRounded />}
                    sx={{
                        textTransform: 'none',
                        color: 'text.secondary',
                        justifyContent: 'space-between'
                    }}>

                    {expanded ? 'Hide checklist' : 'View all items'}
                </Button>

                <Collapse in={expanded}>
                    <List
                        dense
                        disablePadding
                        sx={{
                            mt: 1
                        }}>

                        {items.map((item) =>
                            <ListItem
                                key={item.id}
                                disablePadding
                                sx={{
                                    py: 0.75,
                                    cursor: item.isComplete ? 'default' : 'pointer',
                                    opacity: item.isComplete ? 0.7 : 1,
                                    '&:hover': {
                                        bgcolor: item.isComplete ?
                                            'transparent' :
                                            'rgba(0,0,0,0.02)'
                                    }
                                }}
                                onClick={() =>
                                    !item.isComplete && onItemClick && onItemClick(item)
                                }>

                                <ListItemIcon
                                    sx={{
                                        minWidth: 32
                                    }}>

                                    {item.isComplete ?
                                        <CheckCircleRounded
                                            color="success"
                                            sx={{
                                                fontSize: 18
                                            }} /> :


                                        <RadioButtonUncheckedRounded
                                            color="disabled"
                                            sx={{
                                                fontSize: 18
                                            }} />

                                    }
                                </ListItemIcon>
                                <ListItemText
                                    primary={item.label}
                                    secondary={item.description}
                                    primaryTypographyProps={{
                                        variant: 'body2',
                                        color: item.isComplete ? 'text.secondary' : 'text.primary',
                                        sx: {
                                            textDecoration: item.isComplete ? 'line-through' : 'none'
                                        }
                                    }}
                                    secondaryTypographyProps={{
                                        variant: 'caption',
                                        color: 'text.secondary'
                                    }}
                                />

                                {!item.isComplete &&
                                    <ArrowForwardRounded
                                        sx={{
                                            fontSize: 14,
                                            color: 'grey.400',
                                            opacity: 0,
                                            transition: 'opacity 0.2s'
                                        }}
                                        className="arrow-icon" />

                                }
                            </ListItem>
                        )}
                    </List>
                </Collapse>
            </Box>
        </Paper>);

}