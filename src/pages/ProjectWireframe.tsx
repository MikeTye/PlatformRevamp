import React, { useEffect, useState, Component } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import BusinessRounded from '@mui/icons-material/BusinessRounded';
import ExpandMoreRounded from '@mui/icons-material/ExpandMoreRounded';
import ExpandLessRounded from '@mui/icons-material/ExpandLessRounded';
import AccessTimeRounded from '@mui/icons-material/AccessTimeRounded';
import DescriptionRounded from '@mui/icons-material/DescriptionRounded';
import ImageRounded from '@mui/icons-material/ImageRounded';
import AttachMoneyRounded from '@mui/icons-material/AttachMoneyRounded';
import PeopleRounded from '@mui/icons-material/PeopleRounded';
import MapRounded from '@mui/icons-material/MapRounded';
import ParkRounded from '@mui/icons-material/ParkRounded';
import TrendingUpRounded from '@mui/icons-material/TrendingUpRounded';
import EmailRounded from '@mui/icons-material/EmailRounded';
import ShareRounded from '@mui/icons-material/ShareRounded';
import BookmarkBorderRounded from '@mui/icons-material/BookmarkBorderRounded';
import BookmarkRounded from '@mui/icons-material/BookmarkRounded';
import ArrowBackRounded from '@mui/icons-material/ArrowBackRounded';
import CloseRounded from '@mui/icons-material/CloseRounded';
import LinkRounded from '@mui/icons-material/LinkRounded';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import ChatBubbleOutlineRounded from '@mui/icons-material/ChatBubbleOutlineRounded';
import GroupRounded from '@mui/icons-material/GroupRounded';
import ShieldRounded from '@mui/icons-material/ShieldRounded';
import LocationOnRounded from '@mui/icons-material/LocationOnRounded';
import PersonRounded from '@mui/icons-material/PersonRounded';
import BuildRounded from '@mui/icons-material/BuildRounded';
import EditRounded from '@mui/icons-material/EditRounded';
import AddRounded from '@mui/icons-material/AddRounded';
import MoreVertRounded from '@mui/icons-material/MoreVertRounded';
import DownloadRounded from '@mui/icons-material/DownloadRounded';
import DeleteRounded from '@mui/icons-material/DeleteRounded';
import VisibilityRounded from '@mui/icons-material/VisibilityRounded';
import VisibilityOffRounded from '@mui/icons-material/VisibilityOffRounded';
import SearchRounded from '@mui/icons-material/SearchRounded';
import PublicRounded from '@mui/icons-material/PublicRounded';
import LockRounded from '@mui/icons-material/LockRounded';
import LockPersonRounded from '@mui/icons-material/LockPersonRounded';
import {
  Box,
  Typography,
  Button,
  IconButton,
  Chip,
  Paper,
  Stack,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogContent,
  DialogTitle,
  DialogContentText,
  DialogActions,
  Select,
  Collapse,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tooltip,
  Avatar,
  TextField,
  FormControl,
  InputLabel,
  Switch,
  FormControlLabel,
  Divider,
  InputAdornment,
  Snackbar,
  Alert,
  Autocomplete,
  ToggleButton,
  ToggleButtonGroup,
  Tabs,
  Tab } from
'@mui/material';
import {
  ProjectStageIndicator,
  ProjectStage } from
'../components/ProjectStageIndicator';
import {
  ProvenanceLabel,
  ProvenanceMetadata } from
'../components/ProvenanceLabel';
import {
  ProfileCompleteness,
  CompletenessItem } from
'../components/ProfileCompleteness';
import {
  ReportingFreshness,
  FreshnessStatus } from
'../components/ReportingFreshness';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import * as L from 'leaflet';
import { SidebarPanel } from '../components/layout/SidebarPanel';
import { MediaGallery, MediaItem } from '../components/MediaGallery';
import { ShareMenu as SharedShareMenu } from '../components/ShareMenu';
// Fix for default marker icon
const icon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  iconRetinaUrl:
  'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});
// Stage descriptions for tooltips
const stageDescriptions: Record<string, string> = {
  Exploration:
  'A potential carbon project is being explored, but no specific project, assets, or boundaries have been formally defined.',
  Concept:
  'A specific carbon project is defined in principle, with identified assets, boundaries, and an intended carbon pathway.',
  Design:
  'The carbon project is materially designed, with core assumptions, documentation, and monitoring approach drafted.',
  Listed:
  'The project has been formally submitted to a standard or registry and is listed for validation review.',
  Validation:
  'The project is undergoing third-party validation against the selected standard and methodology.',
  Registered:
  'The project is approved and registered, eligible to generate credits once monitoring conditions are met.',
  Issued:
  'Verified emission reductions or removals have been issued as credits in a registry.',
  Closed: 'The project is no longer active, with no further issuance expected.'
};
// Permission types (project-level — external users allowed)
type ProjectPermissionLevel = 'Owner' | 'Admin' | 'Editor' | 'Viewer';
type ProjectVisibility = 'public' | 'registered' | 'members' | 'private';
interface ProjectMemberPermission {
  id: string;
  name: string;
  email: string;
  role: string;
  permission: ProjectPermissionLevel;
  isExternal?: boolean;
}
const visibilityOptions: {
  value: ProjectVisibility;
  label: string;
  desc: string;
  icon: React.ElementType;
}[] = [
{
  value: 'public',
  label: 'Public',
  desc: 'Anyone can view this project',
  icon: PublicRounded
},
{
  value: 'registered',
  label: 'Registered users',
  desc: 'Only signed-in platform users',
  icon: GroupRounded
},
{
  value: 'members',
  label: 'Page members only',
  desc: 'Only invited members with a role',
  icon: LockRounded
},
{
  value: 'private',
  label: 'Private',
  desc: 'Only you can see this',
  icon: LockPersonRounded
}];

// Visibility order helper
const visibilityOrder: Record<ProjectVisibility, number> = {
  public: 0,
  registered: 1,
  members: 2,
  private: 3
};
// Check if a section is visible to a given audience
function isSectionVisibleTo(
sectionVis: ProjectVisibility,
audience: ProjectVisibility)
: boolean {
  return visibilityOrder[sectionVis] <= visibilityOrder[audience];
}
// Locked section placeholder shown in preview mode for hidden sections
function LockedSection({
  title,
  audience



}: {title: string;audience: ProjectVisibility;}) {
  const audienceLabel: Record<ProjectVisibility, string> = {
    public: 'the public',
    registered: 'registered users',
    members: 'members',
    private: 'you'
  };
  return (
    <Paper
      variant="outlined"
      sx={{
        borderRadius: 2,
        overflow: 'hidden',
        mb: 2,
        borderColor: 'grey.200',
        borderStyle: 'dashed',
        opacity: 0.6
      }}>

      <Box
        sx={{
          p: 2,
          borderBottom: 1,
          borderColor: 'grey.100',
          bgcolor: 'grey.50',
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}>

        <LockRounded
          sx={{
            fontSize: 14,
            color: 'grey.400'
          }} />

        <Typography variant="subtitle2" fontWeight="bold" color="grey.400">
          {title}
        </Typography>
      </Box>
      <Box
        p={3}
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        gap={1}
        sx={{
          minHeight: 80
        }}>

        <LockRounded
          sx={{
            fontSize: 20,
            color: 'grey.300'
          }} />

        <Typography variant="caption" color="text.disabled" textAlign="center">
          This section is hidden from {audienceLabel[audience]}
        </Typography>
      </Box>
    </Paper>);

}
// Preview Banner Component
function PreviewBanner({
  previewAs,
  onChangeAudience,
  onExit,
  projectVisibility





}: {previewAs: ProjectVisibility;onChangeAudience: (v: ProjectVisibility) => void;onExit: () => void;projectVisibility: ProjectVisibility;}) {
  const audiences: {
    value: ProjectVisibility;
    label: string;
    icon: React.ElementType;
  }[] = [
  {
    value: 'public',
    label: 'Public',
    icon: PublicRounded
  },
  {
    value: 'registered',
    label: 'Registered',
    icon: GroupRounded
  },
  {
    value: 'members',
    label: 'Members',
    icon: ShieldRounded
  }];

  const projectVisible =
  visibilityOrder[projectVisibility] <= visibilityOrder[previewAs];
  return (
    <Box
      sx={{
        bgcolor: 'grey.900',
        color: 'white',
        px: 3,
        py: 1.25,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 2,
        flexWrap: 'wrap',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>

      <Box display="flex" alignItems="center" gap={2} flexWrap="wrap">
        <Box display="flex" alignItems="center" gap={1}>
          <VisibilityRounded
            sx={{
              fontSize: 16,
              color: 'grey.400'
            }} />

          <Typography
            variant="caption"
            color="grey.400"
            fontWeight={600}
            sx={{
              textTransform: 'uppercase',
              letterSpacing: 0.5,
              fontSize: '0.65rem'
            }}>

            Preview as
          </Typography>
        </Box>
        <Box display="flex" gap={0.5}>
          {audiences.map((aud) => {
            const isSelected = previewAs === aud.value;
            return (
              <Box
                key={aud.value}
                onClick={() => onChangeAudience(aud.value)}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  px: 1.25,
                  py: 0.5,
                  borderRadius: 1,
                  cursor: 'pointer',
                  bgcolor: isSelected ? 'white' : 'transparent',
                  color: isSelected ? 'grey.900' : 'grey.400',
                  border: '1px solid',
                  borderColor: isSelected ? 'white' : 'grey.700',
                  transition: 'all 0.15s',
                  '&:hover': {
                    borderColor: 'grey.500',
                    color: isSelected ? 'grey.900' : 'grey.200'
                  }
                }}>

                <aud.icon
                  sx={{
                    fontSize: 12
                  }} />

                <Typography
                  variant="caption"
                  fontWeight={isSelected ? 700 : 400}
                  sx={{
                    fontSize: '0.7rem'
                  }}>

                  {aud.label}
                </Typography>
              </Box>);

          })}
        </Box>
        {!projectVisible &&
        <Box
          display="flex"
          alignItems="center"
          gap={0.5}
          sx={{
            bgcolor: 'warning.900',
            px: 1,
            py: 0.25,
            borderRadius: 1
          }}>

            <VisibilityOffRounded
            sx={{
              fontSize: 12,
              color: 'warning.300'
            }} />

            <Typography
            variant="caption"
            color="warning.300"
            sx={{
              fontSize: '0.65rem'
            }}>

              Project not visible to this audience
            </Typography>
          </Box>
        }
      </Box>
      <Button
        size="small"
        onClick={onExit}
        startIcon={
        <CloseRounded
          sx={{
            fontSize: 14
          }} />

        }
        sx={{
          textTransform: 'none',
          color: 'grey.300',
          borderColor: 'grey.700',
          border: '1px solid',
          fontSize: '0.75rem',
          py: 0.5,
          '&:hover': {
            bgcolor: 'grey.800',
            borderColor: 'grey.500'
          }
        }}>

        Exit Preview
      </Button>
    </Box>);

}
const initialProjectPermissions: ProjectMemberPermission[] = [
{
  id: '0',
  name: 'Ahmad Rahman',
  email: 'ahmad@borneocarbon.com',
  role: 'Developer',
  permission: 'Owner'
},
{
  id: '1',
  name: 'Sarah Chen',
  email: 'sarah.chen@example.com',
  role: 'Head of Projects',
  permission: 'Admin'
},
{
  id: '2',
  name: 'James Wong',
  email: 'james.wong@example.com',
  role: 'Technical Director',
  permission: 'Editor'
}];

// Mock provenance data
const mockProvenance: Record<string, ProvenanceMetadata> = {
  registry: {
    type: 'registry-linked',
    sourceName: 'Verra VCS',
    sourceUrl: 'https://registry.verra.org/app/projectDetail/VCS/2847',
    lastUpdated: '2 days ago'
  },
  methodology: {
    type: 'registry-linked',
    sourceName: 'Verra VCS',
    sourceUrl: 'https://verra.org/methodologies/vm0027/'
  },
  location: {
    type: 'self-reported'
  },
  issuance: {
    type: 'registry-linked',
    sourceName: 'Verra VCS',
    lastUpdated: '1 week ago'
  },
  document: {
    type: 'document-backed',
    documentName: 'PDD_v1.2.pdf',
    uploadDate: 'Jan 15, 2025'
  }
};
// Mock completeness items
const completenessItems: CompletenessItem[] = [
{
  id: '1',
  label: 'Project name',
  isComplete: true,
  section: 'header'
},
{
  id: '2',
  label: 'Project type',
  isComplete: true,
  section: 'header'
},
{
  id: '3',
  label: 'Geography',
  isComplete: true,
  section: 'location'
},
{
  id: '4',
  label: 'Developer linked',
  isComplete: true,
  section: 'team'
},
{
  id: '5',
  label: 'Project story',
  isComplete: true,
  section: 'story'
},
{
  id: '6',
  label: 'Current stage',
  isComplete: true,
  section: 'stage'
},
{
  id: '7',
  label: 'Readiness details',
  isComplete: true,
  section: 'stage'
},
{
  id: '8',
  label: 'Methodology',
  isComplete: true,
  section: 'registry'
},
{
  id: '9',
  label: 'Opportunities',
  isComplete: true,
  section: 'opportunities'
},
{
  id: '10',
  label: 'Site photos',
  isComplete: true,
  section: 'media'
},
{
  id: '11',
  label: 'Registry link',
  isComplete: false,
  section: 'registry'
},
{
  id: '12',
  label: 'Documents',
  isComplete: true,
  section: 'document'
}];

// Stage configurations (keeping existing config but abbreviated for space)
const stageConfig: Record<
  ProjectStage,
  {
    stageIndex: number;
    readiness: {
      dim: string;
      status: 'yes' | 'progress' | 'seeking' | 'na';
      note: string;
    }[];
    opportunities: {
      type: string;
      icon: any;
      desc: string;
      urgent: boolean;
    }[];
    updates: {
      id: string;
      date: string;
      title: string;
      desc: string;
      author: string;
      hasPhoto?: boolean;
      photoCaption?: string;
    }[];
    documents: {
      id: string;
      name: string;
      type: string;
      date: string;
      status: string;
    }[];
    timeline: {
      date: string;
      event: string;
      type: string;
    }[];
    media: MediaItem[];
    impactAvailable: boolean;
    registryStatus: string;
    serviceProviders: {
      name: string;
      type: string;
      id: string;
    }[];
  }> =
{
  Exploration: {
    stageIndex: 0,
    readiness: [
    {
      dim: 'Land rights',
      status: 'seeking',
      note: 'Initial discussions'
    },
    {
      dim: 'Baseline & MRV',
      status: 'na',
      note: 'Not started'
    },
    {
      dim: 'Methodology',
      status: 'seeking',
      note: 'Evaluating options'
    },
    {
      dim: 'Registry',
      status: 'na',
      note: 'Not started'
    },
    {
      dim: 'Financing',
      status: 'seeking',
      note: 'Seeking seed funding'
    }],

    opportunities: [
    {
      type: 'Financing',
      icon: AttachMoneyRounded,
      desc: 'Seed funding for feasibility',
      urgent: true
    },
    {
      type: 'Technical Advisor',
      icon: TrendingUpRounded,
      desc: 'Methodology selection',
      urgent: true
    }],

    updates: [],
    documents: [],
    timeline: [
    {
      date: 'Aug 2024',
      event: 'Project created',
      type: 'system'
    }],

    media: [],
    impactAvailable: false,
    registryStatus: 'Not started',
    serviceProviders: []
  },
  Concept: {
    stageIndex: 1,
    readiness: [
    {
      dim: 'Land rights',
      status: 'progress',
      note: 'In negotiation'
    },
    {
      dim: 'Baseline & MRV',
      status: 'seeking',
      note: 'Scoping'
    },
    {
      dim: 'Methodology',
      status: 'progress',
      note: 'Shortlisted'
    },
    {
      dim: 'Registry',
      status: 'na',
      note: 'Not started'
    },
    {
      dim: 'Financing',
      status: 'seeking',
      note: 'Seeking seed'
    }],

    opportunities: [
    {
      type: 'Financing',
      icon: AttachMoneyRounded,
      desc: 'Seed funding',
      urgent: true
    },
    {
      type: 'MRV Provider',
      icon: TrendingUpRounded,
      desc: 'Remote sensing',
      urgent: false
    }],

    updates: [
    {
      id: '1',
      date: 'Oct 2024',
      title: 'Concept note drafted',
      desc: 'Initial project design documented with identified assets and carbon pathway.',
      author: 'Sarah Chen'
    }],

    documents: [
    {
      id: '1',
      name: 'Concept Note',
      type: 'Design',
      date: 'Oct 2024',
      status: 'Final'
    }],

    timeline: [
    {
      date: 'Oct 2024',
      event: 'Stage → Concept',
      type: 'stage'
    },
    {
      date: 'Aug 2024',
      event: 'Project created',
      type: 'system'
    }],

    media: [],
    impactAvailable: false,
    registryStatus: 'Not started',
    serviceProviders: [
    {
      name: 'Silvestrum Climate',
      type: 'Consultancy',
      id: 'silvestrum-climate'
    }]

  },
  Design: {
    stageIndex: 2,
    readiness: [
    {
      dim: 'Land rights',
      status: 'progress',
      note: '80% complete'
    },
    {
      dim: 'Baseline & MRV',
      status: 'progress',
      note: 'Survey underway'
    },
    {
      dim: 'Methodology',
      status: 'yes',
      note: 'VM0027'
    },
    {
      dim: 'Registry',
      status: 'yes',
      note: 'Verra active'
    },
    {
      dim: 'Financing',
      status: 'seeking',
      note: 'Seeking seed'
    }],

    opportunities: [
    {
      type: 'Financing',
      icon: AttachMoneyRounded,
      desc: 'Seed funding',
      urgent: true
    },
    {
      type: 'MRV Provider',
      icon: TrendingUpRounded,
      desc: 'Remote sensing',
      urgent: false
    },
    {
      type: 'Buyers',
      icon: PeopleRounded,
      desc: 'Forward purchase',
      urgent: false
    }],

    updates: [
    {
      id: '1',
      date: 'Dec 2024',
      title: 'Baseline survey team deployed',
      desc: 'Field team has begun 3-week assessment across all project zones. Initial drone mapping completed for Sector A.',
      author: 'James Wong',
      hasPhoto: true,
      photoCaption: 'Drone survey team preparing for launch in Sector A'
    },
    {
      id: '2',
      date: 'Nov 2024',
      title: 'Community agreements progressing',
      desc: 'Signed with 9 of 12 target villages. Remaining 3 expected by end of month.',
      author: 'Sarah Chen'
    }],

    documents: [
    {
      id: '1',
      name: 'Concept Note',
      type: 'Design',
      date: 'Oct 2024',
      status: 'Final'
    },
    {
      id: '2',
      name: 'Feasibility Assessment',
      type: 'Technical',
      date: 'Nov 2024',
      status: 'Final'
    },
    {
      id: '3',
      name: 'PDD Draft',
      type: 'Registry',
      date: 'Dec 2024',
      status: 'Draft'
    }],

    timeline: [
    {
      date: 'Dec 2024',
      event: 'Baseline survey initiated',
      type: 'activity'
    },
    {
      date: 'Nov 2024',
      event: 'Stage → Design',
      type: 'stage'
    },
    {
      date: 'Oct 2024',
      event: 'Methodology confirmed: VM0027',
      type: 'milestone'
    },
    {
      date: 'Sep 2024',
      event: 'Registry account created',
      type: 'registry'
    },
    {
      date: 'Aug 2024',
      event: 'Project created',
      type: 'system'
    }],

    media: [
    {
      id: '1',
      caption: 'Site overview - aerial view',
      date: 'Nov 2024',
      url: 'https://images.unsplash.com/photo-1586348943529-beaae6c28db9?w=800&q=80'
    },
    {
      id: '2',
      caption: 'Community consultation meeting',
      date: 'Oct 2024',
      url: 'https://images.unsplash.com/photo-1559827291-bce0a4a68a5e?w=800&q=80'
    },
    {
      id: '3',
      caption: 'Canal blocking demonstration',
      date: 'Dec 2024',
      url: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&q=80'
    },
    {
      id: '4',
      caption: 'Project boundary map',
      date: 'Sep 2024',
      url: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800&q=80'
    }],

    impactAvailable: false,
    registryStatus: 'Pre-validation',
    serviceProviders: [
    {
      name: 'Silvestrum Climate',
      type: 'Consultancy',
      id: 'silvestrum-climate'
    },
    {
      name: 'Pachama',
      type: 'MRV',
      id: 'pachama'
    }]

  },
  Listed: {
    stageIndex: 3,
    readiness: [
    {
      dim: 'Land rights',
      status: 'yes',
      note: 'All agreements signed'
    },
    {
      dim: 'Baseline & MRV',
      status: 'yes',
      note: 'Complete'
    },
    {
      dim: 'Methodology',
      status: 'yes',
      note: 'VM0027'
    },
    {
      dim: 'Registry',
      status: 'yes',
      note: 'Listed'
    },
    {
      dim: 'Financing',
      status: 'progress',
      note: 'In negotiation'
    }],

    opportunities: [
    {
      type: 'Buyers',
      icon: PeopleRounded,
      desc: 'Forward purchase agreements',
      urgent: true
    }],

    updates: [
    {
      id: '1',
      date: 'Feb 2025',
      title: 'Project listed on registry',
      desc: 'Now visible on Verra pipeline and open for validation.',
      author: 'Ahmad Rahman'
    }],

    documents: [
    {
      id: '1',
      name: 'Concept Note',
      type: 'Design',
      date: 'Oct 2024',
      status: 'Final'
    },
    {
      id: '2',
      name: 'Feasibility Assessment',
      type: 'Technical',
      date: 'Nov 2024',
      status: 'Final'
    },
    {
      id: '3',
      name: 'PDD',
      type: 'Registry',
      date: 'Jan 2025',
      status: 'Final'
    },
    {
      id: '4',
      name: 'Baseline Report',
      type: 'Technical',
      date: 'Jan 2025',
      status: 'Final'
    }],

    timeline: [
    {
      date: 'Feb 2025',
      event: 'Project listed on Verra',
      type: 'registry'
    },
    {
      date: 'Jan 2025',
      event: 'Baseline complete',
      type: 'milestone'
    },
    {
      date: 'Dec 2024',
      event: 'Stage → Listed',
      type: 'stage'
    }],

    media: [
    {
      id: '1',
      caption: 'Site overview - aerial view',
      date: 'Nov 2024',
      url: 'https://images.unsplash.com/photo-1586348943529-beaae6c28db9?w=800&q=80'
    },
    {
      id: '2',
      caption: 'Community consultation meeting',
      date: 'Oct 2024',
      url: 'https://images.unsplash.com/photo-1559827291-bce0a4a68a5e?w=800&q=80'
    },
    {
      id: '3',
      caption: 'Canal blocking demonstration',
      date: 'Dec 2024',
      url: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&q=80'
    },
    {
      id: '4',
      caption: 'Project boundary map',
      date: 'Sep 2024',
      url: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800&q=80'
    }],

    impactAvailable: false,
    registryStatus: 'Listed',
    serviceProviders: [
    {
      name: 'Silvestrum Climate',
      type: 'Consultancy',
      id: 'silvestrum-climate'
    },
    {
      name: 'Pachama',
      type: 'MRV',
      id: 'pachama'
    },
    {
      name: 'Carbon Finance Asia',
      type: 'Financing',
      id: 'carbon-finance-asia'
    }]

  },
  Validation: {
    stageIndex: 4,
    readiness: [
    {
      dim: 'Land rights',
      status: 'yes',
      note: 'All agreements signed'
    },
    {
      dim: 'Baseline & MRV',
      status: 'yes',
      note: 'Complete'
    },
    {
      dim: 'Methodology',
      status: 'yes',
      note: 'VM0027'
    },
    {
      dim: 'Registry',
      status: 'yes',
      note: 'Under validation'
    },
    {
      dim: 'Financing',
      status: 'yes',
      note: 'Series A secured'
    }],

    opportunities: [
    {
      type: 'Buyers',
      icon: PeopleRounded,
      desc: 'Forward purchase agreements',
      urgent: true
    },
    {
      type: 'Insurance',
      icon: ShieldRounded,
      desc: 'Risk mitigation',
      urgent: false
    }],

    updates: [
    {
      id: '1',
      date: 'Mar 2025',
      title: 'Validation audit scheduled',
      desc: 'SCS Global will conduct site visit in April.',
      author: 'James Wong'
    }],

    documents: [
    {
      id: '1',
      name: 'PDD',
      type: 'Registry',
      date: 'Jan 2025',
      status: 'Final'
    },
    {
      id: '2',
      name: 'Baseline Report',
      type: 'Technical',
      date: 'Jan 2025',
      status: 'Final'
    },
    {
      id: '3',
      name: 'Validation Plan',
      type: 'Registry',
      date: 'Mar 2025',
      status: 'Final'
    }],

    timeline: [
    {
      date: 'Mar 2025',
      event: 'Validation submitted',
      type: 'milestone'
    },
    {
      date: 'Feb 2025',
      event: 'Stage → Validation',
      type: 'stage'
    },
    {
      date: 'Feb 2025',
      event: 'Financing secured',
      type: 'milestone'
    }],

    media: [
    {
      id: '1',
      caption: 'Site overview - aerial view',
      date: 'Nov 2024',
      url: 'https://images.unsplash.com/photo-1586348943529-beaae6c28db9?w=800&q=80'
    },
    {
      id: '2',
      caption: 'Community consultation meeting',
      date: 'Oct 2024',
      url: 'https://images.unsplash.com/photo-1559827291-bce0a4a68a5e?w=800&q=80'
    },
    {
      id: '3',
      caption: 'Canal blocking demonstration',
      date: 'Dec 2024',
      url: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&q=80'
    },
    {
      id: '4',
      caption: 'Project boundary map',
      date: 'Sep 2024',
      url: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800&q=80'
    }],

    impactAvailable: false,
    registryStatus: 'Under validation',
    serviceProviders: [
    {
      name: 'Silvestrum Climate',
      type: 'Consultancy',
      id: 'silvestrum-climate'
    },
    {
      name: 'Pachama',
      type: 'MRV',
      id: 'pachama'
    },
    {
      name: 'SCS Global Services',
      type: 'Verification',
      id: 'scs-global'
    },
    {
      name: 'Carbon Finance Asia',
      type: 'Financing',
      id: 'carbon-finance-asia'
    }]

  },
  Registered: {
    stageIndex: 5,
    readiness: [
    {
      dim: 'Land rights',
      status: 'yes',
      note: 'All agreements signed'
    },
    {
      dim: 'Baseline & MRV',
      status: 'yes',
      note: 'Monitoring active'
    },
    {
      dim: 'Methodology',
      status: 'yes',
      note: 'VM0027'
    },
    {
      dim: 'Registry',
      status: 'yes',
      note: 'VCS-2847'
    },
    {
      dim: 'Financing',
      status: 'yes',
      note: 'Operational'
    }],

    opportunities: [
    {
      type: 'Buyers',
      icon: PeopleRounded,
      desc: 'Forward sales',
      urgent: false
    }],

    updates: [
    {
      id: '1',
      date: 'Jul 2025',
      title: 'Project registered',
      desc: 'VCS-2847 now live on Verra registry.',
      author: 'Ahmad Rahman'
    }],

    documents: [
    {
      id: '1',
      name: 'PDD',
      type: 'Registry',
      date: 'Jan 2025',
      status: 'Final'
    },
    {
      id: '2',
      name: 'Validation Report',
      type: 'Registry',
      date: 'Jun 2025',
      status: 'Final'
    }],

    timeline: [
    {
      date: 'Jul 2025',
      event: 'Project registered: VCS-2847',
      type: 'registry'
    },
    {
      date: 'Jun 2025',
      event: 'Validation complete',
      type: 'milestone'
    },
    {
      date: 'Mar 2025',
      event: 'Stage → Registered',
      type: 'stage'
    }],

    media: [
    {
      id: '1',
      caption: 'Site overview - aerial view',
      date: 'Nov 2024',
      url: 'https://images.unsplash.com/photo-1586348943529-beaae6c28db9?w=800&q=80'
    },
    {
      id: '2',
      caption: 'Community consultation meeting',
      date: 'Oct 2024',
      url: 'https://images.unsplash.com/photo-1559827291-bce0a4a68a5e?w=800&q=80'
    },
    {
      id: '3',
      caption: 'Canal blocking demonstration',
      date: 'Dec 2024',
      url: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&q=80'
    },
    {
      id: '4',
      caption: 'Project boundary map',
      date: 'Sep 2024',
      url: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800&q=80'
    }],

    impactAvailable: true,
    registryStatus: 'Registered (VCS-2847)',
    serviceProviders: [
    {
      name: 'Silvestrum Climate',
      type: 'Consultancy',
      id: 'silvestrum-climate'
    },
    {
      name: 'Pachama',
      type: 'MRV',
      id: 'pachama'
    },
    {
      name: 'SCS Global Services',
      type: 'Verification',
      id: 'scs-global'
    }]

  },
  Issued: {
    stageIndex: 6,
    readiness: [
    {
      dim: 'Land rights',
      status: 'yes',
      note: 'All agreements signed'
    },
    {
      dim: 'Baseline & MRV',
      status: 'yes',
      note: 'Monitoring active'
    },
    {
      dim: 'Methodology',
      status: 'yes',
      note: 'VM0027'
    },
    {
      dim: 'Registry',
      status: 'yes',
      note: 'VCS-2847'
    },
    {
      dim: 'Financing',
      status: 'yes',
      note: 'Operational'
    }],

    opportunities: [
    {
      type: 'Buyers',
      icon: PeopleRounded,
      desc: 'Spot & forward sales',
      urgent: false
    }],

    updates: [
    {
      id: '1',
      date: 'Sep 2025',
      title: 'First credits issued',
      desc: '58,000 VCUs issued for 2024 vintage.',
      author: 'Ahmad Rahman'
    }],

    documents: [
    {
      id: '1',
      name: 'PDD',
      type: 'Registry',
      date: 'Jan 2025',
      status: 'Final'
    },
    {
      id: '2',
      name: 'Validation Report',
      type: 'Registry',
      date: 'Jun 2025',
      status: 'Final'
    },
    {
      id: '3',
      name: 'Monitoring Report 2024',
      type: 'Technical',
      date: 'Aug 2025',
      status: 'Final'
    },
    {
      id: '4',
      name: 'Verification Report',
      type: 'Registry',
      date: 'Sep 2025',
      status: 'Final'
    }],

    timeline: [
    {
      date: 'Sep 2025',
      event: 'First credits issued: 58,000 VCUs',
      type: 'milestone'
    },
    {
      date: 'Jul 2025',
      event: 'Stage → Issued',
      type: 'stage'
    },
    {
      date: 'Jun 2025',
      event: 'Verification complete',
      type: 'milestone'
    }],

    media: [
    {
      id: '1',
      caption: 'Site overview - aerial view',
      date: 'Nov 2024',
      url: 'https://images.unsplash.com/photo-1586348943529-beaae6c28db9?w=800&q=80'
    },
    {
      id: '2',
      caption: 'Community consultation meeting',
      date: 'Oct 2024',
      url: 'https://images.unsplash.com/photo-1559827291-bce0a4a68a5e?w=800&q=80'
    },
    {
      id: '3',
      caption: 'Canal blocking demonstration',
      date: 'Dec 2024',
      url: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&q=80'
    },
    {
      id: '4',
      caption: 'Project boundary map',
      date: 'Sep 2024',
      url: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800&q=80'
    }],

    impactAvailable: true,
    registryStatus: 'Issued (VCS-2847)',
    serviceProviders: [
    {
      name: 'Silvestrum Climate',
      type: 'Consultancy',
      id: 'silvestrum-climate'
    },
    {
      name: 'Pachama',
      type: 'MRV',
      id: 'pachama'
    },
    {
      name: 'SCS Global Services',
      type: 'Verification',
      id: 'scs-global'
    }]

  },
  Closed: {
    stageIndex: 7,
    readiness: [
    {
      dim: 'Land rights',
      status: 'yes',
      note: 'Completed'
    },
    {
      dim: 'Baseline & MRV',
      status: 'yes',
      note: 'Completed'
    },
    {
      dim: 'Methodology',
      status: 'yes',
      note: 'VM0027'
    },
    {
      dim: 'Registry',
      status: 'yes',
      note: 'Closed'
    },
    {
      dim: 'Financing',
      status: 'yes',
      note: 'Completed'
    }],

    opportunities: [],
    updates: [],
    documents: [
    {
      id: '1',
      name: 'Final Report',
      type: 'Registry',
      date: 'Dec 2030',
      status: 'Final'
    }],

    timeline: [
    {
      date: 'Dec 2030',
      event: 'Project closed',
      type: 'milestone'
    }],

    media: [],
    impactAvailable: true,
    registryStatus: 'Closed',
    serviceProviders: []
  }
};
const stageLabels: ProjectStage[] = [
'Exploration',
'Concept',
'Design',
'Listed',
'Validation',
'Registered',
'Issued',
'Closed'];

// Project data lookup by UPID
const projectDataMap: Record<
  string,
  {
    name: string;
    stage: ProjectStage;
    developer: string;
    companyId: string;
    country: string;
    countryCode: string;
    description: string;
    type: string;
    lat: number;
    lng: number;
    region?: string;
  }> =
{
  'CUP-MY042713-5': {
    name: 'Sarawak Peatland Rewetting Initiative',
    stage: 'Design',
    developer: 'Borneo Carbon Partners',
    companyId: 'borneo-carbon',
    country: 'Malaysia',
    countryCode: 'MY',
    description:
    'Restoring degraded tropical peatlands in Malaysian Borneo through community-led rewetting and sustainable land management.',
    type: 'Peatland',
    lat: 2.3,
    lng: 111.8,
    region: 'Sarawak'
  },
  'CUP-KH045678-9': {
    name: 'Cambodia Community Forest',
    stage: 'Issued',
    developer: 'Mekong Carbon',
    companyId: 'mekong-carbon',
    country: 'Cambodia',
    countryCode: 'KH',
    description:
    'Community-managed REDD+ forest protection in rural Cambodia, with verified credits issued for the 2024 vintage.',
    type: 'REDD+',
    lat: 12.5,
    lng: 105.0,
    region: 'Mondulkiri'
  },
  'CUP-ID312456-6': {
    name: 'Java Agroforestry Project',
    stage: 'Registered',
    developer: 'Nusantara Carbon',
    companyId: 'nusantara-carbon',
    country: 'Indonesia',
    countryCode: 'ID',
    description:
    'Integrated agroforestry system combining coffee cultivation with native trees in Central Java.',
    type: 'Agroforestry',
    lat: -7.5,
    lng: 110.4,
    region: 'Central Java'
  },
  'CUP-ID109482-4': {
    name: 'Kalimantan Forest Conservation',
    stage: 'Validation',
    developer: 'EcoForest Indonesia',
    companyId: 'ecoforest-indonesia',
    country: 'Indonesia',
    countryCode: 'ID',
    description:
    'REDD+ project protecting tropical rainforest in East Kalimantan.',
    type: 'REDD+',
    lat: 0.5,
    lng: 116.5,
    region: 'East Kalimantan'
  },
  'CUP-MY156789-2': {
    name: 'Sabah Rainforest Conservation',
    stage: 'Listed',
    developer: 'Borneo Carbon Partners',
    companyId: 'borneo-carbon',
    country: 'Malaysia',
    countryCode: 'MY',
    description: 'Conservation of lowland dipterocarp rainforest in Sabah.',
    type: 'REDD+',
    lat: 5.5,
    lng: 117.5,
    region: 'Sabah'
  },
  'CUP-VN028471-3': {
    name: 'Mekong Delta Blue Carbon',
    stage: 'Concept',
    developer: 'Mekong Carbon',
    companyId: 'mekong-carbon',
    country: 'Vietnam',
    countryCode: 'VN',
    description: 'Mangrove restoration and conservation in the Mekong Delta.',
    type: 'Blue Carbon',
    lat: 10.0,
    lng: 106.5,
    region: 'Mekong Delta'
  },
  'CUP-TH056219-7': {
    name: 'Northern Thailand Reforestation',
    stage: 'Listed',
    developer: 'Thai Forest Trust',
    companyId: 'thai-forest-trust',
    country: 'Thailand',
    countryCode: 'TH',
    description:
    'Community-based reforestation project in Northern Thailand highlands.',
    type: 'ARR',
    lat: 18.8,
    lng: 98.9,
    region: 'Chiang Mai'
  },
  'CUP-ID203847-2': {
    name: 'Sumatra Mangrove Restoration',
    stage: 'Design',
    developer: 'Blue Carbon Asia',
    companyId: 'blue-carbon-asia',
    country: 'Indonesia',
    countryCode: 'ID',
    description:
    'Coastal mangrove ecosystem restoration along Sumatra eastern coast.',
    type: 'Blue Carbon',
    lat: 1.5,
    lng: 104.0,
    region: 'Riau'
  }
};
const FLAGS: Record<string, string> = {
  MY: '🇲🇾',
  ID: '🇮🇩',
  VN: '🇻🇳',
  TH: '🇹🇭',
  PH: '🇵🇭',
  MM: '🇲🇲',
  KH: '🇰🇭',
  LA: '🇱🇦',
  SG: '🇸🇬'
};
const documentTypes = [
'Concept Note',
'Feasibility Study',
'PDD',
'Baseline Report',
'Monitoring Report',
'Validation Report',
'Verification Report',
'Other'];

const projectRoles = [
'Developer',
'MRV Provider',
'Validator',
'Verifier',
'Consultancy',
'Financing',
'Insurance',
'Legal',
'Community Liaison',
'Registry',
'Buyer',
'Other'];

// Mock platform search data
const mockPlatformCompanies = [
{
  id: 'pachama',
  name: 'Pachama',
  type: 'company',
  role: 'MRV Provider',
  verified: true
},
{
  id: 'silvestrum-climate',
  name: 'Silvestrum Climate',
  type: 'company',
  role: 'Consultancy',
  verified: true
},
{
  id: 'scs-global',
  name: 'SCS Global Services',
  type: 'company',
  role: 'Verifier',
  verified: true
},
{
  id: 'carbon-finance-asia',
  name: 'Carbon Finance Asia',
  type: 'company',
  role: 'Financing',
  verified: false
},
{
  id: 'verra',
  name: 'Verra',
  type: 'company',
  role: 'Registry',
  verified: true
},
{
  id: 'gold-standard',
  name: 'Gold Standard',
  type: 'company',
  role: 'Registry',
  verified: true
},
{
  id: 'south-pole',
  name: 'South Pole',
  type: 'company',
  role: 'Consultancy',
  verified: true
},
{
  id: 'terrasos',
  name: 'Terrasos',
  type: 'company',
  role: 'Developer',
  verified: false
},
{
  id: 'borneo-carbon',
  name: 'Borneo Carbon Partners',
  type: 'company',
  role: 'Developer',
  verified: true
},
{
  id: 'mekong-carbon',
  name: 'Mekong Carbon',
  type: 'company',
  role: 'Developer',
  verified: false
}];

const mockPlatformUsers = [
{
  id: 'sarah-chen',
  name: 'Sarah Chen',
  type: 'person',
  role: 'Consultancy',
  verified: true,
  initials: 'SC'
},
{
  id: 'james-wong',
  name: 'James Wong',
  type: 'person',
  role: 'MRV Provider',
  verified: true,
  initials: 'JW'
},
{
  id: 'ahmad-rahman',
  name: 'Ahmad Rahman',
  type: 'person',
  role: 'Developer',
  verified: false,
  initials: 'AR'
},
{
  id: 'lisa-park',
  name: 'Lisa Park',
  type: 'person',
  role: 'Legal',
  verified: true,
  initials: 'LP'
},
{
  id: 'david-tan',
  name: 'David Tan',
  type: 'person',
  role: 'Financing',
  verified: false,
  initials: 'DT'
},
{
  id: 'nina-osei',
  name: 'Nina Osei',
  type: 'person',
  role: 'Community Liaison',
  verified: true,
  initials: 'NO'
}];

// Enhanced Sidebar Editor Component
interface SidebarEditorProps {
  open: boolean;
  onClose: () => void;
  section: string;
  currentStage: ProjectStage;
  onStageChange: (stage: ProjectStage) => void;
  editingItem?: any;
  onSave?: (section: string, data: any, isEditing: boolean) => void;
  sectionVisibility: Record<string, ProjectVisibility>;
  onSectionVisibilityChange: (section: string, v: ProjectVisibility) => void;
  projectVisibility: ProjectVisibility;
  onProjectVisibilityChange: (v: ProjectVisibility) => void;
}
function SidebarEditor({
  open,
  onClose,
  section,
  currentStage,
  onStageChange,
  editingItem,
  onSave,
  sectionVisibility,
  onSectionVisibilityChange,
  projectVisibility,
  onProjectVisibilityChange
}: SidebarEditorProps) {
  const [problemText, setProblemText] = useState('');
  const [approachText, setApproachText] = useState('');
  const [benefitsText, setBenefitsText] = useState('');
  const [updateTitle, setUpdateTitle] = useState('');
  const [updateDesc, setUpdateDesc] = useState('');
  const [visibility, setVisibility] = useState('Public');
  const [docName, setDocName] = useState('');
  const [docType, setDocType] = useState('');
  const [docStatus, setDocStatus] = useState('Draft');
  const [mediaCaption, setMediaCaption] = useState('');
  const [country, setCountry] = useState('Malaysia');
  const [region, setRegion] = useState('Sarawak');
  const [teamRole, setTeamRole] = useState<'company' | 'person'>('company');
  const [teamName, setTeamName] = useState('');
  const [teamProjectRole, setTeamProjectRole] = useState<string | null>(null);
  const [teamSearch, setTeamSearch] = useState('');
  const [teamSelectedPlatform, setTeamSelectedPlatform] = useState<any>(null);
  const [teamManualMode, setTeamManualMode] = useState(false);
  const [oppType, setOppType] = useState('Financing');
  const [oppDesc, setOppDesc] = useState('');
  const [oppUrgent, setOppUrgent] = useState(false);
  const [settingsTab, setSettingsTab] = useState(0);
  // Reset/populate form when opening or when editingItem changes
  useEffect(() => {
    if (!open) return;
    if (section === 'document') {
      if (editingItem) {
        setDocName(editingItem.name || '');
        setDocType(editingItem.type || '');
        setDocStatus(editingItem.status || 'Draft');
      } else {
        setDocName('');
        setDocType('');
        setDocStatus('Draft');
      }
    } else if (section === 'media') {
      if (editingItem) {
        setMediaCaption(editingItem.caption || '');
      } else {
        setMediaCaption('');
      }
    } else if (section === 'update') {
      if (editingItem) {
        setUpdateTitle(editingItem.title || '');
        setUpdateDesc(editingItem.desc || '');
      } else {
        setUpdateTitle('');
        setUpdateDesc('');
      }
    } else if (section === 'team') {
      if (editingItem) {
        setTeamName(editingItem.name || '');
        setTeamProjectRole(editingItem.type || null);
        setTeamRole(editingItem.partnerKind || 'company');
        setTeamSearch('');
        setTeamSelectedPlatform(
          editingItem.platformId ?
          {
            id: editingItem.platformId,
            name: editingItem.name
          } :
          null
        );
        setTeamManualMode(!editingItem.platformId);
      } else {
        setTeamName('');
        setTeamProjectRole(null);
        setTeamRole('company');
        setTeamSearch('');
        setTeamSelectedPlatform(null);
        setTeamManualMode(false);
      }
    } else if (section === 'opportunities') {
      if (editingItem) {
        setOppType(editingItem.type || 'Financing');
        setOppDesc(editingItem.desc || '');
        setOppUrgent(editingItem.urgent || false);
      } else {
        setOppType('Financing');
        setOppDesc('');
        setOppUrgent(false);
      }
    } else if (section === 'story') {
      setProblemText(
        "Sarawak's peatlands have been severely degraded by decades of drainage for agriculture and logging. Drained peatlands release massive amounts of stored carbon and are highly vulnerable to fires."
      );
      setApproachText(
        'This initiative will block drainage canals to rewet approximately 15,000 hectares of degraded peatland, working with local communities to establish sustainable paludiculture systems.'
      );
      setBenefitsText(
        'Climate mitigation through carbon sequestration, community livelihoods through sustainable agriculture, and biodiversity protection for endangered species including orangutans.'
      );
    } else if (section === 'location') {
      setCountry('Malaysia');
      setRegion('Sarawak');
    }
  }, [open, section, editingItem]);
  const renderContent = () => {
    switch (section) {
      case 'header':
        return (
          <Stack spacing={3}>
            <Box>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Project Details
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Basic information about this project.
              </Typography>
            </Box>
            <TextField
              label="Project Name"
              fullWidth
              defaultValue="Sarawak Peatland Rewetting Initiative" />

            <TextField
              label="Short Description"
              fullWidth
              defaultValue="Restoring degraded tropical peatlands in Malaysian Borneo" />

            <FormControl fullWidth>
              <InputLabel>Visibility</InputLabel>
              <Select
                value={visibility}
                label="Visibility"
                onChange={(e) => setVisibility(e.target.value)}>

                <MenuItem value="Public">Public</MenuItem>
                <MenuItem value="Private">Private</MenuItem>
              </Select>
            </FormControl>
          </Stack>);

      case 'story':
        return (
          <Stack spacing={3}>
            <Box>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Project Story
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Tell the story of your project.
              </Typography>
            </Box>
            <TextField
              label="Problem and Context"
              fullWidth
              multiline
              minRows={3}
              value={problemText}
              onChange={(e) => setProblemText(e.target.value)} />

            <TextField
              label="Project Approach"
              fullWidth
              multiline
              minRows={3}
              value={approachText}
              onChange={(e) => setApproachText(e.target.value)} />

            <TextField
              label="Expected Benefits"
              fullWidth
              multiline
              minRows={3}
              value={benefitsText}
              onChange={(e) => setBenefitsText(e.target.value)} />

          </Stack>);

      case 'media':
        return (
          <Stack spacing={3}>
            <Box>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                {editingItem ? 'Edit Media' : 'Add Media'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Upload photos and videos of the project.
              </Typography>
            </Box>
            {!editingItem &&
            <Paper
              variant="outlined"
              sx={{
                p: 3,
                borderStyle: 'dashed',
                textAlign: 'center',
                cursor: 'pointer'
              }}
              component="label">

                <input type="file" hidden accept="image/*,video/*" />
                <ImageRounded
                sx={{
                  fontSize: 32,
                  color: 'grey.400',
                  mb: 1
                }} />

                <Typography variant="body2" color="text.secondary">
                  Click to upload or drag and drop
                </Typography>
                <Typography variant="caption" color="text.disabled">
                  PNG, JPG, MP4 up to 50MB
                </Typography>
              </Paper>
            }
            <TextField
              label="Caption"
              fullWidth
              value={mediaCaption}
              onChange={(e) => setMediaCaption(e.target.value)}
              placeholder="Describe this media..." />

          </Stack>);

      case 'update':
        return (
          <Stack spacing={3}>
            <Box>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                {editingItem ? 'Edit Update' : 'Post Update'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Share progress with followers.
              </Typography>
            </Box>
            <TextField
              label="Title"
              fullWidth
              value={updateTitle}
              onChange={(e) => setUpdateTitle(e.target.value)}
              placeholder="e.g., Baseline survey completed" />

            <TextField
              label="Description"
              fullWidth
              multiline
              minRows={4}
              value={updateDesc}
              onChange={(e) => setUpdateDesc(e.target.value)}
              placeholder="Share what's new..." />

          </Stack>);

      case 'document':
        return (
          <Stack spacing={3}>
            <Box>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                {editingItem ? 'Edit Document' : 'Add Document'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Upload project documents.
              </Typography>
            </Box>
            {!editingItem &&
            <Paper
              variant="outlined"
              sx={{
                p: 3,
                borderStyle: 'dashed',
                textAlign: 'center',
                cursor: 'pointer'
              }}
              component="label">

                <input type="file" hidden />
                <DescriptionRounded
                sx={{
                  fontSize: 32,
                  color: 'grey.400',
                  mb: 1
                }} />

                <Typography variant="body2" color="text.secondary">
                  Click to upload or drag and drop
                </Typography>
                <Typography variant="caption" color="text.disabled">
                  PDF, DOCX, XLSX up to 25MB
                </Typography>
              </Paper>
            }
            <TextField
              label="Document Name"
              fullWidth
              value={docName}
              onChange={(e) => setDocName(e.target.value)} />

            <FormControl fullWidth>
              <InputLabel>Document Type</InputLabel>
              <Select
                value={docType}
                label="Document Type"
                onChange={(e) => setDocType(e.target.value)}>

                {documentTypes.map((type) =>
                <MenuItem key={type} value={type}>
                    {type}
                  </MenuItem>
                )}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={docStatus}
                label="Status"
                onChange={(e) => setDocStatus(e.target.value)}>

                <MenuItem value="Draft">Draft</MenuItem>
                <MenuItem value="Final">Final</MenuItem>
              </Select>
            </FormControl>
          </Stack>);

      case 'location':
        return (
          <Stack spacing={3}>
            <Box>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Location
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Where is the project located?
              </Typography>
            </Box>
            <FormControl fullWidth>
              <InputLabel>Country</InputLabel>
              <Select
                value={country}
                label="Country"
                onChange={(e) => setCountry(e.target.value)}>

                {[
                'Indonesia',
                'Malaysia',
                'Vietnam',
                'Thailand',
                'Philippines',
                'Cambodia'].
                map((c) =>
                <MenuItem key={c} value={c}>
                    {c}
                  </MenuItem>
                )}
              </Select>
            </FormControl>
            <TextField
              label="Region"
              fullWidth
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              placeholder="e.g., Sarawak" />

          </Stack>);

      case 'stage':
        return (
          <Stack spacing={3}>
            <Box>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Project Stage
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Update the current stage of the project.
              </Typography>
            </Box>
            <FormControl fullWidth>
              <InputLabel>Current Stage</InputLabel>
              <Select
                value={currentStage}
                label="Current Stage"
                onChange={(e) => onStageChange(e.target.value as ProjectStage)}>

                {stageLabels.map((stage) =>
                <MenuItem key={stage} value={stage}>
                    {stage}
                  </MenuItem>
                )}
              </Select>
            </FormControl>
            <Typography variant="caption" color="text.secondary">
              {stageDescriptions[currentStage]}
            </Typography>
          </Stack>);

      case 'team':
        return (
          <Stack spacing={3}>
            <Box>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                {editingItem ? 'Edit Project Partner' : 'Add Project Partner'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Add companies or individuals working on this project.
              </Typography>
            </Box>
            <ToggleButtonGroup
              value={teamRole}
              exclusive
              onChange={(_, v) => {
                if (v) {
                  setTeamRole(v);
                  setTeamSearch('');
                  setTeamSelectedPlatform(null);
                  setTeamManualMode(false);
                }
              }}
              size="small"
              fullWidth>

              <ToggleButton
                value="company"
                sx={{
                  textTransform: 'none',
                  flex: 1
                }}>

                Company
              </ToggleButton>
              <ToggleButton
                value="person"
                sx={{
                  textTransform: 'none',
                  flex: 1
                }}>

                Individual
              </ToggleButton>
            </ToggleButtonGroup>

            {/* Selected platform partner */}
            {teamSelectedPlatform && !teamManualMode ?
            <Paper
              variant="outlined"
              sx={{
                p: 1.5,
                borderRadius: 1.5,
                bgcolor: 'grey.50'
              }}>

                <Box display="flex" alignItems="center" gap={1.5}>
                  <Avatar
                  sx={{
                    width: 36,
                    height: 36,
                    bgcolor:
                    teamRole === 'person' ? 'primary.100' : 'grey.200',
                    borderRadius: teamRole === 'company' ? 1 : '50%',
                    fontSize: '0.75rem',
                    color: 'text.primary'
                  }}>

                    {teamRole === 'person' ?
                  teamSelectedPlatform.initials ||
                  teamSelectedPlatform.name.
                  split(' ').
                  map((w: string) => w[0]).
                  join('') :

                  <BusinessRounded
                    sx={{
                      fontSize: 18,
                      color: 'grey.500'
                    }} />

                  }
                  </Avatar>
                  <Box flex={1} minWidth={0}>
                    <Box display="flex" alignItems="center" gap={0.5}>
                      <Typography
                      variant="body2"
                      fontWeight="medium"
                      color="text.primary"
                      noWrap>

                        {teamSelectedPlatform.name}
                      </Typography>
                      {teamSelectedPlatform.verified &&
                    <Chip
                      label="On platform"
                      size="small"
                      sx={{
                        height: 18,
                        fontSize: '0.6rem',
                        bgcolor: 'teal',
                        color: 'white'
                      }} />

                    }
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      {teamSelectedPlatform.role}
                    </Typography>
                  </Box>
                  <IconButton
                  size="small"
                  onClick={() => {
                    setTeamSelectedPlatform(null);
                    setTeamSearch('');
                  }}>

                    <CloseRounded
                    sx={{
                      fontSize: 16
                    }} />

                  </IconButton>
                </Box>
              </Paper> :
            !teamManualMode /* Search field */ ?
            <Box>
                <TextField
                fullWidth
                size="small"
                placeholder={
                teamRole === 'company' ?
                'Search companies...' :
                'Search people...'
                }
                value={teamSearch}
                onChange={(e) => setTeamSearch(e.target.value)}
                InputProps={{
                  startAdornment:
                  <InputAdornment position="start">
                        <SearchRounded
                      sx={{
                        fontSize: 18,
                        color: 'grey.400'
                      }} />

                      </InputAdornment>,

                  endAdornment: teamSearch ?
                  <InputAdornment position="end">
                        <IconButton
                      size="small"
                      onClick={() => setTeamSearch('')}>

                          <CloseRounded
                        sx={{
                          fontSize: 14
                        }} />

                        </IconButton>
                      </InputAdornment> :
                  null
                }} />

                {/* Search results */}
                {teamSearch.length > 0 &&
              (() => {
                const pool =
                teamRole === 'company' ?
                mockPlatformCompanies :
                mockPlatformUsers;
                const results = pool.filter((p) =>
                p.name.toLowerCase().includes(teamSearch.toLowerCase())
                );
                return (
                  <Paper
                    variant="outlined"
                    sx={{
                      mt: 0.5,
                      borderRadius: 1.5,
                      overflow: 'hidden',
                      maxHeight: 220,
                      overflowY: 'auto'
                    }}>

                        {results.length > 0 ?
                    results.map((result) =>
                    <Box
                      key={result.id}
                      onClick={() => {
                        setTeamSelectedPlatform(result);
                        setTeamProjectRole(result.role);
                        setTeamSearch('');
                      }}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5,
                        px: 1.5,
                        py: 1,
                        cursor: 'pointer',
                        '&:hover': {
                          bgcolor: 'grey.50'
                        },
                        borderBottom: 1,
                        borderColor: 'grey.100'
                      }}>

                              <Avatar
                        sx={{
                          width: 28,
                          height: 28,
                          bgcolor:
                          teamRole === 'person' ?
                          'primary.100' :
                          'grey.200',
                          borderRadius:
                          teamRole === 'company' ? 0.5 : '50%',
                          fontSize: '0.65rem',
                          color: 'text.primary'
                        }}>

                                {teamRole === 'person' ?
                        (result as any).initials :

                        <BusinessRounded
                          sx={{
                            fontSize: 14,
                            color: 'grey.500'
                          }} />

                        }
                              </Avatar>
                              <Box flex={1} minWidth={0}>
                                <Box
                          display="flex"
                          alignItems="center"
                          gap={0.5}>

                                  <Typography
                            variant="caption"
                            fontWeight="medium"
                            color="text.primary"
                            noWrap>

                                    {result.name}
                                  </Typography>
                                  {result.verified &&
                          <Chip
                            label="On platform"
                            size="small"
                            sx={{
                              height: 16,
                              fontSize: '0.55rem',
                              bgcolor: 'teal',
                              color: 'white'
                            }} />

                          }
                                </Box>
                                <Typography
                          variant="caption"
                          color="text.disabled"
                          sx={{
                            fontSize: '0.65rem'
                          }}>

                                  {result.role}
                                </Typography>
                              </Box>
                            </Box>
                    ) :

                    <Box px={1.5} py={1.5}>
                            <Typography
                        variant="caption"
                        color="text.secondary">

                              No results found
                            </Typography>
                          </Box>
                    }
                        <Box
                      onClick={() => {
                        setTeamManualMode(true);
                        setTeamName(teamSearch);
                        setTeamSearch('');
                      }}
                      sx={{
                        px: 1.5,
                        py: 1,
                        cursor: 'pointer',
                        bgcolor: 'grey.50',
                        '&:hover': {
                          bgcolor: 'grey.100'
                        },
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1
                      }}>

                          <AddRounded
                        sx={{
                          fontSize: 14,
                          color: 'text.secondary'
                        }} />

                          <Typography variant="caption" color="text.secondary">
                            Not on platform? Add manually
                          </Typography>
                        </Box>
                      </Paper>);

              })()}
                <Button
                size="small"
                onClick={() => setTeamManualMode(true)}
                sx={{
                  mt: 1,
                  textTransform: 'none',
                  color: 'text.secondary',
                  fontSize: '0.75rem'
                }}>

                  + Add manually (not on platform)
                </Button>
              </Box> /* Manual entry */ :

            <Stack spacing={2}>
                <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between">

                  <Typography
                  variant="caption"
                  color="text.secondary"
                  fontWeight="medium">

                    Manual entry
                  </Typography>
                  <Button
                  size="small"
                  onClick={() => {
                    setTeamManualMode(false);
                    setTeamName('');
                  }}
                  sx={{
                    textTransform: 'none',
                    fontSize: '0.7rem'
                  }}>

                    Search instead
                  </Button>
                </Box>
                <TextField
                label={teamRole === 'company' ? 'Company Name' : 'Full Name'}
                fullWidth
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder={
                teamRole === 'company' ?
                'e.g., Pachama' :
                'e.g., Jane Smith'
                } />

              </Stack>
            }

            {/* Project Role — always shown once a partner is selected or in manual mode */}
            {(teamSelectedPlatform || teamManualMode) &&
            <Autocomplete
              options={projectRoles}
              value={teamProjectRole}
              onChange={(_, v) => setTeamProjectRole(v)}
              freeSolo
              renderInput={(params) =>
              <TextField
                {...params}
                label="Project Role"
                placeholder="e.g., MRV Provider" />

              } />

            }
          </Stack>);

      case 'opportunities':
        return (
          <Stack spacing={3}>
            <Box>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                {editingItem ? 'Edit Opportunity' : 'Add Opportunity'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                What does this project need?
              </Typography>
            </Box>
            <FormControl fullWidth>
              <InputLabel>Type</InputLabel>
              <Select
                value={oppType}
                label="Type"
                onChange={(e) => setOppType(e.target.value)}>

                {[
                'Financing',
                'Technical Advisor',
                'Buyers',
                'MRV Provider',
                'Insurance',
                'Local Partners'].
                map((type) =>
                <MenuItem key={type} value={type}>
                    {type}
                  </MenuItem>
                )}
              </Select>
            </FormControl>
            <TextField
              label="Description"
              fullWidth
              multiline
              minRows={2}
              value={oppDesc}
              onChange={(e) => setOppDesc(e.target.value)}
              placeholder="Describe what you're looking for..." />

            <FormControlLabel
              control={
              <Switch
                checked={oppUrgent}
                onChange={(e) => setOppUrgent(e.target.checked)} />

              }
              label={<Typography variant="body2">Mark as priority</Typography>} />

          </Stack>);

      case 'registry':
        return (
          <Stack spacing={3}>
            <Box>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Registry Information
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Link to carbon registry records.
              </Typography>
            </Box>
            <TextField
              label="Registry Platform"
              fullWidth
              defaultValue="Verra (VCS)" />

            <TextField label="Methodology" fullWidth defaultValue="VM0027" />
            <TextField
              label="Registry ID"
              fullWidth
              placeholder="e.g., VCS-2847" />

            <TextField
              label="Registry URL"
              fullWidth
              placeholder="https://registry.verra.org/..." />

          </Stack>);

      case 'impact':
        return (
          <Stack spacing={3}>
            <Box>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Impact & Credits
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Update credit issuance and impact data.
              </Typography>
            </Box>
            <TextField
              label="Total Credits Issued"
              fullWidth
              placeholder="e.g., 58,000" />

            <TextField
              label="Annual Estimate"
              fullWidth
              placeholder="e.g., 62,000 tCO2e/yr" />

            <TextField
              label="Credit Period"
              fullWidth
              placeholder="e.g., 25 years" />

          </Stack>);

      case 'settings':
        return (
          <Stack spacing={0}>
            {/* Tabs */}
            <Tabs
              value={settingsTab}
              onChange={(_, v) => setSettingsTab(v)}
              sx={{
                borderBottom: 1,
                borderColor: 'grey.200',
                mb: 3,
                mx: -3,
                px: 3
              }}>

              <Tab
                label="Visibility"
                sx={{
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '0.875rem'
                }} />

              <Tab
                label="Team Access"
                sx={{
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '0.875rem'
                }} />

            </Tabs>

            {/* Tab 0: Project Visibility */}
            {settingsTab === 0 &&
            <Stack spacing={3}>
                <Box>
                  <Typography
                  variant="caption"
                  fontWeight={600}
                  color="text.secondary"
                  sx={{
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                    display: 'block',
                    mb: 1.5
                  }}>

                    Project Visibility
                  </Typography>
                  <Stack spacing={0.75}>
                    {visibilityOptions.map((opt) => {
                    const isSelected = projectVisibility === opt.value;
                    return (
                      <Box
                        key={opt.value}
                        onClick={() => onProjectVisibilityChange(opt.value)}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1.5,
                          p: 1.25,
                          borderRadius: 1.5,
                          cursor: 'pointer',
                          border: '1px solid',
                          borderColor: isSelected ? 'grey.800' : 'grey.200',
                          bgcolor: isSelected ? 'grey.50' : 'white',
                          '&:hover': {
                            bgcolor: 'grey.50',
                            borderColor: 'grey.400'
                          },
                          transition: 'all 0.15s'
                        }}>

                          <opt.icon
                          sx={{
                            fontSize: 18,
                            color: isSelected ? 'grey.800' : 'grey.400',
                            flexShrink: 0
                          }} />

                          <Box flex={1} minWidth={0}>
                            <Typography
                            variant="body2"
                            fontWeight={isSelected ? 700 : 500}
                            color="text.primary">

                              {opt.label}
                            </Typography>
                            <Typography
                            variant="caption"
                            color="text.secondary">

                              {opt.desc}
                            </Typography>
                          </Box>
                          {isSelected &&
                        <Box
                          sx={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            bgcolor: 'grey.800',
                            flexShrink: 0
                          }} />

                        }
                        </Box>);

                  })}
                  </Stack>
                  <Typography
                  variant="caption"
                  color="text.disabled"
                  sx={{
                    mt: 1,
                    display: 'block'
                  }}>

                    Section-level visibility can be set per section using the
                    eye icon on each section header.
                  </Typography>
                </Box>
              </Stack>
            }

            {/* Tab 1: Team Access */}
            {settingsTab === 1 &&
            <Stack spacing={3}>
                <Box>
                  <Typography
                  variant="caption"
                  fontWeight={600}
                  color="text.secondary"
                  sx={{
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                    display: 'block',
                    mb: 0.5
                  }}>

                    Team Access
                  </Typography>
                  <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{
                    display: 'block',
                    mb: 1.5
                  }}>

                    Control who can view and edit this project. You can invite
                    external users who aren't company members.
                  </Typography>

                  {/* Members list */}
                  <Stack spacing={1} mb={2}>
                    {initialProjectPermissions.map((member) =>
                  <Box
                    key={member.id}
                    display="flex"
                    alignItems="center"
                    gap={1.5}
                    p={1.25}
                    borderRadius={1}
                    sx={{
                      border: '1px solid',
                      borderColor: 'grey.100',
                      bgcolor: 'white'
                    }}>

                        <Avatar
                      sx={{
                        width: 32,
                        height: 32,
                        bgcolor: member.isExternal ?
                        'primary.100' :
                        'grey.200',
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        flexShrink: 0
                      }}>

                          {member.name.
                      split(' ').
                      map((n: string) => n[0]).
                      join('')}
                        </Avatar>
                        <Box flex={1} minWidth={0}>
                          <Box display="flex" alignItems="center" gap={0.5}>
                            <Typography variant="body2" fontWeight={500} noWrap>
                              {member.name}
                            </Typography>
                            {member.isExternal &&
                        <Chip
                          label="External"
                          size="small"
                          sx={{
                            height: 16,
                            fontSize: '0.55rem',
                            bgcolor: 'primary.50',
                            color: 'primary.700'
                          }} />

                        }
                          </Box>
                          <Typography
                        variant="caption"
                        color="text.secondary"
                        noWrap>

                            {member.role}
                          </Typography>
                        </Box>
                        <FormControl
                      size="small"
                      sx={{
                        minWidth: 90,
                        flexShrink: 0
                      }}>

                          <Select
                        value={member.permission}
                        disabled={member.permission === 'Owner'}
                        sx={{
                          fontSize: '0.75rem',
                          height: 28
                        }}>

                            <MenuItem value="Owner" disabled>
                              <Typography variant="caption">Owner</Typography>
                            </MenuItem>
                            <MenuItem value="Admin">
                              <Typography variant="caption">Admin</Typography>
                            </MenuItem>
                            <MenuItem value="Editor">
                              <Typography variant="caption">Editor</Typography>
                            </MenuItem>
                            <MenuItem value="Viewer">
                              <Typography variant="caption">Viewer</Typography>
                            </MenuItem>
                          </Select>
                        </FormControl>
                        {member.permission !== 'Owner' &&
                    <IconButton
                      size="small"
                      sx={{
                        color: 'grey.400',
                        flexShrink: 0
                      }}>

                            <CloseRounded
                        sx={{
                          fontSize: 14
                        }} />

                          </IconButton>
                    }
                      </Box>
                  )}
                  </Stack>

                  {/* Add member */}
                  <Typography
                  variant="caption"
                  fontWeight={600}
                  color="text.secondary"
                  sx={{
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                    display: 'block',
                    mb: 1
                  }}>

                    Add Member
                  </Typography>
                  <Stack spacing={1.5}>
                    <TextField
                    size="small"
                    fullWidth
                    label="Search or invite by email"
                    placeholder="Name or email address..."
                    InputProps={{
                      startAdornment:
                      <InputAdornment position="start">
                            <SearchRounded
                          sx={{
                            fontSize: 16,
                            color: 'grey.400'
                          }} />

                          </InputAdornment>

                    }} />

                    <Typography variant="caption" color="text.secondary">
                      You can invite external users by email. They'll receive an
                      invitation to view or collaborate on this project.
                    </Typography>
                    <FormControl size="small" fullWidth>
                      <InputLabel>Permission Level</InputLabel>
                      <Select defaultValue="Viewer" label="Permission Level">
                        <MenuItem value="Admin">
                          Admin — can manage project & members
                        </MenuItem>
                        <MenuItem value="Editor">
                          Editor — can edit content
                        </MenuItem>
                        <MenuItem value="Viewer">
                          Viewer — read-only access
                        </MenuItem>
                      </Select>
                    </FormControl>
                    <Button
                    variant="outlined"
                    size="small"
                    startIcon={
                    <AddRounded
                      sx={{
                        fontSize: 16
                      }} />

                    }
                    sx={{
                      textTransform: 'none',
                      alignSelf: 'flex-start'
                    }}>

                      Add / Invite
                    </Button>
                  </Stack>
                </Box>

                <Divider />

                {/* Permission level legend */}
                <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  borderRadius: 1.5,
                  bgcolor: 'grey.50'
                }}>

                  <Typography
                  variant="caption"
                  fontWeight={600}
                  color="text.secondary"
                  display="block"
                  mb={1}>

                    Permission Levels
                  </Typography>
                  {[
                {
                  level: 'Owner',
                  desc: 'Full control, cannot be removed'
                },
                {
                  level: 'Admin',
                  desc: 'Manage members & all content'
                },
                {
                  level: 'Editor',
                  desc: 'Edit content, cannot manage members'
                },
                {
                  level: 'Viewer',
                  desc: 'Read-only access'
                }].
                map(({ level, desc }) =>
                <Box key={level} display="flex" gap={1} mb={0.5}>
                      <Typography
                    variant="caption"
                    fontWeight={600}
                    sx={{
                      minWidth: 48
                    }}>

                        {level}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {desc}
                      </Typography>
                    </Box>
                )}
                </Paper>
              </Stack>
            }
          </Stack>);

      case 'permissions':
        return (
          <Stack spacing={3}>
            <Box>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Project Permissions
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Control who can view and edit this project. Unlike company
                permissions, you can invite external users who aren't company
                members.
              </Typography>
            </Box>

            {/* Members list */}
            <Box>
              <Typography
                variant="caption"
                color="text.secondary"
                fontWeight={600}
                sx={{
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                  mb: 1,
                  display: 'block'
                }}>

                Members ({initialProjectPermissions.length})
              </Typography>
              <Stack spacing={1}>
                {initialProjectPermissions.map((member) =>
                <Box
                  key={member.id}
                  display="flex"
                  alignItems="center"
                  gap={1.5}
                  p={1.25}
                  borderRadius={1}
                  sx={{
                    border: '1px solid',
                    borderColor: 'grey.100',
                    bgcolor: 'white'
                  }}>

                    <Avatar
                    sx={{
                      width: 32,
                      height: 32,
                      bgcolor: member.isExternal ? 'primary.100' : 'grey.200',
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      flexShrink: 0
                    }}>

                      {member.name.
                    split(' ').
                    map((n: string) => n[0]).
                    join('')}
                    </Avatar>
                    <Box flex={1} minWidth={0}>
                      <Box display="flex" alignItems="center" gap={0.5}>
                        <Typography variant="body2" fontWeight={500} noWrap>
                          {member.name}
                        </Typography>
                        {member.isExternal &&
                      <Chip
                        label="External"
                        size="small"
                        sx={{
                          height: 16,
                          fontSize: '0.55rem',
                          bgcolor: 'primary.50',
                          color: 'primary.700'
                        }} />

                      }
                      </Box>
                      <Typography
                      variant="caption"
                      color="text.secondary"
                      noWrap>

                        {member.role}
                      </Typography>
                    </Box>
                    <FormControl
                    size="small"
                    sx={{
                      minWidth: 90,
                      flexShrink: 0
                    }}>

                      <Select
                      value={member.permission}
                      disabled={member.permission === 'Owner'}
                      sx={{
                        fontSize: '0.75rem',
                        height: 28
                      }}>

                        <MenuItem value="Owner" disabled>
                          <Typography variant="caption">Owner</Typography>
                        </MenuItem>
                        <MenuItem value="Admin">
                          <Typography variant="caption">Admin</Typography>
                        </MenuItem>
                        <MenuItem value="Editor">
                          <Typography variant="caption">Editor</Typography>
                        </MenuItem>
                        <MenuItem value="Viewer">
                          <Typography variant="caption">Viewer</Typography>
                        </MenuItem>
                      </Select>
                    </FormControl>
                    {member.permission !== 'Owner' &&
                  <IconButton
                    size="small"
                    sx={{
                      color: 'grey.400',
                      flexShrink: 0
                    }}>

                        <CloseRounded
                      sx={{
                        fontSize: 14
                      }} />

                      </IconButton>
                  }
                  </Box>
                )}
              </Stack>
            </Box>

            <Divider />

            {/* Add member — allows external users */}
            <Box>
              <Typography
                variant="caption"
                color="text.secondary"
                fontWeight={600}
                sx={{
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                  mb: 1.5,
                  display: 'block'
                }}>

                Add Member
              </Typography>
              <Stack spacing={1.5}>
                <TextField
                  size="small"
                  fullWidth
                  label="Search or invite by email"
                  placeholder="Name or email address..."
                  InputProps={{
                    startAdornment:
                    <InputAdornment position="start">
                        <SearchRounded
                        sx={{
                          fontSize: 16,
                          color: 'grey.400'
                        }} />

                      </InputAdornment>

                  }} />

                <Typography variant="caption" color="text.secondary">
                  You can invite external users (not on the platform) by email.
                  They'll receive an invitation to view or collaborate on this
                  project.
                </Typography>
                <FormControl size="small" fullWidth>
                  <InputLabel>Permission Level</InputLabel>
                  <Select defaultValue="Viewer" label="Permission Level">
                    <MenuItem value="Admin">
                      Admin — can manage project & members
                    </MenuItem>
                    <MenuItem value="Editor">
                      Editor — can edit content
                    </MenuItem>
                    <MenuItem value="Viewer">
                      Viewer — read-only access
                    </MenuItem>
                  </Select>
                </FormControl>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={
                  <AddRounded
                    sx={{
                      fontSize: 16
                    }} />

                  }
                  sx={{
                    textTransform: 'none',
                    alignSelf: 'flex-start'
                  }}>

                  Add / Invite
                </Button>
              </Stack>
            </Box>

            {/* Legend */}
            <Paper
              variant="outlined"
              sx={{
                p: 2,
                borderRadius: 1.5,
                bgcolor: 'grey.50'
              }}>

              <Typography
                variant="caption"
                fontWeight={600}
                color="text.secondary"
                display="block"
                mb={1}>

                Permission Levels
              </Typography>
              {[
              {
                level: 'Owner',
                desc: 'Full control, cannot be removed'
              },
              {
                level: 'Admin',
                desc: 'Manage members & all content'
              },
              {
                level: 'Editor',
                desc: 'Edit content, cannot manage members'
              },
              {
                level: 'Viewer',
                desc: 'Read-only access'
              }].
              map(({ level, desc }) =>
              <Box key={level} display="flex" gap={1} mb={0.5}>
                  <Typography
                  variant="caption"
                  fontWeight={600}
                  sx={{
                    minWidth: 48
                  }}>

                    {level}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {desc}
                  </Typography>
                </Box>
              )}
            </Paper>
          </Stack>);

      default:
        return (
          <Box py={4} textAlign="center">
            <Typography variant="body2" color="text.secondary">
              Editor for "{section}" section
            </Typography>
          </Box>);

    }
  };
  const handleSave = () => {
    if (onSave) {
      let data: any = {};
      if (section === 'team') {
        const resolvedName = teamSelectedPlatform ?
        teamSelectedPlatform.name :
        teamName;
        data = {
          name: resolvedName,
          type: teamProjectRole || 'Other',
          partnerKind: teamRole,
          platformId: teamSelectedPlatform ? teamSelectedPlatform.id : null,
          id: resolvedName.toLowerCase().replace(/\s+/g, '-')
        };
      } else if (section === 'opportunities') {
        data = {
          type: oppType,
          desc: oppDesc,
          urgent: oppUrgent
        };
      }
      onSave(section, data, !!editingItem);
    }
    onClose();
  };
  const getTitle = () => {
    if (editingItem) return 'Edit';
    if (
    section === 'update' ||
    section === 'document' ||
    section === 'media' ||
    section === 'team' ||
    section === 'opportunities')

    return 'Add';
    return 'Edit';
  };
  return (
    <SidebarPanel
      open={open}
      onClose={onClose}
      title={getTitle()}
      onSave={handleSave}>

      {renderContent()}
    </SidebarPanel>);

}
// Progress Track Component
function ProgressTrackCompact({
  currentStage,
  stageIndex



}: {currentStage: ProjectStage;stageIndex: number;}) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        position: 'relative',
        py: 1
      }}>

      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: 0,
          right: 0,
          height: 2,
          bgcolor: 'grey.200',
          zIndex: 0,
          transform: 'translateY(-50%)'
        }} />

      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: 0,
          width: `${stageIndex / (stageLabels.length - 1) * 100}%`,
          height: 2,
          bgcolor: 'grey.800',
          zIndex: 0,
          transform: 'translateY(-50%)',
          transition: 'width 0.3s ease'
        }} />

      {stageLabels.map((stage, i) => {
        const isActive = i === stageIndex;
        const isCompleted = i < stageIndex;
        return (
          <Tooltip
            key={stage}
            title={`${stage}: ${stageDescriptions[stage]}`}
            arrow
            placement="top">

            <Box
              sx={{
                width: isActive ? 16 : 10,
                height: isActive ? 16 : 10,
                borderRadius: '50%',
                bgcolor: isCompleted || isActive ? 'grey.800' : 'white',
                border: 2,
                borderColor: isCompleted || isActive ? 'grey.800' : 'grey.300',
                zIndex: 1,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                '&:hover': {
                  transform: 'scale(1.2)'
                }
              }} />

          </Tooltip>);

      })}
    </Box>);

}
// Share Menu Component
function ShareMenu({
  anchorEl,
  onClose,
  projectName,
  upid





}: {anchorEl: null | HTMLElement;onClose: () => void;projectName: string;upid: string;}) {
  return (
    <SharedShareMenu
      anchorEl={anchorEl}
      open={Boolean(anchorEl)}
      onClose={onClose}
      shareUrl={window.location.href}
      shareTitle={`${projectName} - Carbon Project`} />);


}
// Update Modal Component
function UpdateModal({
  update,
  open,
  onClose




}: {update: any;open: boolean;onClose: () => void;}) {
  if (!update) return null;
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <Box position="absolute" top={16} right={16} zIndex={1}>
        <IconButton
          onClick={onClose}
          size="small"
          sx={{
            bgcolor: 'white',
            '&:hover': {
              bgcolor: 'grey.100'
            }
          }}>

          <CloseRounded
            sx={{
              fontSize: 20
            }} />

        </IconButton>
      </Box>
      <DialogTitle>
        <Typography variant="h6" fontWeight="bold" color="text.primary">
          {update.title}
        </Typography>
      </DialogTitle>
      <DialogContent
        sx={{
          p: 3
        }}>

        {update.hasPhoto &&
        <Box
          sx={{
            width: '100%',
            aspectRatio: '16/9',
            bgcolor: 'grey.100',
            borderRadius: 2,
            mb: 3,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: 1,
            borderColor: 'grey.200'
          }}>

            <ImageRounded
            sx={{
              fontSize: 48,
              color: 'grey.300'
            }} />

          </Box>
        }
        <Typography
          variant="caption"
          color="text.secondary"
          display="block"
          mb={1}>

          {update.date}
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          paragraph
          sx={{
            lineHeight: 1.6
          }}>

          {update.desc}
        </Typography>
        <Box
          display="flex"
          alignItems="center"
          gap={1}
          pt={2}
          borderTop={1}
          borderColor="grey.100">

          <Avatar
            sx={{
              width: 24,
              height: 24,
              bgcolor: 'grey.100'
            }}>

            <PersonRounded
              sx={{
                fontSize: 12,
                color: 'grey.500'
              }} />

          </Avatar>
          <Typography variant="caption" color="text.secondary">
            Posted by {update.author}
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button
          variant="outlined"
          onClick={onClose}
          sx={{
            color: 'text.secondary',
            borderColor: 'grey.300'
          }}>

          Close
        </Button>
      </DialogActions>
    </Dialog>);

}
// Section Component - NON-COLLAPSIBLE with bigger, darker edit/add icons
function Section({
  title,
  children,
  onEdit,
  onAdd,
  isOwner = false,
  sectionVisibility = 'public',
  projectVisibility = 'public',
  onVisibilityChange










}: {title: string;children: React.ReactNode;defaultOpen?: boolean;onEdit?: () => void;onAdd?: () => void;isOwner?: boolean;sectionVisibility?: ProjectVisibility;projectVisibility?: ProjectVisibility;onVisibilityChange?: (v: ProjectVisibility) => void;}) {
  const [visMenuAnchor, setVisMenuAnchor] = useState<null | HTMLElement>(null);
  const visibilityOrder: Record<ProjectVisibility, number> = {
    public: 0,
    registered: 1,
    members: 2,
    private: 3
  };
  const visibilityMeta: Record<
    ProjectVisibility,
    {
      icon: React.ReactNode;
      label: string;
      desc: string;
    }> =
  {
    public: {
      icon:
      <PublicRounded
        sx={{
          fontSize: 13
        }} />,


      label: 'Public',
      desc: 'Anyone can view'
    },
    registered: {
      icon:
      <GroupRounded
        sx={{
          fontSize: 13
        }} />,


      label: 'Registered',
      desc: 'Signed-in users only'
    },
    members: {
      icon:
      <ShieldRounded
        sx={{
          fontSize: 13
        }} />,


      label: 'Members only',
      desc: 'Invited members only'
    },
    private: {
      icon:
      <VisibilityOffRounded
        sx={{
          fontSize: 13
        }} />,


      label: 'Private',
      desc: 'Only you'
    }
  };
  const isPrivate = sectionVisibility === 'private';
  const currentMeta = visibilityMeta[sectionVisibility];
  const projectLevel = visibilityOrder[projectVisibility];
  return (
    <Paper
      variant="outlined"
      sx={{
        borderRadius: 2,
        overflow: 'hidden',
        mb: 2,
        opacity: isPrivate ? 0.7 : 1,
        borderColor: isPrivate ? '#ffcc80' : undefined
      }}>

      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 2,
          borderBottom: 1,
          borderColor: 'grey.100',
          bgcolor: isPrivate ? '#fff8e1' : 'grey.50'
        }}>

        {/* Left: title + hidden chip */}
        <Box display="flex" alignItems="center" gap={1}>
          <Typography
            variant="subtitle2"
            fontWeight="bold"
            color="text.primary">

            {title}
          </Typography>
          {isPrivate && isOwner &&
          <Chip
            icon={
            <VisibilityOffRounded
              sx={{
                fontSize: 14
              }} />

            }
            label="Hidden"
            size="small"
            sx={{
              height: 22,
              fontSize: '0.625rem',
              bgcolor: '#fff3e0',
              color: '#ed6c02',
              border: 1,
              borderColor: '#ffcc80',
              fontWeight: 600,
              '& .MuiChip-icon': {
                color: '#ed6c02'
              }
            }} />

          }
        </Box>

        {/* Right: visibility control + edit/add buttons */}
        <Box display="flex" alignItems="center" gap={1}>
          {isOwner && onVisibilityChange &&
          <>
              <Tooltip
              title={`${currentMeta.label}: ${currentMeta.desc}`}
              arrow
              placement="top">

                <IconButton
                size="small"
                onClick={(e) => setVisMenuAnchor(e.currentTarget)}
                sx={{
                  color: isPrivate ? '#ed6c02' : 'grey.400',
                  p: 0.5,
                  '&:hover': {
                    color: 'grey.700',
                    bgcolor: 'grey.100'
                  }
                }}>

                  {currentMeta.icon}
                </IconButton>
              </Tooltip>
              <Menu
              anchorEl={visMenuAnchor}
              open={Boolean(visMenuAnchor)}
              onClose={() => setVisMenuAnchor(null)}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right'
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right'
              }}
              PaperProps={{
                sx: {
                  minWidth: 200,
                  boxShadow: 3,
                  borderRadius: 1.5
                }
              }}>

                <Box px={1.5} pt={1} pb={0.5}>
                  <Typography
                  variant="caption"
                  color="text.secondary"
                  fontWeight={600}
                  sx={{
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                    fontSize: '0.6rem'
                  }}>

                    Section visibility
                  </Typography>
                  {projectVisibility !== 'public' &&
                <Typography
                  variant="caption"
                  color="text.disabled"
                  display="block"
                  sx={{
                    fontSize: '0.65rem',
                    mt: 0.25
                  }}>

                      Limited by project visibility (
                      {visibilityMeta[projectVisibility].label})
                    </Typography>
                }
                </Box>
                {(Object.keys(visibilityMeta) as ProjectVisibility[]).map(
                (opt) => {
                  const disabled = visibilityOrder[opt] < projectLevel;
                  return (
                    <MenuItem
                      key={opt}
                      selected={sectionVisibility === opt}
                      disabled={disabled}
                      onClick={() => {
                        onVisibilityChange(opt);
                        setVisMenuAnchor(null);
                      }}
                      sx={{
                        py: 0.75,
                        opacity: disabled ? 0.4 : 1
                      }}>

                        <ListItemIcon
                        sx={{
                          minWidth: 28,
                          color: opt === 'private' ? '#ed6c02' : 'grey.600'
                        }}>

                          {visibilityMeta[opt].icon}
                        </ListItemIcon>
                        <ListItemText
                        primary={
                        <Typography
                          variant="body2"
                          fontWeight={sectionVisibility === opt ? 600 : 400}>

                              {visibilityMeta[opt].label}
                            </Typography>
                        }
                        secondary={
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{
                            fontSize: '0.65rem'
                          }}>

                              {visibilityMeta[opt].desc}
                            </Typography>
                        } />

                      </MenuItem>);

                }
              )}
              </Menu>
            </>
          }

          {isOwner && (onAdd || onEdit) &&
          <>
              {onAdd &&
            <IconButton
              size="small"
              onClick={onAdd}
              sx={{
                color: 'grey.700',
                bgcolor: 'white',
                border: 1,
                borderColor: 'grey.300',
                width: 32,
                height: 32,
                '&:hover': {
                  color: 'primary.main',
                  bgcolor: 'primary.50',
                  borderColor: 'primary.main'
                }
              }}>

                  <AddRounded
                sx={{
                  fontSize: 18
                }} />

                </IconButton>
            }
              {onEdit &&
            <IconButton
              size="small"
              onClick={onEdit}
              sx={{
                color: 'grey.700',
                bgcolor: 'white',
                border: 1,
                borderColor: 'grey.300',
                width: 32,
                height: 32,
                '&:hover': {
                  color: 'primary.main',
                  bgcolor: 'primary.50',
                  borderColor: 'primary.main'
                }
              }}>

                  <EditRounded
                sx={{
                  fontSize: 18
                }} />

                </IconButton>
            }
            </>
          }
        </Box>
      </Box>
      <Box p={3}>{children}</Box>
    </Paper>);

}
export function ProjectWireframe() {
  const { id } = useParams<{
    id: string;
  }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  // Check if edit mode from URL params
  const isEditMode = searchParams.get('edit') === 'true';
  // Check where user came from for back navigation
  const fromParam = searchParams.get('from');
  // Determine if current user is the owner based on route or project ID
  const projectId = id || 'CUP-MY042713-5';
  const projectData =
  projectDataMap[projectId] || projectDataMap['CUP-MY042713-5'];
  const [isOwner] = useState(() => {
    return projectId.includes('MY') || projectId === 'new-project' || isEditMode;
  });
  // Universal back navigation based on 'from' param
  const handleBackNavigation = () => {
    if (fromParam === 'profile') {
      navigate('/account?tab=projects');
    } else if (fromParam === 'my' || isOwner) {
      navigate('/projects?tab=my');
    } else {
      navigate('/projects');
    }
  };
  // Get back button label
  const getBackLabel = () => {
    if (fromParam === 'profile') {
      return 'My Profile';
    }
    if (fromParam === 'my' || isOwner) {
      return 'My Projects';
    }
    return 'Projects';
  };
  const [currentStage, setCurrentStage] = useState<ProjectStage>(
    projectData.stage
  );
  const [shareAnchorEl, setShareAnchorEl] = useState<null | HTMLElement>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [selectedUpdate, setSelectedUpdate] = useState<any>(null);
  const [selectedOpportunity, setSelectedOpportunity] = useState<any>(null);
  const [showReadiness, setShowReadiness] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarSection, setSidebarSection] = useState('');
  const [editingItem, setEditingItem] = useState<any>(null);
  // Preview mode state
  const [previewMode, setPreviewMode] = useState(false);
  const [previewAs, setPreviewAs] = useState<ProjectVisibility>('public');
  const [updateMenuAnchor, setUpdateMenuAnchor] = useState<{
    el: HTMLElement;
    update: any;
    index: number;
  } | null>(null);
  // Section visibility state
  const [sectionVisibility, setSectionVisibility] = useState<
    Record<string, ProjectVisibility>>(
    {
      story: 'public',
      media: 'public',
      opportunities: 'public',
      update: 'public',
      document: 'public',
      impact: 'public',
      location: 'public',
      stage: 'public',
      registry: 'public',
      team: 'public'
    });
  const [projectVisibility, setProjectVisibility] =
  useState<ProjectVisibility>('public');
  // Menu anchors for documents, media, and team
  const [documentMenuAnchor, setDocumentMenuAnchor] = useState<{
    el: HTMLElement;
    doc: any;
    index: number;
  } | null>(null);
  const [mediaMenuAnchor, setMediaMenuAnchor] = useState<{
    el: HTMLElement;
    media: any;
    index: number;
  } | null>(null);
  const [teamMenuAnchor, setTeamMenuAnchor] = useState<{
    el: HTMLElement;
    provider: any;
    index: number;
  } | null>(null);
  const [oppMenuAnchor, setOppMenuAnchor] = useState<{
    el: HTMLElement;
    opp: any;
    index: number;
  } | null>(null);
  // Delete confirmation dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteItemType, setDeleteItemType] = useState<
    'document' | 'media' | 'team' | 'update' | 'opportunity' | null>(
    null);
  const [itemToDelete, setItemToDelete] = useState<any>(null);
  const [itemToDeleteIndex, setItemToDeleteIndex] = useState<number>(-1);
  // Snackbar state for undo functionality
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [deletedItem, setDeletedItem] = useState<{
    type: 'document' | 'media' | 'team' | 'update' | 'opportunity';
    item: any;
    index: number;
  } | null>(null);
  const [undoTimeoutId, setUndoTimeoutId] = useState<NodeJS.Timeout | null>(
    null
  );
  const config = stageConfig[currentStage];
  const upid = projectId;
  const projectName = projectData.name;
  const freshnessStatus: FreshnessStatus =
  currentStage === 'Exploration' || currentStage === 'Concept' ?
  'not-applicable' :
  currentStage === 'Design' || currentStage === 'Validation' ?
  'up-to-date' :
  currentStage === 'Listed' ?
  'needs-attention' :
  'up-to-date';
  // Local state for editable lists
  const [localDocuments, setLocalDocuments] = useState(config.documents);
  const [localMedia, setLocalMedia] = useState<MediaItem[]>(config.media);
  const [localServiceProviders, setLocalServiceProviders] = useState(
    config.serviceProviders
  );
  const [localUpdates, setLocalUpdates] = useState(config.updates);
  const [localOpportunities, setLocalOpportunities] = useState(
    config.opportunities
  );
  // Update local state when stage changes
  useEffect(() => {
    setLocalDocuments(stageConfig[currentStage].documents);
    setLocalMedia(stageConfig[currentStage].media);
    setLocalServiceProviders(stageConfig[currentStage].serviceProviders);
    setLocalUpdates(stageConfig[currentStage].updates);
    setLocalOpportunities(stageConfig[currentStage].opportunities);
  }, [currentStage]);
  const hasDocuments = localDocuments.length > 0;
  const hasMedia = localMedia.length > 0;
  const hasUpdates = localUpdates.length > 0;
  const hasServiceProviders = localServiceProviders.length > 0;
  const hasOpportunities = localOpportunities.length > 0;
  const openEditor = (section: string, item?: any) => {
    setSidebarSection(section);
    setEditingItem(item || null);
    setSidebarOpen(true);
  };
  // Collaborators Card - defined inside component to access component state
  const collaboratorsCardContent =
  <Paper
    variant="outlined"
    sx={{
      borderRadius: 2,
      width: '100%',
      overflow: 'hidden'
    }}>

      <Box
      p={1.5}
      borderBottom={1}
      borderColor="grey.100"
      display="flex"
      alignItems="center"
      justifyContent="space-between"
      bgcolor="grey.50">

        <Typography variant="caption" fontWeight="bold" color="text.primary">
          Project Partners
        </Typography>
        {isOwner &&
      <IconButton
        size="small"
        onClick={() => openEditor('team')}
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
            borderColor: 'primary.main'
          }
        }}>

            <AddRounded
          sx={{
            fontSize: 16
          }} />

          </IconButton>
      }
      </Box>
      <Box p={2}>
        <Box mb={2}>
          <Typography
          variant="caption"
          color="text.disabled"
          sx={{
            display: 'block',
            mb: 1
          }}>

            Developer
          </Typography>
          <Box
          onClick={() => navigate('/companies/borneo-carbon')}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            cursor: 'pointer',
            mx: -1,
            px: 1,
            py: 0.75,
            borderRadius: 1,
            '&:hover': {
              bgcolor: 'grey.50'
            }
          }}>

            <Box
            sx={{
              width: 32,
              height: 32,
              bgcolor: 'grey.100',
              borderRadius: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>

              <BusinessRounded
              sx={{
                fontSize: 16,
                color: 'grey.400'
              }} />

            </Box>
            <Box minWidth={0} flex={1}>
              <Typography
              variant="body2"
              fontWeight="medium"
              color="text.primary">

                {projectData.developer}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Lead Developer
              </Typography>
            </Box>
          </Box>
        </Box>
        {hasServiceProviders &&
      <Box>
            <Typography
          variant="caption"
          color="text.disabled"
          sx={{
            display: 'block',
            mb: 1
          }}>

              Service Providers
            </Typography>
            <Stack spacing={0.5}>
              {localServiceProviders.map((provider, i) =>
          <Box
            key={provider.id || i}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              mx: -1,
              px: 1,
              py: 0.75,
              borderRadius: 1,
              position: 'relative',
              '&:hover': {
                bgcolor: 'grey.50'
              }
            }}>

                  <Box
              onClick={() => navigate(`/companies/${provider.id}`)}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                flex: 1,
                cursor: 'pointer',
                minWidth: 0
              }}>

                    <Box
                sx={{
                  width: 32,
                  height: 32,
                  bgcolor: 'grey.50',
                  borderRadius:
                  provider.partnerKind === 'person' ? '50%' : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: 1,
                  borderColor: 'grey.200',
                  flexShrink: 0
                }}>

                      {provider.partnerKind === 'person' ?
                <PersonRounded
                  sx={{
                    fontSize: 16,
                    color: 'grey.400'
                  }} /> :


                <BuildRounded
                  sx={{
                    fontSize: 16,
                    color: 'grey.400'
                  }} />

                }
                    </Box>
                    <Box flex={1} minWidth={0}>
                      <Typography
                  variant="caption"
                  fontWeight="medium"
                  color="text.primary"
                  display="block"
                  noWrap>

                        {provider.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {provider.type}
                      </Typography>
                    </Box>
                  </Box>
                  {isOwner &&
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                setTeamMenuAnchor({
                  el: e.currentTarget,
                  provider,
                  index: i
                });
              }}
              sx={{
                color: 'grey.400',
                flexShrink: 0,
                '&:hover': {
                  color: 'grey.600'
                }
              }}>

                      <MoreVertRounded
                sx={{
                  fontSize: 16
                }} />

                    </IconButton>
            }
                </Box>
          )}
            </Stack>
          </Box>
      }
      </Box>
    </Paper>;

  // Handle save from sidebar editor
  const handleSidebarSave = (
  section: string,
  data: any,
  isEditing: boolean) =>
  {
    if (section === 'team') {
      if (data.name && data.type) {
        if (isEditing && editingItem) {
          setLocalServiceProviders((prev) =>
          prev.map((p) =>
          p.id === editingItem.id ?
          {
            ...p,
            ...data
          } :
          p
          )
          );
        } else {
          setLocalServiceProviders((prev) => [...prev, data]);
        }
      }
    } else if (section === 'opportunities') {
      if (data.type) {
        const iconMap: Record<string, any> = {
          Financing: AttachMoneyRounded,
          'Technical Advisor': TrendingUpRounded,
          Buyers: PeopleRounded,
          'MRV Provider': TrendingUpRounded,
          Insurance: ShieldRounded,
          'Local Partners': GroupRounded,
          Validation: ShieldRounded
        };
        const newOpp = {
          type: data.type,
          icon: iconMap[data.type] || TrendingUpRounded,
          desc: data.desc || '',
          urgent: data.urgent || false
        };
        if (isEditing && editingItem) {
          setLocalOpportunities((prev) =>
          prev.map((o) => o === editingItem ? newOpp : o)
          );
        } else {
          setLocalOpportunities((prev) => [...prev, newOpp]);
        }
      }
    }
  };
  // Delete confirmation handlers
  const handleDeleteDialogClose = () => {
    setDeleteDialogOpen(false);
    setDeleteItemType(null);
    setItemToDelete(null);
    setItemToDeleteIndex(-1);
  };
  const handleConfirmDelete = () => {
    if (!deleteItemType || !itemToDelete) return;
    // Store deleted item for undo
    setDeletedItem({
      type: deleteItemType,
      item: itemToDelete,
      index: itemToDeleteIndex
    });
    // Actually remove the item from local state
    if (deleteItemType === 'document') {
      setLocalDocuments((prev) =>
      prev.filter((_, i) => i !== itemToDeleteIndex)
      );
    } else if (deleteItemType === 'media') {
      setLocalMedia((prev) => prev.filter((_, i) => i !== itemToDeleteIndex));
    } else if (deleteItemType === 'team') {
      setLocalServiceProviders((prev) =>
      prev.filter((_, i) => i !== itemToDeleteIndex)
      );
    } else if (deleteItemType === 'update') {
      setLocalUpdates((prev) => prev.filter((_, i) => i !== itemToDeleteIndex));
    } else if (deleteItemType === 'opportunity') {
      setLocalOpportunities((prev) =>
      prev.filter((_, i) => i !== itemToDeleteIndex)
      );
    }
    const itemName =
    deleteItemType === 'media' ?
    itemToDelete.caption :
    deleteItemType === 'update' ?
    itemToDelete.title :
    deleteItemType === 'opportunity' ?
    itemToDelete.type :
    itemToDelete.name;
    setSnackbarMessage(
      `${deleteItemType === 'document' ? 'Document' : deleteItemType === 'media' ? 'Media' : deleteItemType === 'team' ? 'Service provider' : deleteItemType === 'opportunity' ? 'Opportunity' : 'Update'} "${itemName}" deleted`
    );
    setSnackbarOpen(true);
    // Set 15-second timeout for undo
    if (undoTimeoutId) {
      clearTimeout(undoTimeoutId);
    }
    const timeoutId = setTimeout(() => {
      setDeletedItem(null);
    }, 15000);
    setUndoTimeoutId(timeoutId);
    handleDeleteDialogClose();
  };
  const handleUndo = () => {
    if (!deletedItem) return;
    // Restore the item to local state at its original position
    if (deletedItem.type === 'document') {
      setLocalDocuments((prev) => {
        const newDocs = [...prev];
        newDocs.splice(deletedItem.index, 0, deletedItem.item);
        return newDocs;
      });
    } else if (deletedItem.type === 'media') {
      setLocalMedia((prev) => {
        const newMedia = [...prev];
        newMedia.splice(deletedItem.index, 0, deletedItem.item);
        return newMedia;
      });
    } else if (deletedItem.type === 'team') {
      setLocalServiceProviders((prev) => {
        const newProviders = [...prev];
        newProviders.splice(deletedItem.index, 0, deletedItem.item);
        return newProviders;
      });
    } else if (deletedItem.type === 'update') {
      setLocalUpdates((prev) => {
        const newUpdates = [...prev];
        newUpdates.splice(deletedItem.index, 0, deletedItem.item);
        return newUpdates;
      });
    } else if (deletedItem.type === 'opportunity') {
      setLocalOpportunities((prev) => {
        const newOpps = [...prev];
        newOpps.splice(deletedItem.index, 0, deletedItem.item);
        return newOpps;
      });
    }
    const itemName =
    deletedItem.type === 'media' ?
    deletedItem.item.caption :
    deletedItem.type === 'update' ?
    deletedItem.item.title :
    deletedItem.type === 'opportunity' ?
    deletedItem.item.type :
    deletedItem.item.name;
    setSnackbarMessage(`"${itemName}" restored`);
    if (undoTimeoutId) {
      clearTimeout(undoTimeoutId);
      setUndoTimeoutId(null);
    }
    setDeletedItem(null);
    setTimeout(() => {
      setSnackbarOpen(false);
    }, 2000);
  };
  const handleSnackbarClose = (
  event?: React.SyntheticEvent | Event,
  reason?: string) =>
  {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbarOpen(false);
  };
  // Document menu handlers
  const handleDocumentDelete = () => {
    if (!documentMenuAnchor) return;
    setDeleteItemType('document');
    setItemToDelete(documentMenuAnchor.doc);
    setItemToDeleteIndex(documentMenuAnchor.index);
    setDeleteDialogOpen(true);
    setDocumentMenuAnchor(null);
  };
  // Media menu handlers
  const handleMediaDelete = () => {
    if (!mediaMenuAnchor) return;
    setDeleteItemType('media');
    setItemToDelete(mediaMenuAnchor.media);
    setItemToDeleteIndex(mediaMenuAnchor.index);
    setDeleteDialogOpen(true);
    setMediaMenuAnchor(null);
  };
  // Team menu handlers
  const handleTeamDelete = () => {
    if (!teamMenuAnchor) return;
    setDeleteItemType('team');
    setItemToDelete(teamMenuAnchor.provider);
    setItemToDeleteIndex(teamMenuAnchor.index);
    setDeleteDialogOpen(true);
    setTeamMenuAnchor(null);
  };
  // Update menu handlers
  const handleUpdateDelete = () => {
    if (!updateMenuAnchor) return;
    setDeleteItemType('update');
    setItemToDelete(updateMenuAnchor.update);
    setItemToDeleteIndex(updateMenuAnchor.index);
    setDeleteDialogOpen(true);
    setUpdateMenuAnchor(null);
  };
  // Opportunity menu handlers
  const handleOppDelete = () => {
    if (!oppMenuAnchor) return;
    setDeleteItemType('opportunity');
    setItemToDelete(oppMenuAnchor.opp);
    setItemToDeleteIndex(oppMenuAnchor.index);
    setDeleteDialogOpen(true);
    setOppMenuAnchor(null);
  };
  return (
    <Box minHeight="100vh" bgcolor="white" color="text.secondary">
      {/* Header Bar */}
      <Box
        bgcolor="white"
        borderBottom={1}
        borderColor="grey.200"
        px={3}
        py={1.5}>

        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={2}>
            <Button
              startIcon={
              <ArrowBackRounded
                sx={{
                  fontSize: 16
                }} />

              }
              onClick={handleBackNavigation}
              sx={{
                textTransform: 'none',
                color: 'text.secondary',
                '&:hover': {
                  color: 'text.primary'
                }
              }}>

              {getBackLabel()}
            </Button>
            <Typography color="grey.300">|</Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              noWrap
              sx={{
                maxWidth: 320
              }}>

              {projectName}
            </Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={1.5}>
            {isOwner &&
            <>
                <Typography variant="caption" color="text.secondary">
                  Preview stage:
                </Typography>
                <Select
                value={currentStage}
                onChange={(e) =>
                setCurrentStage(e.target.value as ProjectStage)
                }
                size="small"
                sx={{
                  fontSize: '0.75rem',
                  height: 32
                }}>

                  {stageLabels.map((stage) =>
                <MenuItem key={stage} value={stage}>
                      {stage}
                    </MenuItem>
                )}
                </Select>
                <Divider
                orientation="vertical"
                flexItem
                sx={{
                  mx: 1
                }} />

                <Button
                variant="outlined"
                size="small"
                startIcon={
                <VisibilityRounded
                  sx={{
                    fontSize: 14
                  }} />

                }
                onClick={() => setPreviewMode(true)}
                sx={{
                  textTransform: 'none',
                  borderColor: 'grey.300',
                  color: 'text.secondary',
                  '&:hover': {
                    borderColor: 'grey.400',
                    bgcolor: 'grey.50'
                  }
                }}>

                  Preview
                </Button>
                <Button
                variant="outlined"
                size="small"
                onClick={() => openEditor('settings')}
                sx={{
                  textTransform: 'none',
                  borderColor: 'grey.300'
                }}>

                  Settings
                </Button>
              </>
            }
          </Box>
        </Box>
      </Box>

      {/* Preview Banner */}
      {previewMode &&
      <PreviewBanner
        previewAs={previewAs}
        onChangeAudience={setPreviewAs}
        onExit={() => setPreviewMode(false)}
        projectVisibility={projectVisibility} />

      }

      <Box p={3}>
        {/* PROJECT SNAPSHOT */}
        <Paper
          variant="outlined"
          sx={{
            p: 3,
            mb: 3,
            borderRadius: 2
          }}>

          <Box
            display="flex"
            flexDirection={{
              xs: 'column',
              md: 'row'
            }}
            gap={3}>

            <Box flex={1} minWidth={0}>
              {/* 1. Project Name */}
              <Typography
                variant="h5"
                fontWeight="bold"
                color="text.primary"
                mb={1}>

                {projectName}
              </Typography>

              {/* 2. ID and Chips row - between title and description */}
              <Box
                display="flex"
                alignItems="center"
                gap={1}
                mb={1.5}
                flexWrap="wrap">

                {/* Project ID as plain text */}
                <Typography
                  variant="caption"
                  fontFamily="monospace"
                  color="text.disabled">

                  {upid}
                </Typography>
                <Chip
                  label={projectData.type}
                  size="small"
                  sx={{
                    height: 24,
                    fontSize: '0.75rem',
                    bgcolor: 'grey.100',
                    color: 'grey.700',
                    border: 1,
                    borderColor: 'grey.200',
                    fontWeight: 500
                  }} />

                <Tooltip title={stageDescriptions[currentStage]} arrow>
                  <Box
                    sx={{
                      cursor: isOwner ? 'pointer' : 'default'
                    }}
                    onClick={() => isOwner && openEditor('stage')}>

                    <ProjectStageIndicator stage={currentStage} />
                  </Box>
                </Tooltip>

                {/* Freshness Indicator */}
                <ReportingFreshness status={freshnessStatus} />

                {isOwner &&
                <Chip
                  label="My Project"
                  size="small"
                  sx={{
                    height: 24,
                    fontSize: '0.75rem',
                    bgcolor: 'grey.900',
                    color: 'white',
                    fontWeight: 500
                  }} />

                }
              </Box>

              {/* 3. Description */}
              <Typography variant="body2" color="text.secondary" mb={2}>
                {projectData.description}
              </Typography>

              {/* 4. Meta: Country, Company */}
              <Box display="flex" flexWrap="wrap" alignItems="center" gap={2}>
                <Box display="flex" alignItems="center" gap={0.75}>
                  <Typography fontSize="1rem">
                    {FLAGS[projectData.countryCode]}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {projectData.country}
                  </Typography>
                </Box>
                <Button
                  startIcon={
                  <BusinessRounded
                    sx={{
                      fontSize: 16
                    }} />

                  }
                  onClick={() =>
                  navigate(`/companies/${projectData.companyId}`)
                  }
                  sx={{
                    textTransform: 'none',
                    color: 'text.secondary',
                    '&:hover': {
                      color: 'text.primary'
                    }
                  }}>

                  {projectData.developer}
                </Button>
              </Box>
            </Box>
            <Box
              sx={{
                width: {
                  xs: '100%',
                  md: 224
                },
                flexShrink: 0
              }}
              display="flex"
              flexDirection="column"
              gap={1.5}>

              {/* Show Edit button for owners, Contact Developer for non-owners */}
              {isOwner ?
              <Button
                variant="contained"
                fullWidth
                startIcon={
                <EditRounded
                  sx={{
                    fontSize: 16
                  }} />

                }
                onClick={() => openEditor('header')}
                sx={{
                  textTransform: 'none'
                }}>

                  Edit Project
                </Button> :

              <Button
                variant="contained"
                fullWidth
                startIcon={
                <EmailRounded
                  sx={{
                    fontSize: 16
                  }} />

                }
                sx={{
                  textTransform: 'none'
                }}>

                  Contact Developer
                </Button>
              }
              <Box display="flex" gap={1} width="100%">
                <Button
                  variant="outlined"
                  startIcon={
                  isSaved ?
                  <BookmarkRounded
                    sx={{
                      fontSize: 14
                    }} /> :


                  <BookmarkBorderRounded
                    sx={{
                      fontSize: 14
                    }} />


                  }
                  onClick={() => setIsSaved(!isSaved)}
                  sx={{
                    flex: 1,
                    borderColor: isSaved ? 'primary.main' : 'grey.200',
                    color: isSaved ? 'primary.main' : 'text.secondary',
                    textTransform: 'none',
                    '&:hover': {
                      bgcolor: isSaved ? 'primary.50' : 'grey.50',
                      borderColor: isSaved ? 'primary.main' : 'grey.300'
                    }
                  }}>

                  {isSaved ? 'Saved' : 'Save'}
                </Button>
                <Box
                  sx={{
                    flex: 1
                  }}>

                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={
                    <ShareRounded
                      sx={{
                        fontSize: 14
                      }} />

                    }
                    onClick={(e) => setShareAnchorEl(e.currentTarget)}
                    sx={{
                      borderColor: 'grey.200',
                      color: 'text.secondary',
                      textTransform: 'none',
                      '&:hover': {
                        bgcolor: 'grey.50',
                        borderColor: 'grey.300'
                      }
                    }}>

                    Share
                  </Button>
                  <SharedShareMenu
                    anchorEl={shareAnchorEl}
                    open={Boolean(shareAnchorEl)}
                    onClose={() => setShareAnchorEl(null)}
                    shareUrl={window.location.href}
                    shareTitle={`${projectName} - Carbon Project`} />

                </Box>
              </Box>
            </Box>
          </Box>
        </Paper>

        {/* TWO-COLUMN LAYOUT */}
        <Box
          display="flex"
          flexDirection={{
            xs: 'column',
            md: 'row'
          }}
          gap={3}>

          {/* MAIN COLUMN */}
          <Box
            sx={{
              flex: {
                xs: '1 1 100%',
                md: '1 1 66.666%'
              },
              minWidth: 0,
              maxWidth: {
                xs: '100%',
                md: '66.666%'
              }
            }}>

            {/* PROJECT STORY */}
            {previewMode &&
            !isSectionVisibleTo(sectionVisibility.story, previewAs) ?
            <LockedSection title="Project Story" audience={previewAs} /> :

            <Section
              title="Project Story"
              onEdit={() => openEditor('story')}
              isOwner={isOwner && !previewMode}
              sectionVisibility={sectionVisibility.story}
              projectVisibility={projectVisibility}
              onVisibilityChange={(v) =>
              setSectionVisibility((p) => ({
                ...p,
                story: v
              }))
              }>

                <Stack spacing={3}>
                  <Box
                  display="flex"
                  flexDirection={{
                    xs: 'column',
                    sm: 'row'
                  }}
                  gap={3}>

                    <Box flex={1}>
                      <Typography
                      variant="caption"
                      fontWeight="bold"
                      color="text.secondary"
                      sx={{
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        display: 'block',
                        mb: 1
                      }}>

                        Problem and Context
                      </Typography>
                      <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        lineHeight: 1.6
                      }}>

                        Sarawak's peatlands have been severely degraded by
                        decades of drainage for agriculture and logging. Drained
                        peatlands release massive amounts of stored carbon and
                        are highly vulnerable to fires.
                      </Typography>
                    </Box>
                    <Box flex={1}>
                      <Typography
                      variant="caption"
                      fontWeight="bold"
                      color="text.secondary"
                      sx={{
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        display: 'block',
                        mb: 1
                      }}>

                        Project Approach
                      </Typography>
                      <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        lineHeight: 1.6
                      }}>

                        This initiative will block drainage canals to rewet
                        approximately 15,000 hectares of degraded peatland,
                        working with local communities to establish sustainable
                        paludiculture systems.
                      </Typography>
                    </Box>
                  </Box>
                  <Box
                  display="flex"
                  flexDirection={{
                    xs: 'column',
                    sm: 'row'
                  }}
                  gap={1.5}>

                    <Paper
                    variant="outlined"
                    sx={{
                      p: 1.5,
                      textAlign: 'center',
                      bgcolor: 'grey.50',
                      flex: 1
                    }}>

                      <ParkRounded
                      sx={{
                        fontSize: 20,
                        color: 'grey.400',
                        margin: '0 auto 4px'
                      }} />

                      <Typography
                      variant="caption"
                      fontWeight="medium"
                      color="text.primary"
                      display="block">

                        Climate
                      </Typography>
                      <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{
                        fontSize: '0.625rem'
                      }}>

                        ~60k tCO2e/yr
                      </Typography>
                    </Paper>
                    <Paper
                    variant="outlined"
                    sx={{
                      p: 1.5,
                      textAlign: 'center',
                      bgcolor: 'grey.50',
                      flex: 1
                    }}>

                      <GroupRounded
                      sx={{
                        fontSize: 20,
                        color: 'grey.400',
                        margin: '0 auto 4px'
                      }} />

                      <Typography
                      variant="caption"
                      fontWeight="medium"
                      color="text.primary"
                      display="block">

                        Community
                      </Typography>
                      <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{
                        fontSize: '0.625rem'
                      }}>

                        500+ livelihoods
                      </Typography>
                    </Paper>
                    <Paper
                    variant="outlined"
                    sx={{
                      p: 1.5,
                      textAlign: 'center',
                      bgcolor: 'grey.50',
                      flex: 1
                    }}>

                      <MapRounded
                      sx={{
                        fontSize: 20,
                        color: 'grey.400',
                        margin: '0 auto 4px'
                      }} />

                      <Typography
                      variant="caption"
                      fontWeight="medium"
                      color="text.primary"
                      display="block">

                        Biodiversity
                      </Typography>
                      <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{
                        fontSize: '0.625rem'
                      }}>

                        Orangutan habitat
                      </Typography>
                    </Paper>
                  </Box>
                </Stack>
              </Section>
            }

            {/* COLLABORATORS - Mobile only */}
            <Box
              display={{
                xs: 'block',
                md: 'none'
              }}
              mb={2}>

              {collaboratorsCardContent}
            </Box>

            {/* MEDIA */}
            {previewMode &&
            !isSectionVisibleTo(sectionVisibility.media, previewAs) ?
            <LockedSection title="Media" audience={previewAs} /> :

            <Section
              title="Media"
              onAdd={() => openEditor('media')}
              isOwner={isOwner && !previewMode}
              sectionVisibility={sectionVisibility.media}
              projectVisibility={projectVisibility}
              onVisibilityChange={(v) =>
              setSectionVisibility((p) => ({
                ...p,
                media: v
              }))
              }>

                {hasMedia ?
              <MediaGallery
                items={localMedia}
                mode="carousel"
                isOwner={isOwner}
                onMenuClick={(e, item, index) => {
                  e.stopPropagation();
                  setMediaMenuAnchor({
                    el: e.currentTarget,
                    media: item,
                    index
                  });
                }} /> :


              <Box textAlign="center" py={3}>
                    <Typography variant="body2" color="text.secondary">
                      No media uploaded
                    </Typography>
                    {isOwner &&
                <Button
                  size="small"
                  startIcon={
                  <AddRounded
                    sx={{
                      fontSize: 14
                    }} />

                  }
                  onClick={() => openEditor('media')}
                  sx={{
                    mt: 1,
                    textTransform: 'none'
                  }}>

                        Add Media
                      </Button>
                }
                  </Box>
              }
              </Section>
            }

            {/* OPEN OPPORTUNITIES */}
            {(hasOpportunities || isOwner && !previewMode) &&
            <>
                {previewMode &&
              !isSectionVisibleTo(
                sectionVisibility.opportunities,
                previewAs
              ) ?
              <LockedSection title="Looking For" audience={previewAs} /> :

              <Section
                title="Looking For"
                onAdd={() => openEditor('opportunities')}
                isOwner={isOwner && !previewMode}
                sectionVisibility={sectionVisibility.opportunities}
                projectVisibility={projectVisibility}
                onVisibilityChange={(v) =>
                setSectionVisibility((p) => ({
                  ...p,
                  opportunities: v
                }))
                }>

                    {hasOpportunities ?
                <Box
                  display="grid"
                  gridTemplateColumns={{
                    xs: '1fr',
                    sm: '1fr 1fr'
                  }}
                  gap={1.5}>

                        {localOpportunities.map((opp, i) =>
                  <Paper
                    key={i}
                    variant="outlined"
                    onClick={() => setSelectedOpportunity(opp)}
                    sx={{
                      p: 1.5,
                      bgcolor: opp.urgent ? 'grey.50' : 'white',
                      borderColor: opp.urgent ? 'grey.400' : 'grey.200',
                      position: 'relative',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      display: 'flex',
                      flexDirection: 'column',
                      minHeight: 90,
                      '&:hover': {
                        borderColor: 'grey.400',
                        boxShadow: 1
                      }
                    }}>

                            <Box
                      display="flex"
                      alignItems="center"
                      justifyContent="space-between"
                      mb={0.5}>

                              <Box display="flex" alignItems="center" gap={1}>
                                <opp.icon
                          sx={{
                            fontSize: 16,
                            color: 'grey.600'
                          }} />

                                <Typography
                          variant="subtitle2"
                          fontWeight="bold"
                          color="text.primary">

                                  {opp.type}
                                </Typography>
                                {opp.urgent &&
                        <Chip
                          label="Priority"
                          size="small"
                          sx={{
                            height: 16,
                            fontSize: '0.625rem',
                            bgcolor: 'grey.800',
                            color: 'white'
                          }} />

                        }
                              </Box>
                              {isOwner &&
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOppMenuAnchor({
                            el: e.currentTarget,
                            opp,
                            index: i
                          });
                        }}
                        sx={{
                          p: 0.5,
                          color: 'grey.400',
                          '&:hover': {
                            color: 'grey.600'
                          }
                        }}>

                                  <MoreVertRounded
                          sx={{
                            fontSize: 16
                          }} />

                                </IconButton>
                      }
                            </Box>
                            <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        lineHeight: 1.4,
                        flex: 1
                      }}>

                              {opp.desc}
                            </Typography>
                          </Paper>
                  )}
                      </Box> :

                <Box textAlign="center" py={3}>
                        <Typography variant="body2" color="text.secondary">
                          No open opportunities listed
                        </Typography>
                        {isOwner &&
                  <Button
                    size="small"
                    startIcon={
                    <AddRounded
                      sx={{
                        fontSize: 14
                      }} />

                    }
                    onClick={() => openEditor('opportunities')}
                    sx={{
                      mt: 1,
                      textTransform: 'none'
                    }}>

                            Add Opportunity
                          </Button>
                  }
                      </Box>
                }
                  </Section>
              }
              </>
            }

            {/* UPDATES */}
            {previewMode &&
            !isSectionVisibleTo(sectionVisibility.update, previewAs) ?
            <LockedSection title="Updates" audience={previewAs} /> :

            <Section
              title="Updates"
              onAdd={() => openEditor('update')}
              isOwner={isOwner && !previewMode}
              sectionVisibility={sectionVisibility.update}
              projectVisibility={projectVisibility}
              onVisibilityChange={(v) =>
              setSectionVisibility((p) => ({
                ...p,
                update: v
              }))
              }>

                {hasUpdates ?
              <Stack spacing={1.5}>
                    {localUpdates.map((update, i) =>
                <Paper
                  key={update.id}
                  variant="outlined"
                  sx={{
                    p: 1.5,
                    '&:hover': {
                      bgcolor: 'grey.50'
                    },
                    transition: 'background-color 0.2s',
                    width: '100%'
                  }}>

                        <Box
                    display="flex"
                    flexDirection={{
                      xs: 'column',
                      sm: 'row'
                    }}
                    gap={2}>

                          {update.hasPhoto &&
                    <Box
                      onClick={() => setSelectedUpdate(update)}
                      sx={{
                        width: {
                          xs: '100%',
                          sm: 120
                        },
                        height: {
                          xs: 80,
                          sm: 80
                        },
                        flexShrink: 0,
                        bgcolor: 'grey.100',
                        borderRadius: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: 1,
                        borderColor: 'grey.200',
                        cursor: 'pointer',
                        order: {
                          xs: -1,
                          sm: 1
                        }
                      }}>

                              <ImageRounded
                        sx={{
                          fontSize: 20,
                          color: 'grey.300'
                        }} />

                            </Box>
                    }
                          <Box
                      flex={1}
                      minWidth={0}
                      onClick={() => setSelectedUpdate(update)}
                      sx={{
                        cursor: 'pointer'
                      }}>

                            <Box
                        display="flex"
                        justifyContent="space-between"
                        mb={0.5}>

                              <Typography
                          variant="caption"
                          fontWeight="medium"
                          color="text.secondary">

                                {update.date}
                              </Typography>
                              <Typography
                          variant="caption"
                          color="text.disabled">

                                by {update.author}
                              </Typography>
                            </Box>
                            <Typography
                        variant="subtitle2"
                        fontWeight="medium"
                        color="text.primary">

                              {update.title}
                            </Typography>
                            <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
                        }}>

                              {update.desc}
                            </Typography>
                          </Box>
                          {isOwner &&
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        setUpdateMenuAnchor({
                          el: e.currentTarget,
                          update,
                          index: i
                        });
                      }}
                      sx={{
                        alignSelf: 'flex-start',
                        order: 2,
                        color: 'grey.400',
                        '&:hover': {
                          color: 'grey.600'
                        }
                      }}>

                              <MoreVertRounded
                        sx={{
                          fontSize: 16
                        }} />

                            </IconButton>
                    }
                        </Box>
                      </Paper>
                )}
                  </Stack> :

              <Box textAlign="center" py={3}>
                    <Typography variant="body2" color="text.secondary">
                      No updates yet
                    </Typography>
                    {isOwner &&
                <Button
                  size="small"
                  startIcon={
                  <AddRounded
                    sx={{
                      fontSize: 14
                    }} />

                  }
                  onClick={() => openEditor('update')}
                  sx={{
                    mt: 1,
                    textTransform: 'none'
                  }}>

                        Post Update
                      </Button>
                }
                  </Box>
              }
              </Section>
            }

            {/* Update Menu */}
            <Menu
              anchorEl={updateMenuAnchor?.el}
              open={Boolean(updateMenuAnchor)}
              onClose={() => setUpdateMenuAnchor(null)}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right'
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right'
              }}
              PaperProps={{
                sx: {
                  minWidth: 160,
                  boxShadow: 3
                }
              }}>

              <MenuItem
                onClick={() => {
                  openEditor('update', updateMenuAnchor?.update);
                  setUpdateMenuAnchor(null);
                }}>

                <ListItemIcon>
                  <EditRounded
                    sx={{
                      fontSize: 16
                    }} />

                </ListItemIcon>
                <ListItemText
                  primaryTypographyProps={{
                    variant: 'body2'
                  }}>

                  Edit
                </ListItemText>
              </MenuItem>
              <MenuItem
                onClick={handleUpdateDelete}
                sx={{
                  color: 'error.main'
                }}>

                <ListItemIcon>
                  <DeleteRounded
                    sx={{
                      fontSize: 16,
                      color: 'error.main'
                    }} />

                </ListItemIcon>
                <ListItemText
                  primaryTypographyProps={{
                    variant: 'body2'
                  }}>

                  Delete
                </ListItemText>
              </MenuItem>
            </Menu>

            {/* Document Menu */}
            <Menu
              anchorEl={documentMenuAnchor?.el}
              open={Boolean(documentMenuAnchor)}
              onClose={() => setDocumentMenuAnchor(null)}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right'
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right'
              }}
              PaperProps={{
                sx: {
                  minWidth: 160,
                  boxShadow: 3
                }
              }}>

              <MenuItem onClick={() => {}}>
                <ListItemIcon>
                  <DownloadRounded
                    sx={{
                      fontSize: 16
                    }} />

                </ListItemIcon>
                <ListItemText
                  primaryTypographyProps={{
                    variant: 'body2'
                  }}>

                  Download
                </ListItemText>
              </MenuItem>
              <MenuItem
                onClick={() => {
                  openEditor('document', documentMenuAnchor?.doc);
                  setDocumentMenuAnchor(null);
                }}>

                <ListItemIcon>
                  <EditRounded
                    sx={{
                      fontSize: 16
                    }} />

                </ListItemIcon>
                <ListItemText
                  primaryTypographyProps={{
                    variant: 'body2'
                  }}>

                  Edit
                </ListItemText>
              </MenuItem>
              <MenuItem
                onClick={handleDocumentDelete}
                sx={{
                  color: 'error.main'
                }}>

                <ListItemIcon>
                  <DeleteRounded
                    sx={{
                      fontSize: 16,
                      color: 'error.main'
                    }} />

                </ListItemIcon>
                <ListItemText
                  primaryTypographyProps={{
                    variant: 'body2'
                  }}>

                  Delete
                </ListItemText>
              </MenuItem>
            </Menu>

            {/* Media Menu */}
            <Menu
              anchorEl={mediaMenuAnchor?.el}
              open={Boolean(mediaMenuAnchor)}
              onClose={() => setMediaMenuAnchor(null)}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right'
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right'
              }}
              PaperProps={{
                sx: {
                  minWidth: 160,
                  boxShadow: 3
                }
              }}>

              <MenuItem
                onClick={() => {
                  openEditor('media', mediaMenuAnchor?.media);
                  setMediaMenuAnchor(null);
                }}>

                <ListItemIcon>
                  <EditRounded
                    sx={{
                      fontSize: 16
                    }} />

                </ListItemIcon>
                <ListItemText
                  primaryTypographyProps={{
                    variant: 'body2'
                  }}>

                  Edit
                </ListItemText>
              </MenuItem>
              <MenuItem
                onClick={handleMediaDelete}
                sx={{
                  color: 'error.main'
                }}>

                <ListItemIcon>
                  <DeleteRounded
                    sx={{
                      fontSize: 16,
                      color: 'error.main'
                    }} />

                </ListItemIcon>
                <ListItemText
                  primaryTypographyProps={{
                    variant: 'body2'
                  }}>

                  Delete
                </ListItemText>
              </MenuItem>
            </Menu>

            {/* Team Menu */}
            <Menu
              anchorEl={teamMenuAnchor?.el}
              open={Boolean(teamMenuAnchor)}
              onClose={() => setTeamMenuAnchor(null)}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right'
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right'
              }}
              PaperProps={{
                sx: {
                  minWidth: 160,
                  boxShadow: 3
                }
              }}>

              <MenuItem
                onClick={() => {
                  openEditor('team', teamMenuAnchor?.provider);
                  setTeamMenuAnchor(null);
                }}>

                <ListItemIcon>
                  <EditRounded
                    sx={{
                      fontSize: 16
                    }} />

                </ListItemIcon>
                <ListItemText
                  primaryTypographyProps={{
                    variant: 'body2'
                  }}>

                  Edit
                </ListItemText>
              </MenuItem>
              <MenuItem
                onClick={handleTeamDelete}
                sx={{
                  color: 'error.main'
                }}>

                <ListItemIcon>
                  <DeleteRounded
                    sx={{
                      fontSize: 16,
                      color: 'error.main'
                    }} />

                </ListItemIcon>
                <ListItemText
                  primaryTypographyProps={{
                    variant: 'body2'
                  }}>

                  Remove
                </ListItemText>
              </MenuItem>
            </Menu>

            {/* DOCUMENTS */}
            {previewMode &&
            !isSectionVisibleTo(sectionVisibility.document, previewAs) ?
            <LockedSection title="Documents" audience={previewAs} /> :

            <Section
              title="Documents"
              onAdd={() => openEditor('document')}
              isOwner={isOwner && !previewMode}
              sectionVisibility={sectionVisibility.document}
              projectVisibility={projectVisibility}
              onVisibilityChange={(v) =>
              setSectionVisibility((p) => ({
                ...p,
                document: v
              }))
              }>

                {hasDocuments ?
              <Paper
                variant="outlined"
                sx={{
                  borderRadius: 2,
                  overflow: 'hidden',
                  width: '100%'
                }}>

                    <Table size="small">
                      <TableHead
                    sx={{
                      bgcolor: 'grey.50'
                    }}>

                        <TableRow>
                          <TableCell
                        sx={{
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          color: 'text.secondary'
                        }}>

                            Document
                          </TableCell>
                          <TableCell
                        sx={{
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          color: 'text.secondary'
                        }}>

                            Type
                          </TableCell>
                          {isOwner &&
                      <TableCell
                        sx={{
                          display: {
                            xs: 'none',
                            sm: 'table-cell'
                          },
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          color: 'text.secondary'
                        }}>

                              Date
                            </TableCell>
                      }
                          {!isOwner &&
                      <TableCell
                        sx={{
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          color: 'text.secondary'
                        }}>

                              Size
                            </TableCell>
                      }
                          {isOwner &&
                      <TableCell
                        sx={{
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          color: 'text.secondary'
                        }}>

                              Status
                            </TableCell>
                      }
                          <TableCell
                        sx={{
                          width: 48
                        }}>
                      </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {localDocuments.map((doc, i) =>
                    <TableRow key={doc.id} hover>
                            <TableCell>
                              <Box display="flex" alignItems="center" gap={1}>
                                <DescriptionRounded
                            sx={{
                              fontSize: 16,
                              color: 'grey.400'
                            }} />

                                <Typography
                            variant="caption"
                            fontWeight="medium"
                            color="text.primary">

                                  {doc.name}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell
                        sx={{
                          fontSize: '0.75rem',
                          color: 'text.secondary'
                        }}>

                              {doc.type}
                            </TableCell>
                            {isOwner &&
                      <TableCell
                        sx={{
                          display: {
                            xs: 'none',
                            sm: 'table-cell'
                          },
                          fontSize: '0.75rem',
                          color: 'text.secondary'
                        }}>

                                {doc.date}
                              </TableCell>
                      }
                            {!isOwner &&
                      <TableCell
                        sx={{
                          fontSize: '0.75rem',
                          color: 'text.secondary'
                        }}>

                                {i === 0 ?
                        '1.2 MB' :
                        i === 1 ?
                        '856 KB' :
                        i === 2 ?
                        '2.4 MB' :
                        '512 KB'}
                              </TableCell>
                      }
                            {isOwner &&
                      <TableCell>
                                <Chip
                          label={doc.status}
                          size="small"
                          sx={{
                            height: 20,
                            fontSize: '0.625rem',
                            bgcolor:
                            doc.status === 'Final' ?
                            'grey.800' :
                            'grey.100',
                            color:
                            doc.status === 'Final' ?
                            'white' :
                            'grey.600',
                            fontWeight: 500
                          }} />

                              </TableCell>
                      }
                            <TableCell>
                              {isOwner ?
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDocumentMenuAnchor({
                              el: e.currentTarget,
                              doc,
                              index: i
                            });
                          }}
                          sx={{
                            color: 'grey.400',
                            '&:hover': {
                              color: 'grey.600'
                            }
                          }}>

                                  <MoreVertRounded
                            sx={{
                              fontSize: 16
                            }} />

                                </IconButton> :

                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                          }}
                          sx={{
                            color: 'grey.500',
                            '&:hover': {
                              color: 'primary.main'
                            }
                          }}>

                                  <DownloadRounded
                            sx={{
                              fontSize: 16
                            }} />

                                </IconButton>
                        }
                            </TableCell>
                          </TableRow>
                    )}
                      </TableBody>
                    </Table>
                  </Paper> :

              <Box textAlign="center" py={3}>
                    <Typography variant="body2" color="text.secondary">
                      No documents uploaded
                    </Typography>
                    {isOwner &&
                <Button
                  size="small"
                  startIcon={
                  <AddRounded
                    sx={{
                      fontSize: 14
                    }} />

                  }
                  onClick={() => openEditor('document')}
                  sx={{
                    mt: 1,
                    textTransform: 'none'
                  }}>

                        Add Document
                      </Button>
                }
                  </Box>
              }
              </Section>
            }

            {/* IMPACT & CREDITS */}
            {false && config.impactAvailable &&
            <>
                {previewMode &&
              !isSectionVisibleTo(sectionVisibility.impact, previewAs) ?
              <LockedSection
                title="Impact and Credits"
                audience={previewAs} /> :


              <Section
                title="Impact and Credits"
                onEdit={() => openEditor('impact')}
                isOwner={isOwner && !previewMode}
                sectionVisibility={sectionVisibility.impact}
                projectVisibility={projectVisibility}
                onVisibilityChange={(v) =>
                setSectionVisibility((p) => ({
                  ...p,
                  impact: v
                }))
                }>

                    <Box display="flex" flexWrap="wrap" gap={1.5}>
                      {[
                  {
                    value: '58,000',
                    label: 'VCUs Issued',
                    provenance: mockProvenance.issuance
                  },
                  {
                    value: '2024',
                    label: 'First Vintage',
                    provenance: mockProvenance.issuance
                  },
                  {
                    value: '62k/yr',
                    label: 'Annual Est.',
                    provenance: mockProvenance.location
                  },
                  {
                    value: '25 yrs',
                    label: 'Credit Period',
                    provenance: mockProvenance.registry
                  }].
                  map((item, i) =>
                  <Paper
                    key={i}
                    variant="outlined"
                    sx={{
                      p: 1.5,
                      textAlign: 'center',
                      bgcolor: 'grey.50',
                      flex: {
                        xs: '1 1 calc(50% - 6px)',
                        sm: '1 1 calc(25% - 9px)'
                      },
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative'
                    }}>

                          <Typography
                      variant="h6"
                      fontWeight="bold"
                      color="text.primary">

                            {item.value}
                          </Typography>
                          <Typography
                      variant="caption"
                      color="text.secondary"
                      mb={0.5}>

                            {item.label}
                          </Typography>
                          <ProvenanceLabel provenance={item.provenance} />
                        </Paper>
                  )}
                    </Box>
                  </Section>
              }
              </>
            }
          </Box>

          {/* SIDEBAR */}
          <Box
            sx={{
              flex: {
                xs: '1 1 100%',
                md: '0 0 33.333%'
              },
              maxWidth: {
                xs: '100%',
                md: '33.333%'
              }
            }}>

            <Stack spacing={2}>
              {/* Impact & Credits — ALWAYS on top of sidebar for Issued/Registered */}
              {config.impactAvailable &&
              <Paper
                variant="outlined"
                sx={{
                  borderRadius: 2,
                  overflow: 'hidden',
                  width: '100%'
                }}>

                  <Box
                  p={1.5}
                  borderBottom={1}
                  borderColor="grey.100"
                  display="flex"
                  alignItems="center"
                  justifyContent="space-between"
                  bgcolor="grey.50">

                    <Typography
                    variant="caption"
                    fontWeight="bold"
                    color="text.primary">

                      Credits
                    </Typography>
                    {isOwner &&
                  <IconButton
                    size="small"
                    onClick={() => openEditor('impact')}
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
                        borderColor: 'primary.main'
                      }
                    }}>

                        <EditRounded
                      sx={{
                        fontSize: 16
                      }} />

                      </IconButton>
                  }
                  </Box>
                  <Box p={1.5}>
                    <Box display="grid" gridTemplateColumns="1fr 1fr" gap={1}>
                      {[
                    {
                      value: '58,000',
                      label: 'VCUs Issued',
                      provenance: mockProvenance.issuance
                    },
                    {
                      value: '2024',
                      label: 'First Vintage',
                      provenance: mockProvenance.issuance
                    },
                    {
                      value: '62k/yr',
                      label: 'Annual Est.',
                      provenance: mockProvenance.location
                    },
                    {
                      value: '25 yrs',
                      label: 'Credit Period',
                      provenance: mockProvenance.registry
                    }].
                    map((item, i) =>
                    <Paper
                      key={i}
                      variant="outlined"
                      sx={{
                        p: 1.25,
                        textAlign: 'center',
                        bgcolor: 'grey.50',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center'
                      }}>

                          <Typography
                        variant="subtitle2"
                        fontWeight="bold"
                        color="text.primary">

                            {item.value}
                          </Typography>
                          <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{
                          fontSize: '0.625rem'
                        }}>

                            {item.label}
                          </Typography>
                          <ProvenanceLabel provenance={item.provenance} />
                        </Paper>
                    )}
                    </Box>
                  </Box>
                </Paper>
              }

              {/* Profile Completeness - Only visible to owner */}
              {isOwner &&
              <ProfileCompleteness
                items={completenessItems}
                onItemClick={(item) => openEditor(item.section)} />

              }

              <Box
                display={{
                  xs: 'none',
                  md: 'block'
                }}>

                {collaboratorsCardContent}
              </Box>

              {/* Location */}
              <Paper
                variant="outlined"
                sx={{
                  borderRadius: 2,
                  overflow: 'hidden',
                  width: '100%'
                }}>

                <Box
                  p={1.5}
                  borderBottom={1}
                  borderColor="grey.100"
                  display="flex"
                  alignItems="center"
                  justifyContent="space-between"
                  bgcolor="white">

                  <Typography
                    variant="caption"
                    fontWeight="bold"
                    color="text.primary">

                    Location
                  </Typography>
                  {isOwner &&
                  <IconButton
                    size="small"
                    onClick={() => openEditor('location')}
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
                        borderColor: 'primary.main'
                      }
                    }}>

                      <EditRounded
                      sx={{
                        fontSize: 16
                      }} />

                    </IconButton>
                  }
                </Box>
                <Box
                  sx={{
                    aspectRatio: '4/3',
                    bgcolor: 'grey.100',
                    position: 'relative'
                  }}>

                  <MapContainer
                    center={[projectData.lat, projectData.lng]}
                    zoom={8}
                    style={{
                      height: '100%',
                      width: '100%'
                    }}
                    scrollWheelZoom={false}
                    zoomControl={false}>

                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <Marker
                      position={[projectData.lat, projectData.lng]}
                      icon={icon} />

                  </MapContainer>
                </Box>
                <Box
                  p={1.5}
                  bgcolor="white"
                  borderTop={1}
                  borderColor="grey.100">

                  <Box
                    display="flex"
                    alignItems="center"
                    gap={1}
                    color="text.secondary"
                    mb={0.5}>

                    <LocationOnRounded
                      sx={{
                        fontSize: 12
                      }} />

                    <Typography variant="caption">
                      {projectData.region ? `${projectData.region}, ` : ''}
                      {projectData.country}
                    </Typography>
                    <ProvenanceLabel provenance={mockProvenance.location} />
                  </Box>
                  <Typography
                    variant="caption"
                    color="text.disabled"
                    display="block">

                    15,000 hectares • Tropical peatland
                  </Typography>
                </Box>
              </Paper>

              {/* Progress & Readiness */}
              <Paper
                variant="outlined"
                sx={{
                  borderRadius: 2,
                  overflow: 'hidden',
                  width: '100%'
                }}>

                <Box
                  p={1.5}
                  borderBottom={1}
                  borderColor="grey.100"
                  display="flex"
                  alignItems="center"
                  justifyContent="space-between"
                  bgcolor="white">

                  <Typography
                    variant="caption"
                    fontWeight="bold"
                    color="text.primary">

                    Progress
                  </Typography>
                  {isOwner &&
                  <IconButton
                    size="small"
                    onClick={() => openEditor('stage')}
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
                        borderColor: 'primary.main'
                      }
                    }}>

                      <EditRounded
                      sx={{
                        fontSize: 16
                      }} />

                    </IconButton>
                  }
                </Box>
                <Box p={1.5}>
                  <ProgressTrackCompact
                    currentStage={currentStage}
                    stageIndex={config.stageIndex} />

                </Box>
                <Box borderTop={1} borderColor="grey.100">
                  <Button
                    fullWidth
                    onClick={() => setShowReadiness(!showReadiness)}
                    endIcon={
                    showReadiness ?
                    <ExpandLessRounded
                      sx={{
                        fontSize: 12
                      }} /> :


                    <ExpandMoreRounded
                      sx={{
                        fontSize: 12
                      }} />


                    }
                    sx={{
                      justifyContent: 'space-between',
                      px: 1.5,
                      py: 1.5,
                      textTransform: 'none',
                      color: 'text.secondary',
                      fontSize: '0.75rem'
                    }}>

                    Readiness details
                  </Button>
                  <Collapse in={showReadiness}>
                    <Box px={1.5} pb={1.5}>
                      <Stack spacing={1}>
                        {config.readiness.map((row, i) =>
                        <Box
                          key={i}
                          display="flex"
                          alignItems="center"
                          justifyContent="space-between">

                            <Typography
                            variant="caption"
                            color="text.secondary">

                              {row.dim}
                            </Typography>
                            <Chip
                            label={
                            row.status === 'yes' ?
                            '✓' :
                            row.status === 'progress' ?
                            '◐' :
                            row.status === 'na' ?
                            '—' :
                            '?'
                            }
                            size="small"
                            variant={
                            row.status === 'seeking' ? 'outlined' : 'filled'
                            }
                            sx={{
                              height: 16,
                              minWidth: 20,
                              fontSize: '0.625rem',
                              bgcolor:
                              row.status === 'yes' ?
                              'grey.800' :
                              row.status === 'progress' ?
                              'grey.200' :
                              row.status === 'na' ?
                              'grey.100' :
                              'transparent',
                              color:
                              row.status === 'yes' ?
                              'white' :
                              row.status === 'progress' ?
                              'grey.700' :
                              row.status === 'na' ?
                              'grey.400' :
                              'grey.500',
                              borderColor:
                              row.status === 'seeking' ?
                              'grey.300' :
                              'transparent',
                              borderStyle:
                              row.status === 'seeking' ? 'dashed' : 'solid',
                              '& .MuiChip-label': {
                                px: 0.5
                              }
                            }} />

                          </Box>
                        )}
                      </Stack>
                    </Box>
                  </Collapse>
                </Box>
              </Paper>

              {/* Timeline */}
              <Paper
                variant="outlined"
                sx={{
                  borderRadius: 2,
                  overflow: 'hidden',
                  width: '100%'
                }}>

                <Box
                  p={1.5}
                  borderBottom={1}
                  borderColor="grey.100"
                  display="flex"
                  alignItems="center"
                  justifyContent="space-between">

                  <Typography
                    variant="caption"
                    fontWeight="bold"
                    color="text.primary">

                    Timeline
                  </Typography>
                  <Box
                    display="flex"
                    alignItems="center"
                    gap={0.5}
                    color="text.disabled">

                    <AccessTimeRounded
                      sx={{
                        fontSize: 12
                      }} />

                    <Typography
                      variant="caption"
                      sx={{
                        fontSize: '0.625rem'
                      }}>

                      Auto
                    </Typography>
                  </Box>
                </Box>
                <Box p={1.5}>
                  <Box position="relative">
                    <Box
                      position="absolute"
                      left={6}
                      top={0}
                      bottom={0}
                      width="1px"
                      bgcolor="grey.200" />

                    <Stack spacing={1}>
                      {config.timeline.slice(0, 5).map((item, i) =>
                      <Box
                        key={i}
                        display="flex"
                        alignItems="flex-start"
                        gap={1}
                        pl={2}
                        position="relative">

                          <Box
                          position="absolute"
                          left={0}
                          top={4}
                          sx={{
                            width: 12,
                            height: 12,
                            borderRadius: '50%',
                            bgcolor: 'white',
                            border: 2,
                            borderColor:
                            item.type === 'stage' ?
                            'grey.800' :
                            item.type === 'milestone' ?
                            'grey.600' :
                            item.type === 'registry' ?
                            'grey.500' :
                            'grey.300',
                            zIndex: 1
                          }} />

                          <Box flex={1} minWidth={0}>
                            <Typography
                            variant="caption"
                            color="text.disabled"
                            display="block"
                            sx={{
                              fontSize: '0.625rem'
                            }}>

                              {item.date}
                            </Typography>
                            <Typography
                            variant="caption"
                            color="text.primary"
                            lineHeight={1.2}>

                              {item.event}
                            </Typography>
                          </Box>
                        </Box>
                      )}
                    </Stack>
                  </Box>
                </Box>
              </Paper>

              {/* Registry */}
              <Paper
                variant="outlined"
                sx={{
                  borderRadius: 2,
                  overflow: 'hidden',
                  width: '100%'
                }}>

                <Box
                  p={1.5}
                  borderBottom={1}
                  borderColor="grey.100"
                  display="flex"
                  alignItems="center"
                  justifyContent="space-between"
                  bgcolor="white">

                  <Typography
                    variant="caption"
                    fontWeight="bold"
                    color="text.primary">

                    Registry
                  </Typography>
                  {isOwner &&
                  <IconButton
                    size="small"
                    onClick={() => openEditor('registry')}
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
                        borderColor: 'primary.main'
                      }
                    }}>

                      <EditRounded
                      sx={{
                        fontSize: 16
                      }} />

                    </IconButton>
                  }
                </Box>
                <Box p={2}>
                  <Stack spacing={1}>
                    <Box
                      display="flex"
                      justifyContent="space-between"
                      alignItems="center"
                      gap={1}>

                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{
                          flexShrink: 0
                        }}>

                        Platform
                      </Typography>
                      <Box
                        display="flex"
                        alignItems="center"
                        gap={0.75}
                        minWidth={0}>

                        <Typography
                          variant="caption"
                          fontWeight="medium"
                          color="text.primary"
                          noWrap>

                          Verra (VCS)
                        </Typography>
                        <Box
                          sx={{
                            flexShrink: 0
                          }}>

                          <ProvenanceLabel
                            provenance={mockProvenance.registry} />

                        </Box>
                      </Box>
                    </Box>
                    <Box
                      display="flex"
                      justifyContent="space-between"
                      alignItems="center"
                      gap={1}>

                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{
                          flexShrink: 0
                        }}>

                        Methodology
                      </Typography>
                      <Box
                        display="flex"
                        alignItems="center"
                        gap={0.75}
                        minWidth={0}>

                        <Typography
                          variant="caption"
                          fontWeight="medium"
                          color="text.primary"
                          noWrap>

                          VM0027
                        </Typography>
                        <Box
                          sx={{
                            flexShrink: 0
                          }}>

                          <ProvenanceLabel
                            provenance={mockProvenance.methodology} />

                        </Box>
                      </Box>
                    </Box>
                    <Box
                      display="flex"
                      justifyContent="space-between"
                      alignItems="center"
                      gap={1}>

                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{
                          flexShrink: 0
                        }}>

                        Status
                      </Typography>
                      <Box
                        display="flex"
                        alignItems="center"
                        gap={0.75}
                        minWidth={0}>

                        <Typography
                          variant="caption"
                          fontWeight="medium"
                          color="text.primary"
                          noWrap>

                          {config.registryStatus}
                        </Typography>
                        <Box
                          sx={{
                            flexShrink: 0
                          }}>

                          <ProvenanceLabel
                            provenance={mockProvenance.registry} />

                        </Box>
                      </Box>
                    </Box>
                  </Stack>
                </Box>
              </Paper>
            </Stack>
          </Box>
        </Box>
      </Box>

      {/* Sidebar Editor */}
      <SidebarEditor
        open={sidebarOpen}
        onClose={() => {
          setSidebarOpen(false);
          setEditingItem(null);
        }}
        section={sidebarSection}
        currentStage={currentStage}
        onStageChange={setCurrentStage}
        editingItem={editingItem}
        onSave={handleSidebarSave}
        sectionVisibility={sectionVisibility}
        onSectionVisibilityChange={(sec, v) =>
        setSectionVisibility((prev) => ({
          ...prev,
          [sec]: v
        }))
        }
        projectVisibility={projectVisibility}
        onProjectVisibilityChange={setProjectVisibility} />


      {/* Team Menu - Moved to root level for proper positioning */}
      <Menu
        anchorEl={teamMenuAnchor?.el}
        open={Boolean(teamMenuAnchor)}
        onClose={() => setTeamMenuAnchor(null)}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right'
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right'
        }}
        PaperProps={{
          sx: {
            minWidth: 160,
            boxShadow: 3
          }
        }}>

        <MenuItem
          onClick={() => {
            openEditor('team', teamMenuAnchor?.provider);
            setTeamMenuAnchor(null);
          }}>

          <ListItemIcon>
            <EditRounded
              sx={{
                fontSize: 16
              }} />

          </ListItemIcon>
          <ListItemText
            primaryTypographyProps={{
              variant: 'body2'
            }}>

            Edit
          </ListItemText>
        </MenuItem>
        <MenuItem
          onClick={handleTeamDelete}
          sx={{
            color: 'error.main'
          }}>

          <ListItemIcon>
            <DeleteRounded
              sx={{
                fontSize: 16,
                color: 'error.main'
              }} />

          </ListItemIcon>
          <ListItemText
            primaryTypographyProps={{
              variant: 'body2'
            }}>

            Remove
          </ListItemText>
        </MenuItem>
      </Menu>

      {/* Update Modal */}
      <UpdateModal
        update={selectedUpdate}
        open={Boolean(selectedUpdate)}
        onClose={() => setSelectedUpdate(null)} />


      {/* Opportunity Menu */}
      <Menu
        anchorEl={oppMenuAnchor?.el}
        open={Boolean(oppMenuAnchor)}
        onClose={() => setOppMenuAnchor(null)}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right'
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right'
        }}
        PaperProps={{
          sx: {
            minWidth: 160,
            boxShadow: 3
          }
        }}>

        <MenuItem
          onClick={() => {
            openEditor('opportunities', oppMenuAnchor?.opp);
            setOppMenuAnchor(null);
          }}>

          <ListItemIcon>
            <EditRounded
              sx={{
                fontSize: 16
              }} />

          </ListItemIcon>
          <ListItemText
            primaryTypographyProps={{
              variant: 'body2'
            }}>

            Edit
          </ListItemText>
        </MenuItem>
        <MenuItem
          onClick={handleOppDelete}
          sx={{
            color: 'error.main'
          }}>

          <ListItemIcon>
            <DeleteRounded
              sx={{
                fontSize: 16,
                color: 'error.main'
              }} />

          </ListItemIcon>
          <ListItemText
            primaryTypographyProps={{
              variant: 'body2'
            }}>

            Delete
          </ListItemText>
        </MenuItem>
      </Menu>

      {/* Opportunity Detail Modal */}
      <Dialog
        open={Boolean(selectedOpportunity)}
        onClose={() => setSelectedOpportunity(null)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2
          }
        }}>

        {selectedOpportunity &&
        <>
            <DialogTitle
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              pb: 1
            }}>

              <Box display="flex" alignItems="center" gap={1.5}>
                <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 1,
                  bgcolor: 'grey.100',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>

                  <selectedOpportunity.icon
                  sx={{
                    fontSize: 20,
                    color: 'grey.600'
                  }} />

                </Box>
                <Box>
                  <Typography
                  variant="h6"
                  fontWeight="bold"
                  color="text.primary">

                    {selectedOpportunity.type}
                  </Typography>
                  {selectedOpportunity.urgent &&
                <Chip
                  label="Priority"
                  size="small"
                  sx={{
                    height: 20,
                    fontSize: '0.625rem',
                    bgcolor: 'grey.800',
                    color: 'white',
                    mt: 0.5
                  }} />

                }
                </Box>
              </Box>
              <IconButton
              size="small"
              onClick={() => setSelectedOpportunity(null)}>

                <CloseRounded
                sx={{
                  fontSize: 18
                }} />

              </IconButton>
            </DialogTitle>
            <Divider />
            <DialogContent
            sx={{
              pt: 2
            }}>

              <Typography
              variant="subtitle2"
              fontWeight="bold"
              color="text.primary"
              gutterBottom>

                Description
              </Typography>
              <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                lineHeight: 1.6,
                mb: 3
              }}>

                {selectedOpportunity.desc}
              </Typography>
              <Paper
              variant="outlined"
              sx={{
                p: 2,
                bgcolor: 'grey.50',
                borderRadius: 2
              }}>

                <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                  Interested in this opportunity?
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Contact the project developer to discuss collaboration
                  details.
                </Typography>
              </Paper>
            </DialogContent>
            <Divider />
            <DialogActions
            sx={{
              p: 2
            }}>

              <Button
              variant="outlined"
              size="small"
              onClick={() => setSelectedOpportunity(null)}
              sx={{
                textTransform: 'none',
                borderColor: 'grey.300',
                color: 'text.secondary'
              }}>

                Close
              </Button>
              <Button
              variant="contained"
              size="small"
              startIcon={<EmailRounded />}
              sx={{
                textTransform: 'none'
              }}>

                Contact Developer
              </Button>
            </DialogActions>
          </>
        }
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteDialogClose}
        PaperProps={{
          sx: {
            borderRadius: 2,
            maxWidth: 400
          }
        }}>

        <DialogTitle
          sx={{
            pb: 1
          }}>

          <Typography variant="h6" fontWeight="bold">
            Confirm Delete
          </Typography>
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete{' '}
            <strong>
              {itemToDelete?.caption ||
              itemToDelete?.title ||
              itemToDelete?.name ||
              itemToDelete?.type ||
              'this item'}
            </strong>
            ? This action can be undone within 15 seconds.
          </DialogContentText>
        </DialogContent>
        <DialogActions
          sx={{
            px: 3,
            pb: 2
          }}>

          <Button
            onClick={handleDeleteDialogClose}
            sx={{
              color: 'text.secondary',
              textTransform: 'none'
            }}>

            Cancel
          </Button>
          <Button
            onClick={handleConfirmDelete}
            variant="contained"
            color="error"
            sx={{
              textTransform: 'none'
            }}>

            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar with Undo */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={15000}
        onClose={handleSnackbarClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center'
        }}>

        <Alert
          onClose={handleSnackbarClose}
          severity="success"
          variant="filled"
          sx={{
            width: '100%',
            alignItems: 'center',
            '& .MuiAlert-message': {
              display: 'flex',
              alignItems: 'center',
              gap: 2
            }
          }}
          action={
          deletedItem ?
          <Button
            color="inherit"
            size="small"
            onClick={handleUndo}
            sx={{
              textTransform: 'none',
              fontWeight: 'bold',
              ml: 1
            }}>

                Undo
              </Button> :
          null
          }>

          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>);

}
export default ProjectWireframe;