-- 1. Função que será chamada pelo Trigger
-- Ela roda como "SECURITY DEFINER" para ter permissão de ler o Auth e escrever no Public
CREATE OR REPLACE FUNCTION public.handle_new_admin_user() 
RETURNS TRIGGER AS $$
BEGIN
  -- Tenta inserir o novo usuário na nossa tabela do App
  -- Pegamos o nome direto dos metadados (se enviado no convite) ou usamos o e-mail como padrão
  INSERT INTO public.admin_users (auth_user_id, full_name, role, is_active)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)), 
    COALESCE(NEW.raw_user_meta_data->>'role', 'Vendedor'), 
    TRUE
  )
  ON CONFLICT (auth_user_id) DO NOTHING; -- Evita erro se o registro já existir
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Gatilho (Trigger) que vigia a criação de novos usuários no Auth
-- Toda vez que você convidar alguém no Dashboard, isso dispara automaticamente
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_admin_user();

-- 3. Mensagem de sucesso para o log
SELECT '✅ Sincronização de Admins Ativada com Sucesso!' as Status;
