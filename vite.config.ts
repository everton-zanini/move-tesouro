import { defineConfig } from 'vite';
import mkcert from 'vite-plugin-mkcert';

// HTTPS local via mkcert é necessário porque WebXR/getUserMedia só funcionam
// em contexto seguro (https) fora de localhost — assim dá para testar no
// celular acessando o IP do computador na mesma rede Wi-Fi.
// (desativado automaticamente com VITE_NO_HTTPS=1, usado só para verificação
// automatizada em ambiente sem suporte a prompt interativo do mkcert)
const semHttps = process.env.VITE_NO_HTTPS === '1';

export default defineConfig({
  plugins: semHttps ? [] : [mkcert()],
  server: {
    https: !semHttps,
    host: true
  },
  // O import `?worker&inline` da MindAR só é entendido pelo pipeline de dev
  // do Vite, não pelo esbuild usado no pré-bundling de dependências — excluir
  // evita o erro "No matching export ... for import default".
  optimizeDeps: {
    exclude: ['mind-ar'],
    // Dependências transitivas CJS usadas dentro da árvore da MindAR (que fica
    // fora do pré-bundling por causa do exclude acima) precisam ser incluídas
    // manualmente para ganhar a conversão CJS -> ESM do esbuild.
    include: ['@tensorflow/tfjs', 'long', 'seedrandom']
  },
  worker: {
    format: 'es'
  }
});
