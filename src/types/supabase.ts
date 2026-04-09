export interface InsumoPreco {
  id: string;
  nome: string;
  quantidade: number;
  unidade: string;
  custo_estimado: number;
}

export interface Product {
  id: string;
  nome: string;
  price: number;
  cost: number | null;
  stock: number | null;
  category: string | null;
  colecao: string | null;
  description: string | null;
  image_url: string | null;
  image_2?: string | null;
  image_3?: string | null;
  image_4?: string | null;
  data_entrada?: string | null;
  show_on_site: boolean;
  is_preorder: boolean;
  is_insumo: boolean;
  insumos_json?: InsumoPreco[] | null;
  technical_notes?: string | null;
  measure_cm?: string | null;
  weight_kg?: number | null;
  supplier_id?: string | null;
  created_at: string;
  // Campos adicionados na migration v2
  min_stock?: number | null;
  material?: string | null;
  tags?: string | null;
}

export interface Sale {
  id: string;
  created_at: string;
  client_id?: string | null;
  total_amount: number;
  total_cost?: number | null;
  status: string;
  payment_method?: string | null;
}

export interface SaleItem {
  id: string;
  sale_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  unit_cost?: number | null;
}

export interface Client {
  id: string;
  full_name: string;
  email?: string | null;
  phone?: string | null;
  is_vip: boolean;
  created_at: string;
  // Campos adicionados na migration v2
  cpf_cnpj?: string | null;
  birth_date?: string | null;
  address?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  state?: string | null;
  zip_code?: string | null;
  acquisition_channel?: string | null;
  internal_notes?: string | null;
}

export interface Supplier {
  id: string;
  name: string;
  contact_person?: string | null;
  cnpj_cpf?: string | null;
  phone?: string | null;
  email?: string | null;
  supplied_items?: string | null;
  reliability_score?: number | null;
  internal_notes?: string | null;
  created_at: string;
}

export interface AdminUser {
  id: string;
  auth_user_id: string;
  full_name: string;
  access_level: 1 | 2 | 3 | 4; // 1: Visualizador, 2: Vendedor, 3: Gestor, 4: Admin/Proprietário
  is_active: boolean;
  created_at: string;
}

export interface FinancialTransaction {
  id: string;
  description: string;
  amount: number;
  transaction_type: 'Receita' | 'Despesa';
  category: string;
  status: 'Pago' | 'Pendente';
  due_date: string;
  payment_date?: string | null;
  created_at: string;
}
