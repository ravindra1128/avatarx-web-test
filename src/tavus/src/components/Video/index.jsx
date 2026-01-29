import { useVideoTrack, DailyVideo } from '@daily-co/daily-react';

export const Video = ({ id, className }) => {
  const videoState = useVideoTrack(id);

  return (
    <DailyVideo
      automirror
      sessionId={id}
      type='video'
      className={`h-auto bg-slate-500/80 rounded-md ${className} ${videoState.isOff ? 'hidden' : ''}`}
    />
  );
}