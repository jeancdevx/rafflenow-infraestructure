import { type ReactNode } from "react";
import { Amplify } from "aws-amplify";
import { cognitoUserPoolsTokenProvider } from "aws-amplify/auth/cognito";
import { CookieStorage } from "aws-amplify/utils";

interface AmplifyProviderProps {
  children: ReactNode;
}

let isConfigured = false;

const configureAmplify = () => {
  if (typeof window === "undefined" || isConfigured) return;

  const amplifyConfig = {
    Auth: {
      Cognito: {
        userPoolId: import.meta.env.PUBLIC_COGNITO_USER_POOL_ID || "",
        userPoolClientId: import.meta.env.PUBLIC_COGNITO_CLIENT_ID || "",
        loginWith: {
          email: true,
        },
      },
    },
  };

  Amplify.configure(amplifyConfig, { ssr: false });

  cognitoUserPoolsTokenProvider.setKeyValueStorage(
    new CookieStorage({
      domain: window.location.hostname,
      path: "/",
      expires: 30,
      secure: window.location.protocol === "https:",
      sameSite: "lax",
    })
  );

  isConfigured = true;
};

export function AmplifyProvider({ children }: AmplifyProviderProps) {
  // Configurar de forma síncrona en el render
  if (typeof window !== "undefined") {
    configureAmplify();
  }

  return <>{children}</>;
}
