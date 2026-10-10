/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef } from 'react';
import { TranscriptionResult } from '../types/music';
import { extractCleanNoteArrays, parseNotePitch } from '../utils/musicXmlGenerator';
import { pianoSynth } from '../utils/audioPlayer';
import { Printer, ZoomIn, ZoomOut, Maximize2, Sparkles } from 'lucide-react';

interface GrandStaffViewerProps {
  score: TranscriptionResult;
  currentStep: number;
  isPlaying: boolean;
}

// Maps note to vertical staff position in pixels relative to staff lines
// Treble staff lines: E4 (bottom line), G4, B4, D5, F5 (top line)
// Bass staff lines: G2 (bottom line), B2, D3, F3, A3 (top line)
function getNoteStaffY(step: string, octave: number, isTreble: boolean): { y: number; ledgerLines: number[] } {
  // Map step to step index (C=0, D=1, E=2, F=3, G=4, A=5, B=6)
  const stepIdx: Record<string, number> = { C: 0, D: 1, E: 2, F: 3, G: 4, A: 5, B: 6 };
  const totalSteps = octave * 7 + (stepIdx[step.toUpperCase()] || 0);

  if (isTreble) {
    // E4 is line 1 (y = 80). Each step up or down is 7 pixels (half line space)
    // E4 totalSteps = 4*7 + 2 = 30
    const e4Steps = 30;
    const diff = totalSteps - e4Steps;
    const y = 80 - diff * 7;

    // Check ledger lines
    const ledgers: number[] = [];
    if (totalSteps <= 28) {
      // C4 is 28 (y = 94, needs 1 ledger line below)
      ledgers.push(94);
    }
    if (totalSteps <= 26) {
      // A3 (y = 108)
      ledgers.push(108);
    }
    if (totalSteps >= 38) {
      // A5 is 38 (y = 24, needs 1 ledger line above)
      ledgers.push(24);
    }
    if (totalSteps >= 40) {
      // C6 (y = 10)
      ledgers.push(10);
    }
    return { y, ledgerLines: ledgers };
  } else {
    // Bass clef: G2 is line 1 (y = 200).
    // G2 totalSteps = 2*7 + 4 = 18
    const g2Steps = 18;
    const diff = totalSteps - g2Steps;
    const y = 200 - diff * 7;

    const ledgers: number[] = [];
    if (totalSteps >= 28) {
      // C4 is 28 (y = 130, ledger line between staves)
      ledgers.push(130);
    }
    if (totalSteps <= 14) {
      // C2 (y = 228)
      ledgers.push(228);
    }
    return { y, ledgerLines: ledgers };
  }
}

export const GrandStaffViewer: React.FC<GrandStaffViewerProps> = ({
  score,
  currentStep,
  isPlaying
}) => {
  const [zoom, setZoom] = React.useState<number>(1);
  const containerRef = useRef<HTMLDivElement>(null);

  const { rightHand, leftHand } = extractCleanNoteArrays(score);

  // Group notes into 4-note measures
  const maxNotes = Math.max(rightHand.length, leftHand.length);
  const totalMeasures = Math.max(1, Math.ceil(maxNotes / 4));

  const measuresData = Array.from({ length: totalMeasures }, (_, mIdx) => {
    const rNotes = rightHand.slice(mIdx * 4, (mIdx + 1) * 4);
    const lNotes = leftHand.slice(mIdx * 4, (mIdx + 1) * 4);
    return {
      measureNum: mIdx + 1,
      rNotes,
      lNotes
    };
  });

  const activeMeasureIdx = Math.floor(currentStep / 4);
  const activeNoteInMeasure = currentStep % 4;

  const handlePrint = () => {
    window.print();
  };

  const measureWidth = 190;
  const headerWidth = 100;
  const svgTotalWidth = Math.max(880, headerWidth + totalMeasures * measureWidth + 40);

  return (
    <div className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-2xl backdrop-blur-md">
      {/* Viewer Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4 pb-3 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
            <h3 className="text-base font-bold text-slate-100">{score.title || '곡 제목 없음'}</h3>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 font-mono">
              {score.key || 'C Major'}
            </span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
              ♩ = {score.bpm || 80}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            아티스트: <span className="text-slate-200">{score.artist || '미상'}</span> · 대보표 (Grand Staff 피아노 2단 양손 악보)
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-950/80 rounded-xl border border-slate-800 p-1">
            <button
              onClick={() => setZoom(prev => Math.max(0.7, prev - 0.1))}
              className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-200 transition-all"
              title="축소"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono text-slate-300 px-2">{Math.round(zoom * 100)}%</span>
            <button
              onClick={() => setZoom(prev => Math.min(1.5, prev + 0.1))}
              className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-200 transition-all"
              title="확대"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium border border-slate-700 transition-all"
            title="악보 인쇄"
          >
            <Printer className="w-3.5 h-3.5" />
            악보 인쇄
          </button>
        </div>
      </div>

      {/* Sheet Music Canvas Container */}
      <div
        ref={containerRef}
        className="w-full overflow-x-auto bg-[#faf8f2] rounded-xl p-4 border border-amber-900/20 shadow-inner scrollbar-thin scrollbar-thumb-amber-300"
      >
        <div style={{ transform: `scale(${zoom})`, transformOrigin: 'top left', minWidth: `${svgTotalWidth}px` }}>
          <svg
            width={svgTotalWidth}
            height="260"
            viewBox={`0 0 ${svgTotalWidth} 260`}
            className="select-none font-serif"
          >
            {/* Background Texture Subtle Tone */}
            <rect x="0" y="0" width={svgTotalWidth} height="260" fill="#faf8f2" />

            {/* Score Title Header inside paper */}
            <text x={svgTotalWidth / 2} y="22" textAnchor="middle" fill="#1c1917" fontSize="16" fontWeight="bold">
              {score.title}
            </text>
            <text x={svgTotalWidth - 40} y="22" textAnchor="end" fill="#57534e" fontSize="12" fontStyle="italic">
              {score.artist}
            </text>
            <text x="50" y="24" textAnchor="start" fill="#44403c" fontSize="12" fontWeight="bold">
              ♩ = {score.bpm} ({score.key})
            </text>

            {/* Piano Brace Bracket at Start */}
            <path
              d="M 40 40 C 35 100, 32 120, 24 125 C 32 130, 35 150, 40 210"
              fill="none"
              stroke="#1c1917"
              strokeWidth="3"
            />
            <line x1="40" y1="40" x2="40" y2="210" stroke="#1c1917" strokeWidth="2" />

            {/* 5 Staff Lines - Treble Clef (y = 40, 52, 64, 76, 88) */}
            {[40, 52, 64, 76, 88].map((y, idx) => (
              <line key={`treble-line-${idx}`} x1="40" y1={y} x2={svgTotalWidth - 20} y2={y} stroke="#292524" strokeWidth="1.2" />
            ))}

            {/* 5 Staff Lines - Bass Clef (y = 160, 172, 184, 196, 208) */}
            {[160, 172, 184, 196, 208].map((y, idx) => (
              <line key={`bass-line-${idx}`} x1="40" y1={y} x2={svgTotalWidth - 20} y2={y} stroke="#292524" strokeWidth="1.2" />
            ))}

            {/* Clef Symbols & Time Signature Header */}
            {/* Treble Clef (G-Clef) symbol */}
            <text x="46" y="80" fontSize="48" fill="#1c1917" className="select-none font-serif">
              𝄞
            </text>
            {/* Bass Clef (F-Clef) symbol */}
            <text x="46" y="185" fontSize="42" fill="#1c1917" className="select-none font-serif">
              𝄢
            </text>

            {/* Time Signature 4/4 */}
            <text x="80" y="62" fontSize="22" fontWeight="bold" fill="#1c1917">4</text>
            <text x="80" y="86" fontSize="22" fontWeight="bold" fill="#1c1917">4</text>
            <text x="80" y="182" fontSize="22" fontWeight="bold" fill="#1c1917">4</text>
            <text x="80" y="206" fontSize="22" fontWeight="bold" fill="#1c1917">4</text>

            {/* Measures Rendering */}
            {measuresData.map((measure, mIdx) => {
              const mStartX = headerWidth + mIdx * measureWidth;
              const isCurrentMeasure = isPlaying && activeMeasureIdx === mIdx;

              return (
                <g key={`measure-${mIdx}`}>
                  {/* Measure Barline */}
                  <line
                    x1={mStartX + measureWidth}
                    y1="40"
                    x2={mStartX + measureWidth}
                    y2="88"
                    stroke="#44403c"
                    strokeWidth="1.2"
                  />
                  <line
                    x1={mStartX + measureWidth}
                    y1="160"
                    x2={mStartX + measureWidth}
                    y2="208"
                    stroke="#44403c"
                    strokeWidth="1.2"
                  />

                  {/* Measure Number */}
                  <text
                    x={mStartX + 8}
                    y="34"
                    fill="#78716c"
                    fontSize="10"
                    fontStyle="italic"
                  >
                    {measure.measureNum}
                  </text>

                  {/* Active Measure Highlight overlay */}
                  {isCurrentMeasure && (
                    <rect
                      x={mStartX}
                      y="36"
                      width={measureWidth}
                      height="176"
                      fill="#fef08a"
                      opacity="0.25"
                      rx="4"
                    />
                  )}

                  {/* Right Hand Notes (Treble Staff) */}
                  {measure.rNotes.map((noteStr, nIdx) => {
                    const parsed = parseNotePitch(noteStr);
                    const noteX = mStartX + 20 + nIdx * 40;
                    const isNoteActive = isCurrentMeasure && activeNoteInMeasure === nIdx;

                    if (!parsed) {
                      // Rest symbol
                      return (
                        <text key={`r-rest-${nIdx}`} x={noteX} y="68" fontSize="20" fill="#78716c">
                          𝄽
                        </text>
                      );
                    }

                    const { y: noteY, ledgerLines } = getNoteStaffY(parsed.step, parsed.octave, true);

                    return (
                      <g
                        key={`r-note-${mIdx}-${nIdx}`}
                        className="cursor-pointer group"
                        onClick={() => pianoSynth.playNote(noteStr, 0.9, 0.45)}
                      >
                        {/* Ledger Lines if note exceeds staff */}
                        {ledgerLines.map((ly, lIdx) => (
                          <line
                            key={`r-ledger-${lIdx}`}
                            x1={noteX - 8}
                            y1={ly}
                            x2={noteX + 14}
                            y2={ly}
                            stroke="#292524"
                            strokeWidth="1.5"
                          />
                        ))}

                        {/* Accidental (# or b) */}
                        {parsed.alter === 1 && (
                          <text x={noteX - 9} y={noteY + 4} fontSize="14" fill={isNoteActive ? '#0284c7' : '#1c1917'}>♯</text>
                        )}
                        {parsed.alter === -1 && (
                          <text x={noteX - 8} y={noteY + 4} fontSize="14" fill={isNoteActive ? '#0284c7' : '#1c1917'}>♭</text>
                        )}

                        {/* Note Head Oval */}
                        <ellipse
                          cx={noteX + 4}
                          cy={noteY}
                          rx="5.5"
                          ry="4"
                          transform={`rotate(-25 ${noteX + 4} ${noteY})`}
                          fill={isNoteActive ? '#0284c7' : '#1c1917'}
                          className="transition-colors duration-100"
                        />

                        {/* Note Stem */}
                        <line
                          x1={noteX + 9}
                          y1={noteY}
                          x2={noteX + 9}
                          y2={noteY - 26}
                          stroke={isNoteActive ? '#0284c7' : '#1c1917'}
                          strokeWidth="1.4"
                        />

                        {/* Playing Halo */}
                        {isNoteActive && (
                          <circle
                            cx={noteX + 4}
                            cy={noteY}
                            r="10"
                            fill="none"
                            stroke="#38bdf8"
                            strokeWidth="2.5"
                            className="animate-ping"
                          />
                        )}

                        {/* Note Label on hover */}
                        <text
                          x={noteX + 4}
                          y="98"
                          textAnchor="middle"
                          fill={isNoteActive ? '#0369a1' : '#78716c'}
                          fontSize="9"
                          fontWeight={isNoteActive ? 'bold' : 'normal'}
                          fontFamily="monospace"
                        >
                          {noteStr}
                        </text>
                      </g>
                    );
                  })}

                  {/* Left Hand Notes / Chords (Bass Staff) */}
                  {measure.lNotes.map((chord, nIdx) => {
                    const noteX = mStartX + 20 + nIdx * 40;
                    const chordNotes = Array.isArray(chord) ? chord : [chord];
                    const isChordActive = isCurrentMeasure && activeNoteInMeasure === nIdx;

                    return (
                      <g
                        key={`l-chord-${mIdx}-${nIdx}`}
                        className="cursor-pointer group"
                        onClick={() => pianoSynth.playChord(chordNotes, 1.2, 0.35)}
                      >
                        {chordNotes.map((noteStr, cIdx) => {
                          const parsed = parseNotePitch(noteStr);
                          if (!parsed) return null;
                          const { y: noteY, ledgerLines } = getNoteStaffY(parsed.step, parsed.octave, false);

                          return (
                            <g key={`l-note-${cIdx}`}>
                              {ledgerLines.map((ly, lIdx) => (
                                <line
                                  key={`l-ledger-${lIdx}`}
                                  x1={noteX - 8}
                                  y1={ly}
                                  x2={noteX + 14}
                                  y2={ly}
                                  stroke="#292524"
                                  strokeWidth="1.5"
                                />
                              ))}
                              {parsed.alter === 1 && (
                                <text x={noteX - 9} y={noteY + 4} fontSize="14" fill={isChordActive ? '#7c3aed' : '#1c1917'}>♯</text>
                              )}
                              {parsed.alter === -1 && (
                                <text x={noteX - 8} y={noteY + 4} fontSize="14" fill={isChordActive ? '#7c3aed' : '#1c1917'}>♭</text>
                              )}
                              <ellipse
                                cx={noteX + 4}
                                cy={noteY}
                                rx="5.5"
                                ry="4"
                                transform={`rotate(-25 ${noteX + 4} ${noteY})`}
                                fill={isChordActive ? '#7c3aed' : '#1c1917'}
                                className="transition-colors duration-100"
                              />
                            </g>
                          );
                        })}

                        {/* Chord Stem down */}
                        <line
                          x1={noteX - 1}
                          y1="184"
                          x2={noteX - 1}
                          y2="216"
                          stroke={isChordActive ? '#7c3aed' : '#1c1917'}
                          strokeWidth="1.4"
                        />

                        {/* Chord Label below bass staff */}
                        <text
                          x={noteX + 4}
                          y="228"
                          textAnchor="middle"
                          fill={isChordActive ? '#6d28d9' : '#78716c'}
                          fontSize="9"
                          fontWeight={isChordActive ? 'bold' : 'normal'}
                          fontFamily="monospace"
                        >
                          {chordNotes.join('/')}
                        </text>
                      </g>
                    );
                  })}
                </g>
              );
            })}

            {/* Final Double Barline at End of Score */}
            <line
              x1={headerWidth + totalMeasures * measureWidth - 4}
              y1="40"
              x2={headerWidth + totalMeasures * measureWidth - 4}
              y2="88"
              stroke="#1c1917"
              strokeWidth="1.5"
            />
            <line
              x1={headerWidth + totalMeasures * measureWidth}
              y1="40"
              x2={headerWidth + totalMeasures * measureWidth}
              y2="88"
              stroke="#1c1917"
              strokeWidth="3.5"
            />
            <line
              x1={headerWidth + totalMeasures * measureWidth - 4}
              y1="160"
              x2={headerWidth + totalMeasures * measureWidth - 4}
              y2="208"
              stroke="#1c1917"
              strokeWidth="1.5"
            />
            <line
              x1={headerWidth + totalMeasures * measureWidth}
              y1="160"
              x2={headerWidth + totalMeasures * measureWidth}
              y2="208"
              stroke="#1c1917"
              strokeWidth="3.5"
            />
          </svg>
        </div>
      </div>

      {/* Sheet Guidance Footer */}
      <div className="mt-3 flex flex-wrap items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>악보 상의 개별 음표/화음을 직접 클릭하면 해당 피아노 건반 소리가 즉시 재생됩니다.</span>
        </div>
        <div className="flex items-center gap-4 text-slate-500 font-mono">
          <span>윗단: 높은음자리표(Right Hand)</span>
          <span>아랫단: 낮은음자리표(Left Hand)</span>
        </div>
      </div>
    </div>
  );
};
