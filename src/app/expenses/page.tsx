'use client';

import { useState, useEffect } from 'react';
import ExpenseForm from '@/components/forms/ExpenseForm';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { Transaction } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { EXPENSE_CATEGORIES, CURRENCY_SYMBOL } from '@/lib/constants';
import Image from 'next/image';

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Transaction[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const storedExpenses = localStorage.getItem('financialFlowExpenses');
    if (storedExpenses) {
      setExpenses(JSON.parse(storedExpenses).map((t: Transaction) => ({...t, date: new Date(t.date)})));
    }
    setHydrated(true);
  }, []);
  
  useEffect(() => {
    if (hydrated) {
      localStorage.setItem('financialFlowExpenses', JSON.stringify(expenses));
    }
  }, [expenses, hydrated]);

  const handleExpenseAdded = (newExpense: Transaction) => {
    setExpenses((prevExpenses) => [newExpense, ...prevExpenses]);
  };

  if (!hydrated) {
    return <div className="flex justify-center items-center h-screen"><p>Carregando Página de Despesas...</p></div>;
  }

  const getCategoryIcon = (categoryValue?: string) => {
    const category = EXPENSE_CATEGORIES.find(cat => cat.value === categoryValue);
    return category ? <category.icon className="h-5 w-5 mr-2 inline-block text-muted-foreground" /> : null;
  };


  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">Registrar Despesas</h1>
        <p className="text-muted-foreground">Acompanhe para onde seu dinheiro está indo.</p>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-xl">Novo Registro de Despesa</CardTitle>
        </CardHeader>
        <CardContent>
          <ExpenseForm onExpenseAdded={handleExpenseAdded} />
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-xl">Despesas Recentes</CardTitle>
          <CardDescription>Exibindo suas últimas despesas registradas.</CardDescription>
        </CardHeader>
        <CardContent>
          {expenses.length > 0 ? (
             <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Data</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenses.slice(0, 10).map((expense) => ( 
                    <TableRow key={expense.id}>
                      <TableCell className="font-medium">{expense.description}</TableCell>
                      <TableCell className="flex items-center">
                        {getCategoryIcon(expense.category)}
                        {EXPENSE_CATEGORIES.find(cat => cat.value === expense.category)?.label || expense.category || '-'}
                      </TableCell>
                      <TableCell className="text-red-600">
                        {CURRENCY_SYMBOL}{expense.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell>{format(new Date(expense.date), 'dd/MM/yyyy', { locale: ptBR })}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-10">
              <Image src="https://placehold.co/300x200.png" alt="Nenhum registro de despesa" width={300} height={200} className="mx-auto mb-4 rounded-md" data-ai-hint="carteira vazia" />
              <p className="text-muted-foreground">Nenhuma despesa registrada ainda. Adicione sua primeira despesa usando o formulário acima.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
