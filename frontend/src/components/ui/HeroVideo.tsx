import React, { useEffect, useRef, useState } from 'react';
import { YouTubePlayer, loadYouTubeApi } from '../../lib/youtube';

interface HeroVideoProps {
  videoId: string;
  active: boolean;
  playing: boolean;
  muted: boolean;
  onTime?: (current: number, duration: number) => void;
  onEnded?: () => void;
  onUnavailable?: () => void;
}

const HeroVideo: React.FC<HeroVideoProps> = ({
  videoId,
  active,
  playing,
  muted,
  onTime,
  onEnded,
  onUnavailable,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YouTubePlayer | null>(null);
  const [ready, setReady] = useState(false);

  const onTimeRef = useRef(onTime);
  const onEndedRef = useRef(onEnded);
  const onUnavailableRef = useRef(onUnavailable);
  const stateRef = useRef({ active, playing });
  onTimeRef.current = onTime;
  onEndedRef.current = onEnded;
  onUnavailableRef.current = onUnavailable;
  stateRef.current = { active, playing };

  useEffect(() => {
    let cancelled = false;
    setReady(false);

    loadYouTubeApi().then((api) => {
      if (cancelled || !mountRef.current) return;

      playerRef.current = new api.Player(mountRef.current, {
        videoId,
        playerVars: {
          autoplay: 1,
          mute: 1,
          controls: 0,
          disablekb: 1,
          fs: 0,
          iv_load_policy: 3,
          modestbranding: 1,
          playsinline: 1,
          rel: 0,
          loop: 1,
          playlist: videoId,
        },
        events: {
          onReady: (event: { target: YouTubePlayer }) => {
            event.target.mute();
            if (stateRef.current.active && stateRef.current.playing) event.target.playVideo();
            setReady(true);
          },

          onError: () => {
            onUnavailableRef.current?.();
          },
          onStateChange: (event: { data: number }) => {
            if (event.data === 0) onEndedRef.current?.();
          },
        },
      });
    });

    return () => {
      cancelled = true;
      playerRef.current?.destroy();
      playerRef.current = null;
      setReady(false);
    };
  }, [videoId]);

  useEffect(() => {
    const player = playerRef.current;
    if (!player || !ready) return;

    if (muted) player.mute();
    else player.unMute();

    if (active && playing) player.playVideo();
    else player.pauseVideo();
  }, [ready, active, playing, muted]);

  useEffect(() => {
    if (!active || !onTime) return undefined;

    const timer = setInterval(() => {
      const player = playerRef.current;
      if (!player || !ready) return;
      onTimeRef.current?.(player.getCurrentTime(), player.getDuration());
    }, 250);

    return () => clearInterval(timer);
  }, [ready, active, onTime]);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        ref={mountRef}
        className="absolute left-1/2 top-1/2 h-[56.25vw] min-h-full w-[177.78vh] min-w-full -translate-x-1/2 -translate-y-1/2"
      />
    </div>
  );
};

export default HeroVideo;
