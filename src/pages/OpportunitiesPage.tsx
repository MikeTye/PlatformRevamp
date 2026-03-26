import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  InputBase,
  IconButton,
  Button,
  Select,
  MenuItem,
  Chip,
  FormControl,
  InputLabel,
  Checkbox,
  ListItemText,
  Tabs,
  Tab } from
'@mui/material';
import SearchRounded from '@mui/icons-material/SearchRounded';
import CloseRounded from '@mui/icons-material/CloseRounded';
import {
  OpportunityCard,
  OpportunityType } from
'../components/cards/OpportunityCard';
import { ProjectStage } from '../components/ProjectStageIndicator';
import { MobileFilterSheet } from '../components/MobileFilterSheet';
interface Opportunity {
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
}
const mockOpportunities: Opportunity[] = [
{
  id: '1',
  type: 'Financing',
  description:
  'Seed funding for feasibility study and initial community engagement.',
  projectName: 'Sarawak Peatland Rewetting Initiative',
  projectUpid: 'CUP-MY042713-5',
  developer: 'Borneo Carbon Partners',
  stage: 'Design',
  country: 'Malaysia',
  countryCode: 'MY',
  urgent: true
},
{
  id: '2',
  type: 'Technical Advisor',
  description: 'Methodology selection support for blue carbon pathway.',
  projectName: 'Kalimantan Forest Conservation',
  projectUpid: 'CUP-ID109482-4',
  developer: 'EcoForest Indonesia',
  stage: 'Validation',
  country: 'Indonesia',
  countryCode: 'ID',
  urgent: true
},
{
  id: '3',
  type: 'Buyers',
  description: 'Forward purchase agreements for 2026 vintage.',
  projectName: 'Mekong Delta Blue Carbon',
  projectUpid: 'CUP-VN028471-3',
  developer: 'Mekong Carbon',
  stage: 'Concept',
  country: 'Vietnam',
  countryCode: 'VN',
  urgent: false
},
{
  id: '4',
  type: 'Insurance',
  description: 'Political risk insurance for project implementation phase.',
  projectName: 'Northern Thailand Reforestation',
  projectUpid: 'CUP-TH056219-7',
  developer: 'Thai Forest Trust',
  stage: 'Listed',
  country: 'Thailand',
  countryCode: 'TH',
  urgent: false
},
{
  id: '5',
  type: 'MRV Provider',
  description: 'Remote sensing and ground-truthing partner needed.',
  projectName: 'Sumatra Mangrove Restoration',
  projectUpid: 'CUP-ID203847-2',
  developer: 'Blue Carbon Asia',
  stage: 'Design',
  country: 'Indonesia',
  countryCode: 'ID',
  urgent: true
},
{
  id: '6',
  type: 'Financing',
  description: 'Series A equity investment for project scaling.',
  projectName: 'Palawan Forest Protection',
  projectUpid: 'CUP-PH091234-8',
  developer: 'Philippine Carbon Corp',
  stage: 'Exploration',
  country: 'Philippines',
  countryCode: 'PH',
  urgent: false
},
{
  id: '7',
  type: 'Technical Advisor',
  description: 'Biodiversity baseline assessment expertise.',
  projectName: 'Myanmar Teak Reforestation',
  projectUpid: 'CUP-MM078562-1',
  developer: 'Golden Forest Co',
  stage: 'Concept',
  country: 'Myanmar',
  countryCode: 'MM',
  urgent: false
},
{
  id: '8',
  type: 'Buyers',
  description: 'Spot market buyers for issued credits.',
  projectName: 'Cambodia Community Forest',
  projectUpid: 'CUP-KH045678-9',
  developer: 'Mekong Carbon',
  stage: 'Issued',
  country: 'Cambodia',
  countryCode: 'KH',
  urgent: true
},
{
  id: '9',
  type: 'Insurance',
  description: 'Reversal risk coverage for buffer pool contribution.',
  projectName: 'Laos Watershed Protection',
  projectUpid: 'CUP-LA089123-4',
  developer: 'SE Asia Carbon Trust',
  stage: 'Validation',
  country: 'Laos',
  countryCode: 'LA',
  urgent: false
},
{
  id: '10',
  type: 'Financing',
  description: 'Debt financing for nursery infrastructure.',
  projectName: 'Sabah Rainforest Conservation',
  projectUpid: 'CUP-MY156789-2',
  developer: 'Borneo Carbon Partners',
  stage: 'Listed',
  country: 'Malaysia',
  countryCode: 'MY',
  urgent: false
}];

const opportunityTypes: OpportunityType[] = [
'Financing',
'Technical Advisor',
'Buyers',
'MRV Provider',
'Insurance'];

const stages: ProjectStage[] = [
'Exploration',
'Concept',
'Design',
'Listed',
'Validation',
'Registered',
'Issued',
'Closed'];

const countries = [
'Indonesia',
'Malaysia',
'Vietnam',
'Thailand',
'Philippines',
'Myanmar',
'Cambodia',
'Laos'];

export function OpportunitiesPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<OpportunityType[]>([]);
  const [stageFilter, setStageFilter] = useState<ProjectStage[]>([]);
  const [countryFilter, setCountryFilter] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'saved'>('all');
  const [savedOpportunities, setSavedOpportunities] = useState<Set<string>>(
    new Set(['1', '5'])
  );
  // Track items fading out (same pattern as BookmarksPage)
  const [fadingItems, setFadingItems] = useState<Set<string>>(new Set());
  const startFadeAndRemove = (
  id: string,
  remover: () => void,
  e: React.MouseEvent) =>
  {
    e.stopPropagation();
    // If already fading, cancel it (re-bookmark)
    if (fadingItems.has(id)) {
      setFadingItems((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      return;
    }
    setFadingItems((prev) => new Set(prev).add(id));
    setTimeout(() => {
      setFadingItems((prev) => {
        if (prev.has(id)) {
          remover();
          const next = new Set(prev);
          next.delete(id);
          return next;
        }
        return prev;
      });
    }, 7000);
  };
  const toggleSave = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (activeTab === 'saved' && savedOpportunities.has(id)) {
      startFadeAndRemove(
        id,
        () =>
        setSavedOpportunities((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        }),
        e
      );
      return;
    }
    setSavedOpportunities((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);else
      next.add(id);
      return next;
    });
  };
  const handleFilterChange =
  (setter: React.Dispatch<React.SetStateAction<any[]>>) => (event: any) => {
    const {
      target: { value }
    } = event;
    setter(typeof value === 'string' ? value.split(',') : value);
  };
  const filteredOpportunities = useMemo(() => {
    return mockOpportunities.filter((opp) => {
      if (
      activeTab === 'saved' &&
      !savedOpportunities.has(opp.id) &&
      !fadingItems.has(opp.id))

      return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (
        !opp.description.toLowerCase().includes(query) &&
        !opp.projectName.toLowerCase().includes(query) &&
        !opp.developer.toLowerCase().includes(query))
        {
          return false;
        }
      }
      if (typeFilter.length > 0 && !typeFilter.includes(opp.type)) return false;
      if (stageFilter.length > 0 && !stageFilter.includes(opp.stage))
      return false;
      if (countryFilter.length > 0 && !countryFilter.includes(opp.country))
      return false;
      return true;
    });
  }, [
  searchQuery,
  typeFilter,
  stageFilter,
  countryFilter,
  activeTab,
  savedOpportunities,
  fadingItems]
  );
  const activeFiltersCount =
  typeFilter.length + stageFilter.length + countryFilter.length;
  return (
    <Box
      minHeight="100vh"
      bgcolor="white"
      color="text.secondary"
      display="flex"
      flexDirection="column">

      {/* Header */}
      <Box
        bgcolor="white"
        borderBottom={1}
        borderColor="grey.200"
        flexShrink={0}>

        <Box px={3} pt={2} pb={1} display="flex" alignItems="center" gap={1.5}>
          <Typography variant="h5" fontWeight="bold" color="text.primary">
            Opportunities
          </Typography>
          <Chip
            label="Experimental"
            size="small"
            color="warning"
            sx={{
              height: 20,
              fontSize: '0.625rem',
              fontWeight: 600
            }} />

        </Box>

        <Box px={3}>
          <Tabs
            value={activeTab}
            onChange={(_, v) => setActiveTab(v)}
            textColor="primary"
            indicatorColor="primary"
            sx={{
              minHeight: 48
            }}>

            <Tab
              value="all"
              label={
              <Box display="flex" alignItems="center" gap={1}>
                  All opportunities
                  <Chip
                  label={mockOpportunities.length}
                  size="small"
                  sx={{
                    height: 20,
                    fontSize: '0.75rem',
                    bgcolor: 'grey.100'
                  }} />

                </Box>
              }
              sx={{
                textTransform: 'none',
                fontWeight: 500,
                minHeight: 48
              }} />

            <Tab
              value="saved"
              label={
              <Box display="flex" alignItems="center" gap={1}>
                  Saved
                  {savedOpportunities.size > 0 &&
                <Chip
                  label={savedOpportunities.size}
                  size="small"
                  sx={{
                    height: 20,
                    fontSize: '0.75rem',
                    bgcolor: 'grey.100'
                  }} />

                }
                </Box>
              }
              sx={{
                textTransform: 'none',
                fontWeight: 500,
                minHeight: 48
              }} />

          </Tabs>
        </Box>
      </Box>

      {/* Content */}
      <Box p={3} flexGrow={1}>
        <Paper
          variant="outlined"
          sx={{
            borderRadius: 2,
            overflow: 'hidden',
            mb: 3
          }}>

          {/* Filter Bar */}
          <Box
            display="flex"
            alignItems="center"
            gap={2}
            p={2}
            borderBottom={1}
            borderColor="grey.100"
            flexWrap="wrap">

            {/* Search */}
            <Paper
              component="form"
              sx={{
                p: '2px 4px',
                display: 'flex',
                alignItems: 'center',
                width: 280,
                border: 1,
                borderColor: 'grey.200',
                boxShadow: 'none'
              }}>

              <SearchRounded
                sx={{
                  ml: 1,
                  color: 'grey.400',
                  fontSize: 20
                }} />

              <InputBase
                sx={{
                  ml: 1,
                  flex: 1,
                  fontSize: '0.875rem'
                }}
                placeholder="Search opportunities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)} />

              {searchQuery &&
              <IconButton size="small" onClick={() => setSearchQuery('')}>
                  <CloseRounded
                  sx={{
                    fontSize: 16
                  }} />

                </IconButton>
              }
            </Paper>

            {/* Filters */}
            {/* Mobile: bottom sheet trigger */}
            <Box
              sx={{
                display: {
                  xs: 'block',
                  md: 'none'
                }
              }}>

              <MobileFilterSheet
                activeCount={activeFiltersCount}
                onClear={() => {
                  setSearchQuery('');
                  setTypeFilter([]);
                  setStageFilter([]);
                  setCountryFilter([]);
                }}>

                <FormControl size="small" fullWidth>
                  <InputLabel
                    sx={{
                      fontSize: '0.875rem'
                    }}>

                    Type
                  </InputLabel>
                  <Select
                    multiple
                    value={typeFilter}
                    onChange={handleFilterChange(setTypeFilter)}
                    label="Type"
                    renderValue={(selected) =>
                    (selected as string[]).join(', ')
                    }
                    sx={{
                      fontSize: '0.875rem'
                    }}>

                    {opportunityTypes.map((type) =>
                    <MenuItem key={type} value={type}>
                        <Checkbox
                        checked={typeFilter.indexOf(type) > -1}
                        size="small" />

                        <ListItemText primary={type} />
                      </MenuItem>
                    )}
                  </Select>
                </FormControl>
                <FormControl size="small" fullWidth>
                  <InputLabel
                    sx={{
                      fontSize: '0.875rem'
                    }}>

                    Stage
                  </InputLabel>
                  <Select
                    multiple
                    value={stageFilter}
                    onChange={handleFilterChange(setStageFilter)}
                    label="Stage"
                    renderValue={(selected) =>
                    (selected as string[]).join(', ')
                    }
                    sx={{
                      fontSize: '0.875rem'
                    }}>

                    {stages.map((stage) =>
                    <MenuItem key={stage} value={stage}>
                        <Checkbox
                        checked={stageFilter.indexOf(stage) > -1}
                        size="small" />

                        <ListItemText primary={stage} />
                      </MenuItem>
                    )}
                  </Select>
                </FormControl>
                <FormControl size="small" fullWidth>
                  <InputLabel
                    sx={{
                      fontSize: '0.875rem'
                    }}>

                    Country
                  </InputLabel>
                  <Select
                    multiple
                    value={countryFilter}
                    onChange={handleFilterChange(setCountryFilter)}
                    label="Country"
                    renderValue={(selected) =>
                    (selected as string[]).join(', ')
                    }
                    sx={{
                      fontSize: '0.875rem'
                    }}>

                    {countries.map((country) =>
                    <MenuItem key={country} value={country}>
                        <Checkbox
                        checked={countryFilter.indexOf(country) > -1}
                        size="small" />

                        <ListItemText primary={country} />
                      </MenuItem>
                    )}
                  </Select>
                </FormControl>
              </MobileFilterSheet>
            </Box>

            {/* Desktop: inline filters */}
            <Box
              sx={{
                display: {
                  xs: 'none',
                  md: 'flex'
                },
                alignItems: 'center',
                gap: 2,
                flexWrap: 'wrap'
              }}>

              <FormControl
                size="small"
                sx={{
                  minWidth: 160
                }}>

                <InputLabel
                  sx={{
                    fontSize: '0.875rem'
                  }}>

                  Type
                </InputLabel>
                <Select
                  multiple
                  value={typeFilter}
                  onChange={handleFilterChange(setTypeFilter)}
                  label="Type"
                  renderValue={(selected) => (selected as string[]).join(', ')}
                  sx={{
                    fontSize: '0.875rem'
                  }}>

                  {opportunityTypes.map((type) =>
                  <MenuItem key={type} value={type}>
                      <Checkbox
                      checked={typeFilter.indexOf(type) > -1}
                      size="small" />

                      <ListItemText primary={type} />
                    </MenuItem>
                  )}
                </Select>
              </FormControl>

              <FormControl
                size="small"
                sx={{
                  minWidth: 140
                }}>

                <InputLabel
                  sx={{
                    fontSize: '0.875rem'
                  }}>

                  Stage
                </InputLabel>
                <Select
                  multiple
                  value={stageFilter}
                  onChange={handleFilterChange(setStageFilter)}
                  label="Stage"
                  renderValue={(selected) => (selected as string[]).join(', ')}
                  sx={{
                    fontSize: '0.875rem'
                  }}>

                  {stages.map((stage) =>
                  <MenuItem key={stage} value={stage}>
                      <Checkbox
                      checked={stageFilter.indexOf(stage) > -1}
                      size="small" />

                      <ListItemText primary={stage} />
                    </MenuItem>
                  )}
                </Select>
              </FormControl>

              <FormControl
                size="small"
                sx={{
                  minWidth: 140
                }}>

                <InputLabel
                  sx={{
                    fontSize: '0.875rem'
                  }}>

                  Country
                </InputLabel>
                <Select
                  multiple
                  value={countryFilter}
                  onChange={handleFilterChange(setCountryFilter)}
                  label="Country"
                  renderValue={(selected) => (selected as string[]).join(', ')}
                  sx={{
                    fontSize: '0.875rem'
                  }}>

                  {countries.map((country) =>
                  <MenuItem key={country} value={country}>
                      <Checkbox
                      checked={countryFilter.indexOf(country) > -1}
                      size="small" />

                      <ListItemText primary={country} />
                    </MenuItem>
                  )}
                </Select>
              </FormControl>

              {(activeFiltersCount > 0 || searchQuery) &&
              <Button
                size="small"
                onClick={() => {
                  setSearchQuery('');
                  setTypeFilter([]);
                  setStageFilter([]);
                  setCountryFilter([]);
                }}
                sx={{
                  textTransform: 'none',
                  color: 'text.secondary'
                }}>

                  Clear
                </Button>
              }
            </Box>
          </Box>

          {/* Results Grid */}
          <Box p={2} bgcolor="grey.50">
            {filteredOpportunities.length === 0 ?
            <Box py={8} textAlign="center" color="text.disabled">
                No opportunities found matching your criteria
              </Box> :

            <Box
              display="grid"
              gridTemplateColumns={{
                xs: '1fr',
                md: 'repeat(2, 1fr)',
                lg: 'repeat(3, 1fr)'
              }}
              gap={2}>

                {filteredOpportunities.map((opp) =>
              <Box
                key={opp.id}
                sx={{
                  opacity: fadingItems.has(opp.id) ? 0 : 1,
                  transition: fadingItems.has(opp.id) ?
                  'opacity 7s ease' :
                  'none'
                }}>

                    <OpportunityCard
                  id={opp.id}
                  type={opp.type}
                  description={opp.description}
                  projectName={opp.projectName}
                  projectUpid={opp.projectUpid}
                  developer={opp.developer}
                  stage={opp.stage}
                  country={opp.country}
                  countryCode={opp.countryCode}
                  urgent={opp.urgent}
                  isSaved={
                  savedOpportunities.has(opp.id) &&
                  !fadingItems.has(opp.id)
                  }
                  onToggleSave={(e) => toggleSave(opp.id, e)}
                  onProjectClick={(e) => {
                    e.stopPropagation();
                    navigate(`/projects/${opp.projectUpid}`);
                  }}
                  onContactClick={(e) => {
                    e.stopPropagation();
                    // Handle contact click
                  }} />

                  </Box>
              )}
              </Box>
            }
          </Box>

          {/* Footer */}
          {filteredOpportunities.length > 0 &&
          <Box px={2} py={1.5} borderTop={1} borderColor="grey.100">
              <Typography variant="caption" color="text.secondary">
                Showing {filteredOpportunities.length} opportunities
              </Typography>
            </Box>
          }
        </Paper>
      </Box>
    </Box>);

}