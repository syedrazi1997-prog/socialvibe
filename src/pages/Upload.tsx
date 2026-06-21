import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { UploadCloud, X, Loader2, AlertTriangle } from 'lucide-react';

export function Upload() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<<HTMLInputElement>(null);
  const [caption, setCaption] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState<string | null>(null);
  const [ageRating, setAgeRating] = useState<'all' | '13+' | '18+'>('all');

  const AGE_RATINGS = [
    { value: 'all' as const, label: 'All Ages', desc: 'Safe for everyone', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
    { value: '13+' as const, label: '13+', desc: 'Teen content', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
    { value: '18+' as const, label: '18+', desc: 'Adult content', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
  ];

  const handleFileSelect = (e: React.ChangeEvent<<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    if (!selected.type.startsWith('video/')) { setError('Please select a video file'); return; }
    if (selected.size > 100 * 1024 * 1024) { setError('Video must be under 100MB'); return; }
    setFile(selected); setError(''); setPreview(URL.createObjectURL(selected));
  };

  const handleUpload = async () => {
    if (!file || !user) return;
    setUploading(true); setError('');
    try {
      const fileName = `${user.id}/${Date.now()}-${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('videos').upload(fileName, file, { cacheControl: '3600', upsert: false });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('videos').getPublicUrl(uploadData.path);
      const { error: dbError } = await supabase.from('videos').insert({
        caption: caption || null, video_url: publicUrl, age_rating: ageRating,
      });
      if (dbError) throw dbError;
      navigate('/');
    } catch (err: any) { setError(err.message || 'Upload failed'); } finally { setUploading(false); }
  };

  return (
    <div className="min-h-screen bg-black px-4 pt-8 pb-24">
      <div className="max-w-md mx-auto">
        <h1 className="text-xl font-bold mb-6">Upload Video</h1>
        {!file ? (
          <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-white/20 rounded-xl p-12 flex flex-col items-center gap-4 cursor-pointer hover:border-white/40 transition-colors">
            <UploadCloud size={48} className="text-white/60" />
            <p className="text-white/60 text-center">Tap to select a video<br/>(Max 100MB)</p>
          </div>
        ) : (
          <div className="relative rounded-xl overflow-hidden bg-black mb-4">
            {preview && <video src={preview} className="w-full max-h-[400px] object-contain" controls />}
            <button onClick={() => { setFile(null); setPreview(null); }} className="absolute top-2 right-2 w-8 h-8 bg-black/60 rounded-full flex items-center justify-center"><X size={16} /></button>
          </div>
        )}
        <input ref={fileInputRef} type="file" accept="video/*" onChange={handleFileSelect} className="hidden" />
        <textarea placeholder="Add a caption..." value={caption} onChange={(e) => setCaption(e.target.value)} className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 mt-4 text-white outline-none focus:border-white/50 resize-none h-24" />
        <div className="mt-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={14} className="text-yellow-400" />
            <p className="text-sm text-gray-400">Age Rating</p>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {AGE_RATINGS.map((rating) => (
              <button key={rating.value} onClick={() => setAgeRating(rating.value)} className={`flex flex-col items-center gap-1 p-3 rounded-lg border transition-all text-center ${ageRating === rating.value ? rating.color + ' border-current' : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'}`}>
                <span className="text-sm font-semibold">{rating.label}</span>
                <span className="text-[10px] text-gray-400">{rating.desc}</span>
              </button>
            ))}
          </div>
        </div>
        {error && <p className="text-red-400 text-sm mt-4">{error}</p>}
        <button onClick={handleUpload} disabled={!file || uploading} className="w-full bg-white text-black font-semibold py-3 rounded-lg mt-4 hover:bg-white/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
          {uploading ? <><Loader2 size={18} className="animate-spin" />Uploading...</> : 'Post'}
        </button>
      </div>
    </div>
  );
}
