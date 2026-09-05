// Controla o que está atualmente visível no displayRoot (objeto colecionável
// ou baú) e centraliza o único loop de update de animação da cena.

import type { Entity } from 'playcanvas';
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

/** Mostra o objeto colecionável ancorado numa pose do mundo real (modo AR). */
export function exibirObjetoAr(
  tipo: ObjectKind,
  cor: RGB,
  posicao: { x: number; y: number; z: number },
  rotacao: { x: number; y: number; z: number; w: number }
): Entity {
  limparExibicao();
  const { displayRoot } = getSceneApp();
  const objeto = createTreasureObject(tipo, cor);
  displayRoot.addChild(objeto);
  objeto.setPosition(posicao.x, posicao.y, posicao.z);
  objeto.setRotation(rotacao.x, rotacao.y, rotacao.z, rotacao.w);
  handlesAtivos = [attachFloatingAnimation(objeto, 0.28)];
  return objeto;
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
