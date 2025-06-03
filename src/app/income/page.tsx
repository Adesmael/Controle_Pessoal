
'use client';

import { useState, useEffect } from 'react';
import IncomeForm from '@/components/forms/IncomeForm';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { Transaction, TransactionType } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CURRENCY_SYMBOL } from '@/lib/constants';
import Image from 'next/image';
import { Trash2, Loader2, AlertTriangle } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/lib/supabaseClient';

export default function IncomePage() {
  const [incomes, setIncomes] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    fetchIncomes();
  }, []);

  async function fetchIncomes() {
    if (!supabase) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('type', 'income')
      .order('date', { ascending: false });

    if (error) {
      console.error('Erro ao buscar receitas:', error);
      toast({ 
        title: 'Erro ao buscar receitas!', 
        description: error.message || 'Não foi possível conectar ao banco de dados ou buscar os dados.', 
        variant: 'destructive' 
      });
      setIncomes([]);
    } else if (data) {
      setIncomes(data.map(t => ({...t, id: t.id as string, date: new Date(t.date), type: t.type as TransactionType })));
    }
    setLoading(false);
  }

  const handleIncomeAdded = async (newIncomeData: Omit<Transaction, 'id' | 'type' | 'created_at'>) => {
    if (!supabase) return;
    setLoading(true);
    const incomeToInsert = {
      id: crypto.randomUUID(), // Adiciona a geração de ID
      type: 'income' as 'income',
      description: newIncomeData.description,
      amount: newIncomeData.amount,
      date: format(newIncomeData.date, 'yyyy-MM-dd'),
      source: newIncomeData.source,
    };

    const { data, error } = await supabase
      .from('transactions')
      .insert([incomeToInsert])
      .select()
      .single();

    setLoading(false);
    if (error) {
      console.error('Erro ao adicionar receita:', error);
      toast({ 
        title: 'Erro ao adicionar receita!', 
        description: error.message || 'Não foi possível salvar a receita no banco de dados.', 
        variant: 'destructive' 
      });
    } else if (data) {
      setIncomes((prevIncomes) => [{ ...data, id: data.id as string, date: new Date(data.date), type: data.type as TransactionType }, ...prevIncomes]);
      toast({
        title: "Receita Adicionada!",
        description: `A receita "${data.description}" foi adicionada com sucesso.`,
      });
    }
  };

  const openDeleteDialog = (transaction: Transaction) => {
    setTransactionToDelete(transaction);
  };

  const handleDeleteConfirm = async () => {
    if (!supabase || !transactionToDelete) return;
    setLoading(true);
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', transactionToDelete.id);

    setLoading(false);
    if (error) {
      console.error('Erro ao excluir receita:', error);
      toast({ 
        title: 'Erro ao excluir receita!', 
        description: error.message || 'Não foi possível remover a receita do banco de dados.', 
        variant: 'destructive' 
      });
    } else {
      setIncomes((prevIncomes) => prevIncomes.filter(inc => inc.id !== transactionToDelete.id));
      toast({
        title: "Receita Excluída!",
        description: `A receita "${transactionToDelete.description}" foi excluída com sucesso.`,
      });
    }
    setTransactionToDelete(null); 
  };
  
  if (!supabase) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-center p-4 bg-background text-foreground">
        <AlertTriangle className="h-16 w-16 text-destructive mb-6" />
        <h1 className="text-2xl font-bold mb-4 text-destructive">Supabase Não Configurado</h1>
        <p className="mb-2">As variáveis de ambiente do Supabase (URL e Chave Anônima) não foram encontradas.</p>
        <p className="mb-2">Por favor, crie um arquivo <code>.env.local</code> na raiz do projeto com o seguinte conteúdo:</p>
        <pre className="bg-muted p-3 rounded-md text-sm my-3 text-left shadow">
          {`NEXT_PUBLIC_SUPABASE_URL=SUA_URL_AQUI\nNEXT_PUBLIC_SUPABASE_ANON_KEY=SUA_CHAVE_AQUI`}
        </pre>
        <p className="text-sm text-muted-foreground mb-1">Substitua <code>SUA_URL_AQUI</code> e <code>SUA_CHAVE_AQUI</code> com suas credenciais do Supabase.</p>
        <p className="mb-4">Após criar ou modificar o arquivo, <strong className="text-primary">reinicie o servidor de desenvolvimento</strong>.</p>
        <p className="text-muted-foreground mt-4">A página de Receitas estará indisponível até que o Supabase seja configurado.</p>
      </div>
    );
  }

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
        <p className="text-muted-foreground">Registre todas as suas fontes de receita aqui.</p>
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
          <CardDescription>Exibindo suas últimas receitas registradas.</CardDescription>
        </CardHeader>
        <CardContent>
          {incomes.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Fonte</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {incomes.map((income) => ( 
                    <TableRow key={income.id}>
                      <TableCell className="font-medium">{income.description}</TableCell>
                      <TableCell> {/* Removido text-green-600 para usar o tema */}
                        {CURRENCY_SYMBOL}{Number(income.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell>{format(new Date(income.date), 'dd/MM/yyyy', { locale: ptBR })}</TableCell>
                      <TableCell>{income.source || '-'}</TableCell>
                      <TableCell className="text-right">
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" onClick={() => openDeleteDialog(income)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                      </TableCell>
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

      <AlertDialog open={!!transactionToDelete} onOpenChange={(isOpen) => { if(!isOpen) setTransactionToDelete(null)}}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a receita "{transactionToDelete?.description}" no valor de {CURRENCY_SYMBOL}{Number(transactionToDelete?.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setTransactionToDelete(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

