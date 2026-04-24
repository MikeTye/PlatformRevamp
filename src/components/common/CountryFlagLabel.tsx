import React from 'react';
import { Box, Typography } from '@mui/material';
import countryCodes from '../../data/countrycode.json';
import { FlagIcon } from './flags';

type CountryCodeEntry = {
    country: string;
    code: string;
    iso: string;
};

type CountryFlagLabelProps = {
    country?: string | null;
    code?: string | null;
    size?: 'sm' | 'md' | 'lg';
    textVariant?: 'caption' | 'body2' | 'body1';
    color?: string;
    gap?: number;
};

const COUNTRY_CODE_MAP = new Map(
    (countryCodes as CountryCodeEntry[]).map((item) => [
        item.country.trim().toLowerCase(),
        item.iso.trim().toUpperCase()
    ])
);

export function resolveCountryCode(
    country?: string | null,
    fallbackCode?: string | null
) {
    if (fallbackCode && fallbackCode.trim()) {
        return fallbackCode.trim().toUpperCase();
    }

    if (!country || !country.trim()) return '';

    return (
        COUNTRY_CODE_MAP.get(country.trim().toLowerCase()) ??
        country.trim().slice(0, 2).toUpperCase()
    );
}

export function CountryFlagLabel({
    country,
    code,
    size = 'md',
    textVariant = 'body2',
    color = 'text.secondary',
    gap = 0.75
}: CountryFlagLabelProps) {
    const resolvedCode = resolveCountryCode(country, code);

    if (!country?.trim() && !resolvedCode) return null;

    return (
        <Box display="flex" alignItems="center" gap={gap}>
            <FlagIcon code={resolvedCode} country={country} size={size} />
            {!!country?.trim() && (
                <Typography variant={textVariant} color={color}>
                    {country}
                </Typography>
            )}
        </Box>
    );
}