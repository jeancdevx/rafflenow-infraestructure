export function extractClaims(event) {
  const claims = event.requestContext?.authorizer?.claims;
  return claims || null;
}

export function isAdmin(claims) {
  const groups = claims?.["cognito:groups"];
  if (!groups) return false;

  if (typeof groups === "string") {
    return groups === "Admin";
  }

  if (Array.isArray(groups)) {
    return groups.includes("Admin");
  }

  return false;
}

export function getUserId(claims) {
  return claims?.sub || "unknown";
}
