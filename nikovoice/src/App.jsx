import { Route, Routes } from "react-router-dom"
import HomePage from "./pages/Home"
import TtsPage from "./pages/Tts"
import VoicesPage from "./pages/Voices"
import LoginPage from "./pages/Login"

function App () {
   return(
    <Routes>
      <Route path="/home" element={<HomePage/>}/>
      <Route path="/app/text-to-speech" element={<TtsPage/>}/>
      <Route path="/voices" element={<VoicesPage/>}/>
      <Route path="/login" element={<LoginPage/>}/>
    </Routes>
   )
}

export default App