import { Suspense } from "react";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { isAdminSystemInitialized } from "@/lib/db";
import { AdminLoginForm, LoginPageSkeleton } from "@/components/admin/login-form";

export default async function LoginPage() {
  const isInitialized = await isAdminSystemInitialized();

  if (!isInitialized) {
    redirect("/admin/setup");
  }

  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (token) {
    redirect("/admin");
  }

  return (
    <Suspense fallback={<LoginPageSkeleton />}>
      <AdminLoginForm />
    </Suspense>
  );
}
