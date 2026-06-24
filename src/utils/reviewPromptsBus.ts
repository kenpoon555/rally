type Listener = () => void;

const listeners = new Set<Listener>();

export function subscribeReviewPromptsInvalidation(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function invalidateReviewPrompts(): void {
  listeners.forEach((listener) => listener());
}
