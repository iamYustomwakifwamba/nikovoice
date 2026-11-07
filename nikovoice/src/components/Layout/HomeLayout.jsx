import { useState } from "react";
import SideBarSection from "../section/SideBar";
import HomeSection from "../section/HomeSection";
import TopBarSection from "../section/TopBarSection";

const titles = {
  home: "Home",
  voices: "Voices",
  "text-to-speech": "Text to Speech",
  dubbing: "Dubbing",
};

function HomeLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [active, setActive] = useState("home");

  return (
    <div className="flex h-screen bg-white text-gray-900">
      <SideBarSection
        active={active}
        onNavigate={setActive}
        collapsed={collapsed}
        onToggle={() => setCollapsed((c) => !c)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBarSection title={titles[active]} />

        <main className="flex-1 overflow-y-auto bg-[#f3f5f9] p-6">
          {active === "home" ? (
            <HomeSection onNavigate={setActive} />
          ) : (
            <div className="mt-32 text-center text-gray-500">
              {titles[active]} page inakuja...
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default HomeLayout;
