# Roteiro de apresentação — Missão Tesouro (≈ 3 minutos)

Objetivo: mostrar a proposta da atividade rodando de verdade, sem depender de rede/hardware de
AR durante a reunião. Use o **Modo demonstração** como espinha dorsal da apresentação; mencione a
AR real como o "próximo nível" para o dia do evento.

## 0:00 – 0:20 · Abertura

> "Isso aqui é o protótipo do 'Missão Tesouro' — a atividade que quero propor pro evento dos
> jovens. Em vez de só descrever, preferi já trazer funcionando."

Abra a tela inicial (celular ou navegador). Mostre o nome, o slogan e os dois botões principais.

## 0:20 – 0:45 · A ideia em uma frase

> "A turma passa por 3 pontos do evento, segue uma pista em cada um, e 'encontra' um objeto
> virtual em 3D ali. Junta os três, libera o tesouro final."

Digite um nome de equipe (ex.: "Os Exploradores") e clique em **Modo demonstração** — deixe claro
que esse modo existe justamente para poder mostrar tudo agora, sem precisar estar nos 3 locais
físicos.

## 0:45 – 1:45 · Jogando os 3 pontos

Para cada um dos 3 pontos (Recepção → Área de convivência → Palco):

1. Leia a pista em voz alta.
2. Toque em **Simular descoberta** — o objeto 3D aparece com uma animação suave (flutuando,
   girando).
3. Toque em **Coletar** — mostre o contador de pontos subindo e a pista seguinte aparecendo.

Fale enquanto isso:

> "Cada objeto só pode ser coletado uma vez, cada um vale 100 pontos, e a próxima pista só
> aparece depois da coleta — isso cria uma sequência guiada pelo evento inteiro."

Abra o **inventário** uma vez no meio do caminho para mostrar os itens coletados vs. pendentes.

## 1:45 – 2:15 · O tesouro final

Depois do terceiro objeto coletado, mostre a tela final: o baú 3D, o botão **Abrir tesouro**, a
animação da tampa abrindo, a mensagem final e a pontuação (300).

> "No final, a mensagem é proposital: o ponto não é a pontuação, é a experiência de equipe
> percorrendo o evento juntos."

## 2:15 – 2:45 · A parte de Realidade Aumentada

Aqui, dependendo do que tiver disponível na sala:

- **Se tiver um Android com Chrome à mão:** clique em **Começar aventura** (modo AR) e mostre a
  câmera abrindo, a busca por uma superfície e o objeto sendo ancorado ao mundo real ao tocar na
  tela.
- **Se não tiver:** explique verbalmente, mostrando o texto do README na tela:

> "A versão AR usa uma tecnologia chamada WebXR com detecção de superfície — o celular reconhece
> o chão ou uma mesa e o objeto fica 'grudado' ali, como em um jogo de realidade aumentada
> normal. Testamos com Android e Chrome; no iPhone essa tecnologia ainda não existe, então nesses
> aparelhos a gente já direciona a turma pro Modo demonstração automaticamente."

Se a AR falhar na hora (esperado em alguns aparelhos/redes), aproveite: mostre a tela de erro
amigável e o botão que leva direto pro Modo demonstração — reforçando que o app não trava, ele
sempre dá um caminho pra continuar.

## 2:45 – 3:00 · Fechamento

> "É um protótipo: sem GPS, sem validação automática de local, sem login — de propósito, pra
> ficar simples de rodar em qualquer evento. O que eu preciso de vocês agora é: essa mecânica de
> 3 pontos + objetos + tesouro final faz sentido pro formato do nosso evento?"

## Dicas rápidas para quem for apresentar

- Teste o fluxo completo (início a fim) uma vez antes da reunião, no mesmo aparelho/navegador que
  vai usar ao vivo.
- Se for demonstrar a AR de verdade, chegue 5 minutos antes para validar a rede Wi-Fi e o aviso de
  certificado no celular (ver README).
- Se algo travar, feche a aba e abra de novo — o progresso da equipe fica salvo (`localStorage`)
  e você retoma de onde parou com "Continuar partida".
