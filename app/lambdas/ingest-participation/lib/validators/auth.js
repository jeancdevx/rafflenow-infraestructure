import { UnauthorizedError, ForbiddenError } from "../errors.js";

export function extractClaims(event) {
  const claims = event.requestContext?.authorizer?.claims;
  if (!claims) {
    throw new UnauthorizedError("Authentication required to participate");
  }
  return claims;
}

export function getUserEmail(claims) {
  return claims?.email || "unknown";
}

export function getUserName(claims) {
  const firstName = claims?.given_name || "";
  const lastName = claims?.family_name || "";
  return `${firstName} ${lastName}`.trim();
}

export function getUserId(claims) {
  const userId = claims?.sub;
  if (!userId) {
    throw new UnauthorizedError("Missing user identifier in token");
  }
  return userId;
}

export function ensureNotAdmin(claims) {
  const groups = claims?.["cognito:groups"];

  if (!groups) return;

  const isAdmin =
    typeof groups === "string"
      ? groups === "Admin"
      : Array.isArray(groups) && groups.includes("Admin");

  if (isAdmin) {
    throw new ForbiddenError("Administrators cannot participate in raffles");
  }
}
