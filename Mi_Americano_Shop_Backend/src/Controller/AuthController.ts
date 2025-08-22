// Controller/controllerAuth.ts
import { User, UserLogin } from "../schemas/user.ts";
import { UserModelDB } from "../interface/UserModel.ts";
import { AuthService } from "../services/Authservice.ts";

export class AuthController {
  private authService: AuthService;

  constructor(private userModel: UserModelDB) {
    this.authService = new AuthService(userModel);
  }

  async login(input: { user: UserLogin }) {
    return await this.authService.login(input);
  }

  async register(userData: User) {
    return await this.authService.register(userData);
  }

  async verifyToken(token: string) {
    return await this.authService.verifyToken(token);
  }

  async refreshToken(oldToken: string) {
    return await this.authService.refreshToken(oldToken);
  }
}
