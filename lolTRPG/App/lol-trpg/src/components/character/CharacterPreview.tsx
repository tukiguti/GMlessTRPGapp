// src/components/character/CharacterPreview.tsx
import { 
    Box, 
    Card, 
    CardContent, 
    Typography, 
    Divider,
    List,
    ListItem,
    ListItemText
  } from '@mui/material';
  import { Character } from '../../models/types';
  
  interface CharacterPreviewProps {
    character: Character;
  }
  
  const CharacterPreview = ({ character }: CharacterPreviewProps) => {
    return (
      <Card variant="outlined">
        <CardContent>
          <Typography variant="h5" gutterBottom>
            {character.name}
          </Typography>
          
          <Typography variant="subtitle1" color="text.secondary">
            {character.class}
          </Typography>
          
          <Divider sx={{ my: 2 }} />
          
          <Typography variant="h6" gutterBottom>
            ステータス
          </Typography>
          
          <List dense>
            <ListItem>
              <ListItemText primary={`HP: ${character.hp}`} />
            </ListItem>
            {character.attackDice && (
              <ListItem>
                <ListItemText primary={`攻撃ダイス: ${character.attackDice}`} />
              </ListItem>
            )}
            {character.avoidDice && (
              <ListItem>
                <ListItemText primary={`回避ダイス: ${character.avoidDice}`} />
              </ListItem>
            )}
          </List>
          
          <Divider sx={{ my: 2 }} />
          
          <Typography variant="h6" gutterBottom>
            スキル
          </Typography>
          
          {character.skills.length > 0 ? (
            <List dense>
              {character.skills.map((skill) => (
                <ListItem key={skill.id}>
                  <ListItemText 
                    primary={skill.name} 
                    secondary={`タイプ: ${skill.type}`} 
                  />
                </ListItem>
              ))}
            </List>
          ) : (
            <Typography variant="body2" color="text.secondary">
              スキルはありません
            </Typography>
          )}
        </CardContent>
      </Card>
    );
  };
  
  export default CharacterPreview;