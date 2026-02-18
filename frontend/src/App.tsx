// src/App.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { MainLayout } from './layout/MainLayout';
import { Welcome } from './pages/Welcome';
import { Chats } from './pages/Chats'; 
import { Alerts } from './pages/Alerts'; 
import { Reminders } from './pages/Reminders'; 
import { Library } from './pages/Library'; 

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Welcome />} />
        <Route path="/chat" element={<Chats />} />
        
        {/* The Library page now sits cleanly inside MainLayout */}
        <Route path="/library" element={
          <MainLayout>
            <Library mode="view" />
          </MainLayout>
        } />
        
        <Route path="/alerts" element={<Alerts />} />
        <Route path="/reminders" element={<Reminders />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;