// A MindAR (pacote `mind-ar`) não publica tipos. Declaramos aqui só a
// superfície da API que o projeto realmente usa (ver scene/arController.ts).

declare module 'mind-ar/src/image-target/controller.js' {
  export interface MindArUpdateEvent {
    type: string;
    targetIndex: number;
    worldMatrix: number[] | Float32Array | null;
  }

  export interface ControllerOptions {
    inputWidth: number;
    inputHeight: number;
    onUpdate?: (event: MindArUpdateEvent) => void;
    debugMode?: boolean;
    maxTrack?: number;
    warmupTolerance?: number | null;
    missTolerance?: number | null;
    filterMinCF?: number | null;
    filterBeta?: number | null;
  }

  export class Controller {
    constructor(options: ControllerOptions);
    interestedTargetIndex: number;
    addImageTargets(fileURL: string): Promise<unknown>;
    getProjectionMatrix(): Float32Array;
    dummyRun(input: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement): void;
    processVideo(input: HTMLVideoElement): void;
    stopProcessVideo(): void;
    dispose(): void;
  }
}

declare module 'mind-ar/src/image-target/compiler.js' {
  export class Compiler {
    compileImageTargets(
      images: Array<HTMLImageElement | HTMLCanvasElement>,
      progressCallback?: (percent: number) => void
    ): Promise<unknown>;
    exportData(): ArrayBuffer;
    importData(buffer: ArrayBuffer): unknown;
  }
}
