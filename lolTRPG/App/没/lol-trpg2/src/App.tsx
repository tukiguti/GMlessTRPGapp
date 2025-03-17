// src/App.tsx
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import SinglePlayerPage from './pages/SinglePlayerPage';
import CharacterCreationPage from './pages/CharacterCreationPage';
import TeamFormationPage from './pages/TeamFormationPage';
import BattlePage from './pages/BattlePage';
import './styles.css';
import CharacterListPage from './pages/CharacterListPage';

const theme = createTheme({
  components: {
    MuiContainer: {
      defaultProps: {
        maxWidth: false,
      },
      styleOverrides: {
        root: {
          width: '100%',
          padding: '0 20px',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          minHeight: '48px',
        },
      },
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/single-player" element={<SinglePlayerPage />} />
          <Route path="/character-creation" element={<CharacterCreationPage />} />
          <Route path="/character-list" element={<CharacterListPage />} />
          <Route path="/team-formation" element={<TeamFormationPage />} />
          <Route path="/battle" element={<BattlePage />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;