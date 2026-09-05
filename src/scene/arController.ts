// Integração com WebXR (Realidade Aumentada) do PlayCanvas.
//
// DECISÃO DE AR: usamos WebXR com "hit-test" (posicionamento do objeto sobre uma
// superfície real detectada pela câmera), e não rastreamento de marcador/imagem.
// A documentação do PlayCanvas classifica o Image Tracking como um módulo WebXR
// menos consistente entre navegadores (suporte incubatório), enquanto o Hit
// Testing é o caminho estável e documentado para ancorar conteúdo ao ambiente
// real. Como não há marcador impresso, a identificação de "em qual ponto físico
// eu estou" é feita pelo próprio jogador (ele toca em "Procurar tesouro" já
// estando no local) — não há GPS nem validação automática do ambiente.
//
// Dispositivo/navegador alvo testado como referência: Android + Google Chrome
// atualizado (mecanismo ARCore). iOS Safari não implementa `immersive-ar` hoje;
// nesses aparelhos a experiência recomendada é o Modo demonstração.

import { Color, Entity, StandardMaterial, XRSPACE_LOCALFLOOR, XRSPACE_VIEWER, XRTYPE_AR } from 'playcanvas';
import type { XrHitTestSource } from 'playcanvas';
import { getSceneApp } from './sceneApp';

/** app.xr existe assim que a Application é criada (só fica indisponível em builds sem o módulo XR). */
function getXr() {
  const xr = getSceneApp().app.xr;
  if (!xr) throw new Error('Módulo XR indisponível nesta build do PlayCanvas.');
  return xr;
}

export type ArErrorKind = 'sem-suporte' | 'permissao-negada' | 'falha-ao-iniciar';

export interface ArCallbacks {
  onSurfaceEncontrada: () => void;
  onErro: (tipo: ArErrorKind, mensagem: string) => void;
  onSessaoEncerrada: () => void;
}

interface UltimaPose {
  posicao: { x: number; y: number; z: number };
  rotacao: { x: number; y: number; z: number; w: number };
}

let reticulo: Entity | null = null;
let hitTestSource: XrHitTestSource | null = null;
let superficieEncontrada = false;
let ultimaPose: UltimaPose | null = null;
let callbacksAtuais: ArCallbacks | null = null;
let corDeFundoOriginal: Color | null = null;
let eventosGlobaisRegistrados = false;

function mapearMensagemErro(err: unknown): string {
  const nome = (err as { name?: string } | undefined)?.name ?? '';
  if (nome === 'NotAllowedError') {
    return 'A câmera foi bloqueada. Permita o acesso à câmera nas configurações do navegador e tente novamente.';
  }
  return 'Não foi possível iniciar a experiência de AR agora.';
}

function registrarEventosGlobais() {
  if (eventosGlobaisRegistrados) return;
  eventosGlobaisRegistrados = true;
  const { camera } = getSceneApp();
  const xr = getXr();

  xr.on('start', () => {
    corDeFundoOriginal = camera.camera!.clearColor.clone();
    // AR exige fundo transparente para a câmera do dispositivo aparecer atrás dos objetos.
    camera.camera!.clearColor = new Color(0, 0, 0, 0);
    iniciarHitTest();
  });

  xr.on('end', () => {
    if (corDeFundoOriginal) camera.camera!.clearColor = corDeFundoOriginal;
    limparReticulo();
    superficieEncontrada = false;
    ultimaPose = null;
    hitTestSource?.remove();
    hitTestSource = null;
    callbacksAtuais?.onSessaoEncerrada();
  });

  xr.on('error', (err: Error) => {
    callbacksAtuais?.onErro('falha-ao-iniciar', mapearMensagemErro(err));
  });
}

export function verificarSuporteAR(): { suportado: boolean; motivo?: string } {
  if (typeof navigator === 'undefined' || !('xr' in navigator)) {
    return { suportado: false, motivo: 'Este navegador não tem a API WebXR.' };
  }
  const xr = getSceneApp().app.xr;
  if (!xr || !xr.supported) {
    return { suportado: false, motivo: 'WebXR não é suportado neste navegador.' };
  }
  if (!xr.isAvailable(XRTYPE_AR)) {
    return { suportado: false, motivo: 'Realidade Aumentada não está disponível neste dispositivo.' };
  }
  return { suportado: true };
}

function criarReticuloVisual(): Entity {
  const material = new StandardMaterial();
  material.diffuse = new Color(0.95, 0.78, 0.28);
  material.emissive = new Color(0.95, 0.78, 0.28);
  material.emissiveIntensity = 0.8;
  material.update();

  const entity = new Entity('reticulo');
  entity.addComponent('render', { type: 'cylinder', material });
  entity.setLocalScale(0.3, 0.01, 0.3);
  entity.enabled = false;
  return entity;
}

function limparReticulo() {
  reticulo?.destroy();
  reticulo = null;
}

function iniciarHitTest() {
  const { displayRoot } = getSceneApp();
  const xr = getXr();

  if (!xr.hitTest || !xr.hitTest.supported) {
    callbacksAtuais?.onErro('falha-ao-iniciar', 'Detecção de superfícies (hit-test) não é suportada neste dispositivo.');
    return;
  }

  limparReticulo();
  reticulo = criarReticuloVisual();
  displayRoot.addChild(reticulo);

  xr.hitTest.start({
    spaceType: XRSPACE_VIEWER,
    callback: (err: Error | null, source: XrHitTestSource | null) => {
      if (err || !source) {
        callbacksAtuais?.onErro('falha-ao-iniciar', 'Não foi possível detectar superfícies no ambiente.');
        return;
      }
      hitTestSource = source;
      source.on(
        'result',
        (position: { x: number; y: number; z: number }, rotation: { x: number; y: number; z: number; w: number }) => {
          ultimaPose = { posicao: { ...position }, rotacao: { ...rotation } };
          if (reticulo) {
            reticulo.enabled = true;
            reticulo.setPosition(position.x, position.y, position.z);
            reticulo.setRotation(rotation.x, rotation.y, rotation.z, rotation.w);
          }
          if (!superficieEncontrada) {
            superficieEncontrada = true;
            callbacksAtuais?.onSurfaceEncontrada();
          }
        }
      );
    }
  });
}

export function iniciarSessaoAR(overlayDom: HTMLElement, callbacks: ArCallbacks) {
  registrarEventosGlobais();
  callbacksAtuais = callbacks;
  superficieEncontrada = false;
  ultimaPose = null;

  const suporte = verificarSuporteAR();
  if (!suporte.suportado) {
    callbacks.onErro('sem-suporte', suporte.motivo ?? 'AR indisponível neste dispositivo.');
    return;
  }

  const { camera } = getSceneApp();
  const xr = getXr();

  try {
    // O DOM Overlay precisa ser configurado antes de start(); veja XrDomOverlay.
    if (xr.domOverlay?.supported) {
      xr.domOverlay.root = overlayDom;
    }
    xr.start(camera.camera!, XRTYPE_AR, XRSPACE_LOCALFLOOR, {
      callback: (err: Error | null) => {
        if (err) {
          callbacks.onErro('falha-ao-iniciar', mapearMensagemErro(err));
        }
      }
    });
  } catch (err) {
    callbacks.onErro('falha-ao-iniciar', mapearMensagemErro(err));
  }
}

export function superficieDetectada(): boolean {
  return superficieEncontrada;
}

export function getUltimaPose(): UltimaPose | null {
  return ultimaPose;
}

export function ocultarReticulo() {
  if (reticulo) reticulo.enabled = false;
}

export function encerrarSessaoAR() {
  const xr = getSceneApp().app.xr;
  if (xr?.active) {
    xr.end();
  }
}
