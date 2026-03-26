import React from 'react';
import { Chip, Tooltip, SxProps, Theme } from '@mui/material';
export type ProjectStage =
'Exploration' |
'Concept' |
'Design' |
'Listed' |
'Validation' |
'Registered' |
'Issued' |
'Closed';
interface ProjectStageIndicatorProps {
  stage: ProjectStage;
  size?: 'small' | 'medium';
  sx?: SxProps<Theme>;
}
const stageTooltips: Record<ProjectStage, string> = {
  Exploration:
  'A potential carbon project is being explored, but no specific project, assets, or boundaries have been formally defined.',
  Concept:
  'A specific carbon project is defined in principle, with identified assets, boundaries, and an intended carbon pathway.',
  Design:
  'The carbon project is materially designed, with core assumptions, documentation, and monitoring approach drafted.',
  Listed:
  'The project has been formally submitted to a standard or registry and is now listed for validation review.',
  Validation:
  'The project is undergoing third-party validation and formal review against the selected standard and methodology.',
  Registered:
  'The project has been approved and registered under a standard, making it eligible to generate credits once monitoring conditions are met.',
  Issued:
  'Verified emission reductions or removals have been issued as credits and exist in a registry account.',
  Closed:
  'The carbon project is no longer active in the lifecycle, with no further validation, verification, or issuance expected.'
};
const getStageStyles = (stage: ProjectStage) => {
  switch (stage) {
    case 'Exploration':
      return {
        bgcolor: 'grey.50',
        color: 'grey.500',
        borderColor: 'grey.200'
      };
    case 'Concept':
      return {
        bgcolor: 'grey.100',
        color: 'grey.600',
        borderColor: 'grey.200'
      };
    case 'Design':
      return {
        bgcolor: 'grey.100',
        color: 'grey.600',
        borderColor: 'grey.300'
      };
    case 'Listed':
      return {
        bgcolor: 'grey.200',
        color: 'grey.700',
        borderColor: 'grey.300'
      };
    case 'Validation':
      return {
        bgcolor: 'grey.200',
        color: 'grey.700',
        borderColor: 'grey.400'
      };
    case 'Registered':
      return {
        bgcolor: 'grey.300',
        color: 'grey.800',
        borderColor: 'grey.400'
      };
    case 'Issued':
      return {
        bgcolor: 'grey.800',
        color: 'common.white',
        borderColor: 'grey.800'
      };
    case 'Closed':
      return {
        bgcolor: 'grey.400',
        color: 'common.white',
        borderColor: 'grey.400'
      };
  }
};
export function ProjectStageIndicator({
  stage,
  size = 'small',
  sx = {}
}: ProjectStageIndicatorProps) {
  const styles = getStageStyles(stage);
  return (
    <Tooltip title={stageTooltips[stage]} arrow placement="bottom">
      <Chip
        label={stage}
        size={size}
        sx={{
          height: size === 'small' ? 24 : 32,
          fontSize: size === 'small' ? '0.75rem' : '0.875rem',
          fontWeight: 500,
          cursor: 'help',
          border: 1,
          borderRadius: '4px',
          ...styles,
          ...sx
        }} />

    </Tooltip>);

}