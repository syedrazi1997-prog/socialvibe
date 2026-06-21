import { useState, useEffect } from 'react';
import { Heart, MessageCircle, Share2, Bookmark, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { Video } from '../lib/types';

interface VideoSidebarProps { video: Video; }

const RATING_COLORS: Record<string, string> = {
  all: 'bg-green-500/60 text-white', '13+': 'bg-yellow-500/60 text-white', '18+': 'bg-red-500/60 text-white',
};

export function VideoSidebar({ video }: VideoSidebarProps) {
  const { user } = useAuth();
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(video.likes_count);
  const [profile, setProfile] = useState<{ username: string; avatar_url: string | null } | null>(null);
  const [showComments, setShowComments] = useState(false);

  useEffect(() => { if (user) checkIfLiked(); loadProfile(); }, [user, video.id]);

  const loadProfile = async () => {
    const { data } = await supabase.from('profiles').select('username, avatar_url').eq('id', video.user_id).single();
    if (data) setProfile(data);
  };

  const checkIfLiked = async () => {
    if (!user) return;
    const { data } = await supabase.from('likes').select('id').eq('user_id', user.id).eq('video_id', video.id).maybeSingle();
    setLiked(!!data);
  };

  const toggleLike = async () => {
    if (!user) return;
    if (liked) {
      await supabase.from('likes').delete().eq('user_id', user.id).eq('video_id', video.id);
      setLiked(false); setLikesCount((c) => c - 1);
    } else {
      await supabase.from('likes').insert({ video_id: video.id });
      setLiked(true); setLikesCount((c) => c + 1);
    }
  };

  const sidebarBtn = (Icon: typeof Heart, count: number | string, onClick?: () => void, active?: boolean) => (
    <button onClick={onClick} className="flex flex-col items-center gap-1 mb-5 group">
      <div className={`w-12 h-12 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center transition-all ${active ? 'bg-white/20' : 'group-hover:bg-white/10'}`}>
        <Icon size={28} strokeWidth={1.5} className={active ? 'text-red-500 fill-red-500' : 'text-white'} />
      </div>
      <span className="text-xs font-medium text-white drop-shadow-lg">{count}</span>
    </button>
  );

  return (
    <div className="absolute right-3 bottom-24 flex flex-col items-center z-20">
      <Link to={`/user/${video.user_id}`} className="mb-4">
        <div className="w-12 h-12 rounded-full bg-white/20 overflow-hidden border-2 border-white/50">
          {profile?.avatar_url ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center bg-gray-700"><span className="text-white text-xs font-bold">{profile?.username?.[0]?.toUpperCase() || 'U'}</span></div>}
        </div>
      </Link>
      {sidebarBtn(Heart, likesCount, toggleLike, liked)}
      {sidebarBtn(MessageCircle, video.comments_count, () => setShowComments(true))}
      {sidebarBtn(Bookmark, 0)}
      {sidebarBtn(Share2, 0)}
      {video.age_rating !== 'all' && (
        <div className="mt-2">
          <div className={`px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1 ${RATING_COLORS[video.age_rating] || 'bg-gray-500/60'}`}>
            <Shield size={10} /> {video.age_rating}
          </div>
        </div>
      )}
    </div>
  );
}
