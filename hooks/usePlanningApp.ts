import { useState } from "react";

import type {
  AuthStage,
  InviteAccessPreview,
  Screen,
  UserRole,
} from "@/types/planning";

export function usePlanningApp() {
  const [activeScreen, setActiveScreen] = useState<Screen>("Dashboard");
  const [hasHydrated, setHasHydrated] = useState(false);
  const [savedLocally, setSavedLocally] = useState(false);
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
    savedLocally,
    setSavedLocally,
    authStage,
    setAuthStage,
    currentRole,
    setCurrentRole,
    inviteAccessPreview,
    setInviteAccessPreview,
  };
}
