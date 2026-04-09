import React, { useEffect, useMemo, useState } from 'react';
import {
    Box,
    Typography,
    Button,
    Paper,
    Stack,
    Avatar,
    IconButton,
    FormControl,
    Select,
    MenuItem,
    TextField,
    InputLabel,
    FormControlLabel,
    Switch,
    InputAdornment,
    Autocomplete,
    Divider,
    Chip,
    Card,
    CardActionArea,
} from '@mui/material';
import LanguageRounded from '@mui/icons-material/LanguageRounded';
import DescriptionRounded from '@mui/icons-material/DescriptionRounded';
import ImageRounded from '@mui/icons-material/ImageRounded';
import EmailRounded from '@mui/icons-material/EmailRounded';
import SearchRounded from '@mui/icons-material/SearchRounded';
import CloseRounded from '@mui/icons-material/CloseRounded';
import VisibilityRounded from '@mui/icons-material/VisibilityRounded';
import VisibilityOffRounded from '@mui/icons-material/VisibilityOffRounded';
import CheckCircleRounded from '@mui/icons-material/CheckCircleRounded';
import RadioButtonUncheckedRounded from '@mui/icons-material/RadioButtonUncheckedRounded';
import { SidebarPanel } from '../../components/layout/SidebarPanel';
import type {
    CompanyProfile,
    CompanyPermissionMember,
    CompanyType,
} from './companyProfile.types';

import ContentCopyRounded from '@mui/icons-material/ContentCopyRounded';
import LinkRounded from '@mui/icons-material/LinkRounded';
import CheckRounded from '@mui/icons-material/CheckRounded';

import countries from '../../data/countries.json';
import {
    REGION_OPTIONS,
} from '../../constants/companies';

export type ExistingUserOption = {
    id: string;
    name: string;
    email?: string;
};

export type CompanyEditorSection =
    | 'header'
    | 'about'
    | 'media'
    | 'team'
    | 'documents'
    | 'permissions'
    | 'services'
    | 'serviceCategories'
    | 'projectTypes'
    | 'geographicalCoverage'
    | '';

export type SidebarSavePayload =
    | {
        section: 'header';
        values: {
            displayName: string;
            roles: string[];
            website: string;
            description: string;
            country: string;
            countryCode?: string;
            logoFile?: File | null;
            visibility: 'public' | 'hidden';
        };
    }
    | {
        section: 'about';
        values: {
            fullDescription: string;
            visibility: 'public' | 'hidden';
        };
    }
    | {
        section: 'team';
        values:
        | {
            action: 'upsert';
            userId?: string;
            name: string;
            email?: string;
            role: string;
            previousUserId?: string;
            previousEmail?: string;
            visibility: 'public' | 'hidden';
        }
        | {
            action: 'remove';
            userId?: string;
            email?: string;
            name?: string;
            visibility: 'public' | 'hidden';
        };
    }
    | {
        section: 'documents';
        values: {
            id?: string;
            name: string;
            type: string;
            file?: File | null;
            assetUrl?: string;
            s3Key?: string;
            contentType?: string;
            index?: number;
            visibility: 'public' | 'hidden';
        };
    }
    | {
        section: 'media';
        values: {
            id?: string;
            caption: string;
            file?: File | null;
            assetUrl?: string;
            s3Key?: string;
            contentType?: string;
            isCover?: boolean;
            index?: number;
            visibility: 'public' | 'hidden';
        };
    }
    | {
        section: 'services';
        values: {
            services: string[];
            visibility: 'public' | 'hidden';
        };
    }
    | {
        section: 'serviceCategories';
        values: {
            serviceCategories: string[];
            visibility: 'public' | 'hidden';
        };
    }
    | {
        section: 'projectTypes';
        values: {
            projectTypes: string[];
            visibility: 'public' | 'hidden';
        };
    }
    | {
        section: 'geographicalCoverage';
        values: {
            geographicalCoverage: string[];
            visibility: 'public' | 'hidden';
        };
    }
    | {
        section: 'permissions';
        values: {
            permissions: CompanyPermissionMember[];
            inheritCompanyPermissionsToProjects: boolean;
            visibility: 'public' | 'hidden';
        };
    };

interface CompanySidebarEditorProps {
    open: boolean;
    onClose: () => void;
    section: CompanyEditorSection;
    company: CompanyProfile | null;
    existingUsers: ExistingUserOption[];
    editingItem?: any;
    onSave: (payload: SidebarSavePayload) => void;
    onUploadMedia?: (input: {
        file?: File | null;
        caption: string;
        visibility: 'public' | 'hidden';
        editingItem?: any;
    }) => Promise<void>;
    onUploadDocument?: (input: {
        file: File | null;
        name: string;
        type: string;
        visibility: 'public' | 'hidden';
        editingItem?: any;
    }) => Promise<void>;
}

const teamRoles = [
    'CEO & Founder',
    'Managing Director',
    'Head of Projects',
    'Technical Director',
    'Operations Manager',
    'Project Manager',
    'Finance Director',
    'Community Liaison',
    'MRV Specialist',
    'Legal Counsel',
    'Board Member',
    'Advisor',
    'Other',
] as const;

const companyRoles = ['Project Developer', 'Service Provider'] as const;

const sidebarProjectTypes = [
    { id: 'arr', title: 'ARR', caption: 'Afforestation, Reforestation, and Revegetation.' },
    { id: 'redd', title: 'REDD+', caption: 'Reducing emissions from deforestation and degradation.' },
    { id: 'regen-ag', title: 'Regenerative Agriculture', caption: 'Soil carbon and regenerative farming.' },
    { id: 'ifm', title: 'IFM', caption: 'Improved Forest Management.' },
    { id: 'blue-carbon', title: 'Blue Carbon', caption: 'Mangroves, seagrass, and coastal ecosystems.' },
    { id: 'biochar', title: 'Biochar', caption: 'Carbon-rich material from biomass pyrolysis.' },
    { id: 'dac', title: 'DAC', caption: 'Direct Air Capture.' },
    { id: 'erw', title: 'ERW', caption: 'Enhanced Rock Weathering.' },
    { id: 'beccs', title: 'BECCS', caption: 'Bioenergy with Carbon Capture and Storage.' },
    { id: 'renewable', title: 'Renewable Energy', caption: 'Renewable energy carbon projects.' },
    { id: 'waste', title: 'Waste Management', caption: 'Landfill gas and methane reduction.' },
    { id: 'household', title: 'Household Devices', caption: 'Cookstoves, filters, and household systems.' },
    { id: 'awd', title: 'AWD', caption: 'Alternate Wetting and Drying.' },
] as const;

export function CompanySidebarEditor({
    open,
    onClose,
    section,
    company,
    existingUsers,
    editingItem,
    onSave,
    onUploadMedia,
    onUploadDocument,
}: CompanySidebarEditorProps) {
    const [sectionVisibility, setSectionVisibility] = useState(true);

    const [roles, setRoles] = useState<string[]>(['Project Developer']);
    const [userSearch, setUserSearch] = useState('');
    const [selectedProjectTypes, setSelectedProjectTypes] = useState<string[]>([]);
    const [services, setServices] = useState<string[]>([]);
    const [newService, setNewService] = useState('');
    const [selectedServiceCategories, setSelectedServiceCategories] = useState<string[]>([]);

    const [displayName, setDisplayName] = useState('');
    const [type, setType] = useState<CompanyType>('Project Developer');
    const [website, setWebsite] = useState('');
    const [shortDesc, setShortDesc] = useState('');
    const [fullDesc, setFullDesc] = useState('');

    const [mediaCaption, setMediaCaption] = useState('');
    const [docName, setDocName] = useState('');
    const [docType, setDocType] = useState('');

    const [addMode, setAddMode] = useState<'search' | 'link'>('search');
    const [selectedUser, setSelectedUser] = useState<ExistingUserOption | null>(null);
    const [teamRole, setTeamRole] = useState('');

    const [permissions, setPermissions] = useState<CompanyPermissionMember[]>([]);
    const [permSelectedUser, setPermSelectedUser] = useState<ExistingUserOption | null>(null);
    const [permNewRole, setPermNewRole] = useState<'creator' | 'viewer'>('viewer');
    const [inheritToProjects, setInheritToProjects] = useState(false);

    const [country, setCountry] = useState('');
    const [countryCode, setCountryCode] = useState('');
    const [selectedGeographicalCoverage, setSelectedGeographicalCoverage] = useState<string[]>([]);

    const [copiedInvite, setCopiedInvite] = useState(false);

    const [mediaFile, setMediaFile] = useState<File | null>(null);
    const [documentFile, setDocumentFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState('');

    const [headerLogoFile, setHeaderLogoFile] = useState<File | null>(null);
    const [headerLogoPreviewUrl, setHeaderLogoPreviewUrl] = useState<string | null>(null);

    const getSectionVisibilityValue = (
        company: CompanyProfile | null,
        section: CompanyEditorSection
    ): boolean => {
        if (!company || !section) return true;
        return (company.privacy?.[section as keyof typeof company.privacy] ?? 'public') === 'public';
    };

    const existingHeaderLogoUrl =
        (company as any)?.logoUrl ||
        (company as any)?.coverImageUrl ||
        null;

    const headerLogoDisplayUrl = headerLogoPreviewUrl || existingHeaderLogoUrl;

    const getInitials = (name: string) =>
        name
            .split(' ')
            .filter(Boolean)
            .slice(0, 2)
            .map((part) => part[0]?.toUpperCase() ?? '')
            .join('');

    const handlePickHeaderLogo = (file: File | null) => {
        if (!file) return;

        if (headerLogoPreviewUrl) {
            URL.revokeObjectURL(headerLogoPreviewUrl);
        }

        const nextPreviewUrl = URL.createObjectURL(file);
        setHeaderLogoFile(file);
        setHeaderLogoPreviewUrl(nextPreviewUrl);
    };

    const handleClearHeaderLogo = () => {
        if (headerLogoPreviewUrl) {
            URL.revokeObjectURL(headerLogoPreviewUrl);
        }
        setHeaderLogoFile(null);
        setHeaderLogoPreviewUrl(null);
    };

    useEffect(() => {
        if (!open) return;

        setSectionVisibility(getSectionVisibilityValue(company, section));

        setMediaFile(null);
        setDocumentFile(null);
        setUploadError('');
        setIsUploading(false);

        if (headerLogoPreviewUrl) {
            URL.revokeObjectURL(headerLogoPreviewUrl);
        }
        setHeaderLogoFile(null);
        setHeaderLogoPreviewUrl(null);

        if (section === 'header') {
            setDisplayName(company?.displayName || '');
            setRoles(
                Array.isArray((company as any)?.roles) && (company as any).roles.length > 0
                    ? (company as any).roles
                    : company?.type
                        ? [company.type]
                        : ['Project Developer']
            );
            setWebsite(company?.website || '');
            setShortDesc(company?.description || '');
            setCountry(company?.country || '');
            setCountryCode(company?.countryCode || '');
            return;
        }

        if (section === 'geographicalCoverage') {
            setSelectedGeographicalCoverage(
                Array.isArray(company?.geographicalCoverage) ? company!.geographicalCoverage : []
            );
            return;
        }

        if (section === 'projectTypes') {
            setSelectedProjectTypes((company as any)?.projectTypes ?? []);
            return;
        }

        if (section === 'about') {
            setFullDesc(company?.fullDescription || '');
            return;
        }

        if (section === 'media') {
            setMediaCaption(editingItem?.caption || '');
            return;
        }

        if (section === 'documents') {
            setDocName(editingItem?.name || '');
            setDocType(editingItem?.type || '');
            return;
        }

        if (section === 'team') {
            setTeamRole(editingItem?.role || '');

            if (editingItem) {
                const matchingUser = existingUsers.find(
                    (u) =>
                        (editingItem?.id && u.id === String(editingItem.id)) ||
                        (!!editingItem?.email &&
                            !!u.email &&
                            u.email.toLowerCase() === String(editingItem.email).toLowerCase())
                );

                if (matchingUser) {
                    setSelectedUser(matchingUser);
                    setAddMode('search');
                } else {
                    setSelectedUser(null);
                    setAddMode('search');
                }
            } else {
                setSelectedUser(null);
                setTeamRole('');
                setAddMode('search');
            }

            setCopiedInvite(false);
            return;
        }

        if (section === 'services') {
            setServices(Array.isArray((company as any)?.services) ? (company as any).services : []);
            setNewService('');
            return;
        }

        if (section === 'serviceCategories') {
            setSelectedServiceCategories(
                Array.isArray((company as any)?.serviceCategories) ? (company as any).serviceCategories : []
            );
            return;
        }

        if (section === 'permissions') {
            setPermissions(company?.permissions ?? []);
            setPermSelectedUser(null);
            setPermNewRole('viewer');
            setInheritToProjects(company?.inheritCompanyPermissionsToProjects ?? false);
        }
    }, [open, section, editingItem, company, existingUsers]);

    useEffect(() => {
        return () => {
            if (headerLogoPreviewUrl) {
                URL.revokeObjectURL(headerLogoPreviewUrl);
            }
        };
    }, [headerLogoPreviewUrl]);

    const availablePermissionUsers = useMemo(() => {
        return existingUsers.filter(
            (u) =>
                !permissions.some(
                    (p) => p.userId === u.id || (p.email && u.email && p.email === u.email)
                )
        );
    }, [existingUsers, permissions]);

    const renderVisibilityToggle = () => (
        <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1, mb: 3 }}>
            <FormControlLabel
                control={
                    <Switch
                        checked={sectionVisibility}
                        onChange={(e) => setSectionVisibility(e.target.checked)}
                    />
                }
                label={
                    <Box display="flex" alignItems="center" gap={1}>
                        {sectionVisibility ? (
                            <VisibilityRounded sx={{ fontSize: 16 }} />
                        ) : (
                            <VisibilityOffRounded sx={{ fontSize: 16 }} />
                        )}
                        <Typography variant="body2">
                            {sectionVisibility ? 'Public' : 'Hidden'}
                        </Typography>
                    </Box>
                }
            />
            <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>
                {sectionVisibility
                    ? 'This section is visible by default'
                    : 'This section is hidden from visitors and unauthorized team members'}
            </Typography>
        </Box>
    );

    const visibilityValue: 'public' | 'hidden' = sectionVisibility ? 'public' : 'hidden';

    const handleSave = async () => {
        if (section === 'header') {
            onSave({
                section: 'header',
                values: {
                    displayName: displayName.trim(),
                    roles,
                    website: website.trim(),
                    description: shortDesc.trim(),
                    country: country.trim(),
                    countryCode: countryCode?.trim() || undefined,
                    logoFile: headerLogoFile,
                    visibility: visibilityValue,
                },
            });
            onClose();
            return;
        }

        if (section === 'geographicalCoverage') {
            onSave({
                section: 'geographicalCoverage',
                values: {
                    geographicalCoverage: selectedGeographicalCoverage,
                    visibility: visibilityValue,
                },
            });
            onClose();
            return;
        }

        if (section === 'services') {
            onSave({
                section: 'services',
                values: {
                    services: services.map((item) => item.trim()).filter(Boolean),
                    visibility: visibilityValue,
                },
            });
            onClose();
            return;
        }

        if (section === 'serviceCategories') {
            onSave({
                section: 'serviceCategories',
                values: {
                    serviceCategories: selectedServiceCategories,
                    visibility: visibilityValue,
                },
            });
            onClose();
            return;
        }

        if (section === 'projectTypes') {
            onSave({
                section: 'projectTypes',
                values: {
                    projectTypes: selectedProjectTypes,
                    visibility: visibilityValue,
                },
            });
            onClose();
            return;
        }

        if (section === 'about') {
            onSave({
                section: 'about',
                values: {
                    fullDescription: fullDesc.trim(),
                    visibility: visibilityValue,
                },
            });
            onClose();
            return;
        }

        if (section === 'team') {
            if (addMode !== 'search' || !selectedUser) {
                return;
            }

            onSave({
                section: 'team',
                values: {
                    action: 'upsert',
                    userId: selectedUser.id,
                    name: selectedUser.name.trim(),
                    email: selectedUser.email?.trim() || undefined,
                    role: (teamRole || 'Team Member').trim(),
                    previousUserId: editingItem?.id ? String(editingItem.id) : undefined,
                    previousEmail: editingItem?.email ? String(editingItem.email).trim() : undefined,
                    visibility: visibilityValue,
                },
            });
            onClose();
            return;
        }

        if (section === 'documents') {
            try {
                setUploadError('');
                setIsUploading(true);

                if (onUploadDocument) {
                    await onUploadDocument({
                        file: documentFile ?? undefined as any,
                        name: docName.trim(),
                        type: docType.trim(),
                        visibility: visibilityValue,
                        editingItem,
                    });
                } else {
                    onSave({
                        section: 'documents',
                        values: {
                            id: editingItem?.id,
                            name: docName.trim(),
                            type: docType.trim(),
                            file: documentFile,
                            index: typeof editingItem?.index === 'number' ? editingItem.index : undefined,
                            visibility: visibilityValue,
                        },
                    });
                }

                onClose();
            } catch (err: any) {
                setUploadError(err?.message || 'Failed to save document');
            } finally {
                setIsUploading(false);
            }
            return;
        }

        if (section === 'media') {
            try {
                setUploadError('');
                setIsUploading(true);

                if (onUploadMedia) {
                    await onUploadMedia({
                        file: mediaFile ?? undefined as any,
                        caption: mediaCaption.trim(),
                        visibility: visibilityValue,
                        editingItem,
                    });
                } else {
                    onSave({
                        section: 'media',
                        values: {
                            id: editingItem?.id,
                            caption: mediaCaption.trim(),
                            file: mediaFile,
                            index: typeof editingItem?.index === 'number' ? editingItem.index : undefined,
                            visibility: visibilityValue,
                        },
                    });
                }

                onClose();
            } catch (err: any) {
                setUploadError(err?.message || 'Failed to save media');
            } finally {
                setIsUploading(false);
            }
            return;
        }

        if (section === 'permissions') {
            onSave({
                section: 'permissions',
                values: {
                    permissions,
                    inheritCompanyPermissionsToProjects: inheritToProjects,
                    visibility: visibilityValue,
                },
            });
            onClose();
        }
    };

    // const getTitle = () => {
    //     if (editingItem) return 'Edit';
    //     if (section === 'header') return 'Edit Company';
    //     if (section === 'team') return 'Add Team Member';
    //     if (section === 'services') return 'Edit Services Offered';
    //     if (section === 'serviceCategories') return 'Edit Service Categories';
    //     if (section === 'permissions') return 'Edit Permissions';
    //     return 'Add';
    // };

    const getTitle = () => {
        switch (section) {
            case 'header':
                return 'Edit Company';
            case 'about':
                return 'Edit About';
            case 'media':
                return editingItem ? 'Edit Media' : 'Add Media';
            case 'documents':
                return editingItem ? 'Edit Document' : 'Add Document';
            case 'team':
                return editingItem ? 'Edit Team Member' : 'Add Team Member';
            case 'permissions':
                return 'Edit Permissions';
            case 'services':
                return 'Edit Services Offered';
            case 'serviceCategories':
                return 'Edit Service Categories';
            case 'projectTypes':
                return 'Edit Project Types';
            case 'geographicalCoverage':
                return 'Edit Geographical Coverage';
            default:
                return 'Edit';
        }
    };

    const getSaveLabel = () => {
        if (section === 'team' && !editingItem) return 'Add Member';
        if (section === 'media' && !editingItem) return 'Add Media';
        if (section === 'documents' && !editingItem) return 'Add Document';
        return 'Save';
    };

    const isSaveDisabled = () => {
        switch (section) {
            case 'header':
                return !displayName.trim();

            case 'about':
                return !fullDesc.trim();

            case 'team':
                if (addMode === 'link') return false;
                if (!teamRole.trim()) return true;
                return !selectedUser;

            case 'documents':
                if (!editingItem && !documentFile) return true;
                return !docName.trim() || !docType.trim();

            case 'media':
                if (!editingItem && !mediaFile) return true;
                return !mediaCaption.trim() && !editingItem;

            case 'services':
                return services.length === 0;

            case 'serviceCategories':
                return selectedServiceCategories.length === 0;

            case 'projectTypes':
                return selectedProjectTypes.length === 0;

            case 'geographicalCoverage':
                return selectedGeographicalCoverage.length === 0;

            default:
                return false;
        }
    };

    const externalInviteUrl = useMemo(() => {
        if (!company) return '';

        const directUrl =
            (company as any).externalInviteUrl?.trim?.() ||
            '';

        if (directUrl) return directUrl;

        const token = (company as any).inviteToken?.trim?.();
        if (!token) return '';

        return `${window.location.origin}/signup?companyInvite=${encodeURIComponent(token)}`;
    }, [company]);

    const handleCopyInvite = async () => {
        if (!externalInviteUrl) return;

        try {
            await navigator.clipboard.writeText(externalInviteUrl);
            setCopiedInvite(true);
            window.setTimeout(() => setCopiedInvite(false), 2000);
        } catch {
            setCopiedInvite(false);
        }
    };

    const renderUploadError = () =>
        uploadError ? (
            <Paper
                variant="outlined"
                sx={{
                    p: 1.5,
                    borderRadius: 1.5,
                    borderColor: 'error.light',
                    bgcolor: 'error.50',
                }}
            >
                <Typography variant="body2" color="error.main">
                    {uploadError}
                </Typography>
            </Paper>
        ) : null;

    const renderContent = () => {
        switch (section) {
            case 'header':
                return (
                    <Stack spacing={3}>
                        <Box>
                            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                                Company Details
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Basic information about your organization.
                            </Typography>
                        </Box>

                        {renderVisibilityToggle()}

                        <Box display="flex" justifyContent="center">
                            {!headerLogoFile ? (
                                <Paper
                                    variant="outlined"
                                    component="label"
                                    sx={{
                                        width: 112,
                                        height: 112,
                                        borderRadius: 3,
                                        borderStyle: 'dashed',
                                        borderColor: 'grey.300',
                                        bgcolor: 'grey.50',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: 'pointer',
                                        overflow: 'hidden',
                                        '&:hover': {
                                            borderColor: 'grey.400',
                                            bgcolor: 'grey.100',
                                        },
                                    }}
                                >
                                    <input
                                        type="file"
                                        hidden
                                        accept="image/*"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0] ?? null;
                                            e.currentTarget.value = '';
                                            handlePickHeaderLogo(file);
                                        }}
                                    />

                                    {headerLogoDisplayUrl ? (
                                        <Box
                                            component="img"
                                            src={headerLogoDisplayUrl}
                                            alt={displayName || 'Company logo preview'}
                                            sx={{
                                                width: '100%',
                                                height: '100%',
                                                objectFit: 'cover',
                                            }}
                                        />
                                    ) : displayName.trim() ? (
                                        <>
                                            <Avatar
                                                sx={{
                                                    width: 64,
                                                    height: 64,
                                                    bgcolor: 'grey.300',
                                                    color: 'text.primary',
                                                    fontSize: '1.25rem',
                                                    fontWeight: 600,
                                                    mb: 0.5,
                                                }}
                                            >
                                                {getInitials(displayName)}
                                            </Avatar>
                                            <Typography variant="caption" color="text.secondary">
                                                Upload Logo
                                            </Typography>
                                        </>
                                    ) : (
                                        <>
                                            <ImageRounded sx={{ fontSize: 32, color: 'grey.400', mb: 0.5 }} />
                                            <Typography variant="caption" color="text.secondary">
                                                Upload Logo
                                            </Typography>
                                        </>
                                    )}
                                </Paper>
                            ) : (
                                <Stack spacing={1.5} alignItems="center" width="100%">
                                    <Paper variant="outlined" sx={{ p: 1.5, width: '100%', maxWidth: 280 }}>
                                        <Box
                                            component="img"
                                            src={headerLogoPreviewUrl!}
                                            alt="Pending company logo preview"
                                            sx={{
                                                width: '100%',
                                                maxHeight: 220,
                                                objectFit: 'contain',
                                                borderRadius: 1.5,
                                                display: 'block',
                                            }}
                                        />
                                    </Paper>

                                    <Typography variant="caption" color="text.secondary">
                                        {headerLogoFile.name}
                                    </Typography>

                                    <Stack direction="row" spacing={1}>
                                        <Button variant="outlined" component="label">
                                            Replace file
                                            <input
                                                type="file"
                                                hidden
                                                accept="image/*"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0] ?? null;
                                                    e.currentTarget.value = '';
                                                    handlePickHeaderLogo(file);
                                                }}
                                            />
                                        </Button>

                                        <Button
                                            color="inherit"
                                            variant="text"
                                            onClick={handleClearHeaderLogo}
                                        >
                                            Cancel
                                        </Button>
                                    </Stack>
                                </Stack>
                            )}
                        </Box>

                        <TextField
                            label="Company Name"
                            fullWidth
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                        />

                        <Autocomplete
                            options={countries as Array<{ name: string; code?: string }>}
                            getOptionLabel={(option) => option.name}
                            value={
                                (countries as Array<{ name: string; code?: string }>).find((c) => c.name === country) ?? null
                            }
                            onChange={(_, value) => {
                                setCountry(value?.name ?? '');
                                setCountryCode(value?.code ?? '');
                            }}
                            renderInput={(params) => (
                                <TextField {...params} label="Country" fullWidth />
                            )}
                        />

                        <TextField
                            label="Short Description"
                            fullWidth
                            multiline
                            minRows={2}
                            value={shortDesc}
                            onChange={(e) => setShortDesc(e.target.value)}
                            placeholder="Brief summary..."
                        />

                        <TextField
                            label="Website"
                            fullWidth
                            value={website}
                            onChange={(e) => setWebsite(e.target.value)}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <LanguageRounded sx={{ fontSize: 16, color: 'grey.400' }} />
                                    </InputAdornment>
                                ),
                            }}
                        />

                        <Box>
                            <Typography variant="body2" fontWeight={500} mb={1}>
                                Company Role(s)
                            </Typography>
                            <Typography
                                variant="caption"
                                color="text.secondary"
                                display="block"
                                mb={1.5}
                            >
                                Select all that apply.
                            </Typography>

                            <Box display="flex" gap={1.5} flexDirection="column">
                                {companyRoles.map((role) => (
                                    <Card
                                        key={role}
                                        variant="outlined"
                                        sx={{
                                            borderColor: roles.includes(role) ? 'primary.main' : 'grey.200',
                                            borderWidth: roles.includes(role) ? 2 : 1,
                                            bgcolor: roles.includes(role) ? 'primary.50' : 'transparent',
                                        }}
                                    >
                                        <CardActionArea
                                            onClick={() => {
                                                setRoles((prev) =>
                                                    prev.includes(role)
                                                        ? prev.filter((r) => r !== role)
                                                        : [...prev, role]
                                                );
                                            }}
                                            sx={{ p: 2 }}
                                        >
                                            <Box display="flex" alignItems="flex-start" gap={1.5}>
                                                {roles.includes(role) ? (
                                                    <CheckCircleRounded color="primary" />
                                                ) : (
                                                    <RadioButtonUncheckedRounded sx={{ color: 'grey.400' }} />
                                                )}

                                                <Box>
                                                    <Typography variant="subtitle2" fontWeight="bold">
                                                        {role}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {role === 'Project Developer'
                                                            ? 'Develops and manages carbon projects'
                                                            : 'Provides services to carbon projects'}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        </CardActionArea>
                                    </Card>
                                ))}
                            </Box>
                        </Box>
                    </Stack>
                );

            case 'about':
                return (
                    <Stack spacing={3}>
                        <Box>
                            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                                About
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Tell your company&apos;s story.
                            </Typography>
                        </Box>
                        {renderVisibilityToggle()}
                        <TextField
                            label="Full Description"
                            fullWidth
                            multiline
                            minRows={6}
                            value={fullDesc}
                            onChange={(e) => setFullDesc(e.target.value)}
                            placeholder="Detailed description of your company..."
                        />
                    </Stack>
                );

            case 'media':
                return (
                    <Stack spacing={3}>
                        <Box>
                            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                                {editingItem ? 'Edit Media' : 'Add Media'}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {editingItem
                                    ? 'Update the media details. To replace the file, remove this item and upload a new one.'
                                    : 'Upload photos and videos.'}
                            </Typography>
                        </Box>

                        {renderVisibilityToggle()}
                        {renderUploadError()}

                        {!editingItem ? (
                            <Paper
                                variant="outlined"
                                sx={{ p: 3, borderStyle: 'dashed', textAlign: 'center', cursor: 'pointer' }}
                                component="label"
                            >
                                <input
                                    type="file"
                                    hidden
                                    accept="image/*,video/*"
                                    onChange={(e) => setMediaFile(e.target.files?.[0] ?? null)}
                                />
                                {mediaFile && (
                                    <Typography variant="caption" color="text.secondary" display="block" mb={1}>
                                        Selected: {mediaFile.name}
                                    </Typography>
                                )}
                                <ImageRounded sx={{ fontSize: 32, color: 'grey.400', mb: 1 }} />
                                <Typography variant="body2" color="text.secondary">
                                    Click to upload or drag and drop
                                </Typography>
                                <Typography variant="caption" color="text.disabled">
                                    PNG, JPG, JPEG, WEBP, MP4
                                </Typography>
                            </Paper>
                        ) : (
                            <Paper
                                variant="outlined"
                                sx={{
                                    p: 2,
                                    borderRadius: 2,
                                    bgcolor: 'grey.50',
                                    borderColor: 'grey.200',
                                }}
                            >
                                <Typography variant="body2" fontWeight={500}>
                                    Existing media
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    File replacement is not supported from this editor yet.
                                </Typography>
                            </Paper>
                        )}

                        <TextField
                            label="Caption"
                            fullWidth
                            value={mediaCaption}
                            onChange={(e) => setMediaCaption(e.target.value)}
                            placeholder="Describe this media..."
                        />
                    </Stack>
                );

            case 'documents':
                return (
                    <Stack spacing={3}>
                        <Box>
                            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                                {editingItem ? 'Edit Document' : 'Add Document'}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Upload company documents.
                            </Typography>
                        </Box>
                        {renderVisibilityToggle()}
                        {renderUploadError()}
                        {!editingItem && (
                            <Paper
                                variant="outlined"
                                sx={{ p: 3, borderStyle: 'dashed', textAlign: 'center', cursor: 'pointer' }}
                                component="label"
                            >
                                <input
                                    type="file"
                                    hidden
                                    onChange={(e) => {
                                        const file = e.target.files?.[0] ?? null;
                                        setDocumentFile(file);
                                        if (file && !docName.trim()) {
                                            const inferredName = file.name.replace(/\.[^/.]+$/, '');
                                            setDocName(inferredName);
                                        }
                                    }}
                                />
                                {documentFile && (
                                    <Typography variant="caption" color="text.secondary" display="block" mb={1}>
                                        Selected: {documentFile.name}
                                    </Typography>
                                )}
                                <DescriptionRounded sx={{ fontSize: 32, color: 'grey.400', mb: 1 }} />
                                <Typography variant="body2" color="text.secondary">
                                    {editingItem ? 'Click to replace file' : 'Click to upload or drag and drop'}
                                </Typography>
                                <Typography variant="caption" color="text.disabled">
                                    PDF, DOCX, XLSX
                                </Typography>
                            </Paper>
                        )}

                        <TextField
                            label="Document Name"
                            fullWidth
                            value={docName}
                            onChange={(e) => setDocName(e.target.value)}
                        />

                        <FormControl fullWidth>
                            <InputLabel>Document Type</InputLabel>
                            <Select
                                value={docType}
                                label="Document Type"
                                onChange={(e) => setDocType(e.target.value)}
                            >
                                <MenuItem value="General">General</MenuItem>
                                <MenuItem value="Report">Report</MenuItem>
                                <MenuItem value="Legal">Legal</MenuItem>
                                <MenuItem value="Financial">Financial</MenuItem>
                            </Select>
                        </FormControl>
                    </Stack>
                );

            case 'team':
                return (
                    <Stack spacing={3}>
                        <Box>
                            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                                {editingItem ? 'Edit Team Member' : 'Add Team Member'}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Add existing platform users below. For external users, share the permanent invite link.
                            </Typography>
                        </Box>

                        {renderVisibilityToggle()}

                        <Box display="flex" gap={1} mb={2}>
                            <Button
                                variant={addMode === 'search' ? 'contained' : 'outlined'}
                                size="small"
                                startIcon={<SearchRounded sx={{ fontSize: 16 }} />}
                                onClick={() => setAddMode('search')}
                                sx={{
                                    flex: 1,
                                    textTransform: 'none',
                                    bgcolor: addMode === 'search' ? 'grey.900' : 'transparent',
                                    borderColor: 'grey.300',
                                    color: addMode === 'search' ? 'white' : 'text.secondary',
                                    boxShadow: 'none',
                                    '&:hover': {
                                        bgcolor: addMode === 'search' ? 'grey.800' : 'grey.50',
                                        boxShadow: 'none',
                                    },
                                }}
                            >
                                Add Existing User
                            </Button>

                            <Button
                                variant={addMode === 'link' ? 'contained' : 'outlined'}
                                size="small"
                                startIcon={<LinkRounded sx={{ fontSize: 16 }} />}
                                onClick={() => setAddMode('link')}
                                sx={{
                                    flex: 1,
                                    textTransform: 'none',
                                    bgcolor: addMode === 'link' ? 'grey.900' : 'transparent',
                                    borderColor: 'grey.300',
                                    color: addMode === 'link' ? 'white' : 'text.secondary',
                                    boxShadow: 'none',
                                    '&:hover': {
                                        bgcolor: addMode === 'link' ? 'grey.800' : 'grey.50',
                                        boxShadow: 'none',
                                    },
                                }}
                            >
                                Invite Link
                            </Button>
                        </Box>

                        {addMode === 'search' ? (
                            <>
                                <Autocomplete
                                    options={existingUsers}
                                    getOptionLabel={(option) => option.name}
                                    value={selectedUser}
                                    onChange={(_, newValue) => setSelectedUser(newValue)}
                                    inputValue={userSearch}
                                    onInputChange={(_, newInputValue) => setUserSearch(newInputValue)}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            label="Search users"
                                            placeholder="Type to search."
                                            InputProps={{
                                                ...params.InputProps,
                                                startAdornment: (
                                                    <>
                                                        <InputAdornment position="start">
                                                            <SearchRounded sx={{ fontSize: 18, color: 'grey.400' }} />
                                                        </InputAdornment>
                                                        {params.InputProps.startAdornment}
                                                    </>
                                                ),
                                            }}
                                        />
                                    )}
                                />

                                {selectedUser && (
                                    <Paper
                                        variant="outlined"
                                        sx={{
                                            p: 2,
                                            bgcolor: 'grey.50',
                                            borderColor: 'grey.200',
                                            borderRadius: 2,
                                        }}
                                    >
                                        <Box display="flex" alignItems="center" gap={1.5}>
                                            <Avatar
                                                sx={{
                                                    width: 40,
                                                    height: 40,
                                                    bgcolor: 'grey.200',
                                                    color: 'text.primary',
                                                    fontSize: '0.875rem',
                                                }}
                                            >
                                                {selectedUser.name
                                                    .split(' ')
                                                    .map((n) => n[0])
                                                    .join('')}
                                            </Avatar>

                                            <Box flex={1}>
                                                <Typography variant="body2" fontWeight="medium">
                                                    {selectedUser.name}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {selectedUser.email}
                                                </Typography>
                                            </Box>

                                            <IconButton size="small" onClick={() => setSelectedUser(null)}>
                                                <CloseRounded sx={{ fontSize: 16 }} />
                                            </IconButton>
                                        </Box>
                                    </Paper>
                                )}

                                <FormControl fullWidth>
                                    <InputLabel>Team Role</InputLabel>
                                    <Select
                                        value={teamRole}
                                        label="Team Role"
                                        onChange={(e) => setTeamRole(String(e.target.value))}
                                    >
                                        {teamRoles.map((role) => (
                                            <MenuItem key={role} value={role}>
                                                {role}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </>
                        ) : (
                            <Paper
                                variant="outlined"
                                sx={{
                                    p: 2,
                                    borderRadius: 2,
                                    bgcolor: 'grey.50',
                                    borderColor: 'grey.200',
                                }}
                            >
                                <Stack spacing={1.5}>
                                    <Box display="flex" alignItems="center" gap={1}>
                                        <LinkRounded sx={{ fontSize: 18, color: 'text.secondary' }} />
                                        <Typography variant="subtitle2" fontWeight="bold">
                                            Company invite link
                                        </Typography>
                                    </Box>

                                    <Typography variant="body2" color="text.secondary">
                                        Share this URL with anyone you want to join this company as a viewer.
                                        They will be brought to sign up first, skip onboarding, and then land on this company page.
                                    </Typography>

                                    <TextField
                                        fullWidth
                                        value={externalInviteUrl}
                                        InputProps={{
                                            readOnly: true,
                                            endAdornment: (
                                                <InputAdornment position="end">
                                                    <IconButton
                                                        edge="end"
                                                        onClick={handleCopyInvite}
                                                        disabled={!externalInviteUrl}
                                                    >
                                                        {copiedInvite ? (
                                                            <CheckRounded sx={{ fontSize: 18 }} />
                                                        ) : (
                                                            <ContentCopyRounded sx={{ fontSize: 18 }} />
                                                        )}
                                                    </IconButton>
                                                </InputAdornment>
                                            ),
                                        }}
                                    />

                                    {!externalInviteUrl && (
                                        <Typography variant="caption" color="error">
                                            Invite URL not available yet. Contact your administrator.
                                        </Typography>
                                    )}

                                    {copiedInvite && (
                                        <Chip
                                            size="small"
                                            color="success"
                                            label="Invite link copied"
                                            sx={{ alignSelf: 'flex-start' }}
                                        />
                                    )}
                                </Stack>
                            </Paper>
                        )}

                        <Divider />

                        <FormControl fullWidth>
                            <InputLabel>Role</InputLabel>
                            <Select
                                value={teamRole}
                                label="Role"
                                onChange={(e) => setTeamRole(e.target.value)}
                            >
                                {teamRoles.map((role) => (
                                    <MenuItem key={role} value={role}>
                                        {role}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Stack>
                );

            case 'permissions':
                return (
                    <Stack spacing={3}>
                        <Box>
                            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                                Company Permissions
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Control who can view this company and who owns it.
                            </Typography>
                        </Box>

                        <Paper
                            variant="outlined"
                            sx={{
                                p: 2,
                                borderRadius: 1.5,
                                bgcolor: inheritToProjects ? 'primary.50' : 'grey.50',
                                borderColor: inheritToProjects ? 'primary.200' : 'grey.200',
                            }}
                        >
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={inheritToProjects}
                                        onChange={(e) => setInheritToProjects(e.target.checked)}
                                        size="small"
                                    />
                                }
                                label={
                                    <Box>
                                        <Typography variant="body2" fontWeight={500}>
                                            Inherit to all projects
                                        </Typography>
                                        <Typography
                                            variant="caption"
                                            color="text.secondary"
                                            display="block"
                                        >
                                            Company permissions will automatically apply to all projects.
                                        </Typography>
                                    </Box>
                                }
                                sx={{ alignItems: 'flex-start', m: 0, gap: 1 }}
                            />
                        </Paper>

                        <Box>
                            <Typography
                                variant="caption"
                                color="text.secondary"
                                fontWeight={600}
                                sx={{
                                    textTransform: 'uppercase',
                                    letterSpacing: 0.5,
                                    mb: 1,
                                    display: 'block',
                                }}
                            >
                                Members ({permissions.length})
                            </Typography>

                            <Stack spacing={1}>
                                {permissions.map((member) => (
                                    <Box
                                        key={member.id}
                                        display="flex"
                                        alignItems="center"
                                        gap={1.5}
                                        p={1.25}
                                        borderRadius={1}
                                        sx={{
                                            border: '1px solid',
                                            borderColor: 'grey.100',
                                            bgcolor: 'white',
                                        }}
                                    >
                                        <Avatar
                                            sx={{
                                                width: 32,
                                                height: 32,
                                                bgcolor: 'grey.200',
                                                fontSize: '0.7rem',
                                                fontWeight: 600,
                                                flexShrink: 0,
                                            }}
                                        >
                                            {member.name
                                                .split(' ')
                                                .map((n) => n[0])
                                                .join('')}
                                        </Avatar>

                                        <Box flex={1} minWidth={0}>
                                            <Typography variant="body2" fontWeight={500} noWrap>
                                                {member.name}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary" noWrap>
                                                {member.role}
                                            </Typography>
                                        </Box>

                                        <FormControl size="small" sx={{ minWidth: 100, flexShrink: 0 }}>
                                            <Select
                                                value={member.permission}
                                                onChange={(e) =>
                                                    setPermissions((prev) =>
                                                        prev.map((item) =>
                                                            item.id === member.id
                                                                ? {
                                                                    ...item,
                                                                    permission: e.target.value as
                                                                        | 'creator'
                                                                        | 'viewer',
                                                                }
                                                                : item
                                                        )
                                                    )
                                                }
                                                sx={{ fontSize: '0.75rem', height: 28 }}
                                            >
                                                <MenuItem value="creator">Creator</MenuItem>
                                                <MenuItem value="viewer">Viewer</MenuItem>
                                            </Select>
                                        </FormControl>

                                        <IconButton
                                            size="small"
                                            sx={{ color: 'grey.400', flexShrink: 0 }}
                                            onClick={() =>
                                                setPermissions((prev) =>
                                                    prev.filter((item) => item.id !== member.id)
                                                )
                                            }
                                        >
                                            <CloseRounded sx={{ fontSize: 14 }} />
                                        </IconButton>
                                    </Box>
                                ))}
                            </Stack>
                        </Box>

                        <Divider />

                        <Box>
                            <Typography
                                variant="caption"
                                color="text.secondary"
                                fontWeight={600}
                                sx={{
                                    textTransform: 'uppercase',
                                    letterSpacing: 0.5,
                                    mb: 1.5,
                                    display: 'block',
                                }}
                            >
                                Add Member
                            </Typography>

                            <Stack spacing={1.5}>
                                <Autocomplete
                                    options={availablePermissionUsers}
                                    getOptionLabel={(option) => option.name}
                                    value={permSelectedUser}
                                    onChange={(_, value) => setPermSelectedUser(value)}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            label="Search company members"
                                            placeholder="Type to search..."
                                        />
                                    )}
                                />

                                <FormControl fullWidth size="small">
                                    <InputLabel>Permission</InputLabel>
                                    <Select
                                        value={permNewRole}
                                        label="Permission"
                                        onChange={(e) =>
                                            setPermNewRole(e.target.value as 'creator' | 'viewer')
                                        }
                                    >
                                        <MenuItem value="creator">Creator</MenuItem>
                                        <MenuItem value="viewer">Viewer</MenuItem>
                                    </Select>
                                </FormControl>

                                <Button
                                    variant="outlined"
                                    disabled={!permSelectedUser}
                                    onClick={() => {
                                        if (!permSelectedUser) return;

                                        setPermissions((prev) => [
                                            ...prev,
                                            {
                                                id: permSelectedUser.id,
                                                userId: permSelectedUser.id,
                                                name: permSelectedUser.name,
                                                email: permSelectedUser.email,
                                                role: 'Team Member',
                                                permission: permNewRole,
                                            } as CompanyPermissionMember,
                                        ]);

                                        setPermSelectedUser(null);
                                        setPermNewRole('viewer');
                                    }}
                                >
                                    Add Member
                                </Button>
                            </Stack>
                        </Box>
                    </Stack>
                );

            case 'services':
                return (
                    <Stack spacing={3}>
                        <Box>
                            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                                Services Offered
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Select or add the specific services your organization provides.
                            </Typography>
                        </Box>

                        {renderVisibilityToggle()}

                        <Box>
                            <Typography
                                variant="caption"
                                fontWeight={600}
                                color="text.secondary"
                                sx={{
                                    textTransform: 'uppercase',
                                    letterSpacing: 0.5,
                                    mb: 1.5,
                                    display: 'block',
                                }}
                            >
                                Specific Services
                            </Typography>

                            {services.length > 0 ? (
                                <Stack spacing={1.5}>
                                    {services.map((service) => (
                                        <Box
                                            key={service}
                                            display="flex"
                                            alignItems="center"
                                            gap={1.5}
                                            p={1.25}
                                            borderRadius={1}
                                            sx={{
                                                border: '1px solid',
                                                borderColor: 'grey.200',
                                                '&:hover': {
                                                    bgcolor: 'grey.50',
                                                },
                                            }}
                                        >
                                            <Typography variant="body2" flex={1}>
                                                {service}
                                            </Typography>

                                            <IconButton
                                                size="small"
                                                onClick={() =>
                                                    setServices((prev) => prev.filter((item) => item !== service))
                                                }
                                                sx={{ color: 'grey.400' }}
                                            >
                                                <CloseRounded sx={{ fontSize: 14 }} />
                                            </IconButton>
                                        </Box>
                                    ))}
                                </Stack>
                            ) : (
                                <Paper
                                    variant="outlined"
                                    sx={{
                                        p: 2,
                                        borderStyle: 'dashed',
                                        bgcolor: 'grey.50',
                                    }}
                                >
                                    <Typography variant="body2" color="text.secondary">
                                        No services added yet.
                                    </Typography>
                                </Paper>
                            )}

                            <Box display="flex" gap={1} mt={2}>
                                <TextField
                                    label="Add a service"
                                    fullWidth
                                    value={newService}
                                    onChange={(e) => setNewService(e.target.value)}
                                    placeholder="e.g. Baseline assessment, Carbon credit trading"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            const value = newService.trim();
                                            if (!value) return;
                                            setServices((prev) =>
                                                prev.includes(value) ? prev : [...prev, value]
                                            );
                                            setNewService('');
                                        }
                                    }}
                                />
                                <Button
                                    variant="outlined"
                                    onClick={() => {
                                        const value = newService.trim();
                                        if (!value) return;
                                        setServices((prev) =>
                                            prev.includes(value) ? prev : [...prev, value]
                                        );
                                        setNewService('');
                                    }}
                                >
                                    Add
                                </Button>
                            </Box>
                        </Box>
                    </Stack>
                );

            case 'serviceCategories':
                return (
                    <Stack spacing={3}>
                        <Box>
                            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                                Service Categories
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Select the categories that best describe your organization.
                            </Typography>
                        </Box>

                        {renderVisibilityToggle()}

                        <Box display="flex" flexWrap="wrap" gap={1}>
                            {[
                                'Climate tech',
                                'MRV',
                                'Validation support',
                                'Methodology design',
                                'Registry support',
                                'Legal',
                                'Project development',
                                'Financing',
                                'Brokerage / offtake',
                                'Community engagement',
                            ].map((cat) => {
                                const selected = selectedServiceCategories.includes(cat);

                                return (
                                    <Chip
                                        key={cat}
                                        label={cat}
                                        clickable
                                        onClick={() =>
                                            setSelectedServiceCategories((prev) =>
                                                prev.includes(cat)
                                                    ? prev.filter((item) => item !== cat)
                                                    : [...prev, cat]
                                            )
                                        }
                                        variant={selected ? 'filled' : 'outlined'}
                                        sx={{
                                            fontWeight: 500,
                                            color: selected ? 'success.dark' : 'text.primary',
                                            bgcolor: selected ? 'success.50' : 'transparent',
                                            borderColor: selected ? 'success.main' : 'grey.300',
                                            '& .MuiChip-label': {
                                                px: 1,
                                            },
                                            '&:hover': {
                                                bgcolor: selected ? 'success.100' : 'grey.50',
                                            },
                                        }}
                                    />
                                );
                            })}
                        </Box>
                    </Stack>
                );

            case 'projectTypes':
                return (
                    <Stack spacing={3}>
                        <Box>
                            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                                Project Types
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Select all that apply.
                            </Typography>
                        </Box>

                        {renderVisibilityToggle()}

                        <Stack spacing={1.5}>
                            {sidebarProjectTypes.map((item) => {
                                const selected = selectedProjectTypes.includes(item.id);
                                return (
                                    <Paper
                                        key={item.id}
                                        variant="outlined"
                                        onClick={() =>
                                            setSelectedProjectTypes((prev) =>
                                                prev.includes(item.id)
                                                    ? prev.filter((value) => value !== item.id)
                                                    : [...prev, item.id]
                                            )
                                        }
                                        sx={{
                                            p: 1.5,
                                            cursor: 'pointer',
                                            borderColor: selected ? 'primary.main' : 'grey.200',
                                            borderWidth: selected ? 2 : 1,
                                            bgcolor: selected ? 'primary.50' : 'transparent',
                                        }}
                                    >
                                        <Typography variant="body2" fontWeight="bold">
                                            {item.title}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {item.caption}
                                        </Typography>
                                    </Paper>
                                );
                            })}
                        </Stack>
                    </Stack>
                );

            case 'geographicalCoverage':
                return (
                    <Stack spacing={3}>
                        <Box>
                            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                                Geographical Coverage
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Regions where your company operates.
                            </Typography>
                        </Box>

                        {renderVisibilityToggle()}

                        <Autocomplete
                            multiple
                            options={REGION_OPTIONS}
                            value={selectedGeographicalCoverage}
                            onChange={(_, value) => setSelectedGeographicalCoverage(value)}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label="Regions"
                                    placeholder="Select regions"
                                    fullWidth
                                />
                            )}
                        />
                    </Stack>
                );

            default:
                return null;
        }
    };

    return (
        <SidebarPanel
            open={open}
            onClose={onClose}
            title={getTitle()}
            onSave={handleSave}
            saveLabel={isUploading ? 'Saving...' : getSaveLabel()}
            saveDisabled={isSaveDisabled() || isUploading}
            width={420}
            showBackdrop
        >
            {renderContent()}
        </SidebarPanel>
    );
}