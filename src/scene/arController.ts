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

let video: HTMLVideoElement | null = null;
let stream: MediaStream | null = null;
let controller: ControllerType | null = null;
let objetoAncorado: ObjetoArAncorado | null = null;
let marcadorDetectado = false;
let callbacksAtuais: ArCallbacks | null = null;
let sessaoAtual = 0;

export function verificarSuporteAR(): { suportado: boolean; motivo?: string } {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
    return { suportado: false, motivo: TEXTOS.arErroSemSuporte };
  }
  if (typeof window !== 'undefined' && window.isSecureContext === false) {
    return { suportado: false, motivo: 'Esta página precisa ser aberta em HTTPS para acessar a câmera.' };
  }
  return { suportado: true };
}

function mapearErroCamera(err: unknown): { tipo: ArErrorKind; mensagem: string } {
  const nome = (err as { name?: string } | undefined)?.name ?? '';
  if (nome === 'NotAllowedError' || nome === 'SecurityError') {
    return { tipo: 'permissao-negada', mensagem: TEXTOS.arErroCameraNegada };
  }
  if (nome === 'NotFoundError' || nome === 'OverconstrainedError') {
    return { tipo: 'falha-ao-iniciar', mensagem: TEXTOS.arErroCameraNaoEncontrada };
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
    zIndex: '-1'
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

  const suporte = verificarSuporteAR();
  if (!suporte.suportado) {
    callbacks.onErro('sem-suporte', suporte.motivo ?? TEXTOS.arErroSemSuporte);
    return;
  }

  let novoStream: MediaStream;
  try {
    novoStream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: { ideal: 'environment' },
        width: { ideal: 1280 },
        height: { ideal: 720 }
      },
      audio: false
    });
  } catch (err) {
    const { tipo, mensagem } = mapearErroCamera(err);
    callbacks.onErro(tipo, mensagem);
    return;
  }
  if (sessaoAtual !== minhaSessao) {
    novoStream.getTracks().forEach((t) => t.stop());
    return;
  }
  stream = novoStream;

  video = criarElementoVideo();
  video.srcObject = stream;

  await new Promise<void>((resolve) => {
    video!.onloadeddata = () => resolve();
  });
  if (sessaoAtual !== minhaSessao) return;
  await video.play();
  if (sessaoAtual !== minhaSessao) return;

  try {
    const { Controller } = await import('mind-ar/src/image-target/controller.js');
    if (sessaoAtual !== minhaSessao) return;

    controller = new Controller({
      inputWidth: video.videoWidth,
      inputHeight: video.videoHeight,
      maxTrack: 1,
      onUpdate: (data: MindArUpdateEvent) => {
        if (sessaoAtual !== minhaSessao) return;
        if (data.type !== 'updateMatrix' || data.targetIndex !== ponto.markerIndex) return;

        if (!data.worldMatrix) {
          if (marcadorDetectado) {
            objetoAncorado?.ocultar();
            callbacksAtuais?.onMarcadorPerdido();
          }
          return;
        }
        aplicarPose(data.worldMatrix);
        if (!marcadorDetectado) {
          marcadorDetectado = true;
          callbacksAtuais?.onMarcadorEncontrado();
        }
      }
    });
    controller.interestedTargetIndex = ponto.markerIndex;

    await controller.addImageTargets(CAMINHO_TARGETS);
    if (sessaoAtual !== minhaSessao) return;

    ativarCameraAR(controller.getProjectionMatrix());
    objetoAncorado = exibirObjetoAr(ponto.objetoTipo, ponto.cor);
    objetoAncorado.ocultar();

    controller.dummyRun(video);
    controller.processVideo(video);
  } catch (err) {
    console.error(err);
    callbacks.onErro('falha-ao-iniciar', TEXTOS.arErroFalhaGenerica);
  }
}

export function marcadorJaDetectado(): boolean {
  return marcadorDetectado;
}

export function encerrarSessaoAR() {
  sessaoAtual++;

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
