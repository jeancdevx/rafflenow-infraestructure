export function extractClaims(event) {
  const claims = event.requestContext?.authorizer?.claims;
  return claims || null;
}

export function isAdmin(claims) {
  if (!claims) {
    return false;
  }

  const groups = claims["cognito:groups"];

  if (!groups) {
    return false;
  }

  if (Array.isArray(groups)) {
    return groups.includes("Admin");
  }

  return groups === "Admin";
}

export function getUserEmail(claims) {
  return claims?.email || "unknown";
}
