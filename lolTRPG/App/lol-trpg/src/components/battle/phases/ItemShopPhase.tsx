// components/battle/phases/ItemShopPhase.tsx
import { useState } from 'react';
import { Box, Typography, TextField, Select, MenuItem, FormControl, InputLabel, List, ListItem, ListItemText, Button } from '@mui/material';
import { Character } from '../../../models/types';
import PhaseContainer from '../common/PhaseContainer';
import CharacterDisplay from '../common/CharacterDisplay';

interface ItemShopPhaseProps {
  characters: Character[];
  onNext: () => void;
}

const ItemShopPhase = ({ characters, onNext }: ItemShopPhaseProps) => {
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(
    characters.length > 0 ? characters[0].id : null
  );
  const [selectedItem, setSelectedItem] = useState('');
  
  // 選択されたキャラクター
  const selectedCharacter = characters.find(c => c.id === selectedCharacterId);
  
  return (
    <PhaseContainer title="アイテムショップ" onNext={onNext}>
      {characters.length > 0 ? (
        <>
          {/* リコールしたキャラクター一覧を表示 */}
          <Typography variant="h6" gutterBottom>
            リコールしたキャラクター
          </Typography>
          <List sx={{ mb: 2, border: '1px solid #eee', borderRadius: '4px', maxHeight: '150px', overflow: 'auto' }}>
            {characters.map(character => (
              <ListItem 
                key={character.id} 
                button 
                selected={selectedCharacterId === character.id}
                onClick={() => setSelectedCharacterId(character.id)}
                sx={{ 
                  backgroundColor: selectedCharacterId === character.id ? 'rgba(0, 0, 255, 0.05)' : 'transparent',
                  '&:hover': { backgroundColor: 'rgba(0, 0, 255, 0.1)' }
                }}
              >
                <ListItemText 
                  primary={character.name} 
                  secondary={`FP: ${character.fp} / HP: ${character.hp}/${character.maxHp}`} 
                />
              </ListItem>
            ))}
          </List>
          
          {/* 選択したキャラクターのアイテム購入UI */}
          {selectedCharacter && (
            <>
              <Typography variant="subtitle1" gutterBottom>
                {selectedCharacter.name} のアイテム購入
              </Typography>
              
              <Box sx={{ mb: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  label="アイテム名入力"
                  size="small"
                  value={selectedItem}
                  onChange={(e) => setSelectedItem(e.target.value)}
                  variant="outlined"
                  fullWidth
                />
                
                <FormControl fullWidth size="small">
                  <InputLabel>アイテム効果を選択</InputLabel>
                  <Select
                    label="アイテム効果を選択"
                    value=""
                    onChange={() => {}}
                  >
                    <MenuItem value="attack">攻撃力アップ</MenuItem>
                    <MenuItem value="defense">防御力アップ</MenuItem>
                    <MenuItem value="hp">HP回復</MenuItem>
                  </Select>
                </FormControl>
                
                <Button 
                  variant="contained" 
                  color="primary" 
                  disabled={!selectedItem} 
                  sx={{ mt: 1 }}
                >
                  購入する
                </Button>
              </Box>
            </>
          )}
        </>
      ) : (
        <Typography variant="body1" sx={{ my: 3 }}>
          リコールを行ったキャラクターはいません
        </Typography>
      )}
    </PhaseContainer>
  );
};

export default ItemShopPhase;