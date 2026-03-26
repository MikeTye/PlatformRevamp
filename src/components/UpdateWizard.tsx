import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  IconButton,
  Stack,
  Divider,
  InputAdornment,
  Chip,
  Avatar } from
'@mui/material';
import CloseRounded from '@mui/icons-material/CloseRounded';
import AutoAwesomeRounded from '@mui/icons-material/AutoAwesomeRounded';
import CloudUploadRounded from '@mui/icons-material/CloudUploadRounded';
import SendRounded from '@mui/icons-material/SendRounded';
import ImageRounded from '@mui/icons-material/ImageRounded';
import FolderRounded from '@mui/icons-material/FolderRounded';
import CheckCircleRounded from '@mui/icons-material/CheckCircleRounded';
import { useNavigate } from 'react-router-dom';
interface UpdateWizardProps {
  open: boolean;
  onClose: () => void;
}
// Mock projects data
const mockProjects = [
{
  id: 'CUP-MY042713-5',
  name: 'Sarawak Peatland Rewetting Initiative',
  stage: 'Design',
  type: 'Peatland',
  country: 'Malaysia',
  countryFlag: '🇲🇾'
},
{
  id: 'CUP-MY156789-2',
  name: 'Sabah Rainforest Conservation',
  stage: 'Listed',
  type: 'REDD+',
  country: 'Malaysia',
  countryFlag: '🇲🇾'
},
{
  id: 'CUP-ID203847-2',
  name: 'Sumatra Mangrove Restoration',
  stage: 'Design',
  type: 'Blue Carbon',
  country: 'Indonesia',
  countryFlag: '🇮🇩'
}];

export function UpdateWizard({ open, onClose }: UpdateWizardProps) {
  const navigate = useNavigate();
  const [selectedProject, setSelectedProject] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setImageFile(e.dataTransfer.files[0]);
    }
  };
  const handlePost = () => {
    // In a real app, this would save the update
    onClose();
    if (selectedProject) {
      navigate(`/projects/${selectedProject}`);
    }
  };
  const canPost = selectedProject && title && description;
  if (!open) return null;
  const selectedProjectData = mockProjects.find((p) => p.id === selectedProject);
  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        bgcolor: 'white',
        zIndex: 1300,
        display: 'flex',
        flexDirection: 'column'
      }}>

      {/* Header */}
      <Box
        sx={{
          height: 64,
          borderBottom: 1,
          borderColor: 'grey.200',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 3,
          bgcolor: 'white'
        }}>

        <Box display="flex" alignItems="center" gap={2}>
          <IconButton onClick={onClose} size="small">
            <CloseRounded
              sx={{
                fontSize: 20
              }} />

          </IconButton>
          <Typography variant="h6" fontWeight="bold">
            Post Update
          </Typography>
        </Box>
        <Button
          onClick={onClose}
          sx={{
            color: 'text.secondary'
          }}>

          Cancel
        </Button>
      </Box>

      {/* Main Content Area */}
      <Box
        sx={{
          display: 'flex',
          flex: 1,
          overflow: 'hidden'
        }}>

        {/* Left: Form Content */}
        <Box
          sx={{
            flex: 1,
            overflowY: 'auto',
            p: {
              xs: 2,
              md: 4
            }
          }}>

          <Box maxWidth={640} mx="auto">
            <Stack spacing={4}>
              <Box>
                <Typography variant="h5" fontWeight="bold" gutterBottom>
                  Share a Project Update
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Keep your followers informed about project progress,
                  milestones, and news.
                </Typography>
              </Box>

              {/* Project Selection */}
              <Box>
                <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                  Select Project
                </Typography>
                <Stack spacing={1}>
                  {mockProjects.map((project) =>
                  <Paper
                    key={project.id}
                    variant="outlined"
                    onClick={() => setSelectedProject(project.id)}
                    sx={{
                      p: 2,
                      cursor: 'pointer',
                      borderColor:
                      selectedProject === project.id ?
                      'primary.main' :
                      'grey.200',
                      bgcolor:
                      selectedProject === project.id ?
                      'primary.50' :
                      'transparent',
                      '&:hover': {
                        borderColor: 'primary.main',
                        bgcolor: 'grey.50'
                      },
                      transition: 'all 0.15s ease'
                    }}>

                      <Box display="flex" alignItems="center" gap={2}>
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

                          <FolderRounded
                          sx={{
                            color: 'grey.500'
                          }} />

                        </Box>
                        <Box flex={1} minWidth={0}>
                          <Typography
                          variant="body2"
                          fontWeight="medium"
                          noWrap>

                            {project.name}
                          </Typography>
                          <Box
                          display="flex"
                          alignItems="center"
                          gap={1}
                          mt={0.5}>

                            <Typography
                            variant="caption"
                            color="text.secondary">

                              {project.countryFlag} {project.country}
                            </Typography>
                            <Chip
                            label={project.stage}
                            size="small"
                            sx={{
                              height: 18,
                              fontSize: '0.625rem',
                              bgcolor: 'grey.100'
                            }} />

                            <Chip
                            label={project.type}
                            size="small"
                            sx={{
                              height: 18,
                              fontSize: '0.625rem',
                              bgcolor: 'grey.100'
                            }} />

                          </Box>
                        </Box>
                        {selectedProject === project.id &&
                      <CheckCircleRounded
                        sx={{
                          color: 'primary.main'
                        }} />

                      }
                      </Box>
                    </Paper>
                  )}
                </Stack>
              </Box>

              <Divider />

              {/* Update Content */}
              <Stack spacing={3}>
                <TextField
                  label="Update Title"
                  fullWidth
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Baseline survey completed"
                  disabled={!selectedProject} />


                <TextField
                  label="Date"
                  type="date"
                  fullWidth
                  defaultValue={new Date().toISOString().split('T')[0]}
                  InputLabelProps={{
                    shrink: true
                  }}
                  disabled={!selectedProject} />


                <TextField
                  label="Description"
                  fullWidth
                  multiline
                  minRows={4}
                  maxRows={8}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Share what's new with your project..."
                  disabled={!selectedProject} />


                {/* Image Upload */}
                <Box>
                  <Typography
                    variant="subtitle2"
                    fontWeight="bold"
                    gutterBottom>

                    Add Photo (Optional)
                  </Typography>
                  <Box
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    component="label"
                    sx={{
                      display: 'block',
                      border: '2px dashed',
                      borderColor: imageFile ?
                      'success.main' :
                      isDragging ?
                      'primary.main' :
                      'grey.300',
                      borderRadius: 2,
                      p: 3,
                      textAlign: 'center',
                      bgcolor: imageFile ?
                      'success.50' :
                      isDragging ?
                      'primary.50' :
                      'grey.50',
                      cursor: selectedProject ? 'pointer' : 'not-allowed',
                      opacity: selectedProject ? 1 : 0.5,
                      transition: 'all 0.2s ease',
                      '&:hover': selectedProject ?
                      {
                        borderColor: 'primary.main',
                        bgcolor: 'primary.50'
                      } :
                      {}
                    }}>

                    <input
                      type="file"
                      hidden
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={!selectedProject} />

                    {imageFile ?
                    <Box
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      gap={2}>

                        <CheckCircleRounded
                        sx={{
                          color: 'success.main',
                          fontSize: 28
                        }} />

                        <Box textAlign="left">
                          <Typography
                          variant="body2"
                          fontWeight="medium"
                          color="success.dark">

                            {imageFile.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {(imageFile.size / 1024 / 1024).toFixed(2)} MB
                          </Typography>
                        </Box>
                        <IconButton
                        size="small"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setImageFile(null);
                        }}
                        sx={{
                          ml: 1
                        }}>

                          <CloseRounded
                          sx={{
                            fontSize: 18
                          }} />

                        </IconButton>
                      </Box> :

                    <Box>
                        <ImageRounded
                        sx={{
                          fontSize: 40,
                          color: 'grey.400',
                          mb: 1
                        }} />

                        <Typography variant="body2" color="text.secondary">
                          Drop an image here or click to browse
                        </Typography>
                        <Typography variant="caption" color="text.disabled">
                          PNG, JPG up to 10MB
                        </Typography>
                      </Box>
                    }
                  </Box>
                </Box>
              </Stack>
            </Stack>
          </Box>
        </Box>

        {/* Right: AI Sidebar */}
        <Box
          sx={{
            width: 300,
            borderLeft: 1,
            borderColor: 'grey.200',
            bgcolor: 'grey.50',
            display: {
              xs: 'none',
              lg: 'flex'
            },
            flexDirection: 'column'
          }}>

          <Box p={3} borderBottom={1} borderColor="grey.200">
            <Box
              display="flex"
              alignItems="center"
              gap={1}
              color="primary.main"
              mb={1}>

              <AutoAwesomeRounded
                sx={{
                  fontSize: 18
                }} />

              <Typography variant="subtitle2" fontWeight="bold">
                AI Assistant
              </Typography>
            </Box>
            <Typography variant="caption" color="text.secondary">
              Here to help with your update.
            </Typography>
          </Box>

          <Box flex={1} p={3} overflow="auto">
            <Box display="flex" gap={2}>
              <Box
                sx={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  bgcolor: 'primary.100',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>

                <AutoAwesomeRounded
                  sx={{
                    fontSize: 14,
                    color: 'grey.800'
                  }} />

              </Box>
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  bgcolor: 'white',
                  border: 1,
                  borderColor: 'grey.200',
                  borderRadius: '0px 12px 12px 12px'
                }}>

                <Typography variant="body2" color="text.primary">
                  {selectedProject ?
                  'Great choice! Share meaningful progress updates to keep stakeholders engaged. Include specific metrics or milestones when possible.' :
                  'Select a project to post an update. Regular updates help build trust with potential partners and buyers.'}
                </Typography>
              </Paper>
            </Box>
          </Box>

          <Box p={3} borderTop={1} borderColor="grey.200">
            <TextField
              fullWidth
              size="small"
              placeholder="Ask me anything..."
              InputProps={{
                endAdornment:
                <InputAdornment position="end">
                    <IconButton size="small">
                      <SendRounded
                      sx={{
                        fontSize: 16
                      }} />

                    </IconButton>
                  </InputAdornment>

              }} />

          </Box>
        </Box>
      </Box>

      {/* Footer Actions */}
      <Box
        sx={{
          height: 72,
          borderTop: 1,
          borderColor: 'grey.200',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          px: {
            xs: 2,
            md: 4
          },
          bgcolor: 'white'
        }}>

        <Button
          variant="contained"
          onClick={handlePost}
          disabled={!canPost}
          size="large"
          sx={{
            px: 4
          }}>

          Post Update
        </Button>
      </Box>
    </Box>);

}