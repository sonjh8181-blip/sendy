/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface NoteEvent {
  pitch: string; // e.g. "C4", "Eb4", "F#5", "R" (rest)
  duration?: string; // e.g. "4th", "8th", "16th", "half", "whole"
  tie?: boolean;
}

export interface MeasureData {
  measureNumber: number;
  section?: string;
  chord?: string;
  rightHandNotes: string[];
  leftHandNotes: string[];
  lyrics?: string;
}

export interface TranscriptionHands {
  rightHandMelody: (string | { pitch: string; duration?: string; tie?: boolean } | any)[];
  leftHandChords: (string | { pitch?: string; chord?: string; pattern?: any[] } | any)[];
}

export interface TranscriptionResult {
  id?: string;
  title: string;
  artist: string;
  bpm: number;
  key: string;
  summary: string;
  keywords: string[];
  sheetData: string | Record<string, any>;
  hands: TranscriptionHands;
  audioUrl?: string;
  createdAt?: string;
  isSyncedToSheet?: boolean;
  
  // MIR & Metadata fields
  searchQuery?: string;
  identifiedAt?: string;
  spotifyUrl?: string;
  youtubeUrl?: string;
  categories?: {
    genres?: string[];
    moods?: string[];
    instruments?: string[];
    altTitles?: string[];
  };
  
  // Normalized playback notes
  normalizedRightHand?: string[];
  normalizedLeftHand?: string[];
  measures?: MeasureData[];
}

export interface SheetRowRecord {
  id: string;
  title: string;
  artist: string;
  bpm: number | string;
  key: string;
  sheetData: string;
  audioUrl?: string;
  createdAt: string;
}
