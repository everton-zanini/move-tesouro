import { PONTOS, TEXTOS } from '../config/content';

const EMOJI_POR_TIPO: Record<string, string> = {
  cristal: '💎',
  estrela: '⭐',
  chave: '🗝️'
};

export interface InventoryModalProps {
  coletados: string[];
  pontuacao: number;
  onFechar: () => void;
}

export function abrirModalInventario(props: InventoryModalProps) {
  const fundo = document.createElement('div');
  fundo.className = 'modal-fundo';
  fundo.innerHTML = `
    <div class="card modal-caixa">
      <h2>🎒 ${TEXTOS.inventarioTitulo}</h2>
      <div class="pontuacao-total">${TEXTOS.inventarioPontuacao(props.pontuacao)}</div>
      <div class="inventario-lista">
        ${PONTOS.map((ponto) => {
          const coletado = props.coletados.includes(ponto.id);
          return `
            <div class="inventario-linha ${coletado ? 'inventario-linha--coletado' : ''}">
              <div class="inventario-linha__icone">${coletado ? EMOJI_POR_TIPO[ponto.objetoTipo] : '❔'}</div>
              <div class="inventario-linha__texto">
                <div class="inventario-linha__nome">${ponto.objetoNome}</div>
                <div class="inventario-linha__status">${coletado ? TEXTOS.inventarioColetado : TEXTOS.inventarioPendente}</div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
      <button type="button" class="btn btn-secundario" id="btn-fechar-inventario">Fechar</button>
    </div>
  `;
  document.body.appendChild(fundo);

  const fechar = () => {
    fundo.remove();
    props.onFechar();
  };

  fundo.addEventListener('click', (ev) => {
    if (ev.target === fundo) fechar();
  });
  fundo.querySelector('#btn-fechar-inventario')?.addEventListener('click', fechar);
}
