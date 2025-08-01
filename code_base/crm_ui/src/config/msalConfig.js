// Microsoft Authentication Library (MSAL) Configuration
export const msalConfig = {
  auth: {
    clientId: process.env.REACT_APP_MICROSOFT_CLIENT_ID,
    authority: `https://login.microsoftonline.com/common`,
    redirectUri: window.location.origin,
    postLogoutRedirectUri: window.location.origin,
    navigateToLoginRequestUrl: false,
  },
  cache: {
    cacheLocation: "sessionStorage",
    storeAuthStateInCookie: false,
  },
  system: {
    allowRedirectInIframe: true,
    loggerOptions: {
      loggerCallback: (level, message, containsPii) => {
        if (containsPii) {
          return;
        }
        switch (level) {
          case 0:
            console.error(message);
            return;
          case 1:
            console.warn(message);
            return;
          case 2:
            console.info(message);
            return;
          case 3:
            console.debug(message);
            return;
          default:
            console.log(message);
            return;
        }
      },
      logLevel: 3, // Info level
    },
  },
};

// Add scopes here for ID tokens to be used at Microsoft identity platform endpoints.
export const loginRequest = {
  scopes: ["User.Read", "email", "profile", "openid"]
};

// Add the endpoints here for Microsoft Graph API services you'd like to use.
export const graphConfig = {
  graphMeEndpoint: "https://graph.microsoft.com/v1.0/me"
};
