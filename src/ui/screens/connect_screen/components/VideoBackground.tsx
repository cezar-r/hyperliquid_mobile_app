import React, { useEffect, useState, useRef } from 'react';
import { Video, ResizeMode } from 'expo-av';
import { styles } from '../styles/VideoBackground.styles';

const VIDEO_PATH = require('../../../../../assets/blob.mp4');

export default function VideoBackground(): React.JSX.Element {
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);
  const videoRef = useRef<Video>(null);

  useEffect(() => {
    if (videoError) {
      const retryTimer = setTimeout(() => {
        videoRef.current?.loadAsync(VIDEO_PATH, {}, false);
      }, 1000);
      return () => clearTimeout(retryTimer);
    }
  }, [videoError]);

  return (
    <Video
      ref={videoRef}
      source={VIDEO_PATH}
      style={[styles.videoBackground, !isVideoReady && styles.videoHidden]}
      resizeMode={ResizeMode.COVER}
      shouldPlay
      isLooping
      isMuted
      onLoad={() => {
        setIsVideoReady(true);
        setVideoError(null);
      }}
      onError={(error) => {
        console.error('[VideoBackground] Video playback error:', error);
        setVideoError(error);
        videoRef.current?.playAsync();
      }}
      onPlaybackStatusUpdate={(status) => {
        if (!status.isLoaded && isVideoReady) {
          videoRef.current?.replayAsync();
        }
      }}
    />
  );
}

