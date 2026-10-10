/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Navbar, NavTab } from './components/Navbar';
import { PianoVisualizer } from './components/PianoVisualizer';
import { GrandStaffViewer } from './components/GrandStaffViewer';
import { PlaybackController } from './components/PlaybackController';
import { AudioUploader } from './components/AudioUploader';
import { GoogleSheetsManager } from './components/GoogleSheetsManager';
import { MusicAnalysisReport } from './components/MusicAnalysisReport';
import { MirIdentificationCard } from './components/MirIdentificationCard';
import { SAMPLE_TRANSCRIPTIONS } from './utils/sampleData';
import { extractCleanNoteArrays } from './utils/musicXmlGenerator';
import { pianoSynth } from './utils/audioPlayer';
import { safeFetchJson } from './utils/safeApi';
import { TranscriptionResult, SheetRowRecord } from './types/music';
import {
  Sparkles,
  Piano,
  Database,
  FileText,
  Save,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  Music2,
  ChevronRight,
  Disc3,
  ExternalLink,
  X
} from 'lucide-react';

const GOOGLE_APPS_SCRIPT_URL =
  import.meta.env.VITE_GAS_URL ||
  'https://script.google.com/macros/s/AKfycbwI8ikYRFtHIIg6IrMK_B54Ms4RLE1XebtxG6kC-VXRM-bz_siFmcPAWP7APO9Dc-O4/exec';

export default function App() {
  const [currentTab, setCurrentTab] = useState<NavTab>('transcribe');
  const [currentScore, setCurrentScore] = useState<TranscriptionResult>(SAMPLE_TRANSCRIPTIONS[0]);
  const [sheetScores, setSheetScores] = useState<SheetRowRecord[]>([]);

  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [activeRightNotes, setActiveRightNotes] = useState<string[]>([]);
  const [activeLeftNotes, setActiveLeftNotes] = useState<string[]>([]);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [isMetronomeOn, setIsMetronomeOn] = useState(false);

  // Async States
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [isSavingToSheet, setIsSavingToSheet] = useState(false);
  const [isFetchingSheet, setIsFetchingSheet] = useState(false);
  const [envWarning, setEnvWarning] = useState<string | null>(null);
  const [toastNotification, setToastNotification] = useState<{
    text: string;
    type: 'success' | 'info' | 'error';
  } | null>(null);

  const showToast = useCallback((text: string, type: 'success' | 'info' | 'error' = 'info') => {
    setToastNotification({ text, type });
    setTimeout(() => {
      setToastNotification(null);
    }, 5000);
  }, []);

  // Check Environment Variables on mount
  useEffect(() => {
    const clientKey = import.meta.env.VITE_GEMINI_API_KEY;
    const clientGasUrl = import.meta.env.VITE_GAS_URL;

    // Probe server health and API key status
    safeFetchJson<{ status: string; hasApiKey: boolean; gasUrl: string }>('/api/health')
      .then((res) => {
        if (!res.ok) {
          // If server /api/health returned 404 or HTML error, notify user
          const msg = `API 서버 연결 불가 (HTTP ${res.status}): Vercel 배포 시 vercel.json 또는 Environment Variables(GEMINI_API_KEY) 설정을 확인해 주세요.`;
          setEnvWarning(msg);
          showToast(msg, 'error');
        } else if (res.data && !res.data.hasApiKey && !clientKey) {
          const msg = 'GEMINI_API_KEY 환경변수가 설정되지 않았습니다. Vercel Project Settings > Environment Variables 또는 .env에 등록해 주세요.';
          setEnvWarning(msg);
          showToast(msg, 'error');
        }
      })
      .catch(() => {
        if (!clientKey) {
          setEnvWarning('GEMINI_API_KEY 설정이 필요합니다. Vercel 대시보드에서 환경변수를 추가해 주세요.');
        }
      });
  }, [showToast]);

  // Fetch initial Google Sheets data on mount with defensive HTML handling
  const fetchSheetRecords = useCallback(async () => {
    setIsFetchingSheet(true);
    try {
      const res = await safeFetchJson<{ data: any[]; warning?: string }>('/api/sheets/list');
      if (res.ok && res.data?.data && Array.isArray(res.data.data)) {
        setSheetScores(res.data.data);
        if (res.data.warning) {
          console.warn('Sheets warning:', res.data.warning);
        }
      } else if (!res.ok) {
        console.warn('Google Sheets list fetch failed:', res.error);
        // Do not crash, UI uses fallback samples
      }
    } catch (err) {
      console.error('Failed to fetch sheet records:', err);
    } finally {
      setIsFetchingSheet(false);
    }
  }, []);

  useEffect(() => {
    fetchSheetRecords();
  }, [fetchSheetRecords]);

  // Derived notes for playback
  const { rightHand, leftHand } = extractCleanNoteArrays(currentScore);
  const totalSteps = Math.max(rightHand.length, leftHand.length);

  // Playback controls
  const handlePlay = useCallback(() => {
    if (totalSteps === 0) return;
    setIsPlaying(true);

    pianoSynth.setSpeed(playbackSpeed);
    pianoSynth.startPlayback(
      rightHand,
      leftHand,
      currentScore.bpm || 80,
      (step, rNotes, lNotes) => {
        setCurrentStep(step);
        setActiveRightNotes(rNotes);
        setActiveLeftNotes(lNotes);
      },
      () => {
        setIsPlaying(false);
        setCurrentStep(0);
        setActiveRightNotes([]);
        setActiveLeftNotes([]);
      },
      currentStep
    );
  }, [rightHand, leftHand, currentScore.bpm, playbackSpeed, currentStep, totalSteps]);

  const handlePause = useCallback(() => {
    pianoSynth.pausePlayback();
    setIsPlaying(false);
    setActiveRightNotes([]);
    setActiveLeftNotes([]);
  }, []);

  const handleStop = useCallback(() => {
    pianoSynth.stopPlayback();
    setIsPlaying(false);
    setCurrentStep(0);
    setActiveRightNotes([]);
    setActiveLeftNotes([]);
  }, []);

  const handleSeek = useCallback(
    (step: number) => {
      setCurrentStep(step);
      if (isPlaying) {
        handlePause();
        setTimeout(() => {
          pianoSynth.startPlayback(
            rightHand,
            leftHand,
            currentScore.bpm || 80,
            (s, rNotes, lNotes) => {
              setCurrentStep(s);
              setActiveRightNotes(rNotes);
              setActiveLeftNotes(lNotes);
            },
            () => {
              setIsPlaying(false);
              setCurrentStep(0);
              setActiveRightNotes([]);
              setActiveLeftNotes([]);
            },
            step
          );
          setIsPlaying(true);
        }, 50);
      }
    },
    [isPlaying, rightHand, leftHand, currentScore.bpm, handlePause]
  );

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    pianoSynth.setSpeed(speed);
  };

  const handleToggleMetronome = () => {
    const isNowOn = pianoSynth.toggleMetronome();
    setIsMetronomeOn(isNowOn);
  };

  // Switch score helper
  const handleSwitchScore = (score: TranscriptionResult) => {
    handleStop();
    setCurrentScore(score);
    setCurrentStep(0);
    showToast(`"${score.title}" 악보가 로드되었습니다.`, 'info');
  };

  // Text Transcription with safe fetch
  const handleTranscribeText = async (title: string, artist: string, promptHint?: string) => {
    setIsLoading(true);
    setStatusMessage('Gemini AI가 곡의 선율, 코드 진행 및 양손 피아노 악보를 채보하고 있습니다...');
    try {
      const res = await safeFetchJson<{ data: TranscriptionResult }>('/api/analyze-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, artist, promptHint })
      });

      if (!res.ok || !res.data?.data) {
        throw new Error(res.error || '악보 채보 분석에 실패했습니다.');
      }

      const score = res.data.data;
      handleSwitchScore(score);
      setCurrentTab('player');
      showToast(`"${score.title}" 악보 채보 완료!`, 'success');

      // Auto-save to Google Sheet backend
      saveToGoogleSheets(score);
    } catch (err: any) {
      showToast(err.message || '악보 분석 중 오류가 발생했습니다.', 'error');
    } finally {
      setIsLoading(false);
      setStatusMessage('');
    }
  };

  // Audio File/Mic Transcription with safe fetch
  const handleTranscribeAudio = async (
    audioBase64: string,
    mimeType: string,
    titleHint?: string,
    artistHint?: string
  ) => {
    setIsLoading(true);
    setStatusMessage('AI가 오디오 주파수 스펙트럼과 피아노 건반 계이름을 정밀 추출하고 있습니다...');
    try {
      const res = await safeFetchJson<{ data: TranscriptionResult }>('/api/analyze-audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audioBase64, mimeType, titleHint, artistHint })
      });

      if (!res.ok || !res.data?.data) {
        throw new Error(res.error || '음원 분석에 실패했습니다.');
      }

      const score = res.data.data;
      handleSwitchScore(score);
      setCurrentTab('player');
      showToast(`음원 악보 채보 완료: "${score.title}"`, 'success');

      // Auto-save to Google Sheet backend
      saveToGoogleSheets(score);
    } catch (err: any) {
      showToast(err.message || '음원 분석 중 오류가 발생했습니다.', 'error');
    } finally {
      setIsLoading(false);
      setStatusMessage('');
    }
  };

  // MIR Music Information Retrieval Search with safe fetch
  const handleMirSearch = async (query: string) => {
    setIsLoading(true);
    setStatusMessage('가사 및 음향 데이터를 정규화하여 MIR 식별 중입니다...');
    try {
      const res = await safeFetchJson<{ data: TranscriptionResult }>('/api/mir-identify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });

      if (!res.ok || !res.data?.data) {
        throw new Error(res.error || 'MIR 식별에 실패했습니다.');
      }

      const score = res.data.data;
      handleSwitchScore(score);
      setCurrentTab('mir');
      showToast(`MIR 식별 성공: ${score.title} - ${score.artist}`, 'success');
      saveToGoogleSheets(score);
    } catch (err: any) {
      showToast(err.message || 'MIR 식별 중 오류가 발생했습니다.', 'error');
    } finally {
      setIsLoading(false);
      setStatusMessage('');
    }
  };

  const handleClearMir = () => {
    handleSwitchScore(SAMPLE_TRANSCRIPTIONS[0]);
    showToast('MIR 식별 결과가 초기화되었습니다.', 'info');
  };

  // Save to Google Sheets with defensive handling
  const saveToGoogleSheets = async (scoreToSave = currentScore) => {
    if (!scoreToSave) return;
    setIsSavingToSheet(true);
    try {
      const res = await safeFetchJson<{ message?: string; googleSheetResponse?: any }>(
        '/api/sheets/save',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(scoreToSave)
        }
      );

      if (!res.ok) {
        throw new Error(res.error || 'Google Sheets 저장에 실패했습니다.');
      }

      showToast('Google Sheets 데이터베이스에 악보가 안전하게 저장되었습니다!', 'success');
      fetchSheetRecords();
    } catch (err: any) {
      showToast(err.message || 'Google Sheets 저장 실패', 'error');
    } finally {
      setIsSavingToSheet(false);
    }
  };

  // Load from Sheets table
  const handleSelectScoreFromSheet = async (scoreId: string) => {
    const preset = SAMPLE_TRANSCRIPTIONS.find((s) => s.id === scoreId);
    if (preset) {
      handleSwitchScore(preset);
      setCurrentTab('player');
      return;
    }

    try {
      const res = await safeFetchJson<{ data: TranscriptionResult }>(`/api/scores/${scoreId}`);
      if (res.ok && res.data?.data) {
        handleSwitchScore(res.data.data);
        setCurrentTab('player');
        return;
      }
    } catch {
      // fallback below
    }

    const row = sheetScores.find((s) => s.id === scoreId);
    if (row) {
      const constructedScore: TranscriptionResult = {
        id: row.id,
        title: row.title,
        artist: row.artist,
        bpm: Number(row.bpm) || 80,
        key: row.key || 'C Major',
        summary: `${row.title} 악보 데이터입니다.`,
        keywords: ['#피아노', '#악보채보'],
        sheetData: row.sheetData,
        hands: {
          rightHandMelody: ['G4', 'Bb4', 'Eb5', 'D5', 'C5', 'Bb4', 'G4', 'F4'],
          leftHandChords: [
            ['Eb3', 'Bb3', 'Eb4'],
            ['C3', 'G3', 'C4'],
            ['Ab2', 'Eb3', 'Ab3'],
            ['Bb2', 'F3', 'Bb3']
          ]
        },
        createdAt: row.createdAt
      };
      handleSwitchScore(constructedScore);
      setCurrentTab('player');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500/30 selection:text-amber-200">
      {/* Toast Notification */}
      {toastNotification && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-2xl backdrop-blur-md border animate-bounce text-xs font-semibold ${
            toastNotification.type === 'error'
              ? 'bg-rose-950/95 border-rose-500/50 text-rose-200'
              : toastNotification.type === 'success'
              ? 'bg-emerald-950/95 border-emerald-500/50 text-emerald-200'
              : 'bg-slate-900/95 border-amber-500/40 text-amber-200'
          }`}
        >
          {toastNotification.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          ) : toastNotification.type === 'success' ? (
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          )}
          <span>{toastNotification.text}</span>
        </div>
      )}

      {/* Environment Variable Warning Banner if missing */}
      {envWarning && (
        <div className="bg-amber-950/90 border-b border-amber-500/40 px-4 py-2 text-xs text-amber-200 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 overflow-hidden">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="truncate font-medium">{envWarning}</span>
          </div>
          <button
            onClick={() => setEnvWarning(null)}
            className="text-amber-400 hover:text-white p-1 rounded transition-colors shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Top Korean Navigation Bar */}
      <Navbar
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        isSheetConnected={true}
        scoreCount={sheetScores.length}
      />

      {/* Hero Quick Switcher Strip */}
      <div className="border-b border-slate-800/80 bg-slate-900/40 px-4 py-2.5">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-400">
            <span className="font-semibold text-slate-300 flex items-center gap-1.5">
              <Disc3 className="w-3.5 h-3.5 text-amber-400" />
              추천 명곡 프리셋:
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              {SAMPLE_TRANSCRIPTIONS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => handleSwitchScore(s)}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    currentScore.id === s.id
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                      : 'bg-slate-950/80 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  {s.title}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => saveToGoogleSheets()}
              disabled={isSavingToSheet}
              className="flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 font-medium transition-colors cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>현재 악보를 Google Sheets에 동기화</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-8 space-y-6">
        {/* Tab 1: Piano Player & Grand Staff Visualizer */}
        {currentTab === 'player' && (
          <div className="space-y-6">
            <PlaybackController
              score={currentScore}
              isPlaying={isPlaying}
              currentStep={currentStep}
              totalSteps={totalSteps}
              onPlay={handlePlay}
              onPause={handlePause}
              onStop={handleStop}
              onSeek={handleSeek}
              playbackSpeed={playbackSpeed}
              onSpeedChange={handleSpeedChange}
              isMetronomeOn={isMetronomeOn}
              onToggleMetronome={handleToggleMetronome}
            />

            <GrandStaffViewer
              score={currentScore}
              currentStep={currentStep}
              isPlaying={isPlaying}
            />

            <PianoVisualizer
              activeRightNotes={activeRightNotes}
              activeLeftNotes={activeLeftNotes}
            />
          </div>
        )}

        {/* Tab 2: Transcription Studio (Text, File, Mic) */}
        {currentTab === 'transcribe' && (
          <div className="space-y-6">
            <AudioUploader
              onTranscribeText={handleTranscribeText}
              onTranscribeAudio={handleTranscribeAudio}
              isLoading={isLoading}
              statusMessage={statusMessage}
            />

            {/* Quick preview of currently active score */}
            {currentScore && (
              <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400">현재 작업 중인 악보:</span>
                  <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                    {currentScore.title}
                    <span className="text-xs font-normal text-amber-400 font-mono">
                      ({currentScore.key}, {currentScore.bpm} BPM)
                    </span>
                  </h4>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentTab('mir')}
                    className="px-3.5 py-2 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/40 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Disc3 className="w-4 h-4" />
                    MIR 식별 결과 보기
                  </button>
                  <button
                    onClick={() => setCurrentTab('player')}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Piano className="w-4 h-4" />
                    피아노 연주 & 악보 보기
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: MIR Identification Results */}
        {currentTab === 'mir' && (
          <div className="space-y-6">
            <MirIdentificationCard
              score={currentScore}
              onClearResult={handleClearMir}
              onGoToPianoPlayer={() => setCurrentTab('player')}
              onSaveToSheet={() => saveToGoogleSheets()}
              onSearchQuery={handleMirSearch}
            />
          </div>
        )}

        {/* Tab 4: Google Sheets Database Archive */}
        {currentTab === 'database' && (
          <GoogleSheetsManager
            currentScore={currentScore}
            sheetScores={sheetScores}
            onSaveToSheet={() => saveToGoogleSheets()}
            onRefreshSheet={fetchSheetRecords}
            onSelectScore={handleSelectScoreFromSheet}
            isSaving={isSavingToSheet}
            isFetching={isFetchingSheet}
            appsScriptUrl={GOOGLE_APPS_SCRIPT_URL}
          />
        )}

        {/* Tab 5: AI Music Analysis Report & JSON / XML */}
        {currentTab === 'report' && (
          <MusicAnalysisReport score={currentScore} />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 px-6 py-6 text-xs text-slate-500 text-center">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-400">AI 음악 분석가 & 피아노 악보 채보 전문가</span>
            <span>·</span>
            <span>Google Sheets Cloud Database Seamless Integration</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-slate-500">MusicXML 3.1 & ABC Notation 호환</span>
            <span>·</span>
            <a
              href={GOOGLE_APPS_SCRIPT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-400 hover:underline flex items-center gap-1"
            >
              구글 시트 백엔드 확인
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
