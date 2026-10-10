import {createClient} from "@supabase/supabase-js";
export const databaseConfigured=Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
export const db=databaseConfigured?createClient(process.env.SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY,{
  auth:{persistSession:false,autoRefreshToken:false}
}):null;
export function requireDatabase() {
  if(!db) {
    const e=new Error("Base de datos sin configurar: SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY.");
    e.status=503;throw e;
  }
  return db;
}
