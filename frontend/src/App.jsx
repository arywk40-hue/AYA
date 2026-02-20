import React from "react";
import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ParticleBackground from "./components/ParticleBackground";
import Home from "./pages/Home";
import Explore from "./pages/Explore";
import NFTDetail from "./pages/NFTDetail";
import CreateNFT from "./pages/CreateNFT";
import Profile from "./pages/Profile";

function App() {
  return (
    <div className="app">
      <ParticleBackground />
      <Navbar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/nft/:id" element={<NFTDetail />} />
          <Route path="/create" element={<CreateNFT />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default App;