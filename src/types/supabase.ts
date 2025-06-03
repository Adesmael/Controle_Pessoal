
// Este arquivo define os tipos para o seu banco de dados Supabase.
// Idealmente, você deve gerar este arquivo usando o Supabase CLI para garantir que
// ele corresponda exatamente ao seu esquema de banco de dados.
// Comando: npx supabase gen types typescript --project-id <seu-project-id> --schema public > src/types/supabase.ts
// No entanto, esta versão manual reflete a estrutura esperada pela aplicação.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      transactions: {
        Row: { // Representa uma linha lida do banco de dados
          id: string // UUID, gerado automaticamente
          user_id: string | null // UUID, opcional, para autenticação de usuário
          type: 'income' | 'expense' // Tipo da transação
          description: string
          amount: number // Valor numérico com precisão decimal
          date: string // Data no formato YYYY-MM-DD
          category: string | null // Categoria para despesas (e.g., 'food', 'transport')
          source: string | null // Fonte para receitas (e.g., 'salary', 'freelance')
          created_at: string // Timestamp com fuso horário (e.g., "2023-10-26T10:00:00+00:00")
        }
        Insert: { // Representa os dados para inserir uma nova linha
          id?: string // UUID, opcional se o banco de dados gerar automaticamente
          user_id?: string | null
          type: 'income' | 'expense'
          description: string
          amount: number
          date: string // Data no formato YYYY-MM-DD
          category?: string | null
          source?: string | null
          created_at?: string // Opcional, o banco pode gerar automaticamente
        }
        Update: { // Representa os dados para atualizar uma linha existente
          id?: string
          user_id?: string | null
          type?: 'income' | 'expense'
          description?: string
          amount?: number
          date?: string // Data no formato YYYY-MM-DD
          category?: string | null
          source?: string | null
          created_at?: string
        }
        Relationships: [
          // Exemplo de relacionamento se user_id fosse uma chave estrangeira para uma tabela 'users'
          // {
          //   foreignKeyName: "transactions_user_id_fkey"
          //   columns: ["user_id"]
          //   referencedRelation: "users" // Nome da tabela referenciada
          //   referencedColumns: ["id"] // Coluna na tabela referenciada
          // }
        ]
      }
      // Você pode adicionar outras tabelas aqui se necessário
      // exemplo_outra_tabela: { ... }
    }
    Views: {
      [_ in never]: never // Se você tiver views, defina-as aqui
    }
    Functions: {
      [_ in never]: never // Se você tiver funções, defina-as aqui
    }
    Enums: {
      [_ in never]: never // Se você tiver enums, defina-os aqui
    }
    CompositeTypes: {
      [_ in never]: never // Se você tiver tipos compostos, defina-os aqui
    }
  }
}

// Helper types para facilitar o uso (opcional, mas recomendado se você usar os tipos gerados)
export type Tables<
  PublicTableNameOrOptions extends
    | keyof (Database["public"]["Tables"] & Database["public"]["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (Database["public"]["Tables"] &
        Database["public"]["Views"])
    ? (Database["public"]["Tables"] &
        Database["public"]["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
    ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
    ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof Database["public"]["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof Database["public"]["Enums"]
    ? Database["public"]["Enums"][PublicEnumNameOrOptions]
    : never
