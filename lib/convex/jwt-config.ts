export const CONVEX_APPLICATION_ID = "shothik-publishing";
export const CONVEX_JWT_KID = "shothik-convex-1";
export const CONVEX_JWT_PUBLIC_EXPONENT = "AQAB";

// This public modulus matches the JWT_PRIVATE_KEY currently configured for the
// app. We keep it source-controlled so the Next.js signer and the deployed
// Convex JWKS stay aligned even while deployment env permissions are limited.
const SOURCE_CONTROLLED_CONVEX_JWT_PUBLIC_KEY_N =
  "wqD5FnJgpV2Gd2uocAfSKL5SBKrzIuCo5BrH7-30U4nB1PVZ4GxSVaIOhQgv3x7x_QEyzO0-ogInB9Sp-Xr12OogDey9PgfZp4xW59O-kW7RsGW-yK6HecnrXPaoeWIJqQo2H__kX1ketxeTZ17Mg5zl9vYY8yYqPNtV5vUWncPnAzkCaLvnJDhk6ZkT_-lXl6hYX-Pva_NGnMg6piAQ0g6fhzK6YW1L7haNXAXksjoXANlyZ57FJ9q_rU6koVnO7HBJSwv3NhJpOKhDFNfD00Vw3g0mCWuK9iyrsgFeVfYTzrh2tXFY5h4Bb17ghi8H0A4fQSYZOYyD3D41V7XcVw";

export function getConfiguredConvexJwtPublicKeyN(): string {
  return SOURCE_CONTROLLED_CONVEX_JWT_PUBLIC_KEY_N;
}

export function getConfiguredConvexJwks() {
  return {
    keys: [
      {
        kty: "RSA",
        use: "sig",
        kid: CONVEX_JWT_KID,
        alg: "RS256",
        n: getConfiguredConvexJwtPublicKeyN(),
        e: CONVEX_JWT_PUBLIC_EXPONENT,
      },
    ],
  };
}
