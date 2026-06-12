import type { ActivityEvent } from "./types"

const ACTIVITY_KEY = "regent_activity"

export function getActivity(): ActivityEvent[] {
  if (typeof window === "undefined") return []
  const raw = localStorage.getItem(ACTIVITY_KEY)
  return raw ? (JSON.parse(raw) as ActivityEvent[]) : []
}

function saveActivity(events: ActivityEvent[]) {
  if (typeof window === "undefined") return
  localStorage.setItem(ACTIVITY_KEY, JSON.stringify(events))
}

export function addActivity(
  mandateId: string,
  step: string,
  message: string,
  metadata?: Record<string, unknown>,
): ActivityEvent {
  const event: ActivityEvent = {
    id: crypto.randomUUID(),
    mandateId,
    step,
    message,
    timestamp: Date.now(),
    metadata,
  }
  const events = getActivity()
  events.push(event)
  saveActivity(events)
  return event
}

export function getActivityForMandate(mandateId: string): ActivityEvent[] {
  return getActivity().filter((e) => e.mandateId === mandateId)
}

export function clearActivity(mandateId?: string) {
  if (mandateId) {
    saveActivity(getActivity().filter((e) => e.mandateId !== mandateId))
  } else {
    saveActivity([])
  }
}
