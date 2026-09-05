import { PONTOS, TEXTOS } from '../config/content';
import type { Modo } from '../state/gameState';
import { badgeModoDemonstracao } from './components';

export interface HuntScreenProps {
  modo: Modo;
  indiceAtual: number;
  totalColetados: number;
  descobertoNoPontoAtual: boolean;
  onProcurar: () => void;
  onColetar: () => void;
  onAbrirInventario: () => void;
}

export function renderHuntScreen(container: HTMLElement, props: HuntScreenProps) {
  const ponto = PONTOS[props.indiceAtual];
  const total = PONTOS.length;

  const pontosProgresso = PONTOS.map((_, i) => {
    const feito = i < props.totalColetados;
    return `<span class="progresso-ponto ${feito ? 'progresso-ponto--feito' : ''}"></span>`;
  }).join('');

  container.innerHTML = `
    ${props.modo === 'demo' ? badgeModoDemonstracao() : ''}
    <div class="tela tela--viewport-transparente">
      <div class="container">
        <div class="progresso-barra">
          <div class="progresso-pontos">${pontosProgresso}</div>
          <span class="progresso-texto">${TEXTOS.progresso(props.totalColetados, total)}</span>
        </div>

        <div class="card pista-card">
          <span class="pista-card__local">📍 ${ponto.nome}</span>
          <p class="pista-card__texto">"${ponto.pista}"</p>
        </div>

        <p class="aviso-simplificado">${TEXTOS.avisoLocalSimplificado}</p>

        <div class="viewport-3d" id="viewport-objeto">
          ${
            props.descobertoNoPontoAtual
              ? `<div class="viewport-3d__legenda">✨ Encontrado: ${ponto.objetoNome}!</div>`
              : ''
          }
        </div>

        <div class="pilha-botoes">
          ${
            props.descobertoNoPontoAtual
              ? `<button type="button" class="btn btn-primario" id="btn-coletar">✨ ${TEXTOS.botaoColetar}</button>`
              : `<button type="button" class="btn btn-primario" id="btn-procurar">${
                  props.modo === 'ar' ? '📷 ' + TEXTOS.botaoProcurarAR : '🔍 ' + TEXTOS.botaoSimularDemo
                }</button>`
          }
          <button type="button" class="btn btn-secundario" id="btn-inventario">🎒 ${TEXTOS.botaoVerInventario}</button>
        </div>
      </div>
    </div>
  `;

  container.querySelector('#btn-procurar')?.addEventListener('click', props.onProcurar);
  container.querySelector('#btn-coletar')?.addEventListener('click', props.onColetar);
  container.querySelector('#btn-inventario')?.addEventListener('click', props.onAbrirInventario);
}
