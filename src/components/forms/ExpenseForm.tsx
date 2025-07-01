
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Check, ChevronsUpDown } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CURRENCY_SYMBOL } from '@/lib/constants';
import type { Transaction, ExpenseCategory } from '@/types';
import React, { useState, useEffect } from 'react';
import { getStoredExpenseCategories } from '@/lib/categoryStorage';
import { getIcon } from '@/lib/iconMap';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';


const formSchema = z.object({
  description: z.string().min(2, { message: 'A descrição deve ter pelo menos 2 caracteres.' }).max(100),
  amount: z.coerce.number().positive({ message: 'O valor deve ser positivo.' }),
  date: z.date({ required_error: 'A data é obrigatória.' }),
  category: z.string({ required_error: 'Por favor, selecione uma categoria.' }),
  expenseSubtype: z.enum(['fixed', 'variable'], { required_error: 'Selecione se a despesa é fixa ou variável.' }),
});

type ExpenseFormValues = z.infer<typeof formSchema>;

interface ExpenseFormProps {
  onExpenseAdded: (expenseData: Omit<Transaction, 'id' | 'type' | 'created_at'>) => void;
}

export default function ExpenseForm({ onExpenseAdded }: ExpenseFormProps) {
  const [expenseCategories, setExpenseCategories] = useState<ExpenseCategory[]>([]);
  
  useEffect(() => {
    setExpenseCategories(getStoredExpenseCategories());
  
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'financialApp_expense_categories') {
        setExpenseCategories(getStoredExpenseCategories());
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: '',
      amount: '' as unknown as number,
      date: new Date(),
      category: undefined,
      expenseSubtype: 'variable',
    },
  });

  function onSubmit(values: ExpenseFormValues) {
    onExpenseAdded({
      description: values.description,
      amount: values.amount,
      date: values.date,
      category: values.category,
      expenseSubtype: values.expenseSubtype,
    });
    form.reset();
    form.setValue('amount', '' as unknown as number);
    form.setValue('date', new Date());
    form.setValue('category', '');
    form.setValue('description', '');
    form.setValue('expenseSubtype', 'variable');
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição</FormLabel>
              <FormControl>
                <Input placeholder="ex: Supermercado, Ingressos de cinema" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Valor ({CURRENCY_SYMBOL})</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="ex: 50,00" {...field} step="0.01" value={field.value === undefined || field.value === null || isNaN(Number(field.value)) ? '' : field.value} onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))}/>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Data da Despesa</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={'outline'}
                        className={cn(
                          'w-full pl-3 text-left font-normal',
                          !field.value && 'text-muted-foreground'
                        )}
                      >
                        {field.value ? format(field.value, 'P', { locale: ptBR }) : <span>Escolha uma data</span>}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) => date > new Date() || date < new Date('1900-01-01')}
                      initialFocus
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Categoria</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      role="combobox"
                      className={cn(
                        "w-full justify-between",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value
                        ? expenseCategories.find(
                            (category) => category.value === field.value
                          )?.label
                        : "Selecione a categoria"}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command>
                    <CommandInput placeholder="Buscar categoria..." />
                    <CommandList>
                      <CommandEmpty>Nenhuma categoria encontrada.</CommandEmpty>
                      <CommandGroup>
                        {expenseCategories.map((category) => {
                          const Icon = getIcon(category.icon);
                          return (
                            <CommandItem
                              value={category.label}
                              key={category.value}
                              onSelect={() => {
                                form.setValue("category", category.value)
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  category.value === field.value
                                    ? "opacity-100"
                                    : "opacity-0"
                                )}
                              />
                              <Icon className="mr-2 h-4 w-4 text-muted-foreground" />
                              {category.label}
                            </CommandItem>
                          );
                        })}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="expenseSubtype"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel>Tipo de Despesa</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="flex items-center gap-4"
                >
                  <FormItem className="flex items-center space-x-2 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="variable" id="variable"/>
                    </FormControl>
                    <FormLabel htmlFor="variable" className="font-normal">Variável</FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-2 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="fixed" id="fixed"/>
                    </FormControl>
                    <FormLabel htmlFor="fixed" className="font-normal">Fixa</FormLabel>
                  </FormItem>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full sm:w-auto">Registrar Despesa</Button>
      </form>
    </Form>
  );
}
