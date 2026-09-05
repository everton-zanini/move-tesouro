// Fábrica de objetos 3D construídos só com primitivas do PlayCanvas
// (box/cone/cylinder) + StandardMaterial. Sem modelos externos.

import { BLEND_NORMAL, Color, Entity, StandardMaterial } from 'playcanvas';
import type { ObjectKind } from '../config/content';

type RGB = [number, number, number];

interface MaterialOptions {
  emissive?: RGB;
  emissiveIntensity?: number;
  metalness?: number;
  /** Glossiness de 0 (fosco) a 1 (bem brilhante/espelhado). */
  gloss?: number;
  opacity?: number;
}

function makeMaterial(diffuse: RGB, opts: MaterialOptions = {}): StandardMaterial {
  const mat = new StandardMaterial();
  mat.diffuse = new Color(diffuse[0], diffuse[1], diffuse[2]);
  const emissive = opts.emissive ?? diffuse;
  mat.emissive = new Color(emissive[0], emissive[1], emissive[2]);
  mat.emissiveIntensity = opts.emissiveIntensity ?? 0.35;
  mat.useMetalness = true;
  mat.metalness = opts.metalness ?? 0.4;
  mat.gloss = opts.gloss ?? 0.65;
  if (opts.opacity !== undefined) {
    mat.opacity = opts.opacity;
    mat.blendType = BLEND_NORMAL;
  }
  mat.update();
  return mat;
}

/** Duas pontas (cones) unidas pela base, formando uma "espiga"/bipirâmide. */
function createBipyramid(material: StandardMaterial, length: number, thickness: number): Entity {
  const root = new Entity('bipiramide');

  const top = new Entity('ponta-superior');
  top.addComponent('render', { type: 'cone', material });
  top.setLocalScale(thickness, length / 2, thickness);
  top.setLocalPosition(0, length / 4, 0);
  root.addChild(top);

  const bottom = new Entity('ponta-inferior');
  bottom.addComponent('render', { type: 'cone', material });
  bottom.setLocalScale(thickness, length / 2, thickness);
  bottom.setLocalEulerAngles(180, 0, 0);
  bottom.setLocalPosition(0, -length / 4, 0);
  root.addChild(bottom);

  return root;
}

function createCristal(cor: RGB): Entity {
  const material = makeMaterial(cor, {
    emissiveIntensity: 0.55,
    metalness: 0.2,
    gloss: 0.88,
    opacity: 0.88
  });
  const gema = createBipyramid(material, 1, 0.55);
  gema.name = 'cristal';
  return gema;
}

function createEstrela(cor: RGB): Entity {
  const material = makeMaterial(cor, { emissiveIntensity: 0.7, metalness: 0.75, gloss: 0.75 });
  const root = new Entity('estrela');

  const bracoX = createBipyramid(material, 1.5, 0.22);
  bracoX.setLocalEulerAngles(0, 0, 90);
  root.addChild(bracoX);

  const bracoZ = createBipyramid(material, 1.5, 0.22);
  bracoZ.setLocalEulerAngles(90, 0, 0);
  root.addChild(bracoZ);

  const nucleo = new Entity('nucleo');
  nucleo.addComponent('render', { type: 'sphere', material });
  nucleo.setLocalScale(0.32, 0.32, 0.32);
  root.addChild(nucleo);

  return root;
}

function createChave(cor: RGB): Entity {
  const material = makeMaterial(cor, { emissiveIntensity: 0.3, metalness: 0.6, gloss: 0.7 });
  const root = new Entity('chave');

  const haste = new Entity('haste');
  haste.addComponent('render', { type: 'cylinder', material });
  haste.setLocalScale(0.12, 0.7, 0.12);
  root.addChild(haste);

  const raioAnel = 0.26;
  const segmentos = 10;
  for (let i = 0; i < segmentos; i++) {
    const angulo = (i / segmentos) * Math.PI * 2;
    const segmento = new Entity(`argola-${i}`);
    segmento.addComponent('render', { type: 'box', material });
    segmento.setLocalScale(0.11, 0.11, 0.06);
    segmento.setLocalPosition(Math.cos(angulo) * raioAnel, 0.56 + Math.sin(angulo) * raioAnel, 0);
    segmento.setLocalEulerAngles(0, 0, (angulo * 180) / Math.PI + 90);
    root.addChild(segmento);
  }

  const dente1 = new Entity('dente-1');
  dente1.addComponent('render', { type: 'box', material });
  dente1.setLocalScale(0.2, 0.08, 0.08);
  dente1.setLocalPosition(0.14, -0.4, 0);
  root.addChild(dente1);

  const dente2 = new Entity('dente-2');
  dente2.addComponent('render', { type: 'box', material });
  dente2.setLocalScale(0.15, 0.08, 0.08);
  dente2.setLocalPosition(0.1, -0.53, 0);
  root.addChild(dente2);

  return root;
}

/** Cria a exibição 3D de um objeto colecionável a partir do tipo definido em config/content.ts. */
export function createTreasureObject(kind: ObjectKind, cor: RGB): Entity {
  switch (kind) {
    case 'cristal':
      return createCristal(cor);
    case 'estrela':
      return createEstrela(cor);
    case 'chave':
      return createChave(cor);
  }
}

export interface ChestEntities {
  root: Entity;
  lidPivot: Entity;
}

/** Baú com base fixa e tampa articulada (lidPivot) para a animação de abertura. */
export function createChest(): ChestEntities {
  const madeira = makeMaterial([0.4, 0.24, 0.13], { metalness: 0.05, gloss: 0.15, emissiveIntensity: 0 });
  const dourado = makeMaterial([0.95, 0.78, 0.28], {
    emissive: [0.95, 0.78, 0.28],
    emissiveIntensity: 0.25,
    metalness: 0.85,
    gloss: 0.8
  });

  const root = new Entity('bau');

  const base = new Entity('base');
  base.addComponent('render', { type: 'box', material: madeira });
  base.setLocalScale(1.1, 0.55, 0.7);
  base.setLocalPosition(0, -0.15, 0);
  root.addChild(base);

  const frisoBase = new Entity('friso-base');
  frisoBase.addComponent('render', { type: 'box', material: dourado });
  frisoBase.setLocalScale(1.14, 0.09, 0.74);
  frisoBase.setLocalPosition(0, -0.32, 0);
  root.addChild(frisoBase);

  const fechadura = new Entity('fechadura');
  fechadura.addComponent('render', { type: 'box', material: dourado });
  fechadura.setLocalScale(0.16, 0.2, 0.08);
  fechadura.setLocalPosition(0, 0.02, 0.36);
  root.addChild(fechadura);

  const lidPivot = new Entity('tampa-pivot');
  lidPivot.setLocalPosition(0, 0.125, -0.35);
  root.addChild(lidPivot);

  const tampa = new Entity('tampa');
  tampa.addComponent('render', { type: 'box', material: madeira });
  tampa.setLocalScale(1.1, 0.5, 0.7);
  tampa.setLocalPosition(0, 0.25, 0.35);
  lidPivot.addChild(tampa);

  const frisoTampa = new Entity('friso-tampa');
  frisoTampa.addComponent('render', { type: 'box', material: dourado });
  frisoTampa.setLocalScale(1.14, 0.09, 0.15);
  frisoTampa.setLocalPosition(0, 0.25, 0.35);
  lidPivot.addChild(frisoTampa);

  return { root, lidPivot };
}
