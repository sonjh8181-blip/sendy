/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Music,
  Piano,
  Database,
  Sparkles,
  FileText,
  Volume2,
  CloudCheck,
  Disc3
} from 'lucide-react';

export type NavTab = 'transcribe' | 'player' | 'mir' | 'database' | 'report';

interface NavbarProps {
  currentTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  isSheetConnected: boolean;
  scoreCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onTabChange,
  isSheetConnected,
  scoreCount
}) => {
  return (
    <header className="sticky top-0 z-50 w-full bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80 px-4 lg:px-8 py-3">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
        {/* Logo & Brand */}
        <div
          onClick={() => onTabChange('player')}
          className="flex items-center gap-3 cursor-pointer select-none group"
        >
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center text-slate-950 shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform">
            <Disc3 className="w-6 h-6 animate-[spin_8s_linear_infinite]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base tracking-tight text-white group-hover:text-amber-300 transition-colors">
                AI 피아노 악보 채보 프로그램
              </span>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30">
                PRO AI
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">
              음악 분석가 & 악보 채보 전문가 (Music Transcription AI)
            </p>
          </div>
        </div>

        {/* Navigation Tabs in Korean */}
        <nav className="flex items-center gap-1.5 bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800 shadow-inner">
          <button
            onClick={() => onTabChange('player')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              currentTab === 'player'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Piano className="w-4 h-4" />
            피아노 연주 & 악보
          </button>

          <button
            onClick={() => onTabChange('transcribe')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              currentTab === 'transcribe'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            악보 분석 & 채보
          </button>

          <button
            onClick={() => onTabChange('mir')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              currentTab === 'mir'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Disc3 className="w-4 h-4 text-indigo-400" />
            MIR 식별 결과
          </button>

          <button
            onClick={() => onTabChange('database')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              currentTab === 'database'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Database className="w-4 h-4" />
            구글 시트 보관함
            {scoreCount > 0 && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                currentTab === 'database' ? 'bg-slate-950 text-amber-300' : 'bg-slate-800 text-slate-300'
              }`}>
                {scoreCount}
              </span>
            )}
          </button>

          <button
            onClick={() => onTabChange('report')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              currentTab === 'report'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <FileText className="w-4 h-4" />
            AI 음악 분석 리포트
          </button>
        </nav>

        {/* Database Status Indicator */}
        <div className="hidden md:flex items-center gap-2.5">
          <div className="flex items-center gap-2 text-xs bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span className="text-slate-300 font-medium">Google Sheets DB 연동됨</span>
          </div>
        </div>
      </div>
    </header>
  );
};
