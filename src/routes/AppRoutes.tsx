import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Home } from '../features/home/routes/Home';
import { CreateCharacter } from '../features/klash/routes/CreateCharacter';
import { CharacterSheet } from '../features/klash/routes/CharacterSheet';

export const AppRoutes = () => {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/create" element={<CreateCharacter />} />
                <Route path="/characters/:id" element={<CharacterSheet />} />
            </Routes>
        </BrowserRouter>
    );
};
