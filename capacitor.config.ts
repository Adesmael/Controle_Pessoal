
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.fluxofinanceiro.app', // IMPORTANTE: Altere para um ID único do seu aplicativo (ex: com.seunome.fluxofinanceiro)
  appName: 'Fluxo Financeiro',
  webDir: 'out', // Pasta de saída do 'next build' com output: 'export'
  bundledWebRuntime: false, // Recomendado para a maioria dos casos
  // Para Android, você pode adicionar configurações específicas aqui:
  // android: {
  //   backgroundColor: "#ffffff", // Cor de fundo da splash screen
  //   allowMixedContent: true, // Se precisar carregar http e https
  //   path: "android" // Opcional, nome da pasta do projeto Android
  // },
  // Para iOS, configurações similares podem ser adicionadas
  // ios: {
  //   path: "ios" // Opcional, nome da pasta do projeto iOS
  // }
};

export default config;
