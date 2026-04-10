import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

if (!supabaseUrl || !supabaseKey) {
  console.warn('Supabase URL and Key are missing. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in the Settings menu.');
}

// Initialize with empty strings if missing to avoid "supabaseUrl is required" error
// but operations will fail until keys are provided.
export const supabase = createClient(
  supabaseUrl || "https://placeholder-url.supabase.co", 
  supabaseKey || "placeholder-key"
);

export async function createNotification(userId: number, type: string, content: string, link: string) {
  const { data: settings } = await supabase
    .from("user_settings")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (!settings) return;

  let shouldNotify = false;
  if (type === 'message' && settings.notify_messages) shouldNotify = true;
  if (type === 'event' && settings.notify_events) shouldNotify = true;
  if (type === 'comment' && settings.notify_blog) shouldNotify = true;
  if (type === 'announcement') shouldNotify = true;

  if (shouldNotify) {
    await supabase
      .from("notifications")
      .insert([{ user_id: userId, type, content, link }]);
  }
}
