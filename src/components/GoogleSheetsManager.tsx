/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { TranscriptionResult, SheetRowRecord } from '../types/music';
import {
  Database,
  CloudCheck,
  RefreshCw,
  ExternalLink,
  Save,
  CheckCircle,
  FileCode,
  Music,
  Clock,
  Sparkles,
  Search
} from 'lucide-react';

interface GoogleSheetsManagerProps {
  currentScore: TranscriptionResult | null;
  sheetScores: SheetRowRecord[];
  onSaveToSheet: () => Promise<void>;
  onRefreshSheet: () => Promise<void>;
  onSelectScore: (scoreId: string) => void;
  isSaving: boolean;
  isFetching: boolean;
  appsScriptUrl: string;
}

export const GoogleSheetsManager: React.FC<GoogleSheetsManagerProps> = ({
  currentScore,
  sheetScores,
  onSaveToSheet,
  onRefreshSheet,
  onSelectScore,
  isSaving,
  isFetching,
  appsScriptUrl
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredScores = sheetScores.filter(s => {
    const term = searchTerm.toLowerCase();
    return (
      (s.title && s.title.toLowerCase().includes(term)) ||
      (s.artist && s.artist.toLowerCase().includes(term)) ||
      (s.key && s.key.toLowerCase().includes(term)) ||
      (s.id && s.id.toLowerCase().includes(term))
    );
  });

  return (
    <div className="w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl backdrop-blur-md space-y-6">
      {/* Header & Connection Status */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/10">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-100">Google Sheets 데이터베이스 보관함</h2>
              <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-800/80">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                실시간 연동 가동 중
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              분석된 피아노 악보 및 메타데이터를 사용자의 Google Sheets 백엔드와 실시간 양방향 동기화합니다.
            </p>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={onRefreshSheet}
            disabled={isFetching}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-all disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
            시트 데이터 새로고침
          </button>

          {currentScore && (
            <button
              onClick={onSaveToSheet}
              disabled={isSaving}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/20 transition-all disabled:opacity-50 cursor-pointer"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  시트에 저장 중...
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  현재 악보 시트에 저장
                </>
              )}
            </button>
          )}

          <a
            href={appsScriptUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 text-slate-400 hover:text-slate-200 bg-slate-950 border border-slate-800 rounded-xl hover:bg-slate-800 transition-colors"
            title="Google Apps Script 엔드포인트 열기"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>

      {/* Sheet Database URL Badge Card */}
      <div className="bg-slate-950/70 rounded-2xl p-3.5 border border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 overflow-hidden text-slate-400">
          <span className="font-semibold text-slate-300 shrink-0">엔드포인트:</span>
          <span className="font-mono text-[11px] text-amber-300/90 truncate bg-slate-900 px-2 py-1 rounded border border-slate-800">
            {appsScriptUrl}
          </span>
        </div>
        <div className="flex items-center gap-2 text-slate-400 text-xs shrink-0">
          <span>열 구조:</span>
          <span className="font-mono text-slate-300">id, title, artist, bpm, key, sheetData, createdAt</span>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="곡명, 아티스트, 조표 검색..."
            className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
          />
        </div>
        <div className="text-xs text-slate-400">
          저장된 악보 총 <span className="font-bold text-amber-400">{filteredScores.length}</span>개
        </div>
      </div>

      {/* Scores Table */}
      <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-950/40">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-900/80 border-b border-slate-800 text-slate-400 font-medium">
                <th className="py-3 px-4">식별자 (ID)</th>
                <th className="py-3 px-4">곡 제목 (Title)</th>
                <th className="py-3 px-4">아티스트 (Artist)</th>
                <th className="py-3 px-4">템포 (BPM)</th>
                <th className="py-3 px-4">조표 (Key)</th>
                <th className="py-3 px-4">등록 일시 (Created)</th>
                <th className="py-3 px-4 text-right">작업</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredScores.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    <Database className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    저장된 악보 데이터가 없습니다. 상단에서 곡을 채보한 뒤 구글 시트에 저장해 보세요.
                  </td>
                </tr>
              ) : (
                filteredScores.map((row) => {
                  const isCurrent = currentScore?.id === row.id || currentScore?.title === row.title;
                  return (
                    <tr
                      key={row.id}
                      className={`hover:bg-slate-900/60 transition-colors ${
                        isCurrent ? 'bg-amber-500/5' : ''
                      }`}
                    >
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-400">
                        {row.id}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-100 flex items-center gap-2">
                        {row.title}
                        {isCurrent && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            현재 선택됨
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-300">{row.artist || '-'}</td>
                      <td className="py-3 px-4 font-mono text-slate-300">{row.bpm || '-'}</td>
                      <td className="py-3 px-4 text-amber-300 font-medium">{row.key || '-'}</td>
                      <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                        {row.createdAt ? row.createdAt.slice(0, 19).replace('T', ' ') : '-'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => onSelectScore(row.id)}
                          className="px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-semibold border border-amber-500/30 transition-all cursor-pointer"
                        >
                          악보 불러오기
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
