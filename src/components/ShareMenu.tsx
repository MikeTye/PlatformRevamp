import React, { useState, createElement, Component } from 'react';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import TwitterIcon from '@mui/icons-material/Twitter';
import EmailIcon from '@mui/icons-material/Email';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DownloadIcon from '@mui/icons-material/Download';
import { QRCodeSVG, QRCodeCanvas } from 'qrcode.react';
interface ShareMenuProps {
  anchorEl: HTMLElement | null;
  open: boolean;
  onClose: () => void;
  shareUrl: string;
  shareTitle?: string;
}
export function ShareMenu({
  anchorEl,
  open,
  onClose,
  shareUrl,
  shareTitle
}: ShareMenuProps) {
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const handleClose = () => {
    setShowQR(false);
    onClose();
  };
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
    } catch {
      // fallback
      const el = document.createElement('textarea');
      el.value = shareUrl;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
    }
    handleClose();
  };
  const handleLinkedIn = () => {
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    handleClose();
  };
  const handleTwitter = () => {
    const text = shareTitle ? `${shareTitle} ${shareUrl}` : shareUrl;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    handleClose();
  };
  const handleEmail = () => {
    const subject = shareTitle ?
    encodeURIComponent(shareTitle) :
    'Check this out';
    const body = encodeURIComponent(shareUrl);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
    handleClose();
  };
  const handleDownloadQR = () => {
    const canvas = document.getElementById(
      'qr-download-canvas'
    ) as HTMLCanvasElement;
    if (canvas) {
      const url = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = url;
      link.download = 'qrcode.png';
      link.click();
    }
  };
  return (
    <>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        transformOrigin={{
          horizontal: 'right',
          vertical: 'top'
        }}
        anchorOrigin={{
          horizontal: 'right',
          vertical: 'bottom'
        }}
        PaperProps={{
          sx: {
            minWidth: 220
          }
        }}>

        {showQR ?
        <Box>
            <MenuItem onClick={() => setShowQR(false)} dense>
              <ListItemIcon>
                <ArrowBackIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Back" />
            </MenuItem>
            <Divider />
            <Box
            sx={{
              px: 2,
              py: 2,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 1.5,
              bgcolor: 'grey.50',
              mx: 1,
              my: 1,
              borderRadius: 1
            }}>

              <QRCodeSVG value={shareUrl || window.location.href} size={180} />
              <Typography
              variant="caption"
              color="text.secondary"
              sx={{
                maxWidth: 200,
                textAlign: 'center',
                wordBreak: 'break-all'
              }}>

                {shareUrl || window.location.href}
              </Typography>
              <Button
              variant="outlined"
              size="small"
              startIcon={<DownloadIcon />}
              onClick={handleDownloadQR}>

                Download QR Code
              </Button>
              {/* Hidden canvas used for PNG download */}
              <Box
              sx={{
                display: 'none'
              }}>

                <QRCodeCanvas
                id="qr-download-canvas"
                value={shareUrl || window.location.href}
                size={512} />

              </Box>
            </Box>
          </Box> :

        <Box>
            <MenuItem onClick={handleCopyLink}>
              <ListItemIcon>
                <ContentCopyIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Copy Link" />
            </MenuItem>
            <MenuItem onClick={handleLinkedIn}>
              <ListItemIcon>
                <LinkedInIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Share on LinkedIn" />
            </MenuItem>
            <MenuItem onClick={handleTwitter}>
              <ListItemIcon>
                <TwitterIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Share on Twitter" />
            </MenuItem>
            <MenuItem onClick={handleEmail}>
              <ListItemIcon>
                <EmailIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Share via Email" />
            </MenuItem>
            <Divider />
            <MenuItem onClick={() => setShowQR(true)}>
              <ListItemIcon>
                <QrCode2Icon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Show QR Code" />
            </MenuItem>
          </Box>
        }
      </Menu>

      <Snackbar
        open={copied}
        autoHideDuration={2500}
        onClose={() => setCopied(false)}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center'
        }}>

        <Alert
          onClose={() => setCopied(false)}
          severity="success"
          sx={{
            width: '100%'
          }}>

          Link copied!
        </Alert>
      </Snackbar>
    </>);

}