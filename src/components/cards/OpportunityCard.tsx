import React from 'react';
import {
    Card,
    Box,
    Typography,
    Chip,
    IconButton,
    Button,
    Stack,
    CardContent
} from
    '@mui/material';
import BookmarkRounded from '@mui/icons-material/BookmarkRounded';
import BookmarkBorderRounded from '@mui/icons-material/BookmarkBorderRounded';
import AttachMoneyRounded from '@mui/icons-material/AttachMoneyRounded';
import TrendingUpRounded from '@mui/icons-material/TrendingUpRounded';
import PeopleRounded from '@mui/icons-material/PeopleRounded';
import BarChartRounded from '@mui/icons-material/BarChartRounded';
import ShieldRounded from '@mui/icons-material/ShieldRounded';
import BusinessRounded from '@mui/icons-material/BusinessRounded';
import EmailRounded from '@mui/icons-material/EmailRounded';
import { ProjectStageIndicator, ProjectStage } from '../ProjectStageIndicator';
export type OpportunityType =
    | 'Financing'
    | 'Technical Advisor'
    | 'Buyers'
    | 'MRV Provider'
    | 'Insurance';
export interface OpportunityCardProps {
    id: string;
    type: OpportunityType;
    description: string;
    projectName: string;
    projectUpid: string;
    developer: string;
    stage: ProjectStage;
    country: string;
    countryCode: string;
    urgent: boolean;
    isSaved?: boolean;
    onClick?: () => void;
    onToggleSave?: (e: React.MouseEvent) => void;
    onProjectClick?: (e: React.MouseEvent) => void;
    onContactClick?: (e: React.MouseEvent) => void;
}
export function OpportunityCard({
    id,
    type,
    description,
    projectName,
    projectUpid,
    developer,
    stage,
    country,
    countryCode,
    urgent,
    isSaved,
    onClick,
    onToggleSave,
    onProjectClick,
    onContactClick
}: OpportunityCardProps) {
    const getIcon = (type: OpportunityType) => {
        switch (type) {
            case 'Financing':
                return (
                    <AttachMoneyRounded
                        sx={{
                            fontSize: 20
                        }} />);


            case 'Technical Advisor':
                return (
                    <TrendingUpRounded
                        sx={{
                            fontSize: 20
                        }} />);


            case 'Buyers':
                return (
                    <PeopleRounded
                        sx={{
                            fontSize: 20
                        }} />);


            case 'MRV Provider':
                return (
                    <BarChartRounded
                        sx={{
                            fontSize: 20
                        }} />);


            case 'Insurance':
                return (
                    <ShieldRounded
                        sx={{
                            fontSize: 20
                        }} />);


            default:
                return (
                    <BusinessRounded
                        sx={{
                            fontSize: 20
                        }} />);


        }
    };
    return (
        <Card
            variant="outlined"
            onClick={onClick}
            sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'border-color 0.2s, box-shadow 0.2s',
                cursor: onClick ? 'pointer' : 'default',
                '&:hover': onClick ?
                    {
                        borderColor: 'grey.400',
                        boxShadow: 1
                    } :
                    undefined
            }}>

            <CardContent
                sx={{
                    p: 2,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    '&:last-child': {
                        pb: 2
                    }
                }}>

                <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="flex-start"
                    mb={1}>

                    <Box display="flex" alignItems="center" gap={1.5}>
                        <Box
                            sx={{
                                width: 36,
                                height: 36,
                                borderRadius: 1,
                                bgcolor: 'grey.100',
                                color: 'grey.700',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>

                            {getIcon(type)}
                        </Box>
                        <Box>
                            <Typography
                                variant="subtitle2"
                                fontWeight="bold"
                                lineHeight={1.2}>

                                {type}
                            </Typography>
                            {urgent &&
                                <Typography
                                    variant="caption"
                                    color="warning.main"
                                    fontWeight="bold">

                                    Priority
                                </Typography>
                            }
                        </Box>
                    </Box>
                    <Box display="flex" gap={1}>
                        {urgent &&
                            <Chip
                                label="Urgent"
                                size="small"
                                color="warning"
                                sx={{
                                    height: 20,
                                    fontSize: '0.625rem',
                                    fontWeight: 600
                                }} />

                        }
                        {onToggleSave &&
                            <IconButton
                                size="small"
                                onClick={onToggleSave}
                                sx={{
                                    color: isSaved ? 'primary.main' : 'grey.300',
                                    p: 0.5
                                }}>

                                {isSaved ?
                                    <BookmarkRounded fontSize="small" /> :

                                    <BookmarkBorderRounded fontSize="small" />
                                }
                            </IconButton>
                        }
                    </Box>
                </Box>

                <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        lineHeight: 1.4,
                        mb: 1.5,
                        flexGrow: 1
                    }}>

                    {description}
                </Typography>

                <Box
                    sx={{
                        mt: 'auto',
                        pt: 2,
                        borderTop: 1,
                        borderColor: 'grey.100'
                    }}>

                    <Typography
                        variant="subtitle2"
                        fontWeight="medium"
                        color="text.primary"
                        sx={{
                            cursor: onProjectClick ? 'pointer' : 'default',
                            '&:hover': onProjectClick ?
                                {
                                    textDecoration: 'underline'
                                } :
                                undefined,
                            mb: 0.5
                        }}
                        onClick={onProjectClick}>

                        {projectName}
                    </Typography>
                    <Typography
                        variant="caption"
                        color="text.secondary"
                        display="block"
                        mb={1.5}>

                        by {developer}
                    </Typography>

                    <Stack
                        direction="row"
                        spacing={1}
                        alignItems="center"
                        flexWrap="wrap"
                        gap={1}>

                        <ProjectStageIndicator stage={stage} />
                        <Box display="flex" alignItems="center" gap={0.5}>
                            <Typography fontSize="1rem">
                                {countryCode || '🏳️'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                {country}
                            </Typography>
                        </Box>
                    </Stack>

                    {onContactClick &&
                        <Button
                            variant="outlined"
                            fullWidth
                            size="small"
                            startIcon={<EmailRounded />}
                            onClick={(e) => {
                                e.stopPropagation();
                                onContactClick(e);
                            }}
                            sx={{
                                mt: 2,
                                textTransform: 'none',
                                borderColor: 'grey.300',
                                color: 'text.primary'
                            }}>

                            Contact Developer
                        </Button>
                    }
                </Box>
            </CardContent>
        </Card>);

}