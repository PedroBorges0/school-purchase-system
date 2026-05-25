"use client";
import { signOut } from "next-auth/react";

export default function SignOutButton() {
  async function handleSignOut() {
    await signOut({ redirect: false });
    // Força limpeza completa redirecionando pelo browser
    window.location.href = "/login";
  }

  return (
    <button
      onClick={handleSignOut}
      className="text-red-600 hover:underline text-xs"
    >
      Sair
    </button>
  );
}