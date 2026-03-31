import { RefreshCw } from 'lucide-react';
import React, { useEffect, useState } from 'react';

import { STALENESS_THRESHOLD_MS } from '../../constants';

interface StalenessIndicatorProps {
  queriedAt: Date | null;
  onRefresh: () => void;
}

const formatAge = (ms: number): string => {
  const minutes = Math.floor(ms / 60_000);
  if (minutes < 1) return 'just now';
  if (minutes === 1) return '1 min ago';
  return `${minutes} min ago`;
};

const StalenessIndicator: React.FC<StalenessIndicatorProps> = ({
  queriedAt,
  onRefresh,
}) => {
  const [age, setAge] = useState<number>(0);

  useEffect(() => {
    if (!queriedAt) return;
    const tick = () => setAge(Date.now() - queriedAt.getTime());
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, [queriedAt]);

  if (!queriedAt || age < STALENESS_THRESHOLD_MS) return null;

  return (
    <div className="flex items-center gap-1.5 text-[11px] text-amber-600 dark:text-amber-400 font-medium">
      <span>Results from {formatAge(age)}</span>
      <button
        onClick={onRefresh}
        className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
        title="Refresh results"
      >
        <RefreshCw size={11} />
        <span>Refresh</span>
      </button>
    </div>
  );
};

export default StalenessIndicator;
