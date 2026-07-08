export type Profile = {
  id: string;
  name: string;
  gender: 'male' | 'female' | 'other';
  country: string;
  city: string;
  bio: string;
  avatar_url: string | null;
  allow_messages: boolean;
  show_on_map: boolean;
  lat: number | null;
  lng: number | null;
  created_at: string;
};

export type Listing = {
  id: string;
  user_id: string;
  title: string;
  description: string;
  country: string;
  city: string;
  to_country: string;
  to_city: string;
  companion_type?: string | null;
  tourism_type?: string | null;
  budget: number | null;
  date_from: string | null;
  date_to: string | null;
  photo_url: string | null;
  lat: number | null;
  lng: number | null;
  show_on_map: boolean;
  is_active: boolean;
  created_at: string;
  profiles?: Profile;
};

export type Conversation = {
  id: string;
  user_a: string;
  user_b: string;
  created_at: string;
};

export type Message = {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  read_at?: string | null;
};

export const GENDER_LABEL: Record<string, string> = {
  male: 'Мужчина',
  female: 'Женщина',
  other: 'Не указан',
};
