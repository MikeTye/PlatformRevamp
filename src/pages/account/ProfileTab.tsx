import React from 'react';
import {
    Alert,
    Autocomplete,
    Avatar,
    Box,
    Button,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    Divider,
    FormControl,
    FormControlLabel,
    IconButton,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    Slide,
    Snackbar,
    Stack,
    Switch,
    TextField,
    Typography,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import PersonOutlineRounded from '@mui/icons-material/PersonOutlineRounded';
import AddRounded from '@mui/icons-material/AddRounded';
import DeleteOutlineRounded from '@mui/icons-material/DeleteOutlineRounded';
import CloudUploadRounded from '@mui/icons-material/CloudUploadRounded';
import LogoutRounded from '@mui/icons-material/LogoutRounded';
import type { AccountPayload, CompanyOption, AffiliationItem } from './account.types';
import {
    EXPERTISE_OPTIONS,
    LANGUAGE_OPTIONS,
    ROLE_OPTIONS,
    SECTOR_OPTIONS,
    SERVICE_OPTIONS,
    STANDARD_OPTIONS,
} from './account.constants';
import type { PhoneCodeOption } from '../../utils/countryPhone';

type Props = {
    form: AccountPayload;
    initialData: AccountPayload;
    hasChanges: boolean;
    saving: boolean;
    companiesLoading: boolean;
    companyOptions: CompanyOption[];
    countryCode: string;
    countryFlag: string;
    timezoneOptions: Array<{
        value: string;
        label: string;
    }>;
    countryCodeOptions: PhoneCodeOption[];
    deleteDialogOpen: boolean;
    deleteConfirmText: string;
    snackbarOpen: boolean;
    snackbarSeverity: 'success' | 'error';
    snackbarMessage: string;
    onUpdateProfile: <K extends keyof AccountPayload['profile']>(
        key: K,
        value: AccountPayload['profile'][K]
    ) => void;
    onHandlePhoneCodeChange: (nextCode: string) => void;
    onAddAffiliation: () => void;
    onRemoveAffiliation: (index: number) => void;
    onAffiliationChange: (index: number, patch: Partial<AffiliationItem>) => void;
    onCancel: () => void;
    onSave: () => void;
    onLogout: () => void;
    onDeleteDialogOpen: () => void;
    onDeleteDialogClose: () => void;
    onDeleteConfirmTextChange: (value: string) => void;
    onDeleteAccount: () => void;
    onSnackbarClose: () => void;

    profilePhotoPreview: string;
    profilePhotoUploading: boolean;
    onProfilePhotoUpload: (file: File) => void | Promise<void>;
    onRemoveProfilePhoto: () => void;
};

function SectionCard({
    title,
    subtitle,
    children,
}: {
    title: string;
    subtitle?: string;
    children: React.ReactNode;
}) {
    return (
        <Paper variant="outlined" sx={{ p: 3, mb: 3, borderRadius: 2 }}>
            <Typography variant="h6" fontWeight="bold" mb={subtitle ? 0.5 : 2}>
                {title}
            </Typography>
            {subtitle ? (
                <Typography variant="body2" color="text.secondary" mb={2.5}>
                    {subtitle}
                </Typography>
            ) : null}
            {children}
        </Paper>
    );
}

function TagAutocomplete({
    value,
    options,
    placeholder,
    onChange,
}: {
    value: string[];
    options: string[];
    placeholder: string;
    onChange: (value: string[]) => void;
}) {
    return (
        <Autocomplete
            multiple
            freeSolo
            options={options}
            value={value}
            onChange={(_, newValue) => onChange(newValue)}
            renderTags={(tags, getTagProps) =>
                tags.map((option, index) => (
                    <Chip
                        variant="outlined"
                        label={option}
                        {...getTagProps({ index })}
                        key={`${option}-${index}`}
                    />
                ))
            }
            renderInput={(params) => <TextField {...params} placeholder={placeholder} />}
        />
    );
}

export default function ProfileTab(props: Props) {
    const {
        form,
        hasChanges,
        saving,
        companiesLoading,
        companyOptions,
        countryCode,
        countryFlag,
        timezoneOptions,
        countryCodeOptions,
        deleteDialogOpen,
        deleteConfirmText,
        snackbarOpen,
        snackbarSeverity,
        snackbarMessage,
        profilePhotoPreview,
        profilePhotoUploading,
        onProfilePhotoUpload,
        onRemoveProfilePhoto,
        onUpdateProfile,
        onHandlePhoneCodeChange,
        onAddAffiliation,
        onRemoveAffiliation,
        onAffiliationChange,
        onCancel,
        onSave,
        onLogout,
        onDeleteDialogOpen,
        onDeleteDialogClose,
        onDeleteConfirmTextChange,
        onDeleteAccount,
        onSnackbarClose,
    } = props;

    const profile = form.profile;

    return (
        <Box maxWidth={900} pb={hasChanges ? 10 : 0}>
            <Paper variant="outlined" sx={{ p: 3, mb: 3, borderRadius: 2 }}>
                <Box
                    display="flex"
                    gap={3}
                    flexDirection={{ xs: 'column', sm: 'row' }}
                    alignItems={{ xs: 'flex-start', sm: 'center' }}
                >
                    <Box display="flex" flexDirection="column" alignItems="center" gap={1.5}>
                        <Box
                            component="label"
                            sx={{
                                width: 96,
                                height: 96,
                                borderRadius: '50%',
                                border: '2px dashed',
                                borderColor: 'grey.300',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: profilePhotoUploading ? 'default' : 'pointer',
                                bgcolor: 'grey.50',
                                overflow: 'hidden',
                                position: 'relative',
                                '&:hover': {
                                    bgcolor: profilePhotoUploading ? 'grey.50' : 'grey.100',
                                    borderColor: profilePhotoUploading ? 'grey.300' : 'grey.400',
                                },
                            }}
                        >
                            <input
                                hidden
                                type="file"
                                accept="image/*"
                                disabled={profilePhotoUploading}
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;
                                    void onProfilePhotoUpload(file);
                                    e.target.value = '';
                                }}
                            />

                            {profilePhotoPreview ? (
                                <>
                                    <Avatar
                                        src={profilePhotoPreview}
                                        alt={profile.fullName || 'Profile photo'}
                                        sx={{ width: 96, height: 96 }}
                                    />
                                    <IconButton
                                        size="small"
                                        onClick={(event) => {
                                            event.preventDefault();
                                            event.stopPropagation();
                                            onRemoveProfilePhoto();
                                        }}
                                        sx={{
                                            position: 'absolute',
                                            top: 4,
                                            right: 4,
                                            bgcolor: 'rgba(255,255,255,0.9)',
                                            '&:hover': {
                                                bgcolor: 'rgba(255,255,255,1)',
                                            },
                                        }}
                                    >
                                        <DeleteOutlineRounded sx={{ fontSize: 16 }} />
                                    </IconButton>
                                </>
                            ) : (
                                <Avatar
                                    sx={{
                                        width: 96,
                                        height: 96,
                                        bgcolor: 'grey.200',
                                        color: 'grey.500',
                                    }}
                                >
                                    <PersonOutlineRounded sx={{ fontSize: 42 }} />
                                </Avatar>
                            )}
                        </Box>

                        <Button
                            component="label"
                            variant="outlined"
                            size="small"
                            startIcon={<CloudUploadRounded sx={{ fontSize: 16 }} />}
                            sx={{ textTransform: 'none', fontSize: '0.75rem' }}
                            disabled={profilePhotoUploading}
                        >
                            {profilePhotoUploading ? 'Uploading...' : profilePhotoPreview ? 'Change Photo' : 'Upload'}
                            <input
                                hidden
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;
                                    void onProfilePhotoUpload(file);
                                    e.target.value = '';
                                }}
                            />
                        </Button>

                        {profilePhotoPreview ? (
                            <Button
                                size="small"
                                color="inherit"
                                onClick={onRemoveProfilePhoto}
                                sx={{ textTransform: 'none', fontSize: '0.75rem' }}
                            >
                                Remove
                            </Button>
                        ) : null}
                    </Box>

                    <Box flex={1} minWidth={0}>
                        <Typography variant="h5" fontWeight="bold" color="text.primary" mb={0.5}>
                            {profile.fullName?.trim() || 'Your name'}
                        </Typography>

                        <Typography variant="body1" color="text.secondary" mb={1}>
                            {profile.jobTitle?.trim() || profile.headline?.trim() || 'Add your role or headline'}
                        </Typography>

                        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                            {profile.roleType ? (
                                <Chip size="small" label={profile.roleType} variant="outlined" />
                            ) : null}
                            {profile.country ? (
                                <Chip
                                    size="small"
                                    label={
                                        profile.city
                                            ? `${profile.city}, ${profile.country}`
                                            : profile.country
                                    }
                                    variant="outlined"
                                />
                            ) : null}
                            {profile.timezone ? (
                                <Chip size="small" label={profile.timezone} variant="outlined" />
                            ) : null}
                            {profile.contactEmail ? (
                                <Chip size="small" label={profile.contactEmail} variant="outlined" />
                            ) : null}
                        </Stack>
                    </Box>
                </Box>
            </Paper>

            <SectionCard
                title="Personal Information"
                subtitle="Basic profile information shown across your account."
            >
                <Grid container spacing={2.5}>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                            fullWidth
                            label="Full Name"
                            value={profile.fullName}
                            onChange={(e) => onUpdateProfile('fullName', e.target.value)}
                            required
                        />
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                            fullWidth
                            label="Email"
                            value={form.user.email}
                            disabled
                            helperText="Email is managed by authentication"
                        />
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                            fullWidth
                            label="Job Title"
                            value={profile.jobTitle}
                            onChange={(e) => onUpdateProfile('jobTitle', e.target.value)}
                            placeholder="e.g. Head of Sustainability"
                        />
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                            fullWidth
                            label="Headline"
                            value={profile.headline}
                            onChange={(e) => onUpdateProfile('headline', e.target.value)}
                            placeholder="Short one-line introduction"
                        />
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                        <FormControl fullWidth>
                            <InputLabel>Role Type</InputLabel>
                            <Select
                                value={profile.roleType || ''}
                                label="Role Type"
                                onChange={(e) => onUpdateProfile('roleType', String(e.target.value))}
                            >
                                {ROLE_OPTIONS.map((role) => (
                                    <MenuItem key={role} value={role}>
                                        {role}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                        <Box display="flex" gap={1.5}>
                            <FormControl sx={{ minWidth: 170 }}>
                                <InputLabel>Code</InputLabel>
                                <Select
                                    value={countryCode}
                                    label="Code"
                                    onChange={(e) =>
                                        onHandlePhoneCodeChange(String(e.target.value))
                                    }
                                    renderValue={() => (
                                        <Box display="flex" alignItems="center" gap={1}>
                                            <span>{countryFlag}</span>
                                            <span>{countryCode}</span>
                                        </Box>
                                    )}
                                >
                                    {countryCodeOptions.map((item) => (
                                        <MenuItem
                                            key={`${item.iso}-${item.code}`}
                                            value={item.dialCode}
                                        >
                                            <Box
                                                display="flex"
                                                alignItems="center"
                                                gap={1.5}
                                                width="100%"
                                            >
                                                <span style={{ fontSize: '1.1rem' }}>{item.flag}</span>
                                                <span>{item.country}</span>
                                                <Typography
                                                    variant="body2"
                                                    color="text.secondary"
                                                    sx={{ ml: 'auto' }}
                                                >
                                                    {item.dialCode}
                                                </Typography>
                                            </Box>
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            <TextField
                                fullWidth
                                label="Phone Number"
                                value={profile.phoneNumber}
                                onChange={(e) => onUpdateProfile('phoneNumber', e.target.value)}
                                placeholder="+60 12-345 6789"
                            />
                        </Box>
                    </Grid>
                </Grid>
            </SectionCard>

            <SectionCard
                title="Professional Summary"
                subtitle="Give people a quick sense of your background, expertise, and focus."
            >
                <TextField
                    fullWidth
                    multiline
                    minRows={4}
                    maxRows={8}
                    value={profile.bio}
                    onChange={(e) => onUpdateProfile('bio', e.target.value)}
                    placeholder="Write a short summary about your experience and areas of focus."
                />
            </SectionCard>

            <SectionCard
                title="Location & Contact"
                subtitle="Additional profile details for visibility and collaboration."
            >
                <Grid container spacing={2.5}>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                            fullWidth
                            label="Country"
                            value={profile.country}
                            onChange={(e) => onUpdateProfile('country', e.target.value)}
                        />
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                            fullWidth
                            label="City"
                            value={profile.city}
                            onChange={(e) => onUpdateProfile('city', e.target.value)}
                        />
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                        <FormControl fullWidth>
                            <InputLabel>Timezone</InputLabel>
                            <Select
                                value={profile.timezone}
                                label="Timezone"
                                onChange={(e) => onUpdateProfile('timezone', String(e.target.value))}
                            >
                                {timezoneOptions.map((tz) => (
                                    <MenuItem key={tz.value} value={tz.value}>
                                        {tz.label}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                            fullWidth
                            label="Contact Email"
                            value={profile.contactEmail}
                            onChange={(e) => onUpdateProfile('contactEmail', e.target.value)}
                            placeholder="Email shown on your profile"
                        />
                    </Grid>

                    <Grid size={{ xs: 12, md: 4 }}>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={Boolean(profile.isPublic)}
                                    onChange={(e) =>
                                        onUpdateProfile('isPublic', e.target.checked)
                                    }
                                />
                            }
                            label="Public profile"
                        />
                    </Grid>

                    <Grid size={{ xs: 12, md: 4 }}>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={Boolean(profile.showContactEmail)}
                                    onChange={(e) =>
                                        onUpdateProfile('showContactEmail', e.target.checked)
                                    }
                                />
                            }
                            label="Show contact email"
                        />
                    </Grid>

                    <Grid size={{ xs: 12, md: 4 }}>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={Boolean(profile.showPhone)}
                                    onChange={(e) =>
                                        onUpdateProfile('showPhone', e.target.checked)
                                    }
                                />
                            }
                            label="Show phone number"
                        />
                    </Grid>
                </Grid>
            </SectionCard>

            <SectionCard
                title="Links"
                subtitle="External profile and portfolio links."
            >
                <Grid container spacing={2.5}>
                    <Grid size={{ xs: 12, md: 4 }}>
                        <TextField
                            fullWidth
                            label="Personal Website"
                            value={profile.personalWebsite}
                            onChange={(e) => onUpdateProfile('personalWebsite', e.target.value)}
                        />
                    </Grid>

                    <Grid size={{ xs: 12, md: 4 }}>
                        <TextField
                            fullWidth
                            label="LinkedIn URL"
                            value={profile.linkedinUrl}
                            onChange={(e) => onUpdateProfile('linkedinUrl', e.target.value)}
                        />
                    </Grid>

                    <Grid size={{ xs: 12, md: 4 }}>
                        <TextField
                            fullWidth
                            label="Portfolio URL"
                            value={profile.portfolioUrl}
                            onChange={(e) => onUpdateProfile('portfolioUrl', e.target.value)}
                        />
                    </Grid>
                </Grid>
            </SectionCard>

            <SectionCard
                title="Company Affiliation"
                subtitle="Current or past organizations you work with."
            >
                {/* <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Box />
                    <Button
                        startIcon={<AddRounded />}
                        size="small"
                        onClick={onAddAffiliation}
                        sx={{ textTransform: 'none' }}
                        disabled={companiesLoading}
                    >
                        Add another
                    </Button>
                </Box> */}

                <Stack spacing={2.5}>
                    {form.affiliations.map((affiliation, index) => (
                        // <Box
                        //     key={`${affiliation.id ?? 'new'}-${index}`}
                        //     display="flex"
                        //     gap={1.5}
                        //     alignItems="flex-start"
                        //     flexDirection={{ xs: 'column', md: 'row' }}
                        // >
                        //     <Autocomplete
                        //         options={companyOptions}
                        //         getOptionLabel={(option) =>
                        //             typeof option === 'string' ? option : option.name
                        //         }
                        //         isOptionEqualToValue={(option, value) => option.id === value.id}
                        //         value={
                        //             affiliation.companyId
                        //                 ? companyOptions.find(
                        //                     (c) => c.id === affiliation.companyId
                        //                 ) ?? null
                        //                 : null
                        //         }
                        //         onChange={(_, newValue) =>
                        //             onAffiliationChange(index, {
                        //                 companyId: newValue?.id ?? null,
                        //                 companyName: newValue?.name ?? '',
                        //             })
                        //         }
                        //         sx={{ flex: 1, width: '100%' }}
                        //         renderInput={(params) => (
                        //             <TextField {...params} label="Company" />
                        //         )}
                        //     />

                        //     <Autocomplete
                        //         freeSolo
                        //         selectOnFocus
                        //         clearOnBlur
                        //         handleHomeEndKeys
                        //         options={ROLE_OPTIONS}
                        //         value={affiliation.role || ""}
                        //         inputValue={affiliation.role || ""}
                        //         onChange={(_, newValue) =>
                        //             onAffiliationChange(index, {
                        //                 role: typeof newValue === "string" ? newValue : String(newValue ?? ""),
                        //             })
                        //         }
                        //         onInputChange={(_, newInputValue) =>
                        //             onAffiliationChange(index, { role: newInputValue })
                        //         }
                        //         sx={{ flex: 1, width: "100%" }}
                        //         renderInput={(params) => (
                        //             <TextField
                        //                 {...params}
                        //                 label="Role"
                        //                 placeholder="Select a role or type your own"
                        //             />
                        //         )}
                        //     />

                        //     <IconButton
                        //         onClick={() => onRemoveAffiliation(index)}
                        //         color="error"
                        //         sx={{ mt: { xs: 0, md: 1 } }}
                        //     >
                        //         <DeleteOutlineRounded />
                        //     </IconButton>
                        // </Box>
                        <Box
                            key={`${affiliation.id ?? 'new'}-${index}`}
                            display="flex"
                            gap={1.5}
                            flexDirection={{ xs: 'column', md: 'row' }}
                            sx={{
                                p: 1.5,
                                borderRadius: 1,
                                bgcolor: 'grey.50',
                                border: '1px solid',
                                borderColor: 'grey.200'
                            }}
                        >
                            <Box flex={1}>
                                <Typography variant="caption" color="text.secondary">
                                    Company
                                </Typography>
                                <Typography variant="body2" fontWeight={500}>
                                    {affiliation.companyName ||
                                        companyOptions.find(c => c.id === affiliation.companyId)?.name ||
                                        '-'}
                                </Typography>
                            </Box>

                            <Box flex={1}>
                                <Typography variant="caption" color="text.secondary">
                                    Role
                                </Typography>
                                <Typography variant="body2" fontWeight={500}>
                                    {affiliation.role || '-'}
                                </Typography>
                            </Box>
                        </Box>
                    ))}

                    {form.affiliations.length === 0 ? (
                        <Paper
                            variant="outlined"
                            sx={{
                                p: 2,
                                borderRadius: 2,
                                bgcolor: 'grey.50',
                                borderStyle: 'dashed',
                            }}
                        >
                            <Typography variant="body2" color="text.secondary">
                                No affiliations added yet.
                            </Typography>
                        </Paper>
                    ) : null}
                </Stack>
            </SectionCard>

            <SectionCard
                title="Expertise"
                subtitle="Add keywords to help projects and partners find you."
            >
                <TagAutocomplete
                    value={profile.expertiseTags}
                    options={EXPERTISE_OPTIONS}
                    placeholder="Select or type to add..."
                    onChange={(value) => onUpdateProfile('expertiseTags', value)}
                />
            </SectionCard>

            <SectionCard title="Services You Can Support">
                <TagAutocomplete
                    value={profile.serviceOfferings}
                    options={SERVICE_OPTIONS}
                    placeholder="Select or type to add..."
                    onChange={(value) => onUpdateProfile('serviceOfferings', value)}
                />
            </SectionCard>

            <SectionCard title="Sectors of Focus">
                <TagAutocomplete
                    value={profile.sectors}
                    options={SECTOR_OPTIONS}
                    placeholder="Select or type to add..."
                    onChange={(value) => onUpdateProfile('sectors', value)}
                />
            </SectionCard>

            <SectionCard title="Standards and Methodologies">
                <TagAutocomplete
                    value={profile.standards}
                    options={STANDARD_OPTIONS}
                    placeholder="Select or type to add..."
                    onChange={(value) => onUpdateProfile('standards', value)}
                />
            </SectionCard>

            <SectionCard title="Languages">
                <TagAutocomplete
                    value={profile.languages}
                    options={LANGUAGE_OPTIONS}
                    placeholder="Search and select languages..."
                    onChange={(value) => onUpdateProfile('languages', value)}
                />
            </SectionCard>

            <Paper
                variant="outlined"
                sx={{
                    p: 3,
                    borderRadius: 2,
                    borderColor: 'error.200',
                    bgcolor: 'error.50',
                }}
            >
                <Typography variant="h6" fontWeight="bold" color="error.main" mb={2}>
                    Danger Zone
                </Typography>

                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Box>
                        <Typography variant="subtitle2" fontWeight="bold">
                            Sign out
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            Sign out of your account on this device
                        </Typography>
                    </Box>

                    <Button
                        variant="outlined"
                        color="inherit"
                        startIcon={<LogoutRounded sx={{ fontSize: 18 }} />}
                        onClick={onLogout}
                    >
                        Log out
                    </Button>
                </Box>

                <Divider sx={{ my: 2 }} />

                <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Box>
                        <Typography variant="subtitle2" fontWeight="bold" color="error.main">
                            Delete Account
                        </Typography>
                        <Typography variant="caption" color="error.main">
                            Permanently delete your account and all data
                        </Typography>
                    </Box>

                    <Button
                        variant="contained"
                        color="error"
                        startIcon={<DeleteOutlineRounded sx={{ fontSize: 18 }} />}
                        onClick={onDeleteDialogOpen}
                    >
                        Delete Account
                    </Button>
                </Box>
            </Paper>

            <Dialog open={deleteDialogOpen} onClose={onDeleteDialogClose} maxWidth="sm" fullWidth>
                <DialogTitle>Delete Account</DialogTitle>
                <DialogContent>
                    <DialogContentText mb={2}>
                        This action is permanent and cannot be undone.
                    </DialogContentText>
                    <TextField
                        fullWidth
                        size="small"
                        placeholder="DELETE"
                        value={deleteConfirmText}
                        onChange={(e) => onDeleteConfirmTextChange(e.target.value)}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={onDeleteDialogClose}>Cancel</Button>
                    <Button
                        variant="contained"
                        color="error"
                        disabled={deleteConfirmText !== 'DELETE'}
                        onClick={onDeleteAccount}
                    >
                        Permanently Delete Account
                    </Button>
                </DialogActions>
            </Dialog>

            <Slide direction="up" in={hasChanges} mountOnEnter unmountOnExit>
                <Paper
                    elevation={8}
                    sx={{
                        position: 'fixed',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        p: 2,
                        display: 'flex',
                        justifyContent: 'flex-end',
                        gap: 2,
                        bgcolor: 'white',
                        borderTop: 1,
                        borderColor: 'grey.200',
                        zIndex: 1100,
                    }}
                >
                    <Box
                        sx={{
                            maxWidth: 900,
                            width: '100%',
                            mx: 'auto',
                            display: 'flex',
                            justifyContent: 'flex-end',
                            gap: 2,
                        }}
                    >
                        <Button variant="outlined" onClick={onCancel} disabled={saving}>
                            Cancel
                        </Button>
                        <Button variant="contained" onClick={onSave} disabled={saving}>
                            {saving ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </Box>
                </Paper>
            </Slide>

            <Snackbar open={snackbarOpen} autoHideDuration={4000} onClose={onSnackbarClose}>
                <Alert severity={snackbarSeverity} onClose={onSnackbarClose}>
                    {snackbarMessage}
                </Alert>
            </Snackbar>
        </Box>
    );
}