import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.fluxofinanceiro.app',
  appName: 'Fluxo Financeiro',
  webDir: 'out', // Corrigido para a pasta de saída do Next.js estático
  bundledWebRuntime: false,
};

export default config;
