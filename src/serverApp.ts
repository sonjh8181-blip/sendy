/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

export const app = express();

// Increase json payload size to allow base64 audio uploads
app.use(express.json({ limit: '35mb' }));
app.use(express.urlencoded({ extended: true, limit: '35mb' }));

export const GOOGLE_APPS_SCRIPT_URL =
  process.env.VITE_GAS_URL ||
  process.env.GAS_URL ||
  'https://script.google.com/macros/s/AKfycbwI8ikYRFtHIIg6IrMK_B54Ms4RLE1XebtxG6kC-VXRM-bz_siFmcPAWP7APO9Dc-O4/exec';

// Server-side persistent in-memory cache for rich score data
export const scoresCache = new Map<string, any>();

// Seed initial sample scores in cache
const INITIAL_PRESETS = [
  {
    id: 'SCORE_QUEEN_BOHEMIAN_RHAPSODY',
    title: 'Bohemian Rhapsody',
    artist: 'Queen',
    bpm: 72,
    key: 'Bb Major',
    searchQuery: 'is this the real life is this just fantasy caug...',
    identifiedAt: '오후 12:03:51',
    summary: '프레디 머큐리의 대표 걸작으로, 아카펠라 인트로, 서정적인 피아노 발라드, 오페라틱 인터루드, 하드 록 및 콰이어 코다가 드라마틱하게 유기적으로 연결된 20세기 최고의 록 심포니입니다.',
    keywords: [
      '#Progressive Rock',
      '#Operatic Pop',
      '#Dramatic',
      '#Piano',
      '#Electric Guitar',
      '#A Cappella',
      '#Mama Just Killed a Man'
    ],
    sheetData: '<?xml version="1.0" encoding="UTF-8"?><score-partwise version="3.1"><work><work-title>Bohemian Rhapsody</work-title></work></score-partwise>',
    hands: {
      rightHandMelody: ['Bb4', 'C5', 'D5', 'Eb5', 'D5', 'C5', 'Bb4'],
      leftHandChords: [['Bb2', 'F3', 'Bb3'], ['Gm2', 'D3', 'G3']]
    },
    audioUrl: '',
    createdAt: '2026-10-10 12:03:51'
  },
  {
    id: 'SCORE_IU_NIGHT_LETTER',
    title: '밤편지 (Through the Night)',
    artist: '아이유 (IU)',
    bpm: 76,
    key: 'Eb Major',
    searchQuery: '이 밤 그날의 반딧불을 당신의 창 가까이 보낼게요',
    identifiedAt: '오전 11:30:00',
    summary: '서정적이고 따뜻한 어쿠스틱 발라드로, 잔잔한 16분음표 아르페지오 왼손 반주 위에 맑고 섬세한 보컬 멜로디가 피아노 선율로 아름답게 얹혀지는 구조입니다.',
    keywords: ['#피아노', '#어쿠스틱', '#발라드', '#아이유', '#밤편지'],
    sheetData: '<?xml version="1.0" encoding="UTF-8"?><score-partwise version="3.1"><work><work-title>밤편지</work-title></work></score-partwise>',
    hands: {
      rightHandMelody: ['G4', 'Bb4', 'Eb5', 'D5', 'C5', 'Bb4', 'G4', 'F4', 'Eb4', 'F4', 'G4', 'G4', 'G4', 'F4', 'Eb4', 'F4', 'G4', 'Eb4', 'Eb4', 'F4', 'G4', 'Bb4', 'Ab4'],
      leftHandChords: [['Eb3', 'Bb3', 'Eb4'], ['Eb3', 'G3', 'Bb3'], ['C3', 'G3', 'C4'], ['C3', 'Eb3', 'G3'], ['Ab2', 'Eb3', 'Ab3'], ['Bb2', 'F3', 'Bb3'], ['Eb3', 'Bb3', 'Eb4']]
    },
    audioUrl: '',
    createdAt: '2026-10-10 11:30:00'
  },
  {
    id: 'SCORE_CHOPIN_NOCTURNE',
    title: '녹턴 Op.9 No.2 (Nocturne in Eb Major)',
    artist: '프레데리크 쇼팽 (Frédéric Chopin)',
    bpm: 66,
    key: 'Eb Major',
    summary: '쇼팽의 가장 대중적인 야상곡으로, 오른손의 풍부한 벨칸토 오페라 아리아풍 장식음 멜로디와 왼손의 12/8박자 왈츠 리듬 묵직한 베이스 화음이 특징인 낭만주의 피아노 걸작입니다.',
    keywords: ['#클래식', '#쇼팽', '#녹턴', '#피아노'],
    sheetData: '<?xml version="1.0" encoding="UTF-8"?><score-partwise version="3.1"><work><work-title>Nocturne Op.9 No.2</work-title></work></score-partwise>',
    hands: {
      rightHandMelody: ['Bb4', 'G5', 'F5', 'G5', 'Eb5', 'Bb4', 'C5', 'Ab5', 'G5', 'F5', 'Eb5', 'D5', 'Eb5', 'F5', 'Bb4', 'G5'],
      leftHandChords: [['Eb3', 'G3', 'Bb3'], ['Eb3', 'G3', 'C4'], ['C3', 'Eb3', 'Ab3'], ['Ab2', 'C3', 'Eb3'], ['Bb2', 'D3', 'F3'], ['Eb3', 'G3', 'Bb3']]
    },
    audioUrl: '',
    createdAt: '2026-10-10 10:15:00'
  }
];

INITIAL_PRESETS.forEach(p => scoresCache.set(p.id, p));

// Robust JSON extraction helper
export function cleanExtractJson<T = any>(text: string): T {
  if (!text || typeof text !== 'string') {
    throw new Error('응답 텍스트가 비어 있습니다.');
  }

  let clean = text.trim();
  clean = clean.replace(/^```json\s*/i, '').replace(/^```\s*/i, '');
  clean = clean.replace(/\s*```$/i, '');
  clean = clean.trim();

  try {
    return JSON.parse(clean);
  } catch {
    const firstBrace = clean.indexOf('{');
    const lastBrace = clean.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      const extracted = clean.substring(firstBrace, lastBrace + 1);
      try {
        return JSON.parse(extracted);
      } catch {
        const sanitized = extracted
          .replace(/,\s*([}\]])/g, '$1')
          .replace(/[\u0000-\u001F]+/g, ' ');
        return JSON.parse(sanitized);
      }
    }
    throw new Error(`JSON 형식 추출 실패: ${clean.substring(0, 150)}`);
  }
}

// Initialize Gemini SDK with defensive checks
function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey.trim() === '') {
    throw new Error(
      'GEMINI_API_KEY 환경변수가 설정되지 않았습니다. Vercel 대시보드(Settings > Environment Variables) 또는 .env 파일에 유효한 Gemini API 키를 등록해 주세요.'
    );
  }
  return new GoogleGenAI({ apiKey });
}

const SYSTEM_INSTRUCTION = `당신은 최고의 AI 음악 분석가이자 악보 채보 전문가(Music Transcription AI)입니다.
사용자가 입력한 곡 제목/아티스트 정보 또는 업로드된 오디오 음원 파일(.mp3, .wav 등)을 분석하여 피아노 악보 데이터 및 곡의 메타데이터를 정밀한 JSON 형식으로 출력하세요.

[Task & Rules]
1. 오디오 음원이 들어온 경우:
   - 음원의 멜로디, 템포(BPM), 조표(Key), 주요 코드 진행 및 왼손/오른손 건반 노트(계이름 및 박자)를 추출 분석합니다.
2. 곡 제목/텍스트가 들어온 경우:
   - 원곡의 주요 양손 피아노 연주 구성, BPM, 조표, MusicXML 규격 데이터를 정밀하게 생성합니다.
3. 응답은 무조건 지정된 정격 JSON 스키마 형식만을 반환해야 합니다. 마크다운 설명이나 서론 텍스트 없이 유효한 JSON만 반환하세요.

[Output JSON Schema]
{
  "title": "곡 제목",
  "artist": "아티스트 명",
  "bpm": 76,
  "key": "Eb Major",
  "summary": "곡 및 악보 구성 특징 요약",
  "keywords": ["#피아노", "#클래식", "#발라드"],
  "sheetData": "<?xml version=\\"1.0\\" encoding=\\"UTF-8\\"?>... (또는 ABC notation / 피아노 건반 노트 데이터)",
  "hands": {
    "rightHandMelody": ["C4", "E4", "G4", "B4"],
    "leftHandChords": ["C3", "G3", "C4"]
  }
}`;

// Health check endpoint (checks env var presence)
app.get('/api/health', (req: Request, res: Response) => {
  const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
  const hasApiKey = Boolean(apiKey && apiKey !== 'MY_GEMINI_API_KEY' && apiKey.trim().length > 0);
  res.json({
    status: 'ok',
    hasApiKey,
    gasUrl: GOOGLE_APPS_SCRIPT_URL,
    timestamp: new Date().toISOString()
  });
});

// MIR (Music Information Retrieval) Identification Endpoint
app.post('/api/mir-identify', async (req: Request, res: Response) => {
  try {
    const { query } = req.body;
    if (!query || typeof query !== 'string' || query.trim() === '') {
      return res.status(400).json({ error: '식별할 가사, 곡명 또는 키워드를 입력해 주세요.' });
    }

    const ai = getGeminiClient();
    const prompt = `사용자가 입력한 검색어/가사 구절: "${query}"

[음악 정보 검색 (MIR - Music Information Retrieval) 태스크]
1. 위 가사 또는 텍스트를 정규화하여 공식 곡명(title)과 아티스트(artist)를 정밀 식별하세요.
2. 음향 및 검색 키워드 태그(최소 7개)를 분류하여 생성하세요:
   - 장르 (예: #Progressive Rock, #Operatic Pop, #Ballad 등)
   - 분위기 (예: #Dramatic, #Nostalgic 등)
   - 주요 악기 (예: #Piano, #Electric Guitar, #Acoustic Guitar 등)
   - 대체 곡명 또는 대표 가사 훅 (예: #Mama Just Killed a Man, #A Cappella 등)
3. 원곡의 피아노 양손 연주 악보 구성(BPM, 조표, 오른손 멜로디 계이름, 왼손 화음 계이름, MusicXML)을 생성하세요.

반드시 지정된 정격 JSON 스키마 형식으로 출력하세요:
{
  "title": "공식 곡명",
  "artist": "아티스트",
  "bpm": 76,
  "key": "Bb Major",
  "summary": "곡 요약",
  "keywords": ["#Progressive Rock", "#Operatic Pop", "#Dramatic", "#Piano", "#Electric Guitar", "#A Cappella", "#Mama Just Killed a Man"],
  "sheetData": "<?xml version=\\"1.0\\" encoding=\\"UTF-8\\"?>...",
  "hands": {
    "rightHandMelody": ["Bb4", "C5", "D5"],
    "leftHandChords": ["Bb2", "F3"]
  }
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: 'application/json'
      }
    });

    const rawText = response.text || '{}';
    let data: any;
    try {
      data = cleanExtractJson(rawText);
    } catch (parseErr: any) {
      console.error('Gemini MIR parse error:', parseErr, 'Raw:', rawText.substring(0, 200));
      return res.status(502).json({
        error: 'AI 응답 파싱 실패: Gemini가 정규 JSON 형식을 반환하지 못했습니다.',
        details: rawText.substring(0, 150)
      });
    }

    const now = new Date();
    const timeFormatted = now.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const recordId = `SCORE_MIR_${Date.now()}`;

    const result = {
      id: recordId,
      title: data.title || 'Bohemian Rhapsody',
      artist: data.artist || 'Queen',
      bpm: Number(data.bpm) || 72,
      key: data.key || 'Bb Major',
      summary: data.summary || `${data.title} MIR 식별 및 피아노 채보 데이터입니다.`,
      keywords: Array.isArray(data.keywords) && data.keywords.length > 0
        ? data.keywords
        : ['#Progressive Rock', '#Operatic Pop', '#Dramatic', '#Piano', '#Electric Guitar', '#A Cappella', '#Mama Just Killed a Man'],
      sheetData: data.sheetData || '',
      hands: data.hands || {
        rightHandMelody: ['Bb4', 'C5', 'D5', 'Eb5', 'D5', 'C5', 'Bb4'],
        leftHandChords: [['Bb2', 'F3', 'Bb3'], ['Gm2', 'D3', 'G3']]
      },
      searchQuery: query,
      identifiedAt: timeFormatted,
      audioUrl: '',
      createdAt: now.toISOString()
    };

    scoresCache.set(recordId, result);

    res.json({
      success: true,
      data: result,
      mirStatus: 'IDENTIFIED'
    });
  } catch (error: any) {
    console.error('Error in /api/mir-identify:', error);
    res.status(500).json({
      error: error?.message || 'MIR 음악 식별 중 오류가 발생했습니다.',
      details: String(error)
    });
  }
});

// Analyze song by title/artist text
app.post('/api/analyze-text', async (req: Request, res: Response) => {
  try {
    const { title, artist, promptHint } = req.body;
    if (!title || typeof title !== 'string' || title.trim() === '') {
      return res.status(400).json({ error: '곡 제목을 입력해 주세요.' });
    }

    const ai = getGeminiClient();
    const prompt = `곡 제목: ${title}
아티스트/작곡가: ${artist || '미상'}
요청 편곡 스타일: ${promptHint || '원곡 충실 피아노 편곡'}

위 곡을 정밀 분석하여 피아노 양손 연주 악보(오른손 멜로디 계이름 배열, 왼손 화음 계이름 배열)와 BPM, 조표, MusicXML/ABC sheetData를 포함한 정격 JSON 스키마 형식으로 출력해 주세요.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: 'application/json'
      }
    });

    const rawText = response.text || '{}';
    let data: any;
    try {
      data = cleanExtractJson(rawText);
    } catch (parseErr: any) {
      console.error('Gemini text analysis parse error:', parseErr, 'Raw:', rawText.substring(0, 200));
      return res.status(502).json({
        error: 'AI 응답 파싱 실패: Gemini가 정규 JSON 형식을 반환하지 못했습니다.',
        details: rawText.substring(0, 150)
      });
    }

    const recordId = `SCORE_${Date.now()}`;
    const result = {
      id: recordId,
      title: data.title || title,
      artist: data.artist || artist || '알 수 없음',
      bpm: Number(data.bpm) || 80,
      key: data.key || 'C Major',
      summary: data.summary || `${title} 피아노 악보 채보 데이터입니다.`,
      keywords: Array.isArray(data.keywords) ? data.keywords : ['#피아노', '#악보채보'],
      sheetData: data.sheetData || '',
      hands: data.hands || {
        rightHandMelody: ['C4', 'E4', 'G4', 'C5'],
        leftHandChords: ['C3', 'G3', 'C4']
      },
      audioUrl: '',
      createdAt: new Date().toISOString()
    };

    scoresCache.set(recordId, result);

    res.json({ success: true, data: result });
  } catch (error: any) {
    console.error('Error in /api/analyze-text:', error);
    res.status(500).json({
      error: error?.message || '악보 분석 중 오류가 발생했습니다.',
      details: String(error)
    });
  }
});

// Analyze song from uploaded Audio or Live Mic base64
app.post('/api/analyze-audio', async (req: Request, res: Response) => {
  try {
    const { audioBase64, mimeType, titleHint, artistHint } = req.body;
    if (!audioBase64) {
      return res.status(400).json({ error: '오디오 데이터가 누락되었습니다.' });
    }

    const ai = getGeminiClient();
    const prompt = `제공된 오디오 음원을 정밀 주파수 및 멜로디 분석하여:
1. 음원의 주요 멜로디 선율, 템포(BPM), 조표(Key), 코드 진행을 추출합니다.
2. 피아노 양손 연주 구성(오른손 멜로디 노트 배열, 왼손 반주 화음 배열)을 MusicXML 및 계이름으로 정밀 채보합니다.
${titleHint ? `참고 곡 제목: ${titleHint}` : ''}
${artistHint ? `참고 아티스트: ${artistHint}` : ''}
반드시 지정된 정격 JSON 스키마 형식만 반환하세요.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: [
        {
          inlineData: {
            mimeType: mimeType || 'audio/mp3',
            data: audioBase64
          }
        },
        { text: prompt }
      ],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: 'application/json'
      }
    });

    const rawText = response.text || '{}';
    let data: any;
    try {
      data = cleanExtractJson(rawText);
    } catch (parseErr: any) {
      console.error('Gemini audio analysis parse error:', parseErr, 'Raw:', rawText.substring(0, 200));
      return res.status(502).json({
        error: 'AI 음원 분석 파싱 실패: Gemini가 정규 JSON 형식을 반환하지 못했습니다.',
        details: rawText.substring(0, 150)
      });
    }

    const recordId = `SCORE_${Date.now()}`;
    const result = {
      id: recordId,
      title: data.title || titleHint || '음원 분석 곡',
      artist: data.artist || artistHint || '음원 추출 아티스트',
      bpm: Number(data.bpm) || 76,
      key: data.key || 'C Major',
      summary: data.summary || '업로드된 음원의 주파수 및 멜로디를 AI가 피아노 양손 악보로 채보한 결과입니다.',
      keywords: Array.isArray(data.keywords) ? data.keywords : ['#음원전사', '#피아노악보', '#AI채보'],
      sheetData: data.sheetData || '',
      hands: data.hands || {
        rightHandMelody: ['C4', 'E4', 'G4', 'C5'],
        leftHandChords: ['C3', 'G3', 'C4']
      },
      audioUrl: '',
      createdAt: new Date().toISOString()
    };

    scoresCache.set(recordId, result);

    res.json({ success: true, data: result });
  } catch (error: any) {
    console.error('Error in /api/analyze-audio:', error);
    res.status(500).json({
      error: error?.message || '오디오 음원 분석 중 오류가 발생했습니다.',
      details: String(error)
    });
  }
});

// Proxy to Save to Google Sheets backend with HTML error page guard
app.post('/api/sheets/save', async (req: Request, res: Response) => {
  try {
    const score = req.body;
    if (!score || !score.title) {
      return res.status(400).json({ error: '저장할 악보 데이터가 유효하지 않습니다.' });
    }

    const recordId = score.id || `SCORE_${Date.now()}`;
    score.id = recordId;
    if (!score.createdAt) {
      score.createdAt = new Date().toISOString();
    }

    scoresCache.set(recordId, score);

    const sheetDataStr =
      typeof score.sheetData === 'string'
        ? score.sheetData
        : JSON.stringify(score.sheetData || '');

    const payload = JSON.stringify({
      id: recordId,
      title: score.title,
      artist: score.artist || '미상',
      bpm: score.bpm || 80,
      key: score.key || 'C Major',
      sheetData: sheetDataStr.slice(0, 1000),
      audioUrl: score.audioUrl || '',
      createdAt: score.createdAt
    });

    let scriptRes: any;
    try {
      scriptRes = await fetch(GOOGLE_APPS_SCRIPT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8'
        },
        body: payload
      });
    } catch (netErr: any) {
      return res.status(502).json({
        error: 'Google Apps Script 서버에 연결할 수 없습니다. GAS URL 및 네트워크 상태를 확인하세요.',
        details: netErr?.message
      });
    }

    const scriptText = await scriptRes.text();
    const trimmed = scriptText.trim();

    // Check if Google Apps Script returned an HTML error page
    if (
      trimmed.startsWith('<!DOCTYPE') ||
      trimmed.startsWith('<html') ||
      trimmed.includes('The page cannot') ||
      trimmed.includes('현재, 파일을 열 수 없습니다')
    ) {
      return res.status(502).json({
        error: 'Google Apps Script(GAS) 응답 오류: 구글 웹앱 배포 설정에서 [액세스 권한: 모든 사용자(Anyone)]로 설정되어 있는지 확인하세요.',
        details: trimmed.substring(0, 200)
      });
    }

    let scriptJson: any = {};
    try {
      scriptJson = cleanExtractJson(scriptText);
    } catch {
      scriptJson = { message: scriptText };
    }

    res.json({
      success: true,
      id: recordId,
      googleSheetResponse: scriptJson,
      message: 'Google Sheets 데이터베이스에 성공적으로 저장되었습니다.'
    });
  } catch (error: any) {
    console.error('Error in /api/sheets/save:', error);
    res.status(500).json({
      error: 'Google Sheets 저장 중 오류가 발생했습니다.',
      details: error?.message || String(error)
    });
  }
});

// Proxy to fetch list from Google Sheets backend with HTML error page guard
app.get('/api/sheets/list', async (req: Request, res: Response) => {
  try {
    let scriptRes: any;
    try {
      scriptRes = await fetch(GOOGLE_APPS_SCRIPT_URL);
    } catch (gasErr: any) {
      console.warn('GAS fetch failed, returning cached list:', gasErr?.message);
      return res.json({
        success: true,
        data: Array.from(scoresCache.values()),
        warning: 'Google Apps Script에 접속할 수 없어 로컬 캐시 목록을 반환합니다.',
        endpoint: GOOGLE_APPS_SCRIPT_URL
      });
    }

    const scriptText = await scriptRes.text();
    const trimmed = scriptText.trim();

    // Check if Google Apps Script returned an HTML error page
    if (
      trimmed.startsWith('<!DOCTYPE') ||
      trimmed.startsWith('<html') ||
      trimmed.includes('The page cannot') ||
      trimmed.includes('현재, 파일을 열 수 없습니다')
    ) {
      console.warn('GAS returned HTML page instead of JSON');
      return res.json({
        success: true,
        data: Array.from(scoresCache.values()),
        warning: 'Google Apps Script가 HTML 에러를 반환하여 로컬 보관함 목록을 표시합니다. (구글 웹앱 배포 권한을 확인하세요)',
        endpoint: GOOGLE_APPS_SCRIPT_URL
      });
    }

    let scriptJson: any;
    try {
      scriptJson = cleanExtractJson(scriptText);
    } catch {
      console.warn('GAS response JSON parse failed, returning cached scores');
      return res.json({
        success: true,
        data: Array.from(scoresCache.values()),
        warning: 'Google Apps Script 응답이 JSON 형식이 아닙니다.',
        endpoint: GOOGLE_APPS_SCRIPT_URL
      });
    }

    const rawRows = Array.isArray(scriptJson?.data) ? scriptJson.data : [];
    const sheetRows: any[] = [];
    rawRows.forEach((row: any) => {
      const id = row['열 (Column)'] || row['id'] || row['ID'];
      const title = row['헤더 이름 (Header)'] || row['title'] || row['제목'];
      const artist = row['설명 / 예시 데이터'] || row['artist'] || row['아티스트'];
      const createdAt = row[''] || row['createdAt'] || row['등록일시'];

      if (id === 'A' || id === 'B' || id === 'C' || id === 'D' || id === 'E' || id === 'F' || id === 'G' || id === 'H') {
        return;
      }

      if (id && title) {
        const cached = scoresCache.get(id);
        sheetRows.push({
          id,
          title: cached?.title || title,
          artist: cached?.artist || (artist !== '알 수 없음' ? artist : '피아노 연주곡'),
          bpm: cached?.bpm || 76,
          key: cached?.key || 'Eb Major',
          sheetData: cached?.sheetData || 'Piano Score Data',
          audioUrl: cached?.audioUrl || '',
          createdAt: cached?.createdAt || createdAt || new Date().toISOString()
        });
      }
    });

    scoresCache.forEach((item, id) => {
      if (!sheetRows.some(r => r.id === id)) {
        sheetRows.push({
          id: item.id,
          title: item.title,
          artist: item.artist,
          bpm: item.bpm,
          key: item.key,
          sheetData: typeof item.sheetData === 'string' ? item.sheetData : JSON.stringify(item.sheetData),
          audioUrl: item.audioUrl || '',
          createdAt: item.createdAt || new Date().toISOString()
        });
      }
    });

    res.json({
      success: true,
      data: sheetRows,
      endpoint: GOOGLE_APPS_SCRIPT_URL
    });
  } catch (error: any) {
    console.error('Error in /api/sheets/list:', error);
    res.json({
      success: true,
      data: Array.from(scoresCache.values()),
      warning: '오프라인 캐시 목록을 반환합니다.',
      endpoint: GOOGLE_APPS_SCRIPT_URL
    });
  }
});

// Get detailed score by ID
app.get('/api/scores/:id', (req: Request, res: Response) => {
  const score = scoresCache.get(req.params.id);
  if (!score) {
    return res.status(404).json({ error: '악보를 찾을 수 없습니다.' });
  }
  res.json({ success: true, data: score });
});

export default app;
