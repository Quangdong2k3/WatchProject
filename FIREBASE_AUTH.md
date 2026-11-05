# Firebase Authentication setup

The React app supports email/password, Google, and Facebook sign-in through Firebase Authentication. OAuth credentials are not included in the repository. Configure a Firebase project before using these flows.

## 1. Create a Firebase web app

1. Open the Firebase console and create or select a project.
2. Add a Web app and copy its web configuration values.
3. Copy `.env.example` to `.env.local` and fill in the values:

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_APP_ID=...
```

The web API key and app ID identify the Firebase web app; they are not server secrets. Never put a Facebook App Secret, service-account key, or other private credential in a `VITE_` variable.

## 2. Enable email/password

In Firebase Console, open **Authentication → Sign-in method** and enable **Email/Password**.

## 3. Enable Google

In **Authentication → Sign-in method**, enable **Google** and select a support email.

## 4. Enable Facebook

1. Create a Facebook Login app and enable the Web login product.
2. In Firebase **Authentication → Sign-in method → Facebook**, enable the provider and enter the Facebook App ID and App Secret there.
3. Copy Firebase's OAuth redirect URI shown in that provider panel into the Facebook Login **Valid OAuth Redirect URIs** list.
4. Add the deployed site domain under **Firebase Authentication → Settings → Authorized domains**. For local testing, add `localhost` if it is not already present.

Keep the Facebook App Secret in the Firebase Console only. Do not commit it or put it in `.env.local`.

## 5. Run the app

Restart Vite after changing environment variables:

```sh
npm run dev
```

The `/login` and `/LOGIN.html` pages sign users in. The `/register` and `/formdnhap/formdnhap.html` pages create email/password users or sign up through a social provider. Firebase manages the auth session; the header shows the signed-in user and a sign-out control.
