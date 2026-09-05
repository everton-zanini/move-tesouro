// Conteúdo do jogo centralizado: pistas, pontos, textos e cores.
// Editar aqui é o único lugar necessário para trocar as pistas/pontos de um evento.

export type ObjectKind = 'cristal' | 'estrela' | 'chave';

export interface TreasurePoint {
  id: string;
  nome: string;
  pista: string;
  objetoNome: string;
  objetoTipo: ObjectKind;
  /** Cor principal do objeto 3D em RGB normalizado (0..1) */
  cor: [number, number, number];
  /**
   * Índice do marcador impresso deste ponto dentro de public/markers/targets.mind
   * (a ordem em que a imagem entrou na compilação — ver tools/markerArt.ts).
   * Precisa bater com a ordem usada em tools/compile-markers.ts.
   */
  markerIndex: number;
}

export const PONTOS: TreasurePoint[] = [
  {
    id: 'recepcao',
    nome: 'Recepção',
    pista: 'Toda aventura começa com uma boa acolhida.',
    objetoNome: 'Cristal Azul',
    objetoTipo: 'cristal',
    cor: [0.16, 0.52, 0.95],
    markerIndex: 0
  },
  {
    id: 'convivencia',
    nome: 'Área de convivência',
    pista: 'Procure onde a turma se reúne para conversar.',
    objetoNome: 'Estrela Dourada',
    objetoTipo: 'estrela',
    cor: [0.98, 0.76, 0.18],
    markerIndex: 1
  },
  {
    id: 'palco',
    nome: 'Palco',
    pista: 'Onde a voz ganha força e todos prestam atenção.',
    objetoNome: 'Chave Roxa',
    objetoTipo: 'chave',
    cor: [0.62, 0.32, 0.9],
    markerIndex: 2
  }
];

export const PONTOS_POR_COLETA = 100;
export const PONTUACAO_MAXIMA = PONTOS.length * PONTOS_POR_COLETA;

export const TEXTOS = {
  tituloJogo: 'Missão Tesouro',
  slogan: 'Siga as pistas, encontre os tesouros escondidos pelo evento e desbloqueie a recompensa final — em equipe!',
  labelNomeEquipe: 'Nome da equipe',
  placeholderNomeEquipe: 'Ex: Os Exploradores',
  botaoComecar: 'Começar aventura',
  botaoDemo: 'Modo demonstração',
  botaoContinuar: 'Continuar partida',
  avisoNomeEquipe: 'Digite o nome da equipe para começar!',

  progresso: (coletados: number, total: number) => `${coletados} de ${total} tesouros`,
  botaoProcurarAR: 'Procurar tesouro',
  botaoSimularDemo: 'Simular descoberta',
  botaoColetar: 'Coletar',
  botaoVerInventario: 'Ver inventário',
  badgeDemo: 'MODO DEMONSTRAÇÃO',

  avisoLocalSimplificado:
    'Neste protótipo, a confirmação do local é feita por você mesmo, tocando no botão — sem GPS ou verificação automática do ambiente.',

  arInstrucaoBuscando: (numeroPonto: number) => `Aponte a câmera para o marcador impresso do ponto ${numeroPonto}…`,
  arInstrucaoEncontrado: 'Marcador encontrado! Mantenha a câmera apontada para ele.',
  arBotaoSair: 'Sair da câmera',
  arErroSemSuporte: 'Este navegador não tem acesso à câmera (getUserMedia).',
  arErroCameraNegada: 'A câmera foi bloqueada. Permita o acesso à câmera nas configurações do navegador e tente novamente.',
  arErroCameraNaoEncontrada: 'Não encontramos uma câmera neste dispositivo.',
  arErroFalhaGenerica: 'Não foi possível iniciar a experiência de AR agora.',
  arSugestaoDemo: 'Você pode continuar a aventura no Modo demonstração enquanto isso.',

  inventarioTitulo: 'Inventário',
  inventarioPontuacao: (pontos: number) => `Pontuação: ${pontos} pts`,
  inventarioColetado: 'Coletado',
  inventarioPendente: 'Ainda não encontrado',

  finalTitulo: 'Tesouro encontrado!',
  botaoAbrirBau: 'Abrir tesouro',
  mensagemFinal: 'O maior tesouro é viver essa aventura juntos!',
  botaoReiniciar: 'Reiniciar aventura',
  confirmarReinicioTitulo: 'Reiniciar aventura?',
  confirmarReinicioTexto: 'Isso vai apagar o progresso salvo desta equipe. Tem certeza?',
  confirmarReinicioSim: 'Sim, reiniciar',
  confirmarReinicioNao: 'Cancelar'
};

export const CORES = {
  fundoInicio: '#151233',
  fundoDegrade: 'linear-gradient(160deg, #151233 0%, #241a4d 55%, #341856 100%)',
  dourado: '#f2c14e',
  douradoForte: '#e0a72b',
  roxo: '#8a4fd6',
  azul: '#2f85f2',
  textoClaro: '#f6f3ff',
  textoSecundario: '#c9c2ea'
};
