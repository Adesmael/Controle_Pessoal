
'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { CURRENCY_SYMBOL, MONTHLY_SPENDING_GOAL_KEY } from '@/lib/constants';
import { Label } from '@/components/ui/label';
import { DollarSign, DownloadCloud, UploadCloud, AlertTriangle } from 'lucide-react';
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

export default function SettingsPage() {
  const [goal, setGoal] = useState<string>('');
  const [currentGoal, setCurrentGoal] = useState<number | null>(null);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [backupToImport, setBackupToImport] = useState<{ transactions: Transaction[]; monthlyGoal: number | null } | null>(null);
  const [isImportAlertOpen, setIsImportAlertOpen] = useState(false);

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
    localStorage.setItem(MONTHLY_SPENDING_GOAL_KEY, numericGoal.toString());
    setCurrentGoal(numericGoal);
    toast({
      title: 'Meta Salva!',
      description: `Sua nova meta de gastos mensais de ${CURRENCY_SYMBOL}${numericGoal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} foi salva.`,
    });
  };

  const handleExportBackup = () => {
    try {
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
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const today = new Date().toISOString().slice(0, 10);
      a.download = `fluxo_financeiro_backup_${today}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Backup Exportado!",
        description: "No Android: Verifique a notificação de 'Download Concluído' do sistema. Clique nela para abrir o arquivo. Se não vir, procure na pasta 'Downloads' usando o app 'Arquivos'.",
        duration: 9000 // Aumenta a duração para dar tempo de ler
      });
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
          <CardTitle className="font-headline text-xl">Backup e Restauração de Dados</CardTitle>
          <CardDescription>
            Exporte seus dados (transações e meta de gastos) para um arquivo de backup ou importe de um backup existente.
            Os dados são armazenados localmente no seu navegador/dispositivo.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <Button onClick={handleExportBackup} variant="outline" className="w-full sm:w-auto">
              <DownloadCloud className="mr-2 h-4 w-4" />
              Exportar Backup
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
            A importação de um backup adicionará novas transações. Transações e meta de gastos existentes não serão substituídas se já existirem.
          </p>
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
    </div>
  );
}
