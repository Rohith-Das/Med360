import { Routes, Route } from "react-router-dom";
import FirstPage from "./pages/patientPages/FirstPage";

function App() {
  return (
    <Routes>
      <Route path="/" element={<FirstPage />} />
    </Routes>
  );
}

export default App;
