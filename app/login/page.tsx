import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import LoginForm from "@/components/LoginForm";

export default async function LoginPage() {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) redirect("/");

  return (
    <div className="loginPage">
      <LoginForm />
    </div>
  );
}
