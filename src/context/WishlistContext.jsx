import { createContext, useContext, useState } from 'react';
import { useAuth } from './AuthContext';
import { loadWishlist, saveWishlist } from '../services/storage';

const WishlistContext = createContext(null);

export function WishlistProvider({ children }) {
  const { user, loading } = useAuth();
  const owner = loading ? undefined : (user?.uid ?? null);
  const [state, setState] = useState({ owner: undefined, items: [] });

  if (state.owner !== owner) {
    setState({ owner, items: owner ? loadWishlist(owner) : [] });
  }

  const wishlist = state.items;

  function toggleWishlist(id) {
    const next = wishlist.includes(id) ? wishlist.filter((item) => item !== id) : [...wishlist, id];
    if (owner) saveWishlist(owner, next);
    setState({ owner, items: next });
  }

  return (
    <WishlistContext.Provider value={{ wishlist, toggleWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  return useContext(WishlistContext);
}
