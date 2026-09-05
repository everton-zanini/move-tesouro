# Missão Tesouro 🗺️

Protótipo (MVP) de um jogo de caça ao tesouro para eventos de jovens, com PlayCanvas Engine
(3D) + Realidade Aumentada por **marcador de imagem** (câmera comum, sem ARCore/ARKit). Interface
em português brasileiro, pensada para celular na vertical.

> Este é um protótipo de demonstração para apresentar a proposta da atividade — não é o produto
> final do evento.

## O que o jogo faz

- 3 pontos físicos do evento, cada um com uma pista e um objeto 3D colecionável (cristal, estrela
  e chave).
- Um **Modo demonstração** que roda em qualquer computador/celular, sem câmera, reaproveitando
  exatamente a mesma lógica de jogo (pistas, coleta, pontuação, conclusão) do modo AR.
- Um modo de **AR real**: a câmera reconhece um cartão-marcador impresso em cada ponto e ancora o
  objeto 3D nele, ao vivo.
- Progresso salvo em `localStorage` (sem backend, sem login, sem serviços pagos).

## Tecnologia

- [PlayCanvas Engine](https://github.com/playcanvas/engine) via npm (sem o editor online) — único
  motor 3D do projeto, inclusive na AR.
- [MindAR](https://github.com/hiukim/mind-ar-js) (`mind-ar`) — só a parte de câmera +
  reconhecimento do marcador; a pose que ela calcula é aplicada diretamente numa entidade do
  PlayCanvas (ver "Decisão técnica de AR" abaixo).
- Vite + TypeScript.
- HTML/CSS puro para a interface; PlayCanvas cuida só da cena 3D (objetos e câmera).
- Objetos 3D feitos só com primitivas (`box`, `cone`, `cylinder`, `sphere`) e `StandardMaterial`
  — nenhum modelo/asset externo.

## Instalação e execução local

Pré-requisitos: Node.js 18+.

```bash
npm install
npm run dev
```

> `canvas` é uma dependência transitiva da MindAR (usada só pelo compilador Node dela, que este
> projeto não usa) e exige um toolchain de build nativo para compilar do zero. Para evitar
> depender disso em qualquer ambiente (Windows local, Vercel, CI), o `package.json` já substitui
> `canvas` por um pacote vazio via `overrides` — `npm install` funciona direto, sem precisar de
> compilador C++ instalado.

O terminal vai mostrar um endereço local (`https://localhost:5173`) e endereços de rede
(`https://SEU-IP-NA-REDE:5173`) — este segundo é o que você usa para abrir no celular (veja
abaixo).

### Build de produção

```bash
npm run build
npm run preview
```

`npm run build` roda a checagem de tipos (`tsc --noEmit`) e depois o build do Vite. Se algo não
compilar, o comando falha e mostra o erro. A parte pesada da AR (MindAR + TensorFlow.js) fica num
chunk separado, carregado só quando o jogador entra na tela de AR — quem só usa o Modo
demonstração não baixa esse peso extra.

## Testando no celular (com HTTPS)

O acesso à câmera (`getUserMedia`) só funciona em um **contexto seguro** (HTTPS), exceto em
`localhost`. Para testar no celular pela rede Wi-Fi, o projeto já vem configurado com
[`vite-plugin-mkcert`](https://github.com/liuweiGL/vite-plugin-mkcert), que gera um certificado
HTTPS local automaticamente.

Passo a passo:

1. Rode `npm run dev` no computador. Na primeira vez, o `mkcert` pode pedir para instalar uma
   autoridade certificadora local (pode pedir confirmação/senha do sistema operacional) — aceite,
   isso é o que permite gerar um certificado confiável só para a sua máquina.
2. Confirme que o computador e o celular estão **na mesma rede Wi-Fi**.
3. No terminal, copie o endereço `Network:` que aparece (algo como `https://192.168.0.10:5173`).
4. Abra esse endereço no navegador do celular.
5. Como o certificado é local (não é de uma autoridade pública), o navegador do celular vai
   avisar que a conexão "não é privada" — isso é esperado. Toque em **Avançado** → **Acessar mesmo
   assim**.
6. A partir daí o site carrega normalmente com HTTPS e a AR pode pedir permissão de câmera.

Se preferir não lidar com o aviso de certificado (ex.: ambiente sem permissão para instalar CA
local), rode `VITE_NO_HTTPS=1 npm run dev` — o servidor sobe em HTTP simples. **Nesse modo, a
câmera não vai funcionar** (não é um contexto seguro), mas o **Modo demonstração** funciona
normalmente. Essa variável existe só para testes rápidos em ambientes restritos. O deploy no
Vercel (abaixo) já resolve isso de vez, com HTTPS de verdade e sem aviso nenhum.

## Deploy no Vercel

O projeto é um site 100% estático (sem backend, sem variáveis de ambiente obrigatórias), então o
deploy no Vercel é direto e já resolve o problema do certificado HTTPS local (o Vercel gera um
certificado válido de verdade, então o celular não mostra nenhum aviso).

**Repositório:** https://github.com/everton-zanini/move-tesouro

### Opção A — pelo painel do Vercel (recomendado)

1. Acesse [vercel.com/new](https://vercel.com/new) e faça login com sua conta GitHub.
2. Importe o repositório `everton-zanini/move-tesouro`.
3. O Vercel detecta automaticamente o framework **Vite** e já preenche:
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`
4. Clique em **Deploy**. Em ~1 minuto você recebe uma URL pública `https://move-tesouro-....vercel.app`
   já em HTTPS — pode abrir direto no celular, sem aviso de certificado.
5. Cada novo `git push` na branch `main` gera um novo deploy automaticamente.

### Opção B — pela CLI do Vercel

```bash
npm install -g vercel
vercel login
vercel        # deploy de preview
vercel --prod # deploy de produção
```

Não é necessário criar nenhum `vercel.json` — a detecção automática de projeto Vite já cobre o
build command, o output directory e o roteamento de SPA (fallback para `index.html`).

## Decisão técnica de AR (leia antes de testar em um celular real)

**Histórico:** a primeira versão deste MVP usava WebXR com Hit Testing (posicionamento no
ambiente). Ao testar num Android + Chrome real, o app corretamente detectou e reportou "AR não
disponível" — o aparelho não tinha o ARCore instalado nem disponível pra instalar (fora da lista
de dispositivos certificados da Google), e o mesmo aconteceu até na página oficial de exemplo do
WebXR, confirmando que era uma limitação do aparelho, não um bug do app. Como depender de
ARCore/ARKit deixa de fora uma fatia relevante dos celulares que os jovens do evento vão trazer,
migramos para a abordagem abaixo.

- **Abordagem atual: rastreamento de marcador de imagem via câmera comum**, usando a biblioteca
  [MindAR](https://github.com/hiukim/mind-ar-js). O jogador aponta a câmera do celular pra um
  cartão impresso específico de cada ponto; a MindAR reconhece o cartão e calcula sua pose
  (posição/rotação) em tempo real; essa pose é aplicada diretamente numa entidade do PlayCanvas —
  o motor 3D continua sendo só o PlayCanvas, a MindAR só fornece câmera + rastreamento.
- **Por que MindAR e não a "AR.js" clássica:** a AR.js tradicional é construída em cima do
  three.js/A-Frame — usá-la de verdade exigiria rodar um segundo motor 3D em paralelo ao
  PlayCanvas só para a AR. A MindAR expõe uma API de baixo nível (`Controller` +
  callback de pose) que não depende de nenhum motor gráfico específico, permitindo manter 100%
  PlayCanvas.
- **Por que isso resolve o problema do ARCore:** rastreamento de marcador usa só
  `getUserMedia` (a API de câmera comum de qualquer navegador) — não depende de ARCore, ARKit, ou
  qualquer serviço nativo de AR instalado no aparelho. Funciona tanto em Android quanto em iPhone.
- **Identificação do local continua simplificada de propósito**: o marcador confirma o ponto
  físico automaticamente quando a câmera o reconhece — ainda assim, não há GPS nem qualquer
  validação além do reconhecimento visual do cartão impresso.

### Marcadores impressos

Os 3 cartões (um por ponto) estão em `public/markers-print/`:

- `ponto1-recepcao-cristal.png`
- `ponto2-convivencia-estrela.png`
- `ponto3-palco-chave.png`

O arquivo compilado que o app carrega em tempo de execução é `public/markers/targets.mind` (já
incluído no repositório — não precisa recompilar pra rodar o jogo).

**Instruções de impressão:**

- Imprima cada cartão com pelo menos **15 cm de largura** (quanto maior, mais fácil de reconhecer
  de longe). Um cartão A5 ou um pouco maior funciona bem.
- Use **papel fosco** — papel brilhante/plastificado cria reflexos que atrapalham o
  reconhecimento.
- Cole/fixe o cartão **liso, sem dobras**, em um local bem iluminado (evite contraluz).
- Cada cartão só é reconhecido para o ponto correspondente — o app já mostra qual ponto/cartão
  procurar em cada etapa.

**Se quiser mudar a arte dos marcadores** (cores, ícone, texto): edite `tools/markerArt.ts`, rode
`npm run dev`, abra `http://localhost:5174/tools/compile-markers.html` (ajuste a porta se for
diferente) no navegador e aguarde a mensagem "Pronto!". A ferramenta desenha os 3 cartões na tela
e expõe o resultado compilado em `window.__resultado` (usado durante o desenvolvimento para gerar
os arquivos finais) — ela não faz parte do jogo publicado.

### Dispositivo/navegador alvo

- **Funciona em qualquer celular com câmera e navegador atualizado** (Chrome/Safari/Firefox
  recentes), tanto Android quanto iPhone — não depende de ARCore, ARKit ou qualquer app/serviço
  adicional instalado.
- Precisa de HTTPS (ou `localhost`) e de permissão de câmera concedida pelo usuário.
- Não há promessa de compatibilidade universal: navegadores muito desatualizados, ou sem suporte
  a `getUserMedia`, caem no tratamento de erro com o mesmo fallback pro Modo demonstração.

### O que acontece quando a AR falha

A tela de AR sempre passa por uma verificação de suporte (`navigator.mediaDevices.getUserMedia`
existe? a página está em contexto seguro?) antes de tentar abrir a câmera. Em qualquer um destes
casos — sem suporte, permissão de câmera negada, câmera não encontrada, ou falha ao carregar os
marcadores — a interface mostra uma mensagem específica e um botão para continuar no Modo
demonstração, sem travar o app.

Ao sair da tela de AR (manualmente, por erro, ou após coletar o objeto), a sessão é encerrada por
completo: o rastreamento da MindAR é finalizado (`controller.dispose()`), todas as tracks do
`MediaStream` da câmera são paradas (`track.stop()`) e o elemento de vídeo é removido do DOM — a
câmera do dispositivo é liberada corretamente.

## Estrutura do código

```
src/
  config/content.ts        → pistas, pontos, textos, cores, pontuação e markerIndex (edite aqui)
  state/gameState.ts       → estado do jogo + localStorage (compartilhado entre AR e demo)
  scene/
    sceneApp.ts             → Application do PlayCanvas, câmera, luzes (instância única)
    objectFactory.ts        → cristal/estrela/chave/baú, só com primitivas + materiais
    animations.ts           → flutuação, escala de entrada, abertura do baú
    displayController.ts    → o que está visível agora na cena (objeto ou baú) + loop de update
    arController.ts         → MindAR: suporte, câmera, rastreamento do marcador, erros
  ui/
    homeScreen.ts / huntScreen.ts / finalScreen.ts / inventory.ts / arOverlay.ts / components.ts
  main.ts                   → liga tudo (troca de telas, handlers de botão)
  styles.css                → tema visual
  types/mind-ar.d.ts        → tipos mínimos para os módulos da MindAR (o pacote não publica tipos)
tools/
  markerArt.ts               → desenho dos cartões-marcadores (canvas 2D)
  compile-markers.html/.ts   → ferramenta de dev pra gerar targets.mind (não faz parte do jogo)
public/
  markers/targets.mind       → marcadores compilados, carregado em tempo de execução
  markers-print/*.png        → cartões prontos para imprimir
```

A lógica de jogo (`gameState.ts`) não sabe nada sobre AR ou demonstração — tanto
`arController`/`arOverlay` quanto o fluxo de demonstração em `huntScreen`/`main.ts` chamam as
mesmas funções (`coletarPonto`, `getPontoAtual` etc.), garantindo que as duas experiências sigam
exatamente as mesmas regras.

## Editando o conteúdo (pistas, pontos, textos, cores)

Tudo isso fica em `src/config/content.ts`. Para trocar os 3 pontos do seu evento, edite o array
`PONTOS` (id, nome do local, texto da pista, tipo/cor do objeto, `markerIndex`). Textos de
interface ficam no objeto `TEXTOS`; cores gerais em `CORES` (mas o grosso da paleta está em
`src/styles.css`, nas variáveis `:root`).

Se trocar os pontos, lembre de gerar novos marcadores (ver "Marcadores impressos" acima) e manter
o `markerIndex` de cada ponto batendo com a ordem em que as imagens entraram na compilação.

## Escopo do que NÃO foi implementado (por decisão do MVP)

Autenticação, multiplayer, ranking online, painel administrativo, banco de dados, GPS, chat e
qualquer integração paga — nenhum desses itens está presente, nem simulado como se estivesse
pronto.

## Verificações realizadas vs. pendentes

Veja `docs/resumo-entrega.md` para o detalhamento completo do que foi testado neste ambiente
(Modo demonstração, build, persistência, caminhos de erro da AR) e do que só pode ser validado em
um celular real com câmera e marcador impresso de verdade (reconhecimento efetivo do marcador em
movimento).
