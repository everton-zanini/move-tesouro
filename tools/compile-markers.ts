// Ferramenta de desenvolvimento (não faz parte do jogo): desenha os 3 cartões
// dos marcadores e compila o arquivo targets.mind usando o Compiler (versão
// navegador) da MindAR. Acesse via `npm run dev` em /tools/compile-markers.html.
//
// Rode de novo sempre que mudar a arte dos marcadores em tools/markerArt.ts.

import { Compiler } from 'mind-ar/src/image-target/compiler.js';
import { CARTOES, ALTURA, LARGURA, desenharCartao } from './markerArt';

const status = document.getElementById('status') as HTMLElement;
const galeria = document.getElementById('galeria') as HTMLElement;

function bufferParaBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binario = '';
  const tamanhoChunk = 0x8000;
  for (let i = 0; i < bytes.length; i += tamanhoChunk) {
    binario += String.fromCharCode(...bytes.subarray(i, i + tamanhoChunk));
  }
  return btoa(binario);
}

async function main() {
  status.textContent = 'Desenhando cartões...';

  const canvases: HTMLCanvasElement[] = CARTOES.map((cartao) => {
    const canvas = document.createElement('canvas');
    canvas.width = LARGURA;
    canvas.height = ALTURA;
    const ctx = canvas.getContext('2d')!;
    desenharCartao(ctx, cartao);
    return canvas;
  });

  const imagensBase64: string[] = [];
  canvases.forEach((canvas, i) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'cartao';
    const img = document.createElement('img');
    const dataUrl = canvas.toDataURL('image/png');
    img.src = dataUrl;
    imagensBase64.push(dataUrl);
    const legenda = document.createElement('p');
    legenda.textContent = `${i}: ${CARTOES[i].titulo}`;
    wrapper.appendChild(img);
    wrapper.appendChild(legenda);
    galeria.appendChild(wrapper);
  });

  status.textContent = 'Compilando marcadores (MindAR)...';

  const compiler = new Compiler();
  await compiler.compileImageTargets(canvases, (percent: number) => {
    status.textContent = `Compilando marcadores... ${percent.toFixed(0)}%`;
  });

  const buffer: ArrayBuffer = compiler.exportData();
  const base64Mind = bufferParaBase64(buffer);

  status.textContent = `Pronto! targets.mind: ${buffer.byteLength} bytes`;

  (window as unknown as { __resultado: unknown }).__resultado = {
    mindBase64: base64Mind,
    mindBytes: buffer.byteLength,
    imagensBase64
  };
}

main().catch((err) => {
  status.textContent = `Erro: ${(err as Error).message}`;
  console.error(err);
});
