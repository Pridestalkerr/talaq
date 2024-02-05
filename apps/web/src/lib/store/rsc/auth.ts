import { createStore, type StoreApi } from "./createStore";
import { apiServer } from "@/lib/trpc/rsc";
import { cookies } from "next/headers";
import { cache } from "react";

// if you dont need to perform any operations aside of initialization
// on the slice, then you can just use cache without the store
// the state can be passed as props, or hydrated on the client as well when needed
export const useAuth = cache(async () => {
  const token = cookies().get("token")?.value;
  const getMe = async () => {
    try {
      if (!token) {
        throw new Error("No token provided.");
      }
      return apiServer((routers) =>
        routers.authRouter.me.query(void 0, {
          context: {
            token,
          },
        }),
      );
    } catch (error) {
      return undefined;
    }
  };

  return await createStore(async () => {
    return {
      user: await getMe(),
    };
  });
});
