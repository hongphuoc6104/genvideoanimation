/**
 * packages/narration-kit/src/normalization/lexiconManager.ts
 * Hierarchical pronunciation lexicon manager implementing:
 * 1. YAML loading with strict precedence: custom.yaml > academic-vi-en.yaml > technology-vi-en.yaml
 * 2. Multi-word phrase matching with greedy longest-match-first strategy
 * 3. Strict unregistered acronym halt (prevents silent guessing)
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
// @ts-ignore
import * as yaml from 'js-yaml';
import {
  LexiconEntry,
  LexiconFile,
  PronunciationMode,
  SemanticTokenType,
  UnregisteredAcronymError,
} from './types';

export interface ResolvedLexiconMatch {
  term: string;
  matchedText: string;
  type: SemanticTokenType;
  mode: PronunciationMode;
  spoken: string;
  spokenUnits: string[];
  sourceLexicon: string;
  phonemes?: string;
}

export class LexiconManager {
  private static instance?: LexiconManager;
  private entriesByLength: LexiconEntry[] = [];
  private exactMap: Map<string, { entry: LexiconEntry; source: string }> = new Map();
  private lowerMap: Map<string, { entry: LexiconEntry; source: string }> = new Map();
  private knownTerms: Set<string> = new Set();
  private lexiconsDir: string;

  constructor(lexiconsDir?: string) {
    this.lexiconsDir = lexiconsDir || path.resolve(process.cwd(), 'lexicons');
    this.loadAllLexicons();
  }

  public static getInstance(lexiconsDir?: string): LexiconManager {
    if (!LexiconManager.instance || (lexiconsDir && LexiconManager.instance.lexiconsDir !== lexiconsDir)) {
      LexiconManager.instance = new LexiconManager(lexiconsDir);
    }
    return LexiconManager.instance;
  }

  public reload(lexiconsDir?: string): void {
    if (lexiconsDir) {
      this.lexiconsDir = lexiconsDir;
    }
    this.entriesByLength = [];
    this.exactMap.clear();
    this.lowerMap.clear();
    this.knownTerms.clear();
    this.loadAllLexicons();
  }

  private loadAllLexicons(): void {
    const filesInOrder = [
      { name: 'technology-vi-en.yaml', priority: 3 },
      { name: 'academic-vi-en.yaml', priority: 2 },
      { name: 'custom.yaml', priority: 1 },
    ];

    for (const item of filesInOrder) {
      const filePath = path.join(this.lexiconsDir, item.name);
      if (fs.existsSync(filePath)) {
        this.loadFile(filePath, item.name);
      }
    }

    // Sort entries descending by length of term (for greedy phrase matching)
    this.entriesByLength.sort((a, b) => b.term.length - a.term.length);
  }

  private loadFile(filePath: string, fileName: string): void {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const doc = yaml.load(content) as LexiconFile;
      if (!doc || !Array.isArray(doc.entries)) return;

      for (const raw of doc.entries) {
        if (!raw.term) continue;
        const entry: LexiconEntry = {
          term: raw.term,
          type: raw.type,
          mode: raw.mode,
          spoken: raw.spoken || raw.term,
          case_sensitive: raw.case_sensitive ?? false,
          notes: raw.notes,
          phonemes: raw.phonemes,
        };

        // If high priority file already set it, higher priority replaces lower priority
        this.exactMap.set(entry.term, { entry, source: fileName });
        this.lowerMap.set(entry.term.toLowerCase(), { entry, source: fileName });
        this.knownTerms.add(entry.term);
        this.knownTerms.add(entry.term.toLowerCase());

        // Replace or add in entriesByLength
        const existingIdx = this.entriesByLength.findIndex(
          (e) => e.term.toLowerCase() === entry.term.toLowerCase()
        );
        if (existingIdx >= 0) {
          this.entriesByLength[existingIdx] = entry;
        } else {
          this.entriesByLength.push(entry);
        }
      }
    } catch (err: any) {
      console.warn(`[LexiconManager] Warning loading ${filePath}: ${err.message}`);
    }
  }

  /**
   * Match a phrase or word at the beginning of a given text string.
   * Returns the longest matching lexicon entry if one matches at text start.
   */
  public matchAt(text: string): ResolvedLexiconMatch | null {
    for (const entry of this.entriesByLength) {
      const termLen = entry.term.length;
      if (text.length < termLen) continue;

      const candidate = text.slice(0, termLen);
      const isMatch = entry.case_sensitive
        ? candidate === entry.term
        : candidate.toLowerCase() === entry.term.toLowerCase();

      if (isMatch) {
        // Ensure word boundary check if next char is alphanumeric
        const nextChar = text[termLen];
        if (nextChar && /[\p{L}\p{N}]/u.test(nextChar)) {
          // Token extends further, avoid partial prefix matching
          continue;
        }

        const source = this.exactMap.get(entry.term)?.source || 'lexicon';
        const spokenUnits = this.computeSpokenUnits(entry);

        return {
          term: entry.term,
          matchedText: candidate,
          type: entry.type,
          mode: entry.mode,
          spoken: entry.spoken,
          spokenUnits,
          sourceLexicon: source,
          phonemes: entry.phonemes,
        };
      }
    }

    return null;
  }

  /**
   * Lookup exact token
   */
  public lookup(token: string): ResolvedLexiconMatch | null {
    let rec = this.exactMap.get(token);
    if (!rec) {
      rec = this.lowerMap.get(token.toLowerCase());
      if (rec && rec.entry.case_sensitive && rec.entry.term !== token) {
        rec = undefined;
      }
    }

    if (!rec) return null;

    const entry = rec.entry;
    const spokenUnits = this.computeSpokenUnits(entry);

    return {
      term: entry.term,
      matchedText: token,
      type: entry.type,
      mode: entry.mode,
      spoken: entry.spoken,
      spokenUnits,
      sourceLexicon: rec.source,
      phonemes: entry.phonemes,
    };
  }

  /**
   * Check if token is an uppercase acronym and verify it's registered.
   * If unregistered, throws UnregisteredAcronymError.
   */
  public verifyAcronym(token: string, span: [number, number], strict = true): void {
    // Check if token matches standard acronym pattern (2 or more uppercase letters, optional digits/hyphens)
    const isAcronymPattern = /^[A-Z][A-Z0-9\-]{1,}$/.test(token);
    if (!isAcronymPattern) return;

    // Allowed common non-acronyms or Roman numerals
    const whitelist = new Set(['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X']);
    if (whitelist.has(token)) return;

    const match = this.lookup(token);
    if (!match && strict) {
      throw new UnregisteredAcronymError(token, span);
    }
  }

  /**
   * Compute spoken units array for karaoke highlight alignment.
   * For en_spell: "GPU" -> ["G", "P", "U"]
   * For en_word / vi: "Scopus" -> ["Scopus"]
   * For multi-word: "Research Gap" -> ["Research", "Gap"]
   */
  private computeSpokenUnits(entry: LexiconEntry): string[] {
    if (entry.mode === 'en_spell') {
      // Split into single letters or parts
      const clean = entry.spoken.replace(/\s+/g, ' ').trim();
      return clean.split(' ').filter(Boolean);
    }

    if (entry.mode === 'en_phrase') {
      return entry.spoken.trim().split(/\s+/);
    }

    if (entry.spoken.includes(' ')) {
      return entry.spoken.trim().split(/\s+/);
    }

    return [entry.spoken];
  }

  public getKnownTerms(): string[] {
    return Array.from(this.knownTerms);
  }
}
