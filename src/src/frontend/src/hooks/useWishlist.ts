import { useCallback, useState } from "react";

const WISHLIST_PREFIX = "hidestay_wishlist_";

function getWishlistKey(phone: string): string {
  return `${WISHLIST_PREFIX}${phone}`;
}

function loadWishlist(phone: string): string[] {
  try {
    const raw = localStorage.getItem(getWishlistKey(phone));
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function saveWishlist(phone: string, ids: string[]): void {
  localStorage.setItem(getWishlistKey(phone), JSON.stringify(ids));
}

export function useWishlist(phone: string | undefined) {
  const [wishlist, setWishlist] = useState<string[]>(() =>
    phone ? loadWishlist(phone) : [],
  );

  const addToWishlist = useCallback(
    (propertyId: string) => {
      if (!phone) return;
      setWishlist((prev) => {
        if (prev.includes(propertyId)) return prev;
        const next = [...prev, propertyId];
        saveWishlist(phone, next);
        return next;
      });
    },
    [phone],
  );

  const removeFromWishlist = useCallback(
    (propertyId: string) => {
      if (!phone) return;
      setWishlist((prev) => {
        const next = prev.filter((id) => id !== propertyId);
        saveWishlist(phone, next);
        return next;
      });
    },
    [phone],
  );

  const isInWishlist = useCallback(
    (propertyId: string) => wishlist.includes(propertyId),
    [wishlist],
  );

  return { wishlist, addToWishlist, removeFromWishlist, isInWishlist };
}
