import { useEffect, useState } from 'react';
import { naviqoreService } from '../services/naviqoreService';
import { Stop } from '../types';
import { useDebounce } from './useDebounce';

export const useStopSearch = () => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Stop[]>([]);
  const [loading, setLoading] = useState(false);

  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    if (debouncedQuery.length < 3) {
      setSuggestions([]);
      return;
    }

    const fetchStops = async () => {
      setLoading(true);
      try {
        const res = await naviqoreService.autocompleteStops(debouncedQuery);
        if (Array.isArray(res.data)) {
          setSuggestions(res.data);
        } else {
          setSuggestions([]);
        }
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchStops();
  }, [debouncedQuery]);

  const clear = () => {
    setQuery('');
    setSuggestions([]);
  };

  return { query, setQuery, suggestions, loading, clear, setSuggestions };
};
