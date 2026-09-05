// Desenho dos cartões-marcadores impressos (usado só pela ferramenta de
// compilação em tools/compile-markers.html). Gera bastante detalhe/contraste
// de propósito, porque o rastreamento por imagem (MindAR) precisa de textura
// rica — um logo liso e "limpo" rastreia mal.

export interface CartaoMarcador {
  numero: number;
  titulo: string;
  subtitulo: string;
  corPrincipal: string;
  corSecundaria: string;
  icone: 'cristal' | 'estrela' | 'chave';
}

export const CARTOES: CartaoMarcador[] = [
  {
    numero: 1,
    titulo: 'RECEPÇÃO',
    subtitulo: 'Cristal Azul',
    corPrincipal: '#2f85f2',
    corSecundaria: '#0d2c57',
    icone: 'cristal'
  },
  {
    numero: 2,
    titulo: 'ÁREA DE CONVIVÊNCIA',
    subtitulo: 'Estrela Dourada',
    corPrincipal: '#f2c14e',
    corSecundaria: '#5a3d0a',
    icone: 'estrela'
  },
  {
    numero: 3,
    titulo: 'PALCO',
    subtitulo: 'Chave Roxa',
    corPrincipal: '#8a4fd6',
    corSecundaria: '#2e1a4d',
    icone: 'chave'
  }
];

export const LARGURA = 900;
export const ALTURA = 1200;

function desenharTextura(ctx: CanvasRenderingContext2D, cor: string) {
  ctx.save();
  ctx.strokeStyle = cor;
  ctx.globalAlpha = 0.16;
  ctx.lineWidth = 2;
  const passo = 34;
  for (let i = -ALTURA; i < LARGURA + ALTURA; i += passo) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i + ALTURA, ALTURA);
    ctx.stroke();
  }
  ctx.globalAlpha = 0.09;
  for (let i = -ALTURA; i < LARGURA + ALTURA; i += passo) {
    ctx.beginPath();
    ctx.moveTo(i, ALTURA);
    ctx.lineTo(i + ALTURA, 0);
    ctx.stroke();
  }
  ctx.restore();
}

function desenharMoldura(ctx: CanvasRenderingContext2D, cor: string) {
  ctx.save();
  ctx.strokeStyle = cor;
  ctx.lineWidth = 10;
  ctx.strokeRect(28, 28, LARGURA - 56, ALTURA - 56);
  ctx.lineWidth = 3;
  ctx.strokeRect(48, 48, LARGURA - 96, ALTURA - 96);
  // cantos decorativos
  const tamanho = 46;
  ctx.lineWidth = 8;
  [
    [48, 48, 1, 1],
    [LARGURA - 48, 48, -1, 1],
    [48, ALTURA - 48, 1, -1],
    [LARGURA - 48, ALTURA - 48, -1, -1]
  ].forEach(([x, y, sx, sy]) => {
    ctx.beginPath();
    ctx.moveTo(x, y + tamanho * sy);
    ctx.lineTo(x, y);
    ctx.lineTo(x + tamanho * sx, y);
    ctx.stroke();
  });
  ctx.restore();
}

function desenharCristal(ctx: CanvasRenderingContext2D, cx: number, cy: number, raio: number, cor: string) {
  ctx.save();
  const grad = ctx.createLinearGradient(cx, cy - raio, cx, cy + raio);
  grad.addColorStop(0, '#ffffff');
  grad.addColorStop(0.45, cor);
  grad.addColorStop(1, '#0a1c33');
  ctx.fillStyle = grad;
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 4;

  ctx.beginPath();
  ctx.moveTo(cx, cy - raio);
  ctx.lineTo(cx + raio * 0.62, cy);
  ctx.lineTo(cx, cy + raio);
  ctx.lineTo(cx - raio * 0.62, cy);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // facetas internas
  ctx.beginPath();
  ctx.moveTo(cx, cy - raio);
  ctx.lineTo(cx, cy + raio);
  ctx.moveTo(cx - raio * 0.62, cy);
  ctx.lineTo(cx + raio * 0.62, cy);
  ctx.globalAlpha = 0.5;
  ctx.stroke();
  ctx.restore();
}

function desenharEstrela(ctx: CanvasRenderingContext2D, cx: number, cy: number, raio: number, cor: string) {
  ctx.save();
  const grad = ctx.createRadialGradient(cx, cy, raio * 0.1, cx, cy, raio);
  grad.addColorStop(0, '#ffffff');
  grad.addColorStop(0.5, cor);
  grad.addColorStop(1, '#4a3200');
  ctx.fillStyle = grad;
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 4;

  const pontas = 4;
  const raioInterno = raio * 0.32;
  ctx.beginPath();
  for (let i = 0; i < pontas * 2; i++) {
    const ang = (Math.PI / pontas) * i - Math.PI / 2;
    const r = i % 2 === 0 ? raio : raioInterno;
    const x = cx + Math.cos(ang) * r;
    const y = cy + Math.sin(ang) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function desenharChave(ctx: CanvasRenderingContext2D, cx: number, cy: number, raio: number, cor: string) {
  ctx.save();
  const grad = ctx.createLinearGradient(cx, cy - raio, cx, cy + raio);
  grad.addColorStop(0, '#ffffff');
  grad.addColorStop(0.5, cor);
  grad.addColorStop(1, '#1c0f33');
  ctx.fillStyle = grad;
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 4;

  const raioAnel = raio * 0.42;
  const anelY = cy - raio * 0.42;
  ctx.beginPath();
  ctx.arc(cx, anelY, raioAnel, 0, Math.PI * 2);
  ctx.arc(cx, anelY, raioAnel * 0.52, 0, Math.PI * 2, true);
  ctx.fill('evenodd');
  ctx.stroke();

  const hasteLargura = raio * 0.16;
  const hasteTopo = anelY + raioAnel * 0.7;
  const hasteBase = cy + raio * 0.65;
  ctx.beginPath();
  ctx.rect(cx - hasteLargura / 2, hasteTopo, hasteLargura, hasteBase - hasteTopo);
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.rect(cx, hasteBase - raio * 0.28, raio * 0.32, raio * 0.12);
  ctx.rect(cx, hasteBase - raio * 0.1, raio * 0.24, raio * 0.12);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

export function desenharCartao(ctx: CanvasRenderingContext2D, cartao: CartaoMarcador) {
  ctx.clearRect(0, 0, LARGURA, ALTURA);

  const fundo = ctx.createLinearGradient(0, 0, LARGURA, ALTURA);
  fundo.addColorStop(0, '#151233');
  fundo.addColorStop(0.55, cartao.corSecundaria);
  fundo.addColorStop(1, '#151233');
  ctx.fillStyle = fundo;
  ctx.fillRect(0, 0, LARGURA, ALTURA);

  desenharTextura(ctx, cartao.corPrincipal);
  desenharMoldura(ctx, cartao.corPrincipal);

  ctx.textAlign = 'center';
  ctx.fillStyle = '#f2c14e';
  ctx.font = 'bold 40px "Segoe UI", sans-serif';
  ctx.fillText('MISSÃO TESOURO', LARGURA / 2, 130);

  ctx.fillStyle = '#c9c2ea';
  ctx.font = '600 30px "Segoe UI", sans-serif';
  ctx.fillText(`PONTO ${cartao.numero}`, LARGURA / 2, 185);

  const cx = LARGURA / 2;
  const cy = ALTURA / 2 - 30;
  const raio = 230;
  if (cartao.icone === 'cristal') desenharCristal(ctx, cx, cy, raio, cartao.corPrincipal);
  if (cartao.icone === 'estrela') desenharEstrela(ctx, cx, cy, raio, cartao.corPrincipal);
  if (cartao.icone === 'chave') desenharChave(ctx, cx, cy, raio, cartao.corPrincipal);

  ctx.fillStyle = '#f6f3ff';
  ctx.font = 'bold 48px "Segoe UI", sans-serif';
  ctx.fillText(cartao.titulo, LARGURA / 2, ALTURA - 160);

  ctx.fillStyle = cartao.corPrincipal;
  ctx.font = '600 34px "Segoe UI", sans-serif';
  ctx.fillText(cartao.subtitulo, LARGURA / 2, ALTURA - 105);
}
