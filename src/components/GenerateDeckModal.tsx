import React, { useState } from 'react';
import apiService from '../services/apiService';

interface DeckGenerationParams {
  colors: string[];
  totalCards: number;
  landRatio: number;
  creatureRatio: number;
  spellRatio: number;
  deckName: string;
  playerId: string;
  format?: string;
}

interface GenerateDeckModalProps {
  isVisible: boolean;
  onGenerate: (params: DeckGenerationParams) => void;
  onClose: () => void;
  playerId: string;
}

const GenerateDeckModal: React.FC<GenerateDeckModalProps> = ({ 
  isVisible, 
  onGenerate, 
  onClose, 
  playerId 
}) => {
  const [deckName, setDeckName] = useState('');
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [totalCards, setTotalCards] = useState(60);
  const [landRatio, setLandRatio] = useState(0.4);
  const [creatureRatio, setCreatureRatio] = useState(0.35);
  const [spellRatio, setSpellRatio] = useState(0.25);
  const [deckType, setDeckType] = useState('Balanced');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedDeck, setGeneratedDeck] = useState<any>(null);
  
  // Color options with symbols
  const colorOptions = [
    { color: 'W', label: '⚪', name: 'White' },
    { color: 'U', label: '🔵', name: 'Blue' },
    { color: 'B', label: '⚫', name: 'Black' },
    { color: 'R', label: '🔴', name: 'Red' },
    { color: 'G', label: '🟢', name: 'Green' }
  ];
  
  const handleColorToggle = (color: string) => {
    setSelectedColors(prev => 
      prev.includes(color)
        ? prev.filter(c => c !== color)
        : [...prev, color]
    );
  };
  
  const handleDeckTypeChange = (type: string) => {
    setDeckType(type);
    switch (type) {
      case 'Aggro':
        setLandRatio(0.35);
        setCreatureRatio(0.45);
        setSpellRatio(0.2);
        break;
      case 'Midrange':
        setLandRatio(0.4);
        setCreatureRatio(0.35);
        setSpellRatio(0.25);
        break;
      case 'Control':
        setLandRatio(0.45);
        setCreatureRatio(0.2);
        setSpellRatio(0.35);
        break;
      default: // Balanced
        setLandRatio(0.4);
        setCreatureRatio(0.35);
        setSpellRatio(0.25);
    }
  };
  
  const validateForm = () => {
    if (selectedColors.length === 0) {
      setError('Please select at least one color.');
      return false;
    }
    if (!deckName.trim()) {
      setError('Please enter a deck name.');
      return false;
    }
    const ratioSum = landRatio + creatureRatio + spellRatio;
    if (Math.abs(ratioSum - 1.0) > 0.01) {
      setError(`Ratios must sum to 1.0 (currently: ${ratioSum.toFixed(2)})`);
      return false;
    }
    return true;
  };
  
  const handleGenerate = async () => {
    setError(null);
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setIsGenerating(true);
      console.log('Generating deck with params:', {
        colors: selectedColors,
        totalCards,
        landRatio,
        creatureRatio,
        spellRatio,
        deckName,
        playerId
      });
      
      const response = await apiService.generateDeck({
        colors: selectedColors,
        totalCards,
        landRatio,
        creatureRatio,
        spellRatio,
        deckName,
        playerId
      });
      
      setGeneratedDeck(response.deck);
      console.log('Deck generated successfully:', response);
      
      // Call the onGenerate callback
      onGenerate({
        colors: selectedColors,
        totalCards,
        landRatio,
        creatureRatio,
        spellRatio,
        deckName,
        playerId
      });
    } catch (err: any) {
      console.error('Error generating deck:', err);
      setError(err.message || 'Failed to generate deck');
    } finally {
      setIsGenerating(false);
    }
  };
  
  const handleClose = () => {
    setDeckName('');
    setSelectedColors([]);
    setError(null);
    setGeneratedDeck(null);
    onClose();
  };
  
  if (!isVisible) {
    return null;
  }
  
  return (
    <div className="modal-overlay" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    }}>
      <div className="modal-content" style={{
        backgroundColor: 'white',
        padding: '24px',
        borderRadius: '8px',
        maxWidth: '600px',
        width: '90%',
        maxHeight: '80vh',
        overflow: 'auto',
        fontFamily: 'Arial, sans-serif'
      }}>
        <h2 style={{ marginTop: 0, color: '#333' }}>Generate New Deck</h2>
        
        {/* Deck Name */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Deck Name:</label>
          <input
            type="text"
            value={deckName}
            onChange={(e) => setDeckName(e.target.value)}
            placeholder="Enter deck name..."
            style={{
              width: '100%',
              padding: '8px',
              borderRadius: '4px',
              border: '1px solid #ddd',
              fontSize: '14px'
            }}
          />
        </div>
        
        {/* Color Selection */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Select Colors:</label>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {colorOptions.map(({ color, label, name }) => (
              <button
                key={color}
                onClick={() => handleColorToggle(color)}
                style={{
                  padding: '12px 16px',
                  border: '2px solid',
                  borderColor: selectedColors.includes(color) ? '#007bff' : '#ddd',
                  backgroundColor: selectedColors.includes(color) ? '#e7f3ff' : 'white',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '18px',
                  transition: 'all 0.2s'
                }}
                title={name}
              >
                {label} {name}
              </button>
            ))}
          </div>
          <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
            Selected: {selectedColors.length === 0 ? 'None' : selectedColors.join(', ')}
          </div>
        </div>
        
        {/* Deck Type Presets */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Deck Archetype:</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '8px' }}>
            {['Balanced', 'Aggro', 'Midrange', 'Control'].map(type => (
              <button
                key={type}
                onClick={() => handleDeckTypeChange(type)}
                style={{
                  padding: '8px 12px',
                  border: '2px solid',
                  borderColor: deckType === type ? '#007bff' : '#ddd',
                  backgroundColor: deckType === type ? '#e7f3ff' : 'white',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
        
        {/* Advanced Options */}
        <div style={{ marginBottom: '16px' }}>
          <h3 style={{ fontSize: '16px', marginBottom: '12px' }}>Advanced Options</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {/* Total Cards */}
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: 'bold' }}>Total Cards:</label>
              <input
                type="number"
                min="40"
                max="100"
                value={totalCards}
                onChange={(e) => setTotalCards(parseInt(e.target.value) || 60)}
                style={{
                  width: '100%',
                  padding: '6px',
                  borderRadius: '4px',
                  border: '1px solid #ddd',
                  fontSize: '14px'
                }}
              />
            </div>
            
            {/* Land Ratio */}
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: 'bold' }}>
                Land Ratio: {(landRatio * 100).toFixed(0)}% ({Math.round(totalCards * landRatio)} cards)
              </label>
              <input
                type="range"
                min="0.3"
                max="0.6"
                step="0.05"
                value={landRatio}
                onChange={(e) => setLandRatio(parseFloat(e.target.value))}
                style={{ width: '100%' }}
              />
            </div>
            
            {/* Creature Ratio */}
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: 'bold' }}>
                Creature Ratio: {(creatureRatio * 100).toFixed(0)}% ({Math.round(totalCards * creatureRatio)} cards)
              </label>
              <input
                type="range"
                min="0.1"
                max="0.6"
                step="0.05"
                value={creatureRatio}
                onChange={(e) => setCreatureRatio(parseFloat(e.target.value))}
                style={{ width: '100%' }}
              />
            </div>
            
            {/* Spell Ratio */}
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: 'bold' }}>
                Spell Ratio: {(spellRatio * 100).toFixed(0)}% ({Math.round(totalCards * spellRatio)} cards)
              </label>
              <input
                type="range"
                min="0.1"
                max="0.5"
                step="0.05"
                value={spellRatio}
                onChange={(e) => setSpellRatio(parseFloat(e.target.value))}
                style={{ width: '100%' }}
              />
            </div>
          </div>
          
          <div style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
            Ratio sum: {(landRatio + creatureRatio + spellRatio).toFixed(2)} (should be 1.00)
          </div>
        </div>
        
        {/* Error Display */}
        {error && (
          <div style={{ 
            color: 'red', 
            marginBottom: '16px', 
            padding: '8px', 
            backgroundColor: '#fee', 
            borderRadius: '4px',
            border: '1px solid #fcc'
          }}>
            {error}
          </div>
        )}
        
        {/* Generated Deck Preview */}
        {generatedDeck && (
          <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
            <h4 style={{ marginTop: 0, color: '#28a745' }}>✅ Deck Generated Successfully!</h4>
            <p><strong>{generatedDeck.name}</strong></p>
            <p>Colors: {generatedDeck.colors.join(', ')}</p>
            <p>Total Cards: {generatedDeck.totalCards}</p>
            <p>Main Deck: {generatedDeck.mainBoard.length} unique cards</p>
          </div>
        )}
        
        {/* Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
          <button
            onClick={handleClose}
            style={{
              padding: '10px 20px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            {generatedDeck ? 'Close' : 'Cancel'}
          </button>
          
          {!generatedDeck && (
            <button
              onClick={handleGenerate}
              disabled={isGenerating || selectedColors.length === 0 || !deckName.trim()}
              style={{
                padding: '10px 20px',
                backgroundColor: isGenerating || selectedColors.length === 0 || !deckName.trim() ? '#cccccc' : '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: isGenerating || selectedColors.length === 0 || !deckName.trim() ? 'not-allowed' : 'pointer',
                fontSize: '16px'
              }}
            >
              {isGenerating ? 'Generating...' : 'Generate Deck'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default GenerateDeckModal;

