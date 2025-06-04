'use server';
/**
 * @fileOverview Fornece recomendações financeiras automatizadas com base nos gastos recentes.
 *
 * - getFinancialAdvice - Uma função que obtém as recomendações financeiras.
 * - FinancialAdviceInput - O tipo de entrada para a função getFinancialAdvice.
 * - FinancialAdviceOutput - O tipo de retorno para a função getFinancialAdvice.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {EXPENSE_CATEGORIES} from '@/lib/constants'; // Para mapear valores de categoria para rótulos

const ExpenseCategoryDetailSchema = z.object({
  categoryValue: z.string().describe('O valor da categoria da despesa (ex: "food", "transport").'),
  categoryLabel: z.string().describe('O rótulo legível da categoria da despesa (ex: "Alimentação", "Transporte").'),
  totalAmount: z.number().describe('O valor total gasto nesta categoria.'),
  percentageOfTotalExpenses: z.number().min(0).max(100).describe('A porcentagem que esta categoria representa do total de despesas (0 a 100).')
});
export type ExpenseCategoryDetail = z.infer<typeof ExpenseCategoryDetailSchema>;

const FinancialAdviceInputSchema = z.object({
  recentIncome: z.number().describe('Receita total no período recente (últimos 30 dias).'),
  recentTotalExpenses: z.number().describe('Despesas totais no período recente (últimos 30 dias).'),
  expenseBreakdown: z.array(ExpenseCategoryDetailSchema).describe('Um detalhamento das despesas por categoria para o período recente.'),
  currentBalance: z.number().optional().describe('O saldo financeiro atual geral do usuário.')
});
export type FinancialAdviceInput = z.infer<typeof FinancialAdviceInputSchema>;

const FinancialAdviceOutputSchema = z.object({
  recommendations: z.array(z.string()).describe('Uma lista de 1-2 recomendações financeiras concisas e acionáveis com base nos dados de entrada. Cada recomendação deve ser uma frase completa.')
});
export type FinancialAdviceOutput = z.infer<typeof FinancialAdviceOutputSchema>;


export async function getFinancialAdvice(input: FinancialAdviceInput): Promise<FinancialAdviceOutput> {
  return financialAdviceFlow(input);
}

const prompt = ai.definePrompt({
  name: 'financialAdvicePrompt',
  input: {schema: FinancialAdviceInputSchema},
  output: {schema: FinancialAdviceOutputSchema},
  prompt: `Você é um consultor financeiro amigável e perspicaz. Com base nos seguintes dados financeiros recentes (últimos 30 dias):
- Receita Total Recente: {{{recentIncome}}}
- Despesas Totais Recentes: {{{recentTotalExpenses}}}
{{#if currentBalance}}
- Saldo Atual: {{{currentBalance}}}
{{/if}}
- Detalhamento das Despesas:
{{#each expenseBreakdown}}
  - Categoria: {{categoryLabel}}, Valor Gasto: {{totalAmount}}, Porcentagem do Total de Despesas: {{percentageOfTotalExpenses}}%
{{else}}
  - Nenhum detalhamento de despesa fornecido.
{{/each}}

Por favor, forneça de 1 a 2 recomendações financeiras concisas e acionáveis.
Se as despesas excederem a receita, mencione isso.
Concentre-se em áreas onde o usuário pode estar gastando demais ou poderia fazer mudanças positivas.
Por exemplo, se uma categoria como 'Lazer' (Entretenimento) representar uma alta porcentagem das despesas, sugira considerar uma redução, como: "Seus gastos com {{categoryLabel}} ({{percentageOfTotalExpenses}}%) estão um pouco altos. Que tal explorar opções de lazer mais econômicas este mês?".
Se houver categorias com gastos muito baixos ou zero, não precisa mencioná-las a menos que seja relevante para uma recomendação mais ampla (ex: se a poupança for zero e as despesas forem altas).
Se as finanças parecerem equilibradas e não houver pontos óbvios de melhoria, forneça uma mensagem positiva, como "Suas finanças parecem estar bem equilibradas no momento. Continue assim!".
Evite ser crítico. Seja encorajador e prático.
Responda em português brasileiro.`,
});

const financialAdviceFlow = ai.defineFlow(
  {
    name: 'financialAdviceFlow',
    inputSchema: FinancialAdviceInputSchema,
    outputSchema: FinancialAdviceOutputSchema,
  },
  async (input) => {
    const llmResponse = await prompt(input);
    const output = llmResponse.output;
    if (!output) {
      throw new Error('Não foi possível gerar as recomendações financeiras.');
    }
    // Se não houver recomendações (ex: finanças equilibradas), o modelo pode retornar um array vazio.
    // Podemos adicionar uma recomendação padrão aqui se desejado, ou deixar o prompt tratar disso.
    // Por exemplo, se output.recommendations.length === 0, poderíamos adicionar:
    // output.recommendations.push("Suas finanças parecem bem equilibradas. Continue o bom trabalho!");
    // Mas o prompt já está instruído a fazer algo similar.

    return output;
  }
);
