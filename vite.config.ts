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
  }
});
