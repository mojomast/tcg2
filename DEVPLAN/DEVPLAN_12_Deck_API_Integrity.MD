# DEVPLAN 12: Deck API Integrity and Backend Integration

**Overall Goal:** Ensure all backend API endpoints related to deck management (`/api/decks/:id`, `/api/generate-deck`) are correctly implemented, handle data consistently, return responses in the format expected by the frontend, and provide standardized error handling. This plan focuses on the backend work necessary to support the deckbuilding features developed in `DEVPLAN_11`.

---

## 1. Core Deck API Endpoints

### Task 12.1: `PUT /api/decks/:deckId` Endpoint Implementation & Verification
**Status:** `[x]`
**Description:** Implement or thoroughly verify the `PUT /api/decks/:deckId` endpoint for saving changes to an existing deck.
**Affected Components:**
    - `server.ts` (or relevant backend route handlers)
    - `src/services/deckService.ts` (or equivalent backend service layer)
    - Database interaction logic (e.g., `database.ts` or ORM models)
**Details:**
    1.  **Payload Handling:**
        -   Ensure the endpoint correctly parses the expected payload from the frontend:
            ```json
            {
              "name": "string",
              "description": "string | undefined",
              "mainBoard": [ { "cardId": "string", "quantity": "number" }, ... ],
              "sideBoard": [ { "cardId": "string", "quantity": "number" }, ... ]
            }
            ```
        -   Validate input data (e.g., `deckId` exists, `name` is not empty, quantities are positive).
    2.  **Database Operations:**
        -   Update the `decks` table with the new `name` and `description`.
        -   Crucially, **replace** all existing entries in the `deck_cards` (or equivalent linking table) for the given `deck_id` with the new `mainBoard` and `sideBoard` contents. Avoid appending or duplicating entries.
        -   Ensure transactions are used if multiple database operations are involved to maintain data integrity.
    3.  **Response Structure:**
        -   On success, return a `200 OK` status with the updated `DeckDetails` object in the response body. This object must match the structure expected by `apiService.ts`, including fully populated `mainBoard` and `sideBoard` with nested `Card` objects within each `DeckCardEntry`.
            ```typescript
            // Expected structure for each entry in mainBoard/sideBoard
            interface DeckCardEntry {
              cardId: string;
              quantity: number;
              card: Card; // Full card object
            }
            ```
        -   **Refactoring Note:** The core logic for this endpoint, including database operations and response construction, has been successfully refactored into the `DeckService.updateDeck` method. The route handler in `server.ts` now calls this service method.
**Testing:**
    -   Create a deck, then update its name, description, and card contents (add, remove, change quantities in both main and side boards).
    -   Verify the database reflects the changes accurately.
    -   Verify the API response contains the full, updated `DeckDetails`.
    -   Test edge cases: empty sideboard, empty mainboard (if allowed), saving with no actual changes.
    -   Test invalid `deckId` (should return 404).

---

### Task 12.2: `POST /api/generate-deck` Endpoint Verification
**Status:** `[ ]`
**Description:** Verify the `POST /api/generate-deck` endpoint correctly processes parameters, saves the new deck, and returns the expected response.
**Affected Components:**
    - `server.ts` (or relevant backend route handlers)
    - `src/services/deckGenerationService.ts`
    - `src/services/deckService.ts` (or equivalent backend service layer for saving)
    - Database interaction logic
**Details:**
    1.  **Parameter Processing:**
        -   Ensure the endpoint correctly processes all input parameters sent by the frontend:
            ```json
            {
              "colors": ["string", ...],
              "totalCards": "number",
              "landRatio": "number",
              "creatureRatio": "number",
              "spellRatio": "number",
              "deckName": "string",
              "playerId": "string"
            }
            ```
        -   Validate inputs (e.g., colors are valid, ratios sum to 1, name not empty).
    2.  **Deck Saving:**
        -   Confirm that the `deckGenerationService.ts` (or equivalent) successfully generates the card list.
        -   Ensure the newly generated deck (metadata and card list for main/sideboard) is saved to the `decks` and `deck_cards` tables correctly.
    3.  **Response Structure:**
        -   On success, return a `200 OK` or `201 Created` status.
        -   The response body must match the `GeneratedDeckResponse` interface defined in `apiService.ts`:
            ```typescript
            interface GeneratedDeckResponse {
              success: boolean; // should be true
              message: string;  // e.g., "Deck generated successfully"
              deck: DeckDetails; // Full DeckDetails of the new deck
            }
            ```
**Testing:**
    -   Use the `scripts/test-deck-generation.ts` script (Memory [71c40b9f...]) as a starting point for backend-focused testing.
    -   Call the endpoint with various valid parameters and verify:
        -   The deck is saved correctly in the database.
        -   The response structure and content match `GeneratedDeckResponse`, especially the `deck` field containing full `DeckDetails`.
    -   Test with invalid parameters to ensure proper error handling (see Task 12.4).

---

### Task 12.3: `GET /api/decks/:id` Endpoint Verification
**Status:** `[ ]`
**Description:** Verify the `GET /api/decks/:id` endpoint returns deck details in the precise format required by the frontend, including fully populated card objects.
**Affected Components:**
    - `server.ts` (or relevant backend route handlers)
    - `src/services/deckService.ts` (or equivalent backend service layer)
    - Database interaction logic
**Details:**
    1.  **Response Structure:**
        -   The endpoint must return a `DeckDetails` object.
        -   The `mainBoard` and `sideBoard` arrays within `DeckDetails` must contain `DeckCardEntry` objects.
        -   Each `DeckCardEntry` must include the full nested `Card` object, not just `cardId`.
            ```typescript
            interface DeckCardEntry {
              cardId: string;
              quantity: number;
              card: Card; // Populated from the 'cards' table
            }
            ```
    2.  **Database Query:**
        -   The backend logic must perform the necessary joins: `decks` -> `deck_cards` -> `cards` to fetch all required information.
    3.  **Performance:**
        -   Consider the performance implications of these joins, especially if decks can be very large. Ensure appropriate database indexes are in place on `deck_cards(deck_id)`, `deck_cards(card_id)`, and `cards(id)`.
**Testing:**
    -   Fetch various decks (newly generated, saved/edited, decks with empty main/sideboards if applicable).
    -   Verify the response structure meticulously, especially the nested `Card` objects.
    -   Test with an invalid/non-existent `deckId` (should return 404).

---

## 2. General API Practices

### Task 12.4: Standardize API Error Responses
**Status:** `[X]`
**Description:** Ensure all deck-related API endpoints return consistent, parseable JSON error responses and use appropriate HTTP status codes.
**Affected Components:**
    - All backend route handlers for deck APIs.
    - Centralized error handling middleware (if any).
**Details:**
    1.  **JSON Error Format:**
        -   Errors are returned in a consistent JSON format:
            ```json
            {
              "message": "A human-readable error message.",
              "errorType": "CamelCaseErrorType", // e.g., DeckNotFoundError, ValidationError, AuthorizationError, InternalServerError
              "details": { /* Optional object or array with more specific error info */ }
            }
            ```
        -   Examples:
            -   Validation Error (400):
                ```json
                {
                  "message": "Player ID is required as a query parameter.",
                  "errorType": "ValidationError",
                  "details": { "field": "playerId", "issue": "Player ID must be provided as a query parameter." }
                }
                ```
            -   Not Found Error (404):
                ```json
                {
                  "message": "Deck with ID 'some-id' not found.",
                  "errorType": "DeckNotFoundError",
                  "details": { "deckId": "some-id" }
                }
                ```
            -   Internal Server Error (500):
                ```json
                {
                  "message": "Failed to retrieve deck: An unexpected error occurred.",
                  "errorType": "InternalServerError"
                }
                ```
    2.  **HTTP Status Codes:**
        -   Use appropriate codes:
            -   `400 Bad Request`: For validation errors (e.g., missing parameters, invalid ratios).
            -   `401 Unauthorized` / `403 Forbidden`: For authentication/authorization issues (if applicable).
            -   `404 Not Found`: For resources not found (e.g., `GET /api/decks/invalid-id`).
            -   `500 Internal Server Error`: For unexpected server-side errors.
    3.  **Error Propagation:**
        -   Ensure errors from service layers or database operations are caught and transformed into these standardized responses.
**Testing:**
    -   For each endpoint (`PUT /decks/:id`, `POST /generate-deck`, `GET /decks/:id`):
        -   Trigger validation errors (e.g., send invalid payload).
        -   Trigger 'not found' errors.
        -   If possible, simulate server-side errors to check 500 responses.
    -   Verify the status code and JSON body of error responses.

---

## 3. Database Considerations

### Task 12.5: Database Schema Review for Deck Operations
**Status:** `[X]`
**Description:** Review the SQLite database schema for `decks`, `cards`, and `deck_cards` (or equivalent) to ensure it efficiently supports all required deck operations and queries.
**Affected Components:**
    - Database schema definition (`database.ts`, migrations, etc.)
**Details:**
    1.  **Indexing:**
        -   Verify appropriate indexes exist on foreign keys (`deck_cards.deck_id`, `deck_cards.card_id`) and any frequently queried columns (e.g., `cards.id`, `decks.id`, potentially `decks.playerId`).
    2.  **Data Types:** Ensure data types are appropriate for the stored information.
    3.  **Relationships:** Confirm table relationships (foreign key constraints) are correctly defined to maintain data integrity.
    4.  **Cascade Operations:** Consider if `ON DELETE CASCADE` or similar is appropriate for `deck_cards` when a deck or card is deleted (though card deletion might be out of scope for this plan).
**Testing:**
    -   This is more of a review task, but performance testing of the API endpoints (Tasks 12.1-12.3) will help identify schema-related bottlenecks.

---
