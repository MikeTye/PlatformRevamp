import React from 'react';
import {
    Box,
    IconButton,
    Paper,
    Stack,
    Typography,
} from '@mui/material';
import DescriptionRounded from '@mui/icons-material/DescriptionRounded';
import DownloadRounded from '@mui/icons-material/DownloadRounded';
import { EmptyState } from '../../components/EmptyState';
import type { CompanyDocument } from './companyProfile.types';
import { CompanySectionHeader } from './CompanyHeaderSection';

interface CompanyDocumentsSectionProps {
    documents?: CompanyDocument[];
    isEditMode: boolean;
    canEdit: boolean;
    onAddDocument?: () => void;
    onEditDocuments?: () => void;
    renderDocumentActions?: (doc: CompanyDocument, index: number) => React.ReactNode;
}

export function CompanyDocumentsSection({
    documents = [],
    isEditMode,
    canEdit,
    onAddDocument,
    renderDocumentActions,
}: CompanyDocumentsSectionProps) {
    const showAdd = isEditMode && canEdit ? onAddDocument : undefined;

    return (
        <Paper
            variant="outlined"
            sx={{
                borderRadius: 2,
                overflow: 'hidden',
            }}
        >
            <CompanySectionHeader
                title="Documents"
                count={documents.length}
                onAdd={showAdd}
            />

            <Box p={3}>
                {documents.length ? (
                    <Stack spacing={1}>
                        {documents.map((doc, index) => {
                            const docUrl =
                                (doc as any).url ||
                                (doc as any).assetUrl ||
                                null;

                            const metaText = [doc.type, (doc as any).date]
                                .filter(Boolean)
                                .join(' • ');

                            return (
                                <Box
                                    key={`${doc.name}-${index}`}
                                    display="flex"
                                    alignItems="center"
                                    gap={1.5}
                                    p={1}
                                    borderRadius={1}
                                    sx={{
                                        '&:hover': {
                                            bgcolor: 'grey.50',
                                        },
                                    }}
                                >
                                    <DescriptionRounded
                                        sx={{
                                            fontSize: 16,
                                            color: 'grey.500',
                                            flexShrink: 0,
                                        }}
                                    />

                                    <Box minWidth={0} flex={1}>
                                        {docUrl ? (
                                            <Typography
                                                variant="body2"
                                                fontWeight={500}
                                                color="text.primary"
                                                noWrap
                                                component="a"
                                                href={docUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                sx={{
                                                    textDecoration: 'none',
                                                    '&:hover': {
                                                        textDecoration: 'underline',
                                                    },
                                                }}
                                            >
                                                {doc.name}
                                            </Typography>
                                        ) : (
                                            <Typography
                                                variant="body2"
                                                fontWeight={500}
                                                color="text.primary"
                                                noWrap
                                            >
                                                {doc.name}
                                            </Typography>
                                        )}

                                        <Typography
                                            variant="caption"
                                            color="text.secondary"
                                            noWrap
                                        >
                                            {metaText}
                                        </Typography>
                                    </Box>

                                    {docUrl ? (
                                        <IconButton
                                            size="small"
                                            component="a"
                                            href={docUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            sx={{
                                                color: 'grey.400',
                                                '&:hover': {
                                                    color: 'primary.main',
                                                },
                                            }}
                                            title="Download"
                                        >
                                            <DownloadRounded sx={{ fontSize: 16 }} />
                                        </IconButton>
                                    ) : null}

                                    {renderDocumentActions?.(doc, index)}
                                </Box>
                            );
                        })}
                    </Stack>
                ) : (
                    <EmptyState
                        icon={DescriptionRounded}
                        title="No documents yet"
                        description="Upload company documents for due diligence"
                        actionLabel={isEditMode && canEdit ? 'Upload Document' : undefined}
                        onAction={showAdd}
                    />
                )}
            </Box>
        </Paper>
    );
}