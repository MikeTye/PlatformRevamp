import React from 'react';
import { Box, Typography, Tooltip, Chip } from '@mui/material';
import FiberManualRecordRounded from '@mui/icons-material/FiberManualRecordRounded';
export type FreshnessStatus =
'up-to-date' |
'needs-attention' |
'stale' |
'not-applicable';
interface ReportingFreshnessProps {
  status: FreshnessStatus;
  lastUpdateDate?: string;
  overdueDocsCount?: number;
  showLabel?: boolean;
}
export function ReportingFreshness({
  status,
  lastUpdateDate,
  overdueDocsCount = 0,
  showLabel = true
}: ReportingFreshnessProps) {
  const getConfig = () => {
    switch (status) {
      case 'up-to-date':
        return {
          color: '#2e7d32',
          bgcolor: '#e8f5e9',
          dotColor: '#4caf50',
          label: 'Docs up to date',
          tooltip:
          'All expected documents are current. Recent activity detected.'
        };
      case 'needs-attention':
        return {
          color: '#ed6c02',
          bgcolor: '#fff3e0',
          dotColor: '#ff9800',
          label: 'Some docs may be outdated',
          tooltip: `Project reporting may be behind schedule. ${overdueDocsCount > 0 ? `${overdueDocsCount} documents overdue.` : 'No recent updates.'}`
        };
      case 'stale':
        return {
          color: '#d32f2f',
          bgcolor: '#ffebee',
          dotColor: '#f44336',
          label: 'Not recently updated',
          tooltip: 'Multiple documents overdue or no activity for 180+ days.'
        };
      case 'not-applicable':
      default:
        return {
          color: '#757575',
          bgcolor: '#f5f5f5',
          dotColor: '#9e9e9e',
          label: 'Early stage',
          tooltip:
          'Project is at an early stage where periodic reporting is not yet expected.'
        };
    }
  };
  const config = getConfig();
  return (
    <Tooltip title={config.tooltip} arrow>
      <Box
        display="inline-flex"
        alignItems="center"
        gap={1}
        sx={{
          bgcolor: showLabel ? config.bgcolor : 'transparent',
          color: config.color,
          px: showLabel ? 1.5 : 0,
          py: showLabel ? 0.5 : 0,
          borderRadius: '4px',
          border: showLabel ? 1 : 0,
          borderColor: showLabel ? 'rgba(0,0,0,0.05)' : 'transparent',
          cursor: 'help'
        }}>

        <FiberManualRecordRounded
          sx={{
            fontSize: 10,
            color: config.dotColor
          }} />

        {showLabel &&
        <Typography
          variant="caption"
          fontWeight="bold"
          lineHeight={1}
          sx={{
            fontSize: '0.75rem'
          }}>

            {config.label}
          </Typography>
        }
      </Box>
    </Tooltip>);

}