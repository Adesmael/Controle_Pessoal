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
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { INCOME_SOURCES, CURRENCY_SYMBOL } from '@/lib/constants';
import type { Transaction } from '@/types';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import React from 'react';

const formSchema = z.object({
  description: z.string().min(2, { message: 'A descrição deve ter pelo menos 2 caracteres.' }).max(100),
  amount: z.coerce.number().positive({ message: 'O valor deve ser positivo.' }),
  date: z.date({ required_error: 'A data é obrigatória.' }),
  source: z.string().optional(),
});

interface IncomeFormProps {
  onIncomeAdded: (income: Transaction) => void;
}

export default function IncomeForm({ onIncomeAdded }: IncomeFormProps) {
  const { toast } = useToast();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: '',
      amount: '' as unknown as number, // Initialize with empty string
      date: new Date(),
      source: '',
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    const newIncome: Transaction = {
      id: Date.now().toString(), 
      type: 'income',
      ...values,
      amount: Number(values.amount) 
    };
    onIncomeAdded(newIncome);
    toast({
      title: 'Receita Adicionada!',
      description: `${values.description} de ${CURRENCY_SYMBOL}${values.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} foi registrada.`,
    });
    form.reset();
    // Ensure amount is reset to empty string for controlled input
    form.setValue('amount', '' as unknown as number);
    form.setValue('date', new Date());
    form.setValue('source', '');
    form.setValue('description', '');
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
                <Input placeholder="ex: Salário Mensal, Projeto Freelance" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Valor ({CURRENCY_SYMBOL})</FormLabel>
              <FormControl>
                <Input type="number" placeholder="ex: 1500,00" {...field} step="0.01" />
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
              <FormLabel>Data</FormLabel>
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
        <FormField
          control={form.control}
          name="source"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Fonte (Opcional)</FormLabel>
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
                        ? INCOME_SOURCES.find(
                            (source) => source.value === field.value
                          )?.label
                        : "Selecione a fonte"}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command>
                    <CommandInput placeholder="Buscar fonte..." />
                    <CommandEmpty>Nenhuma fonte encontrada.</CommandEmpty>
                    <CommandGroup>
                      {INCOME_SOURCES.map((source) => (
                        <CommandItem
                          value={source.label}
                          key={source.value}
                          onSelect={() => {
                            form.setValue("source", source.value)
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              source.value === field.value
                                ? "opacity-100"
                                : "opacity-0"
                            )}
                          />
                          {source.label}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full sm:w-auto">Registrar Receita</Button>
      </form>
    </Form>
  );
}
