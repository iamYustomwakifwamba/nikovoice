import LoginSection from "../section/LoginSection";

function LoginLayout() {
  const handleGoogle = () => {
    // TODO: Django Google OAuth
  };

  return (
    <div className="grid min-h-screen place-items-center bg-[#f3f5f9] px-4 py-10">
      <LoginSection onGoogle={handleGoogle} />
    </div>
  );
}

export default LoginLayout;