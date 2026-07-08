'use client';

import { Listing } from '@/lib/types';
import ListingCard from './ListingCard';
import { Trash2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useState } from 'react';

export default function FavoriteListingCard({ listing }: { listing: Listing }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const supabase = createClient();

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsDeleting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('favorites')
          .delete()
          .match({ user_id: user.id, listing_id: listing.id });
        window.location.reload();
      }
    } catch (error) {
      console.error('Error deleting favorite:', error);
      setIsDeleting(false);
    }
  };

  return (
    <div className="relative">
      <ListingCard listing={listing} />
      <button
        onClick={handleDelete}
        disabled={isDeleting}
        className="absolute right-2 top-2 rounded-full bg-night/80 p-2 text-white transition hover:bg-night/90 disabled:opacity-50"
        title="Удалить из избранного"
      >
        <Trash2 size={18} />
      </button>
    </div>
  );
}
