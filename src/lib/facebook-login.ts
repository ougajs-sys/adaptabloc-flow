const FACEBOOK_APP_ID = "210441536707008";

export function getRedirectUri() {
  return `${window.location.origin}/login`;
}

export function openFacebookLogin(): Promise<string> {
  return new Promise((resolve, reject) => {
    const redirectUri = getRedirectUri();
    const scope = "email,public_profile";
    const url = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${FACEBOOK_APP_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&response_type=code`;

    const width = 600;
    const height = 700;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    const popup = window.open(
      url,
      "facebook-login",
      `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no`
    );

    if (!popup) {
      reject(new Error("Popup bloquée. Autorisez les popups pour vous connecter avec Facebook."));
      return;
    }

    const interval = setInterval(() => {
      try {
        if (popup.closed) {
          clearInterval(interval);
          reject(new Error("Connexion annulée."));
          return;
        }

        const popupUrl = popup.location.href;
        if (popupUrl.startsWith(window.location.origin)) {
          const urlParams = new URL(popupUrl).searchParams;
          const code = urlParams.get("code");
          const error = urlParams.get("error");

          popup.close();
          clearInterval(interval);

          if (error) {
            reject(new Error(`Facebook: ${urlParams.get("error_description") || error}`));
          } else if (code) {
            resolve(code);
          } else {
            reject(new Error("Pas de code d'autorisation reçu."));
          }
        }
      } catch {
        // Cross-origin - popup not yet redirected back, keep waiting
      }
    }, 500);
  });
}
