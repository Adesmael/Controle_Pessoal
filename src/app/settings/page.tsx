
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { CURRENCY_SYMBOL, MONTHLY_SPENDING_GOAL_KEY, WHATSAPP_ALERT_NUMBER_KEY, EVOLUTION_API_URL_KEY, EVOLUTION_API_INSTANCE_KEY, EVOLUTION_API_KEY_KEY } from '@/lib/constants';
import { Label } from '@/components/ui/label';
import { DollarSign, MessageCircleWarning, Server, KeyRound, Link as LinkIcon } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

export default function SettingsPage() {
  const [goal, setGoal] = useState<string>('');
  const [currentGoal, setCurrentGoal] = useState<number | null>(null);
  const [whatsappNumber, setWhatsappNumber] = useState<string>('');
  const [currentWhatsappNumber, setCurrentWhatsappNumber] = useState<string | null>(null);

  const [evolutionApiUrl, setEvolutionApiUrl] = useState<string>('');
  const [currentEvolutionApiUrl, setCurrentEvolutionApiUrl] = useState<string | null>(null);
  const [evolutionApiInstance, setEvolutionApiInstance] = useState<string>('');
  const [currentEvolutionApiInstance, setCurrentEvolutionApiInstance] = useState<string | null>(null);
  const [evolutionApiKey, setEvolutionApiKey] = useState<string>('');
  const [currentEvolutionApiKey, setCurrentEvolutionApiKey] = useState<string | null>(null);

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

    const envRecipientNumber = process.env.NEXT_PUBLIC_WHATSAPP_RECIPIENT_NUMBER;
    const storedWhatsappNumber = localStorage.getItem(WHATSAPP_ALERT_NUMBER_KEY) || envRecipientNumber || '';
    setCurrentWhatsappNumber(storedWhatsappNumber);
    setWhatsappNumber(storedWhatsappNumber);
    
    const storedApiUrl = localStorage.getItem(EVOLUTION_API_URL_KEY) || process.env.EVOLUTION_API_URL || '';
    setCurrentEvolutionApiUrl(storedApiUrl);
    setEvolutionApiUrl(storedApiUrl);

    const storedApiInstance = localStorage.getItem(EVOLUTION_API_INSTANCE_KEY) || process.env.EVOLUTION_API_INSTANCE || '';
    setCurrentEvolutionApiInstance(storedApiInstance);
    setEvolutionApiInstance(storedApiInstance);
    
    const storedApiKey = localStorage.getItem(EVOLUTION_API_KEY_KEY) || process.env.EVOLUTION_API_KEY || '';
    setCurrentEvolutionApiKey(storedApiKey);
    // Não setamos a API key no estado do input por segurança, apenas mostramos se está "Configurada" ou "Não configurada"
    // e permitimos que seja sobrescrita. A leitura para envio é sempre de process.env.

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
    if (whatsappNumber && !/^\d{10,15}$/.test(whatsappNumber.replace(/\D/g, ''))) {
      toast({
        title: 'Número Inválido',
        description: 'Por favor, insira um número de WhatsApp válido (apenas dígitos, ex: 5511999999999).',
        variant: 'destructive',
      });
      return;
    }
    if (whatsappNumber) {
      localStorage.setItem(WHATSAPP_ALERT_NUMBER_KEY, whatsappNumber);
      setCurrentWhatsappNumber(whatsappNumber);
      toast({
        title: 'Número de WhatsApp Salvo!',
        description: `O número para alertas foi salvo como ${whatsappNumber}.`,
      });
    } else {
      localStorage.removeItem(WHATSAPP_ALERT_NUMBER_KEY);
      setCurrentWhatsappNumber(null);
      toast({
        title: 'Número de WhatsApp Removido',
        description: 'O número para alertas foi removido.',
      });
    }
  };

  const handleSaveEvolutionSettings = () => {
    let changed = false;
    if (evolutionApiUrl !== currentEvolutionApiUrl) {
      localStorage.setItem(EVOLUTION_API_URL_KEY, evolutionApiUrl);
      setCurrentEvolutionApiUrl(evolutionApiUrl);
      changed = true;
    }
    if (evolutionApiInstance !== currentEvolutionApiInstance) {
      localStorage.setItem(EVOLUTION_API_INSTANCE_KEY, evolutionApiInstance);
      setCurrentEvolutionApiInstance(evolutionApiInstance);
      changed = true;
    }
    if (evolutionApiKey) { // Só salva se algo for digitado, para permitir limpar visualmente sem apagar o process.env
      localStorage.setItem(EVOLUTION_API_KEY_KEY, evolutionApiKey); // Salvo no localStorage para UI, mas backend usa process.env
      setCurrentEvolutionApiKey(evolutionApiKey); // Atualiza para mostrar que "algo" foi configurado
      changed = true;
    }

    if (changed) {
      toast({
        title: 'Configurações da Evolution API Salvas!',
        description: 'As configurações foram salvas localmente para referência. O envio real usará as variáveis de ambiente do servidor.',
      });
    } else {
       toast({
        title: 'Nenhuma Alteração',
        description: 'Nenhuma alteração detectada nas configurações da Evolution API.',
        variant: 'default'
      });
    }
    // Limpar o campo da API Key após salvar por segurança visual
    setEvolutionApiKey('');
  };


  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">Configurações</h1>
        <p className="text-muted-foreground">Gerencie suas preferências, metas e integrações.</p>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-xl flex items-center">
            <DollarSign className="mr-2 h-5 w-5 text-green-500" />
            Meta de Gastos Mensal
          </CardTitle>
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

      <Separator />

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-xl flex items-center">
            <MessageCircleWarning className="mr-2 h-5 w-5 text-blue-500" />
            Configurações de Alerta WhatsApp (Evolution API)
          </CardTitle>
          <CardDescription>
            Configure os detalhes da sua Evolution API e o número de WhatsApp para receber alertas de meta.
            <strong className="block mt-1 text-destructive">O envio de mensagens usará as variáveis de ambiente configuradas no servidor (`EVOLUTION_API_URL`, `EVOLUTION_API_INSTANCE`, `EVOLUTION_API_KEY`). Os campos abaixo ajudam a configurar e lembrar esses valores.</strong>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label htmlFor="whatsappNumberRecipient">Número de WhatsApp para receber alertas</Label>
            <Input
              id="whatsappNumberRecipient"
              type="tel"
              placeholder="Ex: 55119XXXXXXXX (com código do país e DDD)"
              value={whatsappNumber}
              onChange={(e) => setWhatsappNumber(e.target.value)}
              className="mt-1"
            />
            {currentWhatsappNumber && <p className="text-xs text-muted-foreground mt-1">Número atual para alertas: {currentWhatsappNumber}</p>}
             <Button onClick={handleSaveWhatsappNumber} className="w-full sm:w-auto mt-2">
                Salvar Número para Alertas
            </Button>
          </div>
          
          <Separator />

          <div>
            <Label htmlFor="evolutionApiUrl">URL da Instância Evolution API</Label>
            <div className="relative mt-1">
                <LinkIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                id="evolutionApiUrl"
                type="url"
                placeholder="ex: http://localhost:8080"
                value={evolutionApiUrl}
                onChange={(e) => setEvolutionApiUrl(e.target.value)}
                className="pl-9 mt-1"
                />
            </div>
            {currentEvolutionApiUrl && <p className="text-xs text-muted-foreground mt-1">URL atual configurada (referência): {currentEvolutionApiUrl}</p>}
          </div>

          <div>
            <Label htmlFor="evolutionApiInstance">Nome da Instância Evolution API</Label>
             <div className="relative mt-1">
                <Server className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                id="evolutionApiInstance"
                type="text"
                placeholder="ex: minhaInstancia"
                value={evolutionApiInstance}
                onChange={(e) => setEvolutionApiInstance(e.target.value)}
                className="pl-9 mt-1"
                />
            </div>
            {currentEvolutionApiInstance && <p className="text-xs text-muted-foreground mt-1">Instância atual configurada (referência): {currentEvolutionApiInstance}</p>}
          </div>

          <div>
            <Label htmlFor="evolutionApiKey">API Key da Evolution API</Label>
             <div className="relative mt-1">
                <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                id="evolutionApiKey"
                type="password"
                placeholder="Cole sua API Key aqui para salvar localmente (não obrigatório se já estiver em .env.local)"
                value={evolutionApiKey}
                onChange={(e) => setEvolutionApiKey(e.target.value)}
                className="pl-9 mt-1"
                />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
                {currentEvolutionApiKey ? "API Key está configurada localmente (para referência)." : "API Key não configurada localmente."} O envio real usará a variável de ambiente `EVOLUTION_API_KEY`.
            </p>
          </div>
          <Button onClick={handleSaveEvolutionSettings} className="w-full sm:w-auto">
            Salvar Configurações da Evolution API (Referência Local)
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
