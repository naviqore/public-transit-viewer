import L from 'leaflet';

import { Leg, Stop } from '../../types';

export interface PopupOptions {
  time?: string;
  isCurrent?: boolean;
  isPast?: boolean;
  isDark: boolean;
  timezone: string;
  permanent?: boolean;
  highlightColor?: string;
  subtitle?: string;
}

export function bindRichStopPopup(
  layer: L.Layer,
  stop: Stop,
  options: PopupOptions
): void {
  if (!layer.bindTooltip) return;

  const {
    isDark,
    isCurrent,
    isPast,
    highlightColor,
    subtitle,
    permanent,
    time,
    timezone,
  } = options;

  const bg = isDark
    ? 'bg-slate-900/95 border-slate-700'
    : 'bg-white/95 border-slate-200';
  const textColor = isDark ? 'text-slate-100' : 'text-slate-900';

  let titleColorClass = textColor;
  let titleStyle = '';

  if (isCurrent) {
    if (highlightColor) titleStyle = `color: ${highlightColor}`;
    else titleColorClass = 'text-indigo-600 dark:text-indigo-400';
  } else if (isPast) {
    titleColorClass = 'text-slate-400';
  }

  let subtitleHtml = '';
  if (time) {
    const date = new Date(time);
    const timeStr = date.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: timezone,
    });
    subtitleHtml = `<div class="text-[10px] font-mono font-bold mt-0.5 ${isPast ? 'text-slate-400 line-through decoration-slate-400/50' : 'text-slate-600 dark:text-slate-300'}">${timeStr}</div>`;
  } else if (subtitle) {
    subtitleHtml = `<div class="text-[10px] font-mono font-bold mt-0.5" style="color:${highlightColor || 'inherit'}">${subtitle}</div>`;
  }

  const content = `
        <div class="font-sans text-center min-w-[60px]">
            <div class="font-bold text-xs ${titleColorClass}" style="${titleStyle}">${stop.name}</div>
            ${subtitleHtml}
            ${isCurrent && !permanent ? '<div class="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Selected</div>' : ''}
        </div>`;

  layer.bindTooltip(content, {
    permanent,
    direction: 'top',
    offset: permanent ? [0, -12] : [0, -10],
    className: `!${bg} backdrop-blur-md border shadow-xl rounded-lg px-2 py-1.5`,
  });
}

export function bindRichLinePopup(
  layer: L.Layer,
  leg: Leg,
  isDark: boolean,
  isPast: boolean
): void {
  if (!layer.bindTooltip) return;
  const bg = isDark
    ? 'bg-slate-900/95 border-slate-700'
    : 'bg-white/95 border-slate-200';
  const text = isDark ? 'text-slate-100' : 'text-slate-900';
  const subText = isDark ? 'text-slate-400' : 'text-slate-500';
  const content = `<div class="flex items-center gap-3 p-1 font-sans min-w-[140px]"><div class="flex flex-col"><div class="flex items-center gap-1.5 mb-0.5"><span class="font-bold text-xs ${text} px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800">${leg.trip?.route.shortName || 'Route'}</span><span class="text-[10px] ${subText}">to</span><span class="font-bold text-xs ${text}">${leg.trip?.headSign}</span></div>${isPast ? `<div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Already departed</div>` : `<div class="text-[10px] font-mono ${subText}">Next Stop: ${leg.toStop?.name}</div>`}</div></div>`;
  layer.bindTooltip(content, {
    sticky: true,
    direction: 'top',
    offset: [0, -10],
    className: `!${bg} backdrop-blur-md border shadow-xl rounded-xl px-0 py-0 overflow-hidden`,
  });
}
