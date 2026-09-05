// Aplicação PlayCanvas única, reaproveitada pelo viewport de demonstração,
// pela sessão de AR e pela cena final do baú. A câmera sempre ocupa a tela
// inteira; as telas que só querem "espiar" o 3D atrás da UI (hunt/final) usam
// fundo transparente e cards translúcidos por cima (ver styles.css).

import { Application, Color, Entity, FILLMODE_NONE, RESOLUTION_AUTO } from 'playcanvas';
import type { Mat4 } from 'playcanvas';

const COR_FUNDO_PADRAO = new Color(0x15 / 255, 0x12 / 255, 0x33 / 255);
const CAMERA_POS_PADRAO: [number, number, number] = [0, 0.55, 2.6];
const CAMERA_LOOKAT_PADRAO: [number, number, number] = [0, 0.15, 0];

export interface SceneApp {
  app: Application;
  camera: Entity;
  /** Entidade "porta-objetos": tudo que é exibido (item coletável ou baú) é filho dela. */
  displayRoot: Entity;
}

let instancia: SceneApp | null = null;

export function getSceneApp(): SceneApp {
  if (instancia) return instancia;

  const canvas = document.getElementById('app-canvas') as HTMLCanvasElement;
  // alpha:true é essencial pro modo AR — sem isso o contexto WebGL é criado
  // opaco e o clearColor com alpha=0 (usado pra revelar o vídeo da câmera
  // atrás do canvas) é simplesmente ignorado pelo navegador, aparecendo
  // preto sólido mesmo com a câmera funcionando perfeitamente por baixo.
  const app = new Application(canvas, { graphicsDeviceOptions: { alpha: true } });

  app.setCanvasFillMode(FILLMODE_NONE);
  app.setCanvasResolution(RESOLUTION_AUTO);

  const camera = new Entity('camera');
  camera.addComponent('camera', {
    clearColor: COR_FUNDO_PADRAO,
    fov: 45
  });
  camera.setPosition(...CAMERA_POS_PADRAO);
  camera.lookAt(...CAMERA_LOOKAT_PADRAO);
  app.root.addChild(camera);

  const luzPrincipal = new Entity('luz-principal');
  luzPrincipal.addComponent('light', {
    type: 'directional',
    color: new Color(1, 0.97, 0.9),
    intensity: 1.4
  });
  luzPrincipal.setEulerAngles(55, 30, 0);
  app.root.addChild(luzPrincipal);

  const luzPreenchimento = new Entity('luz-preenchimento');
  luzPreenchimento.addComponent('light', {
    type: 'directional',
    color: new Color(0.55, 0.6, 1),
    intensity: 0.6
  });
  luzPreenchimento.setEulerAngles(-40, -60, 0);
  app.root.addChild(luzPreenchimento);

  const displayRoot = new Entity('display-root');
  app.root.addChild(displayRoot);

  app.start();

  instancia = { app, camera, displayRoot };

  const resize = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    app.resizeCanvas(window.innerWidth, window.innerHeight);
  };
  window.addEventListener('resize', resize);
  resize();

  return instancia;
}

/** Remove todos os filhos do porta-objetos (troca de item exibido). */
export function limparDisplayRoot() {
  const { displayRoot } = getSceneApp();
  displayRoot.children.slice().forEach((child) => child.destroy());
}

/**
 * Prepara a câmera única para a sessão de AR: posição na origem (a pose do
 * marcador já vem em espaço de câmera), fundo transparente (pro vídeo da
 * câmera aparecer atrás) e a matriz de projeção exata calculada pela MindAR
 * (garante que o objeto 3D se alinhe com o que a câmera realmente vê).
 */
export function ativarCameraAR(matrizProjecao: Float32Array | number[]) {
  const { camera } = getSceneApp();
  camera.setPosition(0, 0, 0);
  camera.setEulerAngles(0, 0, 0);
  camera.camera!.clearColor = new Color(0, 0, 0, 0);
  camera.camera!.calculateProjection = (transformMatrix: Mat4) => {
    transformMatrix.data.set(matrizProjecao);
  };
}

/** Desfaz `ativarCameraAR`, devolvendo a câmera ao enquadramento padrão. */
export function restaurarCameraPadrao() {
  const { camera } = getSceneApp();
  (camera.camera as unknown as { calculateProjection: unknown }).calculateProjection = null;
  camera.camera!.clearColor = COR_FUNDO_PADRAO;
  camera.setPosition(...CAMERA_POS_PADRAO);
  camera.lookAt(...CAMERA_LOOKAT_PADRAO);
}
