import { useState } from "react";

import type {
  AuthStage,
  InviteAccessPreview,
  Screen,
  UserRole,
} from "@/types/planning";

export type PersistFeedbackPhase = "idle" | "pending" | "saved";

export function usePlanningApp() {
  const [activeScreen, setActiveScreen] = useState<Screen>("Dashboard");
  const [hasHydrated, setHasHydrated] = useState(false);
  const [persistPhase, setPersistPhase] = useState<PersistFeedbackPhase>("idle");
  const [persistBaseline, setPersistBaseline] = useState(false);
  const [authStage, setAuthStage] = useState<AuthStage>("login");
  const [currentRole, setCurrentRole] = useState<UserRole | null>(null);
  const [inviteAccessPreview, setInviteAccessPreview] = useState<InviteAccessPreview | null>(
    null,
  );

  return {
    activeScreen,
    setActiveScreen,
    hasHydrated,
    setHasHydrated,
    persistPhase,
    setPersistPhase,
    persistBaseline,
    setPersistBaseline,
    authStage,
    setAuthStage,
    currentRole,
    setCurrentRole,
    inviteAccessPreview,
    setInviteAccessPreview,
  };
}
