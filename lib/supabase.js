import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// 반드시 앞에 'export'가 붙어 있어야 page.js에서 가져다 쓸 수 있습니다.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
