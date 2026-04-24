import React from 'react';
import {
    Box,
    Chip,
    IconButton,
    Link,
    Paper,
    Pagination,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Typography,
} from '@mui/material';
import DescriptionRounded from '@mui/icons-material/DescriptionRounded';
import MoreVertRounded from '@mui/icons-material/MoreVertRounded';

import type {
    ProjectDocument,
    ProjectEditorTarget,
    SectionVisibility,
} from './projectProfile.types';
import { ProjectSectionCard } from './ProjectSectionCard';

type Props = {
    documents?: ProjectDocument[];
    canEdit: boolean;
    visibility: SectionVisibility;
    onVisibilityChange?: (value: SectionVisibility) => void;
    onOpenEditor?: (section: ProjectEditorTarget, itemId?: string | null) => void;
    onDocumentMenuClick?: (
        event: React.MouseEvent<HTMLElement>,
        item: ProjectDocument,
        index: number
    ) => void;
};

const MAX_DOCUMENT_ITEMS = 10;
const DOCUMENTS_PER_PAGE = 5;

function getDocumentDisplayType(document: ProjectDocument): string {
    return document.kind?.trim() || document.type?.trim() || 'Other';
}

function getDocumentDisplayStatus(document: ProjectDocument): string {
    return document.status?.trim() || 'Draft';
}

function formatDocumentDate(value?: string | null): string {
    if (!value) return '—';

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;

    return date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}

export default function ProjectDocumentsSection({
    documents,
    canEdit,
    visibility,
    onVisibilityChange,
    onOpenEditor,
    onDocumentMenuClick,
}: Props) {
    const items = documents ?? [];
    const itemCount = items.length;
    const hasReachedLimit = itemCount >= MAX_DOCUMENT_ITEMS;
    const canAddMore = canEdit && !hasReachedLimit;

    const [page, setPage] = React.useState(1);

    const pageCount = Math.max(1, Math.ceil(itemCount / DOCUMENTS_PER_PAGE));

    React.useEffect(() => {
        if (page > pageCount) {
            setPage(pageCount);
        }
    }, [page, pageCount]);

    const pagedDocuments = React.useMemo(() => {
        const start = (page - 1) * DOCUMENTS_PER_PAGE;
        return items.slice(start, start + DOCUMENTS_PER_PAGE);
    }, [items, page]);

    return (
        <ProjectSectionCard
            title="Documents"
            addable={canAddMore}
            isOwner={canEdit}
            visibility={visibility}
            onVisibilityChange={canEdit ? onVisibilityChange : undefined}
            onAdd={canAddMore ? () => onOpenEditor?.('documents') : undefined}
            empty={!items.length}
            emptyText="No documents uploaded"
            emptyActionLabel={canAddMore ? 'Add Document' : undefined}
            onEmptyAction={canAddMore ? () => onOpenEditor?.('documents') : undefined}
        >
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Box
                    sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: { xs: 'flex-start', sm: 'center' },
                        flexDirection: { xs: 'column', sm: 'row' },
                        gap: 0.5,
                    }}
                >
                    <Typography variant="caption" color="text.secondary">
                        {itemCount} / {MAX_DOCUMENT_ITEMS} items
                    </Typography>

                    {hasReachedLimit ? (
                        <Typography variant="caption" color="warning.main" fontWeight={600}>
                            Maximum of {MAX_DOCUMENT_ITEMS} documents reached
                        </Typography>
                    ) : null}
                </Box>

                <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden', width: '100%' }}>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell>Document</TableCell>
                                <TableCell>Type</TableCell>
                                <TableCell>Date</TableCell>
                                <TableCell>Status</TableCell>
                                {canEdit ? <TableCell align="right" width={56} /> : null}
                            </TableRow>
                        </TableHead>

                        <TableBody>
                            {pagedDocuments.map((item, index) => {
                                const absoluteIndex = (page - 1) * DOCUMENTS_PER_PAGE + index;

                                return (
                                    <TableRow key={item.id} hover>
                                        <TableCell>
                                            <Stack direction="row" spacing={1} alignItems="center">
                                                <DescriptionRounded fontSize="small" color="action" />
                                                {item.assetUrl ? (
                                                    <Link
                                                        href={item.assetUrl}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        underline="hover"
                                                        color="inherit"
                                                    >
                                                        <Typography variant="body2" fontWeight={600}>
                                                            {item.name || 'Untitled document'}
                                                        </Typography>
                                                    </Link>
                                                ) : (
                                                    <Typography variant="body2" fontWeight={600}>
                                                        {item.name || 'Untitled document'}
                                                    </Typography>
                                                )}
                                            </Stack>
                                        </TableCell>

                                        <TableCell>
                                            <Typography variant="body2" color="text.secondary">
                                                {getDocumentDisplayType(item)}
                                            </Typography>
                                        </TableCell>

                                        <TableCell>
                                            <Typography variant="body2" color="text.secondary">
                                                {formatDocumentDate(item.createdAt)}
                                            </Typography>
                                        </TableCell>

                                        <TableCell>
                                            <Chip
                                                size="small"
                                                label={getDocumentDisplayStatus(item)}
                                                variant="outlined"
                                            />
                                        </TableCell>

                                        {canEdit ? (
                                            <TableCell align="right">
                                                <IconButton
                                                    size="small"
                                                    onClick={(event) =>
                                                        onDocumentMenuClick?.(
                                                            event,
                                                            item,
                                                            absoluteIndex
                                                        )
                                                    }
                                                >
                                                    <MoreVertRounded fontSize="small" />
                                                </IconButton>
                                            </TableCell>
                                        ) : null}
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </Paper>

                {pageCount > 1 ? (
                    <Box display="flex" justifyContent="center">
                        <Pagination
                            page={page}
                            count={pageCount}
                            onChange={(_, value) => setPage(value)}
                            size="small"
                            color="primary"
                        />
                    </Box>
                ) : null}
            </Box>
        </ProjectSectionCard>
    );
}