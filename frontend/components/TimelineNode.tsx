import React from "react";
import { Handle, Position } from "reactflow";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import type { Tone } from "~backend/game/types";

interface TimelineNodeData {
  id: number;
  title: string;
  description?: string;
  tone: Tone;
  elementType: "period" | "event" | "scene";
  onAddChild?: () => void;
}

interface TimelineNodeProps {
  data: TimelineNodeData;
}

export default function TimelineNode({ data }: TimelineNodeProps) {
  const getToneColor = (tone: Tone) => {
    return tone === "dark" ? "bg-red-100 text-red-800 border-red-200" : "bg-blue-100 text-blue-800 border-blue-200";
  };

  const getNodeStyle = (elementType: string, tone: Tone) => {
    const baseStyle = "border-2 ";
    const toneStyle = tone === "dark" ? "border-red-300 bg-red-50" : "border-blue-300 bg-blue-50";
    
    switch (elementType) {
      case "period":
        return baseStyle + toneStyle + " min-w-[250px]";
      case "event":
        return baseStyle + toneStyle + " min-w-[200px]";
      case "scene":
        return baseStyle + toneStyle + " min-w-[180px]";
      default:
        return baseStyle + toneStyle;
    }
  };

  return (
    <div className="relative">
      <Handle type="target" position={Position.Top} />
      
      <Card className={getNodeStyle(data.elementType, data.tone)}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <Badge variant="outline" className={getToneColor(data.tone)}>
              {data.elementType.charAt(0).toUpperCase() + data.elementType.slice(1)}
            </Badge>
            {data.onAddChild && (
              <Button
                size="sm"
                variant="ghost"
                onClick={data.onAddChild}
                className="h-6 w-6 p-0"
              >
                <Plus className="w-3 h-3" />
              </Button>
            )}
          </div>
          <CardTitle className="text-sm font-medium">{data.title}</CardTitle>
        </CardHeader>
        {data.description && (
          <CardContent className="pt-0">
            <p className="text-xs text-gray-600 line-clamp-3">{data.description}</p>
          </CardContent>
        )}
      </Card>
      
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}
