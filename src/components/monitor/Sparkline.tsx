import React from 'react';

interface SparklineProps {
  data: number[];
  max: number;
  height?: number;
}

const Sparkline: React.FC<SparklineProps> = ({ data, max, height = 24 }) => {
  return (
    <div className="flex items-end gap-[2px] opacity-80" style={{ height }}>
      {data.map((val, i) => {
        const pct = Math.min((val / (max || 1)) * 100, 100);
        const colorClass =
          val > 1000
            ? 'bg-red-500'
            : val > 500
              ? 'bg-amber-500'
              : 'bg-emerald-500';
        return (
          <div
            key={i}
            className={`w-1.5 md:w-2 rounded-t-sm ${colorClass} transition-all duration-300`}
            style={{ height: `${Math.max(pct, 10)}%` }}
            title={`${Math.round(val)}ms`}
          />
        );
      })}
    </div>
  );
};

export default Sparkline;
