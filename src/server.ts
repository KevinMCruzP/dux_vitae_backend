import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import decode from "jwt-decode";
import { generateJwtAndRefreshToken } from "./auth";
import { auth } from "./config";
import {
  checkRefreshTokenIsValid,
  invalidateRefreshToken,
  seedUserStore,
  users,
} from "./database";
import { app, httpServer } from "./http";
import { CreateSessionDTO, DecodedToken } from "./types";
import "./websocket/websocket";

//Base de datos local
seedUserStore();

//middleware para chequear autentificación del usuario
function checkAuthMiddleware(
  request: Request,
  response: Response,
  next: NextFunction
) {
  const { authorization } = request.headers;

  if (!authorization) {
    return response.status(401).json({
      error: true,
      code: "token.invalid",
      message: "Token not present.",
    });
  }

  const [, token] = authorization?.split(" ");

  if (!token) {
    return response.status(401).json({
      error: true,
      code: "token.invalid",
      message: "Token not present.",
    });
  }

  try {
    const decoded = jwt.verify(token as string, auth.secret) as DecodedToken;

    request.user = decoded.sub;

    return next();
  } catch (err) {
    return response
      .status(401)
      .json({ error: true, code: "token.expired", message: "Token invalid." });
  }
}

//Agregando información del usuario al request
function addUserInformationToRequest(
  request: Request,
  response: Response,
  next: NextFunction
) {
  const { authorization } = request.headers;

  if (!authorization) {
    return response.status(401).json({
      error: true,
      code: "token.invalid",
      message: "Token not present.",
    });
  }

  const [, token] = authorization?.split(" ");

  if (!token) {
    return response.status(401).json({
      error: true,
      code: "token.invalid",
      message: "Token not present.",
    });
  }

  try {
    const decoded = decode(token as string) as DecodedToken;

    request.user = decoded.sub;

    return next();
  } catch (err) {
    return response.status(401).json({
      error: true,
      code: "token.invalid",
      message: "Invalid token format.",
    });
  }
}

//login
app.post("/sessions", (request, response) => {
  const { email, password } = request.body as CreateSessionDTO;

  const user = users.get(email);

  if (!user || password !== user.password) {
    return response.status(401).json({
      error: true,
      message: "E-mail or password incorrect.",
    });
  }

  const { token, refreshToken } = generateJwtAndRefreshToken(email, {
    permissions: user.permissions,
    roles: user.roles,
  });

  return response.json({
    token,
    refreshToken,
    permissions: user.permissions,
    roles: user.roles,
  });
});

//refresh token
app.post("/refresh", addUserInformationToRequest, (request, response) => {
  const email = request.user;
  const { refreshToken } = request.body;

  const user = users.get(email);

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
      permissions: user.permissions,
      roles: user.roles,
    }
  );

  return response.json({
    token,
    refreshToken: newRefreshToken,
    permissions: user.permissions,
    roles: user.roles,
  });
});

//Buscar datos del usuario
app.get("/me", checkAuthMiddleware, (request, response) => {
  const email = request.user;

  const user = users.get(email);

  if (!user) {
    return response
      .status(400)
      .json({ error: true, message: "User not found." });
  }

  return response.json({
    email,
    permissions: user.permissions,
    roles: user.roles,
  });
});

httpServer.listen(3333, () => {
  console.log("Server running on port 3333");
});
