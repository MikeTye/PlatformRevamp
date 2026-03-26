import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
    Box,
    Typography,
    Button,
    Link,
    Stack,
    CircularProgress,
    Alert,
} from '@mui/material';
import ArrowBackRounded from '@mui/icons-material/ArrowBackRounded';
import { useAuth } from '../../context/AuthContext';

type AuthIntent = 'login' | 'signup';

type ApiErrorResponse = {
    ok?: boolean;
    code?: string;
    error?: string;
    message?: string;
    next?: 'login' | 'signup' | 'verify' | 'dashboard';
    redirectTo?: string;
    companyId?: string;
    companySlug?: string;
};

export function VerifyCodePage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { refreshSession } = useAuth();

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000';

    const email = useMemo(() => searchParams.get('email')?.trim() ?? '', [searchParams]);
    const name = useMemo(() => searchParams.get('name')?.trim() ?? '', [searchParams]);
    const companyInviteToken = useMemo(
        () => (searchParams.get('companyInvite') ?? sessionStorage.getItem('tce_company_invite_token') ?? '').trim(),
        [searchParams]
    );

    const intent: AuthIntent = useMemo(() => {
        const raw = searchParams.get('intent');
        return raw === 'signup' ? 'signup' : 'login';
    }, [searchParams]);

    const [code, setCode] = useState(['', '', '', '', '', '']);
    const [isVerifying, setIsVerifying] = useState(false);
    const [isResending, setIsResending] = useState(false);
    const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
    const [error, setError] = useState('');
    const [infoMessage, setInfoMessage] = useState('');

    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
    const lastAutoVerifiedCodeRef = useRef<string | null>(null);

    const isComplete = code.every((digit) => digit !== '');
    const joinedCode = code.join('');

    useEffect(() => {
        if (!email) {
            navigate('/login', { replace: true });
            return;
        }

        inputRefs.current[0]?.focus();
    }, [email, navigate]);

    useEffect(() => {
        if (!isComplete) return;
        if (isVerifying) return;
        if (lastAutoVerifiedCodeRef.current === joinedCode) return;

        lastAutoVerifiedCodeRef.current = joinedCode;
        void handleVerify(joinedCode);
    }, [isComplete, isVerifying, joinedCode]);

    const resetMessages = () => {
        setError('');
        setInfoMessage('');
    };

    const resetCode = () => {
        setCode(['', '', '', '', '', '']);
        lastAutoVerifiedCodeRef.current = null;
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

        const storedSlug = sessionStorage.getItem('tce_company_invite_company_slug')?.trim();
        const storedId = sessionStorage.getItem('tce_company_invite_company_id')?.trim();

        if (data?.companySlug) return `/companies/${encodeURIComponent(data.companySlug)}`;
        if (data?.companyId) return `/companies/${encodeURIComponent(data.companyId)}`;
        if (storedSlug) return `/companies/${encodeURIComponent(storedSlug)}`;
        if (storedId) return `/companies/${encodeURIComponent(storedId)}`;

        return '/companies';
    };

    const extractErrorMessage = async (resp: Response, fallback: string) => {
        try {
            const data = (await resp.json()) as ApiErrorResponse;
            return data?.error || data?.message || fallback;
        } catch {
            const text = await resp.text().catch(() => '');
            return text || fallback;
        }
    };

    const handleChange = (index: number, value: string) => {
        const numericValue = value.replace(/\D/g, '').slice(0, 1);
        if (value && !numericValue) return;

        resetMessages();

        const next = [...code];
        next[index] = numericValue;
        setCode(next);

        lastAutoVerifiedCodeRef.current = null;

        if (numericValue && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace') {
            if (code[index]) {
                const next = [...code];
                next[index] = '';
                setCode(next);
                lastAutoVerifiedCodeRef.current = null;
                return;
            }

            if (index > 0) {
                inputRefs.current[index - 1]?.focus();
            }
            return;
        }

        if (e.key === 'ArrowLeft' && index > 0) {
            inputRefs.current[index - 1]?.focus();
            return;
        }

        if (e.key === 'ArrowRight' && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault();

        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        if (!pasted) return;

        resetMessages();

        const next = ['', '', '', '', '', ''];
        pasted.split('').forEach((char, i) => {
            next[i] = char;
        });

        setCode(next);
        lastAutoVerifiedCodeRef.current = null;

        const nextFocusIndex = pasted.length >= 6 ? 5 : pasted.length;
        inputRefs.current[nextFocusIndex]?.focus();
    };

    const handleVerify = async (codeToVerify = joinedCode) => {
        if (!email || codeToVerify.length !== 6 || isVerifying) return;

        try {
            setIsVerifying(true);
            resetMessages();

            const resp = await fetch(`${API_BASE_URL}/auth/email/verify-code`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    email,
                    code: codeToVerify,
                    intent,
                    ...(intent === 'signup' && name ? { name } : {}),
                    ...(companyInviteToken ? { companyInviteToken } : {}),
                }),
            });

            let verifyData: ApiErrorResponse = {};
            try {
                verifyData = (await resp.json()) as ApiErrorResponse;
            } catch {
                verifyData = {};
            }

            if (!resp.ok) {
                throw new Error(verifyData?.error || verifyData?.message || 'Failed to verify code');
            }

            await refreshSession();

            if (intent === 'signup') {
                sessionStorage.setItem('tce_onboarding_email', email.toLowerCase());

                if (companyInviteToken) {
                    const inviteRedirectPath = getInviteRedirectPath({
                        redirectTo: verifyData.redirectTo,
                        companyId: verifyData.companyId,
                        companySlug: verifyData.companySlug,
                    });
                    clearInviteContext();
                    navigate(inviteRedirectPath, { replace: true });
                    return;
                }

                sessionStorage.setItem('tce_onboarding_fresh', '1');
                navigate('/onboarding?fresh=1', { replace: true });
                return;
            }

            const onboardingResp = await fetch(`${API_BASE_URL}/user-profiles/me/onboarding`, {
                method: 'GET',
                credentials: 'include',
            });

            let onboarding: {
                onboardingStatus?: 'not_started' | 'in_progress' | 'completed' | 'skipped';
                onboardingStep?: number;
                onboardingSelectedRoles?: string[];
            } | undefined;

            if (onboardingResp.ok) {
                const onboardingJson = await onboardingResp.json();
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
                sessionStorage.setItem('tce_onboarding_email', email.toLowerCase());
                navigate('/onboarding', { replace: true });
                return;
            }

            if (companyInviteToken) {
                const inviteRedirectPath = getInviteRedirectPath({
                    redirectTo: verifyData.redirectTo,
                    companyId: verifyData.companyId,
                    companySlug: verifyData.companySlug,
                });
                clearInviteContext();
                navigate(inviteRedirectPath, { replace: true });
                return;
            }

            navigate('/dashboard', {
                replace: true,
            });
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to verify code');
        } finally {
            setIsVerifying(false);
        }
    };

    const handleResend = async () => {
        if (!email || isResending || isVerifying) return;

        try {
            setIsResending(true);
            resetMessages();

            const resp = await fetch(`${API_BASE_URL}/auth/email/request-code`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    email,
                    intent,
                    ...(intent === 'signup' && name ? { name } : {}),
                    ...(companyInviteToken ? { companyInviteToken } : {}),
                }),
            });

            if (!resp.ok) {
                let data: ApiErrorResponse | null = null;
                try {
                    data = (await resp.json()) as ApiErrorResponse;
                } catch {
                    data = null;
                }

                if (data?.code === 'ACCOUNT_NOT_FOUND' || data?.next === 'signup') {
                    const params = new URLSearchParams({ email });
                    if (companyInviteToken) params.set('companyInvite', companyInviteToken);
                    navigate(`/signup?${params.toString()}`, { replace: true });
                    return;
                }

                if (data?.code === 'ACCOUNT_EXISTS' || data?.next === 'login') {
                    const params = new URLSearchParams({ email });
                    if (companyInviteToken) params.set('companyInvite', companyInviteToken);
                    navigate(`/login?${params.toString()}`, { replace: true });
                    return;
                }

                throw new Error(data?.error || data?.message || 'Failed to resend code');
            }

            resetCode();
            setInfoMessage('A new verification code has been sent.');
            inputRefs.current[0]?.focus();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to resend code');
        } finally {
            setIsResending(false);
        }
    };

    const handleUseDifferentEmail = () => {
        const params = new URLSearchParams();
        if (companyInviteToken) params.set('companyInvite', companyInviteToken);

        if (intent === 'signup') {
            navigate(params.toString() ? `/signup?${params.toString()}` : '/signup');
            return;
        }

        navigate(params.toString() ? `/login?${params.toString()}` : '/login');
    };

    return (
        <Box
            display="flex"
            minHeight="100vh"
            alignItems="center"
            justifyContent="center"
            bgcolor="white"
            p={3}
        >
            <Box maxWidth={400} width="100%" textAlign="center">
                <Box mb={4}>
                    <Typography variant="h4" fontWeight="bold" gutterBottom>
                        Check your email
                    </Typography>

                    <Typography variant="body1" color="text.secondary">
                        We sent a verification code to
                    </Typography>

                    <Typography variant="body1" fontWeight="medium" color="text.primary">
                        {email}
                    </Typography>
                </Box>

                <Stack direction="row" spacing={1} justifyContent="center" mb={4}>
                    {code.map((digit, index) => (
                        <input
                            key={index}
                            ref={(el) => {
                                inputRefs.current[index] = el;
                            }}
                            type="text"
                            inputMode="numeric"
                            maxLength={1}
                            value={digit}
                            autoComplete={index === 0 ? 'one-time-code' : 'off'}
                            onChange={(e) => handleChange(index, e.target.value)}
                            onKeyDown={(e) => handleKeyDown(index, e)}
                            onPaste={handlePaste}
                            onFocus={() => setFocusedIndex(index)}
                            onBlur={() => setFocusedIndex(null)}
                            disabled={isVerifying}
                            style={{
                                width: 48,
                                height: 56,
                                fontSize: 24,
                                fontWeight: 600,
                                textAlign: 'center',
                                borderRadius: 8,
                                border:
                                    focusedIndex === index
                                        ? '2px solid #008993'
                                        : digit
                                            ? '2px solid #e5e7eb'
                                            : '1px solid #e5e7eb',
                                outline: 'none',
                                backgroundColor: digit ? '#ffffff' : '#f9fafb',
                                transition: 'all 0.15s',
                                color: '#111827',
                            }}
                        />
                    ))}
                </Stack>

                {isVerifying && (
                    <Box
                        mb={3}
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        gap={1}
                    >
                        <CircularProgress size={20} />
                        <Typography variant="body2" color="text.secondary">
                            Verifying...
                        </Typography>
                    </Box>
                )}

                {!!error && (
                    <Alert severity="error" sx={{ mb: 2, textAlign: 'left' }}>
                        {error}
                    </Alert>
                )}

                {!!infoMessage && (
                    <Alert severity="success" sx={{ mb: 2, textAlign: 'left' }}>
                        {infoMessage}
                    </Alert>
                )}

                <Typography variant="body2" color="text.secondary" mb={4}>
                    Didn&apos;t receive the email?{' '}
                    <Link
                        component="button"
                        onClick={handleResend}
                        fontWeight="medium"
                        color="primary.main"
                        underline="hover"
                        disabled={isResending || isVerifying}
                    >
                        {isResending ? 'Resending...' : 'Click to resend'}
                    </Link>
                </Typography>

                <Button
                    startIcon={<ArrowBackRounded sx={{ fontSize: 16 }} />}
                    onClick={handleUseDifferentEmail}
                    sx={{
                        color: 'text.secondary',
                        textTransform: 'none',
                    }}
                >
                    Use a different email
                </Button>
            </Box>
        </Box>
    );
}