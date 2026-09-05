// Estado do jogo: única fonte de verdade, persistida em localStorage.
// Reaproveitado tanto pelo fluxo de AR quanto pelo Modo demonstração.

import { PONTOS, PONTOS_POR_COLETA } from '../config/content';

const STORAGE_KEY = 'missao-tesouro:v1';

export type Modo = 'ar' | 'demo';

export interface GameState {
  nomeEquipe: string;
  modo: Modo;
  /** ids dos pontos já coletados, na ordem em que foram coletados */
  coletados: string[];
  pontuacao: number;
  concluido: boolean;
}

function estadoInicial(): GameState {
  return {
    nomeEquipe: '',
    modo: 'demo',
    coletados: [],
    pontuacao: 0,
    concluido: false
  };
}

let estado: GameState = carregar();
type Listener = (estado: GameState) => void;
const listeners = new Set<Listener>();

function carregar(): GameState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return estadoInicial();
    const salvo = JSON.parse(raw) as Partial<GameState>;
    return {
      ...estadoInicial(),
      ...salvo,
      coletados: Array.isArray(salvo.coletados) ? salvo.coletados : []
    };
  } catch {
    return estadoInicial();
  }
}

function persistir() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(estado));
  listeners.forEach((fn) => fn(estado));
}

export function getState(): GameState {
  return estado;
}

export function onChange(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** Existe uma partida salva com progresso (equipe definida e não concluída/zerada)? */
export function temPartidaSalva(): boolean {
  return estado.nomeEquipe.trim().length > 0 && (estado.coletados.length > 0 || estado.concluido);
}

export function iniciarPartida(nomeEquipe: string, modo: Modo) {
  estado = {
    ...estadoInicial(),
    nomeEquipe: nomeEquipe.trim(),
    modo
  };
  persistir();
}

export function continuarPartida() {
  // Estado já carregado do localStorage; apenas notifica quem está ouvindo.
  listeners.forEach((fn) => fn(estado));
}

export function getPontoAtual() {
  return PONTOS[estado.coletados.length] ?? null;
}

export function getIndiceAtual() {
  return estado.coletados.length;
}

export function jaColetou(pontoId: string): boolean {
  return estado.coletados.includes(pontoId);
}

/** Coleta um objeto uma única vez; chamadas repetidas são ignoradas (idempotente). */
export function coletarPonto(pontoId: string): boolean {
  const pontoAtual = getPontoAtual();
  if (!pontoAtual || pontoAtual.id !== pontoId || jaColetou(pontoId)) {
    return false;
  }
  estado = {
    ...estado,
    coletados: [...estado.coletados, pontoId],
    pontuacao: estado.pontuacao + PONTOS_POR_COLETA,
    concluido: estado.coletados.length + 1 >= PONTOS.length
  };
  persistir();
  return true;
}

export function reiniciar() {
  localStorage.removeItem(STORAGE_KEY);
  estado = estadoInicial();
  listeners.forEach((fn) => fn(estado));
}
