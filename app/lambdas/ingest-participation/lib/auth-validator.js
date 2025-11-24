export function extractClaims(event) {
  const claims = event.requestContext?.authorizer?.claims;
  return claims || null;
}

export function getUserEmail(claims) {
  return claims?.email || "unknown";
}

export function getUserName(claims) {
  const firstName = claims?.given_name || "";
  const lastName = claims?.family_name || "";
  return `${firstName} ${lastName}`.trim();
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
