import { Request, Response } from "express";
import { generateJwtAndRefreshToken } from "../auth";
import { checkRefreshTokenIsValid, invalidateRefreshToken } from "../database";
import { RefreshService } from "../services/RefreshService";

class RefreshController {
  async handle(request: Request, response: Response) {
    const email = request.user;
    const { refreshToken } = request.body;

    const service = new RefreshService();

    const user = await service.execute(email);

    if (!user) {
      return response.status(401).json({
        error: true,
        message: "User not found.",
      });
    }

    if (!refreshToken) {
      return response
        .status(401)
        .json({ error: true, message: "Refresh token is required." });
    }

    const isValidRefreshToken = checkRefreshTokenIsValid(email, refreshToken);

    if (!isValidRefreshToken) {
      return response
        .status(401)
        .json({ error: true, message: "Refresh token is invalid." });
    }

    invalidateRefreshToken(email, refreshToken);

    const { token, refreshToken: newRefreshToken } = generateJwtAndRefreshToken(
      email,
      {
        roles: user.role,
      }
    );

    return response.json({
      token,
      refreshToken: newRefreshToken,
      roles: user.role,
    });
  }
}

export { RefreshController };
