import { DefaultSession } from "next-auth";
import { Role, Campus } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
      department?: string | null;
      campus?: Campus | null;
    } & DefaultSession["user"];
  }

  interface User {
    role: Role;
    department?: string | null;
    campus?: Campus | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: Role;
    department?: string | null;
    campus?: Campus | null;
  }
}