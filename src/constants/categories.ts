/**
 * Categorias padrão usadas por tarefas e hábitos.
 */

export type CategoryId = 'trabalho' | 'estudo' | 'saude' | 'casa' | 'pessoal';

export interface Category {
  id: CategoryId;
  label: string;
  color: string;
}

export const CATEGORIES: readonly Category[] = [
  { id: 'trabalho', label: 'Trabalho', color: '#60A5FA' },
  { id: 'estudo', label: 'Estudo', color: '#A78BFA' },
  { id: 'saude', label: 'Saúde', color: '#34D399' },
  { id: 'casa', label: 'Casa', color: '#FB923C' },
  { id: 'pessoal', label: 'Pessoal', color: '#F472B6' },
] as const;

export const CATEGORY_MAP: Record<CategoryId, Category> = CATEGORIES.reduce(
  (acc, c) => {
    acc[c.id] = c;
    return acc;
  },
  {} as Record<CategoryId, Category>,
);

export function categoryColor(id: CategoryId): string {
  return CATEGORY_MAP[id]?.color ?? '#9B9BAF';
}

export function categoryLabel(id: CategoryId): string {
  return CATEGORY_MAP[id]?.label ?? '—';
}
