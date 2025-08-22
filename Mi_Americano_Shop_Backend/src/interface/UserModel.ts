import { User } from "../schemas/user.ts";
import { ModelDB } from "./model.ts";

export interface UserModelDB extends ModelDB<User> {
  getByEmail: ({ email }: { email: string }) => Promise<User | undefined>;
}
