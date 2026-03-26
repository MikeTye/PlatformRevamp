import React, { useEffect, useState, Component } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  useMediaQuery,
  useTheme,
  AppBar,
  Toolbar,
  Divider,
  Paper,
  ClickAwayListener,
  Fade,
  Button,
  Popover,
  Avatar,
  Tooltip } from
'@mui/material';
import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded';
import FolderRoundedIcon from '@mui/icons-material/FolderRounded';
import BusinessRoundedIcon from '@mui/icons-material/BusinessRounded';
import PersonOutlineRoundedIcon from '@mui/icons-material/PersonOutlineRounded';
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import MenuRoundedIcon from '@mui/icons-material/MenuRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import MoreVertRoundedIcon from '@mui/icons-material/MoreVertRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import EditRounded from '@mui/icons-material/EditRounded';
import ShowChartRounded from '@mui/icons-material/ShowChartRounded';
import BookmarkBorderRounded from '@mui/icons-material/BookmarkBorderRounded';
import { ProjectWizard } from '../ProjectWizard';
import { CompanyWizard } from '../CompanyWizard';
import { UpdateWizard } from '../UpdateWizard';
import { useAuth } from '../../context/AuthContext';
interface AppLayoutProps {
  children: React.ReactNode;
}
export function AppLayout({ children }: AppLayoutProps) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.between('md', 'lg'));
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCreateMenuOpen, setIsCreateMenuOpen] = useState(false);
  const [mobileCreateAnchorEl, setMobileCreateAnchorEl] =
  useState<HTMLElement | null>(null);
  const [isProjectWizardOpen, setIsProjectWizardOpen] = useState(false);
  const [isCompanyWizardOpen, setIsCompanyWizardOpen] = useState(false);
  const [isUpdateWizardOpen, setIsUpdateWizardOpen] = useState(false);
  // Compute user initials
  const userName = user?.name || 'Sarah Chen';
  const userInitials = (() => {
    const parts = userName.trim().split(/\s+/);
    if (
    parts.length >= 2 &&
    parts[0].length > 0 &&
    parts[parts.length - 1].length > 0)
    {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return userName.substring(0, 2).toUpperCase();
  })();
  // Handle responsive behavior
  useEffect(() => {
    if (isTablet) {
      setIsCollapsed(true);
    } else if (!isMobile) {
      setIsCollapsed(false);
    }
  }, [isTablet, isMobile]);
  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);
  const navItems = [
  {
    path: '/dashboard',
    label: 'Dashboard',
    icon: DashboardRoundedIcon
  },
  {
    path: '/projects',
    label: 'Projects',
    icon: FolderRoundedIcon
  },
  {
    path: '/companies',
    label: 'Companies',
    icon: BusinessRoundedIcon
  },
  {
    path: '/opportunities',
    label: 'Opportunities',
    icon: ShowChartRounded
  },
  {
    path: '/bookmarks',
    label: 'Bookmarks',
    icon: BookmarkBorderRounded
  }];

  const sidebarWidth = isCollapsed ? 64 : 224;
  const handleMenuToggle = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setIsMenuOpen(!isMenuOpen);
  };
  const handleMenuClose = () => {
    setIsMenuOpen(false);
  };
  const handleMenuNavigate = (path: string) => {
    navigate(path);
    handleMenuClose();
  };
  const handleSignOut = () => {
    logout();
    handleMenuClose();
    navigate('/login');
  };
  // Create button handlers
  const handleCreateClick = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setIsCreateMenuOpen(!isCreateMenuOpen);
  };
  const handleCreateClose = () => {
    setIsCreateMenuOpen(false);
  };
  const handleMobileCreateClick = (event: React.MouseEvent<HTMLElement>) => {
    setMobileCreateAnchorEl(event.currentTarget);
  };
  const handleMobileCreateClose = () => {
    setMobileCreateAnchorEl(null);
  };
  const handleCreateOption = (option: 'company' | 'project' | 'update') => {
    handleCreateClose();
    handleMobileCreateClose();
    switch (option) {
      case 'company':
        setIsCompanyWizardOpen(true);
        break;
      case 'project':
        setIsProjectWizardOpen(true);
        break;
      case 'update':
        setIsUpdateWizardOpen(true);
        break;
    }
  };
  const isMobileCreatePopoverOpen = Boolean(mobileCreateAnchorEl);
  const NavContent = ({ collapsed = false }: {collapsed?: boolean;}) =>
  <Box
    display="flex"
    flexDirection="column"
    height="100%"
    position="relative">

      {/* Logo */}
      <Box
      sx={{
        p: 2,
        borderBottom: 1,
        borderColor: 'grey.100',
        display: 'flex',
        justifyContent: collapsed ? 'center' : 'flex-start'
      }}>

        {collapsed ?
      <Box
        component="img"
        src="/tce-logo-g.svg"
        alt="The Carbon Economy"
        sx={{
          width: 32,
          height: 32,
          flexShrink: 0
        }} /> :


      <Box
        component="img"
        src="/tce-logo.svg"
        alt="The Carbon Economy"
        sx={{
          height: 36,
          width: 'auto'
        }} />

      }
      </Box>

      {/* Navigation */}
      <Box flex={1} p={1}>
        <List disablePadding>
          {navItems.map((item) => {
          const isActive = location.pathname.startsWith(item.path);
          const IconComponent = item.icon;
          return (
            <ListItem
              key={item.path}
              disablePadding
              sx={{
                mb: 0.5
              }}>

                <Tooltip
                title={collapsed ? item.label : ''}
                placement="right"
                arrow>

                  <ListItemButton
                  component={NavLink}
                  to={item.path}
                  sx={{
                    borderRadius: 1,
                    justifyContent: collapsed ? 'center' : 'flex-start',
                    px: collapsed ? 1 : 1.5,
                    py: 1,
                    bgcolor: 'transparent',
                    color: isActive ? 'primary.main' : 'grey.600',
                    fontWeight: isActive ? 600 : 500,
                    '&:hover': {
                      bgcolor: isActive ? 'primary.50' : 'grey.50',
                      color: isActive ? 'primary.main' : 'grey.900'
                    }
                  }}>

                    <ListItemIcon
                    sx={{
                      minWidth: 0,
                      mr: collapsed ? 0 : 1.5,
                      color: 'inherit',
                      justifyContent: 'center'
                    }}>

                      <IconComponent
                      sx={{
                        fontSize: 20
                      }} />

                    </ListItemIcon>
                    {!collapsed &&
                  <ListItemText
                    primary={item.label}
                    primaryTypographyProps={{
                      variant: 'body2',
                      fontWeight: 500
                    }} />

                  }
                  </ListItemButton>
                </Tooltip>
              </ListItem>);

        })}
        </List>
      </Box>

      {/* Create Button Section */}
      <Box px={1} pb={1} position="relative">
        {/* Create Menu - positioned to the RIGHT when collapsed, ABOVE when expanded */}
        <ClickAwayListener onClickAway={handleCreateClose}>
          <Box>
            <Fade in={isCreateMenuOpen}>
              <Paper
              elevation={8}
              sx={{
                position: 'absolute',
                // When collapsed: position to the right of the button
                // When expanded: position above the button
                ...(collapsed ?
                {
                  bottom: 0,
                  left: '100%',
                  ml: 1
                } :
                {
                  bottom: '100%',
                  left: 8,
                  right: 8,
                  mb: 1
                }),
                width: 220,
                borderRadius: 2,
                overflow: 'hidden',
                display: isCreateMenuOpen ? 'block' : 'none',
                zIndex: 1300
              }}>

                <List
                disablePadding
                sx={{
                  py: 0.5
                }}>

                  <ListItemButton
                  onClick={() => handleCreateOption('project')}
                  sx={{
                    py: 1.5,
                    px: 2
                  }}>

                    <ListItemIcon
                    sx={{
                      minWidth: 36
                    }}>

                      <FolderRoundedIcon
                      sx={{
                        fontSize: 20,
                        color: 'grey.700'
                      }} />

                    </ListItemIcon>
                    <ListItemText
                    primary="Project"
                    secondary="Create a new carbon project"
                    primaryTypographyProps={{
                      variant: 'body2',
                      fontWeight: 500
                    }}
                    secondaryTypographyProps={{
                      variant: 'caption'
                    }} />

                  </ListItemButton>
                  <ListItemButton
                  onClick={() => handleCreateOption('company')}
                  sx={{
                    py: 1.5,
                    px: 2
                  }}>

                    <ListItemIcon
                    sx={{
                      minWidth: 36
                    }}>

                      <BusinessRoundedIcon
                      sx={{
                        fontSize: 20,
                        color: 'grey.700'
                      }} />

                    </ListItemIcon>
                    <ListItemText
                    primary="Company"
                    secondary="Add a new organization"
                    primaryTypographyProps={{
                      variant: 'body2',
                      fontWeight: 500
                    }}
                    secondaryTypographyProps={{
                      variant: 'caption'
                    }} />

                  </ListItemButton>
                  <ListItemButton
                  onClick={() => handleCreateOption('update')}
                  sx={{
                    py: 1.5,
                    px: 2
                  }}>

                    <ListItemIcon
                    sx={{
                      minWidth: 36
                    }}>

                      <EditRounded
                      sx={{
                        fontSize: 20,
                        color: 'grey.700'
                      }} />

                    </ListItemIcon>
                    <ListItemText
                    primary="Update"
                    secondary="Post a project update"
                    primaryTypographyProps={{
                      variant: 'body2',
                      fontWeight: 500
                    }}
                    secondaryTypographyProps={{
                      variant: 'caption'
                    }} />

                  </ListItemButton>
                </List>
              </Paper>
            </Fade>
          </Box>
        </ClickAwayListener>

        {/* Create Button */}
        {collapsed ?
      <IconButton
        onClick={handleCreateClick}
        sx={{
          width: '100%',
          height: 40,
          bgcolor: 'primary.main',
          color: 'white',
          borderRadius: 1,
          '&:hover': {
            bgcolor: 'primary.dark'
          }
        }}
        title="Add">

            <AddRoundedIcon
          sx={{
            fontSize: 20
          }} />

          </IconButton> :

      <Button
        fullWidth
        variant="contained"
        startIcon={<AddRoundedIcon />}
        onClick={handleCreateClick}
        sx={{
          textTransform: 'none',
          fontWeight: 600,
          py: 1
        }}>

            Add
          </Button>
      }
      </Box>

      {/* User Profile Section with Menu */}
      <Box p={1} borderTop={1} borderColor="grey.100" position="relative">
        {/* Dropdown Menu - positioned absolutely above the user card */}
        {!collapsed &&
      <ClickAwayListener onClickAway={handleMenuClose}>
            <Box>
              <Fade in={isMenuOpen}>
                <Paper
              elevation={8}
              sx={{
                position: 'absolute',
                bottom: '100%',
                left: 8,
                right: 8,
                mb: 1,
                borderRadius: 2,
                overflow: 'hidden',
                display: isMenuOpen ? 'block' : 'none',
                zIndex: 1300
              }}>

                  {/* User Info Header */}
                  <Box px={2} py={1.5} borderBottom={1} borderColor="grey.100">
                    <Typography variant="subtitle2" fontWeight="bold">
                      {user?.name || 'User'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {user?.email || 'user@example.com'}
                    </Typography>
                  </Box>

                  <List disablePadding>
                    <ListItemButton
                  onClick={() => handleMenuNavigate('/account')}
                  sx={{
                    py: 1
                  }}>

                      <ListItemIcon
                    sx={{
                      minWidth: 36
                    }}>

                        <PersonOutlineRoundedIcon
                      sx={{
                        fontSize: 20
                      }} />

                      </ListItemIcon>
                      <ListItemText
                    primary="Profile"
                    primaryTypographyProps={{
                      variant: 'body2'
                    }} />

                    </ListItemButton>
                    <ListItemButton
                  onClick={() => handleMenuNavigate('/account')}
                  sx={{
                    py: 1
                  }}>

                      <ListItemIcon
                    sx={{
                      minWidth: 36
                    }}>

                        <SettingsRoundedIcon
                      sx={{
                        fontSize: 20
                      }} />

                      </ListItemIcon>
                      <ListItemText
                    primary="Settings"
                    primaryTypographyProps={{
                      variant: 'body2'
                    }} />

                    </ListItemButton>
                  </List>

                  <Divider />

                  <List disablePadding>
                    <ListItemButton
                  onClick={() =>
                  handleMenuNavigate('/account?tab=companies')
                  }
                  sx={{
                    py: 1
                  }}>

                      <ListItemIcon
                    sx={{
                      minWidth: 36
                    }}>

                        <BusinessRoundedIcon
                      sx={{
                        fontSize: 20
                      }} />

                      </ListItemIcon>
                      <ListItemText
                    primary="My Companies"
                    primaryTypographyProps={{
                      variant: 'body2'
                    }} />

                    </ListItemButton>
                    <ListItemButton
                  onClick={() =>
                  handleMenuNavigate('/account?tab=projects')
                  }
                  sx={{
                    py: 1
                  }}>

                      <ListItemIcon
                    sx={{
                      minWidth: 36
                    }}>

                        <FolderRoundedIcon
                      sx={{
                        fontSize: 20
                      }} />

                      </ListItemIcon>
                      <ListItemText
                    primary="My Projects"
                    primaryTypographyProps={{
                      variant: 'body2'
                    }} />

                    </ListItemButton>
                  </List>

                  <Divider />

                  <List disablePadding>
                    <ListItemButton
                  onClick={handleSignOut}
                  sx={{
                    py: 1
                  }}>

                      <ListItemIcon
                    sx={{
                      minWidth: 36
                    }}>

                        <LogoutRoundedIcon
                      sx={{
                        fontSize: 20
                      }} />

                      </ListItemIcon>
                      <ListItemText
                    primary="Sign out"
                    primaryTypographyProps={{
                      variant: 'body2'
                    }} />

                    </ListItemButton>
                  </List>
                </Paper>
              </Fade>
            </Box>
          </ClickAwayListener>
      }

        {/* User Card */}
        <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          borderRadius: 1,
          px: collapsed ? 1 : 1.5,
          py: 1
        }}>

          {/* User info - clickable to go to profile */}
          <Box
          onClick={() => navigate('/account')}
          sx={{
            display: 'flex',
            alignItems: 'center',
            flex: 1,
            cursor: 'pointer',
            borderRadius: 1,
            '&:hover': {
              bgcolor: 'grey.50'
            },
            p: 0.5,
            m: -0.5
          }}>

            <Avatar
            sx={{
              width: 32,
              height: 32,
              bgcolor: 'grey.700',
              color: 'white',
              fontSize: '0.75rem',
              fontWeight: 600,
              flexShrink: 0,
              mr: collapsed ? 0 : 1.5
            }}>

              {userInitials}
            </Avatar>
            {!collapsed &&
          <Box flex={1} minWidth={0}>
                <Typography
              variant="caption"
              fontWeight="bold"
              display="block"
              noWrap>

                  {userName}
                </Typography>
                <Typography
              variant="caption"
              color="text.secondary"
              display="block"
              noWrap
              sx={{
                fontSize: '0.625rem'
              }}>

                  {user?.email || 'sarah@borneocarbon.com'}
                </Typography>
              </Box>
          }
          </Box>

          {/* Vertical ellipsis button - opens menu */}
          {!collapsed &&
        <IconButton
          size="small"
          onClick={handleMenuToggle}
          sx={{
            ml: 0.5,
            p: 0.5,
            '&:hover': {
              bgcolor: 'grey.100'
            }
          }}>

              <MoreVertRoundedIcon
            sx={{
              fontSize: 18,
              color: 'grey.500'
            }} />

            </IconButton>
        }
        </Box>
      </Box>
    </Box>;

  // Mobile layout
  if (isMobile) {
    return (
      <Box minHeight="100vh" bgcolor="grey.100">
        <AppBar
          position="fixed"
          color="inherit"
          elevation={0}
          sx={{
            borderBottom: 1,
            borderColor: 'grey.200',
            height: 56
          }}>

          <Toolbar
            sx={{
              minHeight: '56px !important',
              px: 2,
              justifyContent: 'space-between'
            }}>

            <Box display="flex" alignItems="center" gap={1}>
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  bgcolor: 'grey.900',
                  borderRadius: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>

                <Typography variant="caption" fontWeight="bold" color="white">
                  TC
                </Typography>
              </Box>
              <Typography variant="subtitle2" fontWeight="bold">
                The Carbon Economy
              </Typography>
            </Box>
            <Box display="flex" alignItems="center" gap={1}>
              <IconButton
                onClick={handleMobileCreateClick}
                size="small"
                sx={{
                  bgcolor: 'grey.900',
                  color: 'white',
                  '&:hover': {
                    bgcolor: 'grey.800'
                  }
                }}>

                <AddRoundedIcon
                  sx={{
                    fontSize: 20
                  }} />

              </IconButton>
              <IconButton
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                size="small">

                {isMobileMenuOpen ? <CloseRoundedIcon /> : <MenuRoundedIcon />}
              </IconButton>
            </Box>
          </Toolbar>
        </AppBar>

        <Drawer
          anchor="top"
          open={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
          PaperProps={{
            sx: {
              top: 56,
              boxShadow: 3
            }
          }}
          ModalProps={{
            keepMounted: true,
            sx: {
              zIndex: 1100
            }
          }}
          sx={{
            zIndex: 1100
          }}>

          <Box p={1}>
            <List>
              {navItems.map((item) => {
                const isActive = location.pathname.startsWith(item.path);
                const IconComponent = item.icon;
                return (
                  <ListItem key={item.path} disablePadding>
                    <ListItemButton
                      component={NavLink}
                      to={item.path}
                      sx={{
                        borderRadius: 1,
                        bgcolor: isActive ? 'grey.100' : 'transparent',
                        color: isActive ? 'grey.900' : 'grey.600',
                        mb: 0.5
                      }}>

                      <ListItemIcon
                        sx={{
                          minWidth: 32,
                          color: 'inherit'
                        }}>

                        <IconComponent
                          sx={{
                            fontSize: 20
                          }} />

                      </ListItemIcon>
                      <ListItemText
                        primary={item.label}
                        primaryTypographyProps={{
                          variant: 'body2',
                          fontWeight: 500
                        }} />

                    </ListItemButton>
                  </ListItem>);

              })}
            </List>
            <Divider
              sx={{
                my: 1
              }} />

            <Box
              px={2}
              py={1.5}
              display="flex"
              alignItems="center"
              gap={1.5}
              onClick={() => navigate('/account')}
              sx={{
                cursor: 'pointer'
              }}>

              <Box
                sx={{
                  width: 32,
                  height: 32,
                  bgcolor: 'grey.200',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>

                <PersonOutlineRoundedIcon
                  sx={{
                    fontSize: 18,
                    color: 'grey.600'
                  }} />

              </Box>
              <Box>
                <Typography variant="body2" fontWeight="medium">
                  {user?.name || 'User'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {user?.email || 'user@example.com'}
                </Typography>
              </Box>
            </Box>
            <Divider
              sx={{
                my: 1
              }} />

            <ListItem disablePadding>
              <ListItemButton
                onClick={handleSignOut}
                sx={{
                  borderRadius: 1,
                  color: 'error.main'
                }}>

                <ListItemIcon
                  sx={{
                    minWidth: 32,
                    color: 'error.main'
                  }}>

                  <LogoutRoundedIcon
                    sx={{
                      fontSize: 20
                    }} />

                </ListItemIcon>
                <ListItemText
                  primary="Sign out"
                  primaryTypographyProps={{
                    variant: 'body2',
                    fontWeight: 500
                  }} />

              </ListItemButton>
            </ListItem>
          </Box>
        </Drawer>

        <Box
          component="main"
          pt="56px"
          sx={{
            width: '100%',
            maxWidth: '100vw',
            overflow: 'hidden'
          }}>

          {children}
        </Box>

        {/* Mobile Create Popover */}
        <Popover
          open={isMobileCreatePopoverOpen}
          anchorEl={mobileCreateAnchorEl}
          onClose={handleMobileCreateClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'center'
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'center'
          }}
          PaperProps={{
            sx: {
              mt: 1,
              borderRadius: 2,
              boxShadow: 4,
              minWidth: 200
            }
          }}>

          <List
            disablePadding
            sx={{
              py: 0.5
            }}>

            <ListItemButton
              onClick={() => handleCreateOption('project')}
              sx={{
                py: 1.5,
                px: 2
              }}>

              <ListItemIcon
                sx={{
                  minWidth: 36
                }}>

                <FolderRoundedIcon
                  sx={{
                    fontSize: 20,
                    color: 'grey.700'
                  }} />

              </ListItemIcon>
              <ListItemText
                primary="Project"
                secondary="Create a new carbon project"
                primaryTypographyProps={{
                  variant: 'body2',
                  fontWeight: 500
                }}
                secondaryTypographyProps={{
                  variant: 'caption'
                }} />

            </ListItemButton>
            <ListItemButton
              onClick={() => handleCreateOption('company')}
              sx={{
                py: 1.5,
                px: 2
              }}>

              <ListItemIcon
                sx={{
                  minWidth: 36
                }}>

                <BusinessRoundedIcon
                  sx={{
                    fontSize: 20,
                    color: 'grey.700'
                  }} />

              </ListItemIcon>
              <ListItemText
                primary="Company"
                secondary="Add a new organization"
                primaryTypographyProps={{
                  variant: 'body2',
                  fontWeight: 500
                }}
                secondaryTypographyProps={{
                  variant: 'caption'
                }} />

            </ListItemButton>
            <ListItemButton
              onClick={() => handleCreateOption('update')}
              sx={{
                py: 1.5,
                px: 2
              }}>

              <ListItemIcon
                sx={{
                  minWidth: 36
                }}>

                <EditRounded
                  sx={{
                    fontSize: 20,
                    color: 'grey.700'
                  }} />

              </ListItemIcon>
              <ListItemText
                primary="Update"
                secondary="Post a project update"
                primaryTypographyProps={{
                  variant: 'body2',
                  fontWeight: 500
                }}
                secondaryTypographyProps={{
                  variant: 'caption'
                }} />

            </ListItemButton>
          </List>
        </Popover>

        {/* Wizards */}
        <ProjectWizard
          open={isProjectWizardOpen}
          onClose={() => setIsProjectWizardOpen(false)}
          hasCompanies={true} />

        <CompanyWizard
          open={isCompanyWizardOpen}
          onClose={() => setIsCompanyWizardOpen(false)} />

      </Box>);

  }
  // Desktop layout
  return (
    <Box display="flex" minHeight="100vh" bgcolor="grey.100">
      <Box
        component="aside"
        sx={{
          width: sidebarWidth,
          bgcolor: 'white',
          borderRight: 1,
          borderColor: 'grey.200',
          position: 'fixed',
          height: '100%',
          transition: 'width 0.2s',
          zIndex: 1200,
          display: 'flex',
          flexDirection: 'column'
        }}>

        <NavContent collapsed={isCollapsed} />

        <IconButton
          onClick={() => setIsCollapsed(!isCollapsed)}
          size="small"
          sx={{
            position: 'absolute',
            right: -12,
            top: 80,
            bgcolor: 'white',
            border: 1,
            borderColor: 'grey.200',
            width: 24,
            height: 24,
            '&:hover': {
              bgcolor: 'grey.50'
            },
            boxShadow: 1
          }}>

          {isCollapsed ?
          <ChevronRightRoundedIcon
            sx={{
              fontSize: 14
            }} /> :


          <ChevronLeftRoundedIcon
            sx={{
              fontSize: 14
            }} />

          }
        </IconButton>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          ml: `${sidebarWidth}px`,
          transition: 'margin-left 0.2s',
          minWidth: 0
        }}>

        {children}
      </Box>

      {/* Wizards */}
      <ProjectWizard
        open={isProjectWizardOpen}
        onClose={() => setIsProjectWizardOpen(false)}
        hasCompanies={true} />

      <CompanyWizard
        open={isCompanyWizardOpen}
        onClose={() => setIsCompanyWizardOpen(false)} />

      <UpdateWizard
        open={isUpdateWizardOpen}
        onClose={() => setIsUpdateWizardOpen(false)} />

    </Box>);

}