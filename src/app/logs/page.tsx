
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';
import { getLogs, clearAllLogs } from '@/lib/logStorage';
import type { Log, LogAction } from '@/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { History, PlusCircle, Trash2, Edit3, Share2, UploadCloud, Loader2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import Image from 'next/image';

const iconMap: Record<LogAction, LucideIcon> = {
  CREATE: PlusCircle,
  UPDATE: Edit3,
  DELETE: Trash2,
  EXPORT: Share2,
  IMPORT: UploadCloud,
};

const colorMap: Record<LogAction, string> = {
    CREATE: 'text-primary',
    UPDATE: 'text-accent',
    DELETE: 'text-destructive',
    EXPORT: 'text-blue-500',
    IMPORT: 'text-purple-500',
};

export default function LogsPage() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [isClearAlertOpen, setIsClearAlertOpen] = useState(false);
  const { toast } = useToast();

  const loadLogs = () => {
    setLogs(getLogs());
    setLoading(false);
  };

  useEffect(() => {
    loadLogs();

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'financialApp_logs') {
        loadLogs();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const handleClearLogs = () => {
    clearAllLogs();
    setLogs([]);
    setIsClearAlertOpen(false);
    toast({
      title: 'Logs Limpos',
      description: 'O histórico de atividades foi apagado com sucesso.',
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Carregando Histórico...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
            <h1 className="text-3xl font-bold font-headline">Histórico de Atividades</h1>
            <p className="text-muted-foreground">Veja um registro de todas as alterações salvas no sistema.</p>
        </div>
        <Button variant="outline" onClick={() => setIsClearAlertOpen(true)} disabled={logs.length === 0}>
          <Trash2 className="mr-2 h-4 w-4" />
          Limpar Histórico
        </Button>
      </div>
      
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-xl">Registros Recentes</CardTitle>
          <CardDescription>
            {logs.length > 0 ? `Exibindo os ${logs.length} registros mais recentes.` : 'Nenhuma atividade registrada ainda.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {logs.length > 0 ? (
            <ScrollArea className="h-[60vh]">
              <div className="space-y-6 pr-4">
                {logs.map((log) => {
                  const Icon = iconMap[log.action] || History;
                  const iconColor = colorMap[log.action] || 'text-muted-foreground';
                  return (
                    <div key={log.id} className="flex items-start gap-4">
                      <div className={`mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-muted ${iconColor}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{log.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(log.timestamp), "dd 'de' MMMM 'de' yyyy, 'às' HH:mm:ss", { locale: ptBR })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          ) : (
            <div className="text-center py-10">
              <Image src="https://placehold.co/300x200.png" alt="Histórico vazio" width={300} height={200} className="mx-auto mb-4 rounded-md" data-ai-hint="lista vazia documento" />
              <p className="text-muted-foreground">Quando você adicionar ou excluir itens, os registros aparecerão aqui.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={isClearAlertOpen} onOpenChange={setIsClearAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Limpeza do Histórico</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja apagar permanentemente todos os registros de atividade? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleClearLogs} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Sim, Limpar Tudo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
