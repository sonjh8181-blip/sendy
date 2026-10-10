/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import {
  Upload,
  Mic,
  Music2,
  Sparkles,
  FileAudio,
  Play,
  Square,
  RefreshCw,
  Sliders,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface AudioUploaderProps {
  onTranscribeText: (title: string, artist: string, promptHint?: string) => Promise<void>;
  onTranscribeAudio: (audioBase64: string, mimeType: string, titleHint?: string, artistHint?: string) => Promise<void>;
  isLoading: boolean;
  statusMessage?: string;
}

export const AudioUploader: React.FC<AudioUploaderProps> = ({
  onTranscribeText,
  onTranscribeAudio,
  isLoading,
  statusMessage
}) => {
  const [activeTab, setActiveTab] = useState<'text' | 'file' | 'mic'>('text');

  // Text inputs
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [styleOption, setStyleOption] = useState('원곡 충실 피아노 편곡');

  // File upload state
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioPreviewUrl, setAudioPreviewUrl] = useState<string | null>(null);
  const [fileTitleHint, setFileTitleHint] = useState('');
  const [fileArtistHint, setFileArtistHint] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Mic recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordDuration, setRecordDuration] = useState(0);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [recordedAudioBlob, setRecordedAudioBlob] = useState<Blob | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const timerIntervalRef = useRef<number | null>(null);

  // Quick preset chips
  const PRESET_SUGGESTIONS = [
    { title: '밤편지 (Through the Night)', artist: '아이유' },
    { title: '녹턴 Op.9 No.2', artist: '쇼팽' },
    { title: 'River Flows in You', artist: '이루마' },
    { title: '달빛 (Clair de Lune)', artist: '드뷔시' },
    { title: 'Ditto', artist: '뉴진스' },
    { title: '봄날 (Spring Day)', artist: 'BTS' }
  ];

  const handleSelectPreset = (pTitle: string, pArtist: string) => {
    setTitle(pTitle);
    setArtist(pArtist);
  };

  const handleTextSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    await onTranscribeText(title.trim(), artist.trim(), styleOption);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAudioFile(file);
      const url = URL.createObjectURL(file);
      setAudioPreviewUrl(url);

      // Guess title from filename
      const cleanName = file.name.replace(/\.[^/.]+$/, '');
      if (cleanName.includes('-')) {
        const [pArtist, pTitle] = cleanName.split('-');
        setFileArtistHint(pArtist.trim());
        setFileTitleHint(pTitle.trim());
      } else {
        setFileTitleHint(cleanName);
      }
    }
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('audio/')) {
      setAudioFile(file);
      setAudioPreviewUrl(URL.createObjectURL(file));
      const cleanName = file.name.replace(/\.[^/.]+$/, '');
      setFileTitleHint(cleanName);
    }
  };

  const handleFileSubmit = async () => {
    if (!audioFile) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const base64String = (reader.result as string).split(',')[1];
      await onTranscribeAudio(
        base64String,
        audioFile.type || 'audio/mp3',
        fileTitleHint.trim(),
        fileArtistHint.trim()
      );
    };
    reader.readAsDataURL(audioFile);
  };

  // Mic Recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      const chunks: BlobPart[] = [];
      mediaRecorder.ondataavailable = (ev) => {
        if (ev.data.size > 0) chunks.push(ev.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        setRecordedAudioBlob(blob);
        setRecordedAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach(t => t.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordDuration(0);
      timerIntervalRef.current = window.setInterval(() => {
        setRecordDuration(prev => prev + 1);
      }, 1000);
    } catch (err) {
      alert('마이크 접근 권한이 필요합니다.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }
  };

  const handleRecordedSubmit = async () => {
    if (!recordedAudioBlob) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const base64String = (reader.result as string).split(',')[1];
      await onTranscribeAudio(
        base64String,
        'audio/webm',
        title.trim() || '마이크 라이브 녹음곡',
        '라이브 연주/허밍'
      );
    };
    reader.readAsDataURL(recordedAudioBlob);
  };

  return (
    <div className="w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl backdrop-blur-md">
      {/* Tab Selectors */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            AI 음악 분석 & 피아노 채보 입력
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            곡 정보 텍스트, 음원 파일(.mp3, .wav), 마이크 라이브 연주 중 원하는 방식으로 분석할 수 있습니다.
          </p>
        </div>

        {/* Navigation Tabs in Korean */}
        <div className="flex items-center gap-1 bg-slate-950/80 p-1.5 rounded-2xl border border-slate-800">
          <button
            onClick={() => setActiveTab('text')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'text'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Music2 className="w-4 h-4" />
            곡명/아티스트 입력
          </button>
          <button
            onClick={() => setActiveTab('file')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'file'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Upload className="w-4 h-4" />
            오디오 음원 업로드
          </button>
          <button
            onClick={() => setActiveTab('mic')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'mic'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Mic className="w-4 h-4" />
            마이크 연주/허밍 녹음
          </button>
        </div>
      </div>

      {/* Tab 1: Text Input Mode */}
      {activeTab === 'text' && (
        <form onSubmit={handleTextSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                곡 제목 <span className="text-amber-400">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="예: 밤편지 (Through the Night), 녹턴 Op.9 No.2"
                required
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                아티스트 / 작곡가 명
              </label>
              <input
                type="text"
                value={artist}
                onChange={(e) => setArtist(e.target.value)}
                placeholder="예: 아이유 (IU), 쇼팽 (Chopin), 이루마"
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
              <span>편곡 스타일 & 난이도</span>
              <span className="text-[11px] text-slate-400">피아노 건반 음역대에 최적화</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                '원곡 충실 피아노 편곡',
                '초중급자용 쉬운 피아노',
                '화려한 재즈 & 텐션 코드',
                '감미로운 클래식/아르페지오'
              ].map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setStyleOption(opt)}
                  className={`py-2 px-3 rounded-xl text-xs font-medium border text-center transition-all ${
                    styleOption === opt
                      ? 'bg-amber-500/10 border-amber-500/40 text-amber-300'
                      : 'bg-slate-950/60 border-slate-800/80 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Preset Chips */}
          <div className="pt-2">
            <span className="text-xs text-slate-400 block mb-2">인기 추천 곡 (원클릭 자동 채우기):</span>
            <div className="flex flex-wrap gap-2">
              {PRESET_SUGGESTIONS.map((preset) => (
                <button
                  key={preset.title}
                  type="button"
                  onClick={() => handleSelectPreset(preset.title, preset.artist)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-amber-300 text-xs border border-slate-700/60 transition-all flex items-center gap-1.5"
                >
                  <Music2 className="w-3 h-3 text-amber-400/80" />
                  <span className="font-medium">{preset.title}</span>
                  <span className="text-slate-500 text-[11px]">({preset.artist})</span>
                </button>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2 flex items-center justify-between">
            <div className="text-xs text-slate-400">
              {statusMessage && (
                <span className="flex items-center gap-1.5 text-amber-300 animate-pulse">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  {statusMessage}
                </span>
              )}
            </div>
            <button
              type="submit"
              disabled={isLoading || !title.trim()}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  AI 정밀 분석 중...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  AI 피아노 악보 채보 시작
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* Tab 2: File Upload Mode */}
      {activeTab === 'file' && (
        <div className="space-y-4">
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleFileDrop}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-700 hover:border-amber-500/60 rounded-2xl p-8 text-center cursor-pointer bg-slate-950/50 hover:bg-slate-950/80 transition-all group"
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="audio/*,.mp3,.wav,.m4a,.ogg"
              className="hidden"
            />
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
              <FileAudio className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-slate-200">
              {audioFile ? audioFile.name : '음원 파일(.mp3, .wav, .m4a 등)을 이곳에 끌어다 놓거나 클릭하여 선택'}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              음원의 멜로디, BPM, 조표(Key), 양손 건반 노트를 AI가 정밀 주파수 전사합니다.
            </p>
          </div>

          {audioPreviewUrl && (
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span className="font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  업로드된 음원 프리뷰
                </span>
                <span className="font-mono text-slate-400">
                  {audioFile ? `${(audioFile.size / 1024 / 1024).toFixed(2)} MB` : ''}
                </span>
              </div>
              <audio src={audioPreviewUrl} controls className="w-full h-10 accent-amber-500" />

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">곡 제목 힌트 (선택)</label>
                  <input
                    type="text"
                    value={fileTitleHint}
                    onChange={(e) => setFileTitleHint(e.target.value)}
                    placeholder="제목 힌트 입력"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">아티스트 힌트 (선택)</label>
                  <input
                    type="text"
                    value={fileArtistHint}
                    onChange={(e) => setFileArtistHint(e.target.value)}
                    placeholder="아티스트 힌트 입력"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-end pt-2">
            <button
              type="button"
              onClick={handleFileSubmit}
              disabled={isLoading || !audioFile}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  음원 주파수 AI 분석 중...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  음원 파일 AI 악보 채보하기
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Tab 3: Microphone Live Recording */}
      {activeTab === 'mic' && (
        <div className="space-y-4">
          <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-6 text-center">
            <div className="max-w-md mx-auto space-y-4">
              <div className="flex items-center justify-center">
                <div
                  className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${
                    isRecording
                      ? 'bg-rose-500/20 text-rose-400 ring-4 ring-rose-500/30 animate-pulse'
                      : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  }`}
                >
                  <Mic className="w-8 h-8" />
                </div>
              </div>

              <div>
                <h4 className="text-sm font-bold text-slate-100">
                  {isRecording ? '실시간 음성/피아노 녹음 중...' : '마이크로 멜로디 허밍 또는 피아노 연주 녹음'}
                </h4>
                <p className="text-xs text-slate-400 mt-1">
                  직접 피아노 건반을 치거나 입으로 계이름/멜로디를 허밍하면 AI가 음표로 전사합니다.
                </p>
              </div>

              {isRecording && (
                <div className="flex items-center justify-center gap-2 font-mono text-rose-400 text-lg font-bold">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></span>
                  {Math.floor(recordDuration / 60)}:{(recordDuration % 60).toString().padStart(2, '0')}
                </div>
              )}

              <div className="flex items-center justify-center gap-3">
                {!isRecording ? (
                  <button
                    type="button"
                    onClick={startRecording}
                    className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-rose-600/30 flex items-center gap-2"
                  >
                    <Mic className="w-4 h-4" />
                    녹음 시작
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={stopRecording}
                    className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-rose-300 rounded-xl text-xs font-bold transition-all border border-rose-500/30 flex items-center gap-2"
                  >
                    <Square className="w-4 h-4" />
                    녹음 종료
                  </button>
                )}
              </div>
            </div>
          </div>

          {recordedAudioUrl && (
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span className="font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  녹음된 라이브 오디오
                </span>
                <span className="font-mono text-slate-400">{recordDuration}초</span>
              </div>
              <audio src={recordedAudioUrl} controls className="w-full h-10 accent-amber-500" />

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={handleRecordedSubmit}
                  disabled={isLoading}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 disabled:opacity-50 transition-all flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  녹음 음원 AI 악보 채보하기
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
