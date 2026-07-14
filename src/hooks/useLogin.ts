

import { getUser } from "@/modules/login/loginStorage";

export function useAuth() {
  const user = getUser();

  return {
    user,
    userId: user?.id ?? 0,
    role: user?.role ?? "",
  };
}