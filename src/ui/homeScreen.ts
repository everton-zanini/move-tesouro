import { TEXTOS } from '../config/content';
import type { Modo } from '../state/gameState';

export interface HomeScreenProps {
  nomeSalvo: string;
  temPartidaSalva: boolean;
  onIniciar: (nomeEquipe: string, modo: Modo) => void;
  onContinuar: () => void;
}

export function renderHomeScreen(container: HTMLElement, props: HomeScreenProps) {
  container.innerHTML = `
    <div class="tela tela--home">
      <div class="container">
        <div class="tela-home__topo">
          <div class="tela-home__logo">🗺️</div>
          <h1>${TEXTOS.tituloJogo}</h1>
          <p>${TEXTOS.slogan}</p>
        </div>

        <div class="card">
          <div class="campo">
            <label for="input-nome-equipe">${TEXTOS.labelNomeEquipe}</label>
            <input
              id="input-nome-equipe"
              type="text"
              maxlength="40"
              placeholder="${TEXTOS.placeholderNomeEquipe}"
              value="${props.nomeSalvo.replace(/"/g, '&quot;')}"
              autocomplete="off"
            />
            <div class="erro-campo" id="erro-nome-equipe"></div>
          </div>

          <div class="pilha-botoes">
            <button type="button" class="btn btn-primario" id="btn-comecar">🧭 ${TEXTOS.botaoComecar}</button>
            <button type="button" class="btn btn-roxo" id="btn-demo">🖥️ ${TEXTOS.botaoDemo}</button>
            ${
              props.temPartidaSalva
                ? `<button type="button" class="btn btn-secundario" id="btn-continuar">▶️ ${TEXTOS.botaoContinuar}</button>`
                : ''
            }
          </div>
        </div>
      </div>
    </div>
  `;

  const input = container.querySelector<HTMLInputElement>('#input-nome-equipe')!;
  const erro = container.querySelector<HTMLElement>('#erro-nome-equipe')!;

  function validarNome(): string | null {
    const nome = input.value.trim();
    if (!nome) {
      erro.textContent = TEXTOS.avisoNomeEquipe;
      input.focus();
      return null;
    }
    erro.textContent = '';
    return nome;
  }

  container.querySelector('#btn-comecar')!.addEventListener('click', () => {
    const nome = validarNome();
    if (nome) props.onIniciar(nome, 'ar');
  });

  container.querySelector('#btn-demo')!.addEventListener('click', () => {
    const nome = validarNome();
    if (nome) props.onIniciar(nome, 'demo');
  });

  container.querySelector('#btn-continuar')?.addEventListener('click', () => {
    props.onContinuar();
  });
}
