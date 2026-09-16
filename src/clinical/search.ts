import type { ClinicalEntry } from './types';

export function normalizeSearch(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es').trim();
}

export function searchEntries<T extends ClinicalEntry>(entries: T[], query: string, category = 'Todas'): T[] {
  const terms = normalizeSearch(query).split(/\s+/).filter(Boolean);
  return entries.filter(entry => {
    const searchable = normalizeSearch([entry.name, ...entry.aliases, entry.summary, entry.category].join(' '));
    return (category === 'Todas' || category === entry.category) && terms.every(term => searchable.includes(term));
  }).sort((a, b) => {
    const exact = (e: T) => [e.name, ...e.aliases].some(name => normalizeSearch(name) === normalizeSearch(query));
    return Number(exact(b)) - Number(exact(a));
  });
}
