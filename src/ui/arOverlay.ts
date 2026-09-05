import { TEXTOS } from '../config/content';

export interface ArOverlayCallbacks {
  onColetar: () => void;
  onSair: () => void;
  onUsarDemo: () => void;
}

export interface ArOverlayHandle {
  elementoRaiz: HTMLElement;
  mostrarInstrucao: (texto: string) => void;
  mostrarBotaoColetar: (mostrar: boolean) => void;
  mostrarErro: (mensagem: string) => void;
}

export function montarArOverlay(
  container: HTMLElement,
  numeroPonto: number,
  callbacks: ArOverlayCallbacks
): ArOverlayHandle {
  container.innerHTML = `
    <div class="tela tela--viewport-transparente" id="ar-tela-raiz">
      <div class="ar-overlay">
        <div class="ar-overlay__topo">
          <button type="button" class="btn btn-secundario" id="btn-sair-ar" style="width:auto;padding:10px 18px;">
            ✕ ${TEXTOS.arBotaoSair}
          </button>
        </div>
        <div class="ar-overlay__instrucao" id="ar-instrucao">${TEXTOS.arInstrucaoBuscando(numeroPonto)}</div>
        <div class="ar-overlay__area-toque"></div>
        <div class="ar-overlay__base">
          <button type="button" class="btn btn-primario" id="btn-coletar-ar" hidden>✨ ${TEXTOS.botaoColetar}</button>
        </div>
      </div>
      <div class="ar-erro" id="ar-erro" hidden></div>
    </div>
  `;

  const raiz = container.querySelector<HTMLElement>('#ar-tela-raiz')!;
  const instrucao = container.querySelector<HTMLElement>('#ar-instrucao')!;
  const btnColetar = container.querySelector<HTMLButtonElement>('#btn-coletar-ar')!;
  const btnSair = container.querySelector<HTMLButtonElement>('#btn-sair-ar')!;
  const painelErro = container.querySelector<HTMLElement>('#ar-erro')!;

  btnColetar.addEventListener('click', () => callbacks.onColetar());
  btnSair.addEventListener('click', () => callbacks.onSair());

  return {
    elementoRaiz: raiz,
    mostrarInstrucao(texto: string) {
      instrucao.textContent = texto;
      instrucao.hidden = false;
    },
    mostrarBotaoColetar(mostrar: boolean) {
      btnColetar.hidden = !mostrar;
    },
    mostrarErro(mensagem: string) {
      instrucao.hidden = true;
      btnColetar.hidden = true;
      painelErro.hidden = false;
      painelErro.innerHTML = `
        <div class="card">
          <div class="ar-erro__icone">📵</div>
          <h2>Ops!</h2>
          <p>${mensagem}</p>
          <p>${TEXTOS.arSugestaoDemo}</p>
          <div class="pilha-botoes">
            <button type="button" class="btn btn-roxo" id="btn-erro-usar-demo">🖥️ ${TEXTOS.botaoDemo}</button>
            <button type="button" class="btn btn-secundario" id="btn-erro-sair">Voltar</button>
          </div>
        </div>
      `;
      painelErro.querySelector('#btn-erro-usar-demo')?.addEventListener('click', () => callbacks.onUsarDemo());
      painelErro.querySelector('#btn-erro-sair')?.addEventListener('click', () => callbacks.onSair());
    }
  };
}
