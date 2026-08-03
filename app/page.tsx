import { auth, signIn, signOut } from "@/auth";
import DashboardClient from "./dashboard-client";

export default async function Home() {
  const session = await auth();

  if (!session) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-10 flex flex-col items-center gap-4">
            <h1 className="text-2xl font-bold text-slate-900">Excel Graph Site</h1>
            <p className="text-slate-500 text-sm">Sign in to view and upload reports</p>
            <form
  action={async () => {
    "use server";
    await signIn("google");
  }}
  className="w-full"
>
  <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-lg font-medium transition shadow-sm">
    Sign in with Google
  </button>
</form>

<div className="flex items-center gap-3 w-full text-slate-400 text-xs">
  <div className="flex-1 h-px bg-slate-200" />
  OR
  <div className="flex-1 h-px bg-slate-200" />
</div> 
<a
href="/login"
  className="w-full text-center border border-slate-200 text-slate-700 px-6 py-2.5 rounded-lg font-medium transition hover:bg-slate-50"
>
  Sign in with email
</a>
        </div>
      </main>
    );
  }

  return (
    <div>
      <div className="flex justify-end p-4 bg-slate-50">
        <div className="flex items-center gap-3 text-sm text-slate-600">
          <span>{session.user?.email}</span>
          <form
            action={async () => {
              "use server";
              await signOut();
            }}
          >
            <button className="text-red-600 hover:underline">Sign out</button>
          </form>
        </div>
      </div>
      <DashboardClient />
    </div>
  );
}