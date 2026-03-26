// Enhanced Sidebar Editor Component
interface SidebarEditorProps {
    open: boolean;
    onClose: () => void;
    section: string;
    currentStage: ProjectStage;
    onStageChange: (stage: ProjectStage) => void;
    editingItem?: any;
    onSave?: (section: string, data: any, isEditing: boolean) => void;
    sectionVisibility: Record<string, ProjectVisibility>;
    onSectionVisibilityChange: (section: string, v: ProjectVisibility) => void;
    projectVisibility: ProjectVisibility;
    onProjectVisibilityChange: (v: ProjectVisibility) => void;
}
function SidebarEditor({
    open,
    onClose,
    section,
    currentStage,
    onStageChange,
    editingItem,
    onSave,
    sectionVisibility,
    onSectionVisibilityChange,
    projectVisibility,
    onProjectVisibilityChange
}: SidebarEditorProps) {
    const [problemText, setProblemText] = useState('');
    const [approachText, setApproachText] = useState('');
    const [benefitsText, setBenefitsText] = useState('');
    const [updateTitle, setUpdateTitle] = useState('');
    const [updateDesc, setUpdateDesc] = useState('');
    const [visibility, setVisibility] = useState('Public');
    const [docName, setDocName] = useState('');
    const [docType, setDocType] = useState('');
    const [docStatus, setDocStatus] = useState('Draft');
    const [mediaCaption, setMediaCaption] = useState('');
    const [country, setCountry] = useState('Malaysia');
    const [region, setRegion] = useState('Sarawak');
    const [teamRole, setTeamRole] = useState<'company' | 'person'>('company');
    const [teamName, setTeamName] = useState('');
    const [teamProjectRole, setTeamProjectRole] = useState<string | null>(null);
    const [teamSearch, setTeamSearch] = useState('');
    const [teamSelectedPlatform, setTeamSelectedPlatform] = useState<any>(null);
    const [teamManualMode, setTeamManualMode] = useState(false);
    const [oppType, setOppType] = useState('Financing');
    const [oppDesc, setOppDesc] = useState('');
    const [oppUrgent, setOppUrgent] = useState(false);
    const [settingsTab, setSettingsTab] = useState(0);
    // Reset/populate form when opening or when editingItem changes
    useEffect(() => {
        if (!open) return;
        if (section === 'document') {
            if (editingItem) {
                setDocName(editingItem.name || '');
                setDocType(editingItem.type || '');
                setDocStatus(editingItem.status || 'Draft');
            } else {
                setDocName('');
                setDocType('');
                setDocStatus('Draft');
            }
        } else if (section === 'media') {
            if (editingItem) {
                setMediaCaption(editingItem.caption || '');
            } else {
                setMediaCaption('');
            }
        } else if (section === 'update') {
            if (editingItem) {
                setUpdateTitle(editingItem.title || '');
                setUpdateDesc(editingItem.desc || '');
            } else {
                setUpdateTitle('');
                setUpdateDesc('');
            }
        } else if (section === 'team') {
            if (editingItem) {
                setTeamName(editingItem.name || '');
                setTeamProjectRole(editingItem.type || null);
                setTeamRole(editingItem.partnerKind || 'company');
                setTeamSearch('');
                setTeamSelectedPlatform(
                    editingItem.platformId ?
                        {
                            id: editingItem.platformId,
                            name: editingItem.name
                        } :
                        null
                );
                setTeamManualMode(!editingItem.platformId);
            } else {
                setTeamName('');
                setTeamProjectRole(null);
                setTeamRole('company');
                setTeamSearch('');
                setTeamSelectedPlatform(null);
                setTeamManualMode(false);
            }
        } else if (section === 'opportunities') {
            if (editingItem) {
                setOppType(editingItem.type || 'Financing');
                setOppDesc(editingItem.desc || '');
                setOppUrgent(editingItem.urgent || false);
            } else {
                setOppType('Financing');
                setOppDesc('');
                setOppUrgent(false);
            }
        } else if (section === 'story') {
            setProblemText(
                "Sarawak's peatlands have been severely degraded by decades of drainage for agriculture and logging. Drained peatlands release massive amounts of stored carbon and are highly vulnerable to fires."
            );
            setApproachText(
                'This initiative will block drainage canals to rewet approximately 15,000 hectares of degraded peatland, working with local communities to establish sustainable paludiculture systems.'
            );
            setBenefitsText(
                'Climate mitigation through carbon sequestration, community livelihoods through sustainable agriculture, and biodiversity protection for endangered species including orangutans.'
            );
        } else if (section === 'location') {
            setCountry('Malaysia');
            setRegion('Sarawak');
        }
    }, [open, section, editingItem]);
    const renderContent = () => {
        switch (section) {
            case 'header':
                return (
                    <Stack spacing={3}>
                        <Box>
                            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                                Project Details
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Basic information about this project.
                            </Typography>
                        </Box>
                        <TextField
                            label="Project Name"
                            fullWidth
                            defaultValue="Sarawak Peatland Rewetting Initiative" />

                        <TextField
                            label="Short Description"
                            fullWidth
                            defaultValue="Restoring degraded tropical peatlands in Malaysian Borneo" />

                        <FormControl fullWidth>
                            <InputLabel>Visibility</InputLabel>
                            <Select
                                value={visibility}
                                label="Visibility"
                                onChange={(e) => setVisibility(e.target.value)}>

                                <MenuItem value="Public">Public</MenuItem>
                                <MenuItem value="Private">Private</MenuItem>
                            </Select>
                        </FormControl>
                    </Stack>);

            case 'story':
                return (
                    <Stack spacing={3}>
                        <Box>
                            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                                Project Story
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Tell the story of your project.
                            </Typography>
                        </Box>
                        <TextField
                            label="Problem and Context"
                            fullWidth
                            multiline
                            minRows={3}
                            value={problemText}
                            onChange={(e) => setProblemText(e.target.value)} />

                        <TextField
                            label="Project Approach"
                            fullWidth
                            multiline
                            minRows={3}
                            value={approachText}
                            onChange={(e) => setApproachText(e.target.value)} />

                        <TextField
                            label="Expected Benefits"
                            fullWidth
                            multiline
                            minRows={3}
                            value={benefitsText}
                            onChange={(e) => setBenefitsText(e.target.value)} />

                    </Stack>);

            case 'media':
                return (
                    <Stack spacing={3}>
                        <Box>
                            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                                {editingItem ? 'Edit Media' : 'Add Media'}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Upload photos and videos of the project.
                            </Typography>
                        </Box>
                        {!editingItem &&
                            <Paper
                                variant="outlined"
                                sx={{
                                    p: 3,
                                    borderStyle: 'dashed',
                                    textAlign: 'center',
                                    cursor: 'pointer'
                                }}
                                component="label">

                                <input type="file" hidden accept="image/*,video/*" />
                                <ImageRounded
                                    sx={{
                                        fontSize: 32,
                                        color: 'grey.400',
                                        mb: 1
                                    }} />

                                <Typography variant="body2" color="text.secondary">
                                    Click to upload or drag and drop
                                </Typography>
                                <Typography variant="caption" color="text.disabled">
                                    PNG, JPG, MP4 up to 50MB
                                </Typography>
                            </Paper>
                        }
                        <TextField
                            label="Caption"
                            fullWidth
                            value={mediaCaption}
                            onChange={(e) => setMediaCaption(e.target.value)}
                            placeholder="Describe this media..." />

                    </Stack>);

            case 'update':
                return (
                    <Stack spacing={3}>
                        <Box>
                            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                                {editingItem ? 'Edit Update' : 'Post Update'}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Share progress with followers.
                            </Typography>
                        </Box>
                        <TextField
                            label="Title"
                            fullWidth
                            value={updateTitle}
                            onChange={(e) => setUpdateTitle(e.target.value)}
                            placeholder="e.g., Baseline survey completed" />

                        <TextField
                            label="Description"
                            fullWidth
                            multiline
                            minRows={4}
                            value={updateDesc}
                            onChange={(e) => setUpdateDesc(e.target.value)}
                            placeholder="Share what's new..." />

                    </Stack>);

            case 'document':
                return (
                    <Stack spacing={3}>
                        <Box>
                            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                                {editingItem ? 'Edit Document' : 'Add Document'}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Upload project documents.
                            </Typography>
                        </Box>
                        {!editingItem &&
                            <Paper
                                variant="outlined"
                                sx={{
                                    p: 3,
                                    borderStyle: 'dashed',
                                    textAlign: 'center',
                                    cursor: 'pointer'
                                }}
                                component="label">

                                <input type="file" hidden />
                                <DescriptionRounded
                                    sx={{
                                        fontSize: 32,
                                        color: 'grey.400',
                                        mb: 1
                                    }} />

                                <Typography variant="body2" color="text.secondary">
                                    Click to upload or drag and drop
                                </Typography>
                                <Typography variant="caption" color="text.disabled">
                                    PDF, DOCX, XLSX up to 25MB
                                </Typography>
                            </Paper>
                        }
                        <TextField
                            label="Document Name"
                            fullWidth
                            value={docName}
                            onChange={(e) => setDocName(e.target.value)} />

                        <FormControl fullWidth>
                            <InputLabel>Document Type</InputLabel>
                            <Select
                                value={docType}
                                label="Document Type"
                                onChange={(e) => setDocType(e.target.value)}>

                                {documentTypes.map((type) =>
                                    <MenuItem key={type} value={type}>
                                        {type}
                                    </MenuItem>
                                )}
                            </Select>
                        </FormControl>
                        <FormControl fullWidth>
                            <InputLabel>Status</InputLabel>
                            <Select
                                value={docStatus}
                                label="Status"
                                onChange={(e) => setDocStatus(e.target.value)}>

                                <MenuItem value="Draft">Draft</MenuItem>
                                <MenuItem value="Final">Final</MenuItem>
                            </Select>
                        </FormControl>
                    </Stack>);

            case 'location':
                return (
                    <Stack spacing={3}>
                        <Box>
                            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                                Location
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Where is the project located?
                            </Typography>
                        </Box>
                        <FormControl fullWidth>
                            <InputLabel>Country</InputLabel>
                            <Select
                                value={country}
                                label="Country"
                                onChange={(e) => setCountry(e.target.value)}>

                                {[
                                    'Indonesia',
                                    'Malaysia',
                                    'Vietnam',
                                    'Thailand',
                                    'Philippines',
                                    'Cambodia'].
                                    map((c) =>
                                        <MenuItem key={c} value={c}>
                                            {c}
                                        </MenuItem>
                                    )}
                            </Select>
                        </FormControl>
                        <TextField
                            label="Region"
                            fullWidth
                            value={region}
                            onChange={(e) => setRegion(e.target.value)}
                            placeholder="e.g., Sarawak" />

                    </Stack>);

            case 'stage':
                return (
                    <Stack spacing={3}>
                        <Box>
                            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                                Project Stage
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Update the current stage of the project.
                            </Typography>
                        </Box>
                        <FormControl fullWidth>
                            <InputLabel>Current Stage</InputLabel>
                            <Select
                                value={currentStage}
                                label="Current Stage"
                                onChange={(e) => onStageChange(e.target.value as ProjectStage)}>

                                {stageLabels.map((stage) =>
                                    <MenuItem key={stage} value={stage}>
                                        {stage}
                                    </MenuItem>
                                )}
                            </Select>
                        </FormControl>
                        <Typography variant="caption" color="text.secondary">
                            {stageDescriptions[currentStage]}
                        </Typography>
                    </Stack>);

            case 'team':
                return (
                    <Stack spacing={3}>
                        <Box>
                            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                                {editingItem ? 'Edit Project Partner' : 'Add Project Partner'}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Add companies or individuals working on this project.
                            </Typography>
                        </Box>
                        <ToggleButtonGroup
                            value={teamRole}
                            exclusive
                            onChange={(_, v) => {
                                if (v) {
                                    setTeamRole(v);
                                    setTeamSearch('');
                                    setTeamSelectedPlatform(null);
                                    setTeamManualMode(false);
                                }
                            }}
                            size="small"
                            fullWidth>

                            <ToggleButton
                                value="company"
                                sx={{
                                    textTransform: 'none',
                                    flex: 1
                                }}>

                                Company
                            </ToggleButton>
                            <ToggleButton
                                value="person"
                                sx={{
                                    textTransform: 'none',
                                    flex: 1
                                }}>

                                Individual
                            </ToggleButton>
                        </ToggleButtonGroup>

                        {/* Selected platform partner */}
                        {teamSelectedPlatform && !teamManualMode ?
                            <Paper
                                variant="outlined"
                                sx={{
                                    p: 1.5,
                                    borderRadius: 1.5,
                                    bgcolor: 'grey.50'
                                }}>

                                <Box display="flex" alignItems="center" gap={1.5}>
                                    <Avatar
                                        sx={{
                                            width: 36,
                                            height: 36,
                                            bgcolor:
                                                teamRole === 'person' ? 'primary.100' : 'grey.200',
                                            borderRadius: teamRole === 'company' ? 1 : '50%',
                                            fontSize: '0.75rem',
                                            color: 'text.primary'
                                        }}>

                                        {teamRole === 'person' ?
                                            teamSelectedPlatform.initials ||
                                            teamSelectedPlatform.name.
                                                split(' ').
                                                map((w: string) => w[0]).
                                                join('') :

                                            <BusinessRounded
                                                sx={{
                                                    fontSize: 18,
                                                    color: 'grey.500'
                                                }} />

                                        }
                                    </Avatar>
                                    <Box flex={1} minWidth={0}>
                                        <Box display="flex" alignItems="center" gap={0.5}>
                                            <Typography
                                                variant="body2"
                                                fontWeight="medium"
                                                color="text.primary"
                                                noWrap>

                                                {teamSelectedPlatform.name}
                                            </Typography>
                                            {teamSelectedPlatform.verified &&
                                                <Chip
                                                    label="On platform"
                                                    size="small"
                                                    sx={{
                                                        height: 18,
                                                        fontSize: '0.6rem',
                                                        bgcolor: 'teal',
                                                        color: 'white'
                                                    }} />

                                            }
                                        </Box>
                                        <Typography variant="caption" color="text.secondary">
                                            {teamSelectedPlatform.role}
                                        </Typography>
                                    </Box>
                                    <IconButton
                                        size="small"
                                        onClick={() => {
                                            setTeamSelectedPlatform(null);
                                            setTeamSearch('');
                                        }}>

                                        <CloseRounded
                                            sx={{
                                                fontSize: 16
                                            }} />

                                    </IconButton>
                                </Box>
                            </Paper> :
                            !teamManualMode /* Search field */ ?
                                <Box>
                                    <TextField
                                        fullWidth
                                        size="small"
                                        placeholder={
                                            teamRole === 'company' ?
                                                'Search companies...' :
                                                'Search people...'
                                        }
                                        value={teamSearch}
                                        onChange={(e) => setTeamSearch(e.target.value)}
                                        InputProps={{
                                            startAdornment:
                                                <InputAdornment position="start">
                                                    <SearchRounded
                                                        sx={{
                                                            fontSize: 18,
                                                            color: 'grey.400'
                                                        }} />

                                                </InputAdornment>,

                                            endAdornment: teamSearch ?
                                                <InputAdornment position="end">
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => setTeamSearch('')}>

                                                        <CloseRounded
                                                            sx={{
                                                                fontSize: 14
                                                            }} />

                                                    </IconButton>
                                                </InputAdornment> :
                                                null
                                        }} />

                                    {/* Search results */}
                                    {teamSearch.length > 0 &&
                                        (() => {
                                            const pool =
                                                teamRole === 'company' ?
                                                    mockPlatformCompanies :
                                                    mockPlatformUsers;
                                            const results = pool.filter((p) =>
                                                p.name.toLowerCase().includes(teamSearch.toLowerCase())
                                            );
                                            return (
                                                <Paper
                                                    variant="outlined"
                                                    sx={{
                                                        mt: 0.5,
                                                        borderRadius: 1.5,
                                                        overflow: 'hidden',
                                                        maxHeight: 220,
                                                        overflowY: 'auto'
                                                    }}>

                                                    {results.length > 0 ?
                                                        results.map((result) =>
                                                            <Box
                                                                key={result.id}
                                                                onClick={() => {
                                                                    setTeamSelectedPlatform(result);
                                                                    setTeamProjectRole(result.role);
                                                                    setTeamSearch('');
                                                                }}
                                                                sx={{
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    gap: 1.5,
                                                                    px: 1.5,
                                                                    py: 1,
                                                                    cursor: 'pointer',
                                                                    '&:hover': {
                                                                        bgcolor: 'grey.50'
                                                                    },
                                                                    borderBottom: 1,
                                                                    borderColor: 'grey.100'
                                                                }}>

                                                                <Avatar
                                                                    sx={{
                                                                        width: 28,
                                                                        height: 28,
                                                                        bgcolor:
                                                                            teamRole === 'person' ?
                                                                                'primary.100' :
                                                                                'grey.200',
                                                                        borderRadius:
                                                                            teamRole === 'company' ? 0.5 : '50%',
                                                                        fontSize: '0.65rem',
                                                                        color: 'text.primary'
                                                                    }}>

                                                                    {teamRole === 'person' ?
                                                                        (result as any).initials :

                                                                        <BusinessRounded
                                                                            sx={{
                                                                                fontSize: 14,
                                                                                color: 'grey.500'
                                                                            }} />

                                                                    }
                                                                </Avatar>
                                                                <Box flex={1} minWidth={0}>
                                                                    <Box
                                                                        display="flex"
                                                                        alignItems="center"
                                                                        gap={0.5}>

                                                                        <Typography
                                                                            variant="caption"
                                                                            fontWeight="medium"
                                                                            color="text.primary"
                                                                            noWrap>

                                                                            {result.name}
                                                                        </Typography>
                                                                        {result.verified &&
                                                                            <Chip
                                                                                label="On platform"
                                                                                size="small"
                                                                                sx={{
                                                                                    height: 16,
                                                                                    fontSize: '0.55rem',
                                                                                    bgcolor: 'teal',
                                                                                    color: 'white'
                                                                                }} />

                                                                        }
                                                                    </Box>
                                                                    <Typography
                                                                        variant="caption"
                                                                        color="text.disabled"
                                                                        sx={{
                                                                            fontSize: '0.65rem'
                                                                        }}>

                                                                        {result.role}
                                                                    </Typography>
                                                                </Box>
                                                            </Box>
                                                        ) :

                                                        <Box px={1.5} py={1.5}>
                                                            <Typography
                                                                variant="caption"
                                                                color="text.secondary">

                                                                No results found
                                                            </Typography>
                                                        </Box>
                                                    }
                                                    <Box
                                                        onClick={() => {
                                                            setTeamManualMode(true);
                                                            setTeamName(teamSearch);
                                                            setTeamSearch('');
                                                        }}
                                                        sx={{
                                                            px: 1.5,
                                                            py: 1,
                                                            cursor: 'pointer',
                                                            bgcolor: 'grey.50',
                                                            '&:hover': {
                                                                bgcolor: 'grey.100'
                                                            },
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: 1
                                                        }}>

                                                        <AddRounded
                                                            sx={{
                                                                fontSize: 14,
                                                                color: 'text.secondary'
                                                            }} />

                                                        <Typography variant="caption" color="text.secondary">
                                                            Not on platform? Add manually
                                                        </Typography>
                                                    </Box>
                                                </Paper>);

                                        })()}
                                    <Button
                                        size="small"
                                        onClick={() => setTeamManualMode(true)}
                                        sx={{
                                            mt: 1,
                                            textTransform: 'none',
                                            color: 'text.secondary',
                                            fontSize: '0.75rem'
                                        }}>

                                        + Add manually (not on platform)
                                    </Button>
                                </Box> /* Manual entry */ :

                                <Stack spacing={2}>
                                    <Box
                                        display="flex"
                                        alignItems="center"
                                        justifyContent="space-between">

                                        <Typography
                                            variant="caption"
                                            color="text.secondary"
                                            fontWeight="medium">

                                            Manual entry
                                        </Typography>
                                        <Button
                                            size="small"
                                            onClick={() => {
                                                setTeamManualMode(false);
                                                setTeamName('');
                                            }}
                                            sx={{
                                                textTransform: 'none',
                                                fontSize: '0.7rem'
                                            }}>

                                            Search instead
                                        </Button>
                                    </Box>
                                    <TextField
                                        label={teamRole === 'company' ? 'Company Name' : 'Full Name'}
                                        fullWidth
                                        value={teamName}
                                        onChange={(e) => setTeamName(e.target.value)}
                                        placeholder={
                                            teamRole === 'company' ?
                                                'e.g., Pachama' :
                                                'e.g., Jane Smith'
                                        } />

                                </Stack>
                        }

                        {/* Project Role — always shown once a partner is selected or in manual mode */}
                        {(teamSelectedPlatform || teamManualMode) &&
                            <Autocomplete
                                options={projectRoles}
                                value={teamProjectRole}
                                onChange={(_, v) => setTeamProjectRole(v)}
                                freeSolo
                                renderInput={(params) =>
                                    <TextField
                                        {...params}
                                        label="Project Role"
                                        placeholder="e.g., MRV Provider" />

                                } />

                        }
                    </Stack>);

            case 'opportunities':
                return (
                    <Stack spacing={3}>
                        <Box>
                            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                                {editingItem ? 'Edit Opportunity' : 'Add Opportunity'}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                What does this project need?
                            </Typography>
                        </Box>
                        <FormControl fullWidth>
                            <InputLabel>Type</InputLabel>
                            <Select
                                value={oppType}
                                label="Type"
                                onChange={(e) => setOppType(e.target.value)}>

                                {[
                                    'Financing',
                                    'Technical Advisor',
                                    'Buyers',
                                    'MRV Provider',
                                    'Insurance',
                                    'Local Partners'].
                                    map((type) =>
                                        <MenuItem key={type} value={type}>
                                            {type}
                                        </MenuItem>
                                    )}
                            </Select>
                        </FormControl>
                        <TextField
                            label="Description"
                            fullWidth
                            multiline
                            minRows={2}
                            value={oppDesc}
                            onChange={(e) => setOppDesc(e.target.value)}
                            placeholder="Describe what you're looking for..." />

                        <FormControlLabel
                            control={
                                <Switch
                                    checked={oppUrgent}
                                    onChange={(e) => setOppUrgent(e.target.checked)} />

                            }
                            label={<Typography variant="body2">Mark as priority</Typography>} />

                    </Stack>);

            case 'registry':
                return (
                    <Stack spacing={3}>
                        <Box>
                            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                                Registry Information
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Link to carbon registry records.
                            </Typography>
                        </Box>
                        <TextField
                            label="Registry Platform"
                            fullWidth
                            defaultValue="Verra (VCS)" />

                        <TextField label="Methodology" fullWidth defaultValue="VM0027" />
                        <TextField
                            label="Registry ID"
                            fullWidth
                            placeholder="e.g., VCS-2847" />

                        <TextField
                            label="Registry URL"
                            fullWidth
                            placeholder="https://registry.verra.org/..." />

                    </Stack>);

            case 'impact':
                return (
                    <Stack spacing={3}>
                        <Box>
                            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                                Impact & Credits
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Update credit issuance and impact data.
                            </Typography>
                        </Box>
                        <TextField
                            label="Total Credits Issued"
                            fullWidth
                            placeholder="e.g., 58,000" />

                        <TextField
                            label="Annual Estimate"
                            fullWidth
                            placeholder="e.g., 62,000 tCO2e/yr" />

                        <TextField
                            label="Credit Period"
                            fullWidth
                            placeholder="e.g., 25 years" />

                    </Stack>);

            case 'settings':
                return (
                    <Stack spacing={0}>
                        {/* Tabs */}
                        <Tabs
                            value={settingsTab}
                            onChange={(_, v) => setSettingsTab(v)}
                            sx={{
                                borderBottom: 1,
                                borderColor: 'grey.200',
                                mb: 3,
                                mx: -3,
                                px: 3
                            }}>

                            <Tab
                                label="Visibility"
                                sx={{
                                    textTransform: 'none',
                                    fontWeight: 600,
                                    fontSize: '0.875rem'
                                }} />

                            <Tab
                                label="Team Access"
                                sx={{
                                    textTransform: 'none',
                                    fontWeight: 600,
                                    fontSize: '0.875rem'
                                }} />

                        </Tabs>

                        {/* Tab 0: Project Visibility */}
                        {settingsTab === 0 &&
                            <Stack spacing={3}>
                                <Box>
                                    <Typography
                                        variant="caption"
                                        fontWeight={600}
                                        color="text.secondary"
                                        sx={{
                                            textTransform: 'uppercase',
                                            letterSpacing: 0.5,
                                            display: 'block',
                                            mb: 1.5
                                        }}>

                                        Project Visibility
                                    </Typography>
                                    <Stack spacing={0.75}>
                                        {visibilityOptions.map((opt) => {
                                            const isSelected = projectVisibility === opt.value;
                                            return (
                                                <Box
                                                    key={opt.value}
                                                    onClick={() => onProjectVisibilityChange(opt.value)}
                                                    sx={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: 1.5,
                                                        p: 1.25,
                                                        borderRadius: 1.5,
                                                        cursor: 'pointer',
                                                        border: '1px solid',
                                                        borderColor: isSelected ? 'grey.800' : 'grey.200',
                                                        bgcolor: isSelected ? 'grey.50' : 'white',
                                                        '&:hover': {
                                                            bgcolor: 'grey.50',
                                                            borderColor: 'grey.400'
                                                        },
                                                        transition: 'all 0.15s'
                                                    }}>

                                                    <opt.icon
                                                        sx={{
                                                            fontSize: 18,
                                                            color: isSelected ? 'grey.800' : 'grey.400',
                                                            flexShrink: 0
                                                        }} />

                                                    <Box flex={1} minWidth={0}>
                                                        <Typography
                                                            variant="body2"
                                                            fontWeight={isSelected ? 700 : 500}
                                                            color="text.primary">

                                                            {opt.label}
                                                        </Typography>
                                                        <Typography
                                                            variant="caption"
                                                            color="text.secondary">

                                                            {opt.desc}
                                                        </Typography>
                                                    </Box>
                                                    {isSelected &&
                                                        <Box
                                                            sx={{
                                                                width: 8,
                                                                height: 8,
                                                                borderRadius: '50%',
                                                                bgcolor: 'grey.800',
                                                                flexShrink: 0
                                                            }} />

                                                    }
                                                </Box>);

                                        })}
                                    </Stack>
                                    <Typography
                                        variant="caption"
                                        color="text.disabled"
                                        sx={{
                                            mt: 1,
                                            display: 'block'
                                        }}>

                                        Section-level visibility can be set per section using the
                                        eye icon on each section header.
                                    </Typography>
                                </Box>
                            </Stack>
                        }

                        {/* Tab 1: Team Access */}
                        {settingsTab === 1 &&
                            <Stack spacing={3}>
                                <Box>
                                    <Typography
                                        variant="caption"
                                        fontWeight={600}
                                        color="text.secondary"
                                        sx={{
                                            textTransform: 'uppercase',
                                            letterSpacing: 0.5,
                                            display: 'block',
                                            mb: 0.5
                                        }}>

                                        Team Access
                                    </Typography>
                                    <Typography
                                        variant="caption"
                                        color="text.secondary"
                                        sx={{
                                            display: 'block',
                                            mb: 1.5
                                        }}>

                                        Control who can view and edit this project. You can invite
                                        external users who aren't company members.
                                    </Typography>

                                    {/* Members list */}
                                    <Stack spacing={1} mb={2}>
                                        {initialProjectPermissions.map((member) =>
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
                                                    bgcolor: 'white'
                                                }}>

                                                <Avatar
                                                    sx={{
                                                        width: 32,
                                                        height: 32,
                                                        bgcolor: member.isExternal ?
                                                            'primary.100' :
                                                            'grey.200',
                                                        fontSize: '0.7rem',
                                                        fontWeight: 600,
                                                        flexShrink: 0
                                                    }}>

                                                    {member.name.
                                                        split(' ').
                                                        map((n: string) => n[0]).
                                                        join('')}
                                                </Avatar>
                                                <Box flex={1} minWidth={0}>
                                                    <Box display="flex" alignItems="center" gap={0.5}>
                                                        <Typography variant="body2" fontWeight={500} noWrap>
                                                            {member.name}
                                                        </Typography>
                                                        {member.isExternal &&
                                                            <Chip
                                                                label="External"
                                                                size="small"
                                                                sx={{
                                                                    height: 16,
                                                                    fontSize: '0.55rem',
                                                                    bgcolor: 'primary.50',
                                                                    color: 'primary.700'
                                                                }} />

                                                        }
                                                    </Box>
                                                    <Typography
                                                        variant="caption"
                                                        color="text.secondary"
                                                        noWrap>

                                                        {member.role}
                                                    </Typography>
                                                </Box>
                                                <FormControl
                                                    size="small"
                                                    sx={{
                                                        minWidth: 90,
                                                        flexShrink: 0
                                                    }}>

                                                    <Select
                                                        value={member.permission}
                                                        disabled={member.permission === 'Owner'}
                                                        sx={{
                                                            fontSize: '0.75rem',
                                                            height: 28
                                                        }}>

                                                        <MenuItem value="Owner" disabled>
                                                            <Typography variant="caption">Owner</Typography>
                                                        </MenuItem>
                                                        <MenuItem value="Admin">
                                                            <Typography variant="caption">Admin</Typography>
                                                        </MenuItem>
                                                        <MenuItem value="Editor">
                                                            <Typography variant="caption">Editor</Typography>
                                                        </MenuItem>
                                                        <MenuItem value="Viewer">
                                                            <Typography variant="caption">Viewer</Typography>
                                                        </MenuItem>
                                                    </Select>
                                                </FormControl>
                                                {member.permission !== 'Owner' &&
                                                    <IconButton
                                                        size="small"
                                                        sx={{
                                                            color: 'grey.400',
                                                            flexShrink: 0
                                                        }}>

                                                        <CloseRounded
                                                            sx={{
                                                                fontSize: 14
                                                            }} />

                                                    </IconButton>
                                                }
                                            </Box>
                                        )}
                                    </Stack>

                                    {/* Add member */}
                                    <Typography
                                        variant="caption"
                                        fontWeight={600}
                                        color="text.secondary"
                                        sx={{
                                            textTransform: 'uppercase',
                                            letterSpacing: 0.5,
                                            display: 'block',
                                            mb: 1
                                        }}>

                                        Add Member
                                    </Typography>
                                    <Stack spacing={1.5}>
                                        <TextField
                                            size="small"
                                            fullWidth
                                            label="Search or invite by email"
                                            placeholder="Name or email address..."
                                            InputProps={{
                                                startAdornment:
                                                    <InputAdornment position="start">
                                                        <SearchRounded
                                                            sx={{
                                                                fontSize: 16,
                                                                color: 'grey.400'
                                                            }} />

                                                    </InputAdornment>

                                            }} />

                                        <Typography variant="caption" color="text.secondary">
                                            You can invite external users by email. They'll receive an
                                            invitation to view or collaborate on this project.
                                        </Typography>
                                        <FormControl size="small" fullWidth>
                                            <InputLabel>Permission Level</InputLabel>
                                            <Select defaultValue="Viewer" label="Permission Level">
                                                <MenuItem value="Admin">
                                                    Admin — can manage project & members
                                                </MenuItem>
                                                <MenuItem value="Editor">
                                                    Editor — can edit content
                                                </MenuItem>
                                                <MenuItem value="Viewer">
                                                    Viewer — read-only access
                                                </MenuItem>
                                            </Select>
                                        </FormControl>
                                        <Button
                                            variant="outlined"
                                            size="small"
                                            startIcon={
                                                <AddRounded
                                                    sx={{
                                                        fontSize: 16
                                                    }} />

                                            }
                                            sx={{
                                                textTransform: 'none',
                                                alignSelf: 'flex-start'
                                            }}>

                                            Add / Invite
                                        </Button>
                                    </Stack>
                                </Box>

                                <Divider />

                                {/* Permission level legend */}
                                <Paper
                                    variant="outlined"
                                    sx={{
                                        p: 2,
                                        borderRadius: 1.5,
                                        bgcolor: 'grey.50'
                                    }}>

                                    <Typography
                                        variant="caption"
                                        fontWeight={600}
                                        color="text.secondary"
                                        display="block"
                                        mb={1}>

                                        Permission Levels
                                    </Typography>
                                    {[
                                        {
                                            level: 'Owner',
                                            desc: 'Full control, cannot be removed'
                                        },
                                        {
                                            level: 'Admin',
                                            desc: 'Manage members & all content'
                                        },
                                        {
                                            level: 'Editor',
                                            desc: 'Edit content, cannot manage members'
                                        },
                                        {
                                            level: 'Viewer',
                                            desc: 'Read-only access'
                                        }].
                                        map(({ level, desc }) =>
                                            <Box key={level} display="flex" gap={1} mb={0.5}>
                                                <Typography
                                                    variant="caption"
                                                    fontWeight={600}
                                                    sx={{
                                                        minWidth: 48
                                                    }}>

                                                    {level}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {desc}
                                                </Typography>
                                            </Box>
                                        )}
                                </Paper>
                            </Stack>
                        }
                    </Stack>);

            case 'permissions':
                return (
                    <Stack spacing={3}>
                        <Box>
                            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                                Project Permissions
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Control who can view and edit this project. Unlike company
                                permissions, you can invite external users who aren't company
                                members.
                            </Typography>
                        </Box>

                        {/* Members list */}
                        <Box>
                            <Typography
                                variant="caption"
                                color="text.secondary"
                                fontWeight={600}
                                sx={{
                                    textTransform: 'uppercase',
                                    letterSpacing: 0.5,
                                    mb: 1,
                                    display: 'block'
                                }}>

                                Members ({initialProjectPermissions.length})
                            </Typography>
                            <Stack spacing={1}>
                                {initialProjectPermissions.map((member) =>
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
                                            bgcolor: 'white'
                                        }}>

                                        <Avatar
                                            sx={{
                                                width: 32,
                                                height: 32,
                                                bgcolor: member.isExternal ? 'primary.100' : 'grey.200',
                                                fontSize: '0.7rem',
                                                fontWeight: 600,
                                                flexShrink: 0
                                            }}>

                                            {member.name.
                                                split(' ').
                                                map((n: string) => n[0]).
                                                join('')}
                                        </Avatar>
                                        <Box flex={1} minWidth={0}>
                                            <Box display="flex" alignItems="center" gap={0.5}>
                                                <Typography variant="body2" fontWeight={500} noWrap>
                                                    {member.name}
                                                </Typography>
                                                {member.isExternal &&
                                                    <Chip
                                                        label="External"
                                                        size="small"
                                                        sx={{
                                                            height: 16,
                                                            fontSize: '0.55rem',
                                                            bgcolor: 'primary.50',
                                                            color: 'primary.700'
                                                        }} />

                                                }
                                            </Box>
                                            <Typography
                                                variant="caption"
                                                color="text.secondary"
                                                noWrap>

                                                {member.role}
                                            </Typography>
                                        </Box>
                                        <FormControl
                                            size="small"
                                            sx={{
                                                minWidth: 90,
                                                flexShrink: 0
                                            }}>

                                            <Select
                                                value={member.permission}
                                                disabled={member.permission === 'Owner'}
                                                sx={{
                                                    fontSize: '0.75rem',
                                                    height: 28
                                                }}>

                                                <MenuItem value="Owner" disabled>
                                                    <Typography variant="caption">Owner</Typography>
                                                </MenuItem>
                                                <MenuItem value="Admin">
                                                    <Typography variant="caption">Admin</Typography>
                                                </MenuItem>
                                                <MenuItem value="Editor">
                                                    <Typography variant="caption">Editor</Typography>
                                                </MenuItem>
                                                <MenuItem value="Viewer">
                                                    <Typography variant="caption">Viewer</Typography>
                                                </MenuItem>
                                            </Select>
                                        </FormControl>
                                        {member.permission !== 'Owner' &&
                                            <IconButton
                                                size="small"
                                                sx={{
                                                    color: 'grey.400',
                                                    flexShrink: 0
                                                }}>

                                                <CloseRounded
                                                    sx={{
                                                        fontSize: 14
                                                    }} />

                                            </IconButton>
                                        }
                                    </Box>
                                )}
                            </Stack>
                        </Box>

                        <Divider />

                        {/* Add member — allows external users */}
                        <Box>
                            <Typography
                                variant="caption"
                                color="text.secondary"
                                fontWeight={600}
                                sx={{
                                    textTransform: 'uppercase',
                                    letterSpacing: 0.5,
                                    mb: 1.5,
                                    display: 'block'
                                }}>

                                Add Member
                            </Typography>
                            <Stack spacing={1.5}>
                                <TextField
                                    size="small"
                                    fullWidth
                                    label="Search or invite by email"
                                    placeholder="Name or email address..."
                                    InputProps={{
                                        startAdornment:
                                            <InputAdornment position="start">
                                                <SearchRounded
                                                    sx={{
                                                        fontSize: 16,
                                                        color: 'grey.400'
                                                    }} />

                                            </InputAdornment>

                                    }} />

                                <Typography variant="caption" color="text.secondary">
                                    You can invite external users (not on the platform) by email.
                                    They'll receive an invitation to view or collaborate on this
                                    project.
                                </Typography>
                                <FormControl size="small" fullWidth>
                                    <InputLabel>Permission Level</InputLabel>
                                    <Select defaultValue="Viewer" label="Permission Level">
                                        <MenuItem value="Admin">
                                            Admin — can manage project & members
                                        </MenuItem>
                                        <MenuItem value="Editor">
                                            Editor — can edit content
                                        </MenuItem>
                                        <MenuItem value="Viewer">
                                            Viewer — read-only access
                                        </MenuItem>
                                    </Select>
                                </FormControl>
                                <Button
                                    variant="outlined"
                                    size="small"
                                    startIcon={
                                        <AddRounded
                                            sx={{
                                                fontSize: 16
                                            }} />

                                    }
                                    sx={{
                                        textTransform: 'none',
                                        alignSelf: 'flex-start'
                                    }}>

                                    Add / Invite
                                </Button>
                            </Stack>
                        </Box>

                        {/* Legend */}
                        <Paper
                            variant="outlined"
                            sx={{
                                p: 2,
                                borderRadius: 1.5,
                                bgcolor: 'grey.50'
                            }}>

                            <Typography
                                variant="caption"
                                fontWeight={600}
                                color="text.secondary"
                                display="block"
                                mb={1}>

                                Permission Levels
                            </Typography>
                            {[
                                {
                                    level: 'Owner',
                                    desc: 'Full control, cannot be removed'
                                },
                                {
                                    level: 'Admin',
                                    desc: 'Manage members & all content'
                                },
                                {
                                    level: 'Editor',
                                    desc: 'Edit content, cannot manage members'
                                },
                                {
                                    level: 'Viewer',
                                    desc: 'Read-only access'
                                }].
                                map(({ level, desc }) =>
                                    <Box key={level} display="flex" gap={1} mb={0.5}>
                                        <Typography
                                            variant="caption"
                                            fontWeight={600}
                                            sx={{
                                                minWidth: 48
                                            }}>

                                            {level}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {desc}
                                        </Typography>
                                    </Box>
                                )}
                        </Paper>
                    </Stack>);

            default:
                return (
                    <Box py={4} textAlign="center">
                        <Typography variant="body2" color="text.secondary">
                            Editor for "{section}" section
                        </Typography>
                    </Box>);

        }
    };
    const handleSave = () => {
        if (onSave) {
            let data: any = {};
            if (section === 'team') {
                const resolvedName = teamSelectedPlatform ?
                    teamSelectedPlatform.name :
                    teamName;
                data = {
                    name: resolvedName,
                    type: teamProjectRole || 'Other',
                    partnerKind: teamRole,
                    platformId: teamSelectedPlatform ? teamSelectedPlatform.id : null,
                    id: resolvedName.toLowerCase().replace(/\s+/g, '-')
                };
            } else if (section === 'opportunities') {
                data = {
                    type: oppType,
                    desc: oppDesc,
                    urgent: oppUrgent
                };
            }
            onSave(section, data, !!editingItem);
        }
        onClose();
    };
    const getTitle = () => {
        if (editingItem) return 'Edit';
        if (
            section === 'update' ||
            section === 'document' ||
            section === 'media' ||
            section === 'team' ||
            section === 'opportunities')

            return 'Add';
        return 'Edit';
    };
    return (
        <SidebarPanel
            open={open}
            onClose={onClose}
            title={getTitle()}
            onSave={handleSave}>

            {renderContent()}
        </SidebarPanel>);

}