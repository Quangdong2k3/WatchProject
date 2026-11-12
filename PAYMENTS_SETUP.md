# VietQR checkout and order email setup

Checkout uses a locally generated VietQR for VietinBank and stores submitted orders in Cloud Firestore with the `pending_payment` status. The bank account is not sent to an external QR-image service. A successful order response means the order was recorded; it does not mean the transfer was received or verified.

## Required services

1. Use the Firebase project configured by `VITE_FIREBASE_PROJECT_ID`.
2. Enable Cloud Firestore and Cloud Functions for the project. Deploying Cloud Functions requires a Firebase plan that supports them.
3. Verify a sender address/domain in Resend.
4. Install the Firebase CLI and sign in:

   ```sh
   npm install --global firebase-tools
   firebase login
   firebase use --add
   ```

5. Set the Resend API key as a server-side secret, then deploy:

   ```sh
   firebase functions:secrets:set RESEND_API_KEY
   firebase deploy --only functions
   ```

   Firebase prompts for `RESEND_FROM_EMAIL` during deployment. Enter the verified sender, for example `WATCH DAK <orders@your-verified-domain>`. Never put the Resend key in a `VITE_` variable or commit it.

6. Make sure `.env.local` contains the same `VITE_FIREBASE_PROJECT_ID` as the deployed Firebase project, then restart Vite. Checkout calls the `createOrder` function in `asia-southeast1`.

The function validates product IDs and recalculates prices from `shared/catalog.json`, writes orders to Firestore, and emails both the customer and the store address in `shared/payment-config.json`. If an email fails after an order is saved, the checkout page offers a retry without creating another order.

## Before accepting payments

- Verify the account holder name and number in `shared/payment-config.json`. The supplied account name is currently set to `Viettinbank`; it must match the name shown by the bank.
- Confirm the store notification address and the verified Resend sender.
- Deploy the function and test an order using a small amount. Check both email delivery and the `orders` collection in Firestore.
- Transfers are **not automatically verified**. Check the bank transaction before changing an order from `pending_payment` or telling the customer payment is complete.
