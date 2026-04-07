import type { UserRecord } from "@/types/auth";

const DEMO_USERS: UserRecord[] = [
  {
    id: "user_admin_01",
    email: "admin@inkbranch.local",
    name: "Inkbranch Admin",
    role: "admin",
    password: "inkbranch-admin",
  },
  {
    id: "user_reader_01",
    email: "reader@inkbranch.local",
    name: "Inkbranch Reader",
    role: "reader",
    password: "inkbranch-reader",
  },
  {
    id: "user_creator_01",
    email: "creator@inkbranch.local",
    name: "Future Creator",
    role: "creator",
    password: "inkbranch-creator",
  },
];

export function listDemoUsers() {
  return DEMO_USERS;
}

export function findUserById(userId: string) {
  return DEMO_USERS.find((user) => user.id === userId) ?? null;
}

export function authenticateDemoUser(email: string, password: string) {
  const user = DEMO_USERS.find(
    (entry) => entry.email.toLowerCase() === email.toLowerCase().trim(),
  );

  if (!user || user.password !== password) {
    return null;
  }

  return user;
}
