"use client";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { Controller, Form, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { api } from "@/lib/trpc/client";
import { useCallback } from "react";
import { Button, Card, CardBody, CardFooter, CardHeader, Input } from "@nextui-org/react";
import { toast } from "react-toastify";

const loginSchema = z.object({
  providerUserId: z.string().email(),
  password: z.string().min(8),
});

export default function Login() {
  const router = useRouter();

  const loginF = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    mode: "all",
  });

  const loginM = api.authRouter.login.useMutation();

  const onSubmit = useCallback((data: z.infer<typeof loginSchema>) => {
    loginM.mutate(
      {
        provider: "EMAIL",
        providerUserId: data.providerUserId,
        password: data.password,
      },
      {
        onSuccess: () => {
          router.push("/app");
        },
        onError: (err) => {
          toast.error(err.message);
        },
      },
    );
  }, []);

  return (
    <form onSubmit={loginF.handleSubmit(onSubmit)}>
      <Card className="min-w-96">
        <CardHeader>
          <h3 className="text-xl font-bold">Login</h3>
        </CardHeader>
        <CardBody>
          <div className="flex flex-col gap-2">
            <Controller
              control={loginF.control}
              name="providerUserId"
              render={({ field, formState }) => (
                <Input type="email" placeholder="Email" {...field} />
              )}
            />
            <Controller
              control={loginF.control}
              name="password"
              render={({ field, formState }) => (
                <Input type="password" placeholder="Password" {...field} />
              )}
            />
          </div>
        </CardBody>
        <CardFooter>
          <Button type="submit" disabled={!loginF.formState.isValid}>
            Submit
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
