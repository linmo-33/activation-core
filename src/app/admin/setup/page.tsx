import { Suspense } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { isAdminSystemInitialized } from "@/lib/db";
import { AdminSetupForm, SetupPageSkeleton } from "@/components/admin/setup-form";

export default async function SetupPage() {
  const isInitialized = await isAdminSystemInitialized();

  if (isInitialized) {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    redirect(token ? "/admin" : "/admin/login");
  }

  return (
    <Suspense fallback={<SetupPageSkeleton />}>
      <AdminSetupForm />
    </Suspense>
  );
}
