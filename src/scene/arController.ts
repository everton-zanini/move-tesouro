// Integração com MindAR (rastreamento de marcador de imagem) via câmera comum.
//
// DECISÃO DE AR (atualizada): a versão anterior usava WebXR + hit-test, mas em
// teste real num Android + Chrome o app corretamente reportou "AR não
// disponível" — o aparelho não tinha ARCore instalado nem disponível pra
// instalar (fora da lista de dispositivos certificados da Google); o mesmo
// aconteceu até na página oficial de exemplo do WebXR, confirmando que era
// limitação do aparelho, não bug do app. Como depender de ARCore/ARKit deixa
// de fora uma fatia relevante dos celulares dos jovens do evento, trocamos
// para **rastreamento de marcador de imagem via câmera comum (MindAR)** — não
// depende de nenhum serviço nativo de AR, então funciona tanto em Android
// quanto em iPhone, em qualquer navegador com acesso à câmera (getUserMedia).
//
// O motor 3D continua sendo só o PlayCanvas: a MindAR aqui fornece somente o
// vídeo da câmera e a pose (matriz 4x4) do marcador a cada frame processado —
// nós aplicamos essa pose diretamente numa entidade do PlayCanvas (ver
// scene/displayController.ts). Ver docs/resumo-entrega.md para os detalhes
// técnicos da ponte MindAR -> PlayCanvas.

import { Mat4, Quat } from 'playcanvas';
// Import dinâmico (não estático) de propósito: a MindAR arrasta o TensorFlow.js
// (pesado) junto — carregar isso só quando o jogador realmente entra na AR
// mantém a Home/Modo demonstração leves e ainda ganha code-splitting automático
// do Vite/Rollup no build de produção.
import type { Controller as ControllerType, MindArUpdateEvent } from 'mind-ar/src/image-target/controller.js';
import { TEXTOS, type TreasurePoint } from '../config/content';
import { ativarCameraAR, restaurarCameraPadrao } from './sceneApp';
import { exibirObjetoAr, limparExibicao, type ObjetoArAncorado } from './displayController';

export type ArErrorKind = 'sem-suporte' | 'permissao-negada' | 'falha-ao-iniciar';

export interface ArCallbacks {
  onMarcadorEncontrado: () => void;
  onMarcadorPerdido: () => void;
  onErro: (tipo: ArErrorKind, mensagem: string) => void;
}

const CAMINHO_TARGETS = '/markers/targets.mind';

// Log de diagnóstico temporário, visível na própria tela — não precisa de
// devtools/cabo USB pra ver em qual etapa a sessão de AR travou num celular
// real. Remover depois de confirmar a causa do problema em campo.
let debugEl: HTMLElement | null = null;

function debugLog(mensagem: string) {
  console.log('[AR debug]', mensagem);
  if (!debugEl) {
    debugEl = document.createElement('div');
    debugEl.id = 'ar-debug-log';
    Object.assign(debugEl.style, {
      position: 'fixed',
      left: '8px',
      right: '8px',
      top: '68px',
      zIndex: '9999',
      background: 'rgba(0,0,0,0.8)',
      color: '#5ee65e',
      fontSize: '11px',
      fontFamily: 'monospace',
      lineHeight: '1.4',
      padding: '8px 10px',
      borderRadius: '10px',
      maxHeight: '35vh',
      overflowY: 'auto',
      whiteSpace: 'pre-wrap',
      pointerEvents: 'none'
    });
    document.body.appendChild(debugEl);
  }
  const linha = document.createElement('div');
  const hora = new Date().toLocaleTimeString('pt-BR', { hour12: false });
  linha.textContent = `${hora} ${mensagem}`;
  debugEl.appendChild(linha);
  debugEl.scrollTop = debugEl.scrollHeight;
}

function removerDebugLog() {
  debugEl?.remove();
  debugEl = null;
}

let video: HTMLVideoElement | null = null;
let stream: MediaStream | null = null;
let controller: ControllerType | null = null;
let objetoAncorado: ObjetoArAncorado | null = null;
let marcadorDetectado = false;
let callbacksAtuais: ArCallbacks | null = null;
let sessaoAtual = 0;

/**
 * Rede de segurança: o loop interno de rastreamento da MindAR roda "solto"
 * (não é uma promise que a gente possa aguardar/capturar erro). Se algo
 * quebrar lá dentro (ex.: WebGL/tfjs incompatível com a GPU do aparelho), o
 * jogador ficaria travado sem nenhuma mensagem. Enquanto uma sessão de AR
 * está ativa, qualquer rejeição de promise não tratada vira uma tela de erro
 * em vez de silêncio total.
 */
function onRejeicaoNaoTratada(evento: PromiseRejectionEvent) {
  if (!callbacksAtuais) return;
  console.error('Erro não tratado durante a sessão de AR:', evento.reason);
  callbacksAtuais.onErro('falha-ao-iniciar', TEXTOS.arErroFalhaGenerica);
}

export function verificarSuporteAR(): { suportado: boolean; motivo?: string } {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
    return { suportado: false, motivo: TEXTOS.arErroSemSuporte };
  }
  if (typeof window !== 'undefined' && window.isSecureContext === false) {
    return { suportado: false, motivo: 'Esta página precisa ser aberta em HTTPS para acessar a câmera.' };
  }
  return { suportado: true };
}

/**
 * Corre uma promessa com um prazo máximo. Sem isso, se o navegador nunca
 * resolver nem rejeitar `getUserMedia` (ex.: prompt de permissão que não
 * aparece por algum motivo do sistema), o jogador ficava travado pra sempre
 * na tela de "buscando", sem nenhuma mensagem de erro.
 */
function comTimeout<T>(promessa: Promise<T>, ms: number, mensagemTimeout: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(mensagemTimeout)), ms);
    promessa.then(
      (valor) => {
        clearTimeout(timer);
        resolve(valor);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      }
    );
  });
}

function mapearErroCamera(err: unknown): { tipo: ArErrorKind; mensagem: string } {
  const nome = (err as { name?: string } | undefined)?.name ?? '';
  const mensagemErro = (err as { message?: string } | undefined)?.message ?? '';
  if (nome === 'NotAllowedError' || nome === 'SecurityError') {
    return { tipo: 'permissao-negada', mensagem: TEXTOS.arErroCameraNegada };
  }
  if (nome === 'NotFoundError' || nome === 'OverconstrainedError') {
    return { tipo: 'falha-ao-iniciar', mensagem: TEXTOS.arErroCameraNaoEncontrada };
  }
  if (mensagemErro === 'tempo-esgotado-permissao') {
    return { tipo: 'falha-ao-iniciar', mensagem: TEXTOS.arErroTimeoutPermissao };
  }
  return { tipo: 'falha-ao-iniciar', mensagem: TEXTOS.arErroFalhaGenerica };
}

function criarElementoVideo(): HTMLVideoElement {
  const el = document.createElement('video');
  el.id = 'ar-camera-video';
  el.autoplay = true;
  el.muted = true;
  el.playsInline = true;
  el.setAttribute('playsinline', 'true');
  el.setAttribute('webkit-playsinline', 'true');
  Object.assign(el.style, {
    position: 'fixed',
    inset: '0',
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    // z-index 0 (nunca negativo): um valor negativo aqui pinta atrás do
    // background opaco do <body>, ficando invisível mesmo com o vídeo
    // rodando perfeitamente — era exatamente o bug relatado ("tudo funciona,
    // mas a câmera não aparece"). Ver comentário em styles.css.
    zIndex: '0'
  });
  document.body.appendChild(el);
  return el;
}

function aplicarPose(worldMatrix: number[] | Float32Array) {
  if (!objetoAncorado) return;
  const m = new Mat4();
  m.data.set(worldMatrix);
  const posicao = m.getTranslation();
  const rotacao = new Quat().setFromMat4(m);
  objetoAncorado.mostrar();
  objetoAncorado.atualizarPose(posicao, rotacao);
}

export async function iniciarSessaoAR(ponto: TreasurePoint, callbacks: ArCallbacks): Promise<void> {
  const minhaSessao = ++sessaoAtual;
  callbacksAtuais = callbacks;
  marcadorDetectado = false;
  objetoAncorado = null;
  window.addEventListener('unhandledrejection', onRejeicaoNaoTratada);
  removerDebugLog();
  debugLog(`iniciando sessão (ponto ${ponto.markerIndex})...`);

  const suporte = verificarSuporteAR();
  if (!suporte.suportado) {
    debugLog(`sem suporte: ${suporte.motivo}`);
    callbacks.onErro('sem-suporte', suporte.motivo ?? TEXTOS.arErroSemSuporte);
    return;
  }

  debugLog('pedindo permissão de câmera...');
  let novoStream: MediaStream;
  try {
    novoStream = await comTimeout(
      navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      }),
      20000,
      'tempo-esgotado-permissao'
    );
  } catch (err) {
    debugLog(`erro ao pedir câmera: ${(err as Error)?.name ?? err}`);
    if (sessaoAtual !== minhaSessao) return;
    const { tipo, mensagem } = mapearErroCamera(err);
    callbacks.onErro(tipo, mensagem);
    return;
  }
  if (sessaoAtual !== minhaSessao) {
    novoStream.getTracks().forEach((t) => t.stop());
    return;
  }
  stream = novoStream;
  debugLog('câmera concedida, aguardando primeiro frame...');

  video = criarElementoVideo();
  video.srcObject = stream;

  try {
    await comTimeout(
      new Promise<void>((resolve) => {
        video!.onloadeddata = () => resolve();
      }),
      10000,
      'tempo-esgotado-video'
    );
  } catch (err) {
    debugLog(`erro/timeout no vídeo: ${err}`);
    console.error(err);
    if (sessaoAtual === minhaSessao) callbacks.onErro('falha-ao-iniciar', TEXTOS.arErroFalhaGenerica);
    return;
  }
  if (sessaoAtual !== minhaSessao) return;
  debugLog(`vídeo pronto (${video.videoWidth}x${video.videoHeight}), tocando...`);
  await video.play();
  if (sessaoAtual !== minhaSessao) return;

  try {
    debugLog('carregando módulo de rastreamento (MindAR)...');
    const { Controller } = await import('mind-ar/src/image-target/controller.js');
    if (sessaoAtual !== minhaSessao) return;
    debugLog('módulo carregado, criando controller...');

    let primeiroFrameLogado = false;
    controller = new Controller({
      inputWidth: video.videoWidth,
      inputHeight: video.videoHeight,
      maxTrack: 1,
      onUpdate: (data: MindArUpdateEvent) => {
        if (sessaoAtual !== minhaSessao) return;
        if (!primeiroFrameLogado && data.type === 'processDone') {
          primeiroFrameLogado = true;
          debugLog('primeiro frame de vídeo processado pelo rastreador.');
        }
        if (data.type === 'updateMatrix' && data.worldMatrix && data.targetIndex !== ponto.markerIndex) {
          debugLog(`achou o marcador ${data.targetIndex}, mas esperava o ${ponto.markerIndex} (índice não bate!).`);
        }
        if (data.type !== 'updateMatrix' || data.targetIndex !== ponto.markerIndex) return;

        if (!data.worldMatrix) {
          if (marcadorDetectado) {
            debugLog('marcador perdido.');
            objetoAncorado?.ocultar();
            callbacksAtuais?.onMarcadorPerdido();
          }
          return;
        }
        aplicarPose(data.worldMatrix);
        if (!marcadorDetectado) {
          debugLog('MARCADOR ENCONTRADO!');
          marcadorDetectado = true;
          callbacksAtuais?.onMarcadorEncontrado();
        }
      }
    });

    // Diagnóstico: o casamento/detecção do marcador roda dentro de um Web
    // Worker. Um erro lá dentro NÃO aparece no console da página principal
    // nem dispara nosso listener de 'unhandledrejection' — precisa ouvir o
    // worker diretamente.
    const workerInterno = (controller as unknown as { worker?: Worker }).worker;
    if (workerInterno) {
      workerInterno.addEventListener('error', (e: ErrorEvent) => {
        debugLog(`ERRO NO WORKER: ${e.message} (${e.filename}:${e.lineno})`);
      });
      workerInterno.addEventListener('messageerror', () => {
        debugLog('ERRO DE MENSAGEM NO WORKER (messageerror).');
      });
    } else {
      debugLog('aviso: não encontrei controller.worker pra monitorar erros.');
    }

    // Removido `controller.interestedTargetIndex = ponto.markerIndex` de propósito:
    // se o índice do marcador em content.ts não bater com a ordem real dentro
    // de targets.mind, restringir a busca a um único índice faz o
    // reconhecimento nunca funcionar, mesmo com o cartão certo bem enquadrado.
    // Deixando a MindAR procurar por qualquer um dos 3 (o filtro por
    // `ponto.markerIndex` já acontece em `onUpdate` abaixo).

    debugLog('carregando arquivo de marcadores...');
    // `addImageTargets` da MindAR usa `new Promise(async (resolve, reject) => ...)`
    // internamente — se essa função async lançar um erro (ex.: arquivo
    // corrompido/incompatível), a promessa nunca resolve nem rejeita (bug
    // conhecido desse padrão). O timeout garante que o jogador sempre veja
    // algum retorno em vez de ficar travado pra sempre depois de aceitar a
    // permissão de câmera.
    await comTimeout(controller.addImageTargets(CAMINHO_TARGETS), 15000, 'tempo-esgotado-marcadores');
    if (sessaoAtual !== minhaSessao) return;
    debugLog('marcadores carregados. iniciando câmera AR + rastreamento...');

    ativarCameraAR(controller.getProjectionMatrix());
    objetoAncorado = exibirObjetoAr(ponto.objetoTipo, ponto.cor);
    objetoAncorado.ocultar();

    controller.dummyRun(video);
    debugLog('aquecimento (dummyRun) ok. chamando processVideo...');
    controller.processVideo(video);
    debugLog('processVideo chamado — rastreamento ao vivo ativo.');

    setTimeout(() => {
      if (sessaoAtual === minhaSessao && !primeiroFrameLogado) {
        debugLog('AVISO: 8s depois de processVideo, nenhum frame foi processado ainda (worker travado?).');
      }
    }, 8000);
  } catch (err) {
    debugLog(`ERRO: ${(err as Error)?.message ?? err}`);
    console.error(err);
    if (sessaoAtual !== minhaSessao) return;
    const mensagemErro = (err as { message?: string } | undefined)?.message ?? '';
    const mensagem = mensagemErro === 'tempo-esgotado-marcadores' ? TEXTOS.arErroTimeoutMarcadores : TEXTOS.arErroFalhaGenerica;
    callbacks.onErro('falha-ao-iniciar', mensagem);
  }
}

export function marcadorJaDetectado(): boolean {
  return marcadorDetectado;
}

export function encerrarSessaoAR() {
  sessaoAtual++;
  window.removeEventListener('unhandledrejection', onRejeicaoNaoTratada);

  controller?.dispose();
  controller = null;

  stream?.getTracks().forEach((t) => t.stop());
  stream = null;

  video?.remove();
  video = null;

  marcadorDetectado = false;
  objetoAncorado = null;
  callbacksAtuais = null;

  restaurarCameraPadrao();
  limparExibicao();
}
