import {
  useBenchmarkContext,
  type BenchmarkContextType,
  type BenchmarkState,
} from '../contexts/BenchmarkContext';

export type { BenchmarkState };
export type UseBenchmarkReturn = BenchmarkContextType;

export const useBenchmark = (): UseBenchmarkReturn => useBenchmarkContext();
