# Resumo da entrega — Missão Tesouro (MVP)

## O que foi implementado

- **Tela inicial**: nome do jogo, slogan, campo de nome da equipe, botões "Começar aventura"
  (AR), "Modo demonstração" e "Continuar partida" (aparece só quando há progresso salvo).
- **Caça ao tesouro** com 3 pontos (Recepção, Área de convivência, Palco), pista atual, contador
  "X de 3 tesouros", coleta única por objeto, 100 pontos por coleta, liberação sequencial da
  próxima pista.
- **Objetos 3D** (cristal azul, estrela dourada, chave roxa) construídos só com primitivas do
  PlayCanvas (cones, boxes, cylinders, sphere) e `StandardMaterial`, com animação de entrada
  (escala), flutuação e rotação suaves.
- **Inventário** em modal: 3 itens, visual diferente para coletado/pendente, pontuação total.
- **Conclusão**: baú 3D (base + tampa articulada), botão "Abrir tesouro" com animação de abertura,
  mensagem final, nome da equipe e pontuação, botão de reiniciar com modal de confirmação.
- **Modo demonstração**: mesma lógica de jogo (mesmo `state/gameState.ts`), sem câmera, com um
  botão "Simular descoberta" no lugar do "Procurar tesouro", e uma indicação fixa
  "MODO DEMONSTRAÇÃO" na tela.
- **AR real via WebXR (Hit Testing)**: verificação de suporte antes de iniciar, busca de
  superfície com retículo visual, ancoragem do objeto na pose detectada ao tocar na tela, DOM
  Overlay para a UI (instrução, botão coletar, botão sair), encerramento explícito da sessão
  (`app.xr.end()`) ao sair/coletar/errar.
- **Tratamento de erro de AR**: sem suporte, permissão de câmera negada, ou falha ao iniciar —
  todos caem em uma tela de erro com mensagem específica e atalho para o Modo demonstração.
- **Persistência**: `localStorage` guarda nome da equipe, modo, itens coletados, pontuação e
  status de conclusão. Reiniciar apaga tudo.
- **Documentação**: README (instalação, build, teste no celular via HTTPS/mkcert, decisão de AR),
  roteiro de apresentação de 3 minutos, este resumo.

## O que foi verificado nesta sessão (ambiente de desenvolvimento, sem celular físico)

Testado ponta a ponta em um navegador Chrome real (via automação de DevTools), não apenas lido no
código:

- `npm run build` completa sem erros (checagem de tipos + build do Vite).
- Fluxo completo do **Modo demonstração**: início → 3 pontos coletados em sequência → tela final →
  abertura do baú → pontuação final **300/300** → mensagem final e nome da equipe corretos.
- **Sequência de pistas**: cada ponto só libera a pista seguinte após a coleta; a ordem
  Recepção → Área de convivência → Palco foi respeitada.
- **Coleta única**: o botão "Coletar" só existe depois da descoberta e desaparece assim que o
  ponto avança; a trava de idempotência em `coletarPonto()` impede duplicidade mesmo que a função
  seja chamada de novo para o mesmo ponto.
- **Persistência real**: com progresso parcial salvo, um F5 na página volta pra tela inicial com
  o botão "Continuar partida", e continuar restaura exatamente o ponto/pontuação salvos.
- **Reiniciar**: apaga o registro do `localStorage` e volta para a tela inicial sem opção de
  continuar.
- **Falha de AR com fallback**: neste navegador de desktop (sem WebXR "immersive-ar" disponível),
  o fluxo de AR mostra a tela de erro com a mensagem "Realidade Aumentada não está disponível
  neste dispositivo" e o botão "Modo demonstração" simula a descoberta do ponto atual
  corretamente, sem travar a aplicação.
- **Layout mobile**: testado em viewport de celular (~390–500px de largura), sem elementos
  cortados ou sobrepostos de forma quebrada.
- Durante os testes, dois problemas visuais foram encontrados e corrigidos: (1) o preview 3D não
  aparecia atrás da interface (trocamos a estratégia de "janela recortada" por tela transparente
  com cards translúcidos por cima, mais simples e robusta) e (2) um botão que deveria ficar
  escondido durante o erro de AR ainda aparecia por baixo (regra CSS `[hidden]` estava sendo
  sobrescrita por `.btn { display: flex }` — corrigido com `[hidden] { display: none !important }`).

## O que depende de um celular real (não verificável neste ambiente)

- **Sessão de AR de ponta a ponta em hardware real** (Android + Chrome/ARCore): abertura de
  câmera, permissão do sistema operacional, qualidade da detecção de superfície (hit-test) em um
  ambiente físico, estabilidade da ancoragem do objeto ao mover o celular.
- **Comportamento em iOS/Safari**: o código já trata esse caso como "AR indisponível" e direciona
  para o Modo demonstração, mas o teste real do aviso e da experiência em um iPhone físico não foi
  feito aqui.
- **Teste do fluxo de HTTPS local (mkcert) em rede Wi-Fi real**, incluindo o aviso de certificado
  não confiável no navegador do celular e a aceitação manual desse aviso.
- **Permissão de câmera negada pelo usuário**: o tratamento de erro está implementado
  (`NotAllowedError` → mensagem específica), mas não pôde ser exercitado de fato sem um navegador
  com permissão de câmera real disponível neste ambiente.

## Limitações conhecidas do MVP (por decisão de escopo, não bugs)

- Identificação do ponto físico é manual (o jogador confirma tocando no botão) — sem GPS, sem
  marcador, sem validação automática do ambiente. Isso está explicado na própria tela do jogo.
- Sem marcadores impressos: a abordagem de AR escolhida foi Hit Testing (posicionamento no
  ambiente), não rastreamento de imagem — então não há arquivo de marcador para imprimir (ver
  justificativa no README).
- Bundle de produção único (~2 MB antes de gzip, ~525 KB com gzip) — aceitável para um protótipo
  local, mas o Vite avisa que poderia ser dividido em chunks menores; não otimizado aqui de
  propósito, para manter o setup simples.
- Sem autenticação, multiplayer, ranking online, painel administrativo, banco de dados, GPS, chat
  ou integrações pagas — nenhum desses itens existe, nem como simulação.
