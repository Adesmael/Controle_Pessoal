
'use server';
/**
 * @fileOverview Analisa tendências financeiras recentes e fornece uma perspectiva.
 *
 * - getFinancialTrend - Uma função que obtém a análise de tendência financeira.
 * - FinancialTrendInput - O tipo de entrada para a função getFinancialTrend.
 * - FinancialTrendOutput - O tipo de retorno para a função getFinancialTrend.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const FinancialTrendInputSchema = z.object({
  currentBalance: z.number().describe('O saldo financeiro atual geral do usuário.'),
  incomeLast30Days: z.number().describe('O total de receitas nos últimos 30 dias.'),
  expensesLast30Days: z.number().describe('O total de despesas nos últimos 30 dias.'),
});
export type FinancialTrendInput = z.infer<typeof FinancialTrendInputSchema>;

const FinancialTrendOutputSchema = z.object({
  analysis: z.string().describe("Uma análise textual concisa (1-2 frases) da tendência financeira e uma perspectiva geral se essa tendência continuar. Deve ser encorajadora, mas realista. Exemplo: 'Suas receitas superaram ligeiramente as despesas este mês. Se isso continuar, seu saldo deverá apresentar um crescimento modesto.'"),
});
export type FinancialTrendOutput = z.infer<typeof FinancialTrendOutputSchema>;


export async function getFinancialTrend(input: FinancialTrendInput): Promise<FinancialTrendOutput> {
  return financialTrendFlow(input);
}

const prompt = ai.definePrompt({
  name: 'financialTrendPrompt',
  input: {schema: FinancialTrendInputSchema},
  output: {schema: FinancialTrendOutputSchema},
  prompt: `Você é um assistente financeiro prestativo. Com base nos seguintes dados dos últimos 30 dias:
- Saldo Atual Geral: {{{currentBalance}}}
- Receita Total (últimos 30 dias): {{{incomeLast30Days}}}
- Despesas Totais (últimos 30 dias): {{{expensesLast30Days}}}

Forneça uma análise concisa (1-2 frases) da tendência financeira recente e uma perspectiva geral para o saldo se essa tendência continuar.
Se não houve receitas ou despesas nos últimos 30 dias, mencione que o saldo permanece estável devido à ausência de atividade recente.
Concentre-se em se a receita está superando as despesas, ou vice-versa, e o que isso geralmente significa para o saldo futuro. Seja encorajador, mas realista.
Não dê conselhos financeiros específicos como "invista em X".
Responda em português brasileiro.`,
});

const financialTrendFlow = ai.defineFlow(
  {
    name: 'financialTrendFlow',
    inputSchema: FinancialTrendInputSchema,
    outputSchema: FinancialTrendOutputSchema,
  },
  async (input) => {
    // Define a default model if not specified, or rely on global config
    const llmResponse = await prompt(input);
    const output = llmResponse.output;
    if (!output) {
      throw new Error('Não foi possível gerar a análise de tendência.');
    }
    return output;
  }
);
