
import type { Metadata } from 'next';
import Link from 'next/link';
import {
  LayoutDashboard,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Settings,
  History,
} from 'lucide-react';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import Logo from '@/components/Logo';
import MobileNavigation from '@/components/layout/MobileNavigation'; 

export const metadata: Metadata = {
  title: 'Fluxo Financeiro',
  description: 'Controle suas receitas e despesas de forma eficaz.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Alegreya:wght@400;500;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=PT+Sans:wght@400;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <SidebarProvider defaultOpen={true}>
          <Sidebar collapsible="icon" variant="sidebar" side="left" className="border-r">
            <SidebarHeader>
              <Logo />
            </SidebarHeader>
            <SidebarContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Painel">
                    <Link href="/">
                      <LayoutDashboard className="text-sky-600 dark:text-sky-500" />
                      <span>Painel</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Registrar Receita">
                    <Link href="/income">
                      <TrendingUp className="text-blue-600 dark:text-blue-500" />
                      <span>Receitas</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Registrar Despesa">
                    <Link href="/expenses">
                      <TrendingDown className="text-destructive" />
                      <span>Despesas</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Ver Relatórios">
                    <Link href="/reports">
                      <BarChart3 className="text-emerald-600 dark:text-emerald-500" />
                      <span>Relatórios</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Histórico de Atividades">
                    <Link href="/logs">
                      <History className="text-orange-500 dark:text-orange-400" />
                      <span>Histórico</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                   <SidebarMenuButton asChild tooltip="Configurações">
                    <Link href="/settings">
                      <Settings className="text-violet-600 dark:text-violet-500" />
                      <span>Configurações</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarContent>
            <SidebarFooter>
              {/* O SidebarFooter agora está vazio de itens de menu principais */}
            </SidebarFooter>
          </Sidebar>

          <SidebarInset>
            <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:h-16 sm:px-6 md:hidden">
              <SidebarTrigger className="md:hidden"> 
              </SidebarTrigger>
              <div className="flex-1">
                <h1 className="font-headline text-lg font-semibold">Fluxo Financeiro</h1>
              </div>
            </header>
            <main className="flex-1 p-4 pb-20 sm:p-6 md:pb-6">
              {children}
            </main>
          </SidebarInset>
        </SidebarProvider>
        <Toaster />
        <MobileNavigation />
      </body>
    </html>
  );
}
