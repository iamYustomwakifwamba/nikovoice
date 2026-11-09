import { useNavigate } from "react-router-dom";
import SignUpSection from "../section/SignUpSection";

function SignUpLayout() {
  const navigate = useNavigate();

  const handleSignup = async (data) => {
    // data = { email, phone, country, password }
    // TODO: unganisha na backend ukishaamua muundo wa auth
    await new Promise((r) => setTimeout(r, 800)); // mfano tu
    navigate("/home");
  };

  const handleGoogle = () => {
    // TODO
  };

  return (
    <div className="grid min-h-screen place-items-center bg-[#f3f5f9] px-4 py-10">
      <SignUpSection onSignup={handleSignup} onGoogle={handleGoogle} />
    </div>
  );
}

export default SignUpLayout;