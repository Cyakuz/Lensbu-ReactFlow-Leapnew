import React, { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import LoginScreen from "./components/LoginScreen";
import GameDashboard from "./components/GameDashboard";
import GameCanvas from "./components/GameCanvas";

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppInner />
      <Toaster />
    </QueryClientProvider>
  );
}

function AppInner() {
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [currentGameId, setCurrentGameId] = useState<number | null>(null);

  if (!currentUser) {
    return <LoginScreen onLogin={setCurrentUser} />;
  }

  if (!currentGameId) {
    return (
      <GameDashboard
        userId={currentUser}
        onGameSelect={setCurrentGameId}
        onLogout={() => setCurrentUser(null)}
      />
    );
  }

  return (
    <GameCanvas
      gameId={currentGameId}
      userId={currentUser}
      onBackToDashboard={() => setCurrentGameId(null)}
    />
  );
}
