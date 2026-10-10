/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { TranscriptionResult } from '../types/music';
import {
  Play,
  Pause,
  Square,
  RotateCcw,
  Volume2,
  Gauge,
  Bell,
  BellOff,
  SkipForward,
  ChevronRight
} from 'lucide-react';

interface PlaybackControllerProps {
  score: TranscriptionResult;
  isPlaying: boolean;
  currentStep: number;
  totalSteps: number;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  onSeek: (step: number) => void;
  playbackSpeed: number;
  onSpeedChange: (speed: number) => void;
  isMetronomeOn: boolean;
  onToggleMetronome: () => void;
}

export const PlaybackController: React.FC<PlaybackControllerProps> = ({
  score,
  isPlaying,
  currentStep,
  totalSteps,
  onPlay,
  onPause,
  onStop,
  onSeek,
  playbackSpeed,
  onSpeedChange,
  isMetronomeOn,
  onToggleMetronome
}) => {
  const currentMeasure = Math.floor(currentStep / 4) + 1;
  const totalMeasures = Math.max(1, Math.ceil(totalSteps / 4));
  const progressPercent = totalSteps > 0 ? (currentStep / totalSteps) * 100 : 0;

  return (
    <div className="w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-2xl backdrop-blur-md">
      <div className="flex flex-col lg:flex-row items-center justify-between gap-5">
        {/* Track Info Badge */}
        <div className="flex items-center gap-3.5 w-full lg:w-auto">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500/20 to-purple-500/20 border border-amber-500/30 flex items-center justify-center text-amber-300 font-bold text-lg shrink-0">
            🎹
          </div>
          <div className="overflow-hidden">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-100 truncate">{score.title}</h3>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
                {score.key}
              </span>
            </div>
            <p className="text-xs text-slate-400 truncate">
              {score.artist} · <span className="font-mono text-slate-300">♩ = {score.bpm} BPM</span>
            </p>
          </div>
        </div>

        {/* Center: Transport Controls */}
        <div className="flex flex-col items-center gap-2.5 w-full lg:w-1/2">
          <div className="flex items-center gap-3">
            <button
              onClick={onStop}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
              title="처음으로 되감기 / 정지"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {isPlaying ? (
              <button
                onClick={onPause}
                className="w-12 h-12 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center justify-center font-bold shadow-lg shadow-amber-500/30 transition-all cursor-pointer"
                title="일시 정지"
              >
                <Pause className="w-5 h-5 fill-current" />
              </button>
            ) : (
              <button
                onClick={onPlay}
                className="w-12 h-12 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 flex items-center justify-center font-bold shadow-lg shadow-amber-500/30 transition-all cursor-pointer"
                title="피아노 연주 재생"
              >
                <Play className="w-5 h-5 fill-current ml-0.5" />
              </button>
            )}

            <button
              onClick={onStop}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
              title="연주 중단"
            >
              <Square className="w-4 h-4" />
            </button>
          </div>

          {/* Progress Timeline Slider */}
          <div className="w-full flex items-center gap-3 text-xs text-slate-400">
            <span className="font-mono text-[11px] w-12 text-right">
              M.{currentMeasure}
            </span>
            <div className="relative flex-1 flex items-center">
              <input
                type="range"
                min="0"
                max={Math.max(1, totalSteps - 1)}
                value={currentStep}
                onChange={(e) => onSeek(parseInt(e.target.value, 10))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
            </div>
            <span className="font-mono text-[11px] w-12">
              / M.{totalMeasures}
            </span>
          </div>
        </div>

        {/* Right: Tempo & Metronome */}
        <div className="flex items-center gap-2.5 justify-end w-full lg:w-auto">
          {/* Metronome Toggle */}
          <button
            onClick={onToggleMetronome}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
              isMetronomeOn
                ? 'bg-amber-500/10 border-amber-500/40 text-amber-400 shadow-sm'
                : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
            title="메트로놈 클릭 비트 켜기/끄기"
          >
            {isMetronomeOn ? <Bell className="w-3.5 h-3.5" /> : <BellOff className="w-3.5 h-3.5" />}
            메트로놈
          </button>

          {/* Speed Selector */}
          <div className="flex items-center bg-slate-950/80 rounded-xl border border-slate-800 p-1 text-xs">
            <span className="text-slate-500 px-1.5 font-mono">속도</span>
            {[0.75, 1.0, 1.25].map((speed) => (
              <button
                key={speed}
                onClick={() => onSpeedChange(speed)}
                className={`px-2 py-1 rounded-lg font-mono transition-all cursor-pointer ${
                  playbackSpeed === speed
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {speed}x
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
