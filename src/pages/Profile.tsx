import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Settings, LogOut } from 'lucide-react';
import type { Video, Profile, SocialLink } from '../lib/types';

export function Profile() {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<<Profile | null>(null);
  const [videos, setVideos] = useState<<Video[]>([]);
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editBirthDate, setEditBirthDate] = useState('');
  const [editAvatar, setEditAvatar] = useState('');

  useEffect(() => { if (!user) return; loadProfile(); }, [user]);

  const loadProfile = async () => {
    if (!user) return;
    const [p, v, s] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('videos').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('social_links').select('*').eq('user_id', user.id),
    ]);
    setProfile(p.data); setVideos(v.data || []); setSocialLinks(s.data || []);
    if (p.data) {
      setEditName(p.data.display_name || p.data.username);
      setEditBio(p.data.bio || '');
      setEditBirthDate(p.data.birth_date || '');
      setEditAvatar(p.data.avatar_url || '');
    }
    setLoading(false);
  };

  const saveProfile = async () => {
    if (!user) return;
    await supabase.from('profiles').update({
      display_name: editName, bio: editBio, birth_date: editBirthDate || null, avatar_url: editAvatar || null,
    }).eq('id', user.id);
    setEditing(false); loadProfile();
  };

  const handleSignOut = async () => { await signOut(); };

  if (loading) return <div className="flex items-center justify-center h-screen bg-black"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white" /></div>;
  if (!profile) return <div className="flex items-center justify-center h-screen bg-black text-gray-500">Profile not found</div>;

  return (
    <div className="min-h-screen bg-black px-4 pt-6 pb-24">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold">My Profile</h1>
          <div className="flex items-center gap-3">
            <button onClick={() => setEditing(!editing)} className="text-gray-400 hover:text-white"><Settings size={20} /></button>
            <button onClick={handleSignOut} className="text-gray-400 hover:text-white"><LogOut size={20} /></button>
          </div>
        </div>
        <div className="flex items-center gap-4 mb-6">
          <div className="w-20 h-20 rounded-full bg-gray-700 overflow-hidden flex items-center justify-center border-2 border-white/20">
            {profile.avatar_url ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" /> : <span className="text-white text-2xl font-bold">{profile.username[0].toUpperCase()}</span>}
          </div>
          <div className="flex-1">
            <p className="text-lg font-bold">{profile.display_name || profile.username}</p>
            <p className="text-sm text-gray-500">@{profile.username}</p>
          </div>
        </div>
        <div className="flex gap-6 mb-6">
          <div className="text-center"><p className="text-lg font-bold">{videos.length}</p><p className="text-xs text-gray-500">Posts</p></div>
          <div className="text-center"><p className="text-lg font-bold">{profile.followers_count}</p><p className="text-xs text-gray-500">Followers</p></div>
          <div className="text-center"><p className="text-lg font-bold">{profile.following_count}</p><p className="text-xs text-gray-500">Following</p></div>
        </div>
        {editing ? (
          <div className="bg-white/5 rounded-xl p-4 mb-6 border border-white/10">
            <input placeholder="Display name" value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 mb-3 text-white outline-none" />
            <textarea placeholder="Bio" value={editBio} onChange={(e) => setEditBio(e.target.value)} className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 mb-3 text-white outline-none resize-none h-20" />
            <input type="date" value={editBirthDate} onChange={(e) => setEditBirthDate(e.target.value)} className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 mb-3 text-white outline-none" />
            <input placeholder="Avatar URL (optional)" value={editAvatar} onChange={(e) => setEditAvatar(e.target.value)} className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 mb-3 text-white outline-none" />
            <div className="flex gap-2">
              <button onClick={saveProfile} className="flex-1 bg-white text-black font-semibold py-2 rounded-lg text-sm">Save</button>
              <button onClick={() => setEditing(false)} className="flex-1 bg-white/10 text-white py-2 rounded-lg text-sm">Cancel</button>
            </div>
          </div>
        ) : (
          <p className="text-gray-400 text-sm mb-6">{profile.bio || 'No bio yet'}</p>
        )}
        {socialLinks.length > 0 && (
          <div className="flex gap-3 overflow-x-auto hide-scrollbar mb-6">
            {socialLinks.map((link) => (
              <a key={link.id} href={link.platform_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full text-xs whitespace-nowrap hover:bg-white/20 transition-colors">{link.platform}</a>
            ))}
          </div>
        )}
        <h2 className="text-sm font-semibold text-gray-400 uppercase mb-4">My Videos</h2>
        {videos.length === 0 ? <p className="text-gray-500 text-sm text-center py-8">No videos yet. Go to Upload to share your first video!</p> : (
          <div className="grid grid-cols-3 gap-1">
            {videos.map((video) => (
              <Link key={video.id} to={`/video/${video.id}`} className="aspect-[3/4] bg-gray-900 rounded-lg overflow-hidden">
                <img src={video.thumbnail_url || video.video_url} alt="" className="w-full h-full object-cover" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
