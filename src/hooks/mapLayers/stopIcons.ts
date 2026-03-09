import L from 'leaflet';

import { COLORS } from '../../constants';

export function isValidCoordinate(
  lat: number | undefined | null,
  lng: number | undefined | null
): boolean {
  return (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    !isNaN(lat) &&
    !isNaN(lng)
  );
}

export type StopMarkerType =
  | 'highlighted'
  | 'source'
  | 'target'
  | 'intermediate-future'
  | 'intermediate-past'
  | 'context'
  | 'context-subtle';

export function createStopIcon(
  type: StopMarkerType,
  isDark: boolean,
  colorOverride?: string
): L.DivIcon {
  const sizeMap: Record<StopMarkerType, number> = {
    highlighted: 24,
    source: 20,
    target: 20,
    'intermediate-future': 14,
    'intermediate-past': 12,
    context: 14,
    'context-subtle': 8,
  };
  const size = sizeMap[type];

  let html = '';

  switch (type) {
    case 'highlighted': {
      const hColor = colorOverride || COLORS.primary;
      html = `
                <div class="relative w-full h-full">
                    <div class="absolute inset-0 rounded-full animate-ping opacity-40" style="background-color: ${hColor}"></div>
                    <div class="relative w-full h-full rounded-full border-[3px] shadow-lg flex items-center justify-center" style="background-color: ${hColor}; border-color: ${isDark ? '#0f172a' : '#fff'}">
                        <div class="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                </div>`;
      break;
    }

    case 'source':
    case 'target': {
      // Light Mode: White Fill, Fat Black Border
      // Dark Mode: Black Fill, Fat White Border
      const borderColor = isDark ? '#ffffff' : '#0f172a';
      const fillColor = isDark ? '#0f172a' : '#ffffff';
      html = `<div class="w-full h-full rounded-full shadow-lg" style="background-color: ${fillColor}; border: 4px solid ${borderColor}; box-sizing: border-box;"></div>`;
      break;
    }

    case 'intermediate-future':
      html = `<div class="w-full h-full rounded-full bg-white dark:bg-slate-900 border-[3px] border-indigo-500 dark:border-indigo-400 shadow-sm"></div>`;
      break;

    case 'intermediate-past':
      html = `<div class="w-full h-full rounded-full bg-slate-400 dark:bg-slate-600 border-[2px] border-slate-600 dark:border-slate-400"></div>`;
      break;

    case 'context':
      html = `<div class="w-full h-full rounded-full bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 shadow-sm"></div>`;
      break;

    case 'context-subtle':
      html = `<div class="w-full h-full rounded-full bg-slate-300/50 dark:bg-slate-600/50"></div>`;
      break;
  }

  const wrapperHtml = `<div class="flex items-center justify-center transition-transform duration-300 hover:scale-110" style="width: ${size}px; height: ${size}px;">${html}</div>`;
  return L.divIcon({
    className: 'bg-transparent',
    html: wrapperHtml,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}
