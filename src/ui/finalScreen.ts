import { PONTUACAO_MAXIMA, TEXTOS } from '../config/content';
import type { Modo } from '../state/gameState';
import { abrirModalConfirmacao, badgeModoDemonstracao } from './components';

export interface FinalScreenProps {
  modo: Modo;
  nomeEquipe: string;
  pontuacao: number;
  bauAberto: boolean;
  onAbrirBau: () => void;
  onReiniciar: () => void;
}

export function renderFinalScreen(container: HTMLElement, props: FinalScreenProps) {
  container.innerHTML = `
    ${props.modo === 'demo' ? badgeModoDemonstracao() : ''}
    <div class="tela tela--viewport-transparente">
      <div class="container tela-final__conteudo">
        <h1>🏆 ${TEXTOS.finalTitulo}</h1>

        <div class="viewport-3d" id="viewport-bau" style="min-height: 260px;"></div>

        ${
          props.bauAberto
            ? `
              <p class="tela-final__mensagem">${TEXTOS.mensagemFinal}</p>
              <div class="tela-final__stats">
                <div class="stat">
                  <div class="stat__valor">${props.nomeEquipe}</div>
                  <div class="stat__label">Equipe</div>
                </div>
                <div class="stat">
                  <div class="stat__valor">${props.pontuacao} / ${PONTUACAO_MAXIMA}</div>
                  <div class="stat__label">Pontuação</div>
                </div>
              </div>
            `
            : `<button type="button" class="btn btn-primario" id="btn-abrir-bau">🔓 ${TEXTOS.botaoAbrirBau}</button>`
        }

        <div class="pilha-botoes" style="margin-top: 24px;">
          <button type="button" class="btn btn-perigo" id="btn-reiniciar">🔁 ${TEXTOS.botaoReiniciar}</button>
        </div>
      </div>
    </div>
  `;

  container.querySelector('#btn-abrir-bau')?.addEventListener('click', props.onAbrirBau);

  container.querySelector('#btn-reiniciar')?.addEventListener('click', () => {
    abrirModalConfirmacao({
      titulo: TEXTOS.confirmarReinicioTitulo,
      texto: TEXTOS.confirmarReinicioTexto,
      textoConfirmar: TEXTOS.confirmarReinicioSim,
      textoCancelar: TEXTOS.confirmarReinicioNao,
      onConfirmar: props.onReiniciar
    });
  });
}
