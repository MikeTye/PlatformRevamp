import React, { Fragment } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Stack,
  Button,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText } from
'@mui/material';
import ArrowBackRounded from '@mui/icons-material/ArrowBackRounded';
import CheckBoxOutlineBlankRounded from '@mui/icons-material/CheckBoxOutlineBlankRounded';
import ArrowForwardRounded from '@mui/icons-material/ArrowForwardRounded';
import {
  ProjectStageIndicator,
  ProjectStage } from
'../components/ProjectStageIndicator';
interface StageInfo {
  stage: ProjectStage;
  description: string;
  readinessChecklist: string[];
  keyOutcome: string;
}
const stagesData: StageInfo[] = [
{
  stage: 'Exploration',
  description:
  'A potential carbon project is being explored, but no specific project, assets, or boundaries have been formally defined. This is the earliest phase where opportunities are identified and initial due diligence begins.',
  readinessChecklist: [
  'Identify potential project area or asset',
  'Conduct initial feasibility assessment',
  'Map key stakeholders and landowners',
  'Assess regulatory and legal landscape',
  'Evaluate carbon potential (rough estimate)'],

  keyOutcome: 'Decision to proceed with a defined project concept'
},
{
  stage: 'Concept',
  description:
  'A specific carbon project is defined in principle, with identified assets, boundaries, and an intended carbon pathway. The project team begins formalizing the approach and engaging stakeholders.',
  readinessChecklist: [
  'Define project boundaries and scope',
  'Select carbon standard and methodology',
  'Conduct preliminary baseline assessment',
  'Develop community engagement plan',
  'Secure initial land rights or agreements',
  'Prepare concept note or PIN'],

  keyOutcome: 'Formal project concept documented and stakeholders aligned'
},
{
  stage: 'Design',
  description:
  'The carbon project is materially designed, with core assumptions, documentation, and monitoring approach drafted. This is where the Project Design Document (PDD) takes shape.',
  readinessChecklist: [
  'Draft Project Design Document (PDD)',
  'Develop monitoring and measurement plan',
  'Complete financial model and projections',
  'Obtain Free, Prior and Informed Consent (FPIC)',
  'Conduct environmental and social impact assessment',
  'Establish baseline data collection',
  'Engage validation/verification body (VVB)'],

  keyOutcome: 'Complete PDD ready for submission to registry'
},
{
  stage: 'Listed',
  description:
  'The project has been formally submitted to a standard or registry and is now listed for validation review. The project is publicly visible and enters the formal approval pipeline.',
  readinessChecklist: [
  'Submit PDD to selected registry',
  'Pay listing and registration fees',
  'Complete all listing requirements',
  'Prepare for public comment period',
  'Respond to any registry queries',
  'Arrange validation audit logistics'],

  keyOutcome: 'Project publicly listed and ready for third-party validation'
},
{
  stage: 'Validation',
  description:
  'The project is undergoing third-party validation and formal review against the selected standard and methodology. An independent auditor assesses whether the project meets all requirements.',
  readinessChecklist: [
  'Third-party auditor (VVB) formally engaged',
  'Desk review of all documentation completed',
  'On-site validation visit conducted',
  'Address any Corrective Action Requests (CARs)',
  'Respond to Clarification Requests (CLs)',
  'Validation report finalized and submitted'],

  keyOutcome: 'Positive validation opinion issued by VVB'
},
{
  stage: 'Registered',
  description:
  'The project has been approved and registered under a standard, making it eligible to generate credits once monitoring conditions are met. This is a major milestone.',
  readinessChecklist: [
  'Validation report approved by registry',
  'Registration fees paid in full',
  'Monitoring system fully operational',
  'Data collection procedures in place',
  'Reporting schedule established',
  'Safeguards and grievance mechanisms active'],

  keyOutcome: 'Project eligible to generate and issue carbon credits'
},
{
  stage: 'Issued',
  description:
  'Verified emission reductions or removals have been issued as credits and exist in a registry account. The project has successfully demonstrated measurable climate impact.',
  readinessChecklist: [
  'Monitoring report prepared and submitted',
  'Verification audit completed by VVB',
  'Verification report approved by registry',
  'Credits issued to registry account',
  'Credit serial numbers assigned',
  'Ongoing monitoring and reporting maintained'],

  keyOutcome: 'Tradeable carbon credits available in registry account'
},
{
  stage: 'Closed',
  description:
  'The carbon project is no longer active in the lifecycle, with no further validation, verification, or issuance expected. This may be due to project completion, expiry, or voluntary withdrawal.',
  readinessChecklist: [
  'Final verification and issuance completed',
  'All contractual obligations fulfilled',
  'Registry status updated to closed/inactive',
  'Final reporting submitted',
  'Lessons learned documented',
  'Stakeholder notifications sent'],

  keyOutcome: 'Project formally concluded with all obligations met'
}];

const stageOrder: ProjectStage[] = [
'Exploration',
'Concept',
'Design',
'Listed',
'Validation',
'Registered',
'Issued',
'Closed'];

export function ProjectStagesGuidePage() {
  const navigate = useNavigate();
  return (
    <Box minHeight="100vh" bgcolor="grey.50">
      {/* Header */}
      <Box
        bgcolor="white"
        borderBottom={1}
        borderColor="grey.200"
        px={3}
        py={2}>
        
        <Button
          startIcon={
          <ArrowBackRounded
            sx={{
              fontSize: 16
            }} />

          }
          onClick={() => navigate(-1)}
          sx={{
            color: 'text.secondary',
            mb: 1,
            '&:hover': {
              color: 'text.primary',
              bgcolor: 'transparent'
            }
          }}>
          
          Back
        </Button>
        <Typography
          variant="h5"
          fontWeight="bold"
          color="text.primary"
          mb={0.5}>
          
          Project Stages Guide
        </Typography>
        <Typography variant="body2" color="text.secondary" maxWidth={700}>
          Every carbon project follows a structured lifecycle from initial
          exploration through credit issuance. This guide explains each stage,
          what it means, and what's needed to progress.
        </Typography>
      </Box>

      <Box maxWidth="lg" mx="auto" p={3}>
        {/* Visual Pipeline */}
        <Paper
          variant="outlined"
          sx={{
            p: 3,
            mb: 4,
            borderRadius: 2
          }}>
          
          <Typography
            variant="subtitle2"
            fontWeight="bold"
            color="text.primary"
            mb={2}>
            
            Project Lifecycle Overview
          </Typography>
          <Box display="flex" alignItems="center" gap={0.5} flexWrap="wrap">
            {stageOrder.map((stage, idx) =>
            <Fragment key={stage}>
                <ProjectStageIndicator stage={stage} size="medium" />
                {idx < stageOrder.length - 1 &&
              <ArrowForwardRounded
                sx={{
                  fontSize: 16,
                  color: 'grey.400',
                  mx: 0.5
                }} />

              }
              </Fragment>
            )}
          </Box>
        </Paper>

        {/* Stage Cards */}
        <Stack spacing={3}>
          {stagesData.map((info, idx) =>
          <Paper
            key={info.stage}
            variant="outlined"
            sx={{
              borderRadius: 2,
              overflow: 'hidden'
            }}>
            
              {/* Stage Header */}
              <Box display="flex" alignItems="center" gap={2} p={3} pb={2}>
                <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  bgcolor: 'grey.100',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                
                  <Typography
                  variant="body2"
                  fontWeight="bold"
                  color="grey.600">
                  
                    {idx + 1}
                  </Typography>
                </Box>
                <Box flex={1}>
                  <Box display="flex" alignItems="center" gap={1.5} mb={0.5}>
                    <Typography
                    variant="h6"
                    fontWeight="bold"
                    color="text.primary">
                    
                      {info.stage}
                    </Typography>
                    <ProjectStageIndicator stage={info.stage} />
                  </Box>
                </Box>
              </Box>

              {/* Description */}
              <Box px={3} pb={2}>
                <Typography
                variant="body2"
                color="text.secondary"
                lineHeight={1.7}>
                
                  {info.description}
                </Typography>
              </Box>

              <Divider />

              {/* Readiness Checklist */}
              <Box px={3} py={2}>
                <Typography
                variant="caption"
                fontWeight={700}
                color="text.secondary"
                sx={{
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                  display: 'block',
                  mb: 1
                }}>
                
                  Readiness Checklist
                </Typography>
                <List dense disablePadding>
                  {info.readinessChecklist.map((item, i) =>
                <ListItem
                  key={i}
                  disablePadding
                  sx={{
                    py: 0.5
                  }}>
                  
                      <ListItemIcon
                    sx={{
                      minWidth: 28
                    }}>
                    
                        <CheckBoxOutlineBlankRounded
                      sx={{
                        fontSize: 16,
                        color: 'grey.400'
                      }} />
                    
                      </ListItemIcon>
                      <ListItemText
                    primary={item}
                    primaryTypographyProps={{
                      variant: 'body2',
                      color: 'text.primary'
                    }} />
                  
                    </ListItem>
                )}
                </List>
              </Box>

              <Divider />

              {/* Key Outcome */}
              <Box px={3} py={2} bgcolor="grey.50">
                <Typography
                variant="caption"
                fontWeight={700}
                color="text.secondary"
                sx={{
                  textTransform: 'uppercase',
                  letterSpacing: 0.5
                }}>
                
                  Key Outcome
                </Typography>
                <Typography
                variant="body2"
                fontWeight="medium"
                color="text.primary"
                mt={0.5}>
                
                  {info.keyOutcome}
                </Typography>
              </Box>
            </Paper>
          )}
        </Stack>
      </Box>
    </Box>);

}