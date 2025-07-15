
'use client';

import { useState, useEffect, useMemo } from 'react';
import IncomeForm from '@/components/forms/IncomeForm';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { Transaction } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CURRENCY_SYMBOL } from '@/lib/constants';
import Image from 'next/image';
import { Trash2, Loader2 } from 'lucide-react';
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
import { useToast } from "@/hooks/use-toast";
import { getStoredTransactions, addStoredTransaction, deleteStoredTransactions } from '@/lib/transactionStorage';

export default function IncomePage() {
  const [incomes, setIncomes] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const { toast } = useToast();

  const isAllSelected = useMemo(() => incomes.length > 0 && selectedIds.size === incomes.length, [incomes, selectedIds]);

  useEffect(() => {
    const loadIncomes = () => {
      const allTransactions = getStoredTransactions();
      setIncomes(allTransactions.filter(tx => tx.type === 'income').sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      setLoading(false);
    };
    loadIncomes();
     const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'financialApp_transactions') {
        loadIncomes();
        setSelectedIds(new Set()); 
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleIncomeAdded = (newIncomeData: Omit<Transaction, 'id' | 'type' | 'created_at'>) => {
    const newIncome = addStoredTransaction(newIncomeData, 'income');
    if (newIncome) {
      setIncomes((prevIncomes) => [newIncome, ...prevIncomes].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      toast({
        title: "Receita Adicionada!",
        description: `A receita "${newIncome.description}" foi salva localmente.`,
      });
    } else {
      toast({
        title: "Erro ao Adicionar Receita",
        description: "Não foi possível salvar a receita localmente.",
        variant: "destructive",
      });
    }
  };

  const handleSelectAll = (checked: boolean | 'indeterminate') => {
    if (checked === true) {
      const allIds = new Set(incomes.map(i => i.id));
      setSelectedIds(allIds);
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    const newSelectedIds = new Set(selectedIds);
    if (checked) {
      newSelectedIds.add(id);
    } else {
      newSelectedIds.delete(id);
    }
    setSelectedIds(newSelectedIds);
  };

  const handleDeleteConfirm = async () => {
    if (selectedIds.size === 0) return;
    const idsToDelete = Array.from(selectedIds);
    const success = deleteStoredTransactions(idsToDelete);
    if (success) {
      setIncomes((prevIncomes) => prevIncomes.filter(inc => !idsToDelete.includes(inc.id)));
      toast({
        title: `${idsToDelete.length} Receita(s) Excluída(s)!`,
        description: 'As receitas selecionadas foram removidas do armazenamento local.',
      });
      setSelectedIds(new Set());
    } else {
      toast({
        title: "Erro ao Excluir",
        description: "Não foi possível excluir as receitas do armazenamento local.",
        variant: "destructive",
      });
    }
    setIsDeleteAlertOpen(false);
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Carregando Receitas...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">Registrar Receita</h1>
        <p className="text-muted-foreground">Registre todas as suas fontes de receita aqui. Os dados serão salvos localmente no seu dispositivo.</p>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-xl">Novo Registro de Receita</CardTitle>
        </CardHeader>
        <CardContent>
          <IncomeForm onIncomeAdded={handleIncomeAdded} />
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-xl">Receitas Recentes</CardTitle>
          <CardDescription>Exibindo suas últimas receitas registradas localmente.</CardDescription>
        </CardHeader>
        <CardContent>
            {selectedIds.size > 0 && (
                <div className="mb-4 p-3 bg-muted rounded-md flex justify-between items-center">
                    <span className="text-sm font-medium">{selectedIds.size} item(s) selecionado(s)</span>
                    <Button variant="destructive" size="sm" onClick={() => setIsDeleteAlertOpen(true)}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Excluir Selecionados
                    </Button>
                </div>
            )}
          {incomes.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                     <TableHead className="w-[40px]">
                        <Checkbox 
                          checked={isAllSelected}
                          onCheckedChange={handleSelectAll}
                          aria-label="Selecionar todas as receitas"
                        />
                    </TableHead>
                    <TableHead className="font-bold">Descrição</TableHead>
                    <TableHead className="font-bold">Valor</TableHead>
                    <TableHead className="font-bold">Data</TableHead>
                    <TableHead className="text-right font-bold">Fonte</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {incomes.map((income) => ( 
                    <TableRow key={income.id} data-state={selectedIds.has(income.id) ? 'selected' : undefined}>
                       <TableCell>
                            <Checkbox 
                              checked={selectedIds.has(income.id)}
                              onCheckedChange={(checked) => handleSelectOne(income.id, !!checked)}
                              aria-label={`Selecionar receita ${income.description}`}
                            />
                        </TableCell>
                      <TableCell className="font-medium">{income.description}</TableCell>
                      <TableCell className="text-primary"> 
                        {CURRENCY_SYMBOL}{Number(income.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell>{format(new Date(income.date), 'dd/MM/yyyy', { locale: ptBR })}</TableCell>
                      <TableCell className="text-right">{income.source || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-10">
              <Image src="https://placehold.co/300x200.png" alt="Nenhum registro de receita" width={300} height={200} className="mx-auto mb-4 rounded-md" data-ai-hint="dinheiro" />
              <p className="text-muted-foreground">Nenhuma receita registrada ainda. Adicione sua primeira receita usando o formulário acima.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir as {selectedIds.size} receitas selecionadas do armazenamento local? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsDeleteAlertOpen(false)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
