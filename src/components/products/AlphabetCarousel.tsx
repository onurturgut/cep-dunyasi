'use client';

import { useCallback, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export type MissionCarouselItem = {
  id: string;
  label: string;
  title?: string;
  description?: string;
  mediaType?: 'image' | 'video';
  mediaUrl?: string;
  mediaPoster?: string;
  listItems?: string[];
  ajaxUrl?: string | number;
};

type AlphabetCarouselProps = {
  className?: string;
  items?: MissionCarouselItem[];
  keyboardEnabled?: boolean;
  showNote?: boolean;
  showItemLabels?: boolean;
  showDescription?: boolean;
  showControls?: boolean;
  onItemChange?: (item: MissionCarouselItem, index: number) => void;
};

const DEFAULT_ITEMS: MissionCarouselItem[] = [
  {
    id: 'mission-b',
    label: 'B',
    title: 'Hızlı Servis',
    description: 'Aynı gün işleme alınan teknik destek.',
    listItems: ['Ekran', 'Batarya', 'Şarj', 'Yazılım', 'Bakım'],
  },
  {
    id: 'mission-c',
    label: 'C',
    title: 'Güvenli Teslimat',
    description: 'Ürünleriniz sigortali ve takipli gelir.',
    listItems: ['Kargo', 'Takip', 'Paketleme', 'Teslim', 'İade'],
  },
];

const normalizeMissionText = (value: unknown): string =>
  `${value ?? ''}`
    .toLocaleLowerCase('tr-TR')
    .replaceAll('ı', 'i')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const shouldHideMissionItem = (item: MissionCarouselItem): boolean => {
  const title = normalizeMissionText(item.title);
  const description = normalizeMissionText(item.description);
  const mediaUrl = normalizeMissionText(item.mediaUrl);

  return (
    title.includes('teknoloji danismanligi') ||
    description.includes('ihtiyacina uygun cihazi birlikte belirliyoruz') ||
    description.includes('birlikte belirliyoruz') ||
    mediaUrl.includes('pexels com photos 699122')
  );
};

const normalizeOffset = (rawOffset: number, total: number): number => {
  const half = Math.floor(total / 2);
  let offset = ((rawOffset + half) % total + total) % total - half;

  if (total % 2 === 0 && offset === -half && rawOffset > 0) {
    offset = half;
  }

  return offset;
};

export function AlphabetCarousel({
  className,
  items = DEFAULT_ITEMS,
  keyboardEnabled = true,
  showNote = true,
  showItemLabels = true,
  showDescription = true,
  showControls = true,
  onItemChange,
}: AlphabetCarouselProps) {
  const sourceItems = items.length > 0 ? items : DEFAULT_ITEMS;
  const filteredItems = sourceItems.filter((item) => !shouldHideMissionItem(item));
  const fallbackItems = DEFAULT_ITEMS.filter((item) => !shouldHideMissionItem(item));
  const carouselItems = filteredItems.length > 0 ? filteredItems : (fallbackItems.length > 0 ? fallbackItems : DEFAULT_ITEMS);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const moveNext = useCallback(() => {
    setSelectedIndex((current) => (current + 1) % carouselItems.length);
  }, [carouselItems.length]);

  const movePrev = useCallback(() => {
    setSelectedIndex((current) => (current - 1 + carouselItems.length) % carouselItems.length);
  }, [carouselItems.length]);

  const getPositionClass = (index: number) => {
    const offset = normalizeOffset(index - selectedIndex, carouselItems.length);

    if (offset === 0) return 'mission-carousel-selected';
    if (offset === -1) return 'mission-carousel-prev';
    if (offset === -2) return 'mission-carousel-prev-left-second';
    if (offset === 1) return 'mission-carousel-next';
    if (offset === 2) return 'mission-carousel-next-right-second';
    if (offset < 0) return 'mission-carousel-hide-left';
    return 'mission-carousel-hide-right';
  };

  const selectedItem = carouselItems[selectedIndex] ?? carouselItems[0];

  useEffect(() => {
    if (selectedIndex >= carouselItems.length) {
      setSelectedIndex(0);
    }
  }, [carouselItems.length, selectedIndex]);

  useEffect(() => {
    if (!onItemChange || !selectedItem) {
      return;
    }

    onItemChange(selectedItem, selectedIndex);
  }, [onItemChange, selectedIndex, selectedItem]);

  useEffect(() => {
    if (!keyboardEnabled) return;

    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target) {
        const tag = target.tagName;
        const isEditable =
          target.isContentEditable || tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
        if (isEditable) return;
      }

      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        movePrev();
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        moveNext();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [keyboardEnabled, moveNext, movePrev]);

  return (
    <section className={`mission-carousel-section${className ? ` ${className}` : ''}`}>
      {showNote && (
        <div className="mission-carousel-note">
          <strong>NOTE:</strong>
          <br />
          Sol ve sag ok tuslari ile secenekler arasinda geçiş yapabilirsiniz.
        </div>
      )}

      <div className="mission-carousel-container">
        <div className="mission-circular-carousel" aria-label="Alphabet carousel">
          {carouselItems.map((item, index) => {
            const positionClass = getPositionClass(index);

            return (
              <button
                key={item.id}
                type="button"
                data-ajax-url={item.ajaxUrl ?? index}
                className={`mission-carousel-item ${positionClass}`}
                onClick={() => {
                  if (
                    positionClass === 'mission-carousel-next' ||
                    positionClass === 'mission-carousel-next-right-second'
                  ) {
                    moveNext();
                    return;
                  }

                  if (
                    positionClass === 'mission-carousel-prev' ||
                    positionClass === 'mission-carousel-prev-left-second'
                  ) {
                    movePrev();
                    return;
                  }

                  setSelectedIndex(index);
                }}
                aria-current={index === selectedIndex}
                aria-label={`Seçenek sec ${index + 1}`}
              >
                <span className="mission-item-label">{showItemLabels ? item.label : ''}</span>
              </button>
            );
          })}
        </div>

        {showControls ? (
          <>
            <button
              type="button"
              className="mission-prev-control"
              onClick={movePrev}
              aria-label="Previous letter"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button type="button" className="mission-next-control" onClick={moveNext} aria-label="Next letter">
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        ) : null}
      </div>

      {showDescription && selectedItem?.description ? (
        <p className="mt-3 text-sm text-muted-foreground">{selectedItem.description}</p>
      ) : null}
    </section>
  );
}

