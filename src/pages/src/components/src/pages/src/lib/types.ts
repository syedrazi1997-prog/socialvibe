export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: { id: string; username: string; display_name: string | null; avatar_url: string | null; bio: string | null; birth_date: string | null; followers_count: number; following_count: number; created_at: string; };
        Insert: { id?: string; username?: string; display_name?: string | null; avatar_url?: string | null; bio?: string | null; birth_date?: string | null; followers_count?: number; following_count?: number; created_at?: string; };
        Update: { id?: string; username?: string; display_name?: string | null; avatar_url?: string | null; bio?: string | null; birth_date?: string | null; followers_count?: number; following_count?: number; created_at?: string; };
      };
      videos: {
        Row: { id: string; user_id: string; caption: string | null; video_url: string; thumbnail_url: string | null; age_rating: string; views_count: number; likes_count: number; comments_count: number; created_at: string; };
        Insert: { id?: string; user_id?: string; caption?: string | null; video_url: string; thumbnail_url?: string | null; age_rating?: string; views_count?: number; likes_count?: number; comments_count?: number; created_at?: string; };
        Update: { id?: string; user_id?: string; caption?: string | null; video_url?: string; thumbnail_url?: string | null; age_rating?: string; views_count?: number; likes_count?: number; comments_count?: number; created_at?: string; };
      };
      likes: { Row: { id: string; user_id: string; video_id: string; created_at: string; }; Insert: { id?: string; user_id?: string; video_id: string; created_at?: string; }; Update: { id?: string; user_id?: string; video_id?: string; created_at?: string; }; };
      comments: { Row: { id: string; user_id: string; video_id: string; parent_id: string | null; content: string; likes_count: number; created_at: string; }; Insert: { id?: string; user_id?: string; video_id: string; parent_id?: string | null; content: string; likes_count?: number; created_at?: string; }; Update: { id?: string; user_id?: string; video_id?: string; parent_id?: string | null; content?: string; likes_count?: number; created_at?: string; }; };
      follows: { Row: { id: string; follower_id: string; following_id: string; created_at: string; }; Insert: { id?: string; follower_id?: string; following_id: string; created_at?: string; }; Update: { id?: string; follower_id?: string; following_id?: string; created_at?: string; }; };
      social_links: { Row: { id: string; user_id: string; platform: string; platform_url: string; display_name: string | null; created_at: string; }; Insert: { id?: string; user_id?: string; platform: string; platform_url: string; display_name?: string | null; created_at?: string; }; Update: { id?: string; user_id?: string; platform?: string; platform_url?: string; display_name?: string | null; created_at?: string; }; };
    };
  };
};

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Video = Database['public']['Tables']['videos']['Row'];
export type Like = Database['public']['Tables']['likes']['Row'];
export type Comment = Database['public']['Tables']['comments']['Row'];
export type Follow = Database['public']['Tables']['follows']['Row'];
export type SocialLink = Database['public']['Tables']['social_links']['Row'];
