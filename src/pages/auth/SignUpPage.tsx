import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, Link as RouterLink, useSearchParams } from 'react-router-dom';
import {
    Box,
    Typography,
    TextField,
    Button,
    Link,
    Stack,
    InputAdornment,
    Checkbox,
    FormControlLabel,
    Tooltip,
    Divider,
    Alert,
    Dialog,
    DialogTitle,
    IconButton,
    DialogContent,
    DialogActions,
} from '@mui/material';
import EmailRounded from '@mui/icons-material/EmailRounded';
import PersonRounded from '@mui/icons-material/PersonRounded';
import LinkRounded from '@mui/icons-material/LinkRounded';
import { useAuth } from '../../context/AuthContext';
import CloseRounded from '@mui/icons-material/CloseRounded';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000';
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '';

const TERMS_URL = '/legal/TermsConditions.html';
const PRIVACY_URL = '/legal/PrivacyPolicy.html';

declare global {
    interface Window {
        google?: any;
    }
}

type RequestCodeResponse = {
    ok?: boolean;
    code?: string;
    message?: string;
    next?: 'verify' | 'login' | 'signup';
};

type GoogleSignInResponse = {
    ok?: boolean;
    code?: string;
    message?: string;
    next?: 'dashboard' | 'login' | 'signup' | 'complete_signup';
    companyId?: string;
    companySlug?: string;
    redirectTo?: string;
};

type InvitePreviewResponse = {
    ok?: boolean;
    company?: {
        id?: string;
        slug?: string;
        displayName?: string;
    };
    invite?: {
        token?: string;
    };
    message?: string;
};

export function SignUpPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { refreshSession } = useAuth();

    const googleButtonRef = useRef<HTMLDivElement | null>(null);

    const initialEmail = useMemo(() => searchParams.get('email') ?? '', [searchParams]);
    const companyInviteToken = useMemo(
        () => (searchParams.get('companyInvite') ?? '').trim(),
        [searchParams]
    );

    const [formData, setFormData] = useState({
        email: initialEmail,
        name: '',
        agreed: false,
    });

    const [showValidation, setShowValidation] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [formError, setFormError] = useState('');
    const [inviteLoading, setInviteLoading] = useState(false);
    const [inviteError, setInviteError] = useState('');
    const [inviteCompany, setInviteCompany] = useState<InvitePreviewResponse['company'] | null>(null);

    const [legalModal, setLegalModal] = useState<{
        open: boolean;
        title: string;
        url: string;
    }>({
        open: false,
        title: '',
        url: '',
    });

    const openLegalModal = (title: string, url: string) => {
        setLegalModal({
            open: true,
            title,
            url,
        });
    };

    const closeLegalModal = () => {
        setLegalModal({
            open: false,
            title: '',
            url: '',
        });
    };

    const getValidationErrors = () => {
        const errors: string[] = [];

        if (!formData.name.trim()) errors.push('Full name is required');
        if (!formData.email.trim()) {
            errors.push('Email is required');
        } else if (!formData.email.includes('@')) {
            errors.push('Please enter a valid email');
        }

        if (!formData.agreed) errors.push('Please agree to the terms');

        return errors;
    };

    const isValid =
        formData.name.trim() !== '' &&
        formData.email.trim() !== '' &&
        formData.email.includes('@') &&
        formData.agreed;

    const getValidationMessage = () => {
        const errors = getValidationErrors();
        return errors.length > 0 ? errors[0] : '';
    };

    const persistInviteContext = (company?: { id?: string; slug?: string; displayName?: string } | null) => {
        if (!companyInviteToken) return;

        sessionStorage.setItem('tce_company_invite_token', companyInviteToken);

        if (company?.id) sessionStorage.setItem('tce_company_invite_company_id', company.id);
        if (company?.slug) sessionStorage.setItem('tce_company_invite_company_slug', company.slug);
        if (company?.displayName) {
            sessionStorage.setItem('tce_company_invite_company_name', company.displayName);
        }
    };

    const clearInviteContext = () => {
        sessionStorage.removeItem('tce_company_invite_token');
        sessionStorage.removeItem('tce_company_invite_company_id');
        sessionStorage.removeItem('tce_company_invite_company_slug');
        sessionStorage.removeItem('tce_company_invite_company_name');
    };

    const getInviteRedirectPath = (data?: {
        redirectTo?: string;
        companyId?: string;
        companySlug?: string;
    }) => {
        if (data?.redirectTo) return data.redirectTo;
        if (data?.companySlug) return `/companies/${encodeURIComponent(data.companySlug)}`;
        if (data?.companyId) return `/companies/${encodeURIComponent(data.companyId)}`;
        if (inviteCompany?.slug) return `/companies/${encodeURIComponent(inviteCompany.slug)}`;
        if (inviteCompany?.id) return `/companies/${encodeURIComponent(inviteCompany.id)}`;
        return null;
    };

    useEffect(() => {
        if (!companyInviteToken) {
            clearInviteContext();
            setInviteCompany(null);
            setInviteError('');
            return;
        }

        let cancelled = false;

        const loadInvitePreview = async () => {
            try {
                setInviteLoading(true);
                setInviteError('');

                const resp = await fetch(
                    `${API_BASE_URL}/auth/company-invite-links/preview?token=${encodeURIComponent(companyInviteToken)}`,
                    {
                        method: 'GET',
                        credentials: 'include',
                        headers: { Accept: 'application/json' },
                    }
                );

                const data = (await resp.json().catch(() => ({}))) as InvitePreviewResponse;

                if (!resp.ok) {
                    throw new Error(data.message || 'This invite link is invalid.');
                }

                if (cancelled) return;

                setInviteCompany(data.company ?? null);
                persistInviteContext(data.company ?? null);
            } catch (err) {
                if (cancelled) return;
                setInviteCompany(null);
                setInviteError(err instanceof Error ? err.message : 'This invite link is invalid.');
            } finally {
                if (!cancelled) setInviteLoading(false);
            }
        };

        void loadInvitePreview();

        return () => {
            cancelled = true;
        };
    }, [companyInviteToken]);

    useEffect(() => {
        if (!window.google || !googleButtonRef.current || !GOOGLE_CLIENT_ID) return;

        const handleGoogleCredential = async (response: { credential?: string }) => {
            try {
                if (!formData.agreed) {
                    setShowValidation(true);
                    setFormError('Please agree to the Terms & Conditions before continuing with Google.');
                    return;
                }

                if (!response.credential) {
                    throw new Error('Missing Google credential');
                }

                setIsLoading(true);
                setFormError('');

                const resp = await fetch(`${API_BASE_URL}/auth/google/sign-in`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    credentials: 'include',
                    body: JSON.stringify({
                        credential: response.credential,
                        intent: 'signup',
                        agreedToTerms: formData.agreed,
                        companyInviteToken: companyInviteToken || undefined,
                    }),
                });

                const data = (await resp.json().catch(() => ({}))) as GoogleSignInResponse;

                if (resp.ok) {
                    await refreshSession();

                    let googleEmail = formData.email.trim().toLowerCase();

                    if (!googleEmail && response.credential) {
                        try {
                            const payloadBase64 = response.credential.split('.')[1];
                            if (payloadBase64) {
                                const normalized = payloadBase64.replace(/-/g, '+').replace(/_/g, '/');
                                const json = JSON.parse(window.atob(normalized));
                                if (typeof json?.email === 'string') {
                                    googleEmail = json.email.trim().toLowerCase();
                                }
                            }
                        } catch {
                            // ignore decode failure
                        }
                    }

                    if (googleEmail) {
                        sessionStorage.setItem('tce_onboarding_email', googleEmail);
                    } else {
                        sessionStorage.removeItem('tce_onboarding_email');
                    }

                    if (companyInviteToken) {
                        persistInviteContext(inviteCompany ?? null);
                        const inviteRedirectPath = getInviteRedirectPath(data);
                        navigate(inviteRedirectPath ?? '/companies', { replace: true });
                        return;
                    }

                    sessionStorage.setItem('tce_onboarding_fresh', '1');
                    localStorage.removeItem('tce_onboarding_v1');

                    navigate('/onboarding?fresh=1', { replace: true });
                    return;
                }

                if (data.code === 'ACCOUNT_EXISTS' || data.next === 'login') {
                    const loginParams = new URLSearchParams({
                        email: formData.email.trim(),
                    });

                    if (companyInviteToken) {
                        loginParams.set('companyInvite', companyInviteToken);
                    }

                    navigate(`/login?${loginParams.toString()}`);
                    return;
                }

                if (data.next === 'complete_signup') {
                    setFormError(data.message || 'Please complete signup to continue.');
                    return;
                }

                setFormError(data.message || 'Google sign up failed.');
            } catch (err) {
                console.error(err);
                setFormError('Google sign up failed.');
            } finally {
                setIsLoading(false);
            }
        };

        window.google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: handleGoogleCredential,
        });

        googleButtonRef.current.innerHTML = '';

        window.google.accounts.id.renderButton(googleButtonRef.current, {
            theme: 'outline',
            size: 'large',
            shape: 'rectangular',
            width: 380,
            text: 'continue_with',
        });
    }, [companyInviteToken, formData.email, inviteCompany, navigate, refreshSession]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!isValid) {
            setShowValidation(true);
            return;
        }

        try {
            setIsLoading(true);
            setFormError('');

            const resp = await fetch(`${API_BASE_URL}/auth/email/request-code`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    email: formData.email.trim(),
                    name: formData.name.trim(),
                    intent: 'signup',
                    companyInviteToken: companyInviteToken || undefined,
                }),
            });

            const data = (await resp.json().catch(() => ({}))) as RequestCodeResponse;

            if (resp.ok) {
                const params = new URLSearchParams({
                    email: formData.email.trim(),
                    name: formData.name.trim(),
                    intent: 'signup',
                });

                if (companyInviteToken) {
                    params.set('companyInvite', companyInviteToken);
                    persistInviteContext(inviteCompany ?? null);
                }

                const normalizedEmail = formData.email.trim().toLowerCase();

                sessionStorage.setItem('tce_onboarding_email', normalizedEmail);
                sessionStorage.removeItem('tce_onboarding_fresh');
                localStorage.removeItem('tce_onboarding_v1');

                navigate(`/verify?${params.toString()}`);
                return;
            }

            if (data.code === 'ACCOUNT_EXISTS' || data.next === 'login') {
                const loginParams = new URLSearchParams({
                    email: formData.email.trim(),
                });

                if (companyInviteToken) {
                    loginParams.set('companyInvite', companyInviteToken);
                }

                navigate(`/login?${loginParams.toString()}`);
                return;
            }

            setFormError(data.message || 'Failed to start sign up.');
        } catch (err) {
            console.error(err);
            setFormError('Failed to start sign up.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Box display="flex" minHeight="100vh">
            <Box
                flex={{ xs: '1 1 100%', md: '0 0 60%' }}
                display="flex"
                flexDirection="column"
                bgcolor="white"
            >
                <Box
                    flex={1}
                    display="flex"
                    flexDirection="column"
                    justifyContent="center"
                    px={{ xs: 4, md: 8, lg: 12 }}
                    pb={{ xs: 4, md: 8 }}
                >
                    <Box maxWidth={480} width="100%" mx="auto">
                        <Box mb={8}>
                            <Box
                                component="img"
                                src="/tce-logo.svg"
                                alt="The Carbon Economy"
                                sx={{ height: 44, width: 'auto' }}
                            />
                        </Box>

                        <Typography variant="h4" fontWeight="bold" gutterBottom>
                            Create your account
                        </Typography>
                        <Typography variant="body1" color="text.secondary" mb={4}>
                            {companyInviteToken
                                ? 'Create your account to join this company as a viewer.'
                                : 'Sign up to access your dashboard and projects.'}
                        </Typography>

                        {companyInviteToken && (
                            <Alert
                                severity={inviteError ? 'error' : 'info'}
                                icon={<LinkRounded />}
                                sx={{ mb: 3 }}
                            >
                                {inviteLoading
                                    ? 'Checking company invite…'
                                    : inviteError
                                        ? inviteError
                                        : `You were invited to join ${inviteCompany?.displayName ?? 'a company'}.`}
                            </Alert>
                        )}

                        {formError && (
                            <Alert severity="error" sx={{ mb: 3 }}>
                                {formError}
                            </Alert>
                        )}

                        <form onSubmit={handleSubmit}>
                            <Stack spacing={3}>
                                {!GOOGLE_CLIENT_ID && (
                                    <Typography color="error" variant="body2">
                                        Missing Google Client
                                    </Typography>
                                )}

                                <Box sx={{ position: 'relative' }}>
                                    <div
                                        ref={googleButtonRef}
                                        style={{
                                            opacity: formData.agreed ? 1 : 0.55,
                                            filter: formData.agreed ? 'none' : 'grayscale(0.2)',
                                        }}
                                    />

                                    {!formData.agreed && (
                                        <Box
                                            onClick={() => {
                                                setShowValidation(true);
                                                setFormError('Please agree to the Terms & Conditions before continuing with Google.');
                                            }}
                                            sx={{
                                                position: 'absolute',
                                                inset: 0,
                                                cursor: 'not-allowed',
                                                backgroundColor: 'transparent',
                                                zIndex: 2,
                                            }}
                                        />
                                    )}
                                </Box>

                                <Divider>
                                    <Typography variant="caption" color="text.disabled" px={1}>
                                        or continue with email
                                    </Typography>
                                </Divider>

                                <TextField
                                    label="Full name"
                                    fullWidth
                                    value={formData.name}
                                    onChange={(e) => {
                                        setFormData((prev) => ({
                                            ...prev,
                                            name: e.target.value,
                                        }));
                                        setShowValidation(false);
                                        setFormError('');
                                    }}
                                    placeholder="e.g. Sarah Chen"
                                    autoComplete="name"
                                    error={showValidation && !formData.name.trim()}
                                    helperText={showValidation && !formData.name.trim() ? 'Full name is required' : ''}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <PersonRounded sx={{ fontSize: 20, color: 'grey.400' }} />
                                            </InputAdornment>
                                        ),
                                    }}
                                />

                                <TextField
                                    label="Work email address"
                                    type="email"
                                    fullWidth
                                    value={formData.email}
                                    onChange={(e) => {
                                        setFormData((prev) => ({
                                            ...prev,
                                            email: e.target.value,
                                        }));
                                        setShowValidation(false);
                                        setFormError('');
                                    }}
                                    autoComplete="email"
                                    error={
                                        showValidation &&
                                        (!formData.email.trim() || !formData.email.includes('@'))
                                    }
                                    helperText={
                                        showValidation && !formData.email.trim()
                                            ? 'Email is required'
                                            : showValidation && !formData.email.includes('@')
                                                ? 'Please enter a valid email'
                                                : ''
                                    }
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <EmailRounded sx={{ fontSize: 20, color: 'grey.400' }} />
                                            </InputAdornment>
                                        ),
                                    }}
                                />

                                <FormControlLabel
                                    sx={{ m: 0 }}
                                    control={
                                        <Checkbox
                                            checked={formData.agreed}
                                            onChange={(e) => {
                                                setFormData((prev) => ({
                                                    ...prev,
                                                    agreed: e.target.checked,
                                                }));
                                                setShowValidation(false);
                                                setFormError('');
                                            }}
                                        />
                                    }
                                    label={
                                        <Typography
                                            variant="body2"
                                            color="text.secondary"
                                            component="span"
                                        >
                                            I agree to the{' '}
                                            <Link
                                                component="button"
                                                type="button"
                                                onClick={() => openLegalModal('Terms & Conditions', TERMS_URL)}
                                                underline="hover"
                                                sx={{
                                                    fontSize: 'inherit',
                                                    fontWeight: 'inherit',
                                                    lineHeight: 'inherit',
                                                    verticalAlign: 'baseline',
                                                }}
                                            >
                                                Terms & Conditions
                                            </Link>{' '}
                                            and{' '}
                                            <Link
                                                component="button"
                                                type="button"
                                                onClick={() => openLegalModal('Privacy Policy', PRIVACY_URL)}
                                                underline="hover"
                                                sx={{
                                                    fontSize: 'inherit',
                                                    fontWeight: 'inherit',
                                                    lineHeight: 'inherit',
                                                    verticalAlign: 'baseline',
                                                }}
                                            >
                                                Privacy Policy
                                            </Link>
                                        </Typography>
                                    }
                                />

                                <Tooltip
                                    title={!isValid ? getValidationMessage() : ''}
                                    placement="top"
                                    arrow
                                    disableHoverListener={isValid}
                                    disableFocusListener={isValid}
                                >
                                    <span>
                                        <Button
                                            type="submit"
                                            fullWidth
                                            variant="contained"
                                            size="large"
                                            disabled={isLoading || !!inviteError}
                                            sx={{
                                                py: 1.5,
                                                fontWeight: 600,
                                                fontSize: '1rem',
                                            }}
                                        >
                                            {isLoading ? 'Sending code...' : 'Create account'}
                                        </Button>
                                    </span>
                                </Tooltip>
                            </Stack>
                        </form>

                        <Box mt={4} textAlign="center">
                            <Typography variant="body2" color="text.secondary">
                                Already have an account?{' '}
                                <Link
                                    component={RouterLink}
                                    to={
                                        companyInviteToken
                                            ? `/login?companyInvite=${encodeURIComponent(companyInviteToken)}`
                                            : '/login'
                                    }
                                    fontWeight="medium"
                                    color="primary.main"
                                    underline="hover"
                                >
                                    Sign in
                                </Link>
                            </Typography>
                        </Box>
                    </Box>
                </Box>
            </Box>

            <Box
                flex={{ xs: '0 0 0%', md: '0 0 40%' }}
                display={{ xs: 'none', md: 'flex' }}
                bgcolor="grey.900"
                position="relative"
                overflow="hidden"
                alignItems="center"
                justifyContent="center"
                p={6}
            >
                <Box
                    component="img"
                    src="https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1200"
                    alt="Forest canopy"
                    sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                    }}
                />

                <Box
                    position="absolute"
                    top={0}
                    left={0}
                    right={0}
                    bottom={0}
                    sx={{
                        background:
                            'linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.7) 100%)',
                    }}
                />

                <Box position="relative" zIndex={1} maxWidth={400}>
                    <Typography
                        variant="h5"
                        fontWeight="bold"
                        gutterBottom
                        color="white"
                        sx={{ textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}
                    >
                        "Accelerating the transition to a net-zero economy."
                    </Typography>
                    <Typography variant="body1" color="rgba(255,255,255,0.9)" mt={2}>
                        {companyInviteToken
                            ? 'Join your company workspace and start collaborating immediately.'
                            : 'Join the platform to manage projects, companies, and collaboration in one place.'}
                    </Typography>
                </Box>
            </Box>
            <Dialog
                open={legalModal.open}
                onClose={closeLegalModal}
                fullWidth
                maxWidth="md"
            >
                <DialogTitle
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        pr: 1,
                    }}
                >
                    {legalModal.title}
                    <IconButton onClick={closeLegalModal} aria-label="Close">
                        <CloseRounded />
                    </IconButton>
                </DialogTitle>

                <DialogContent dividers sx={{ p: 0, height: { xs: '70vh', md: '75vh' } }}>
                    <Box
                        component="iframe"
                        src={legalModal.url}
                        title={legalModal.title}
                        sx={{
                            width: '100%',
                            height: '100%',
                            border: 0,
                        }}
                    />
                </DialogContent>

                <DialogActions sx={{ px: 3, py: 2 }}>
                    <Button
                        component="a"
                        href={legalModal.url}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        Open in new tab
                    </Button>
                    <Button onClick={closeLegalModal} variant="contained">
                        Close
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}