
import { MusicTrack } from "../types";

const PIXABAY_API_KEY = '53996343-7b9431df16240836951d7f1a4';

export type ScientificMood = 'Clinical' | 'Discovery' | 'Ambient' | 'Cinematic' | 'Microscopic';

const MOOD_QUERY_MAP: Record<ScientificMood, string> = {
  'Clinical': 'minimal clean electronic ambient tech',
  'Discovery': 'inspiring uplifting technological corporate',
  'Ambient': 'deep space textures scientific soundscape',
  'Cinematic': 'orchestral dramatic powerful hybrid',
  'Microscopic': 'abstract synth glitch microscopic sound'
};

const MOCK_FALLBACK_LIBRARY: MusicTrack[] = [
  {
    id: 'px-1',
    title: 'Molecular Resonance',
    artist: 'ScienceSound',
    tags: ['ambient', 'minimal', 'scientific'],
    duration: 184,
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c8a7351b.mp3',
    previewUrl: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c8a7351b.mp3'
  },
  {
    id: 'px-2',
    title: 'The Clean Room',
    artist: 'LabBeats',
    tags: ['clinical', 'precision', 'electronic'],
    duration: 145,
    audioUrl: 'https://cdn.pixabay.com/download/audio/2023/01/24/audio_976092047a.mp3',
    previewUrl: 'https://cdn.pixabay.com/download/audio/2023/01/24/audio_976092047a.mp3'
  },
  {
    id: 'px-3',
    title: 'DNA Sequence',
    artist: 'BioSynthesizer',
    tags: ['upbeat', 'innovation', 'future'],
    duration: 120,
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/11/22/audio_feb5600c02.mp3',
    previewUrl: 'https://cdn.pixabay.com/download/audio/2022/11/22/audio_feb5600c02.mp3'
  }
];

/**
 * Searches Pixabay for royalty-free music tracks.
 * Uses scientific moods to refine searches for high-quality background audio.
 */
export const searchMusic = async (query: string, mood: ScientificMood = 'Ambient'): Promise<MusicTrack[]> => {
  try {
    // Combine raw query parts with mood keywords for best results
    const rawTerms = query.split(' ').slice(0, 2).join(' ');
    const moodTerms = MOOD_QUERY_MAP[mood];
    const finalQuery = encodeURIComponent(`${rawTerms} ${moodTerms}`);
    
    // We filter for music, popular order, and minimum duration to avoid short SFX
    const searchUrl = `https://pixabay.com/api/music/?key=${PIXABAY_API_KEY}&q=${finalQuery}&order=popular&per_page=12`;
    
    const response = await fetch(searchUrl);
    
    if (!response.ok) {
        throw new Error(`Pixabay API responded with status: ${response.status}`);
    }

    const data = await response.json();

    if (data && data.hits && data.hits.length > 0) {
      // Filter for actual music tracks (usually longer than 30s)
      return data.hits
        .filter((hit: any) => (hit.duration || 0) > 30)
        .slice(0, 6)
        .map((hit: any) => ({
          id: `px-${hit.id}`,
          title: hit.tags?.split(',')[0].replace(/[^a-zA-Z ]/g, "").trim() || 'Scientific Backdrop',
          artist: hit.user || 'Pixabay Contributor',
          tags: hit.tags?.split(',').map((t: string) => t.trim().toLowerCase()).filter((t: string) => t.length > 2) || ['science', 'ambient'],
          duration: hit.duration || 0,
          audioUrl: hit.audio || hit.preview || '',
          previewUrl: hit.preview || ''
        }));
    }
  } catch (error) {
    console.warn("Pixabay live search unavailable. Falling back to scientific mood library.", error);
  }

  // Robust fallback
  return MOCK_FALLBACK_LIBRARY;
};