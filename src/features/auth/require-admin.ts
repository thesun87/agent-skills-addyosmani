import { auth } from "@/auth";

export class UnauthorizedError extends Error {
  constructor(message = "Yêu cầu quyền quản trị viên.") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id || !session?.user?.email) {
    throw new UnauthorizedError();
  }
  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name || "Thu Ngân Quầy 1",
  };
}

export async function getAdminSession() {
  const session = await auth();
  if (!session?.user?.id || !session?.user?.email) {
    return null;
  }
  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name || "Thu Ngân Quầy 1",
  };
}
