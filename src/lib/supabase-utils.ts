import { supabase } from './supabase';

export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
}

export async function signUpWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });
  return { data, error };
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}

export async function getCurrentUser() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function getSession() {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session;
}

// Example function for fetching data
export async function fetchFromTable(table: string, select = '*') {
  const { data, error } = await supabase.from(table).select(select);

  if (error) throw error;
  return data;
}

// Example function for inserting data
export async function insertToTable(table: string, values: any) {
  const { data, error } = await supabase.from(table).insert([values]).select();

  if (error) throw error;
  return data;
}
