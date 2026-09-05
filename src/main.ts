import { PONTOS } from './config/content';
import {
  coletarPonto,
  continuarPartida,
  getIndiceAtual,
  getPontoAtual,
  getState,
  iniciarPartida,
  reiniciar,
  temPartidaSalva,
  type Modo
} from './state/gameState';
import { getSceneApp } from './scene/sceneApp';
import { exibirObjetoAr, exibirObjetoDemo, exibirBauFechado, limparExibicao, type BauExibido } from './scene/displayController';
import {
  encerrarSessaoAR,
  getUltimaPose,
  iniciarSessaoAR,
  ocultarReticulo,
  superficieDetectada
} from './scene/arController';
import { renderHomeScreen } from './ui/homeScreen';
import { renderHuntScreen } from './ui/huntScreen';
import { montarArOverlay, type ArOverlayHandle } from './ui/arOverlay';
import { renderFinalScreen } from './ui/finalScreen';
import { abrirModalInventario } from './ui/inventory';
import { mostrarToast } from './ui/components';

type Tela = 'home' | 'hunt' | 'ar' | 'final';

let telaAtual: Tela = 'home';
let descobertoNoPontoAtual = false;
let bauAberto = false;
let bauControlador: BauExibido | null = null;
let arOverlayHandle: ArOverlayHandle | null = null;

const uiRoot = document.getElementById('ui-root') as HTMLElement;

function irParaTelaDeAcordoComEstado() {
  descobertoNoPontoAtual = false;
  bauAberto = false;
  bauControlador = null;
  telaAtual = getState().concluido ? 'final' : 'hunt';
}

function render() {
  const estado = getState();
  if (estado.concluido && telaAtual === 'hunt') telaAtual = 'final';

  if (telaAtual !== 'ar') arOverlayHandle = null;

  switch (telaAtual) {
    case 'home': {
      limparExibicao();
      renderHomeScreen(uiRoot, {
        nomeSalvo: estado.nomeEquipe,
        temPartidaSalva: temPartidaSalva(),
        onIniciar: (nomeEquipe: string, modo: Modo) => {
          iniciarPartida(nomeEquipe, modo);
          irParaTelaDeAcordoComEstado();
          render();
        },
        onContinuar: () => {
          continuarPartida();
          irParaTelaDeAcordoComEstado();
          render();
        }
      });
      break;
    }

    case 'hunt': {
      const indice = getIndiceAtual();
      renderHuntScreen(uiRoot, {
        modo: estado.modo,
        indiceAtual: indice,
        totalColetados: estado.coletados.length,
        descobertoNoPontoAtual,
        onProcurar: () => {
          if (estado.modo === 'ar') {
            telaAtual = 'ar';
            render();
          } else {
            descobertoNoPontoAtual = true;
            render();
          }
        },
        onColetar: onColetarObjetoAtual,
        onAbrirInventario: () => {
          abrirModalInventario({
            coletados: estado.coletados,
            pontuacao: estado.pontuacao,
            onFechar: () => {}
          });
        }
      });

      const ponto = getPontoAtual();
      if (descobertoNoPontoAtual && ponto) {
        exibirObjetoDemo(ponto.objetoTipo, ponto.cor);
      } else {
        limparExibicao();
      }
      break;
    }

    case 'ar': {
      iniciarTelaAr();
      break;
    }

    case 'final': {
      renderFinalScreen(uiRoot, {
        modo: estado.modo,
        nomeEquipe: estado.nomeEquipe,
        pontuacao: estado.pontuacao,
        bauAberto,
        onAbrirBau: () => {
          if (bauAberto) return;
          bauAberto = true;
          bauControlador?.abrir();
          render();
        },
        onReiniciar: () => {
          reiniciar();
          telaAtual = 'home';
          bauControlador = null;
          bauAberto = false;
          render();
        }
      });
      if (!bauControlador) {
        bauControlador = exibirBauFechado();
      }
      break;
    }
  }
}

function onColetarObjetoAtual() {
  const ponto = getPontoAtual();
  if (!ponto) return;
  const sucesso = coletarPonto(ponto.id);
  if (sucesso) {
    mostrarToast(`+100 pts — ${ponto.objetoNome} coletado!`);
  }
  descobertoNoPontoAtual = false;
  render();
}

function iniciarTelaAr() {
  arOverlayHandle = montarArOverlay(uiRoot, {
    onTocarParaPosicionar: () => {
      if (!superficieDetectada()) return;
      const pose = getUltimaPose();
      const ponto = getPontoAtual();
      if (!pose || !ponto) return;
      exibirObjetoAr(ponto.objetoTipo, ponto.cor, pose.posicao, pose.rotacao);
      ocultarReticulo();
      arOverlayHandle?.mostrarBotaoColetar(true);
    },
    onColetar: () => {
      const ponto = getPontoAtual();
      if (ponto) {
        const sucesso = coletarPonto(ponto.id);
        if (sucesso) mostrarToast(`+100 pts — ${ponto.objetoNome} coletado!`);
      }
      encerrarSessaoAR();
      descobertoNoPontoAtual = false;
      telaAtual = getState().concluido ? 'final' : 'hunt';
      render();
    },
    onSair: () => {
      encerrarSessaoAR();
      telaAtual = 'hunt';
      render();
    },
    onUsarDemo: () => {
      encerrarSessaoAR();
      // Fallback do modo demonstração: simula a descoberta deste ponto na hora.
      descobertoNoPontoAtual = true;
      telaAtual = 'hunt';
      render();
    }
  });

  iniciarSessaoAR(arOverlayHandle.elementoDomOverlay, {
    onSurfaceEncontrada: () => {
      arOverlayHandle?.mostrarInstrucao('Toque na tela para posicionar o tesouro aqui.');
    },
    onErro: (_tipo, mensagem) => {
      arOverlayHandle?.mostrarErro(mensagem);
    },
    onSessaoEncerrada: () => {
      if (telaAtual === 'ar') {
        telaAtual = 'hunt';
        render();
      }
    }
  });
}

// Sanidade do conteúdo: garante que o config tem exatamente 3 pontos (regra do MVP).
if (PONTOS.length !== 3) {
  console.warn('config/content.ts deveria definir exatamente 3 pontos de tesouro.');
}

getSceneApp();
render();
