// Pequenos helpers de animação (sem física, sem partículas): flutuação, rotação
// suave, escala de entrada e abertura do baú.

import type { Entity } from 'playcanvas';

export interface FloatingHandle {
  update(dt: number): void;
  destroy(): void;
}

/** Faz o objeto flutuar (seno) e girar devagar em Y, com um "pop" de escala ao aparecer. */
export function attachFloatingAnimation(entity: Entity, baseScale = 1): FloatingHandle {
  let elapsed = 0;
  let scaleIn = 0;
  entity.setLocalScale(0.001, 0.001, 0.001);

  function update(dt: number) {
    elapsed += dt;
    scaleIn = Math.min(1, scaleIn + dt * 2.2);
    const eased = 1 - Math.pow(1 - scaleIn, 3);
    const s = baseScale * eased;
    entity.setLocalScale(s, s, s);

    const bob = Math.sin(elapsed * 2.2) * 0.06;
    entity.setLocalPosition(entity.getLocalPosition().x, bob, entity.getLocalPosition().z);
    entity.rotate(0, dt * 28, 0);
  }

  return {
    update,
    destroy() {
      /* nada para liberar; mantido por simetria de API */
    }
  };
}

export interface ScaleInHandle {
  update(dt: number): void;
}

/** "Pop" de escala simples, sem flutuação nem rotação contínua (usado no baú). */
export function attachScaleIn(entity: Entity, baseScale = 1, duration = 0.6): ScaleInHandle {
  let t = 0;
  entity.setLocalScale(0.001, 0.001, 0.001);

  function update(dt: number) {
    if (t >= 1) return;
    t = Math.min(1, t + dt / duration);
    const eased = 1 - Math.pow(1 - t, 3);
    const s = baseScale * eased;
    entity.setLocalScale(s, s, s);
  }

  return { update };
}

export interface ChestOpenHandle {
  update(dt: number): void;
  isFinished(): boolean;
}

/** Anima a tampa do baú de fechada (0°) até aberta (~-105°) com easing. */
export function animateChestOpen(lidPivot: Entity, durationSec = 1.1): ChestOpenHandle {
  let t = 0;
  const anguloFinal = -105;

  function update(dt: number) {
    if (t >= 1) return;
    t = Math.min(1, t + dt / durationSec);
    const eased = 1 - Math.pow(1 - t, 3);
    lidPivot.setLocalEulerAngles(anguloFinal * eased, 0, 0);
  }

  return {
    update,
    isFinished: () => t >= 1
  };
}
