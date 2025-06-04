
'use server';
/**
 * @fileOverview Genkit Tool para enviar mensagens de WhatsApp usando a Evolution API.
 *
 * - sendWhatsappMessageTool - O tool Genkit.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const SendWhatsappMessageInputSchema = z.object({
  phoneNumber: z.string().describe('O número de telefone do destinatário, formato internacional (ex: 5511999999999).'),
  message: z.string().min(1).describe('A mensagem de texto a ser enviada.'),
});

// O output pode ser um simples objeto de sucesso/erro
const SendWhatsappMessageOutputSchema = z.object({
  success: z.boolean().describe('Indica se a mensagem foi enviada com sucesso para a API.'),
  messageId: z.string().optional().describe('O ID da mensagem retornado pela API, se bem-sucedido.'),
  error: z.string().optional().describe('Mensagem de erro, se o envio falhar.'),
});

export const sendWhatsappMessageTool = ai.defineTool(
  {
    name: 'sendWhatsappMessageTool',
    description: 'Envia uma mensagem de texto via WhatsApp usando uma instância configurada da Evolution API. As credenciais e URL da API são lidas das variáveis de ambiente do servidor.',
    inputSchema: SendWhatsappMessageInputSchema,
    outputSchema: SendWhatsappMessageOutputSchema,
  },
  async (input) => {
    const { phoneNumber, message } = input;

    const apiUrlBase = process.env.EVOLUTION_API_URL;
    const apiInstance = process.env.EVOLUTION_API_INSTANCE;
    const apiKey = process.env.EVOLUTION_API_KEY;

    if (!apiUrlBase || !apiInstance || !apiKey) {
      console.error('Variáveis de ambiente da Evolution API não configuradas no servidor.');
      return { 
        success: false, 
        error: 'Configuração da Evolution API ausente no servidor (URL, Instância ou API Key).' 
      };
    }

    const fullApiUrl = `${apiUrlBase.replace(/\/$/, '')}/message/sendText/${apiInstance}`;
    
    try {
      const response = await fetch(fullApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': apiKey,
        },
        body: JSON.stringify({
          number: phoneNumber,
          options: {
            delay: 1200, // Pequeno delay sugerido pela Evolution API
            presence: "composing", // Simula digitação
          },
          textMessage: {
            text: message,
          },
        }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        console.error('Erro da Evolution API:', responseData);
        return { 
          success: false, 
          error: `Erro da Evolution API: ${response.status} ${response.statusText} - ${responseData.message || JSON.stringify(responseData.response || responseData)}`
        };
      }
      
      // A Evolution API pode retornar diferentes estruturas de sucesso.
      // Exemplo comum: { "key": { "remoteJid": "...", "id": "..." }, "messageTimestamp": "..." }
      // Ou pode retornar diretamente um objeto com detalhes da mensagem.
      // Vamos tentar pegar um ID se disponível.
      const messageId = responseData?.key?.id || responseData?.msgId || responseData?.message?.id || 'N/A';

      return { success: true, messageId };

    } catch (error: any) {
      console.error('Erro ao enviar mensagem pelo WhatsApp (Evolution API):', error);
      return { 
        success: false, 
        error: `Falha na comunicação com a Evolution API: ${error.message}` 
      };
    }
  }
);
