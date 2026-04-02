import React from 'react';
import { Box, Typography, IconButton, Button, Slide } from '@mui/material';
import CloseRounded from '@mui/icons-material/CloseRounded';
interface SidebarPanelProps {
    open: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    onSave?: () => void;
    saveLabel?: string;
    cancelLabel?: string;
    showBackdrop?: boolean;
    width?: number | string;
    saveDisabled?: boolean;
}
export function SidebarPanel({
    open,
    onClose,
    title,
    children,
    onSave,
    saveLabel = 'Save',
    cancelLabel = 'Cancel',
    showBackdrop = true,
    width = 420,
    saveDisabled = false
}: SidebarPanelProps) {
    return (
        <>
            {/* Backdrop overlay */}
            {showBackdrop && open &&
                <Box
                    onClick={onClose}
                    sx={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        bgcolor: 'rgba(0,0,0,0.15)',
                        zIndex: 1199
                    }} />

            }

            <Slide direction="left" in={open} mountOnEnter unmountOnExit>
                <Box
                    sx={{
                        position: 'fixed',
                        top: 0,
                        right: 0,
                        bottom: 0,
                        width: {
                            xs: '100%',
                            sm: width
                        },
                        bgcolor: 'white',
                        zIndex: 1200,
                        display: 'flex',
                        flexDirection: 'column',
                        boxShadow: '-4px 0 20px rgba(0,0,0,0.1)',
                        borderLeft: 1,
                        borderColor: 'grey.200'
                    }}>

                    {/* Header */}
                    <Box
                        sx={{
                            p: 2,
                            borderBottom: 1,
                            borderColor: 'grey.200',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                        }}>

                        <Typography variant="subtitle1" fontWeight="bold">
                            {title}
                        </Typography>
                        <IconButton onClick={onClose} size="small">
                            <CloseRounded
                                sx={{
                                    fontSize: 20
                                }} />

                        </IconButton>
                    </Box>

                    {/* Content */}
                    <Box
                        sx={{
                            flex: 1,
                            overflowY: 'auto',
                            p: 3
                        }}>

                        {children}
                    </Box>

                    {/* Footer */}
                    <Box
                        sx={{
                            p: 2,
                            borderTop: 1,
                            borderColor: 'grey.200',
                            display: 'flex',
                            gap: 2
                        }}>

                        <Button
                            variant="outlined"
                            onClick={onClose}
                            sx={{
                                color: 'text.secondary',
                                borderColor: 'grey.300',
                                textTransform: 'none',
                                flexShrink: 0
                            }}>

                            {cancelLabel}
                        </Button>
                        {onSave && (
                            <Button
                                variant="contained"
                                fullWidth
                                onClick={onSave}
                                disabled={saveDisabled}
                                sx={{
                                    textTransform: 'none'
                                }}
                            >
                                {saveLabel}
                            </Button>
                        )}
                    </Box>
                </Box>
            </Slide>
        </>);

}