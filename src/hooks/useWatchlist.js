import { useState } from 'react';

const STORAGE_KEY = 'ca_watchlist';

function readStorage() {
  try {
    return new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'));
  } catch {
    return new Set();
  }
}

export function useWatchlist() {
  const [watchlist, setWatchlist] = useState(readStorage);

  const toggle = (playerId) => {
    setWatchlist(prev => {
      const next = new Set(prev);
      if (next.has(playerId)) {
        next.delete(playerId);
      } else {
        next.add(playerId);
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]));
      return next;
    });
  };

  const isStarred = (playerId) => watchlist.has(playerId);

  return { watchlist, toggle, isStarred };
}
