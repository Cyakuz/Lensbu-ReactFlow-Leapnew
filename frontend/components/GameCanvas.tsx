import React, { useState, useCallback, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  MiniMap,
  ReactFlowProvider,
} from "reactflow";
import "reactflow/dist/style.css";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft, Plus, Save, Search, Undo, Redo } from "lucide-react";
import backend from "~backend/client";
import type { GameWithElements, Period, Event, Scene, Tone } from "~backend/game/types";
import TimelineNode from "./TimelineNode";
import ElementDialog from "./ElementDialog";

const nodeTypes = {
  timeline: TimelineNode,
};

interface GameCanvasProps {
  gameId: number;
  userId: string;
  onBackToDashboard: () => void;
}

export default function GameCanvas({ gameId, userId, onBackToDashboard }: GameCanvasProps) {
  return (
    <ReactFlowProvider>
      <GameCanvasInner gameId={gameId} userId={userId} onBackToDashboard={onBackToDashboard} />
    </ReactFlowProvider>
  );
}

function GameCanvasInner({ gameId, userId, onBackToDashboard }: GameCanvasProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedElement, setSelectedElement] = useState<{
    type: "period" | "event" | "scene";
    data?: any;
    parentId?: number;
  } | null>(null);
  const [isElementDialogOpen, setIsElementDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);

  const { data: gameData, isLoading } = useQuery({
    queryKey: ["game", gameId],
    queryFn: () => backend.game.getGame({ id: gameId, userId }),
  });

  const updatePositionMutation = useMutation({
    mutationFn: (data: {
      elementType: "period" | "event" | "scene";
      elementId: number;
      positionX: number;
      positionY: number;
    }) => backend.game.updateElementPosition({ ...data, userId }),
    onError: (error) => {
      console.error("Failed to update position:", error);
      toast({
        title: "Error",
        description: "Failed to update element position.",
        variant: "destructive",
      });
    },
  });

  const createPeriodMutation = useMutation({
    mutationFn: (data: { title: string; description?: string; tone: Tone }) =>
      backend.game.createPeriod({ ...data, gameId, userId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["game", gameId] });
      setIsElementDialogOpen(false);
      toast({
        title: "Period created",
        description: "New period has been added to the timeline.",
      });
    },
    onError: (error) => {
      console.error("Failed to create period:", error);
      toast({
        title: "Error",
        description: "Failed to create period.",
        variant: "destructive",
      });
    },
  });

  const createEventMutation = useMutation({
    mutationFn: (data: { periodId: number; title: string; description?: string; tone: Tone }) =>
      backend.game.createEvent({ ...data, userId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["game", gameId] });
      setIsElementDialogOpen(false);
      toast({
        title: "Event created",
        description: "New event has been added to the period.",
      });
    },
    onError: (error) => {
      console.error("Failed to create event:", error);
      toast({
        title: "Error",
        description: "Failed to create event.",
        variant: "destructive",
      });
    },
  });

  const createSceneMutation = useMutation({
    mutationFn: (data: { eventId: number; title: string; description?: string; tone: Tone }) =>
      backend.game.createScene({ ...data, userId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["game", gameId] });
      setIsElementDialogOpen(false);
      toast({
        title: "Scene created",
        description: "New scene has been added to the event.",
      });
    },
    onError: (error) => {
      console.error("Failed to create scene:", error);
      toast({
        title: "Error",
        description: "Failed to create scene.",
        variant: "destructive",
      });
    },
  });

  // Convert game data to React Flow nodes and edges
  React.useEffect(() => {
    if (!gameData) return;

    const newNodes: Node[] = [];
    const newEdges: Edge[] = [];

    // Create period nodes
    gameData.periods.forEach((period: Period, index: number) => {
      newNodes.push({
        id: `period-${period.id}`,
        type: "timeline",
        position: { x: period.positionX || index * 300, y: period.positionY || 0 },
        data: {
          ...period,
          elementType: "period",
          onAddChild: () => {
            setSelectedElement({ type: "event", parentId: period.id });
            setIsElementDialogOpen(true);
          },
        },
      });
    });

    // Create event nodes and edges
    gameData.events.forEach((event: Event, index: number) => {
      const parentPeriod = gameData.periods.find(p => p.id === event.periodId);
      if (parentPeriod) {
        newNodes.push({
          id: `event-${event.id}`,
          type: "timeline",
          position: { 
            x: event.positionX || (parentPeriod.positionX || 0) + 50, 
            y: event.positionY || (parentPeriod.positionY || 0) + 150 
          },
          data: {
            ...event,
            elementType: "event",
            onAddChild: () => {
              setSelectedElement({ type: "scene", parentId: event.id });
              setIsElementDialogOpen(true);
            },
          },
        });

        newEdges.push({
          id: `period-${event.periodId}-event-${event.id}`,
          source: `period-${event.periodId}`,
          target: `event-${event.id}`,
          type: "smoothstep",
        });
      }
    });

    // Create scene nodes and edges
    gameData.scenes.forEach((scene: Scene, index: number) => {
      const parentEvent = gameData.events.find(e => e.id === scene.eventId);
      if (parentEvent) {
        newNodes.push({
          id: `scene-${scene.id}`,
          type: "timeline",
          position: { 
            x: scene.positionX || (parentEvent.positionX || 0) + 50, 
            y: scene.positionY || (parentEvent.positionY || 0) + 150 
          },
          data: {
            ...scene,
            elementType: "scene",
          },
        });

        newEdges.push({
          id: `event-${scene.eventId}-scene-${scene.id}`,
          source: `event-${scene.eventId}`,
          target: `scene-${scene.id}`,
          type: "smoothstep",
        });
      }
    });

    setNodes(newNodes);
    setEdges(newEdges);
  }, [gameData, setNodes, setEdges]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const onNodeDragStop = useCallback(
    (event: React.MouseEvent, node: Node) => {
      const [elementType, elementId] = node.id.split("-");
      updatePositionMutation.mutate({
        elementType: elementType as "period" | "event" | "scene",
        elementId: parseInt(elementId),
        positionX: node.position.x,
        positionY: node.position.y,
      });
    },
    [updatePositionMutation]
  );

  const handleAddPeriod = () => {
    setSelectedElement({ type: "period" });
    setIsElementDialogOpen(true);
  };

  const handleSaveElement = (data: { title: string; description?: string; tone: Tone }) => {
    if (!selectedElement) return;

    switch (selectedElement.type) {
      case "period":
        createPeriodMutation.mutate(data);
        break;
      case "event":
        if (selectedElement.parentId) {
          createEventMutation.mutate({ ...data, periodId: selectedElement.parentId });
        }
        break;
      case "scene":
        if (selectedElement.parentId) {
          createSceneMutation.mutate({ ...data, eventId: selectedElement.parentId });
        }
        break;
    }
  };

  const filteredNodes = searchTerm
    ? nodes.filter(node => 
        node.data.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        node.data.description?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : nodes;

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading game...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      <header className="bg-white shadow-sm border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" onClick={onBackToDashboard}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="text-xl font-semibold">{gameData?.game.title}</h1>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search timeline..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          <Button variant="outline" size="sm">
            <Undo className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm">
            <Redo className="w-4 h-4" />
          </Button>
          <Button size="sm" onClick={handleAddPeriod}>
            <Plus className="w-4 h-4 mr-2" />
            Add Period
          </Button>
          <Button variant="outline" size="sm">
            <Save className="w-4 h-4 mr-2" />
            Save
          </Button>
        </div>
      </header>

      <div className="flex-1" ref={reactFlowWrapper}>
        <ReactFlow
          nodes={filteredNodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeDragStop={onNodeDragStop}
          nodeTypes={nodeTypes}
          fitView
          attributionPosition="bottom-left"
        >
          <Controls />
          <MiniMap />
          <Background variant="dots" gap={12} size={1} />
        </ReactFlow>
      </div>

      <ElementDialog
        isOpen={isElementDialogOpen}
        onClose={() => {
          setIsElementDialogOpen(false);
          setSelectedElement(null);
        }}
        elementType={selectedElement?.type || "period"}
        onSave={handleSaveElement}
      />
    </div>
  );
}
