/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TranscriptionResult } from '../types/music';

export const SAMPLE_TRANSCRIPTIONS: TranscriptionResult[] = [
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
    categories: {
      genres: ['#Progressive Rock', '#Operatic Pop'],
      moods: ['#Dramatic'],
      instruments: ['#Piano', '#Electric Guitar'],
      altTitles: ['#A Cappella', '#Mama Just Killed a Man']
    },
    sheetData: `<?xml version="1.0" encoding="UTF-8"?>
<score-partwise version="3.1"><work><work-title>Bohemian Rhapsody</work-title></work></score-partwise>`,
    hands: {
      rightHandMelody: [
        'Bb4', 'C5', 'D5', 'Eb5', 'D5', 'C5', 'Bb4', 'F4',
        'G4', 'Bb4', 'C5', 'D5', 'C5', 'Bb4', 'G4', 'F4'
      ],
      leftHandChords: [
        ['Bb2', 'F3', 'Bb3'], ['Gm2', 'D3', 'G3'], ['Cm3', 'G3', 'C4'], ['F2', 'C3', 'F3'],
        ['Bb2', 'F3', 'D4'], ['Eb2', 'Bb2', 'G3'], ['F2', 'C3', 'A3'], ['Bb2', 'F3', 'Bb3']
      ]
    },
    audioUrl: '',
    createdAt: '2026-10-10 12:03:51',
    isSyncedToSheet: true
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
    keywords: ['#피아노', '#어쿠스틱', '#발라드', '#아이유', '#밤편지', '#감성'],
    categories: {
      genres: ['#어쿠스틱', '#발라드'],
      moods: ['#감성', '#서정적'],
      instruments: ['#피아노', '#어쿠스틱기타'],
      altTitles: ['#Through the Night']
    },
    sheetData: `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 3.1 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">
<score-partwise version="3.1">
  <work><work-title>밤편지 (Through the Night)</work-title></work>
  <identification><creator type="composer">아이유 (IU)</creator></identification>
  <part-list><score-part id="P1"><part-name>Piano</part-name></score-part></part-list>
  <part id="P1">
    <measure number="1">
      <attributes>
        <divisions>2</divisions><key><fifths>-3</fifths></key>
        <time><beats>4</beats><beat-type>4</beat-type></time>
        <staves>2</staves>
        <clef number="1"><sign>G</sign><line>2</line></clef>
        <clef number="2"><sign>F</sign><line>4</line></clef>
      </attributes>
      <direction><direction-type><metronome><beat-unit>quarter</beat-unit><per-minute>76</per-minute></metronome></direction-type></direction>
      <note><pitch><step>G</step><octave>4</octave></pitch><duration>2</duration><voice>1</voice><type>quarter</type><staff>1</staff></note>
      <note><pitch><step>Bb</step><alter>-1</alter><octave>4</octave></pitch><duration>2</duration><voice>1</voice><type>quarter</type><staff>1</staff></note>
      <note><pitch><step>Eb</step><alter>-1</alter><octave>5</octave></pitch><duration>2</duration><voice>1</voice><type>quarter</type><staff>1</staff></note>
      <note><pitch><step>D</step><octave>5</octave></pitch><duration>2</duration><voice>1</voice><type>quarter</type><staff>1</staff></note>
      <backup><duration>8</duration></backup>
      <note><pitch><step>Eb</step><alter>-1</alter><octave>3</octave></pitch><duration>2</duration><voice>2</voice><type>quarter</type><staff>2</staff></note>
      <note><chord/><pitch><step>Bb</step><alter>-1</alter><octave>3</octave></pitch><duration>2</duration><voice>2</voice><type>quarter</type><staff>2</staff></note>
      <note><pitch><step>G</step><octave>3</octave></pitch><duration>2</duration><voice>2</voice><type>quarter</type><staff>2</staff></note>
      <note><pitch><step>Bb</step><alter>-1</alter><octave>3</octave></pitch><duration>2</duration><voice>2</voice><type>quarter</type><staff>2</staff></note>
      <note><pitch><step>Eb</step><alter>-1</alter><octave>3</octave></pitch><duration>2</duration><voice>2</voice><type>quarter</type><staff>2</staff></note>
    </measure>
  </part>
</score-partwise>`,
    hands: {
      rightHandMelody: [
        'G4', 'Bb4', 'Eb5', 'D5', 'C5', 'Bb4', 'G4', 'F4',
        'Eb4', 'F4', 'G4', 'G4', 'G4', 'F4', 'Eb4', 'F4',
        'G4', 'Eb4', 'R', 'Eb4', 'F4', 'G4', 'Bb4', 'Ab4'
      ],
      leftHandChords: [
        ['Eb3', 'Bb3', 'Eb4'], ['Eb3', 'G3', 'Bb3'], ['C3', 'G3', 'C4'], ['C3', 'Eb3', 'G3'],
        ['Ab2', 'Eb3', 'Ab3'], ['Ab2', 'C3', 'Eb3'], ['Bb2', 'F3', 'Bb3'], ['Bb2', 'D3', 'F3'],
        ['Eb3', 'Bb3', 'Eb4'], ['Eb3', 'G3', 'Bb3'], ['C3', 'G3', 'Eb4'], ['Bb2', 'F3', 'D4']
      ]
    },
    audioUrl: '',
    createdAt: '2026-10-10 11:30:00',
    isSyncedToSheet: true
  },
  {
    id: 'SCORE_CHOPIN_NOCTURNE',
    title: '녹턴 Op.9 No.2 (Nocturne in Eb Major)',
    artist: '프레데리크 쇼팽 (Frédéric Chopin)',
    bpm: 66,
    key: 'Eb Major',
    summary: '쇼팽의 가장 대중적인 야상곡으로, 오른손의 풍부한 벨칸토 오페라 아리아풍 장식음 멜로디와 왼손의 12/8박자 왈츠 리듬 묵직한 베이스 화음이 특징인 낭만주의 피아노 걸작입니다.',
    keywords: ['#클래식', '#쇼팽', '#녹턴', '#낭만주의', '#피아노독주', '#야상곡'],
    sheetData: `<?xml version="1.0" encoding="UTF-8"?>
<score-partwise version="3.1"><work><work-title>Nocturne Op.9 No.2</work-title></work></score-partwise>`,
    hands: {
      rightHandMelody: [
        'Bb4', 'G5', 'F5', 'G5', 'Eb5', 'Bb4', 'C5', 'Ab5',
        'G5', 'F5', 'Eb5', 'D5', 'Eb5', 'F5', 'Bb4', 'G5'
      ],
      leftHandChords: [
        ['Eb3', 'G3', 'Bb3'], ['Eb3', 'G3', 'C4'], ['C3', 'Eb3', 'Ab3'], ['Ab2', 'C3', 'Eb3'],
        ['Bb2', 'D3', 'F3'], ['Bb2', 'F3', 'Ab3'], ['Eb3', 'G3', 'Bb3'], ['Eb3', 'Bb3', 'Eb4']
      ]
    },
    audioUrl: '',
    createdAt: '2026-10-10 10:15:00',
    isSyncedToSheet: true
  },
  {
    id: 'SCORE_YIRUMA_RIVER',
    title: 'River Flows in You',
    artist: '이루마 (Yiruma)',
    bpm: 68,
    key: 'A Major',
    summary: '뉴에이지 피아노의 대표곡으로, 반복적이면서도 마음을 적시는 16분음표 테마 리듬과 A - E - F#m - D 순환 코드 진행의 왼손 반주가 주는 평온함이 극대화된 곡입니다.',
    keywords: ['#뉴에이지', '#이루마', '#힐링', '#피아노연주', '#OST', '#명곡'],
    sheetData: `<?xml version="1.0" encoding="UTF-8"?>
<score-partwise version="3.1"><work><work-title>River Flows in You</work-title></work></score-partwise>`,
    hands: {
      rightHandMelody: [
        'A4', 'C#5', 'E5', 'C#5', 'A4', 'C#5', 'B4', 'G#4',
        'F#4', 'A4', 'C#5', 'A4', 'D4', 'F#4', 'A4', 'F#4'
      ],
      leftHandChords: [
        ['A2', 'E3', 'A3'], ['E2', 'B2', 'E3'], ['F#2', 'C#3', 'F#3'], ['D2', 'A2', 'D3'],
        ['A2', 'E3', 'C#4'], ['E2', 'B2', 'G#3'], ['F#2', 'C#3', 'A3'], ['D2', 'A2', 'F#3']
      ]
    },
    audioUrl: '',
    createdAt: '2026-10-10 09:40:00',
    isSyncedToSheet: true
  },
  {
    id: 'SCORE_DEBUSSY_CLAIR',
    title: '달빛 (Clair de Lune)',
    artist: '클로드 드뷔시 (Claude Debussy)',
    bpm: 50,
    key: 'Db Major',
    summary: '인상주의 음악의 정수로, 은은하게 번지는 달빛의 질감을 9/8박자의 유려한 아르페지오와 몽환적인 텐션 화음으로 피아노 건반 위에 시각적으로 묘사한 작품입니다.',
    keywords: ['#드뷔시', '#인상주의', '#달빛', '#클래식', '#명상', '#예술'],
    sheetData: `<?xml version="1.0" encoding="UTF-8"?>
<score-partwise version="3.1"><work><work-title>Clair de Lune</work-title></work></score-partwise>`,
    hands: {
      rightHandMelody: [
        'F5', 'Eb5', 'Db5', 'C5', 'Bb4', 'Ab4', 'F4', 'Eb4',
        'F4', 'Ab4', 'Db5', 'F5', 'Ab5', 'Gb5', 'F5', 'Eb5'
      ],
      leftHandChords: [
        ['Db3', 'Ab3', 'F4'], ['Db3', 'F3', 'Ab3'], ['Gb2', 'Db3', 'Bb3'], ['F2', 'C3', 'A3'],
        ['Bbm2', 'F3', 'Db4'], ['Eb2', 'Bb2', 'Gb3'], ['Ab2', 'Eb3', 'C4'], ['Db2', 'Ab2', 'Db3']
      ]
    },
    audioUrl: '',
    createdAt: '2026-10-10 08:20:00',
    isSyncedToSheet: true
  }
];
