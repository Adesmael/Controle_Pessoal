
'use server';
/**
 * @fileOverview Ação para enviar alertas de WhatsApp.
 *
 * - sendWhatsappAlert - Função que invoca o tool Genkit para enviar uma mensagem.
 */
import { sendWhatsappMessageTool } from '@/ai/tools/sendWhatsappMessageTool';

interface SendAlertResult {
  success: boolean;
  details?: string; // Pode ser messageId ou mensagem de erro
}

export async function sendWhatsappAlert(phoneNumber: string, message: string): Promise<SendAlertResult> {
  try {
    // Não precisamos passar a configuração da API aqui,
    // pois o tool as lê diretamente das variáveis de ambiente do servidor.
    const result = await sendWhatsappMessageTool({ phoneNumber, message });

    if (result.success) {
      return { success: true, details: `Mensagem enviada (ID: ${result.messageId || 'N/A'})` };
    } else {
      console.error('Falha ao enviar alerta pelo WhatsApp via tool:', result.error);
      return { success: false, details: result.error || 'Erro desconhecido no tool.' };
    }
  } catch (error: any) {
    console.error('Erro ao chamar o sendWhatsappMessageTool:', error);
    return { success: false, details: `Erro ao executar a ação de alerta: ${error.message}` };
  }
}
