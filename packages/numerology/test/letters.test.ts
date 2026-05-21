import { describe, it, expect } from 'vitest';
import { classifyLetter, letterValue, letters } from '../src/letters.js';

describe('Pythagorean letter mapping', () => {
  it('maps each row correctly', () => {
    expect(letterValue('A')).toBe(1);
    expect(letterValue('J')).toBe(1);
    expect(letterValue('S')).toBe(1);
    expect(letterValue('I')).toBe(9);
    expect(letterValue('R')).toBe(9);
    expect(letterValue('Z')).toBe(8);
  });

  it('is case-insensitive', () => {
    expect(letterValue('a')).toBe(1);
    expect(letterValue('z')).toBe(8);
  });

  it('returns 0 for non-letters', () => {
    expect(letterValue(' ')).toBe(0);
    expect(letterValue('1')).toBe(0);
  });
});

describe('classifyLetter (Y is consonant)', () => {
  it('classifies AEIOU as vowels', () => {
    for (const v of ['A', 'E', 'I', 'O', 'U']) {
      expect(classifyLetter(v)).toBe('vowel');
    }
  });

  it('classifies Y as consonant in strict Pythagorean', () => {
    expect(classifyLetter('Y')).toBe('consonant');
  });

  it('classifies other letters as consonants', () => {
    for (const c of ['B', 'C', 'D', 'F', 'L', 'R', 'Z']) {
      expect(classifyLetter(c)).toBe('consonant');
    }
  });

  it('treats non-letters as ignored', () => {
    expect(classifyLetter(' ')).toBe('ignored');
    expect(classifyLetter('-')).toBe('ignored');
    expect(classifyLetter('5')).toBe('ignored');
  });
});

describe('letters iterator', () => {
  it('yields only A–Z, uppercased, in order', () => {
    expect([...letters('Lucky Surya')]).toEqual(['L', 'U', 'C', 'K', 'Y', 'S', 'U', 'R', 'Y', 'A']);
  });

  it('strips diacritics', () => {
    expect([...letters('Émile')]).toEqual(['E', 'M', 'I', 'L', 'E']);
    expect([...letters('Renée')]).toEqual(['R', 'E', 'N', 'E', 'E']);
  });

  it('skips digits and punctuation', () => {
    expect([...letters("O'Brien-3")]).toEqual(['O', 'B', 'R', 'I', 'E', 'N']);
  });
});
