import React from "react";
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import PledgePage from "./pages/PledgePage";
import NavBar from "./components/ui/NavBar";
import Footer from "./components/ui/Footer";
import { WalletCtxProvider } from "./lib/wallet/connect";

function App() {
  // Force dark mode for the entire app
  React.useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  return (
    <div className="App bg-primary-black min-h-screen flex flex-col">
      <WalletCtxProvider>
        <BrowserRouter>
          <NavBar />
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/pledge" element={<PledgePage />} />
            </Routes>
          </main>
          <Footer />
        </BrowserRouter>
      </WalletCtxProvider>
    </div>
  );
}

export default App;
