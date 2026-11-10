import { getBlob } from './blobStore';
import { BUILTIN_SOUNDS, type SoundId } from './settings';

/** Plays one azan at a time. Used by the offscreen document and for previews in Options. */
export function createPlayer() {
  let audio: HTMLAudioElement | null = null;
  let objectUrl: string | null = null;

  function stop() {
    audio?.pause();
    audio = null;
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    objectUrl = null;
  }

  async function play(sound: SoundId, volume: number, onEnd?: () => void) {
    stop();
    // An uploaded file that is missing falls back to the short built-in azan.
    let src: string = BUILTIN_SOUNDS['madinah-short'];
    if (sound === 'custom' || sound === 'custom-fajr') {
      const blob = await getBlob(sound === 'custom' ? 'azan' : 'azan-fajr');
      if (blob) src = objectUrl = URL.createObjectURL(blob);
    } else {
      src = BUILTIN_SOUNDS[sound] ?? src;
    }
    const a = new Audio(src);
    a.volume = Math.min(1, Math.max(0, volume));
    a.onended = () => {
      if (audio === a) stop();
      onEnd?.();
    };
    audio = a;
    await a.play();
  }

  return { play, stop, isPlaying: () => audio !== null };
}
