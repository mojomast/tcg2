export class DeckNotFoundError extends Error {
    public deckId: string;
    public playerId: string | null; // PlayerId might not always be available when error is constructed

    constructor(message: string, deckId: string, playerId: string | null = null) {
        super(message);
        this.name = 'DeckNotFoundError';
        this.deckId = deckId;
        this.playerId = playerId;
        Object.setPrototypeOf(this, DeckNotFoundError.prototype);
    }
}

export class DeckSelectionMissingError extends Error {
    public playerId: string;

    constructor(message: string, playerId: string) {
        super(message);
        this.name = 'DeckSelectionMissingError';
        this.playerId = playerId;
        Object.setPrototypeOf(this, DeckSelectionMissingError.prototype);
    }
}

export class DeckValidationError extends Error {
    public deckId: string;
    public playerId: string | null;
    public validationErrors: string[];

    constructor(message: string, deckId: string, validationErrors: string[], playerId: string | null = null) {
        super(message);
        this.name = 'DeckValidationError';
        this.deckId = deckId;
        this.playerId = playerId;
        this.validationErrors = validationErrors;
        Object.setPrototypeOf(this, DeckValidationError.prototype);
    }
}
