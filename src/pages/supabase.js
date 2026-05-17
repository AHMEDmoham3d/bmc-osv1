import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://zghvbgnybdnzgaoqldkk.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpnaHZiZ255YmRuemdhb3FsZGtrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3Mzk2ODIsImV4cCI6MjA5MTMxNTY4Mn0.VEbqRA3mCpwMFENyMzQ1njgrVY8YUVIXLVK5Uw7fdtg";

export const supabase = createClient(supabaseUrl, supabaseKey);