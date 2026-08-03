import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { createClient } from "@libsql/client";
import bcrypt from "bcryptjs";

const db = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});
await db.execute(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL
  )
`);

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google,
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email as string;
        const password = credentials?.password as string;
        if (!email || !password) return null;

        const result = await db.execute({
          sql: "SELECT * FROM users WHERE email = ?",
          args: [email],
        });
        const user = result.rows[0] as any;
        if (!user) return null;

        const valid = await bcrypt.compare(password, user.password_hash as string);
        if (!valid) return null;

        return { email: user.email as string };
      },
    }),
  ],
});