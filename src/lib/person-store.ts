// ============================================================
// Person Store — CRUD for Semar's permanent person library
//
// Now using Prisma for persistence (SQLite).
// ============================================================

import crypto from 'crypto';
import { Person as PersonType } from '@/types/person';
import { prisma } from './prisma';

/**
 * Generate a consistent ID for a person based on name and birth time.
 * This ensures that the same person is identified correctly across visits.
 */
export function getPersonId(name: string, birthDatetime: string): string {
  const normalized = `${name.trim().toLowerCase()}_${birthDatetime}`;
  return crypto.createHash('md5').update(normalized).digest('hex');
}

// ---- CREATE / UPDATE ----

export async function upsertPerson(personData: Partial<PersonType> & { name: string, solarDatetime: string }): Promise<string> {
  const id = personData.id || getPersonId(personData.name, personData.solarDatetime);
  
  const person = await prisma.person.upsert({
    where: { id },
    update: {
      name: personData.name,
      gender: personData.gender,
      solarDatetime: personData.solarDatetime,
      timezone: personData.timezone,
      chart: personData.chart ? JSON.stringify(personData.chart) : undefined,
      chartSummary: personData.chartSummary ? JSON.stringify(personData.chartSummary) : undefined,
    },
    create: {
      id,
      name: personData.name,
      gender: personData.gender || 'male',
      solarDatetime: personData.solarDatetime,
      timezone: personData.timezone || 'Asia/Jakarta',
      chart: JSON.stringify(personData.chart || {}),
      chartSummary: JSON.stringify(personData.chartSummary || {}),
    },
  });

  return person.id;
}

// ---- READ ----

export async function getPerson(id: string): Promise<PersonType | null> {
  const person = await prisma.person.findUnique({
    where: { id },
    include: {
      cases: true
    }
  });

  if (!person) return null;

  return {
    ...person,
    gender: person.gender as 'male' | 'female',
    chart: JSON.parse(person.chart),
    chartSummary: JSON.parse(person.chartSummary),
    createdAt: person.createdAt.toISOString(),
    updatedAt: person.updatedAt.toISOString(),
    tags: [], // Tags moved to Case level mostly
    caseIds: person.cases.map(c => c.id),
  };
}

export async function listPeople() {
  const people = await prisma.person.findMany({
    orderBy: { updatedAt: 'desc' }
  });

  return people.map(p => ({
    id: p.id,
    name: p.name,
    solarDatetime: p.solarDatetime,
    dayMaster: JSON.parse(p.chartSummary).dayMaster || '',
    dayMasterElement: JSON.parse(p.chartSummary).dayMasterElement || '',
    lastVisit: p.updatedAt.toISOString(),
  }));
}
