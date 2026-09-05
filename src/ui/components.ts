// Componentes de UI pequenos e reaproveitáveis: toast de aviso/erro e modal de confirmação.

export function mostrarToast(mensagem: string, duracaoMs = 3200) {
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = mensagem;
  document.body.appendChild(el);
  window.setTimeout(() => el.remove(), duracaoMs);
}

export interface ConfirmacaoOpcoes {
  titulo: string;
  texto: string;
  textoConfirmar: string;
  textoCancelar: string;
  onConfirmar: () => void;
}

export function abrirModalConfirmacao(opcoes: ConfirmacaoOpcoes) {
  const fundo = document.createElement('div');
  fundo.className = 'modal-fundo';
  fundo.innerHTML = `
    <div class="card modal-caixa">
      <h2>${opcoes.titulo}</h2>
      <p>${opcoes.texto}</p>
      <div class="pilha-botoes">
        <button type="button" class="btn btn-perigo" data-acao="confirmar">${opcoes.textoConfirmar}</button>
        <button type="button" class="btn btn-secundario" data-acao="cancelar">${opcoes.textoCancelar}</button>
      </div>
    </div>
  `;
  document.body.appendChild(fundo);

  fundo.addEventListener('click', (ev) => {
    if (ev.target === fundo) fundo.remove();
  });
  fundo.querySelector('[data-acao="cancelar"]')?.addEventListener('click', () => fundo.remove());
  fundo.querySelector('[data-acao="confirmar"]')?.addEventListener('click', () => {
    fundo.remove();
    opcoes.onConfirmar();
  });
}

export function badgeModoDemonstracao(): string {
  return `<div class="badge-demo">MODO DEMONSTRAÇÃO</div>`;
}
