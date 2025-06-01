# DEVPLAN_11: Deckbuilding Feature - Fixes and Enhancements

**Status:** IN_PROGRESS
**Assignee:** Cascade
**Last Updated:** 2025-06-01

## 1. Overview

This DEVPLAN outlines the tasks required to fix and enhance the deckbuilding feature in the React frontend. The primary components involved are `src/components/Deckbuilder.tsx` and `src/services/apiService.ts`.

## 2. Goals

- Resolve issues preventing users from successfully generating and loading decks.
- Improve error handling and user feedback.
- Implement missing functionality like deck saving and full card search integration.
- Ensure the deckbuilding feature is robust and user-friendly.

## 3. Tasks

**Key:**
- `[ ]` - To Do
- `[IN_PROGRESS]` - In Progress
- `[DONE]` - Completed
- `[BLOCKED]` - Blocked

---

### Task 11.1: Improve API Error Handling and User Feedback in `Deckbuilder.tsx`
**Status:** `[DONE]`
**Description:** Enhanced `Deckbuilder.tsx` to provide clear user feedback for API errors during deck loading (`getAllDecks`, `getDeckById`) and generation (`generateDeck`).
**Files Modified:**
    - `src/components/Deckbuilder.tsx`
**Summary of Changes:**
    - Reviewed existing error handling for `getAllDecks` (via `error` state) and `getDeckById` (via `deckLoadError` state); deemed adequate for displaying errors.
    - Added `generationError: string | null` state to manage and display errors specifically from the deck generation process.
    - Defined a `GenerationResult` interface (`{ success: boolean; deckName?: string; message?: string; }`) to standardize the outcome passed from `GenerateDeckModal`.
    - Updated the `handleGenerateDeck` function to accept `GenerationResult`. This function now sets `generationSuccess` or `generationError` based on the `result`, and only refreshes the deck list on success.
    - Added new JSX to render the `generationError` message prominently in the UI, similar to the `generationSuccess` message.
**Notes:**
    - A temporary TypeScript lint error (`TS2345`) exists on the `onGenerate` prop of the `<GenerateDeckModal />` component in `Deckbuilder.tsx`. This is because `handleGenerateDeck`'s signature has changed, but `GenerateDeckModal`'s prop types have not yet been updated. This lint error will be resolved in Task 11.3 when `GenerateDeckModal.tsx` is modified.
**Tests:**
    - Manually verify that network errors or API error responses for `getAllDecks` and `getDeckById` result in user-visible error messages.
    - Manually verify (after Task 11.3) that deck generation failures result in user-visible error messages.
**Backend Sync:** N/A for this specific frontend display task, but relies on consistent error responses from backend.
**DEVPLAN Impact:** None.

---

### Task 11.2: Implement Loading State for Deck Generation
**Status:** `[DONE]`
**Description:** Add a loading indicator in `GenerateDeckModal.tsx` that activates while `apiService.generateDeck` is in progress.
**Files to Modify:** `src/components/GenerateDeckModal.tsx`
**Summary of Implementation (already present):**
    - The `GenerateDeckModal.tsx` component already includes an `isGenerating` state variable.
    - This state is set to `true` before the `apiService.generateDeck` call and `false` in the `finally` block after the call.
    - The "Generate Deck" button is disabled, its style changed (e.g., background color, cursor), and its text changes to "Generating..." when `isGenerating` is `true`.
    *   **Current Status**: Completed. fulfills the requirements of the task.
**Tests:**
    - Manually trigger deck generation and verify the loading indicator (button text change and disabled state) appears.
    - Verify the loading indicator disappears and the button is re-enabled after generation completes or fails.
**Backend Sync:** N/A.
**DEVPLAN Impact:** None.

---

### Task 11.3: Enhance `handleGenerateDeck` in `Deckbuilder.tsx` and `GenerateDeckModal.tsx`
**Status:** `[DONE]`
**Description:** Modified `GenerateDeckModal.tsx` to correctly call `apiService.generateDeck`, handle its success/error responses, and then call its `onGenerate` prop with the outcome, aligning prop types with `Deckbuilder.tsx`.
**Files Modified:**
    - `src/components/GenerateDeckModal.tsx`
**Summary of Changes:**
    - Added a local `GenerationResult` interface (`{ success: boolean; deckName?: string; message?: string; }`) to `GenerateDeckModal.tsx`.
    - Updated the `GenerateDeckModalProps` interface: the `onGenerate` prop type was changed from `(params: DeckGenerationParams) => void` to `(result: GenerationResult) => void`.
    - In the `handleGenerate` async function:
      - On successful API call to `apiService.generateDeck`, `props.onGenerate` is now invoked with `{ success: true, deckName: deckName, message: "Deck \"${deckName}\" generated successfully!" }`.
      - In the `catch` block (on API error), `props.onGenerate` is now invoked with `{ success: false, deckName: deckName, message: err.message || "Failed to generate deck." }`.
**Tests:**
    - Manually trigger deck generation.
    - Verify success message appears in `Deckbuilder` (via `generationSuccess` state) on successful generation.
    - Simulate API error for `generateDeck` and verify error message appears in `Deckbuilder` (via `generationError` state).
    - Verify local error message in `GenerateDeckModal` also appears on failure.
**Backend Sync:** Ensure `/api/generate-deck` endpoint returns a meaningful message on success (e.g., `response.message`). The frontend currently provides a default success message.
**DEVPLAN Impact:** Resolved the TypeScript lint error (TS2345, previously Lint ID `66183ddf-41e0-494c-ac3f-f643c301bf30`) in `Deckbuilder.tsx` related to the `onGenerate` prop type mismatch.

---

### Task 11.4: Integrate Card Search Panel with Deck Editing (`src/components/Deckbuilder.tsx`, `src/components/CardSearchPanel.tsx`) - `[DONE]`
**Description:** Enabled users to search for cards via `CardSearchPanel.tsx` and add them to the `mainBoard` or `sideBoard` of the `selectedDeck` in `Deckbuilder.tsx`.
**Summary of Changes:**
    *   **`Deckbuilder.tsx`**:
        *   Implemented `handleAddCardToDeck(card: Card, board: 'mainBoard' | 'sideBoard')` to update `selectedDeck` state with new/incremented cards, ensuring immutability.
        *   Passed `onAddCardToDeck` callback to `<CardSearchPanel />`.
        *   Removed old `onCardSelect` prop and its handler.
    *   **`CardSearchPanel.tsx`**:
        *   Updated `CardSearchPanelProps` to accept `onAddCardToDeck` and removed `onCardSelect`.
        *   Added "Add to Main" and "Add to Side" buttons to search result cards, invoking `onAddCardToDeck`.
        *   Removed general `onClick` from card items.
        *   Resolved TypeScript lint error `878e27c5-23d6-49f4-8e6b-22008da9edab` by aligning prop expectations.
**Files Modified:**
    - `src/components/Deckbuilder.tsx`
    - `src/components/CardSearchPanel.tsx`
**Tests Added/Modified:** None. Manual testing recommended.
**Backend Sync Required:** No. Relies on existing `apiService.searchCards`.
**Potential Blockers:** None.
**Testing:**
    - Select a deck.
    - Search for a card in `CardSearchPanel`.
    - Click to select/add the card.
    - Verify the `selectedDeck`'s main board UI updates to show the new card and quantity.

---

### Task 11.5: Implement Deck Saving Functionality
**Status:** `[DONE (Frontend)]`
**Description:** Implement the "Save Deck" button functionality to persist changes made to `selectedDeck`.
**Files to Modify:**
    - `src/components/Deckbuilder.tsx`
    - `src/services/apiService.ts`
    - Backend: Requires an endpoint like `PUT /api/decks/:id`.
**Summary of Changes (Frontend):**
    *   **`apiService.ts`**:
        *   Added `DeckSavePayload` interface: `{ name: string; description?: string; mainBoard: DeckEntry[]; sideBoard: DeckEntry[]; }`.
        *   Added `saveDeck(deckId: string, payload: DeckSavePayload): Promise<DeckDetails>` function. This makes a `PUT` request to `/api/decks/${deckId}`.
        *   Exported `DeckSavePayload` and `DeckEntry` types.
    *   **`Deckbuilder.tsx`**:
        *   Imported `DeckSavePayload` and `DeckEntry`.
        *   Added state: `isSavingDeck` (boolean), `saveDeckSuccess` (string | null), `saveDeckError` (string | null).
        *   Implemented `handleSaveDeck()`: 
            *   Sets loading state (`isSavingDeck`).
            *   Prepares `DeckSavePayload` (maps `DeckCardEntry[]` to `DeckEntry[]` for boards).
            *   Calls `apiService.saveDeck()`.
            *   Handles success: updates `selectedDeck` with server response, shows success message, calls `refreshDecks()` if name/description changed.
            *   Handles error: shows error message.
        *   Updated "Save Deck" button: calls `handleSaveDeck`, disabled with "Saving..." text during save or if no deck selected.
        *   Added UI to display success/error messages for the save operation.
        *   Resolved lint error `5d604c68-3b46-4ea1-9d02-0583b49b6b82` by correctly defining `handleSaveDeck`.
**Testing (Frontend - requires backend):**
    - Modify a deck (e.g., add/remove cards, change name/description in UI if editable fields are added later).
    - Click "Save Deck".
    - Verify loading indicator on the button.
    - Verify success message appears on successful save (mock backend success if needed for isolated test).
    - Verify `selectedDeck` state is updated with the response from the save operation.
    - Verify `refreshDecks()` is called if name/description changed.
    - Verify error message appears on save failure (mock backend error).
    - After actual backend implementation: Refresh decks/reselect deck and verify changes are persisted in the database.

---

### Task 11.6: Validate Deck Generation Parameters
**Status:** `[DONE]`
**Description:** Add client-side validation in `GenerateDeckModal.tsx` for deck generation parameters.
**Files to Modify:**
    - `src/components/GenerateDeckModal.tsx`
**Summary of Changes:**
    *   **`GenerateDeckModal.tsx`**:
        *   Reviewed existing `validateForm()` function, which already covered:
            *   Ensuring at least one color is selected.
            *   Ensuring deck name is not empty.
            *   Ensuring card type ratios (land, creature, spell) sum to 1.0.
            *   Displaying error messages via `setError()`.
        *   Enhanced UI feedback by introducing an `isFormInvalid` constant that checks all these conditions.
        *   Updated the "Generate Deck" button's `disabled` prop and conditional styling (`backgroundColor`, `cursor`) to use `isGenerating || isFormInvalid`.
        *   This makes the button disable/enable more dynamically based on all validation criteria, including the ratio sum, before an actual click attempt.
**Testing:**
    - Try to generate with no colors selected: Verify button is disabled, and if somehow enabled and clicked, an error message appears and API call is not made.
    - Try to generate with no deck name: Verify button is disabled, and if somehow enabled and clicked, an error message appears and API call is not made.
    - Adjust ratios so they don't sum to 1.0: Verify button becomes disabled. If ratios are corrected, button becomes enabled (assuming other conditions met).
    - If button is clicked with invalid ratios (e.g., by bypassing disabled state or if a check is missed), verify an error message appears and API call is not made.

---

## 4. Backend Considerations (for LLM/Developer)

- **Endpoint for Saving Decks:** An API endpoint like `PUT /api/decks/:deckId` is needed. It should accept deck details (name, description, mainBoard, sideBoard) and update the database. The `mainBoard` and `sideBoard` will likely be arrays of `{ cardId: string, quantity: number }`. The backend will need to update the `decks` table and replace entries in the `deck_cards` table for the given `deck_id`.
- **`generateDeck` Endpoint (`/api/generate-deck`):**
    - Verify it correctly processes parameters (`colors`, `totalCards`, `ratios`, `deckName`, `playerId`).
    - Ensure it saves the generated deck to the `decks` and `deck_cards` tables.
    - Confirm it returns a `GeneratedDeckResponse` matching the frontend interface, especially the `deck` object structure. The `deck` object in the response should ideally be a `DeckBasicInfo` or `DeckDetails` object.
- **`getDeckById` Endpoint (`/api/decks/:id`):**
    - This endpoint must return `DeckDetails` including `mainBoard` and `sideBoard` arrays. Each entry in these arrays should be a `DeckCardEntry`, which means it needs the `cardId`, `quantity`, and the full `card: Card` object nested within it. This requires the backend to join `deck_cards` with the `cards` table.
- **Error Responses:** Ensure backend API endpoints return consistent JSON error responses (e.g., `{ "message": "Error details" }`) with appropriate HTTP status codes (e.g., 400, 404, 500) that `apiService.ts` can parse.

## 5. Progress Log

- **2025-06-01**: DEVPLAN created.
