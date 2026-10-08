# HU-011 — Administración del Carrito de Compras

This document explains how the shopping-cart feature (`modules/cart`, plus the `products`/`promotions`/`memberships` it introduces) is implemented: where the code lives, each endpoint's contract, how RN-044..RN-048 map to code, the design decisions made to fill gaps in the user story, and known limitations.

> Note on the file location: the ticket asked for `docs/h11.md`. This repo already has a `hu-010-seat.md` doc for HU-010 living at `backend/src/docs/`, so this HU-011 doc was placed next to it as `hu-011-cart.md` to keep the convention (and be discoverable from the same folder) instead of starting a second, differently-named docs location.

## 1. Where the code lives

```
modules/cart/
├── domain/entities/
│   ├── cart.entity.ts                 # Cart (extended: CartStatus enum, membershipApplied)
│   ├── product.entity.ts              # Confectionery catalog item
│   ├── cart-concession-item.entity.ts # Cart ⇄ Product line item (quantity, price snapshot)
│   ├── cart-gift-card.entity.ts       # Cart ⇄ GiftCard attachment
│   └── ticket.entity.ts               # Pre-existing (post-purchase ticket, unrelated to cart display)
├── application/
│   ├── dtos/cart.dto.ts               # Zod-based request/response contracts
│   └── services/cart.service.ts       # All business logic (CartService)
├── infrastructure/dao/
│   ├── cart.repository.ts             # Cart + seat-lock/function/movie reads (for "Entradas")
│   └── cart-item.repository.ts        # Product catalog + concession items + gift-card attachments
├── ui/controllers/cart.controller.ts  # The 6 HU-011 endpoints
└── cart.module.ts

modules/promotions/
├── domain/entities/{promotion,gift-card}.entity.ts
├── infrastructure/dao/{promotion,gift-card}.repository.ts
└── promotions.module.ts

modules/users/
├── domain/entities/membership.entity.ts
└── infrastructure/dao/membership.repository.ts   # added to the existing UsersModule
```

Same layering as HU-009/HU-010: controllers only translate HTTP in/out, `CartService` holds every business rule, and the two repositories are the only classes that talk to TypeORM.

## 2. Data model

- **`carts`**: the entity already existed in the codebase (from an earlier HU-010 branch) but had **no migration** — nothing created the table. This HU adds it. Two changes to the entity itself:
  - `status` is now the canonical `CartStatus` enum (`ACTIVE | EXPIRED | CANCELLED | CONVERTED`) instead of a free `string`, mirroring how HU-010 constrained `seatType`.
  - `id` changed from `@PrimaryGeneratedColumn` to `@PrimaryColumn` (app-supplied). See §4 "Design decisions" for why.
  - Added `membershipApplied: boolean` (RN-047 toggle).
- **`products`**: the confectionery catalog (`name`, `imageUrl`, `price`, `stock`, `active`). Nothing in the codebase modeled this before HU-011.
- **`cart_concession_items`**: one row per product in a cart, `UNIQUE(cart_id, product_id)`. `unitPrice` is a **snapshot** of `product.price` at the time it was added, so a later catalog price change doesn't retroactively change an open cart.
- **`promotions`**: `discountType` (`PERCENTAGE|FIXED`) + `discountValue`, optionally scoped to one `productId` (`null` = applies to the whole confectionery subtotal), and `combinable: boolean` — the field RN-048 hangs off.
- **`gift_cards`**: `code`, `balance`, `active`.
- **`cart_gift_cards`**: which gift card(s) are attached to a cart, `UNIQUE(cart_id, gift_card_id)`.
- **`memberships`**: `userId` (unique), `tier`, `discountPercent`, `active`.

As with `seat_locks.cart_id` and `tickets.order_id` elsewhere in this codebase, `cart_id`/`user_id` columns are **plain UUID columns with no FK constraint** — cross-aggregate references stay decoupled by convention. FKs only exist within the same aggregate (e.g. `cart_concession_items.product_id → products.id`).

Migration: `1761000000000-CreateCartAdministrationSchema.ts` creates `carts` (plus a **partial unique index** `carts_user_active_uq` on `user_id` for `status = 'ACTIVE'`, enforcing RN-044 at the database level), `products`, `cart_concession_items`, `promotions`, `gift_cards`, `cart_gift_cards`, and `memberships`.

## 3. Endpoints

All six endpoints from the ticket, under `/api/v2/cart` (global prefix from `main.ts`):

### `POST /cart`
Body: `{ userId, cartId? }`. RN-044: if the user already has an `ACTIVE` cart, that one is returned as-is (idempotent) and no new row is created. Otherwise creates one, using `cartId` when the caller supplies it (see §4) or generating a UUID.

### `GET /cart?cartId=`
Full cart view: entradas, confitería, applied gift cards, and the resumen. 404 if the cart doesn't exist. Also where RN-046's lazy expiry check happens (see §4) — an active cart past its window flips to `EXPIRED` before being returned.

### `PUT /cart`
Body: `{ cartId, concessionItems: [{ productId, quantity }] }`. Adds/updates confectionery lines; `quantity: 0` removes the line. Validates: product exists (404), product is `active` and in stock (400), no negative quantities (rejected by the zod schema itself). 410 if the cart isn't `ACTIVE`.

### `DELETE /cart`
Body: `{ cartId }`. Empties the cart: releases every seat lock the cart holds (RN-045 — the seats stop being reserved once the cart is gone), clears its confectionery items and gift-card attachments, and sets `status = CANCELLED`. Returns `{ cartId, status, releasedSeats }`.

### `POST /cart/apply-membership`
Body: `{ cartId }`. Looks up the user's active `Membership` and sets `cart.membershipApplied = true`. 404 if there's no active membership. The discount **percentage itself is never sent by the client** — RN-047 requires it be computed automatically, so the endpoint only flips a flag; the actual amount is recalculated from the membership row every time the cart is read (see §4).

### `POST /cart/apply-giftcard`
Body: `{ cartId, code }`. Validates the code exists, is `active`, and has a positive balance, then attaches it to the cart (idempotent — re-applying the same code is a no-op via `ON CONFLICT DO NOTHING`). The actual amount redeemed is computed at read time against the cart's current total (see §4), not stored — so it stays correct as the rest of the cart changes.

## 4. Business rules → code, and design decisions

The ticket's "Endpoints" section lists only these six routes — there's no `apply-promotion` endpoint. Reading the rest of the ticket, "Promociones" is listed under **Confitería**, not under **Entradas**, and RN-038 (functions/pricing promotions) is explicitly out of scope per the HU-010 doc. So promotions here are modeled as **automatic**, confectionery-only discounts, recomputed on every read — no persisted "applied promotion" join table, unlike gift cards which *do* need one (the ticket gives them an explicit `apply` endpoint, i.e. explicit user intent to attach a specific code).

| Rule | Enforcement |
|---|---|
| RN-044 (one active cart per user) | `CartRepository.findActiveByUserId` is checked in `createOrGetCart`; DB-level backstop is the partial unique index `carts_user_active_uq`. |
| RN-045 (seats locked while cart is active) | Not re-implemented — the cart reads HU-010's `seat_locks` table directly (`CartRepository.findLocksByCartId`) to build the "Entradas" lines. `DELETE /cart` calls `deleteLocksByCartId` so locks don't outlive their cart. |
| RN-046 (10-minute inactivity expiry) | `CART_TTL_MINUTES = 10` in `cart.service.ts`. `expiresAt` is refreshed (`touch()`) after every mutating call (`PUT /cart`, `apply-membership`, `apply-giftcard`). Expiry is **lazy**, same pattern as HU-010's seat locks: `resolveExpiry()` runs at the top of every read/write, and if an `ACTIVE` cart's `expiresAt` has passed, it's flipped to `EXPIRED` and its seat locks released right there — there is no scheduled job. |
| RN-047 (membership discount auto-calculated) | `applyMembership` only records *that* the discount applies (`membershipApplied: true`); `CartService.buildResponse` re-fetches the user's active `Membership` and recomputes `discountPercent × ticketsSubtotal` on every read, so admin changes to a membership's discount are reflected immediately without the client ever sending a percentage. |
| RN-048 (promotions can't combine if forbidden) | `pickDiscount()` in `cart.service.ts`: given the promotions applicable to a target (a product, or the confectionery subtotal), if **any** of them has `combinable: false`, only the single highest-value one is applied; otherwise every combinable one stacks. Applied independently per product, then once more for cart-wide promotions against the post-product-discount subtotal. |
| Validations: no out-of-stock / no negative quantities / cart must exist | `PUT /cart` checks `product.stock < quantity` (400) and `product.active` (400); `quantity` is `z.coerce.number().int().nonnegative()` in the zod schema, so negative values 400 before reaching the service; every mutating endpoint resolves the cart first and 404s if it's missing. |
| "No permitir modificar sillas ocupadas" | Enforced by HU-010's `SeatService.lockSeats`, not duplicated here — the cart module only *reads* `seat_locks`, it never creates or edits a lock for an occupied seat. |

**Why `Cart.id` became an app-supplied `@PrimaryColumn` instead of `@PrimaryGeneratedColumn`:** the ticket's flow is *"Seleccionar sillas → Crear carrito → Agregar entradas..."*, but HU-010's `POST /reservations/lock-seats` already requires a `cartId` in its body **before** any `Cart` row exists (seat selection happens first). For the cart created afterwards to actually own those pre-existing locks, `POST /cart` accepts an optional `cartId` so the frontend can pass the same id it already used for `lock-seats`; the id is generated server-side only when the caller omits it. This is an assumption filling a gap the ticket doesn't spell out explicitly — flagging it here in case the intended flow is different (e.g. the server should mint the cart id first, and seat selection should be re-ordered after cart creation).

**Tax rate:** `TAX_RATE = 0.19` is a placeholder constant in `cart.service.ts`, in the same spirit as HU-010's `MAX_SEATS_PER_RESERVATION` — the ticket asks for an "Impuestos" line but doesn't specify a rate or an admin-configurable source for it.

**Gift card redemption order:** if more than one gift card is attached, they're redeemed in the order they were applied (oldest first) against the cart's total *after* tax, each capped at `min(balance, amount still owed)`. A gift card's stored `balance` is **not decremented** by attaching it — HU-011 stops at reviewing the cart before payment, so actually debiting the gift card belongs to the (out-of-scope) payment/order flow; `GET /cart` always shows what *would* be redeemed against the cart's current total.

## 5. Response shape

`GET/POST/PUT /cart` all return the same `CartResponse` (see `cart.dto.ts`), covering every field the ticket lists:

- **Entradas** (`tickets[]`, one line per function currently locked by this cart): `movieTitle`, `startsAt` (fecha+hora), `roomName` (sala), `format` (`functionType.projection`), `quantity`, `seatLabels` (número de sillas, e.g. `["A1","A2"]`), `unitPrice`, `discount` (membership), `total`.
- **Confitería** (`concessionItems[]`): `name`, `imageUrl`, `quantity`, `unitPrice`, `promotion` (code/name/amount or `null`), `subtotal`.
- **Resumen** (`summary`): `subtotal`, `membershipDiscount`, `promotionsDiscount`, `giftCardsApplied`, `taxRate`, `taxes`, `total`.

"El usuario podrá regresar al selector de sillas sin perder la compra" needs no extra endpoint: the cart and its seat locks live server-side keyed by `cartId`, so re-fetching `GET /functions/{id}/seats?cartId=` (HU-010) or `GET /cart?cartId=` after navigating away and back returns the same state.

## 6. Tests

`cart.service.spec.ts` covers RN-044 (existing active cart is reused), RN-046 (lazy expiry + touch), RN-047 (membership discount recomputed from the membership row, 404 without one), RN-048 (both the "non-combinable wins" and "combinable stacks" branches), the stock/inactive-product/negative-quantity validations, and gift-card attach/reject paths. All via mocked repositories, following the existing `set-user-location.service.spec.ts` style — no real DB is touched.

## 7. Known limitations / follow-ups

- **No `Order`/payment integration.** "Continuar al pago" (the step after this HU) isn't built; `CartStatus.CONVERTED` exists in the enum for that future transition but nothing sets it yet.
- **Promotions/gift cards/memberships have no admin CRUD or seed data** — only the read paths this HU needs exist. An admin module to create/edit `Promotion`, `GiftCard`, and `Membership` rows is a natural follow-up.
- **Cart expiry is lazy, not scheduled**, same trade-off HU-010 already made for seat locks: an expired cart's row (and its now-orphaned confectionery items) sit in the DB until the next request touches that `cartId`. A periodic cleanup job would keep the tables small.
- **Tax rate is a hardcoded constant**, not sourced from any tax/region configuration.
- Following HU-010's own known-limitations note: several prerequisite tables (`functions`, `seats`, `rooms`, `function_types`, `movies`) still don't have a migration of their own in this branch, so `GET /cart` will fail against a real (non-mocked) database until that pre-existing gap is closed — this HU's migration only covers the tables it introduces plus `carts` itself.
