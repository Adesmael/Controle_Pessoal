# Fluxo Financeiro

Um aplicativo para controle de finanças pessoais construído com Next.js, ShadCN UI e Tailwind CSS.

## Como Instalar e Rodar Localmente

Siga os passos abaixo para configurar e executar o projeto em sua máquina local.

### 1. Pré-requisitos

*   **Node.js**: Certifique-se de ter o Node.js (versão 18 ou superior) instalado. Você pode baixá-lo em [nodejs.org](https://nodejs.org/).
*   **npm**: O npm é o gerenciador de pacotes do Node.js e já vem instalado com ele.

### 2. Instalação das Dependências

Abra seu terminal, navegue até a pasta raiz do projeto e execute o seguinte comando para instalar todas as dependências necessárias:

```bash
npm install
```

### 3. Configuração do Ambiente (Opcional)

Este projeto pode usar funcionalidades de Inteligência Artificial através do Genkit, que requer uma chave de API do Google.

1.  Crie um arquivo chamado `.env` na raiz do projeto.
2.  Obtenha uma chave de API no [Google AI Studio](https://aistudio.google.com/app/apikey).
3.  Adicione a chave ao seu arquivo `.env`:
    ```
    GOOGLE_API_KEY=SUA_CHAVE_DE_API_AQUI
    ```
*Se você não adicionar a chave, as funcionalidades de IA não funcionarão, mas o restante do aplicativo deve funcionar normalmente.*

### 4. Rodando o Projeto

Para o desenvolvimento, você precisa de dois terminais rodando simultaneamente:

*   **Terminal 1: Rodar a Aplicação Next.js**
    ```bash
    npm run dev
    ```
    O aplicativo estará disponível em `http://localhost:9002`.

*   **Terminal 2: Rodar o Servidor Genkit (IA)**
    ```bash
    npm run genkit:watch
    ```
    Este servidor gerencia as funcionalidades de IA.

Com os dois terminais em execução, você pode acessar e desenvolver a aplicação.

### Build para Produção

Para criar os arquivos para produção (versão estática), execute:
```bash
npm run build
```
O resultado será salvo na pasta `out/`.
