import { BrowserRouter, Route, Routes } from "react-router-dom";
import { LandingPage } from "./pages/LandingPage";
import { MethodologyPage } from "./pages/MethodologyPage";
import { PlotsPage } from "./pages/PlotsPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/methodology" element={<MethodologyPage />} />
        <Route path="/plots" element={<PlotsPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
