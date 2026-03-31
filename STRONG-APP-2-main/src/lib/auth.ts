import { supabase } from '../supabase';

export const login = async (email: string, senha: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password: senha });
  if (error) {
    if (error.message.includes('Invalid login credentials')) throw new Error('Usuário não encontrado ou senha incorreta');
    if (error.message.includes('Invalid email')) throw new Error('E-mail inválido');
    throw new Error('Erro ao fazer login');
  }
  return data.user;
};

export const cadastrar = async (email: string, senha: string) => {
  const { data, error } = await supabase.auth.signUp({ email, password: senha });
  if (error) {
    if (error.message.includes('already registered')) throw new Error('E-mail já cadastrado');
    if (error.message.includes('Password should be')) throw new Error('Senha muito fraca, mínimo 6 caracteres');
    if (error.message.includes('Invalid email')) throw new Error('E-mail inválido');
    throw new Error('Erro ao criar conta');
  }
  return data.user;
};

export const logout = async () => {
  await supabase.auth.signOut();
};
