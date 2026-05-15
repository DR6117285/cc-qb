# Phase 4 — Subscriptions

**Goal**: Stripe integration. Free tier capped at 20 questions/day. Real payment unlocks Premium.
**Time estimate**: Week 6

## Install

```bash
npm install stripe @stripe/stripe-js
```

## Schema Addition

Already in schema: `User.subscriptionTier SubscriptionTier @default(Free)`

Add Stripe customer ID:
```prisma
model User {
  // ... existing fields
  stripeCustomerId String? @unique
}
```

```bash
npx prisma migrate dev --name add-stripe
```

## Environment Variables

```
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PREMIUM_PRICE_ID=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
```

## Webhook Handler

`app/api/stripe/webhook/route.ts`:
- Verify Stripe signature
- On `checkout.session.completed`:
  - Update `User.subscriptionTier = 'Premium'`
  - Store `stripeCustomerId`
- On `customer.subscription.deleted`:
  - Revert to `Free`

## Free Tier Gate

In `quiz/service.createSession()`:

```typescript
if (user.subscriptionTier === 'Free') {
  const todayCount = await countQuestionsAnsweredToday(userId)
  if (todayCount >= 20) {
    throw new Error('DAILY_LIMIT_REACHED')
  }
}
```

The `/quiz/new` Server Action catches `DAILY_LIMIT_REACHED` and redirects to `/pricing`.

## Pricing Page

`app/pricing/page.tsx` (RSC):
- Free vs Premium comparison table
- "Upgrade" button → Stripe Checkout (Server Action creates checkout session)

## Done When

- [ ] Free user blocked after 20 questions/day
- [ ] `/pricing` page renders
- [ ] Test payment (Stripe test mode) upgrades user tier
- [ ] Webhook correctly handles subscription cancellation
