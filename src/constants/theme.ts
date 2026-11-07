/**
 * Tokens de design do Foco — tema dark com acento violeta.
 */

export const C = {
  /** Fundo principal */
  bg: '#0B0B10',
  /** Fundo mais profundo (tela de foco) */
  bgDeep: '#08080C',
  /** Superfície de card */
  surface: '#14141C',
  /** Superfície elevada (chips, inputs, sub-cards) */
  surface2: '#1D1D28',
  /** Superfície mais elevada (elementos ativos) */
  surface3: '#262633',
  /** Bordas sutis */
  border: '#262633',
  /** Barra de abas */
  tabbar: '#0E0E15',

  text: '#F5F5FA',
  textDim: '#9B9BAF',
  textFaint: '#66667E',

  accent: '#8B5CF6',
  accentLight: '#A78BFA',
  accentDeep: '#6D28D9',
  accentSoft: 'rgba(139, 92, 246, 0.16)',
  accentBorder: 'rgba(139, 92, 246, 0.45)',

  green: '#34D399',
  greenDeep: '#10B981',
  greenSoft: 'rgba(52, 211, 153, 0.14)',

  red: '#F87171',
  redSoft: 'rgba(248, 113, 113, 0.13)',

  orange: '#FB923C',
  orangeSoft: 'rgba(251, 146, 60, 0.14)',

  blue: '#60A5FA',
  blueSoft: 'rgba(96, 165, 250, 0.14)',

  pink: '#F472B6',
  pinkSoft: 'rgba(244, 114, 182, 0.14)',
} as const;

/** Raios de borda */
export const R = {
  card: 20,
  chip: 12,
  field: 14,
  btn: 16,
  pill: 999,
} as const;

/** Espaçamentos */
export const SP = {
  xs: 4,
  s: 8,
  m: 12,
  l: 16,
  xl: 20,
  xxl: 28,
} as const;

/** Sombra suave para elementos flutuantes (FAB, modais) */
export const softShadow = {
  shadowColor: '#000000',
  shadowOpacity: 0.35,
  shadowRadius: 14,
  shadowOffset: { width: 0, height: 6 },
  elevation: 8,
} as const;
