"use client";

import { useEffect, useState, type FormEvent } from "react";
import { BookmarkPlus, FolderOpen, Share2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import type { PointOfInterest } from "@/lib/types";
import { useApp } from "@/context/app-context";

type SavedTripPlan = {
  id: string;
  name: string;
  poiIds: string[];
};

const STORAGE_KEY = "rota-kula-trip-plans";

function isSavedTripPlan(value: unknown): value is SavedTripPlan {
  if (typeof value !== "object" || value === null) return false;

  const plan = value as Record<string, unknown>;
  return (
    typeof plan.id === "string" &&
    typeof plan.name === "string" &&
    Array.isArray(plan.poiIds) &&
    plan.poiIds.every(id => typeof id === "string")
  );
}

export function TripPlanControls({
  selectedPois,
  onLoadPlan,
}: {
  selectedPois: PointOfInterest[];
  onLoadPlan: (poiIds: string[]) => void;
}) {
  const { translations } = useApp();
  const { toast } = useToast();
  const [savedPlans, setSavedPlans] = useState<SavedTripPlan[]>([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [planName, setPlanName] = useState("");

  useEffect(() => {
    try {
      const savedValue = localStorage.getItem(STORAGE_KEY);
      if (!savedValue) return;

      const parsed: unknown = JSON.parse(savedValue);
      if (!Array.isArray(parsed) || !parsed.every(isSavedTripPlan)) {
        throw new Error("Saved trip plans have an invalid format.");
      }

      setSavedPlans(parsed);
    } catch (error) {
      console.error("Failed to load saved trip plans:", error);
      toast({
        title: translations.toast.errorTitle,
        description: translations.createRoute.tripPlanStorageError,
        variant: "destructive",
      });
    }
  }, [toast, translations]);

  const persistPlans = (plans: SavedTripPlan[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(plans));
      setSavedPlans(plans);
      return true;
    } catch (error) {
      console.error("Failed to save trip plans:", error);
      toast({
        title: translations.toast.errorTitle,
        description: translations.createRoute.tripPlanStorageError,
        variant: "destructive",
      });
      return false;
    }
  };

  const handleSavePlan = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = planName.trim();
    if (!name || selectedPois.length < 2) return;

    const plan: SavedTripPlan = {
      id: typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      name,
      poiIds: selectedPois.map(poi => poi.id),
    };

    if (persistPlans([plan, ...savedPlans])) {
      toast({ title: translations.createRoute.tripPlanSaved });
      setPlanName("");
      setShowSaveDialog(false);
    }
  };

  const handleDeletePlan = (planId: string) => {
    const nextPlans = savedPlans.filter(plan => plan.id !== planId);
    if (persistPlans(nextPlans)) {
      toast({ title: translations.createRoute.tripPlanDeleted });
    }
  };

  const handleSharePlan = async () => {
    if (selectedPois.length < 2) return;

    const shareUrl = new URL(window.location.href);
    shareUrl.searchParams.set("stops", selectedPois.map(poi => poi.id).join(","));
    const url = shareUrl.toString();

    try {
      if (navigator.share) {
        await navigator.share({
          title: translations.createRoute.title,
          text: selectedPois.map(poi => poi.name).join(" → "),
          url,
        });
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        window.prompt(translations.createRoute.shareTripPlan, url);
      }

      toast({ title: translations.createRoute.tripPlanShared });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;

      console.error("Failed to share trip plan:", error);
      toast({
        title: translations.toast.errorTitle,
        description: translations.createRoute.tripPlanShareError,
        variant: "destructive",
      });
    }
  };

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="font-semibold">{translations.createRoute.savedTripPlans}</h3>
          <p className="text-sm text-muted-foreground">
            {savedPlans.length === 0
              ? translations.createRoute.noSavedTripPlans
              : translations.createRoute.tripPlanLocalDescription}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowSaveDialog(true)}
            disabled={selectedPois.length < 2}
          >
            <BookmarkPlus />
            {translations.createRoute.saveTripPlan}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleSharePlan}
            disabled={selectedPois.length < 2}
          >
            <Share2 />
            {translations.createRoute.shareTripPlan}
          </Button>
        </div>
      </div>

      {savedPlans.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {savedPlans.map(plan => (
            <Card key={plan.id}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{plan.name}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {translations.createRoute.tripPlanStops.replace("{count}", String(plan.poiIds.length))}
                </p>
              </CardHeader>
              <CardContent className="flex gap-2">
                <Button type="button" size="sm" className="flex-1" onClick={() => onLoadPlan(plan.poiIds)}>
                  <FolderOpen />
                  {translations.createRoute.loadTripPlan}
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  aria-label={translations.createRoute.deleteTripPlan}
                  title={translations.createRoute.deleteTripPlan}
                  onClick={() => handleDeletePlan(plan.id)}
                >
                  <Trash2 />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <form onSubmit={handleSavePlan}>
            <DialogHeader>
              <DialogTitle>{translations.createRoute.saveTripPlan}</DialogTitle>
              <DialogDescription>{translations.createRoute.tripPlanName}</DialogDescription>
            </DialogHeader>
            <div className="grid gap-2 py-4">
              <Label htmlFor="trip-plan-name">{translations.createRoute.tripPlanName}</Label>
              <Input
                id="trip-plan-name"
                value={planName}
                onChange={event => setPlanName(event.target.value)}
                placeholder={translations.createRoute.tripPlanNamePlaceholder}
                maxLength={80}
                required
                autoFocus
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowSaveDialog(false)}>
                {translations.common.cancel}
              </Button>
              <Button type="submit">{translations.createRoute.saveTripPlan}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  );
}
