import "./App.css";
import { Route, BrowserRouter, Routes } from "react-router-dom";
import LandingPage from "./pages/LandingPage.jsx";
import Authentication from "./pages/Authentication.jsx";
import { AuthProvider } from "./contexts/AuthContext.jsx";
import Home from "./pages/Home.jsx"
import VideoMeet from "./pages/videoMeet.jsx";
import History from "./pages/History.jsx";

function App() {
  return (
    <>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/auth" element={<Authentication />} />
            <Route path="/home" element={<Home/>} />
            <Route path="/:url" element={<VideoMeet />} />
            <Route path="/history" element={<History/>}/>
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </>
  );
}

export default App;
