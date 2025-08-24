// Controller/controllerAuth.ts
import { UserCreate, UserCreateSchema, UserLogin } from "../schemas/user.ts";
import { UserModelDB } from "../interface/UserModel.ts";
import { AuthService } from "../services/AuthService.ts";

export class AuthController {
  private authService: AuthService;

  constructor(private userModel: UserModelDB) {
    this.authService = new AuthService(userModel);
  }

  async login(input: { user: UserLogin }) {
    try {
      if (!input.user) {
        throw new Error("Usuario no encontrado");
      }
      if (!input.user.email || !input.user.password) {
        throw new Error("Email o contraseña incorrectos");
      }
      const nuevoUsuario = await this.authService.login(input);
      if (!nuevoUsuario) {
        throw new Error("Usuario no encontrado");
      }
      return nuevoUsuario;
    } catch (error) {
      printError(error);
      throw new Error("Error al logearse el usuario");
    }
  }

  async register(userData: UserCreate) {
    try {
      const validatedData = UserCreateSchema.parse(userData);

      const nuevoUsuario = await this.authService.register(validatedData);
      return nuevoUsuario;
    } catch (error) {
      printError(error);
      throw new Error("Error al crear el usuario");
    }
  }

  async verifyToken(token: string) {
    return await this.authService.verifyToken(token);
  }

  async refreshToken(oldToken: string) {
    return await this.authService.refreshToken(oldToken);
  }
}

function printError(error: unknown): void {
  const dev = Deno.env.get("ENV");
  if (dev) {
    console.error("Error:", error);
  }
}
