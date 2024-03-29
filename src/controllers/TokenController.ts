import { CheckRefreshTokenService } from "../services/tokens/CheckRefreshTokenService";
import { CreateTokenService } from "../services/tokens/CreateTokenService";

export async function createRefreshToken(email: string) {
  const service = new CreateTokenService();
  const currentUserTokens = await service.execute(email);
  return currentUserTokens;
}

export async function checkRefreshTokenIsValid(
  email: string,
  refreshToken: string
) {
  const service = new CheckRefreshTokenService();
  const userRefreshToken = await service.execute(email);
  return userRefreshToken === refreshToken;
}
