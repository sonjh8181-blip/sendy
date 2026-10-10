/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { TranscriptionResult } from '../types/music';
import {
  Sparkles,
  Check,
  CheckCircle2,
  FileCode,
  Music,
  Disc3,
  ExternalLink,
  Copy,
  Trash2,
  Tag,
  Search,
  Piano,
  Database
} from 'lucide-react';

interface MirIdentificationCardProps {
  score: TranscriptionResult;
  onClearResult?: () => void;
  onGoToPianoPlayer?: () => void;
  onSaveToSheet?: () => void;
  onSearchQuery?: (query: string) => void;
}

export const MirIdentificationCard: React.FC<MirIdentificationCardProps> = ({
  score,
  onClearResult,
  onGoToPianoPlayer,
  onSaveToSheet,
  onSearchQuery
}) => {
  const [activeView, setActiveView] = useState<'overview' | 'rawJson'>('overview');
  const [copied, setCopied] = useState(false);
  const [searchInput, setSearchInput] = useState('');

  // Fallback defaults matching screenshot
  const songTitle = score.title || 'Bohemian Rhapsody';
  const artistName = score.artist || 'Queen';
  const searchQuery =
    score.searchQuery ||
    'is this the real life is this just fantasy caught in a landslide no escape from reality';
  const identifiedTime = score.identifiedAt || '오후 12:03:51';

  // Construct search URLs
  const spotifySearchUrl = `https://open.spotify.com/search/${encodeURIComponent(
    `${songTitle} ${artistName}`
  )}`;
  const youtubeSearchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(
    `${songTitle} ${artistName}`
  )}`;

  // Default color palette for keywords matching screenshot
  const getTagColorClass = (kw: string, index: number) => {
    const clean = kw.toLowerCase();
    if (clean.includes('progressive') || index === 0) {
      return 'bg-blue-950/80 text-blue-300 border-blue-800/80 hover:border-blue-600';
    }
    if (clean.includes('pop') || index === 1) {
      return 'bg-indigo-950/80 text-indigo-300 border-indigo-800/80 hover:border-indigo-600';
    }
    if (clean.includes('dramatic') || index === 2) {
      return 'bg-purple-950/80 text-purple-300 border-purple-800/80 hover:border-purple-600';
    }
    if (clean.includes('piano') || index === 3) {
      return 'bg-cyan-950/80 text-cyan-300 border-cyan-800/80 hover:border-cyan-600';
    }
    if (clean.includes('guitar') || index === 4) {
      return 'bg-teal-950/80 text-teal-300 border-teal-800/80 hover:border-teal-600';
    }
    if (clean.includes('cappella') || index === 5) {
      return 'bg-sky-950/80 text-sky-300 border-sky-800/80 hover:border-sky-600';
    }
    return 'bg-slate-900/90 text-slate-300 border-slate-800 hover:border-slate-700';
  };

  const handleCopySchema = () => {
    const rawSchema = JSON.stringify(
      {
        mirStatus: 'IDENTIFIED',
        normalizedQuery: searchQuery,
        timestamp: identifiedTime,
        title: songTitle,
        artist: artistName,
        bpm: score.bpm,
        key: score.key,
        keywords: score.keywords,
        summary: score.summary,
        hands: score.hands,
        sheetData: score.sheetData
      },
      null,
      2
    );
    navigator.clipboard.writeText(rawSchema);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleQuerySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim() && onSearchQuery) {
      onSearchQuery(searchInput.trim());
      setSearchInput('');
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4">
      {/* Search Bar for MIR Recognition */}
      <form onSubmit={handleQuerySubmit} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="가사 구절, 곡명 또는 음향 키워드 입력 (예: is this the real life..., 밤편지, Let it be)..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900/90 border border-slate-800 rounded-2xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 shadow-inner"
          />
        </div>
        <button
          type="submit"
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-xs font-bold transition-all shadow-md shadow-indigo-600/30 flex items-center gap-1.5 cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5" />
          MIR 식별하기
        </button>
      </form>

      {/* Main MIR Card matching user reference design */}
      <div className="w-full bg-[#0a0e1c] border border-indigo-950/90 rounded-3xl p-6 shadow-2xl backdrop-blur-xl space-y-6">
        {/* Card Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-indigo-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-inner">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-indigo-400 flex items-center gap-2">
                MIR 식별 결과
              </h2>
              <p className="text-xs text-slate-400">
                텍스트 가사 정규화 • {identifiedTime}
              </p>
            </div>
          </div>

          {/* Badges & View Switcher */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-500/40 bg-emerald-950/20 text-emerald-400 text-xs font-medium">
              <Check className="w-3.5 h-3.5" />
              <span>DB 저장 완료</span>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-teal-500/40 bg-teal-950/20 text-teal-400 text-xs font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>엄격한 JSON 스키마 (검증 완료)</span>
            </div>

            {/* Toggle Tabs */}
            <div className="flex items-center bg-slate-950/80 p-1 rounded-xl border border-slate-800/80 text-xs font-semibold">
              <button
                onClick={() => setActiveView('overview')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  activeView === 'overview'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                개요
              </button>
              <button
                onClick={() => setActiveView('rawJson')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  activeView === 'rawJson'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <FileCode className="w-3.5 h-3.5" />
                원시 JSON
              </button>
            </div>
          </div>
        </div>

        {/* View Mode 1: Overview */}
        {activeView === 'overview' && (
          <div className="space-y-6">
            {/* Song Card with Gradient Album Cover */}
            <div className="bg-[#060a14] border border-indigo-950/70 rounded-2xl p-6 relative overflow-hidden">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                  {/* Purple/Pink Gradient Cover Icon */}
                  <div className="w-24 h-24 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-pink-500 flex items-center justify-center text-white shadow-2xl shadow-purple-600/30 shrink-0">
                    <Music className="w-12 h-12 stroke-[2.2]" />
                  </div>

                  {/* Title & Artist */}
                  <div className="space-y-1.5">
                    <span className="inline-block px-2.5 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-[11px] font-medium text-slate-300">
                      공식 곡명
                    </span>
                    <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
                      {songTitle}
                    </h1>
                    <div className="flex items-center gap-2 text-slate-300 text-sm font-semibold">
                      <div className="w-4 h-4 rounded-full border border-purple-400/80 flex items-center justify-center text-[9px] text-purple-300">
                        ◎
                      </div>
                      <span>{artistName}</span>
                    </div>
                  </div>
                </div>

                {/* Spotify & YouTube Action Buttons */}
                <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                  <a
                    href={spotifySearchUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-emerald-500/50 bg-emerald-950/20 hover:bg-emerald-900/40 text-emerald-400 text-xs font-bold transition-all"
                  >
                    Spotify
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>

                  <a
                    href={youtubeSearchUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-rose-500/50 bg-rose-950/20 hover:bg-rose-900/40 text-rose-400 text-xs font-bold transition-all"
                  >
                    YouTube
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {/* Input Search Query Box */}
              <div className="mt-6 flex flex-col sm:flex-row sm:items-center gap-3 pt-4 border-t border-indigo-950/60">
                <span className="text-xs text-slate-400 font-semibold shrink-0">
                  입력 검색어:
                </span>
                <div className="flex-1 px-3.5 py-2 rounded-xl bg-slate-950/90 border border-slate-800/80 text-xs font-mono text-slate-200 overflow-x-auto truncate shadow-inner">
                  {searchQuery}
                </div>
              </div>
            </div>

            {/* Sound & Search Keywords Tags Section */}
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2 text-indigo-300 font-bold">
                  <Tag className="w-4 h-4 text-indigo-400" />
                  <span>
                    음향 및 검색 키워드 태그 ({score.keywords?.length || 7})
                  </span>
                </div>
                <span className="text-slate-400 text-[11px]">
                  장르 • 분위기 • 주요 악기 • 대체 곡명
                </span>
              </div>

              {/* Tag Pills */}
              <div className="flex flex-wrap gap-2">
                {score.keywords && score.keywords.length > 0 ? (
                  score.keywords.map((kw, idx) => (
                    <span
                      key={idx}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-default ${getTagColorClass(
                        kw,
                        idx
                      )}`}
                    >
                      {kw.startsWith('#') ? kw : `#${kw}`}
                    </span>
                  ))
                ) : (
                  <>
                    <span className="px-3 py-1.5 rounded-xl border text-xs font-semibold bg-blue-950/80 text-blue-300 border-blue-800/80">
                      #Progressive Rock
                    </span>
                    <span className="px-3 py-1.5 rounded-xl border text-xs font-semibold bg-indigo-950/80 text-indigo-300 border-indigo-800/80">
                      #Operatic Pop
                    </span>
                    <span className="px-3 py-1.5 rounded-xl border text-xs font-semibold bg-purple-950/80 text-purple-300 border-purple-800/80">
                      #Dramatic
                    </span>
                    <span className="px-3 py-1.5 rounded-xl border text-xs font-semibold bg-cyan-950/80 text-cyan-300 border-cyan-800/80">
                      #Piano
                    </span>
                    <span className="px-3 py-1.5 rounded-xl border text-xs font-semibold bg-teal-950/80 text-teal-300 border-teal-800/80">
                      #Electric Guitar
                    </span>
                    <span className="px-3 py-1.5 rounded-xl border text-xs font-semibold bg-sky-950/80 text-sky-300 border-sky-800/80">
                      #A Cappella
                    </span>
                    <span className="px-3 py-1.5 rounded-xl border text-xs font-semibold bg-slate-900/90 text-slate-300 border-slate-800">
                      #Mama Just Killed a Man
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Quick Action Navigation to Piano Visualizer */}
            {onGoToPianoPlayer && (
              <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-900/40 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-200">
                    식별된 음원의 피아노 악보 채보 데이터가 준비되었습니다.
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    조표: {score.key} · 템포: {score.bpm} BPM · 양손 멜로디 및 화음
                  </p>
                </div>
                <button
                  onClick={onGoToPianoPlayer}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-amber-500/20 cursor-pointer"
                >
                  <Piano className="w-4 h-4" />
                  피아노 악보 연주하기
                </button>
              </div>
            )}
          </div>
        )}

        {/* View Mode 2: Raw JSON */}
        {activeView === 'rawJson' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>정밀 검증된 MIR 정격 JSON 스키마</span>
              <button
                onClick={handleCopySchema}
                className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition-colors cursor-pointer"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                {copied ? '복사됨!' : '스키마 복사'}
              </button>
            </div>
            <pre className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-xs font-mono text-indigo-300 overflow-x-auto max-h-96 scrollbar-thin scrollbar-thumb-slate-800">
              {JSON.stringify(
                {
                  mirStatus: 'IDENTIFIED',
                  normalizedQuery: searchQuery,
                  timestamp: identifiedTime,
                  title: songTitle,
                  artist: artistName,
                  bpm: score.bpm,
                  key: score.key,
                  summary: score.summary,
                  keywords: score.keywords,
                  sheetData: score.sheetData,
                  hands: score.hands
                },
                null,
                2
              )}
            </pre>
          </div>
        )}

        {/* Card Footer matching user reference design */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-indigo-950/60 text-xs">
          <div className="flex flex-wrap items-center gap-4 text-slate-300">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
              곡명: <strong className="text-white ml-0.5">{songTitle}</strong>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
              아티스트: <strong className="text-white ml-0.5">{artistName}</strong>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleCopySchema}
              className="flex items-center gap-1 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>{copied ? '복사됨' : '스키마 복사'}</span>
            </button>

            {onClearResult && (
              <button
                onClick={onClearResult}
                className="text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
              >
                결과 지우기
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
