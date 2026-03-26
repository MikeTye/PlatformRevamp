import React, { useState } from 'react';
import {
  Box,
  Button,
  Typography,
  SwipeableDrawer,
  Badge,
  Divider,
  IconButton } from
'@mui/material';
import TuneRounded from '@mui/icons-material/TuneRounded';
import CloseRounded from '@mui/icons-material/CloseRounded';
interface MobileFilterSheetProps {
  children: React.ReactNode;
  activeCount: number;
  onClear: () => void;
}
export function MobileFilterSheet({
  children,
  activeCount,
  onClear
}: MobileFilterSheetProps) {
  const [open, setOpen] = useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);
  return (
    <>
      {/* Trigger Button */}
      <Badge
        badgeContent={activeCount}
        color="primary"
        sx={{
          '& .MuiBadge-badge': {
            fontSize: '0.625rem',
            height: 18,
            minWidth: 18
          }
        }}>

        <Button
          variant="outlined"
          size="small"
          startIcon={
          <TuneRounded
            sx={{
              fontSize: 18
            }} />

          }
          onClick={handleOpen}
          sx={{
            textTransform: 'none',
            borderColor: activeCount > 0 ? 'primary.main' : 'grey.300',
            color: activeCount > 0 ? 'primary.main' : 'text.secondary',
            fontWeight: 500,
            px: 1.5,
            minWidth: 0
          }}>

          Filters
        </Button>
      </Badge>

      {/* Bottom Sheet */}
      <SwipeableDrawer
        anchor="bottom"
        open={open}
        onClose={handleClose}
        onOpen={handleOpen}
        disableSwipeToOpen
        PaperProps={{
          sx: {
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            maxHeight: '85vh',
            pb: 'env(safe-area-inset-bottom)'
          }
        }}>

        {/* Handle bar */}
        <Box display="flex" justifyContent="center" pt={1} pb={0.5}>
          <Box
            sx={{
              width: 36,
              height: 4,
              borderRadius: 2,
              bgcolor: 'grey.300'
            }} />

        </Box>

        {/* Header */}
        <Box
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          px={2.5}
          py={1.5}>

          <Typography variant="subtitle1" fontWeight="bold">
            Filters
            {activeCount > 0 &&
            <Typography
              component="span"
              variant="caption"
              sx={{
                ml: 1,
                px: 1,
                py: 0.25,
                bgcolor: 'primary.main',
                color: 'white',
                borderRadius: 10,
                fontSize: '0.625rem',
                fontWeight: 600
              }}>

                {activeCount}
              </Typography>
            }
          </Typography>
          <IconButton size="small" onClick={handleClose}>
            <CloseRounded
              sx={{
                fontSize: 20
              }} />

          </IconButton>
        </Box>

        <Divider />

        {/* Filter Content */}
        <Box
          sx={{
            px: 2.5,
            py: 2,
            overflow: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 2.5
          }}>

          {children}
        </Box>

        <Divider />

        {/* Actions */}
        <Box
          display="flex"
          gap={1.5}
          px={2.5}
          py={2}
          sx={{
            pb: 'calc(env(safe-area-inset-bottom) + 16px)'
          }}>

          {activeCount > 0 &&
          <Button
            variant="outlined"
            fullWidth
            onClick={() => {
              onClear();
            }}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              borderColor: 'grey.300',
              color: 'text.secondary'
            }}>

              Clear all
            </Button>
          }
          <Button
            variant="contained"
            fullWidth
            onClick={handleClose}
            sx={{
              textTransform: 'none',
              fontWeight: 600
            }}>

            Show results
          </Button>
        </Box>
      </SwipeableDrawer>
    </>);

}