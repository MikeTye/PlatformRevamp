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
    Tooltip,
    Divider,
    Alert
} from '@mui/material';
import EmailRounded from '@mui/icons-material/EmailRounded';
import { useAuth } from '../../context/AuthContext';
import {
    clearAllAccessContext,
    clearShareContext,
    getInviteRedirectPath,
    getShareRedirectPath,
    persistShareContext,
} from '../../utils/authAccessContext';

import { trackEvent } from '../../lib/analytics';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000';
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '';

declare global {
    interface Window {
        google?: any;
    }
}

type LoginResponse = {
    ok?: boolean;
    code?: string;
    message?: string;
    next?: 'dashboard' | 'signup' | 'login' | 'verify';
    redirectTo?: string;
    companyId?: string;
    companySlug?: string;
    projectId?: string;
    projectSlug?: string;
};

type SharePreviewResponse = {
    ok?: boolean;
    share?: {
        token?: string;
        redirectTo?: string;
        entityType?: 'company' | 'project';
        entityId?: string;
        entitySlug?: string;
        title?: string;
    };
    message?: string;
};

export function LoginPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { refreshSession, isAuthenticated, isAuthLoading } = useAuth();

    const companyInviteToken = useMemo(
        () => (searchParams.get('companyInvite') ?? '').trim(),
        [searchParams]
    );

    const shareToken = useMemo(
        () => (searchParams.get('share') ?? '').trim(),
        [searchParams]
    );

    const initialEmail = useMemo(() => searchParams.get('email') ?? '', [searchParams]);

    const [email, setEmail] = useState(initialEmail);
    const [showValidation, setShowValidation] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [formError, setFormError] = useState('');
    const [googleError, setGoogleError] = useState('');

    const googleInitializedRef = useRef(false);
    const googleButtonRef = useRef<HTMLDivElement | null>(null);

    const latestEmailRef = useRef(email);
    const latestInviteTokenRef = useRef(companyInviteToken);
    const latestShareTokenRef = useRef(shareToken);

    const [shareLoading, setShareLoading] = useState(false);
    const [shareError, setShareError] = useState('');
    const [sharePreview, setSharePreview] = useState<SharePreviewResponse['share'] | null>(null);
    const [shareTitle, setShareTitle] = useState('');

    useEffect(() => {
        latestEmailRef.current = email;
    }, [email]);

    useEffect(() => {
        latestInviteTokenRef.current = companyInviteToken;
    }, [companyInviteToken]);

    useEffect(() => {
        latestShareTokenRef.current = shareToken;
    }, [shareToken]);

    useEffect(() => {
        setEmail(initialEmail);
    }, [initialEmail]);

    const isValid = email.trim() !== '' && email.includes('@');

    const getValidationMessage = () => {
        if (!email.trim()) return 'Please enter your email address';
        if (!email.includes('@')) return 'Please enter a valid email address';
        return '';
    };

    const hasTrackedLoginViewRef = useRef(false);

    const getLoginTrackingProps = () => ({
        page: 'login',
        has_company_invite_token: Boolean(companyInviteToken),
        has_share_token: Boolean(shareToken),
        share_entity_type: sharePreview?.entityType ?? null,
        share_entity_id: sharePreview?.entityId ?? null,
        share_title: shareTitle || sharePreview?.title || null,
    });

    useEffect(() => {
        if (hasTrackedLoginViewRef.current) return;

        trackEvent('login page viewed', getLoginTrackingProps());
        hasTrackedLoginViewRef.current = true;
    }, [companyInviteToken, shareToken, sharePreview, shareTitle]);

    const buildSignupUrl = () => {
        if (companyInviteToken || shareToken) {
            return `/signup?${new URLSearchParams({
                ...(companyInviteToken ? { companyInvite: companyInviteToken } : {}),
                ...(shareToken ? { share: shareToken } : {}),
            }).toString()}`;
        }

        return '/signup';
    };

    const handleRegisterNowClick = () => {
        trackEvent('register now clicked on login page', {
            page: 'login',
            has_company_invite_token: Boolean(companyInviteToken),
            has_share_token: Boolean(shareToken),
        });
    };

    useEffect(() => {
        if (!shareToken) {
            clearShareContext();
            setShareLoading(false);
            setShareError('');
            setShareTitle('');
            return;
        }

        let cancelled = false;

        const run = async () => {
            try {
                setShareLoading(true);
                setShareError('');

                const resp = await fetch(
                    `${API_BASE_URL}/auth/share-links/preview?token=${encodeURIComponent(shareToken)}`,
                    {
                        method: 'GET',
                        credentials: 'include',
                        headers: { Accept: 'application/json' },
                    }
                );

                const data = (await resp.json().catch(() => ({}))) as SharePreviewResponse;
                persistShareContext(shareToken, data.share ?? null);
                setSharePreview(data.share ?? null);

                if (!resp.ok) {
                    throw new Error(data.message || 'This shared link is invalid.');
                }

                if (!cancelled) {
                    persistShareContext(shareToken, data.share ?? null);
                    setShareTitle(data.share?.title ?? '');
                }
            } catch (err) {
                if (!cancelled) {
                    clearShareContext();
                    setShareTitle('');
                    setShareError(err instanceof Error ? err.message : 'This shared link is invalid.');
                }
            } finally {
                if (!cancelled) {
                    setShareLoading(false);
                }
            }
        };

        void run();

        return () => {
            cancelled = true;
        };
    }, [shareToken]);

    useEffect(() => {
        if (!shareToken) return;
        if (isAuthLoading) return;
        if (!isAuthenticated) return;
        if (shareLoading) return;
        if (shareError) return;

        const redirectPath = getShareRedirectPath(sharePreview ?? undefined);
        navigate(redirectPath, { replace: true });
    }, [
        shareToken,
        isAuthLoading,
        isAuthenticated,
        shareLoading,
        shareError,
        sharePreview,
        navigate,
    ]);

    const resolvePostLoginPath = async (
        options?: {
            inviteToken?: string;
            shareToken?: string;
            loginData?: LoginResponse;
        }
    ) => {
        const inviteToken = options?.inviteToken?.trim();
        const shareToken = options?.shareToken?.trim();
        const loginData = options?.loginData;

        if (inviteToken) {
            return getInviteRedirectPath(loginData);
        }

        if (shareToken) {
            return getShareRedirectPath(loginData);
        }

        const onboardingResp = await fetch(`${API_BASE_URL}/user-profiles/me/onboarding`, {
            method: 'GET',
            credentials: 'include',
        });

        let onboarding:
            | {
                onboardingStatus?: 'not_started' | 'in_progress' | 'completed' | 'skipped';
                onboardingStep?: number;
                onboardingSelectedRoles?: string[];
            }
            | undefined;

        if (onboardingResp.ok) {
            const onboardingJson = await onboardingResp.json().catch(() => ({}));
            onboarding = onboardingJson?.data;
        }

        const shouldResumeOnboarding =
            onboarding?.onboardingStatus === 'in_progress' ||
            (
                onboarding?.onboardingStatus !== 'completed' &&
                onboarding?.onboardingStatus !== 'skipped' &&
                (
                    (Array.isArray(onboarding?.onboardingSelectedRoles) &&
                        onboarding.onboardingSelectedRoles.length > 0) ||
                    (typeof onboarding?.onboardingStep === 'number' &&
                        onboarding.onboardingStep > 0)
                )
            );

        if (shouldResumeOnboarding) {
            return '/onboarding';
        }

        return '/dashboard';
    };

    useEffect(() => {
        if (!window.google || !googleButtonRef.current || !GOOGLE_CLIENT_ID) return;
        if (googleInitializedRef.current) return;

        googleInitializedRef.current = true;

        const handleGoogleCredential = async (response: { credential?: string }) => {
            try {
                setFormError('');
                setGoogleError('');

                if (!response.credential) {
                    throw new Error('Missing Google credential');
                }

                const currentInviteToken = latestInviteTokenRef.current;
                const currentShareToken = latestShareTokenRef.current;
                const currentEmail = latestEmailRef.current;

                setIsLoading(true);

                trackEvent('login with google selected', {
                    ...getLoginTrackingProps(),
                    login_method: 'google',
                    entered_email: Boolean(currentEmail.trim()),
                });

                const resp = await fetch(`${API_BASE_URL}/auth/google/sign-in`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    credentials: 'include',
                    body: JSON.stringify({
                        credential: response.credential,
                        intent: 'login',
                        companyInviteToken: currentInviteToken || undefined,
                        shareToken: currentShareToken || undefined,
                    }),
                });

                const data = (await resp.json().catch(() => ({}))) as LoginResponse;

                if (resp.ok) {
                    await refreshSession();

                    trackEvent('login successful', {
                        page: 'login',
                        login_method: 'google',
                        has_company_invite_token: Boolean(currentInviteToken),
                        has_share_token: Boolean(currentShareToken),
                    });

                    const redirectPath = await resolvePostLoginPath({
                        inviteToken: currentInviteToken,
                        shareToken: currentShareToken,
                        loginData: data,
                    });

                    if (redirectPath === '/onboarding' && currentEmail.trim()) {
                        sessionStorage.setItem('tce_onboarding_email', currentEmail.trim().toLowerCase());
                    }

                    let resolvedEmail = currentEmail.trim().toLowerCase();

                    if (!resolvedEmail && response.credential) {
                        try {
                            const payloadBase64 = response.credential.split('.')[1];
                            if (payloadBase64) {
                                const normalized = payloadBase64.replace(/-/g, '+').replace(/_/g, '/');
                                const json = JSON.parse(window.atob(normalized));
                                if (typeof json?.email === 'string') {
                                    resolvedEmail = json.email.trim().toLowerCase();
                                }
                            }
                        } catch {
                            // ignore decode failure
                        }
                    }

                    if (redirectPath === '/onboarding') {
                        if (resolvedEmail) {
                            sessionStorage.setItem('tce_onboarding_email', resolvedEmail);
                        } else {
                            sessionStorage.removeItem('tce_onboarding_email');
                        }
                    }

                    navigate(redirectPath, { replace: true });
                    return;
                }

                if (data.code === 'ACCOUNT_NOT_FOUND' || data.next === 'signup') {
                    const params = new URLSearchParams({
                        ...(currentEmail ? { email: currentEmail } : {}),
                        ...(currentInviteToken ? { companyInvite: currentInviteToken } : {}),
                        ...(currentShareToken ? { share: currentShareToken } : {}),
                    });

                    setGoogleError('No account exists for this Google email. Please sign up first.');
                    navigate(`/signup?${params.toString()}`, { replace: true });
                    return;
                }

                throw new Error(data.message || 'Google sign in failed');
            } catch (err) {
                console.error(err);
                setGoogleError(err instanceof Error ? err.message : 'Google sign in failed');
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
            shape: 'pill',
            width: Math.min(360, Math.max(220, googleButtonRef.current.offsetWidth)),
            text: 'continue_with',
            logo_alignment: 'left',
        });
    }, [navigate, refreshSession]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        setFormError('');
        setGoogleError('');

        if (!isValid) {
            setShowValidation(true);
            return;
        }

        try {
            setIsLoading(true);

            trackEvent('login with email selected', {
                ...getLoginTrackingProps(),
                login_method: 'email',
                entered_email: Boolean(email.trim()),
            });

            const resp = await fetch(`${API_BASE_URL}/auth/email/request-code`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    email,
                    intent: 'login',
                    companyInviteToken: companyInviteToken || undefined,
                    shareToken: shareToken || undefined,
                }),
            });

            const data = await resp.json().catch(() => ({}));

            if (resp.ok) {
                const params = new URLSearchParams({
                    email,
                    intent: 'login',
                });

                if (companyInviteToken) params.set('companyInvite', companyInviteToken);
                if (shareToken) params.set('share', shareToken);

                navigate(`/verify?${params.toString()}`);
                return;
            }

            if (
                data.code === 'ACCOUNT_NOT_FOUND' ||
                data.code === 'SIGNUP_REQUIRED' ||
                data.next === 'signup'
            ) {
                setFormError('No account exists for this email. Please sign up first.');
                return;
            }

            throw new Error(data.message || 'Failed to request code');
        } catch (err) {
            console.error(err);
            setFormError(err instanceof Error ? err.message : 'Failed to request code');
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
                            Welcome back
                        </Typography>
                        <Typography variant="body1" color="text.secondary" mb={4}>
                            {companyInviteToken || shareToken
                                ? 'Sign in to continue to your destination.'
                                : 'Sign in to access your dashboard and projects.'}
                        </Typography>

                        {shareToken && (
                            <Alert severity={shareError ? 'error' : 'info'} sx={{ mb: 3 }}>
                                {shareLoading
                                    ? 'Checking shared link…'
                                    : shareError
                                        ? shareError
                                        : `Sign in to continue to ${shareTitle || 'the shared page'}.`}
                            </Alert>
                        )}

                        <form onSubmit={handleSubmit}>
                            <Stack spacing={3}>
                                {formError && (
                                    <Alert severity="error">
                                        {formError}{' '}
                                        <Link
                                            component={RouterLink}
                                            to={`/signup?${new URLSearchParams({
                                                ...(email ? { email } : {}),
                                                ...(companyInviteToken ? { companyInvite: companyInviteToken } : {}),
                                                ...(shareToken ? { share: shareToken } : {}),
                                            }).toString()}`}
                                        >
                                            Go to sign up
                                        </Link>
                                    </Alert>
                                )}

                                {googleError && (
                                    <Alert severity="error">
                                        {googleError}{' '}
                                        <Link
                                            component={RouterLink}
                                            to={`/signup?${new URLSearchParams({
                                                ...(email ? { email } : {}),
                                                ...(companyInviteToken ? { companyInvite: companyInviteToken } : {}),
                                                ...(shareToken ? { share: shareToken } : {}),
                                            }).toString()}`}
                                            underline="hover"
                                        >
                                            Sign up
                                        </Link>
                                    </Alert>
                                )}

                                {!GOOGLE_CLIENT_ID && (
                                    <Typography color="error" variant="body2">
                                        Missing Google Client
                                    </Typography>
                                )}
                                <Box
                                    sx={{
                                        width: '100%',
                                        overflow: 'hidden',
                                        display: 'flex',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        minHeight: 44,
                                        '& > div': {
                                            width: '100%',
                                            display: 'flex',
                                            justifyContent: 'center',
                                        },
                                    }}
                                >
                                    <div ref={googleButtonRef} />
                                </Box>

                                <Divider>
                                    <Typography variant="caption" color="text.disabled" px={1}>
                                        or continue with email
                                    </Typography>
                                </Divider>

                                <TextField
                                    label="Work email address"
                                    type="email"
                                    fullWidth
                                    value={email}
                                    onChange={(e) => {
                                        setEmail(e.target.value);
                                        setShowValidation(false);
                                        setFormError('');
                                        setGoogleError('');
                                    }}
                                    placeholder="name@company.com"
                                    error={showValidation && !isValid}
                                    helperText={showValidation && !isValid ? getValidationMessage() : ''}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <EmailRounded sx={{ fontSize: 20, color: 'grey.400' }} />
                                            </InputAdornment>
                                        ),
                                    }}
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
                                            disabled={isLoading || !!shareError}
                                            sx={{
                                                py: 1.5,
                                                fontWeight: 600,
                                                fontSize: '1rem',
                                            }}
                                        >
                                            {isLoading ? 'Sending code...' : 'Continue'}
                                        </Button>
                                    </span>
                                </Tooltip>
                            </Stack>
                        </form>

                        <Box mt={4} textAlign="center">
                            <Typography variant="body2" color="text.secondary">
                                Don't have an account?{' '}
                                <Link
                                    component={RouterLink}
                                    to={buildSignupUrl()}
                                    onClick={handleRegisterNowClick}
                                    fontWeight="medium"
                                    color="primary.main"
                                    underline="hover"
                                >
                                    Register now
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
                    src="https://images.unsplash.com/photo-1511497584788-876760111969?w=1200"
                    alt="Aerial forest view"
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
                        "The most comprehensive platform for carbon project development."
                    </Typography>
                </Box>
            </Box>
        </Box>
    );
}