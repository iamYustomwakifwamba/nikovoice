import { Route, Routes } from "react-router-dom"
import HomePage from "./pages/Home"
import TtsPage from "./pages/Tts"
import VoicesPage from "./pages/Voices"
import LoginPage from "./pages/Login"
import RegisterPage from "./pages/Register"

function App () {
   return(
    <Routes>
      <Route path="/home" element={<HomePage/>}/>
      <Route path="/app/text-to-speech" element={<TtsPage/>}/>
      <Route path="/voices" element={<VoicesPage/>}/>
      <Route path="/login" element={<LoginPage/>}/>
      <Route path="/signup" element={<RegisterPage/>}/>
    </Routes>
   )
}

export default App