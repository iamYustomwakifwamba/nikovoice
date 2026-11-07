import { useNavigate } from "react-router-dom";
import LoginSection from "../section/LoginSection";

function LoginLayout() {
  const navigate = useNavigate();

  const handleLogin = async ({ email, password }) => {
    // TODO: unganisha na Django
    // const res = await fetch("/api/auth/login/", {
    //   method: "POST",
    //   headers: { "Content-Type": "application/json" },
    //   credentials: "include",
    //   body: JSON.stringify({ email, password }),
    // });
    // if (!res.ok) throw new Error("Invalid email or password");
    await new Promise((r) => setTimeout(r, 800)); // mfano tu
    navigate("/");
  };

  const handleGoogle = () => {
    // TODO: peleka kwenye OAuth ya Django
    // window.location.href = "/api/auth/google/login/";
  };

  return (
    <div className="grid min-h-screen place-items-center bg-[#f3f5f9] px-4 py-10">
      <LoginSection onLogin={handleLogin} onGoogle={handleGoogle} />
    </div>
  );
}

export default LoginLayout;