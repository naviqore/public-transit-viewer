import React from 'react';
import {
  Bus,
  CableCar,
  Footprints,
  Ship,
  Train,
  TrainFront,
} from 'lucide-react';
import { TRANSPORT_COLORS } from '../../constants';

interface TransportIconProps {
  mode: string; // 'BUS' | 'RAIL' | 'TRAM' etc.
  className?: string;
  size?: number;
}

const TransportIcon: React.FC<TransportIconProps> = ({
  mode,
  className = '',
  size = 16,
}) => {
  const normalizedMode = mode.toUpperCase();
  const color = TRANSPORT_COLORS[normalizedMode] || TRANSPORT_COLORS.WALK;

  // We can use inline styles for dynamic colors or just return the icon
  // Here we return the icon component directly. The parent usually handles color/bg.

  const getIcon = () => {
    switch (normalizedMode) {
      case 'BUS':
        return <Bus size={size} />;
      case 'TRAM':
        return <TrainFront size={size} />; // Lucide doesn't have specific Tram, TrainFront works well
      case 'RAIL':
        return <Train size={size} />;
      case 'SHIP':
        return <Ship size={size} />;
      case 'SUBWAY':
        return <TrainFront size={size} />; // Or generic Train
      case 'AERIAL_LIFT':
      case 'FUNICULAR':
      case 'GONDOLA':
        return <CableCar size={size} />;
      case 'WALK':
        return <Footprints size={size} />;
      default:
        return <Train size={size} />;
    }
  };

  return (
    <div
      className={`inline-flex items-center justify-center ${className}`}
      style={{ color: className.includes('text-') ? undefined : color }}
    >
      {getIcon()}
    </div>
  );
};

export default TransportIcon;
