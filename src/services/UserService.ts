import { Injectable } from "@tsed/di";
import { PrismaClient, User } from "@prisma/client";

@Injectable()
export class UserService {
  private prisma = new PrismaClient();

  async createUser(data: { email: string; password: string }): Promise<User> {
    return this.prisma.user.create({
      data,
    });
  }

  async findUserByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async findUserById(id: number): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }
}
