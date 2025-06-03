
'use server';

import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { z } from 'zod';

// Schema de validação para os dados da transação vindos do n8n
const N8NTransactionInputSchema = z.object({
  type: z.enum(['income', 'expense'], {
    required_error: "O tipo da transação ('income' ou 'expense') é obrigatório.",
    invalid_type_error: "Tipo de transação inválido. Use 'income' ou 'expense'.",
  }),
  description: z.string().min(1, "A descrição é obrigatória.").max(255, "A descrição deve ter no máximo 255 caracteres."),
  amount: z.number().positive({ message: "O valor deve ser um número positivo." }),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "A data deve estar no formato YYYY-MM-DD."),
  category: z.string().optional(), // Opcional, mais relevante para 'expense'
  source: z.string().optional(),   // Opcional, mais relevante para 'income'
});

export async function POST(request: Request) {
  const apiKey = request.headers.get('X-N8N-API-KEY');
  const expectedApiKey = process.env.N8N_API_SECRET_KEY;

  if (!expectedApiKey) {
    console.error('A variável de ambiente N8N_API_SECRET_KEY não está configurada no servidor.');
    return NextResponse.json({ error: 'Integração n8n não configurada corretamente no servidor.' }, { status: 500 });
  }

  if (!apiKey || apiKey !== expectedApiKey) {
    return NextResponse.json({ error: 'Chave de API inválida ou ausente.' }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch (error) {
    return NextResponse.json({ error: 'Corpo da requisição inválido. Esperado JSON.' }, { status: 400 });
  }

  const validationResult = N8NTransactionInputSchema.safeParse(body);

  if (!validationResult.success) {
    // Extrai e formata os erros de validação para uma melhor depuração
    const formattedErrors = validationResult.error.flatten().fieldErrors;
    return NextResponse.json({ 
      error: 'Dados da transação inválidos.', 
      details: formattedErrors 
    }, { status: 400 });
  }

  const { type, description, amount, date, category, source } = validationResult.data;

  if (!supabase) {
    console.error('Cliente Supabase não inicializado. Verifique a configuração do servidor.');
    return NextResponse.json({ error: 'Cliente Supabase não inicializado.' }, { status: 500 });
  }

  // Prepara os dados para inserção. O tipo 'any' é usado aqui para flexibilidade,
  // mas idealmente seria TablesInsert<'transactions'> se os tipos do Supabase estivessem perfeitamente alinhados.
  const transactionData: {
    type: 'income' | 'expense';
    description: string;
    amount: number;
    date: string;
    category?: string;
    source?: string;
    // user_id?: string; // Adicione se for associar a um usuário específico
  } = {
    type,
    description,
    amount,
    date, // Supabase aceita 'YYYY-MM-DD' para colunas DATE
  };

  if (type === 'expense' && category) {
    transactionData.category = category;
  } else if (type === 'income' && source) {
    transactionData.source = source;
  }

  // Nota: A coluna 'user_id' não está sendo definida aqui.
  // Se suas políticas RLS exigirem 'user_id', você precisará ajustar esta lógica
  // ou as políticas para permitir inserções com 'user_id' nulo para esta API.

  try {
    const { data, error: supabaseError } = await supabase
      .from('transactions')
      .insert([transactionData])
      .select() // Retorna os dados inseridos
      .single(); // Espera-se que apenas um registro seja inserido

    if (supabaseError) {
      console.error('Erro ao inserir transação no Supabase:', supabaseError);
      return NextResponse.json({ error: 'Erro ao salvar transação no banco de dados.', details: supabaseError.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Transação registrada com sucesso!', transaction: data }, { status: 201 });
  } catch (error: any) {
    console.error('Erro inesperado ao processar a requisição POST:', error);
    return NextResponse.json({ error: 'Erro interno do servidor ao processar a requisição.', details: error.message }, { status: 500 });
  }
}

// Opcional: Adicionar um handler GET para verificar se o endpoint está acessível (sem dados sensíveis)
export async function GET() {
  return NextResponse.json({ message: 'Endpoint N8N para transações. Use POST para registrar novas transações.' });
}
