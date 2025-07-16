
'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { CURRENCY_SYMBOL, MONTHLY_SPENDING_GOAL_KEY, EXPENSE_CATEGORIES_STORAGE_KEY, INCOME_SOURCES_STORAGE_KEY } from '@/lib/constants';
import { Label } from '@/components/ui/label';
import { DollarSign, UploadCloud, AlertTriangle, Share2, List, Landmark, Trash2, ShieldAlert } from 'lucide-react';
import { getStoredTransactions, storeTransactions } from '@/lib/transactionStorage';
import type { Transaction } from '@/types';
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
import Link from 'next/link';
import { addLog, clearAllLogs } from '@/lib/logStorage';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';

const TRANSACTIONS_STORAGE_KEY = 'financialApp_transactions';

export default function SettingsPage() {
  const [goal, setGoal] = useState<string>('');
  const [currentGoal, setCurrentGoal] = useState<number | null>(null);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [backupToImport, setBackupToImport] = useState<{ transactions: Transaction[]; monthlyGoal: number | null } | null>(null);
  const [isImportAlertOpen, setIsImportAlertOpen] = useState(false);
  const [isClearDataAlertOpen, setIsClearDataAlertOpen] = useState(false);

  useEffect(() => {
    loadMonthlyGoal();
  }, []);

  const loadMonthlyGoal = () => {
    const storedGoal = localStorage.getItem(MONTHLY_SPENDING_GOAL_KEY);
    if (storedGoal) {
      try {
        const parsedGoal = parseFloat(storedGoal);
        if (!isNaN(parsedGoal)) {
          setCurrentGoal(parsedGoal);
          setGoal(parsedGoal.toString());
        }
      } catch (e) {
        console.error("Failed to parse stored goal:", e);
        setCurrentGoal(null);
        setGoal('');
      }
    } else {
      setCurrentGoal(null);
      setGoal('');
    }
  };


  const handleSaveGoal = () => {
    const numericGoal = parseFloat(goal);
    if (isNaN(numericGoal) || numericGoal < 0) {
      toast({
        title: 'Valor Inválido',
        description: 'Por favor, insira um valor numérico positivo para a meta.',
        variant: 'destructive',
      });
      return;
    }
    
    if (currentGoal !== numericGoal) {
      const goalFormatted = `${CURRENCY_SYMBOL}${numericGoal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      addLog({
        action: 'UPDATE',
        entity: 'GOAL',
        description: `Meta de gastos mensais alterada para ${goalFormatted}.`,
      });
    }

    localStorage.setItem(MONTHLY_SPENDING_GOAL_KEY, numericGoal.toString());
    setCurrentGoal(numericGoal);
    toast({
      title: 'Meta Salva!',
      description: `Sua nova meta de gastos mensais de ${CURRENCY_SYMBOL}${numericGoal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} foi salva.`,
    });
  };

  const performDirectDownload = (blob: Blob, fileName: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({
      title: "Download Iniciado!",
      description: "Seu backup está sendo baixado no navegador.",
      duration: 9000
    });
  };

  const handleExportBackup = async () => {
    try {
      addLog({
        action: 'EXPORT',
        entity: 'DATA',
        description: 'Backup de dados foi exportado.',
      });

      const transactions = getStoredTransactions();
      const storedMonthlyGoal = localStorage.getItem(MONTHLY_SPENDING_GOAL_KEY);
      let monthlyGoalValue = null;
      if (storedMonthlyGoal) {
        const parsed = parseFloat(storedMonthlyGoal);
        if (!isNaN(parsed)) {
            monthlyGoalValue = parsed;
        }
      }

      const backupData = {
        transactions: transactions.map(tx => ({...tx, date: tx.date instanceof Date ? tx.date.toISOString() : tx.date})),
        monthlyGoal: monthlyGoalValue,
      };

      const jsonString = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const today = new Date().toISOString().slice(0, 10);
      const fileName = `fluxo_financeiro_backup_${today}.json`;
      const file = new File([blob], fileName, { type: 'application/json' });

      // Method 1: Web Share API (Best for Mobile)
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            title: 'Backup Fluxo Financeiro',
            text: `Backup dos dados do Fluxo Financeiro de ${today}.`,
            files: [file],
          });
          toast({
            title: "Compartilhado!",
            description: "O arquivo de backup foi compartilhado com sucesso.",
          });
          return; // Success, exit
        } catch (error: any) {
          if (error.name === 'AbortError') {
            toast({
              title: "Compartilhamento Cancelado",
              description: "A ação foi cancelada pelo usuário.",
              variant: "default",
            });
            return; // User cancelled, exit
          }
          // If sharing fails for other reasons, fall through to the next method.
          console.warn('Web Share API failed, falling back:', error);
        }
      }

      // Method 2: Capacitor Filesystem (for native apps)
      if (Capacitor.isNativePlatform()) {
        try {
          const result = await Filesystem.writeFile({
            path: fileName,
            data: jsonString,
            directory: Directory.Documents,
            encoding: Encoding.UTF8,
          });
          toast({
            title: "Backup Salvo no Dispositivo!",
            description: `Arquivo salvo na sua pasta de Downloads. URI: ${result.uri}`,
            duration: 9000
          });
          return; // Success, exit
        } catch (fsError) {
          console.error("Capacitor Filesystem Error:", fsError);
          toast({
            title: "Erro ao Salvar",
            description: "Não foi possível salvar o arquivo. Verifique as permissões de armazenamento do aplicativo nas configurações do seu celular.",
            variant: "destructive",
            duration: 9000
          });
          return; // Error, exit
        }
      }

      // Method 3: Standard Browser Download (for desktop web)
      performDirectDownload(blob, fileName);
      
    } catch (error) {
      console.error("Erro ao exportar backup:", error);
      toast({
        title: "Erro ao Exportar",
        description: "Não foi possível gerar o arquivo de backup.",
        variant: "destructive",
      });
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const parsedData = JSON.parse(content);

          if (
            parsedData &&
            typeof parsedData === 'object' &&
            (Array.isArray(parsedData.transactions) || parsedData.transactions === undefined) &&
            ('monthlyGoal' in parsedData || parsedData.monthlyGoal === undefined)
          ) {
            const transactionsFromFile = parsedData.transactions || [];
            if (transactionsFromFile.some((tx: any) => typeof tx.date !== 'string' || isNaN(new Date(tx.date).getTime()))) {
               toast({ title: "Arquivo Inválido", description: "O arquivo de backup contém transações com datas em formato inválido.", variant: "destructive" });
               return;
            }
             if (parsedData.monthlyGoal !== undefined && parsedData.monthlyGoal !== null && typeof parsedData.monthlyGoal !== 'number') {
              toast({ title: "Arquivo Inválido", description: "O valor da meta de gastos no backup é inválido.", variant: "destructive" });
              return;
            }

            setBackupToImport({
                transactions: transactionsFromFile.map((tx: any) => ({
                    ...tx,
                    id: String(tx.id || crypto.randomUUID()),
                    type: String(tx.type || 'expense'),
                    description: String(tx.description || ''),
                    amount: Number(tx.amount || 0),
                    date: tx.date, 
                    created_at: String(tx.created_at || new Date().toISOString()),
                })),
                monthlyGoal: parsedData.monthlyGoal !== undefined ? parsedData.monthlyGoal : null,
            });
            setIsImportAlertOpen(true);
          } else {
            toast({ title: "Arquivo Inválido", description: "O arquivo de backup não tem o formato esperado (transações e/ou meta).", variant: "destructive" });
          }
        } catch (error) {
          console.error("Erro ao importar backup:", error);
          toast({ title: "Erro ao Ler Arquivo", description: "Não foi possível ler o arquivo de backup. Verifique se é um JSON válido.", variant: "destructive" });
        }
      };
      reader.readAsText(file);
      if(event.target) event.target.value = ''; 
    }
  };

  const handleImportConfirm = () => {
    if (backupToImport) {
      try {
        const existingTransactions = getStoredTransactions();
        const existingTransactionIds = new Set(existingTransactions.map(tx => tx.id));
        
        const newTransactionsFromBackup = backupToImport.transactions.filter(
          (txFromFile: any) => !existingTransactionIds.has(txFromFile.id)
        );

        const transactionsToStore: Transaction[] = [
          ...existingTransactions,
          ...newTransactionsFromBackup.map((tx: any) => ({
            ...tx,
            user_id: undefined, 
            type: tx.type === 'income' ? 'income' : 'expense',
            amount: Number(tx.amount),
            date: new Date(tx.date), 
            category: tx.category ? String(tx.category) : undefined,
            source: tx.source ? String(tx.source) : undefined,
          }))
        ];

        storeTransactions(transactionsToStore);

        const localMonthlyGoal = localStorage.getItem(MONTHLY_SPENDING_GOAL_KEY);
        if (localMonthlyGoal === null || localMonthlyGoal === undefined) { 
          if (backupToImport.monthlyGoal !== null && backupToImport.monthlyGoal !== undefined) {
            localStorage.setItem(MONTHLY_SPENDING_GOAL_KEY, backupToImport.monthlyGoal.toString());
          }
        } 

        addLog({
          action: 'IMPORT',
          entity: 'DATA',
          description: `Backup de dados importado. ${newTransactionsFromBackup.length} novas transações adicionadas.`,
        });

        toast({
          title: "Backup Importado!",
          description: "Novas transações do backup foram adicionadas. Os dados existentes foram mantidos. Pode ser necessário recarregar outras páginas para ver as atualizações.",
        });
        
        loadMonthlyGoal(); 
      } catch (error) {
        console.error("Erro ao processar e salvar backup:", error);
        toast({ title: "Erro ao Salvar Backup", description: "Ocorreu um erro ao salvar os dados do backup.", variant: "destructive" });
      } finally {
        setIsImportAlertOpen(false);
        setBackupToImport(null);
      }
    }
  };

  const handleClearAllData = () => {
    try {
      // Clear all relevant local storage items
      localStorage.removeItem(TRANSACTIONS_STORAGE_KEY);
      localStorage.removeItem(EXPENSE_CATEGORIES_STORAGE_KEY);
      localStorage.removeItem(INCOME_SOURCES_STORAGE_KEY);
      localStorage.removeItem(MONTHLY_SPENDING_GOAL_KEY);
      clearAllLogs(); // This also clears its own storage item

      // Dispatch storage events to notify other components/tabs
      window.dispatchEvent(new StorageEvent('storage', { key: TRANSACTIONS_STORAGE_KEY }));
      window.dispatchEvent(new StorageEvent('storage', { key: EXPENSE_CATEGORIES_STORAGE_KEY }));
      window.dispatchEvent(new StorageEvent('storage', { key: INCOME_SOURCES_STORAGE_KEY }));
      window.dispatchEvent(new StorageEvent('storage', { key: MONTHLY_SPENDING_GOAL_KEY }));
      
      // Reload the goal on this page
      loadMonthlyGoal();

      toast({
        title: 'Dados Apagados!',
        description: 'Todos os dados do aplicativo foram removidos com sucesso. As categorias foram redefinidas para o padrão.',
      });
    } catch (error) {
      console.error("Erro ao limpar todos os dados:", error);
      toast({
        title: "Erro",
        description: "Não foi possível apagar todos os dados.",
        variant: "destructive"
      });
    } finally {
      setIsClearDataAlertOpen(false);
    }
  };


  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">Configurações</h1>
        <p className="text-muted-foreground">Gerencie suas preferências, metas e dados do aplicativo.</p>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-xl flex items-center">
            <DollarSign className="mr-2 h-5 w-5 text-green-500" />
            Meta de Gastos Mensal
          </CardTitle>
          <CardDescription>
            Defina um limite para seus gastos mensais para ajudar a controlar suas finanças.
            {currentGoal !== null && (
              <span className="block mt-2 font-medium">
                Sua meta atual é: {CURRENCY_SYMBOL}{currentGoal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="spendingGoal">Definir Nova Meta ({CURRENCY_SYMBOL})</Label>
            <div className="relative mt-1">
              <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="spendingGoal"
                type="number"
                placeholder="ex: 1500,00"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                className="pl-9"
                step="0.01"
              />
            </div>
          </div>
          <Button onClick={handleSaveGoal} className="w-full sm:w-auto">
            Salvar Meta de Gastos
          </Button>
        </CardContent>
      </Card>
      
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-xl flex items-center">
            <List className="mr-2 h-5 w-5 text-blue-500" />
            Gerenciar Categorias de Despesa
          </CardTitle>
          <CardDescription>
            Adicione ou remova categorias de despesas para personalizar o aplicativo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild className="w-full sm:w-auto">
            <Link href="/settings/categories">
              Gerenciar Categorias
            </Link>
          </Button>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-xl flex items-center">
            <Landmark className="mr-2 h-5 w-5 text-purple-500" />
            Gerenciar Fontes de Receita
          </CardTitle>
          <CardDescription>
            Adicione ou remova fontes de receita para personalizar seus registros.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild className="w-full sm:w-auto">
            <Link href="/settings/income-sources">
              Gerenciar Fontes de Receita
            </Link>
          </Button>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-xl">Backup e Restauração de Dados</CardTitle>
          <CardDescription>
            Exporte seus dados (transações e meta de gastos) para um arquivo de backup ou importe de um backup existente.
            Os dados são armazenados localmente no seu navegador/dispositivo.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <Button onClick={handleExportBackup} variant="outline" className="w-full sm:w-auto">
              <Share2 className="mr-2 h-4 w-4" /> 
              Exportar / Compartilhar
            </Button>
            <Button onClick={handleImportClick} variant="outline" className="w-full sm:w-auto">
              <UploadCloud className="mr-2 h-4 w-4" />
              Importar Backup
            </Button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".json"
              className="hidden"
            />
          </div>
           <p className="text-xs text-muted-foreground">
            Ao exportar, tentaremos usar o compartilhamento do sistema (ex: WhatsApp). Se não for possível, o download iniciará.
            A importação de um backup adicionará novas transações. Transações e meta de gastos existentes não serão substituídas se já existirem.
          </p>
        </CardContent>
      </Card>

      <Card className="shadow-lg border-destructive/50">
        <CardHeader>
          <CardTitle className="font-headline text-xl flex items-center text-destructive">
            <ShieldAlert className="mr-2 h-5 w-5" />
            Zona de Perigo
          </CardTitle>
          <CardDescription>
            Ações nesta área são permanentes e não podem ser desfeitas. Use com cuidado.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" onClick={() => setIsClearDataAlertOpen(true)}>
            <Trash2 className="mr-2 h-4 w-4" />
            Limpar Todos os Dados
          </Button>
        </CardContent>
      </Card>


      <AlertDialog open={isImportAlertOpen} onOpenChange={setIsImportAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2 text-yellow-500" />
                Confirmar Importação de Backup
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza de que deseja importar os dados deste arquivo? 
              Novas transações do arquivo serão adicionadas. 
              Transações existentes com os mesmos IDs não serão alteradas.
              A meta de gastos só será atualizada se nenhuma meta estiver definida localmente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setIsImportAlertOpen(false); setBackupToImport(null); }}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleImportConfirm}
              className="bg-primary hover:bg-primary/90"
            >
              Sim, Importar Dados
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isClearDataAlertOpen} onOpenChange={setIsClearDataAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2 text-destructive" />
              Confirmar Exclusão de Todos os Dados
            </AlertDialogTitle>
            <AlertDialogDescription>
              Você tem certeza absoluta? Esta ação é <strong>permanente</strong> e <strong>irreversível</strong>. 
              Todos os seus registros de transações, categorias, fontes, metas e histórico serão apagados. 
              É recomendável exportar um backup antes de continuar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleClearAllData}
              className="bg-destructive hover:bg-destructive/90"
            >
              Sim, Apagar Tudo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
