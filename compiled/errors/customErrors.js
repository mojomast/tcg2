export class DeckNotFoundError extends Error {
    constructor(message, deckId, playerId = null) {
        super(message);
        this.name = 'DeckNotFoundError';
        this.deckId = deckId;
        this.playerId = playerId;
        Object.setPrototypeOf(this, DeckNotFoundError.prototype);
    }
}
export class DeckSelectionMissingError extends Error {
    constructor(message, playerId) {
        super(message);
        this.name = 'DeckSelectionMissingError';
        this.playerId = playerId;
        Object.setPrototypeOf(this, DeckSelectionMissingError.prototype);
    }
}
export class DeckValidationError extends Error {
    constructor(message, deckId, validationErrors, playerId = null) {
        super(message);
        this.name = 'DeckValidationError';
        this.deckId = deckId;
        this.playerId = playerId;
        this.validationErrors = validationErrors;
        Object.setPrototypeOf(this, DeckValidationError.prototype);
    }
}
