-- Somente leitura. O resultado é um JSON de configuração, sem registros de clientes.
SELECT jsonb_pretty(jsonb_build_object(
  'politicas', (
    SELECT coalesce(jsonb_agg(to_jsonb(p)), '[]'::jsonb)
    FROM pg_policies p WHERE schemaname IN ('public', 'storage')
  ),
  'tabelas_rls', (
    SELECT coalesce(jsonb_agg(jsonb_build_object(
      'tabela', c.relname, 'rls_ativo', c.relrowsecurity,
      'rls_forcado', c.relforcerowsecurity
    )), '[]'::jsonb)
    FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relkind = 'r'
  ),
  'colunas', (
    SELECT coalesce(jsonb_agg(jsonb_build_object(
      'tabela', table_name, 'coluna', column_name,
      'tipo', udt_name, 'aceita_nulo', is_nullable
    )), '[]'::jsonb)
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name IN ('products', 'clients', 'sales', 'sale_items',
        'admin_users', 'inventory_logs', 'suppliers', 'financial_transactions')
  ),
  'permissoes', (
    SELECT coalesce(jsonb_agg(to_jsonb(g)), '[]'::jsonb)
    FROM information_schema.role_table_grants g
    WHERE table_schema = 'public' AND grantee IN ('anon', 'authenticated')
  ),
  'funcoes', (
    SELECT coalesce(jsonb_agg(jsonb_build_object(
      'nome', p.proname,
      'argumentos', pg_get_function_identity_arguments(p.oid),
      'definicao', pg_get_functiondef(p.oid)
    )), '[]'::jsonb)
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.prokind = 'f'
      AND p.proname IN ('process_sale', 'handle_inventory_adjustment',
        'handle_stock_on_paid_sale', 'handle_new_admin_user')
  ),
  'gatilhos', (
    SELECT coalesce(jsonb_agg(jsonb_build_object(
      'schema', event_object_schema, 'tabela', event_object_table,
      'nome', trigger_name, 'acao', action_statement
    )), '[]'::jsonb)
    FROM information_schema.triggers
    WHERE event_object_schema IN ('auth', 'public')
  ),
  'realtime', (
    SELECT coalesce(jsonb_agg(to_jsonb(r)), '[]'::jsonb)
    FROM pg_publication_tables r WHERE pubname = 'supabase_realtime'
  ),
  'storage', (
    SELECT coalesce(jsonb_agg(jsonb_build_object(
      'nome', name, 'publico', public,
      'limite_bytes', file_size_limit, 'tipos', allowed_mime_types
    )), '[]'::jsonb) FROM storage.buckets
  )
)) AS auditoria;
