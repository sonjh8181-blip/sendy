/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { TranscriptionResult } from '../types/music';
import { generateMusicXml, generateAbcNotation } from '../utils/musicXmlGenerator';
import {
  FileText,
  Music,
  Code2,
  Copy,
  Download,
  Check,
  Tag,
  Key,
  Gauge,
  Sparkles,
  Info
} from 'lucide-react';

interface MusicAnalysisReportProps {
  score: TranscriptionResult;
}

export const MusicAnalysisReport: React.FC<MusicAnalysisReportProps> = ({ score }) => {
  const [activeTab, setActiveTab] = useState<'summary' | 'json' | 'musicxml' | 'abc'>('summary');
  const [copied, setCopied] = useState(false);

  const formattedJson = JSON.stringify(
    {
      title: score.title,
      artist: score.artist,
      bpm: score.bpm,
      key: score.key,
      summary: score.summary,
      keywords: score.keywords,
      sheetData: score.sheetData,
      hands: score.hands
    },
    null,
    2
  );

  const musicXmlContent =
    typeof score.sheetData === 'string' && score.sheetData.startsWith('<?xml')
      ? score.sheetData
      : generateMusicXml(score);

  const abcContent = generateAbcNotation(score);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = (filename: string, content: string, mime: string) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl backdrop-blur-md space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100">AI 음악 분석 & 악보 채보 데이터 리포트</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              화성학적 분석, 피아노 양손 연주 특징, 정격 JSON 및 표준 MusicXML/ABC 데이터
            </p>
          </div>
        </div>

        {/* Format Selectors */}
        <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('summary')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              activeTab === 'summary' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            분석 요약 리포트
          </button>
          <button
            onClick={() => setActiveTab('json')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              activeTab === 'json' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            정격 JSON 데이터
          </button>
          <button
            onClick={() => setActiveTab('musicxml')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              activeTab === 'musicxml' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            MusicXML
          </button>
          <button
            onClick={() => setActiveTab('abc')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              activeTab === 'abc' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            ABC 노테이션
          </button>
        </div>
      </div>

      {/* Tab 1: Summary Analysis */}
      {activeTab === 'summary' && (
        <div className="space-y-6">
          {/* Top Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800">
              <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
                <Gauge className="w-4 h-4 text-amber-400" />
                템포 (BPM)
              </div>
              <div className="text-2xl font-bold font-mono text-slate-100">{score.bpm} <span className="text-xs font-normal text-slate-400">BPM</span></div>
              <div className="text-[11px] text-slate-500 mt-1">
                {score.bpm < 70 ? 'Lento / Adagio (느리고 서정적)' : score.bpm < 100 ? 'Andante / Moderato (보통 빠르기)' : 'Allegro (경쾌하고 빠름)'}
              </div>
            </div>

            <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800">
              <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
                <Key className="w-4 h-4 text-cyan-400" />
                조표 (Key Signature)
              </div>
              <div className="text-2xl font-bold font-mono text-cyan-300">{score.key}</div>
              <div className="text-[11px] text-slate-500 mt-1">
                피아노 조표 음역대 정밀 조율 완료
              </div>
            </div>

            <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800">
              <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
                <Music className="w-4 h-4 text-purple-400" />
                양손 구성
              </div>
              <div className="text-sm font-semibold text-purple-300">
                오른손 멜로디 + 왼손 반주/화음
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                49~88 건반 표준 음역 피아노 채보
              </div>
            </div>
          </div>

          {/* Detailed Summary Card */}
          <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-800 space-y-3">
            <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
              <Info className="w-4 h-4" />
              곡 및 악보 구성 특징 요약
            </h3>
            <p className="text-sm text-slate-200 leading-relaxed">
              {score.summary || '곡에 대한 상세 요약이 제공되지 않았습니다.'}
            </p>
          </div>

          {/* Keywords / Tags */}
          <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800">
            <span className="text-xs font-semibold text-slate-400 block mb-2 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-amber-400" />
              장르 & 스타일 키워드
            </span>
            <div className="flex flex-wrap gap-2">
              {score.keywords?.map((kw, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 rounded-xl bg-amber-500/10 text-amber-300 text-xs font-medium border border-amber-500/20"
                >
                  {kw.startsWith('#') ? kw : `#${kw}`}
                </span>
              ))}
            </div>
          </div>

          {/* Performance Tips */}
          <div className="bg-gradient-to-r from-amber-500/10 via-purple-500/5 to-transparent p-5 rounded-2xl border border-amber-500/20">
            <h4 className="text-xs font-bold text-amber-300 mb-2">🎹 피아니스트 연주 가이드 & 핑거링 팁</h4>
            <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside">
              <li>오른손(멜로디): 레가토(Legato)를 살려 노래하듯이 부드럽게 이어 연주하세요.</li>
              <li>왼손(반주): 오른손 선율을 덮지 않도록 한 단계 작은 볼륨(mp~p)으로 화음의 중심 베이스를 안정적으로 짚어주세요.</li>
              <li>서스테인 페달: 각 화음이 바뀔 때마다 페달을 밟고 떼어 화음이 뭉개지지 않도록 정돈하세요.</li>
            </ul>
          </div>
        </div>
      )}

      {/* Tab 2: Standard JSON Schema View */}
      {activeTab === 'json' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>사용자 지정 Output JSON Schema 준수 데이터</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleCopy(formattedJson)}
                className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? '복사됨!' : 'JSON 복사'}
              </button>
              <button
                onClick={() => handleDownload(`${score.title || 'score'}.json`, formattedJson, 'application/json')}
                className="flex items-center gap-1 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                .json 다운로드
              </button>
            </div>
          </div>
          <pre className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-xs font-mono text-amber-200/90 overflow-x-auto max-h-96 scrollbar-thin scrollbar-thumb-slate-800">
            {formattedJson}
          </pre>
        </div>
      )}

      {/* Tab 3: MusicXML View */}
      {activeTab === 'musicxml' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>MusicXML 3.1 표준 악보 파일 (시벨리우스, 피날레, 뮤즈스코어 호환)</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleCopy(musicXmlContent)}
                className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? '복사됨!' : 'XML 복사'}
              </button>
              <button
                onClick={() => handleDownload(`${score.title || 'score'}.musicxml`, musicXmlContent, 'application/xml')}
                className="flex items-center gap-1 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                .musicxml 다운로드
              </button>
            </div>
          </div>
          <pre className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-xs font-mono text-cyan-200/90 overflow-x-auto max-h-96 scrollbar-thin scrollbar-thumb-slate-800">
            {musicXmlContent}
          </pre>
        </div>
      )}

      {/* Tab 4: ABC Notation View */}
      {activeTab === 'abc' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>ABC Notation 텍스트 악보 포맷</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleCopy(abcContent)}
                className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? '복사됨!' : 'ABC 복사'}
              </button>
              <button
                onClick={() => handleDownload(`${score.title || 'score'}.abc`, abcContent, 'text/plain')}
                className="flex items-center gap-1 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                .abc 다운로드
              </button>
            </div>
          </div>
          <pre className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-xs font-mono text-emerald-200/90 overflow-x-auto max-h-96 scrollbar-thin scrollbar-thumb-slate-800">
            {abcContent}
          </pre>
        </div>
      )}
    </div>
  );
};
