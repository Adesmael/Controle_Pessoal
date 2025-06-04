
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { CURRENCY_SYMBOL, MONTHLY_SPENDING_GOAL_KEY, WHATSAPP_ALERT_NUMBER_KEY } from '@/lib/constants';
import { Label } from '@/components/ui/label';
import { DollarSign, MessageCircleWarning } from 'lucide-react';

export default function SettingsPage() {
  const [goal, setGoal] = useState<string>('');
  const [currentGoal, setCurrentGoal] = useState<number | null>(null);
  const [whatsappNumber, setWhatsappNumber] = useState<string>('');
  const [currentWhatsappNumber, setCurrentWhatsappNumber] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const storedGoal = localStorage.getItem(MONTHLY_SPENDING_GOAL_KEY);
    if (storedGoal) {
      const parsedGoal = parseFloat(storedGoal);
      if (!isNaN(parsedGoal)) {
        setCurrentGoal(parsedGoal);
        setGoal(parsedGoal.toString());
      }
    }

    const storedWhatsappNumber = localStorage.getItem(WHATSAPP_ALERT_NUMBER_KEY);
    if (storedWhatsappNumber) {
      setCurrentWhatsappNumber(storedWhatsappNumber);
      setWhatsappNumber(storedWhatsappNumber);
    }
  }, []);

  const handleSaveGoal = () => {
    const numericGoal = parseFloat(goal);
    if (isNaN(numericGoal) || numericGoal < 0) {
      toast({
        title: 'Valor Inválido',
        description: 'Por favor, insira um valor numérico positivo para a meta.',
        variant: 'destructive',
      });
      return;
    }
    localStorage.setItem(MONTHLY_SPENDING_GOAL_KEY, numericGoal.toString());
    setCurrentGoal(numericGoal);
    toast({
      title: 'Meta Salva!',
      description: `Sua nova meta de gastos mensais de ${CURRENCY_SYMBOL}${numericGoal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} foi salva.`,
    });
  };

  const handleSaveWhatsappNumber = () => {
    // Simples validação de exemplo (pode ser aprimorada)
    if (whatsappNumber && !/^\d{10,15}$/.test(whatsappNumber.replace(/\D/g, ''))) {
      toast({
        title: 'Número Inválido',
        description: 'Por favor, insira um número de WhatsApp válido (apenas dígitos, entre 10 e 15).',
        variant: 'destructive',
      });
      return;
    }
    if (whatsappNumber) {
      localStorage.setItem(WHATSAPP_ALERT_NUMBER_KEY, whatsappNumber);
      setCurrentWhatsappNumber(whatsappNumber);
      toast({
        title: 'Número de WhatsApp Salvo!',
        description: `O número para alertas (simulados) foi salvo como ${whatsappNumber}.`,
      });
    } else {
      localStorage.removeItem(WHATSAPP_ALERT_NUMBER_KEY);
      setCurrentWhatsappNumber(null);
      toast({
        title: 'Número de WhatsApp Removido',
        description: 'O número para alertas (simulados) foi removido.',
      });
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">Configurações</h1>
        <p className="text-muted-foreground">Gerencie suas preferências e metas.</p>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-xl">Meta de Gastos Mensal</CardTitle>
          <CardDescription>
            Defina um limite para seus gastos mensais para ajudar a controlar suas finanças.
            {currentGoal !== null && (
              <span className="block mt-2 font-medium">
                Sua meta atual é: {CURRENCY_SYMBOL}{currentGoal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="spendingGoal">Definir Nova Meta ({CURRENCY_SYMBOL})</Label>
            <div className="relative mt-1">
              <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="spendingGoal"
                type="number"
                placeholder="ex: 1500,00"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                className="pl-9"
                step="0.01"
              />
            </div>
          </div>
          <Button onClick={handleSaveGoal} className="w-full sm:w-auto">
            Salvar Meta de Gastos
          </Button>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-xl flex items-center">
            <MessageCircleWarning className="mr-2 h-5 w-5 text-blue-500" />
            Alertas de Saldo (Simulação WhatsApp)
          </CardTitle>
          <CardDescription>
            Insira um número de WhatsApp para simular o envio de alertas quando sua meta de gastos estiver próxima de ser atingida.
            <strong className="block mt-1">Nenhuma mensagem real será enviada. Esta é apenas uma simulação para demonstração.</strong>
            {currentWhatsappNumber && (
              <span className="block mt-2 font-medium">
                Número configurado para simulação: {currentWhatsappNumber}
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="whatsappNumber">Número de WhatsApp (apenas dígitos)</Label>
            <Input
              id="whatsappNumber"
              type="tel"
              placeholder="Ex: 55119XXXXXXXX"
              value={whatsappNumber}
              onChange={(e) => setWhatsappNumber(e.target.value)}
              className="mt-1"
            />
             <p className="text-xs text-muted-foreground mt-1">Deixe em branco para não simular alertas no WhatsApp.</p>
          </div>
          <Button onClick={handleSaveWhatsappNumber} className="w-full sm:w-auto">
            Salvar Número para Alertas
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
