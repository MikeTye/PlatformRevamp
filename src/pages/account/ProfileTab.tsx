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
    IconButton,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    Slide,
    Snackbar,
    Stack,
    TextField,
    Typography,
} from '@mui/material';
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
};

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

    return (
        <Box maxWidth={800} pb={hasChanges ? 10 : 0}>
            <Paper variant="outlined" sx={{ p: 3, mb: 3, borderRadius: 2 }}>
                <Typography variant="h6" fontWeight="bold" mb={3}>
                    Personal Information
                </Typography>

                <Box display="flex" gap={3} mb={3}>
                    <Box display="flex" flexDirection="column" alignItems="center" gap={1.5}>
                        <Avatar sx={{ width: 88, height: 88, bgcolor: 'grey.200', color: 'grey.500' }}>
                            <PersonOutlineRounded sx={{ fontSize: 40 }} />
                        </Avatar>

                        <Button
                            variant="outlined"
                            size="small"
                            startIcon={<CloudUploadRounded sx={{ fontSize: 16 }} />}
                            sx={{ textTransform: 'none', fontSize: '0.75rem' }}
                            disabled
                        >
                            Upload
                        </Button>
                    </Box>

                    <Box flex={1}>
                        <Stack spacing={2.5}>
                            <TextField
                                fullWidth
                                label="Full Name"
                                value={form.profile.fullName}
                                onChange={(e) => onUpdateProfile('fullName', e.target.value)}
                                required
                            />

                            <TextField
                                fullWidth
                                label="Email"
                                value={form.user.email}
                                disabled
                                helperText="Email is managed by authentication"
                            />

                            <Box display="flex" gap={1.5}>
                                <FormControl sx={{ minWidth: 170 }}>
                                    <InputLabel>Code</InputLabel>
                                    <Select
                                        value={countryCode}
                                        label="Code"
                                        onChange={(e) => onHandlePhoneCodeChange(String(e.target.value))}
                                        renderValue={() => (
                                            <Box display="flex" alignItems="center" gap={1}>
                                                <span>{countryFlag}</span>
                                                <span>{countryCode}</span>
                                            </Box>
                                        )}
                                    >
                                        {countryCodeOptions.map((item) => (
                                            <MenuItem key={`${item.iso}-${item.code}`} value={item.dialCode}>
                                                <Box display="flex" alignItems="center" gap={1.5} width="100%">
                                                    <span style={{ fontSize: '1.1rem' }}>{item.flag}</span>
                                                    <span>{item.country}</span>
                                                    <Typography variant="body2" color="text.secondary" sx={{ ml: 'auto' }}>
                                                        {item.dialCode}
                                                    </Typography>
                                                </Box>
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>

                                <TextField
                                    fullWidth
                                    label="Phone"
                                    value={form.profile.phoneNumber}
                                    onChange={(e) => onUpdateProfile('phoneNumber', e.target.value)}
                                    placeholder="+60 12-345 6789"
                                />
                            </Box>

                            <TextField
                                fullWidth
                                label="Headline"
                                value={form.profile.headline}
                                onChange={(e) => onUpdateProfile('headline', e.target.value)}
                            />

                            <TextField
                                fullWidth
                                label="Job Title"
                                value={form.profile.jobTitle}
                                onChange={(e) => onUpdateProfile('jobTitle', e.target.value)}
                            />
                        </Stack>
                    </Box>
                </Box>
            </Paper>

            <Paper variant="outlined" sx={{ p: 3, mb: 3, borderRadius: 2 }}>
                <Typography variant="h6" fontWeight="bold" mb={1}>
                    Professional Summary
                </Typography>
                <Typography variant="body2" color="text.secondary" mb={2}>
                    Short professional summary to help collaborators understand your background and focus.
                </Typography>

                <TextField
                    fullWidth
                    multiline
                    minRows={4}
                    maxRows={8}
                    value={form.profile.bio}
                    onChange={(e) => onUpdateProfile('bio', e.target.value)}
                />
            </Paper>

            <Paper variant="outlined" sx={{ p: 3, mb: 3, borderRadius: 2 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="h6" fontWeight="bold">
                        Company Affiliation
                    </Typography>

                    <Button
                        startIcon={<AddRounded />}
                        size="small"
                        onClick={onAddAffiliation}
                        sx={{ textTransform: 'none' }}
                        disabled={companiesLoading}
                    >
                        Add another
                    </Button>
                </Box>

                <Stack spacing={2.5}>
                    {form.affiliations.map((affiliation, index) => (
                        <Box key={`${affiliation.id ?? 'new'}-${index}`} display="flex" gap={1.5} alignItems="flex-start">
                            <Autocomplete
                                options={companyOptions}
                                getOptionLabel={(option) => (typeof option === 'string' ? option : option.name)}
                                isOptionEqualToValue={(option, value) => option.id === value.id}
                                value={
                                    affiliation.companyId
                                        ? companyOptions.find((c) => c.id === affiliation.companyId) ?? null
                                        : null
                                }
                                onChange={(_, newValue) =>
                                    onAffiliationChange(index, {
                                        companyId: newValue?.id ?? null,
                                        companyName: newValue?.name ?? '',
                                    })
                                }
                                sx={{ flex: 1 }}
                                renderInput={(params) => <TextField {...params} label="Company" />}
                            />

                            <Autocomplete
                                freeSolo
                                options={ROLE_OPTIONS}
                                value={affiliation.role}
                                onChange={(_, newValue) =>
                                    onAffiliationChange(index, { role: String(newValue ?? '') })
                                }
                                onInputChange={(_, newInputValue) =>
                                    onAffiliationChange(index, { role: newInputValue })
                                }
                                sx={{ flex: 1 }}
                                renderInput={(params) => <TextField {...params} label="Role" />}
                            />

                            <IconButton onClick={() => onRemoveAffiliation(index)} color="error" sx={{ mt: 1 }}>
                                <DeleteOutlineRounded />
                            </IconButton>
                        </Box>
                    ))}
                </Stack>
            </Paper>

            <Paper variant="outlined" sx={{ p: 3, mb: 3, borderRadius: 2 }}>
                <Typography variant="h6" fontWeight="bold" mb={2}>
                    Expertise
                </Typography>
                <Autocomplete
                    multiple
                    freeSolo
                    options={EXPERTISE_OPTIONS}
                    value={form.profile.expertiseTags}
                    onChange={(_, newValue) => onUpdateProfile('expertiseTags', newValue)}
                    renderTags={(value, getTagProps) =>
                        value.map((option, index) => (
                            <Chip
                                variant="outlined"
                                label={option}
                                {...getTagProps({ index })}
                                key={`${option}-${index}`}
                            />
                        ))
                    }
                    renderInput={(params) => <TextField {...params} placeholder="Select or type to add..." />}
                />
            </Paper>

            <Paper variant="outlined" sx={{ p: 3, mb: 3, borderRadius: 2 }}>
                <Typography variant="h6" fontWeight="bold" mb={2}>
                    Services You Can Support
                </Typography>
                <Autocomplete
                    multiple
                    freeSolo
                    options={SERVICE_OPTIONS}
                    value={form.profile.serviceOfferings}
                    onChange={(_, newValue) => onUpdateProfile('serviceOfferings', newValue)}
                    renderTags={(value, getTagProps) =>
                        value.map((option, index) => (
                            <Chip
                                variant="outlined"
                                label={option}
                                {...getTagProps({ index })}
                                key={`${option}-${index}`}
                            />
                        ))
                    }
                    renderInput={(params) => <TextField {...params} placeholder="Select or type to add..." />}
                />
            </Paper>

            <Paper variant="outlined" sx={{ p: 3, mb: 3, borderRadius: 2 }}>
                <Typography variant="h6" fontWeight="bold" mb={2}>
                    Sectors of Focus
                </Typography>
                <Autocomplete
                    multiple
                    freeSolo
                    options={SECTOR_OPTIONS}
                    value={form.profile.sectors}
                    onChange={(_, newValue) => onUpdateProfile('sectors', newValue)}
                    renderTags={(value, getTagProps) =>
                        value.map((option, index) => (
                            <Chip
                                variant="outlined"
                                label={option}
                                {...getTagProps({ index })}
                                key={`${option}-${index}`}
                            />
                        ))
                    }
                    renderInput={(params) => <TextField {...params} placeholder="Select or type to add..." />}
                />
            </Paper>

            <Paper variant="outlined" sx={{ p: 3, mb: 3, borderRadius: 2 }}>
                <Typography variant="h6" fontWeight="bold" mb={2}>
                    Standards and Methodologies
                </Typography>
                <Autocomplete
                    multiple
                    freeSolo
                    options={STANDARD_OPTIONS}
                    value={form.profile.standards}
                    onChange={(_, newValue) => onUpdateProfile('standards', newValue)}
                    renderTags={(value, getTagProps) =>
                        value.map((option, index) => (
                            <Chip
                                variant="outlined"
                                label={option}
                                {...getTagProps({ index })}
                                key={`${option}-${index}`}
                            />
                        ))
                    }
                    renderInput={(params) => <TextField {...params} placeholder="Select or type to add..." />}
                />
            </Paper>

            <Paper variant="outlined" sx={{ p: 3, mb: 3, borderRadius: 2 }}>
                <Typography variant="h6" fontWeight="bold" mb={2}>
                    Languages
                </Typography>
                <Autocomplete
                    multiple
                    freeSolo
                    options={LANGUAGE_OPTIONS}
                    value={form.profile.languages}
                    onChange={(_, newValue) => onUpdateProfile('languages', newValue)}
                    renderTags={(value, getTagProps) =>
                        value.map((option, index) => (
                            <Chip
                                variant="outlined"
                                label={option}
                                {...getTagProps({ index })}
                                key={`${option}-${index}`}
                            />
                        ))
                    }
                    renderInput={(params) => <TextField {...params} placeholder="Search and select languages..." />}
                />
            </Paper>

            <Paper variant="outlined" sx={{ p: 3, mb: 3, borderRadius: 2 }}>
                <Typography variant="h6" fontWeight="bold" mb={2}>
                    Additional Details
                </Typography>

                <Stack spacing={2.5}>
                    <TextField
                        fullWidth
                        label="Country"
                        value={form.profile.country}
                        onChange={(e) => onUpdateProfile('country', e.target.value)}
                    />

                    <TextField
                        fullWidth
                        label="City"
                        value={form.profile.city}
                        onChange={(e) => onUpdateProfile('city', e.target.value)}
                    />

                    <FormControl fullWidth>
                        <InputLabel>Timezone</InputLabel>
                        <Select
                            value={form.profile.timezone}
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

                    <TextField
                        fullWidth
                        label="Personal Website"
                        value={form.profile.personalWebsite}
                        onChange={(e) => onUpdateProfile('personalWebsite', e.target.value)}
                    />

                    <TextField
                        fullWidth
                        label="LinkedIn URL"
                        value={form.profile.linkedinUrl}
                        onChange={(e) => onUpdateProfile('linkedinUrl', e.target.value)}
                    />

                    <TextField
                        fullWidth
                        label="Portfolio URL"
                        value={form.profile.portfolioUrl}
                        onChange={(e) => onUpdateProfile('portfolioUrl', e.target.value)}
                    />
                </Stack>
            </Paper>

            <Paper variant="outlined" sx={{ p: 3, borderRadius: 2, borderColor: 'error.200', bgcolor: 'error.50' }}>
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
                            maxWidth: 800,
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
                <Alert severity={snackbarSeverity} onClose={onSnackbarClose} variant="filled">
                    {snackbarMessage}
                </Alert>
            </Snackbar>
        </Box>
    );
}