import { logger } from "./powertools.js";

export function extractClaims(event) {
  const claims = event.requestContext?.authorizer?.claims;

  if (!claims) {
    logger.warn("Unauthorized access attempt - no claims found");
    return null;
  }

  return claims;
}

export function isAdmin(claims) {
  if (!claims) {
    return false;
  }

  const groups = claims["cognito:groups"];

  if (!groups) {
    logger.debug("User has no groups assigned");
    return false;
  }

  const isAdminUser = Array.isArray(groups)
    ? groups.includes("Admin")
    : groups === "Admin";

  if (!isAdminUser) {
    logger.warn("Non-admin user attempted admin operation", {
      email: claims.email,
      groups: groups,
    });
  }

  return isAdminUser;
}

export function getUserEmail(claims) {
  return claims?.email || "unknown";
}
