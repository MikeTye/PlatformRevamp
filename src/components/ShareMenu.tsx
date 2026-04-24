import React, { useEffect, useMemo, useState } from 'react';
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
import CircularProgress from '@mui/material/CircularProgress';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import TwitterIcon from '@mui/icons-material/Twitter';
import EmailIcon from '@mui/icons-material/Email';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DownloadIcon from '@mui/icons-material/Download';
import { QRCodeSVG, QRCodeCanvas } from 'qrcode.react';

import { trackEvent } from '../lib/analytics';

interface ShareMenuProps {
    anchorEl: HTMLElement | null;
    open: boolean;
    onClose: () => void;
    shareUrl?: string;
    shareTitle?: string;
    resolveShareUrl?: () => Promise<string>;
    trackingEventName?: string;
    trackingPayload?: Record<string, unknown>;
}

export function ShareMenu({
    anchorEl,
    open,
    onClose,
    shareUrl,
    shareTitle,
    resolveShareUrl,
    trackingEventName,
    trackingPayload,
}: ShareMenuProps) {
    const [copied, setCopied] = useState(false);
    const [showQR, setShowQR] = useState(false);
    const [resolvedShareUrl, setResolvedShareUrl] = useState(shareUrl ?? '');
    const [loadingShareUrl, setLoadingShareUrl] = useState(false);
    const [shareError, setShareError] = useState<string | null>(null);

    useEffect(() => {
        setResolvedShareUrl(shareUrl ?? '');
    }, [shareUrl]);

    useEffect(() => {
        let active = true;

        async function ensureShareUrl() {
            if (!open) return;
            if (shareUrl?.trim()) return;
            if (!resolveShareUrl) return;

            try {
                setLoadingShareUrl(true);
                setShareError(null);
                const nextUrl = await resolveShareUrl();
                if (active) {
                    setResolvedShareUrl(nextUrl);
                }
            } catch (err) {
                if (active) {
                    setShareError(err instanceof Error ? err.message : 'Failed to prepare share link');
                }
            } finally {
                if (active) {
                    setLoadingShareUrl(false);
                }
            }
        }

        void ensureShareUrl();

        return () => {
            active = false;
        };
    }, [open, shareUrl, resolveShareUrl]);

    const effectiveShareUrl = useMemo(
        () => (resolvedShareUrl?.trim() ? resolvedShareUrl : ''),
        [resolvedShareUrl]
    );

    const handleClose = () => {
        setShowQR(false);
        onClose();
    };

    const trackShareSelection = (shareToType: string) => {
        if (!trackingEventName) return;

        trackEvent(trackingEventName, {
            ...trackingPayload,
            share_to_type: shareToType,
        });
    };

    const requireShareUrl = async () => {
        if (effectiveShareUrl) return effectiveShareUrl;

        if (!resolveShareUrl) {
            throw new Error('Share link is not available');
        }

        const nextUrl = await resolveShareUrl();
        setResolvedShareUrl(nextUrl);
        return nextUrl;
    };

    const handleCopyLink = async () => {
        try {
            const url = await requireShareUrl();

            try {
                await navigator.clipboard.writeText(url);
            } catch {
                const el = document.createElement('textarea');
                el.value = url;
                document.body.appendChild(el);
                el.select();
                document.execCommand('copy');
                document.body.removeChild(el);
            }

            trackShareSelection('copy_link');
            setCopied(true);
            handleClose();
        } catch (err) {
            setShareError(err instanceof Error ? err.message : 'Failed to copy link');
        }
    };

    const handleLinkedIn = async () => {
        try {
            const urlToShare = await requireShareUrl();
            const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(urlToShare)}`;
            trackShareSelection('linkedin');
            window.open(url, '_blank', 'noopener,noreferrer');
            handleClose();
        } catch (err) {
            setShareError(err instanceof Error ? err.message : 'Failed to prepare LinkedIn share');
        }
    };

    const handleTwitter = async () => {
        try {
            const urlToShare = await requireShareUrl();
            const text = shareTitle ? `${shareTitle} ${urlToShare}` : urlToShare;
            const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
            trackShareSelection('twitter');
            window.open(url, '_blank', 'noopener,noreferrer');
            handleClose();
        } catch (err) {
            setShareError(err instanceof Error ? err.message : 'Failed to prepare Twitter share');
        }
    };

    const handleEmail = async () => {
        try {
            const urlToShare = await requireShareUrl();
            const subject = shareTitle ? encodeURIComponent(shareTitle) : 'Check this out';
            const body = encodeURIComponent(urlToShare);
            trackShareSelection('email');
            window.location.href = `mailto:?subject=${subject}&body=${body}`;
            handleClose();
        } catch (err) {
            setShareError(err instanceof Error ? err.message : 'Failed to prepare email share');
        }
    };

    const handleDownloadQR = async () => {
        try {
            await requireShareUrl();
            const canvas = document.getElementById('qr-download-canvas') as HTMLCanvasElement | null;
            if (!canvas) return;

            const url = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.href = url;
            link.download = 'qrcode.png';
            trackShareSelection('qr_code_download');
            link.click();
        } catch (err) {
            setShareError(err instanceof Error ? err.message : 'Failed to download QR code');
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
                    vertical: 'top',
                }}
                anchorOrigin={{
                    horizontal: 'right',
                    vertical: 'bottom',
                }}
                PaperProps={{
                    sx: {
                        minWidth: 220,
                    },
                }}
            >
                {loadingShareUrl ? (
                    <Box
                        sx={{
                            px: 2,
                            py: 2,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1.5,
                        }}
                    >
                        <CircularProgress size={18} />
                        <Typography variant="body2" color="text.secondary">
                            Preparing share link...
                        </Typography>
                    </Box>
                ) : showQR ? (
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
                                borderRadius: 1,
                            }}
                        >
                            <QRCodeSVG value={effectiveShareUrl} size={180} />

                            <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{
                                    maxWidth: 200,
                                    textAlign: 'center',
                                    wordBreak: 'break-all',
                                }}
                            >
                                {effectiveShareUrl}
                            </Typography>

                            <Button
                                variant="outlined"
                                size="small"
                                startIcon={<DownloadIcon />}
                                onClick={handleDownloadQR}
                            >
                                Download QR Code
                            </Button>

                            <Box sx={{ display: 'none' }}>
                                <QRCodeCanvas
                                    id="qr-download-canvas"
                                    value={effectiveShareUrl}
                                    size={512}
                                />
                            </Box>
                        </Box>
                    </Box>
                ) : (
                    <Box>
                        <MenuItem onClick={handleCopyLink} disabled={!effectiveShareUrl && !resolveShareUrl}>
                            <ListItemIcon>
                                <ContentCopyIcon fontSize="small" />
                            </ListItemIcon>
                            <ListItemText primary="Copy Link" />
                        </MenuItem>

                        <MenuItem onClick={handleLinkedIn} disabled={!effectiveShareUrl && !resolveShareUrl}>
                            <ListItemIcon>
                                <LinkedInIcon fontSize="small" />
                            </ListItemIcon>
                            <ListItemText primary="Share on LinkedIn" />
                        </MenuItem>

                        <MenuItem onClick={handleTwitter} disabled={!effectiveShareUrl && !resolveShareUrl}>
                            <ListItemIcon>
                                <TwitterIcon fontSize="small" />
                            </ListItemIcon>
                            <ListItemText primary="Share on Twitter" />
                        </MenuItem>

                        <MenuItem onClick={handleEmail} disabled={!effectiveShareUrl && !resolveShareUrl}>
                            <ListItemIcon>
                                <EmailIcon fontSize="small" />
                            </ListItemIcon>
                            <ListItemText primary="Share via Email" />
                        </MenuItem>

                        <Divider />

                        <MenuItem
                            onClick={() => {
                                trackShareSelection('qr_code');
                                setShowQR(true);
                            }}
                            disabled={!effectiveShareUrl && !resolveShareUrl}
                        >
                            <ListItemIcon>
                                <QrCode2Icon fontSize="small" />
                            </ListItemIcon>
                            <ListItemText primary="Show QR Code" />
                        </MenuItem>
                    </Box>
                )}
            </Menu>

            <Snackbar
                open={copied}
                autoHideDuration={2500}
                onClose={() => setCopied(false)}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'center',
                }}
            >
                <Alert
                    onClose={() => setCopied(false)}
                    severity="success"
                    sx={{ width: '100%' }}
                >
                    Link copied!
                </Alert>
            </Snackbar>

            <Snackbar
                open={Boolean(shareError)}
                autoHideDuration={3000}
                onClose={() => setShareError(null)}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'center',
                }}
            >
                <Alert
                    onClose={() => setShareError(null)}
                    severity="error"
                    sx={{ width: '100%' }}
                >
                    {shareError}
                </Alert>
            </Snackbar>
        </>
    );
}