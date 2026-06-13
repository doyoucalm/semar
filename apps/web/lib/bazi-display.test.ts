import { describe, it, expect } from 'vitest';
import {
  ELEMENT_EN, ELEMENT_COLOR, STEM_ELEMENT, BRANCH_ELEMENT,
  TEN_GOD_EN, BRANCH_ANIMAL, elementOf, colorOf, type Element,
} from './bazi-display';

// Characterization tests — pin the BaZi-calculator display vocabulary so a
// refactor of bazi-display.ts can't silently drop or remap a glyph.

const STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
const BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
const ELEMENTS: Element[] = ['木', '火', '土', '金', '水'];

describe('element maps are complete', () => {
  it('all 10 stems map to an element', () => {
    for (const s of STEMS) expect(STEM_ELEMENT[s], s).toBeDefined();
    expect(Object.keys(STEM_ELEMENT)).toHaveLength(10);
  });

  it('all 12 branches map to an element', () => {
    for (const b of BRANCHES) expect(BRANCH_ELEMENT[b], b).toBeDefined();
    expect(Object.keys(BRANCH_ELEMENT)).toHaveLength(12);
  });

  it('every element has a color and an English name', () => {
    for (const e of ELEMENTS) {
      expect(ELEMENT_COLOR[e], e).toMatch(/^#[0-9a-f]{6}$/i);
      expect(ELEMENT_EN[e], e).toBeTruthy();
    }
  });

  it('all 12 branches have a zodiac animal', () => {
    for (const b of BRANCHES) expect(BRANCH_ANIMAL[b], b).toBeTruthy();
  });
});

describe('known element assignments (the five-element canon)', () => {
  it('stems', () => {
    expect(STEM_ELEMENT['甲']).toBe('木');
    expect(STEM_ELEMENT['丙']).toBe('火');
    expect(STEM_ELEMENT['戊']).toBe('土');
    expect(STEM_ELEMENT['庚']).toBe('金');
    expect(STEM_ELEMENT['壬']).toBe('水');
  });
  it('branches', () => {
    expect(BRANCH_ELEMENT['子']).toBe('水');
    expect(BRANCH_ELEMENT['午']).toBe('火');
    expect(BRANCH_ELEMENT['卯']).toBe('木');
    expect(BRANCH_ELEMENT['酉']).toBe('金');
    expect(BRANCH_ELEMENT['辰']).toBe('土');
  });
});

describe('ten gods', () => {
  it('all 10 ten-gods have English labels', () => {
    expect(Object.keys(TEN_GOD_EN)).toHaveLength(10);
    expect(TEN_GOD_EN['正官']).toBe('Direct Officer');
    expect(TEN_GOD_EN['七杀']).toBe('Seven Killings');
  });
});

describe('elementOf / colorOf', () => {
  it('resolves a stem and a branch to its element', () => {
    expect(elementOf('甲')).toBe('木');
    expect(elementOf('子')).toBe('水');
  });
  it('returns null for a non-stem/branch char', () => {
    expect(elementOf('x')).toBeNull();
  });
  it('colorOf matches the element color, falls back to parchment', () => {
    expect(colorOf('甲')).toBe(ELEMENT_COLOR['木']);
    expect(colorOf('x')).toBe('#e8d9c0');
  });
});
