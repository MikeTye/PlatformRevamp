import React, { useState } from 'react';
import { Box, Button, Paper, Typography } from '@mui/material';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { CompanyProfileView } from './CompanyProfileView';
import {
    CompanyProfile,
    CompanyPrivacyMap,
    CompanySectionKey,
} from './companyProfile.types';
import { getCompanyDetail } from './companyProfile.api';
import { canViewCompanySection } from './companyProfile.access';
import { trackEvent } from '../../lib/analytics';

export function CompanyDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [shareAnchorEl, setShareAnchorEl] = useState<null | HTMLElement>(null);
    const [company, setCompany] = React.useState<CompanyProfile | null>(null);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);

    React.useEffect(() => {
        let cancelled = false;

        async function run() {
            if (!id) {
                setCompany(null);
                setLoading(false);
                return;
            }

            setLoading(true);
            setError(null);

            try {
                const result = await getCompanyDetail(id);
                if (!cancelled) setCompany(result);
            } catch (err) {
                if (!cancelled) {
                    setCompany(null);
                    setError(
                        err instanceof Error ? err.message : 'Failed to load company'
                    );
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        void run();
        return () => {
            cancelled = true;
        };
    }, [id]);

    const isMyCompany = company?.isMyCompany ?? false;
    const fromParam = searchParams.get('from');

    const hasTrackedPageViewRef = React.useRef(false);

    React.useEffect(() => {
        if (!company?.id || hasTrackedPageViewRef.current) return;

        trackEvent('Company page viewed', {
            company_id: company.id,
            company_name: company.displayName,
            is_own_company: Boolean(company.isMyCompany),
            entry_point: fromParam ?? 'direct',
        });

        hasTrackedPageViewRef.current = true;
    }, [company, fromParam]);

    const handleBackNavigation = () => {
        if (fromParam === 'profile') {
            navigate('/account?tab=companies');
        } else if (isMyCompany) {
            navigate('/companies?tab=my');
        } else {
            navigate('/companies');
        }
    };

    const getBackLabel = () => {
        if (fromParam === 'profile') return 'My Profile';
        return isMyCompany ? 'My Companies' : 'Companies';
    };

    const canViewPrivateSection = (section: CompanySectionKey) =>
        canViewCompanySection(company, section as keyof CompanyPrivacyMap);

    if (loading) {
        return (
            <Box minHeight="100vh" bgcolor="grey.50" p={3}>
                <Paper variant="outlined" sx={{ p: 6, textAlign: 'center', borderRadius: 2 }}>
                    <Typography color="text.secondary">Loading company...</Typography>
                </Paper>
            </Box>
        );
    }

    if (error) {
        return (
            <Box minHeight="100vh" bgcolor="grey.50" p={3}>
                <Paper variant="outlined" sx={{ p: 6, textAlign: 'center', borderRadius: 2 }}>
                    <Typography color="error" mb={2}>
                        {error}
                    </Typography>
                    <Button
                        variant="text"
                        onClick={() => navigate('/companies')}
                        sx={{ textTransform: 'none', textDecoration: 'underline' }}
                    >
                        Back to Companies
                    </Button>
                </Paper>
            </Box>
        );
    }

    if (!company) {
        return (
            <Box minHeight="100vh" bgcolor="grey.50" p={3}>
                <Paper variant="outlined" sx={{ p: 6, textAlign: 'center', borderRadius: 2 }}>
                    <Typography color="text.secondary" mb={2}>
                        Company not found
                    </Typography>
                    <Button
                        variant="text"
                        onClick={() => navigate('/companies')}
                        sx={{ textTransform: 'none', textDecoration: 'underline' }}
                    >
                        Back to Companies
                    </Button>
                </Paper>
            </Box>
        );
    }

    return (
        <CompanyProfileView
            company={company}
            mode="view"
            backLabel={getBackLabel()}
            onBack={handleBackNavigation}
            canEdit={false}
            canContact
            canShare
            shareAnchorEl={shareAnchorEl}
            onOpenShare={setShareAnchorEl}
            onCloseShare={() => setShareAnchorEl(null)}
            canViewPrivateSection={canViewPrivateSection}
            trackingContext={{
                entryPoint: fromParam ?? 'direct',
                isOwnCompany: Boolean(company.isMyCompany),
            }}
        />
    );
}