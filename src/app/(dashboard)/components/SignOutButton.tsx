"use client";
import { signOut } from "next-auth/react";

export default function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="text-red-600 hover:underline text-xs"
    >
      Sair
    </button>
  );
}