// Controla o que está atualmente visível no displayRoot (objeto colecionável
// ou baú) e centraliza o único loop de update de animação da cena.

import { Entity } from 'playcanvas';
import type { ObjectKind } from '../config/content';
import { attachFloatingAnimation, attachScaleIn, animateChestOpen } from './animations';
import { createChest, createTreasureObject } from './objectFactory';
import { getSceneApp, limparDisplayRoot } from './sceneApp';

type RGB = [number, number, number];
interface Handle {
  update(dt: number): void;
}

let handlesAtivos: Handle[] = [];
let loopRegistrado = false;

function garantirLoop() {
  if (loopRegistrado) return;
  loopRegistrado = true;
  getSceneApp().app.on('update', (dt: number) => {
    handlesAtivos.forEach((h) => h.update(dt));
  });
}

export function limparExibicao() {
  garantirLoop();
  limparDisplayRoot();
  handlesAtivos = [];
}

/** Mostra o objeto colecionável flutuando em uma posição relativa à câmera de exibição (modo demo). */
export function exibirObjetoDemo(tipo: ObjectKind, cor: RGB): Entity {
  limparExibicao();
  const { displayRoot } = getSceneApp();
  const objeto = createTreasureObject(tipo, cor);
  displayRoot.addChild(objeto);
  handlesAtivos = [attachFloatingAnimation(objeto, 0.6)];
  return objeto;
}

export interface ObjetoArAncorado {
  /** Atualiza a pose (posição/rotação em relação à câmera) a cada frame rastreado. */
  atualizarPose(posicao: { x: number; y: number; z: number }, rotacao: { x: number; y: number; z: number; w: number }): void;
  /** Oculta sem destruir (marcador momentaneamente perdido). */
  ocultar(): void;
  /** Reexibe na última pose conhecida (marcador reencontrado). */
  mostrar(): void;
}

/**
 * Mostra o objeto colecionável ancorado a um marcador (modo AR). A pose é
 * aplicada numa entidade "âncora" separada da entidade visual — assim a
 * animação de flutuação (local, no filho) não briga com a pose ao vivo do
 * rastreamento (na âncora).
 */
export function exibirObjetoAr(tipo: ObjectKind, cor: RGB): ObjetoArAncorado {
  limparExibicao();
  const { displayRoot } = getSceneApp();

  const ancora = new Entity('ancora-marcador');
  displayRoot.addChild(ancora);

  const objeto = createTreasureObject(tipo, cor);
  ancora.addChild(objeto);
  handlesAtivos = [attachFloatingAnimation(objeto, 0.28)];

  return {
    atualizarPose(posicao, rotacao) {
      ancora.setPosition(posicao.x, posicao.y, posicao.z);
      ancora.setRotation(rotacao.x, rotacao.y, rotacao.z, rotacao.w);
    },
    ocultar() {
      ancora.enabled = false;
    },
    mostrar() {
      ancora.enabled = true;
    }
  };
}

export interface BauExibido {
  abrir(): void;
}

export function exibirBauFechado(): BauExibido {
  limparExibicao();
  const { displayRoot } = getSceneApp();
  const { root, lidPivot } = createChest();
  displayRoot.addChild(root);
  root.setPosition(0, 0, 0);
  root.setEulerAngles(0, 35, 0);
  const scaleIn = attachScaleIn(root, 0.65);
  handlesAtivos = [scaleIn];

  return {
    abrir() {
      handlesAtivos.push(animateChestOpen(lidPivot));
    }
  };
}
