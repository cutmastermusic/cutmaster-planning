"use client";

import { Children, isValidElement } from "react";

import { EventModalActions } from "@/components/events/EventModalActions";

type EventModalContentProps = {
  children: React.ReactNode;
};

export function EventModalContent({ children }: EventModalContentProps) {
  const items = Children.toArray(children);
  const actionIndex = items.findIndex(
    (child) => isValidElement(child) && child.type === EventModalActions,
  );

  if (actionIndex < 0) {
    return (
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4">
        <div className="space-y-4">{children}</div>
      </div>
    );
  }

  const bodyItems = items.filter((_, index) => index !== actionIndex);
  const actions = items[actionIndex];

  return (
    <>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4">
        <div className="space-y-4">{bodyItems}</div>
      </div>
      <div className="shrink-0">{actions}</div>
    </>
  );
}
