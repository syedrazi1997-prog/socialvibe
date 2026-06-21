import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, Heart, Send, Loader2, Shield } from 'lucide-react';
import type { Video, Profile, Comment } from '../lib/types';

export function VideoPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [video, setVideo] = useState<<Video | null>(null);
  const [profile, setProfile] = useState<<Profile | null>(null);
  const [comments, setComments] = useState<<Comment[]>([]);
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [commentText, setCommentText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sendingComment, setSendingComment] = useState(false);

  useEffect(() => { if (!id) return; loadVideo(); }, [id]);
  useEffect(() => { if (!user || !id) return; checkIfLiked(); }, [user, id]);

  const loadVideo = async () => {
    if (!id) return;
    const { data: v } = await supabase.from('videos').select('*').eq('id', id).single();
    if (!v) { setLoading(false); return; }
    setVideo(v); setLikesCount(v.likes_count);
    const { data: p } = await supabase.from('profiles').select('*').eq('id', v.user_id).single();
    setProfile(p); loadComments(); setLoading(false);
  };

  const loadComments = async () => {
    if (!id) return;
    const { data } = await supabase.from('comments').select('*').eq('video_id', id).is('parent_id', null).order('created_at', { ascending: false });
    setComments(data || []);
  };

  const checkIfLiked = async () => {
    if (!user || !id) return;
    const { data } = await supabase.from('likes').select('id').eq('user_id', user.id).eq('video_id', id).maybeSingle();
    setLiked(!!data);
  };

  const toggleLike = async () => {
    if (!user || !id) return;
    if (liked) {
      await supabase.from('likes').delete().eq('user_id', user.id).eq('video_id', id);
      setLiked(false); setLikesCount((c) => c - 1);
    } else {
      await supabase.from('likes').insert({ video_id: id });
      setLiked(true); setLikesCount((c) => c + 1);
    }
  };

  const postComment = async () => {
    if (!user || !id || !commentText.trim()) return;
    setSendingComment(true);
    const { error } = await supabase.from('comments').insert({ video_id: id, content: commentText.trim() });
    if (!error) { setCommentText(''); loadComments(); }
    setSendingComment(false);
  };

  if (loading) return <div className="flex items-center justify-center h-screen bg-black"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white" /></div>;
  if (!video) return <div className="flex items-center justify-center h-screen bg-black text-gray-500">Video not found</div>;

  return (
    <div className="min-h-screen bg-black pb-24">
      <div className="relative">
        <Link to="/" className="absolute top-4 left-4 z-20 w-10 h-10 bg-black/50 rounded-full flex items-center justify-center"><ArrowLeft size={20} className="text-white" /></Link>
        <video src={video.video_url} className="w-full max-h-[70vh] object-cover bg-black" controls autoPlay playsInline muted />
      </div>
      <div className="px-4 py-4">
        <div className="flex items-center justify-between mb-4">
          <Link to={`/user/${video.user_id}`} className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-700 overflow-hidden flex items-center justify-center">
              {profile?.avatar_url ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" /> : <span className="text-white text-sm font-bold">{profile?.username?.[0]?.toUpperCase() || 'U'}</span>}
            </div>
            <div>
              <p className="text-sm font-medium">{profile?.display_name || profile?.username || 'Unknown'}</p>
              <p className="text-xs text-gray-500">@{profile?.username || 'user'}</p>
            </div>
          </Link>
          <button onClick={toggleLike} className="flex items-center gap-1.5 px-4 py-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors">
            <Heart size={18} className={liked ? 'text-red-500 fill-red-500' : 'text-white'} />
            <span className="text-sm font-medium">{likesCount}</span>
          </button>
        </div>
        <div className="flex items-center gap-2 mb-4">
          {video.age_rating === 'all' && <span className="px-2 py-0.5 bg-green-500/20 text-green-400 rounded text-xs font-medium flex items-center gap-1"><Shield size={10} /> All Ages</span>}
          {video.age_rating === '13+' && <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded text-xs font-medium flex items-center gap-1"><Shield size={10} /> 13+</span>}
          {video.age_rating === '18+' && <span className="px-2 py-0.5 bg-red-500/20 text-red-400 rounded text-xs font-medium flex items-center gap-1"><Shield size={10} /> 18+</span>}
        </div>
        <p className="text-sm text-white mb-6">{video.caption || 'No caption'}</p>
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-gray-400 mb-3">{comments.length} Comments</h3>
          <div className="space-y-3 mb-4">{comments.map((comment) => <CommentItem key={comment.id} comment={comment} />)}</div>
        </div>
        {user && (
          <div className="flex gap-2">
            <input placeholder="Add a comment..." value={commentText} onChange={(e) => setCommentText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && postComment()} className="flex-1 bg-white/10 border border-white/20 rounded-full px-4 py-2 text-white outline-none focus:border-white/50 text-sm" />
            <button onClick={postComment} disabled={!commentText.trim() || sendingComment} className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-black disabled:opacity-50">
              {sendingComment ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function CommentItem({ comment }: { comment: Comment }) {
  const [author, setAuthor] = useState<<Profile | null>(null);
  useEffect(() => { supabase.from('profiles').select('*').eq('id', comment.user_id).single().then(({ data }) => { if (data) setAuthor(data); }); }, [comment.user_id]);
  return (
    <div className="flex gap-3">
      <div className="w-8 h-8 rounded-full bg-gray-700 overflow-hidden flex items-center justify-center flex-shrink-0">
        {author?.avatar_url ? <img src={author.avatar_url} alt="" className="w-full h-full object-cover" /> : <span className="text-white text-xs font-bold">{author?.username?.[0]?.toUpperCase() || 'U'}</span>}
      </div>
      <div className="flex-1">
        <p className="text-xs font-medium">{author?.display_name || author?.username || 'Unknown'}</p>
        <p className="text-sm text-gray-300 mt-0.5">{comment.content}</p>
      </div>
    </div>
  );
}
