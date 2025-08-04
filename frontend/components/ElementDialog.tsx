import React, { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { Tone } from "~backend/game/types";

interface ElementDialogProps {
  isOpen: boolean;
  onClose: () => void;
  elementType: "period" | "event" | "scene";
  onSave: (data: { title: string; description?: string; tone: Tone }) => void;
}

export default function ElementDialog({ isOpen, onClose, elementType, onSave }: ElementDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tone, setTone] = useState<Tone>("light");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      onSave({
        title: title.trim(),
        description: description.trim() || undefined,
        tone,
      });
      setTitle("");
      setDescription("");
      setTone("light");
    }
  };

  const handleClose = () => {
    setTitle("");
    setDescription("");
    setTone("light");
    onClose();
  };

  const getElementTypeLabel = () => {
    return elementType.charAt(0).toUpperCase() + elementType.slice(1);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New {getElementTypeLabel()}</DialogTitle>
          <DialogDescription>
            Create a new {elementType} for your timeline. Choose a tone that reflects the nature of this element.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder={`Enter ${elementType} title`}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder={`Describe this ${elementType}...`}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
          
          <div className="space-y-3">
            <Label>Tone</Label>
            <RadioGroup value={tone} onValueChange={(value) => setTone(value as Tone)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="light" id="light" />
                <Label htmlFor="light" className="flex items-center space-x-2">
                  <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
                  <span>Light (Positive, hopeful)</span>
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="dark" id="dark" />
                <Label htmlFor="dark" className="flex items-center space-x-2">
                  <span className="w-3 h-3 bg-red-500 rounded-full"></span>
                  <span>Dark (Negative, tragic)</span>
                </Label>
              </div>
            </RadioGroup>
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit">
              Create {getElementTypeLabel()}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
