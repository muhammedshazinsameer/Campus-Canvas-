import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { StudentAuthProvider } from './context/StudentAuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import StudentAuthModal from './components/StudentAuthModal';
import ExplorePage from './pages/ExplorePage';
import SearchPage from './pages/SearchPage';
import PieceDetailPage from './pages/PieceDetailPage';
import SubmitPage from './pages/SubmitPage';

export default function App() {
  return (
    <StudentAuthProvider>
      <Router>
        <div className="min-h-screen flex flex-col bg-[#faf7f0] text-[#1a1917]">
          <Navbar />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<ExplorePage />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/piece/:id" element={<PieceDetailPage />} />
              <Route path="/submit" element={<SubmitPage />} />
            </Routes>
          </main>
          <Footer />
          <StudentAuthModal />
        </div>
      </Router>
    </StudentAuthProvider>
  );
}
