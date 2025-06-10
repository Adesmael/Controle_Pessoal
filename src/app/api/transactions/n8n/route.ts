
'use server';

import { NextResponse } from 'next/server';
// import { supabase } from '@/lib/supabaseClient'; // Supabase removido
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
  category: z.string().optional(), 
  source: z.string().optional(),   
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
    const formattedErrors = validationResult.error.flatten().fieldErrors;
    return NextResponse.json({ 
      error: 'Dados da transação inválidos.', 
      details: formattedErrors 
    }, { status: 400 });
  }

  // const { type, description, amount, date, category, source } = validationResult.data; // Dados validados

  // Como o Supabase foi removido, não há onde salvar os dados.
  // Apenas retornaremos uma mensagem indicando que o backend não está conectado.
  // Ou, para fins de teste, você pode logar os dados recebidos.
  console.log("Dados da transação recebidos via n8n (backend não conectado):", validationResult.data);

  return NextResponse.json({ 
    message: 'Transação recebida. Backend de persistência de dados (Supabase) foi removido. Os dados não foram salvos.', 
    receivedData: validationResult.data 
  }, { status: 200 }); // Retorna 200 para indicar que o endpoint recebeu, mas não processou com persistência.
}

export async function GET() {
  return NextResponse.json({ message: 'Endpoint N8N para transações. Use POST para registrar novas transações (atualmente sem persistência de dados).' });
}
