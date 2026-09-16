# HU-010 — Interactive Seat Selection

This document explains how the seat-selection feature (`modules/seats`) is implemented: the layers involved, each endpoint's contract, how the RN-039..RN-043 business rules map to code, the bugs that were fixed to make it actually runnable, and known limitations.

## 1. Where the code lives

```
modules/seats/
├── domain/entities/
│   ├── seat.entity.ts        # Seats table + canonical SeatCategory enum
│   ├── seat-lock.entity.ts   # Temporary lock on a seat for a cart
│   ├── room.entity.ts        # Physical room, belongs to a Cinema
│   └── room-type.entity.ts   # Standard / VIP / IMAX room type
├── application/
│   ├── dtos/seat-map.dto.ts  # Zod-based request/response contracts
│   └── services/seat.service.ts  # Business logic (SeatService)
├── infrastructure/dao/seat.dao.ts  # SeatRepository — the only class that talks to TypeORM
└── ui/
    ├── controllers/seat.controller.ts            # GET /seats/:seatId
    ├── controllers/function-seats.controller.ts  # GET /functions/:functionId/seats
    ├── controllers/reservations.controller.ts    # /reservations/*
    └── seat.module.ts
```

The flow follows the same Controller → UseCase/Service → Repository → DB layering used by the `locations` module: controllers only translate HTTP in/out, `SeatService` holds all business rules, and `SeatRepository` is the sole place that issues TypeORM queries.

## 2. Data model

- **`seats`**: one row per physical seat (`roomId`, `row`, `number`, `seatType`). `seatType` is now constrained to the canonical `SeatCategory` enum (`STANDARD | VIP | PREFERENTIAL | DISABLED`), defined once in `seat.entity.ts` and re-exported by `seat-map.dto.ts` so the DB layer and the API layer can never drift into inconsistent category strings. A `UNIQUE (room_id, row, number)` constraint prevents two seats being created at the same coordinate in a room.
- **`seat_locks`**: one row per seat *currently* held by a cart for a function, with an `expiresAt` timestamp. A `UNIQUE (function_id, seat_id)` constraint is what makes the "two users can't lock the same seat" guarantee atomic at the database level.
- A seat's live status is never stored — it's computed on every read from three facts: is it `DISABLED` by `seatType`, is there a **paid ticket** for it (`SOLD`), is there an **active lock** for it (`LOCKED`/`SELECTED`), otherwise `AVAILABLE`.

## 3. Endpoints

### `GET /functions/:functionId/seats`
Returns the full seat map for a function's room, with each seat's live `status` and `category`.

- Query: `cartId` (optional, uuid) — when provided, seats locked by *this* cart are reported as `SELECTED` instead of `LOCKED`, so the requesting client can tell "my selection" apart from "taken by someone else".
- 404 if the function doesn't exist, isn't `active`, or has already started (same selectability rule as HU-009, see §5).
- Implemented by `SeatService.getSeatMap`.

### `POST /reservations/lock-seats`
Body: `{ functionId, cartId, seatIds[] }`. Attempts to lock every seat in `seatIds` for 10 minutes under `cartId`.

Returns `{ lockedSeatIds, rejectedSeatIds, expiresAt }` — a partial success is normal (e.g. two users click the same seat at the same instant) and the response always reports both lists rather than throwing when some seats couldn't be locked.

Validation performed before touching the DB: at least one seat, no more than `maxSeatsPerReservation`, all seats must belong to the function's room, no `DISABLED` seats.

### `DELETE /reservations/release-seats`
Body: `{ functionId, cartId, seatIds? }`. Releases the given seats, or **all** seats the cart holds for that function when `seatIds` is omitted (used when the user abandons checkout). Returns `{ releasedCount }`.

### `GET /reservations/summary`
Query: `functionId`, `cartId`. Returns the seats currently locked by that cart for that function, their unit price, and the total — the "before you continue to cart" summary required by HU-010's functional flow.

## 4. Business rules → code

| Rule | Enforcement |
|---|---|
| RN-039 (10-minute lock) | `LOCK_DURATION_MINUTES = 10` in `seat.service.ts`; every successful lock/refresh sets `expiresAt = now + 10min`. |
| RN-040 (auto-release on expiry/abandon) | Locks are never treated as active once `expiresAt <= now` — `findActiveLocks`/`findCartLocks` filter with `expiresAt > now`, and `lockSeats` proactively deletes expired rows for the seats being requested before evaluating conflicts. This is *lazy* expiry (see §6), not a scheduled job. Abandon-flow release is the explicit `DELETE /reservations/release-seats` call. |
| RN-041 (can't select sold/locked/disabled seats) | `lockSeats` rejects seats that appear in `findSoldSeatIds` (ticket already issued) or in another cart's active lock; `DISABLED` category seats are rejected outright. |
| RN-042 (reduced-mobility seat policy) | Modeled as the `PREFERENTIAL` category. The cinema's specific policy beyond "it's a distinct, visually distinguishable category" isn't in scope yet — see §6. |
| RN-043 (no overselling under concurrency) | `seat_locks` has a `UNIQUE (function_id, seat_id)` constraint; `createLocksIgnoreDuplicates` inserts with `ON CONFLICT DO NOTHING`, so when two requests race for the same seat, only one insert wins at the database level — the loser is detected afterwards (`findCartLocks` won't show it as owned) and reported in `rejectedSeatIds`. |

## 5. Relationship to HU-009

`SeatRepository.findFunctionForSelection` and `FunctionRepository.findSelectableById` (in `modules/functions`, built for HU-009) apply the **same** selectability rule: `active = true` and `startsAt > now` (RN-035/RN-036). A function that's inactive or already started 404s consistently whether you're fetching its details, its price, or its seat map.

## 6. Bugs found and fixed in this pass

The service and DAO layers for HU-010 already existed, but the feature was not actually reachable or runnable:

1. **`seat.module.ts` failed to compile.** It used default imports (`import Module from '@nestjs/common'`) instead of named imports, which `tsc` rejects (`Module`/`TypeOrmModule` have no default export). Fixed to named imports.
2. **`SeatModule` never provided `SeatService`**, and didn't register `CinemaFunction` or `Ticket` with `TypeOrmModule.forFeature`, even though `SeatRepository`'s constructor injects `Repository<CinemaFunction>` and `Repository<Ticket>` — this would have thrown a dependency-injection error at boot. Both are now registered.
3. **`Room` and `RoomType` were never registered anywhere** in the app (no module called `forFeature` on them), yet `SeatRepository.findFunctionForSelection` eagerly loads the `room` relation and `Seats` has a `ManyToOne` to `Room`. TypeORM would have failed to build entity metadata for these relations at bootstrap. Fixed by registering `Room`/`RoomType` in `SeatModule` (they live in the same domain folder).
4. **`SeatController` never called `SeatService` at all.** It only exposed `GET /seats/:seatId`, threw a bare `Error` (→ unhandled 500) instead of `NotFoundException` on a missing seat, and none of the four HU-010 endpoints (`GET /functions/{id}/seats`, `POST /reservations/lock-seats`, `DELETE /reservations/release-seats`, `GET /reservations/summary`) existed anywhere. Fixed by keeping `SeatController` for the single-seat lookup (now throwing `NotFoundException`) and adding `FunctionSeatsController` and `ReservationsController` to expose the rest.
5. **`SeatModule` was never imported into `AppModule`** — none of this was wired into the running application. Added.
6. **`seats.seatType` was an unconstrained `varchar`.** The service used to normalize half a dozen free-form aliases (`'PREFERENCIAL'`, `'MOVILIDAD REDUCIDA'`, `'INHABILITADA'`, ...) into the four real categories, which meant bad data could silently exist in the DB and only be papered over on read. Fixed by making `SeatCategory` the single source of truth (defined in `seat.entity.ts`) and constraining both the entity's zod schema and `seat-map.dto.ts` to it; `toCategory` in the service is now a thin safety net instead of an alias table.
7. **No uniqueness guarantee on seat coordinates.** Nothing stopped two rows from being created at the same `(roomId, row, number)`, which would have silently broken the seat map (duplicate seat rendered twice, ambiguous lookups). Added `@Unique(['roomId', 'row', 'number'])`.

## 7. Known limitations / follow-ups

- **No DB migration exists yet** for `rooms`, `room_types`, `seats`, `seat_locks`, `functions`, `function_types` (only the initial `CreateLocationSchema` migration exists, and `synchronize` is `false`). These tables need a migration generated before any of this can run against a real database.
- **Lock expiry is lazy, not scheduled.** An expired `seat_locks` row isn't deleted until the next query that touches that seat (`findActiveLocks`/`deleteExpiredLocks` filter by `expiresAt`). Functionally this satisfies RN-040 (an expired lock is never treated as active), but the table will accumulate stale rows over time; a periodic cleanup job would be a reasonable follow-up.
- **RN-042's actual cinema policy for `PREFERENTIAL` seats is not modeled** — today it's just a category with no extra purchase constraints. Whatever the real policy turns out to be (e.g. requiring a companion seat, ID verification, etc.) will need a dedicated rule in `SeatService.lockSeats`.
- **RN-038 (promotions recalculated automatically)** has no `Promotion` entity or engine anywhere in the codebase yet, so pricing here is strictly `basePrice + roomExtraPrice`. Out of scope until a promotions module exists.
