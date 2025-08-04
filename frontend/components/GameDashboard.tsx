import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { Plus, Play, Trash2, LogOut } from "lucide-react";
import backend from "~backend/client";
import type { Game } from "~backend/game/types";

interface GameDashboardProps {
  userId: string;
  onGameSelect: (gameId: number) => void;
  onLogout: () => void;
}

export default function GameDashboard({ userId, onGameSelect, onLogout }: GameDashboardProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newGameTitle, setNewGameTitle] = useState("");
  const [newGameDescription, setNewGameDescription] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: gamesData, isLoading } = useQuery({
    queryKey: ["games", userId],
    queryFn: () => backend.game.listGames({ userId }),
  });

  const createGameMutation = useMutation({
    mutationFn: (data: { title: string; description?: string }) =>
      backend.game.createGame({ ...data, userId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["games", userId] });
      setIsCreateDialogOpen(false);
      setNewGameTitle("");
      setNewGameDescription("");
      toast({
        title: "Game created",
        description: "Your new game has been created successfully.",
      });
    },
    onError: (error) => {
      console.error("Failed to create game:", error);
      toast({
        title: "Error",
        description: "Failed to create game. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteGameMutation = useMutation({
    mutationFn: (gameId: number) => backend.game.deleteGame({ id: gameId, userId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["games", userId] });
      toast({
        title: "Game deleted",
        description: "The game has been deleted successfully.",
      });
    },
    onError: (error) => {
      console.error("Failed to delete game:", error);
      toast({
        title: "Error",
        description: "Failed to delete game. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleCreateGame = (e: React.FormEvent) => {
    e.preventDefault();
    if (newGameTitle.trim()) {
      createGameMutation.mutate({
        title: newGameTitle.trim(),
        description: newGameDescription.trim() || undefined,
      });
    }
  };

  const handleDeleteGame = (gameId: number, gameTitle: string) => {
    if (confirm(`Are you sure you want to delete "${gameTitle}"? This action cannot be undone.`)) {
      deleteGameMutation.mutate(gameId);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Microscope RPG</h1>
              <p className="text-sm text-gray-600">Welcome back, {userId}</p>
            </div>
            <Button variant="outline" onClick={onLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-xl font-semibold text-gray-900">Your Games</h2>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                New Game
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Game</DialogTitle>
                <DialogDescription>
                  Start a new Microscope RPG timeline. Give your game a title and optional description.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateGame} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Game Title</Label>
                  <Input
                    id="title"
                    placeholder="Enter game title"
                    value={newGameTitle}
                    onChange={(e) => setNewGameTitle(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe your game's setting or theme"
                    value={newGameDescription}
                    onChange={(e) => setNewGameDescription(e.target.value)}
                    rows={3}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createGameMutation.isPending}>
                    {createGameMutation.isPending ? "Creating..." : "Create Game"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : gamesData?.games.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Plus className="w-16 h-16 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No games yet</h3>
            <p className="text-gray-600 mb-4">Create your first Microscope RPG game to get started.</p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Game
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {gamesData?.games.map((game: Game) => (
              <Card key={game.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg">{game.title}</CardTitle>
                  <CardDescription>
                    Created {new Date(game.createdAt).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {game.description && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-3">{game.description}</p>
                  )}
                  <div className="flex justify-between items-center">
                    <Button onClick={() => onGameSelect(game.id)} size="sm">
                      <Play className="w-4 h-4 mr-2" />
                      Open
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteGame(game.id, game.title)}
                      disabled={deleteGameMutation.isPending}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
