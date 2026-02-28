type Subscriber = {
  send: (payload: any) => void
}

const globalBus = global as unknown as { chatBus?: Map<string, Set<Subscriber>> }

function getBus(): Map<string, Set<Subscriber>> {
  if (!globalBus.chatBus) {
    globalBus.chatBus = new Map<string, Set<Subscriber>>()
  }
  return globalBus.chatBus!
}

export function subscribe(userId: string, sub: Subscriber) {
  const bus = getBus()
  if (!userId) return
  if (!bus.has(userId)) bus.set(userId, new Set())
  bus.get(userId)!.add(sub)
}

export function unsubscribe(userId: string, sub: Subscriber) {
  const bus = getBus()
  const set = bus.get(userId)
  if (set) {
    set.delete(sub)
    if (set.size === 0) bus.delete(userId)
  }
}

export function emitTo(userId: string, payload: any) {
  const bus = getBus()
  const set = bus.get(userId)
  if (!set || set.size === 0) return
  for (const s of set) {
    try {
      s.send(payload)
    } catch {}
  }
}
