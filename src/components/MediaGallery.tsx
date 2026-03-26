import React, { useEffect, useState, useRef } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Dialog,
  Paper,
  Button } from
'@mui/material';
import ImageRounded from '@mui/icons-material/ImageRounded';
import ChevronLeftRounded from '@mui/icons-material/ChevronLeftRounded';
import ChevronRightRounded from '@mui/icons-material/ChevronRightRounded';
import CloseRounded from '@mui/icons-material/CloseRounded';
import MoreVertRounded from '@mui/icons-material/MoreVertRounded';
import AddRounded from '@mui/icons-material/AddRounded';
export interface MediaItem {
  id?: string;
  type?: 'image' | 'video' | string;
  url: string;
  caption: string;
  date?: string;
}
interface MediaGalleryProps {
  items: MediaItem[];
  mode?: 'carousel' | 'grid';
  isOwner?: boolean;
  onAdd?: () => void;
  onMenuClick?: (
  event: React.MouseEvent<HTMLElement>,
  item: MediaItem,
  index: number)
  => void;
  emptyStateMessage?: string;
}
export function MediaGallery({
  items,
  mode = 'carousel',
  isOwner = false,
  onAdd,
  onMenuClick,
  emptyStateMessage = 'No media uploaded'
}: MediaGalleryProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const checkScrollability = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } =
      scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 1);
    }
  };
  useEffect(() => {
    checkScrollability();
    window.addEventListener('resize', checkScrollability);
    return () => window.removeEventListener('resize', checkScrollability);
  }, [items]);
  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 296; // Card width (280) + gap (16)
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };
  if (items.length === 0) {
    return (
      <Box textAlign="center" py={3}>
        <Typography variant="body2" color="text.secondary">
          {emptyStateMessage}
        </Typography>
        {isOwner && onAdd &&
        <Button
          size="small"
          startIcon={
          <AddRounded
            sx={{
              fontSize: 14
            }} />

          }
          onClick={onAdd}
          sx={{
            mt: 1,
            textTransform: 'none'
          }}>

            Add Media
          </Button>
        }
      </Box>);

  }
  const renderItem = (item: MediaItem, index: number) =>
  <Box
    key={item.id || index}
    sx={{
      minWidth: mode === 'carousel' ? 280 : 'auto',
      width: mode === 'carousel' ? 280 : '100%',
      position: 'relative',
      borderRadius: '8px',
      overflow: 'hidden',
      aspectRatio: '4/3',
      border: 1,
      borderColor: 'grey.200',
      flexShrink: 0,
      '&:hover': {
        borderColor: 'grey.400'
      }
    }}>

      <Box
      onClick={() => setLightboxIndex(index)}
      sx={{
        width: '100%',
        height: '100%',
        bgcolor: 'grey.100',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer'
      }}>

        {item.url ?
      <>
            <Box
          component="img"
          src={item.url}
          alt={item.caption}
          sx={{
            width: '100%',
            height: '100%',
            objectFit: 'cover'
          }}
          onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
            e.currentTarget.style.display = 'none';
            const placeholder = e.currentTarget.nextSibling as HTMLElement;
            if (placeholder) placeholder.style.display = 'flex';
          }} />

            <Box
          sx={{
            display: 'none',
            width: '100%',
            height: '100%',
            position: 'absolute',
            inset: 0,
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            gap: 1,
            bgcolor: 'grey.100'
          }}>

              <ImageRounded
            sx={{
              fontSize: 40,
              color: 'grey.300'
            }} />

              <Typography variant="caption" color="text.disabled">
                Image unavailable
              </Typography>
            </Box>
          </> :

      <ImageRounded
        sx={{
          fontSize: 32,
          color: 'grey.300'
        }} />

      }
      </Box>

      {/* Ellipses menu button */}
      {isOwner && onMenuClick &&
    <IconButton
      size="small"
      onClick={(e) => onMenuClick(e, item, index)}
      sx={{
        position: 'absolute',
        top: 8,
        right: 8,
        bgcolor: 'rgba(255,255,255,0.9)',
        width: 28,
        height: 28,
        '&:hover': {
          bgcolor: 'white'
        }
      }}>

          <MoreVertRounded
        sx={{
          fontSize: 16
        }} />

        </IconButton>
    }

      <Box
      sx={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        p: 1.5,
        background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)',
        color: 'white'
      }}>

        <Typography
        variant="caption"
        fontWeight="medium"
        sx={{
          display: 'block',
          lineHeight: 1.2,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}>

          {item.caption}
        </Typography>
      </Box>
    </Box>;

  return (
    <>
      <Box position="relative">
        {mode === 'carousel' &&
        <>
            {canScrollLeft &&
          <IconButton
            onClick={() => scroll('left')}
            sx={{
              position: 'absolute',
              left: -16,
              top: 'calc(50%)',
              transform: 'translateY(-50%)',
              zIndex: 10,
              bgcolor: 'white',
              border: 1,
              borderColor: 'grey.300',
              width: 32,
              height: 32,
              '&:hover': {
                bgcolor: 'grey.50'
              }
            }}>

                <ChevronLeftRounded
              sx={{
                fontSize: 18
              }} />

              </IconButton>
          }

            {canScrollRight &&
          <IconButton
            onClick={() => scroll('right')}
            sx={{
              position: 'absolute',
              right: -16,
              top: 'calc(50%)',
              transform: 'translateY(-50%)',
              zIndex: 10,
              bgcolor: 'white',
              border: 1,
              borderColor: 'grey.300',
              width: 32,
              height: 32,
              '&:hover': {
                bgcolor: 'grey.50'
              }
            }}>

                <ChevronRightRounded
              sx={{
                fontSize: 18
              }} />

              </IconButton>
          }
          </>
        }

        {mode === 'carousel' ?
        <Box
          ref={scrollContainerRef}
          onScroll={checkScrollability}
          sx={{
            display: 'flex',
            overflowX: 'auto',
            gap: 2,
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            '&::-webkit-scrollbar': {
              display: 'none'
            }
          }}>

            {items.map((item, i) => renderItem(item, i))}
          </Box> :

        <Box display="flex" flexWrap="wrap" gap={2}>
            {items.map((item, i) =>
          <Box key={item.id || i} width={160}>
                {renderItem(item, i)}
              </Box>
          )}
          </Box>
        }
      </Box>

      {/* Lightbox */}
      <Dialog
        open={lightboxIndex !== null}
        onClose={() => setLightboxIndex(null)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: 'transparent',
            boxShadow: 'none',
            overflow: 'visible'
          }
        }}
        BackdropProps={{
          sx: {
            bgcolor: 'rgba(0, 0, 0, 0.9)'
          }
        }}>

        {lightboxIndex !== null &&
        <Box
          position="relative"
          display="flex"
          alignItems="center"
          justifyContent="center"
          minHeight="60vh">

            <IconButton
            onClick={() => setLightboxIndex(null)}
            sx={{
              position: 'absolute',
              top: -40,
              right: 0,
              color: 'white'
            }}>

              <CloseRounded
              sx={{
                fontSize: 24
              }} />

            </IconButton>
            <IconButton
            onClick={() =>
            setLightboxIndex(Math.max((lightboxIndex || 0) - 1, 0))
            }
            disabled={lightboxIndex === 0}
            sx={{
              position: 'absolute',
              left: -60,
              color: 'white',
              '&.Mui-disabled': {
                color: 'rgba(255,255,255,0.3)'
              }
            }}>

              <ChevronLeftRounded
              sx={{
                fontSize: 32
              }} />

            </IconButton>
            <Box width="100%">
              <Box
              sx={{
                aspectRatio: '16/9',
                bgcolor: 'grey.900',
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 2,
                overflow: 'hidden'
              }}>

                {items[lightboxIndex].url ?
              <Box
                component="img"
                src={items[lightboxIndex].url}
                alt={items[lightboxIndex].caption}
                sx={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain'
                }} /> :


              <ImageRounded
                sx={{
                  fontSize: 64,
                  color: 'grey.600'
                }} />

              }
              </Box>
              <Box textAlign="center" color="white">
                <Typography variant="subtitle1" fontWeight="medium">
                  {items[lightboxIndex].caption}
                </Typography>
                {items[lightboxIndex].date &&
              <Typography variant="caption" color="grey.400">
                    {items[lightboxIndex].date}
                  </Typography>
              }
                <Typography
                variant="caption"
                display="block"
                color="grey.500"
                mt={1}>

                  {lightboxIndex + 1} of {items.length}
                </Typography>
              </Box>
            </Box>
            <IconButton
            onClick={() =>
            setLightboxIndex(
              Math.min((lightboxIndex || 0) + 1, items.length - 1)
            )
            }
            disabled={lightboxIndex === items.length - 1}
            sx={{
              position: 'absolute',
              right: -60,
              color: 'white',
              '&.Mui-disabled': {
                color: 'rgba(255,255,255,0.3)'
              }
            }}>

              <ChevronRightRounded
              sx={{
                fontSize: 32
              }} />

            </IconButton>
          </Box>
        }
      </Dialog>
    </>);

}