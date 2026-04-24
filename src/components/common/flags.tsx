import React, { useState } from 'react';
import { Box, Typography } from '@mui/material';

type FlagIconProps = {
    code?: string | null;     // e.g. "MY"
    country?: string | null;  // optional alt text
    size?: 'sm' | 'md' | 'lg';
};

const SIZE_MAP = {
    sm: { width: 16, height: 12 },
    md: { width: 18, height: 12 },
    lg: { width: 20, height: 14 }
};

export function FlagIcon({ code, country, size = 'sm' }: FlagIconProps) {
    const [error, setError] = useState(false);

    if (!code) return null;

    const { width, height } = SIZE_MAP[size];

    const src = `/icons/flags/${code.toLowerCase()}.png`;

    if (error) {
        return (
            <Typography
                fontSize={width * 0.9}
                lineHeight={1}
                sx={{ display: 'block' }}
            >
                🏳️
            </Typography>
        );
    }

    return (
        <Box
            component="img"
            src={src}
            alt={country || code}
            sx={{
                width,
                height,
                objectFit: 'cover',
                borderRadius: '2px',
                border: '1px solid',
                borderColor: 'grey.200',
                display: 'block',
                flexShrink: 0
            }}
            onError={() => setError(true)}
        />
    );
}