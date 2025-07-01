
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trash2, PlusCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { ExpenseCategory } from '@/types';
import { getStoredExpenseCategories, addStoredExpenseCategory, deleteStoredExpenseCategory } from '@/lib/categoryStorage';
import { getIcon } from '@/lib/iconMap';
import { useForm, type SubmitHandler } from 'react-hook-form';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
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

const formSchema = z.object({
  label: z.string().min(2, { message: "O nome deve ter pelo menos 2 caracteres." }).max(50, { message: "O nome não pode ter mais de 50 caracteres." }),
});

type FormValues = z.infer<typeof formSchema>;

export default function CategoriesPage() {
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryToDelete, setCategoryToDelete] = useState<ExpenseCategory | null>(null);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      label: '',
    },
  });

  useEffect(() => {
    loadCategories();
    
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'financialApp_expense_categories') {
        loadCategories();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const loadCategories = () => {
    setLoading(true);
    setCategories(getStoredExpenseCategories());
    setLoading(false);
  };

  const onSubmit: SubmitHandler<FormValues> = (data) => {
    const result = addStoredExpenseCategory(data.label);
    if (result.success) {
      toast({
        title: "Categoria Adicionada!",
        description: `A categoria "${data.label}" foi criada.`,
      });
      loadCategories(); // Reload categories from storage
      form.reset();
    } else {
      toast({
        title: "Erro",
        description: result.message,
        variant: "destructive",
      });
    }
  };

  const openDeleteDialog = (category: ExpenseCategory) => {
    setCategoryToDelete(category);
  };

  const handleDeleteConfirm = () => {
    if (!categoryToDelete) return;
    const success = deleteStoredExpenseCategory(categoryToDelete.value);
    if (success) {
      toast({
        title: "Categoria Excluída",
        description: `A categoria "${categoryToDelete.label}" foi removida.`,
      });
      setCategories(prev => prev.filter(cat => cat.value !== categoryToDelete.value));
    } else {
      toast({
        title: "Erro ao Excluir",
        description: "Não foi possível excluir a categoria.",
        variant: "destructive",
      });
    }
    setCategoryToDelete(null);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Carregando Categorias...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">Gerenciar Categorias de Despesa</h1>
        <p className="text-muted-foreground">Adicione e remova categorias para personalizar o aplicativo.</p>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-xl">Adicionar Nova Categoria</CardTitle>
          <CardDescription>Novas categorias receberão um ícone padrão.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col sm:flex-row gap-4 items-end">
              <FormField
                control={form.control}
                name="label"
                render={({ field }) => (
                  <FormItem className="flex-grow">
                    <FormLabel>Nome da Categoria</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Viagens, Assinaturas" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full sm:w-auto">
                <PlusCircle className="mr-2 h-4 w-4" />
                Adicionar
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
      
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-xl">Categorias Existentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-bold">Ícone</TableHead>
                  <TableHead className="font-bold">Nome da Categoria</TableHead>
                  <TableHead className="text-right font-bold">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((category) => {
                  const Icon = getIcon(category.icon);
                  return (
                    <TableRow key={category.value}>
                      <TableCell>
                        <Icon className="h-5 w-5 text-muted-foreground" />
                      </TableCell>
                      <TableCell className="font-medium">{category.label}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => openDeleteDialog(category)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                          <span className="sr-only">Excluir</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={!!categoryToDelete} onOpenChange={(isOpen) => { if(!isOpen) setCategoryToDelete(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza de que deseja excluir a categoria "{categoryToDelete?.label}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setCategoryToDelete(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
