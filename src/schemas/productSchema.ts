import { z } from 'zod';

/**
 * SCHEMA DE VALIDAÇÃO DE PRODUTO - CAMÉLIA HANDCRAFT (MOT PRO v3)
 * 
 * Fim das falhas de cadastro e inconsistência de dados.
 */

export const productSchema = z.object({
  nome: z.string().min(3, 'O nome do produto é obrigatório para a vitrine'),
  price: z.coerce.number({ message: 'Preço deve ser um número' }).default(0),
  cost: z.coerce.number().nullable().default(0),
  stock: z.coerce.number().nullable().default(0),
  category: z.string().nullable().default('Outros'),
  colecao: z.string().nullable().default('Geral'),
  description: z.string().nullable().default(''),
  image_url: z.union([z.string().url('URL inválida'), z.literal('')]).nullable().default(null),
  image_2: z.union([z.string().url('URL inválida'), z.literal('')]).nullable().optional(),
  image_3: z.union([z.string().url('URL inválida'), z.literal('')]).nullable().optional(),
  show_on_site: z.boolean().default(false),
  is_preorder: z.boolean().default(false),
  is_insumo: z.boolean().default(false),
  insumos_json: z.array(z.object({
    id: z.string(),
    nome: z.string(),
    quantidade: z.number(),
    unidade: z.string(),
    custo_estimado: z.number()
  })).nullable().default([]),
  technical_notes: z.string().nullable().default(''),
  measure_cm: z.string().nullable().default(''),
  weight_kg: z.coerce.number().nullable().default(0),
  supplier_id: z.union([z.string().uuid('ID inválido'), z.literal('')]).nullable().optional(),
});

export type ProductFormData = z.infer<typeof productSchema>;
