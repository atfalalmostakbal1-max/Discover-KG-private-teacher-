
import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';

interface AudioPlayerProps {
  base64Audio: string | null;
  isPlaying: boolean;
  onEnded?: () => void;
  onStart?: () => void;
}

export interface AudioPlayerHandle {
  pause: () => void;
  resume: () => void;
}

const AudioPlayer = forwardRef<AudioPlayerHandle, AudioPlayerProps>(({ base64Audio, isPlaying, onEnded, onStart }, ref) => {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const startTimeRef = useRef<number>(0);
  const pausedAtRef = useRef<number>(0);
  const bufferRef = useRef<AudioBuffer | null>(null);

  useImperativeHandle(ref, () => ({
    pause: () => {
      if (sourceRef.current && audioCtxRef.current) {
        pausedAtRef.current = audioCtxRef.current.currentTime - startTimeRef.current;
        sourceRef.current.stop();
        sourceRef.current = null;
      }
    },
    resume: () => {
      if (bufferRef.current && audioCtxRef.current) {
        playFrom(pausedAtRef.current);
      }
    }
  }));

  const playFrom = (offset: number) => {
    if (!audioCtxRef.current || !bufferRef.current) return;
    
    const source = audioCtxRef.current.createBufferSource();
    source.buffer = bufferRef.current;
    source.connect(audioCtxRef.current.destination);
    
    source.onended = () => {
      // فقط إذا وصل لنهاية الملف فعلياً وليس نتيجة stop() للإيقاف المؤقت
      if (audioCtxRef.current && (audioCtxRef.current.currentTime - startTimeRef.current >= bufferRef.current!.duration - 0.1)) {
        onEnded?.();
      }
    };

    startTimeRef.current = audioCtxRef.current.currentTime - offset;
    source.start(0, offset);
    sourceRef.current = source;
  };

  useEffect(() => {
    if (!base64Audio) return;

    const initAudio = async () => {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      audioCtxRef.current = audioCtx;
      
      const decode = (base64: string) => {
        const binaryString = atob(base64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes;
      };

      const decodeAudioData = async (data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number) => {
        const dataInt16 = new Int16Array(data.buffer);
        const frameCount = dataInt16.length / numChannels;
        const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
        for (let channel = 0; channel < numChannels; channel++) {
          const channelData = buffer.getChannelData(channel);
          for (let i = 0; i < frameCount; i++) {
            channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
          }
        }
        return buffer;
      };

      try {
        const buffer = await decodeAudioData(decode(base64Audio), audioCtx, 24000, 1);
        bufferRef.current = buffer;
        onStart?.();
        playFrom(0);
      } catch (err) {
        console.error("Audio initialization error", err);
      }
    };

    initAudio();

    return () => {
      sourceRef.current?.stop();
      audioCtxRef.current?.close();
    };
  }, [base64Audio]);

  return null;
});

export default AudioPlayer;
