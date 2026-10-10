/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { pianoSynth, noteToMidi } from '../utils/audioPlayer';
import { Volume2, Music, Sparkles } from 'lucide-react';

interface PianoVisualizerProps {
  activeRightNotes: string[];
  activeLeftNotes: string[];
  onKeyClick?: (note: string) => void;
}

// Generate 49 keys from C2 (MIDI 36) to C6 (MIDI 84)
interface KeyDef {
  note: string;
  isBlack: boolean;
  midi: number;
  labelKr: string;
}

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const NOTE_KR: Record<string, string> = {
  C: '도', 'C#': '도#',
  D: '레', 'D#': '레#',
  E: '미',
  F: '파', 'F#': '파#',
  G: '솔', 'G#': '솔#',
  A: '라', 'A#': '라#',
  B: '시'
};

const ALL_KEYS: KeyDef[] = [];
for (let midi = 36; midi <= 84; midi++) {
  const octave = Math.floor(midi / 12) - 1;
  const noteIndex = midi % 12;
  const noteBase = NOTE_NAMES[noteIndex];
  const isBlack = noteBase.includes('#');
  ALL_KEYS.push({
    note: `${noteBase}${octave}`,
    isBlack,
    midi,
    labelKr: `${NOTE_KR[noteBase]}${octave}`
  });
}

export const PianoVisualizer: React.FC<PianoVisualizerProps> = ({
  activeRightNotes,
  activeLeftNotes,
  onKeyClick
}) => {
  const [labelMode, setLabelMode] = useState<'scientific' | 'solfege' | 'none'>('scientific');
  const [pressedNote, setPressedNote] = useState<string | null>(null);

  // Normalize incoming active notes for comparison
  const normalizeNote = (n: string) => {
    if (!n) return '';
    return n.trim().toUpperCase()
      .replace('DB', 'C#')
      .replace('EB', 'D#')
      .replace('GB', 'F#')
      .replace('AB', 'G#')
      .replace('BB', 'A#');
  };

  const normRight = new Set(activeRightNotes.map(normalizeNote));
  const normLeft = new Set(activeLeftNotes.map(normalizeNote));

  const handleKeyTouch = (note: string) => {
    setPressedNote(note);
    pianoSynth.playNote(note, 0.8, 0.4);
    if (onKeyClick) onKeyClick(note);
    setTimeout(() => {
      setPressedNote(null);
    }, 250);
  };

  return (
    <div className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-2xl backdrop-blur-md">
      {/* Visualizer Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Music className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              실시간 49건반 피아노 뷰어 (C2 ~ C6)
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
                Web Audio Polyphony
              </span>
            </h3>
            <p className="text-xs text-slate-400">건반을 마우스로 직접 누르거나 재생 시 양손 연주 노트가 실시간 점등됩니다.</p>
          </div>
        </div>

        {/* Legend & Controls */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3 text-xs bg-slate-950/70 px-3 py-1.5 rounded-xl border border-slate-800">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]"></span>
              <span className="text-slate-300 font-medium">오른손 멜로디</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-400 shadow-[0_0_8px_#c084fc]"></span>
              <span className="text-slate-300 font-medium">왼손 화음</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_8px_#fbbf24]"></span>
              <span className="text-slate-300 font-medium">양손 동시</span>
            </div>
          </div>

          <div className="flex items-center gap-1 bg-slate-950/70 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setLabelMode('scientific')}
              className={`px-2 py-1 rounded-lg transition-all ${
                labelMode === 'scientific' ? 'bg-amber-500 text-slate-950 font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              C4 음이름
            </button>
            <button
              onClick={() => setLabelMode('solfege')}
              className={`px-2 py-1 rounded-lg transition-all ${
                labelMode === 'solfege' ? 'bg-amber-500 text-slate-950 font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              도레미 계이름
            </button>
            <button
              onClick={() => setLabelMode('none')}
              className={`px-2 py-1 rounded-lg transition-all ${
                labelMode === 'none' ? 'bg-amber-500 text-slate-950 font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              라벨 끄기
            </button>
          </div>
        </div>
      </div>

      {/* Keyboard Container */}
      <div className="relative overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-700">
        <div className="relative flex select-none min-w-[840px] h-40 bg-slate-950 p-2 rounded-xl border border-slate-800 shadow-inner">
          {/* White Keys */}
          {ALL_KEYS.filter(k => !k.isBlack).map((keyDef) => {
            const norm = normalizeNote(keyDef.note);
            const isRight = normRight.has(norm);
            const isLeft = normLeft.has(norm);
            const isBoth = isRight && isLeft;
            const isClicked = pressedNote === keyDef.note;

            let activeClass = 'bg-gradient-to-b from-slate-100 to-slate-200 text-slate-700 hover:from-slate-200 hover:to-slate-300';
            if (isBoth || isClicked) {
              activeClass = 'bg-gradient-to-b from-amber-300 to-amber-500 text-slate-950 shadow-[0_0_20px_#f59e0b] ring-2 ring-amber-400 z-10';
            } else if (isRight) {
              activeClass = 'bg-gradient-to-b from-cyan-300 to-cyan-500 text-slate-950 shadow-[0_0_20px_#06b6d4] ring-2 ring-cyan-400 z-10';
            } else if (isLeft) {
              activeClass = 'bg-gradient-to-b from-purple-300 to-purple-500 text-slate-950 shadow-[0_0_20px_#a855f7] ring-2 ring-purple-400 z-10';
            }

            const isMiddleC = keyDef.note === 'C4';

            return (
              <div
                key={keyDef.note}
                onClick={() => handleKeyTouch(keyDef.note)}
                className={`relative flex-1 min-w-[28px] h-full rounded-b-md border-r border-b border-l border-slate-400/30 transition-all duration-75 cursor-pointer flex flex-col justify-end items-center pb-2 ${activeClass}`}
              >
                {isMiddleC && (
                  <span className="absolute top-2 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-rose-400/50" title="가온 다 (Middle C4)" />
                )}
                {labelMode === 'scientific' && (
                  <span className="text-[10px] font-mono font-bold leading-none select-none opacity-80">
                    {keyDef.note}
                  </span>
                )}
                {labelMode === 'solfege' && (
                  <span className="text-[10px] font-medium leading-none select-none opacity-80">
                    {keyDef.labelKr}
                  </span>
                )}
              </div>
            );
          })}

          {/* Black Keys Layer positioned absolute over white keys */}
          <div className="absolute top-2 left-2 right-2 h-24 pointer-events-none flex">
            {ALL_KEYS.filter(k => !k.isBlack).map((whiteKey, idx, arr) => {
              // Check if a black key exists right after this white key
              const whiteMidi = whiteKey.midi;
              const nextMidi = whiteMidi + 1;
              const blackDef = ALL_KEYS.find(k => k.midi === nextMidi && k.isBlack);

              if (!blackDef || idx === arr.length - 1) {
                return (
                  <div key={`spacer-${whiteKey.note}`} className="flex-1 min-w-[28px] relative" />
                );
              }

              const norm = normalizeNote(blackDef.note);
              const isRight = normRight.has(norm);
              const isLeft = normLeft.has(norm);
              const isBoth = isRight && isLeft;
              const isClicked = pressedNote === blackDef.note;

              let blackActiveClass = 'bg-gradient-to-b from-slate-900 via-slate-950 to-black text-slate-400 hover:from-slate-800';
              if (isBoth || isClicked) {
                blackActiveClass = 'bg-gradient-to-b from-amber-400 to-amber-600 text-slate-950 shadow-[0_0_20px_#f59e0b] ring-2 ring-amber-300';
              } else if (isRight) {
                blackActiveClass = 'bg-gradient-to-b from-cyan-400 to-cyan-600 text-slate-950 shadow-[0_0_20px_#06b6d4] ring-2 ring-cyan-300';
              } else if (isLeft) {
                blackActiveClass = 'bg-gradient-to-b from-purple-400 to-purple-600 text-slate-950 shadow-[0_0_20px_#a855f7] ring-2 ring-purple-300';
              }

              return (
                <div key={`wrap-${whiteKey.note}`} className="flex-1 min-w-[28px] relative">
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      handleKeyTouch(blackDef.note);
                    }}
                    className={`pointer-events-auto absolute -right-3 top-0 w-6 h-24 rounded-b-md z-20 cursor-pointer shadow-lg border border-black/80 flex flex-col justify-end items-center pb-1.5 transition-all duration-75 ${blackActiveClass}`}
                  >
                    {labelMode !== 'none' && (
                      <span className="text-[8px] font-mono font-semibold leading-none select-none opacity-90">
                        {labelMode === 'scientific' ? blackDef.note : blackDef.labelKr}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Active playing indicator readout */}
      <div className="mt-3 flex items-center justify-between text-xs text-slate-400 px-1">
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
          <span>현재 타건 음:</span>
          {activeRightNotes.length > 0 ? (
            <span className="font-mono font-semibold text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/60">
              오른손 [{activeRightNotes.join(', ')}]
            </span>
          ) : (
            <span className="text-slate-600">오른손 대기</span>
          )}
          {activeLeftNotes.length > 0 ? (
            <span className="font-mono font-semibold text-purple-400 bg-purple-950/60 px-2 py-0.5 rounded border border-purple-800/60">
              왼손 [{activeLeftNotes.join(', ')}]
            </span>
          ) : (
            <span className="text-slate-600">왼손 대기</span>
          )}
        </div>
        <div className="text-[11px] text-slate-500">
          가온 다(C4) = 붉은 점 표시
        </div>
      </div>
    </div>
  );
};
