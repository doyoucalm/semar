// ============================================================
// PERSON PROFILE — Permanent record of a seeker
//
// A Person is a permanent entity. A Case is a single session.
// One Person can have many Cases over years of reflection.
// ============================================================

import { BaziMCPChart, ChartSummary } from './case';

export interface Person {
  id: string;                    // UUID or derived from name+birth
  name: string;
  gender: 'male' | 'female';
  solarDatetime: string;         // ISO format
  timezone: string;
  
  // Cache the chart data to avoid redundant MCP calls
  chart: BaziMCPChart;
  chartSummary: ChartSummary;

  createdAt: string;
  updatedAt: string;

  // Metadata for the practitioner
  tags: string[];
  notes?: string;
  
  // Link to all their sessions
  caseIds: string[];
}
