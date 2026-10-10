/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TranscriptionResult } from '../types/music';

// Converts note string like "C4", "Eb5", "F#3" to step, alter, octave
export function parseNotePitch(noteStr: string): { step: string; alter: number; octave: number } | null {
  if (!noteStr || typeof noteStr !== 'string') return null;
  const match = noteStr.trim().toUpperCase().match(/^([A-G])([#B]?)(-?\d+)$/);
  if (!match) return null;

  const step = match[1];
  const acc = match[2];
  const octave = parseInt(match[3], 10);
  let alter = 0;
  if (acc === '#') alter = 1;
  else if (acc === 'B') alter = -1;

  return { step, alter, octave };
}

// Extract clean flat string arrays from various shapes of rightHandMelody and leftHandChords
export function extractCleanNoteArrays(transcription: Partial<TranscriptionResult>): {
  rightHand: string[];
  leftHand: string[][];
} {
  const rightHand: string[] = [];
  const leftHand: string[][] = [];

  const rawRight = transcription.hands?.rightHandMelody;
  if (Array.isArray(rawRight)) {
    rawRight.forEach((item: any) => {
      if (typeof item === 'string') {
        rightHand.push(item);
      } else if (item && typeof item === 'object') {
        if (item.pitch && typeof item.pitch === 'string') {
          rightHand.push(item.pitch);
        } else if (Array.isArray(item.notes)) {
          item.notes.forEach((n: any) => {
            if (typeof n === 'string') rightHand.push(n);
            else if (n?.pitch) rightHand.push(n.pitch);
          });
        }
      }
    });
  }

  const rawLeft = transcription.hands?.leftHandChords;
  if (Array.isArray(rawLeft)) {
    rawLeft.forEach((item: any) => {
      if (typeof item === 'string') {
        const parts = item.split(/[,\s]+/).filter(Boolean);
        leftHand.push(parts);
      } else if (Array.isArray(item)) {
        leftHand.push(item.map(String));
      } else if (item && typeof item === 'object') {
        if (item.pitch && typeof item.pitch === 'string') {
          leftHand.push([item.pitch]);
        } else if (Array.isArray(item.pattern)) {
          const notes = item.pattern.map((p: any) => typeof p === 'string' ? p : p?.pitch).filter(Boolean);
          leftHand.push(notes.length > 0 ? notes : ['C3']);
        } else if (Array.isArray(item.notes)) {
          const notes = item.notes.map((n: any) => typeof n === 'string' ? n : n?.pitch).filter(Boolean);
          leftHand.push(notes.length > 0 ? notes : ['C3']);
        }
      }
    });
  }

  // Ensure default fallback if arrays are empty
  if (rightHand.length === 0) {
    rightHand.push('C4', 'E4', 'G4', 'B4', 'C5', 'G4', 'E4', 'C4');
  }
  if (leftHand.length === 0) {
    leftHand.push(['C3', 'G3'], ['E3', 'G3'], ['F3', 'A3'], ['G3', 'B3']);
  }

  return { rightHand, leftHand };
}

// Generate valid standard MusicXML 3.1
export function generateMusicXml(item: Partial<TranscriptionResult>): string {
  const title = item.title || 'Untitled';
  const artist = item.artist || 'AI Music Transcription';
  const bpm = item.bpm || 80;
  const key = item.key || 'C Major';

  const { rightHand, leftHand } = extractCleanNoteArrays(item);

  // Key fifths estimation
  let fifths = 0;
  if (key.includes('G ') || key.includes('G Major')) fifths = 1;
  else if (key.includes('D ') || key.includes('D Major')) fifths = 2;
  else if (key.includes('A ') || key.includes('A Major')) fifths = 3;
  else if (key.includes('E ') || key.includes('E Major')) fifths = 4;
  else if (key.includes('F ') || key.includes('F Major')) fifths = -1;
  else if (key.includes('Bb') || key.includes('B-flat')) fifths = -2;
  else if (key.includes('Eb') || key.includes('E-flat')) fifths = -3;
  else if (key.includes('Ab') || key.includes('A-flat')) fifths = -4;

  const measuresCount = Math.max(1, Math.ceil(Math.max(rightHand.length, leftHand.length) / 4));

  let measuresXml = '';
  for (let m = 0; m < measuresCount; m++) {
    const isFirst = m === 0;
    const rSlice = rightHand.slice(m * 4, (m + 1) * 4);
    const lSlice = leftHand.slice(m * 4, (m + 1) * 4);

    let notesXml = '';

    // Measure attributes (clef, key, time signature) on first measure
    if (isFirst) {
      notesXml += `
      <attributes>
        <divisions>2</divisions>
        <key>
          <fifths>${fifths}</fifths>
        </key>
        <time>
          <beats>4</beats>
          <beat-type>4</beat-type>
        </time>
        <staves>2</staves>
        <clef number="1">
          <sign>G</sign>
          <line>2</line>
        </clef>
        <clef number="2">
          <sign>F</sign>
          <line>4</line>
        </clef>
      </attributes>
      <direction placement="above">
        <direction-type>
          <metronome>
            <beat-unit>quarter</beat-unit>
            <per-minute>${bpm}</per-minute>
          </metronome>
        </direction-type>
        <sound tempo="${bpm}"/>
      </direction>`;
    }

    // Right Hand notes (Staff 1, Voice 1)
    (rSlice.length > 0 ? rSlice : ['C4']).forEach((n) => {
      const parsed = parseNotePitch(n);
      if (parsed) {
        notesXml += `
      <note>
        <pitch>
          <step>${parsed.step}</step>
          ${parsed.alter !== 0 ? `<alter>${parsed.alter}</alter>` : ''}
          <octave>${parsed.octave}</octave>
        </pitch>
        <duration>2</duration>
        <voice>1</voice>
        <type>quarter</type>
        <staff>1</staff>
      </note>`;
      } else {
        notesXml += `
      <note>
        <rest/>
        <duration>2</duration>
        <voice>1</voice>
        <type>quarter</type>
        <staff>1</staff>
      </note>`;
      }
    });

    // Backup to measure start for Staff 2
    notesXml += `
      <backup>
        <duration>${Math.max(rSlice.length, 1) * 2}</duration>
      </backup>`;

    // Left Hand notes/chords (Staff 2, Voice 2)
    (lSlice.length > 0 ? lSlice : [['C3', 'G3']]).forEach((ch) => {
      const notes = Array.isArray(ch) ? ch : [ch];
      notes.forEach((n, idx) => {
        const parsed = parseNotePitch(n);
        if (parsed) {
          notesXml += `
      <note>
        ${idx > 0 ? '<chord/>' : ''}
        <pitch>
          <step>${parsed.step}</step>
          ${parsed.alter !== 0 ? `<alter>${parsed.alter}</alter>` : ''}
          <octave>${parsed.octave}</octave>
        </pitch>
        <duration>2</duration>
        <voice>2</voice>
        <type>quarter</type>
        <staff>2</staff>
      </note>`;
        }
      });
    });

    measuresXml += `
    <measure number="${m + 1}">${notesXml}
    </measure>`;
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 3.1 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">
<score-partwise version="3.1">
  <work>
    <work-title>${title}</work-title>
  </work>
  <identification>
    <creator type="composer">${artist}</creator>
    <encoding>
      <software>AI Music Transcription Studio</software>
      <encoding-date>${new Date().toISOString().slice(0, 10)}</encoding-date>
    </encoding>
  </identification>
  <part-list>
    <score-part id="P1">
      <part-name>Piano</part-name>
      <score-instrument id="P1-I1">
        <instrument-name>Acoustic Grand Piano</instrument-name>
      </score-instrument>
    </score-part>
  </part-list>
  <part id="P1">${measuresXml}
  </part>
</score-partwise>`;
}

// Generate ABC Notation
export function generateAbcNotation(item: Partial<TranscriptionResult>): string {
  const title = item.title || 'Untitled';
  const artist = item.artist || 'AI Music Transcription';
  const bpm = item.bpm || 80;
  const key = item.key || 'C';

  // map key to ABC key
  let abcKey = 'C';
  if (key.includes('Eb')) abcKey = 'Eb';
  else if (key.includes('Bb')) abcKey = 'Bb';
  else if (key.includes('F Major')) abcKey = 'F';
  else if (key.includes('G Major')) abcKey = 'G';
  else if (key.includes('D Major')) abcKey = 'D';
  else if (key.includes('A Major')) abcKey = 'A';
  else if (key.includes('Db')) abcKey = 'Db';

  const { rightHand, leftHand } = extractCleanNoteArrays(item);

  // Convert note pitch like "C4" to ABC note "C"
  const toAbcPitch = (noteStr: string): string => {
    const p = parseNotePitch(noteStr);
    if (!p) return 'z';
    let base = p.step;
    if (p.alter === 1) base = '^' + base;
    if (p.alter === -1) base = '_' + base;

    if (p.octave >= 5) {
      base = base.toLowerCase();
      if (p.octave > 5) base += "'".repeat(p.octave - 5);
    } else if (p.octave === 4) {
      // middle octave
      base = base.toUpperCase();
    } else if (p.octave <= 3) {
      base = base.toUpperCase() + ','.repeat(4 - p.octave);
    }
    return base;
  };

  const rAbc = rightHand.map(toAbcPitch).join(' ');
  const lAbc = leftHand.map(chord => {
    if (chord.length > 1) {
      return '[' + chord.map(toAbcPitch).join('') + ']';
    }
    return toAbcPitch(chord[0] || 'C3');
  }).join(' ');

  return `X:1
T:${title}
C:${artist}
M:4/4
L:1/4
Q:1/4=${bpm}
K:${abcKey}
V:1 clef=treble name="Right Hand"
V:2 clef=bass name="Left Hand"
[V:1] ${rAbc} |]
[V:2] ${lAbc} |]`;
}
