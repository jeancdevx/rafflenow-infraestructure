import { Amplify } from 'aws-amplify';
import { cognitoUserPoolsTokenProvider } from 'aws-amplify/auth/cognito';
import { CookieStorage } from 'aws-amplify/utils';

const amplifyConfig = {
  Auth: {
    Cognito: {
      userPoolId: import.meta.env.PUBLIC_COGNITO_USER_POOL_ID || '',
      userPoolClientId: import.meta.env.PUBLIC_COGNITO_CLIENT_ID || '',
      loginWith: {
        email: true,
      },
      signUpVerificationMethod: 'code' as const,
      userAttributes: {
        email: {
          required: true,
        },
      },
      passwordFormat: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireNumbers: true,
        requireSpecialCharacters: true,
      },
    },
  },
};

Amplify.configure(amplifyConfig);

cognitoUserPoolsTokenProvider.setKeyValueStorage(new CookieStorage({
  domain: window.location.hostname,
  path: '/',
  expires: 30,
  secure: window.location.protocol === 'https:',
  sameSite: 'lax',
}));

export { amplifyConfig };
