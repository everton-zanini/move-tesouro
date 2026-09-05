# Missão Tesouro 🗺️

Protótipo (MVP) de um jogo de caça ao tesouro para eventos de jovens, com PlayCanvas Engine
(3D) + Realidade Aumentada via WebXR. Interface em português brasileiro, pensada para celular
na vertical.

> Este é um protótipo de demonstração para apresentar a proposta da atividade — não é o produto
> final do evento.

## O que o jogo faz

- 3 pontos físicos do evento, cada um com uma pista e um objeto 3D colecionável (cristal, estrela
  e chave).
- Um **Modo demonstração** que roda em qualquer computador/celular, sem câmera, reaproveitando
  exatamente a mesma lógica de jogo (pistas, coleta, pontuação, conclusão) do modo AR.
- Um modo de **AR real** (WebXR), para quem estiver com um celular Android + Chrome compatível.
- Progresso salvo em `localStorage` (sem backend, sem login, sem serviços pagos).

## Tecnologia

- [PlayCanvas Engine](https://github.com/playcanvas/engine) via npm (sem o editor online).
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

O terminal vai mostrar um endereço local (`https://localhost:5173`) e endereços de rede
(`https://SEU-IP-NA-REDE:5173`) — este segundo é o que você usa para abrir no celular (veja
abaixo).

### Build de produção

```bash
npm run build
npm run preview
```

`npm run build` roda a checagem de tipos (`tsc --noEmit`) e depois o build do Vite. Se algo não
compilar, o comando falha e mostra o erro.

## Testando no celular (com HTTPS)

WebXR (AR) e o acesso à câmera só funcionam em um **contexto seguro** (HTTPS), exceto em
`localhost`. Para testar no celular pela rede Wi-Fi, o projeto já vem configurado com
[`vite-plugin-mkcert`](https://github.com/liuweiGL/vite-plugin-mkcert), que gera um certificado
HTTPS local automaticamente.

Passo a passo:

1. Rode `npm run dev` no computador. Na primeira vez, o `mkcert` pode pedir para instalar uma
   autoridade certificadora local (pode pedir confirmação/senha do sistema operacional) — aceite,
   isso é o que permite gerar um certificado confiável só para a sua máquina.
2. Confirme que o computador e o celular estão **na mesma rede Wi-Fi**.
3. No terminal, copie o endereço `Network:` que aparece (algo como `https://192.168.0.10:5173`).
4. Abra esse endereço no navegador do celular (Chrome, no Android).
5. Como o certificado é local (não é de uma autoridade pública), o Chrome do celular vai avisar
   que a conexão "não é privada" — isso é esperado. Toque em **Avançado** → **Acessar mesmo assim**.
6. A partir daí o site carrega normalmente com HTTPS e a AR pode pedir permissão de câmera.

Se preferir não lidar com o aviso de certificado (ex.: ambiente sem permissão para instalar CA
local), rode `VITE_NO_HTTPS=1 npm run dev` — o servidor sobe em HTTP simples. **Nesse modo, a AR e
a câmera não vão funcionar** (não é um contexto seguro), mas o **Modo demonstração** funciona
normalmente. Essa variável existe só para testes rápidos em ambientes restritos.

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

O enunciado pedia para priorizar rastreamento de marcador/imagem e, se isso não fosse viável,
usar WebXR com posicionamento no ambiente — documentando a decisão. Foi o que fizemos:

- **Abordagem escolhida: WebXR com Hit Testing** (o objeto é ancorado a uma superfície real
  detectada pela câmera — chão, mesa etc. — e fica preso a essa pose enquanto a sessão continua).
- **Por que não marcador/imagem:** a documentação oficial do PlayCanvas lista o módulo
  *Image Tracking* do WebXR como dependente de suporte "incubatório" (comportamento inconsistente
  entre navegadores/dispositivos), enquanto o *Hit Testing* é o caminho estável e amplamente
  documentado para ancorar conteúdo ao mundo real. Como o público-alvo são celulares variados de
  jovens em um evento (não um único modelo controlado), a robustez do Hit Testing pesou mais do
  que o efeito "mais fiel" de um marcador impresso.
- **Sem marcador impresso**: como consequência, este MVP **não inclui arquivos de marcador para
  imprimir** — não se aplica à abordagem escolhida.
- **Identificação do local é simplificada de propósito**: sem marcador e sem GPS, é o próprio
  jogador quem "confirma" que chegou ao ponto físico, tocando em "Procurar tesouro" (ou "Simular
  descoberta" no modo demonstração). O app deixa isso explícito na tela ("a confirmação do local é
  feita por você mesmo"). Isso é um limite deliberado do protótipo, não um recurso escondido.

### Dispositivo/navegador alvo (testado como referência)

- **Alvo primário: Android + Google Chrome atualizado**, com suporte a ARCore. É a combinação
  testada como referência para este MVP.
- **iOS (Safari) não é suportado**: o Safari não implementa `immersive-ar` do WebXR hoje. Em
  iPhone, use o **Modo demonstração** — a interface já direciona para isso quando a AR falha.
- Não há promessa de compatibilidade universal: dispositivos Android mais antigos, sem ARCore, ou
  navegadores desatualizados também caem no tratamento de erro com o mesmo fallback.

### O que acontece quando a AR falha

A tela de AR sempre passa por uma verificação de suporte (`navigator.xr`, `app.xr.supported`,
`app.xr.isAvailable`) antes de tentar abrir a câmera. Em qualquer um destes casos — sem suporte,
permissão de câmera negada, ou falha ao iniciar a sessão — a interface mostra uma mensagem
específica e um botão para continuar no Modo demonstração, sem travar o app.

Ao sair da tela de AR (manualmente, por erro, ou após coletar o objeto), a sessão WebXR é
encerrada (`app.xr.end()`) e o material de retículo/objeto temporário é destruído — a câmera do
dispositivo é liberada corretamente.

## Estrutura do código

```
src/
  config/content.ts        → pistas, pontos, textos, cores e pontuação (edite aqui)
  state/gameState.ts       → estado do jogo + localStorage (compartilhado entre AR e demo)
  scene/
    sceneApp.ts             → Application do PlayCanvas, câmera, luzes (instância única)
    objectFactory.ts        → cristal/estrela/chave/baú, só com primitivas + materiais
    animations.ts           → flutuação, escala de entrada, abertura do baú
    displayController.ts    → o que está visível agora na cena (objeto ou baú) + loop de update
    arController.ts         → WebXR: suporte, hit-test, eventos de início/fim/erro
  ui/
    homeScreen.ts / huntScreen.ts / finalScreen.ts / inventory.ts / arOverlay.ts / components.ts
  main.ts                   → liga tudo (troca de telas, handlers de botão)
  styles.css                → tema visual
```

A lógica de jogo (`gameState.ts`) não sabe nada sobre AR ou demonstração — tanto
`arController`/`arOverlay` quanto o fluxo de demonstração em `huntScreen`/`main.ts` chamam as
mesmas funções (`coletarPonto`, `getPontoAtual` etc.), garantindo que as duas experiências sigam
exatamente as mesmas regras.

## Editando o conteúdo (pistas, pontos, textos, cores)

Tudo isso fica em `src/config/content.ts`. Para trocar os 3 pontos do seu evento, edite o array
`PONTOS` (id, nome do local, texto da pista, tipo/cor do objeto). Textos de interface ficam no
objeto `TEXTOS`; cores gerais em `CORES` (mas o grosso da paleta está em `src/styles.css`, nas
variáveis `:root`).

## Escopo do que NÃO foi implementado (por decisão do MVP)

Autenticação, multiplayer, ranking online, painel administrativo, banco de dados, GPS, chat e
qualquer integração paga — nenhum desses itens está presente, nem simulado como se estivesse
pronto.

## Verificações realizadas vs. pendentes

Veja `docs/resumo-entrega.md` para o detalhamento completo do que foi testado neste ambiente
(Modo demonstração, build, persistência) e do que só pode ser validado em um celular Android real
(sessão de AR com câmera de verdade).
