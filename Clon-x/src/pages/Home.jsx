import { useState } from "react";
import { useAuth } from "../context/auth-context";
import { useUserProfile } from "../hooks/useUserProfile";
import Feed from "../components/Feed";
import TweetForm from "../components/TweetForm";

export default function Home() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("Para ti");
  const { profile, error: profileError } = useUserProfile(user.uid);

  return (
    <>
      <header className="sticky top-0 z-20 grid h-[54px] grid-cols-2 border-b border-zinc-200 bg-white/85 backdrop-blur-md">
        {["Para ti", "Siguiendo"].map((tab) => (
          <button
            aria-pressed={activeTab === tab}
            className="relative flex items-center justify-center text-sm transition hover:bg-zinc-100"
            key={tab}
            onClick={() => setActiveTab(tab)}
            type="button"
          >
            <span
              className={
                activeTab === tab
                  ? "font-bold"
                  : "font-medium text-zinc-500"
              }
            >
              {tab}
            </span>
            {activeTab === tab && (
              <span className="absolute bottom-0 h-1 w-14 rounded-full bg-[#1d9bf0]" />
            )}
          </button>
        ))}
      </header>

      {profileError && (
        <p className="p-4 text-sm text-red-600" role="alert">
          {profileError}
        </p>
      )}
      <TweetForm profile={profile} user={user} />
      <Feed
        followingUids={profile?.following || []}
        followingOnly={activeTab === "Siguiendo"}
        includeExamples={activeTab === "Para ti"}
        profile={profile}
        user={user}
      />
    </>
  );
}
