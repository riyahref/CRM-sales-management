import { prisma } from "../lib/prisma.js";
import { NotFoundError } from "../lib/errors.js";

export class UserService {
  public async getUsers(includeInactive: boolean = false) {
    const users = await prisma.user.findMany({
      where: includeInactive ? {} : { isActive: true },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true
      },
      orderBy: { name: "asc" }
    });

    return users;
  }

  public async updateUserStatus(id: number, isActive: boolean) {
    const user = await prisma.user.findUnique({
      where: { id }
    });

    if (!user) {
      throw new NotFoundError("This record could not be found.");
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { isActive },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true
      }
    });

    return updatedUser;
  }
}

export const userService = new UserService();
