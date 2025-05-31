import React, { useState, useEffect, useCallback } from 'react';
import apiService from '../services/apiService';

// Define interfaces for the component
interface Card {
  id: string;
  name: string;
  type: string;
  rarity: string;
  cost?: any;
  rulesText?: string;
  attack?: number;
  health?: number;
  colorIdentity?: string[];
  imageUrl?: string;
}

interface CardSearchPanelProps {
  onCardSelect: (card: Card) => void;
  selectedColors?: string[];
}

interface SearchFilters {
  search: string;
  manaType: string[];
  cardType: string;
  cmc: number | undefined;
  rarity: string;
}

const CardSearchPanel: React.FC<CardSearchPanelProps> = ({ onCardSelect, selectedColors = [] }) => {
  const [cards, setCards] = useState<Card[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCards, setTotalCards] = useState(0);
  
  // Search filters state
  const [filters, setFilters] = useState<SearchFilters>({
    search: '',
    manaType: [],
    cardType: '',
    cmc: undefined,
    rarity: ''
  });
  
  // Debounced search function
  const debounce = (func: Function, delay: number) => {
    let timeoutId: NodeJS.Timeout;
    return (...args: any[]) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(null, args), delay);
    };
  };
  
  // Function to search cards
  const searchCards = useCallback(async (searchFilters: SearchFilters, page: number = 1) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const searchParams = {
        page,
        pageSize: 20,
        search: searchFilters.search || undefined,
        manaType: searchFilters.manaType.length > 0 ? searchFilters.manaType : undefined,
        cardType: searchFilters.cardType || undefined,
        cmc: searchFilters.cmc,
        rarity: searchFilters.rarity || undefined
      };
      
      const response = await apiService.searchCards(searchParams);
      setCards(response.cards);
      setTotalPages(response.pagination.totalPages);
      setTotalCards(response.pagination.totalCards);
      setCurrentPage(page);
    } catch (err: any) {
      setError(err.message || 'Failed to search cards');
      console.error('Card search error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  // Debounced search function
  const debouncedSearch = useCallback(
    debounce((searchFilters: SearchFilters) => {
      searchCards(searchFilters, 1);
    }, 500),
    [searchCards]
  );
  
  // Effect to trigger search when filters change
  useEffect(() => {
    debouncedSearch(filters);
  }, [filters, debouncedSearch]);
  
  // Initial load
  useEffect(() => {
    searchCards(filters, 1);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  
  // Handle filter changes
  const handleSearchChange = (value: string) => {
    setFilters(prev => ({ ...prev, search: value }));
  };
  
  const handleManaTypeToggle = (color: string) => {
    setFilters(prev => ({
      ...prev,
      manaType: prev.manaType.includes(color)
        ? prev.manaType.filter(c => c !== color)
        : [...prev.manaType, color]
    }));
  };
  
  const handleCardTypeChange = (value: string) => {
    setFilters(prev => ({ ...prev, cardType: value }));
  };
  
  const handleCmcChange = (value: string) => {
    const cmc = value === '' ? undefined : parseInt(value);
    setFilters(prev => ({ ...prev, cmc }));
  };
  
  const handleRarityChange = (value: string) => {
    setFilters(prev => ({ ...prev, rarity: value }));
  };
  
  const handlePageChange = (page: number) => {
    searchCards(filters, page);
  };
  
  const formatManaCost = (cost: any) => {
    if (!cost || typeof cost !== 'object') return '';
    const parts = [];
    if (cost.C) parts.push(`{${cost.C}}`);
    if (cost.W) parts.push(`{W}`.repeat(cost.W));
    if (cost.U) parts.push(`{U}`.repeat(cost.U));
    if (cost.B) parts.push(`{B}`.repeat(cost.B));
    if (cost.R) parts.push(`{R}`.repeat(cost.R));
    if (cost.G) parts.push(`{G}`.repeat(cost.G));
    return parts.join('');
  };
  
  return (
    <div className="card-search-panel" style={{ padding: '16px', maxHeight: '600px', overflow: 'auto' }}>
      <h2>Card Search & Filter</h2>
      
      {/* Search Input */}
      <div style={{ marginBottom: '16px' }}>
        <input
          type="text"
          placeholder="Search cards by name or text..."
          value={filters.search}
          onChange={(e) => handleSearchChange(e.target.value)}
          style={{
            width: '100%',
            padding: '8px',
            borderRadius: '4px',
            border: '1px solid #ddd'
          }}
        />
      </div>
      
      {/* Mana Color Filters */}
      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Mana Colors:</label>
        <div style={{ display: 'flex', gap: '8px' }}>
          {[
            { color: 'W', label: '⚪', name: 'White' },
            { color: 'U', label: '🔵', name: 'Blue' },
            { color: 'B', label: '⚫', name: 'Black' },
            { color: 'R', label: '🔴', name: 'Red' },
            { color: 'G', label: '🟢', name: 'Green' }
          ].map(({ color, label, name }) => (
            <button
              key={color}
              onClick={() => handleManaTypeToggle(color)}
              style={{
                padding: '8px 12px',
                border: '2px solid',
                borderColor: filters.manaType.includes(color) ? '#007bff' : '#ddd',
                backgroundColor: filters.manaType.includes(color) ? '#e7f3ff' : 'white',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '16px'
              }}
              title={name}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      
      {/* Other Filters */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '16px' }}>
        {/* Card Type */}
        <div>
          <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>Card Type:</label>
          <select
            value={filters.cardType}
            onChange={(e) => handleCardTypeChange(e.target.value)}
            style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #ddd' }}
          >
            <option value="">All Types</option>
            <option value="Creature">Creature</option>
            <option value="Instant">Instant</option>
            <option value="Sorcery">Sorcery</option>
            <option value="Land">Land</option>
            <option value="Artifact">Artifact</option>
            <option value="Enchantment">Enchantment</option>
            <option value="Planeswalker">Planeswalker</option>
          </select>
        </div>
        
        {/* CMC Filter */}
        <div>
          <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>Mana Cost:</label>
          <select
            value={filters.cmc ?? ''}
            onChange={(e) => handleCmcChange(e.target.value)}
            style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #ddd' }}
          >
            <option value="">Any Cost</option>
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(cost => (
              <option key={cost} value={cost}>{cost}</option>
            ))}
          </select>
        </div>
        
        {/* Rarity Filter */}
        <div>
          <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>Rarity:</label>
          <select
            value={filters.rarity}
            onChange={(e) => handleRarityChange(e.target.value)}
            style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #ddd' }}
          >
            <option value="">All Rarities</option>
            <option value="Common">Common</option>
            <option value="Uncommon">Uncommon</option>
            <option value="Rare">Rare</option>
            <option value="Mythic">Mythic</option>
          </select>
        </div>
      </div>
      
      {/* Results Summary */}
      <div style={{ marginBottom: '16px', color: '#666' }}>
        {isLoading ? (
          <span>Searching...</span>
        ) : (
          <span>
            Found {totalCards} cards 
            {totalPages > 1 && `(Page ${currentPage} of ${totalPages})`}
          </span>
        )}
      </div>
      
      {/* Error Display */}
      {error && (
        <div style={{ color: 'red', marginBottom: '16px', padding: '8px', backgroundColor: '#fee', borderRadius: '4px' }}>
          {error}
        </div>
      )}
      
      {/* Card Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '12px', marginBottom: '16px' }}>
        {cards.map((card) => (
          <div
            key={card.id}
            onClick={() => onCardSelect(card)}
            style={{
              border: '1px solid #ddd',
              borderRadius: '8px',
              padding: '12px',
              cursor: 'pointer',
              backgroundColor: 'white',
              transition: 'all 0.2s',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{card.name}</div>
            <div style={{ fontSize: '14px', color: '#666', marginBottom: '4px' }}>
              {formatManaCost(card.cost)} • {card.type}
            </div>
            {card.attack !== undefined && card.health !== undefined && (
              <div style={{ fontSize: '14px', color: '#666', marginBottom: '4px' }}>
                {card.attack}/{card.health}
              </div>
            )}
            <div style={{ fontSize: '12px', color: '#888', marginBottom: '8px' }}>
              {card.rarity}
            </div>
            {card.rulesText && (
              <div style={{ fontSize: '12px', color: '#333', fontStyle: 'italic' }}>
                {card.rulesText.length > 100 
                  ? card.rulesText.substring(0, 100) + '...' 
                  : card.rulesText
                }
              </div>
            )}
          </div>
        ))}
      </div>
      
      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            style={{
              padding: '8px 12px',
              border: '1px solid #ddd',
              backgroundColor: currentPage <= 1 ? '#f5f5f5' : 'white',
              cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
              borderRadius: '4px'
            }}
          >
            Previous
          </button>
          
          <span style={{ padding: '8px 12px', alignSelf: 'center' }}>
            Page {currentPage} of {totalPages}
          </span>
          
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            style={{
              padding: '8px 12px',
              border: '1px solid #ddd',
              backgroundColor: currentPage >= totalPages ? '#f5f5f5' : 'white',
              cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
              borderRadius: '4px'
            }}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default CardSearchPanel;

