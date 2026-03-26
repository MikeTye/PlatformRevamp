import React from 'react';
import {
  Chip,
  Tooltip,
  Box,
  Typography,
  Link,
  SxProps,
  Theme } from
'@mui/material';
import LinkRounded from '@mui/icons-material/LinkRounded';
import DescriptionRounded from '@mui/icons-material/DescriptionRounded';
import CheckCircleRounded from '@mui/icons-material/CheckCircleRounded';
import InfoRounded from '@mui/icons-material/InfoRounded';
export type ProvenanceType =
'self-reported' |
'registry-linked' |
'document-backed' |
'platform-verified';
export interface ProvenanceMetadata {
  type: ProvenanceType;
  sourceName?: string;
  sourceUrl?: string;
  documentName?: string;
  uploadDate?: string;
  verifiedAt?: string;
  verifiedBy?: string;
  lastUpdated?: string;
}
interface ProvenanceLabelProps {
  provenance?: ProvenanceMetadata;
  size?: 'small' | 'medium';
  sx?: SxProps<Theme>;
  showSelfReported?: boolean;
}
export function ProvenanceLabel({
  provenance,
  size = 'small',
  sx = {},
  showSelfReported = true
}: ProvenanceLabelProps) {
  // Default to self-reported if no metadata provided
  const type = provenance?.type || 'self-reported';
  if (type === 'self-reported' && !showSelfReported) {
    return null;
  }
  const getLabelContent = () => {
    switch (type) {
      case 'registry-linked':
        return (
          <Box display="flex" alignItems="center" gap={0.5}>
            <LinkRounded
              sx={{
                fontSize: size === 'small' ? 12 : 14
              }} />

            <Typography variant="caption" fontWeight="medium" lineHeight={1}>
              {provenance?.sourceName || 'Registry'}
            </Typography>
          </Box>);

      case 'document-backed':
        return (
          <Box display="flex" alignItems="center" gap={0.5}>
            <DescriptionRounded
              sx={{
                fontSize: size === 'small' ? 12 : 14
              }} />

            <Typography variant="caption" fontWeight="medium" lineHeight={1}>
              Document
            </Typography>
          </Box>);

      case 'platform-verified':
        return (
          <Box display="flex" alignItems="center" gap={0.5}>
            <CheckCircleRounded
              sx={{
                fontSize: size === 'small' ? 12 : 14
              }} />

            <Typography variant="caption" fontWeight="medium" lineHeight={1}>
              Verified
            </Typography>
          </Box>);

      case 'self-reported':
      default:
        return (
          <Typography variant="caption" color="text.secondary" lineHeight={1}>
            Self-reported
          </Typography>);

    }
  };
  const getTooltipContent = () => {
    switch (type) {
      case 'registry-linked':
        return (
          <Box>
            <Typography variant="caption" display="block" fontWeight="bold">
              Source: {provenance?.sourceName}
            </Typography>
            {provenance?.sourceUrl &&
            <Link
              href={provenance.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              color="inherit"
              underline="hover"
              sx={{
                fontSize: '0.7rem'
              }}>

                View Registry Entry ↗
              </Link>
            }
            {provenance?.lastUpdated &&
            <Typography
              variant="caption"
              display="block"
              color="rgba(255,255,255,0.7)"
              mt={0.5}>

                Last checked: {provenance.lastUpdated}
              </Typography>
            }
          </Box>);

      case 'document-backed':
        return (
          <Box>
            <Typography variant="caption" display="block" fontWeight="bold">
              Source Document
            </Typography>
            <Typography variant="caption" display="block">
              {provenance?.documentName}
            </Typography>
            {provenance?.uploadDate &&
            <Typography
              variant="caption"
              display="block"
              color="rgba(255,255,255,0.7)"
              mt={0.5}>

                Uploaded: {provenance.uploadDate}
              </Typography>
            }
          </Box>);

      case 'platform-verified':
        return (
          <Box>
            <Typography variant="caption" display="block" fontWeight="bold">
              Platform Verified
            </Typography>
            <Typography variant="caption" display="block">
              Verified by {provenance?.verifiedBy || 'Admin'}
            </Typography>
            {provenance?.verifiedAt &&
            <Typography
              variant="caption"
              display="block"
              color="rgba(255,255,255,0.7)"
              mt={0.5}>

                Date: {provenance.verifiedAt}
              </Typography>
            }
          </Box>);

      case 'self-reported':
      default:
        return 'Data entered directly by project developer';
    }
  };
  const getChipStyles = () => {
    const baseStyles = {
      height: size === 'small' ? 20 : 24,
      fontSize: size === 'small' ? '0.625rem' : '0.75rem',
      cursor: 'help',
      '& .MuiChip-label': {
        px: 1
      },
      ...sx
    };
    switch (type) {
      case 'registry-linked':
        return {
          ...baseStyles,
          bgcolor: '#e3f2fd',
          color: '#1565c0',
          border: '1px solid #bbdefb' // blue.100
        };
      case 'document-backed':
        return {
          ...baseStyles,
          bgcolor: '#e0f2f1',
          color: '#00695c',
          border: '1px solid #b2dfdb' // teal.100
        };
      case 'platform-verified':
        return {
          ...baseStyles,
          bgcolor: '#e8f5e9',
          color: '#2e7d32',
          border: '1px solid #c8e6c9' // green.100
        };
      case 'self-reported':
      default:
        return {
          ...baseStyles,
          bgcolor: 'grey.50',
          color: 'grey.500',
          border: '1px solid',
          borderColor: 'grey.200'
        };
    }
  };
  return (
    <Tooltip title={getTooltipContent()} arrow placement="top">
      <Chip label={getLabelContent()} sx={getChipStyles()} size="small" />
    </Tooltip>);

}