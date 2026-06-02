# happy

Birthday surprise app — a password-protected `/birthday` page that unlocks a celebration screen with confetti, animation, and a photo. Designed to be paired with a printed credit-card with a QR code on the back that links to the page.

## Run locally

```bash
npm install
cp .env.local.example .env.local   # then edit values
npm run dev
# open http://localhost:3000/birthday
```

Required env vars (see `.env.local`):

- `BIRTHDAY_PASSWORD` — password the recipient must enter (digits/dashes/spaces are normalized)
- `RECIPIENT_NAME` — name shown on the celebration screen
- `SENDER_NAME` — name shown in the card caption next to the recipient

## Generate the printed card

After deploying (e.g. to Vercel) and getting the public URL:

```bash
npm run generate-card -- https://<your-domain>.vercel.app/birthday
```

This writes three PNGs to `card-output/`:

- `card-front.png` — Instagram-style post with the couple photo
- `card-back.png` — "I ❤ You" + QR code inside a heart
- `card-combined.png` — both sides side-by-side, ready to print on one sheet

Card size is credit-card portrait (54×85 mm) at ~600 dpi.

## Stack

Next.js 15 (App Router), React 19, framer-motion, canvas-confetti, qrcode + sharp for card rendering.
