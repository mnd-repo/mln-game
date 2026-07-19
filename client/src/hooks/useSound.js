import { useEffect } from 'react';

// Drop a matching file into client/public/assets/sounds/ to enable each
// sound — see the README in that folder. If the file is missing, play()
// rejects and we swallow the error; nothing breaks and nothing plays.
const SOUND_PATHS = {
  'writer-countdown': '/assets/sounds/writer-countdown.mp3',
  'manager-countdown': '/assets/sounds/manager-countdown.mp3',
  'round-complete': '/assets/sounds/round-complete.mp3'
};

/**
 * Plays a named sound effect once, the moment the calling component mounts.
 * Pass `active=false` to skip (e.g. only the job seeker should hear the
 * writer countdown, not everyone viewing that phase).
 */
export function usePlaySoundOnMount(key, { volume = 0.55, active = true } = {}) {
  useEffect(() => {
    if (!active) return undefined;
    const src = SOUND_PATHS[key];
    if (!src) return undefined;

    const audio = new Audio(src);
    audio.volume = volume;
    audio.play().catch(() => {
      /* asset missing or autoplay blocked — silently ignore */
    });

    return () => {
      audio.pause();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, active]);
}
