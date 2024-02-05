import Login from "@/components/Login";
import { useAuth } from "@/lib/store/rsc/auth";
import { redirect } from "next/navigation";

export default async function () {
  const { getState } = await useAuth();
  const { user } = getState();
  if (user) {
    // redirect to app if authed
    redirect("/app");
  }

  return <Render />;
}

const Render = () => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <Login />
    </div>
  );
};
