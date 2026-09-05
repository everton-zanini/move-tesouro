# Resumo da entrega — Missão Tesouro (MVP)

> Este resumo cobre a versão atual do projeto, já com a migração de tecnologia de AR (ver
> "Histórico da migração de AR" abaixo).

## ⚠️ Pendência ativa (em investigação): reconhecimento do marcador não funciona

Depois de corrigir uma sequência de bugs reais (tela preta por WebGL sem canal alfa, `<video>`
atrás do background por z-index negativo, Worker da MindAR quebrando silenciosamente por uma
dependência CJS — `ml-matrix` — mal resolvida em modo dev), o pipeline inteiro roda sem erros:
câmera abre, vídeo aparece, o rastreador processa frames normalmente. **Mas o marcador nunca é
reconhecido**, mesmo testando localmente com a imagem exata usada para compilar o `.mind` (sem
foto, sem celular, cópia perfeita) — mais de 20s apontando "para si mesmo" sem sucesso.

**Hipótese atual**: a arte dos cartões (fundo com padrão diagonal em xadrez repetitivo + áreas
grandes de gradiente liso) pode ser ruim para o algoritmo de features da MindAR (que depende de
pontos de interesse únicos/não-repetitivos — um padrão muito regular confunde o matching).

**Decisão combinada com o usuário**: pausar a tentativa de corrigir a arte atual e, na próxima
sessão, **avaliar migrar a estratégia de marcador para QR code** (ou um padrão de alto contraste
mais simples/determinístico) em vez de um cartão ilustrado com feature-tracking natural — pode
ser mais confiável de reconhecer, ainda que menos "bonito" visualmente. Retomar por aqui.

Arquivos relevantes: `src/scene/arController.ts` (pipeline + log de diagnóstico visível na tela,
ainda ativo de propósito — não remover até resolver isto), `tools/markerArt.ts` +
`tools/compile-markers.ts` (arte/compilação atuais), `vite.config.ts` (`optimizeDeps` — cuidado,
tem 3 fixes de dependências CJS ali, todos necessários).

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
- **AR real via rastreamento de marcador de imagem (MindAR)**: verificação de suporte
  (`getUserMedia` + contexto seguro) antes de iniciar, câmera ao vivo atrás da cena 3D, cartão
  impresso reconhecido automaticamente e objeto ancorado nele em tempo real (sem toque/gesto do
  jogador), encerramento explícito da sessão (câmera parada, rastreamento finalizado) ao
  sair/coletar/errar.
- **Marcadores impressos**: 3 cartões ilustrados temáticos (`public/markers-print/*.png`) e o
  arquivo compilado (`public/markers/targets.mind`) já incluídos no repositório, prontos pra
  imprimir e usar. Ferramenta de desenvolvimento (`tools/compile-markers.html`) pra regenerar caso
  a arte mude.
- **Tratamento de erro de AR**: sem suporte, permissão de câmera negada, câmera não encontrada, ou
  falha ao carregar os marcadores — todos caem em uma tela de erro com mensagem específica e
  atalho para o Modo demonstração.
- **Persistência**: `localStorage` guarda nome da equipe, modo, itens coletados, pontuação e
  status de conclusão. Reiniciar apaga tudo.
- **Code-splitting da AR**: a parte pesada (MindAR + TensorFlow.js) só é baixada quando o jogador
  entra na tela de AR — carregada via `import()` dinâmico, em um chunk separado do bundle
  principal.
- **Documentação**: README (instalação, build, teste no celular via HTTPS/mkcert, deploy no
  Vercel, decisão de AR, marcadores impressos), roteiro de apresentação de 3 minutos, este resumo.

## Histórico da migração de AR

A primeira versão deste MVP usava **WebXR + Hit Testing**. Em teste real num Android + Chrome, o
app corretamente relatou "AR não disponível" — o aparelho não tinha ARCore instalado nem
disponível pra instalar (fora da lista de dispositivos certificados da Google); o mesmo aconteceu
até na página oficial de exemplo do WebXR, confirmando que era limitação do aparelho, não bug do
app. Como isso deixaria de fora uma fatia relevante dos celulares dos jovens do evento, migramos
para **rastreamento de marcador de imagem via câmera comum**, usando a biblioteca MindAR — não
depende de ARCore/ARKit, então funciona em Android e iPhone. Detalhes técnicos completos da
decisão e da ponte MindAR → PlayCanvas estão no README.

## O que foi verificado nesta sessão (ambiente de desenvolvimento, sem celular físico)

Testado ponta a ponta em um navegador Chrome real (via automação de DevTools), não apenas lido no
código:

- `npm run build` completa sem erros (checagem de tipos + build do Vite); confirmado o
  code-splitting do chunk de AR (separado do bundle principal).
- Fluxo completo do **Modo demonstração**: início → 3 pontos coletados em sequência → tela final →
  abertura do baú → pontuação final **300/300** → mensagem final e nome da equipe corretos —
  reconfirmado depois da migração de AR (nada mudou nesse fluxo, como esperado).
- **Sequência de pistas**: cada ponto só libera a pista seguinte após a coleta; a ordem
  Recepção → Área de convivência → Palco foi respeitada.
- **Coleta única**: o botão "Coletar" só existe depois da descoberta e desaparece assim que o
  ponto avança; a trava de idempotência em `coletarPonto()` impede duplicidade mesmo que a função
  seja chamada de novo para o mesmo ponto.
- **Persistência real**: com progresso parcial salvo, um F5 na página volta pra tela inicial com
  o botão "Continuar partida", e continuar restaura exatamente o ponto/pontuação salvos.
- **Reiniciar**: apaga o registro do `localStorage` e volta para a tela inicial sem opção de
  continuar.
- **Compilação dos marcadores**: os 3 cartões foram desenhados e compilados com sucesso pela
  ferramenta de dev (`targets.mind` gerado, ~1,38 MB) — inspecionados visualmente, com boa
  quantidade de detalhe/contraste para rastreamento.
- **Caminhos de erro da AR** (via mocks de `navigator.mediaDevices`, já que este ambiente não tem
  como conceder permissão de câmera de forma automatizada):
  - Sem `getUserMedia` no navegador → mensagem "Este navegador não tem acesso à câmera" +
    fallback funcionando.
  - Permissão de câmera negada (`NotAllowedError` simulado) → mensagem "A câmera foi bloqueada..."
    + fallback funcionando.
  - Em ambos os casos, o botão "Modo demonstração" no erro simula a descoberta do ponto atual
    corretamente, sem travar a aplicação.
- **Layout mobile**: testado em viewport de celular (~390–500px de largura), sem elementos
  cortados ou sobrepostos de forma quebrada.
- Durante a implementação, alguns problemas técnicos foram encontrados e corrigidos:
  - O import da MindAR quebrava o pré-empacotamento de dependências do Vite em desenvolvimento
    (resolvido com `optimizeDeps.exclude`/`include` em `vite.config.ts`).
  - O pacote `canvas` (nativo, dependência transitiva da MindAR) falhou ao compilar tanto neste
    Windows quanto no ambiente de build do Vercel (Linux) — nenhum dos dois tinha o toolchain de
    build nativo necessário. Como o jogo usa só a `Compiler`/`Controller` da MindAR que rodam no
    navegador (nunca importam `canvas`), resolvemos definitivamente com um `overrides` no
    `package.json` substituindo `canvas` por um pacote vazio — `npm install` passa a funcionar em
    qualquer ambiente sem precisar de compilador C++.

## O que depende de um celular real (não verificável neste ambiente)

- **Reconhecimento real do marcador impresso por uma câmera física em movimento**: ângulo,
  distância, iluminação e qualidade de impressão reais só podem ser validados com um celular e os
  cartões impressos de verdade.
- **Concessão de permissão de câmera por um usuário real**: este ambiente tem uma câmera real
  disponível, mas a concessão da permissão do navegador é uma ação humana (popup nativo do
  sistema) que a automação não consegue confirmar sozinha — os caminhos de erro foram validados
  por mock (ver acima), mas o caminho de **sucesso** (câmera concedida, vídeo ao vivo, marcador
  reconhecido) depende de um teste manual.
- **Comportamento em iPhone/Safari real**: o código não depende de nenhuma API exclusiva de
  Android, mas o teste real da experiência (permissão de câmera, orientação de vídeo, etc.) num
  iPhone físico não foi feito aqui.
- **Teste do fluxo de HTTPS local (mkcert) em rede Wi-Fi real**, incluindo o aviso de certificado
  não confiável no navegador do celular e a aceitação manual desse aviso.

## Limitações conhecidas do MVP (por decisão de escopo, não bugs)

- Identificação do ponto físico depende do reconhecimento do marcador impresso pela câmera — sem
  GPS, sem validação automática além disso.
- Bundle de produção dividido em dois chunks: ~2 MB (525 KB gzip) pro jogo base e ~1,8 MB
  (310 KB gzip) pra AR, carregado só sob demanda — aceitável para um protótipo, mas o TensorFlow.js
  (dependência da MindAR) é inerentemente pesado; não há como reduzir isso mantendo a mesma
  biblioteca de rastreamento.
- Sem autenticação, multiplayer, ranking online, painel administrativo, banco de dados, GPS, chat
  ou integrações pagas — nenhum desses itens existe, nem como simulação.
