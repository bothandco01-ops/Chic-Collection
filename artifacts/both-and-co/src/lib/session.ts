export function getSessionId(): string {
  let sessionId = localStorage.getItem("cartSessionId");
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem("cartSessionId", sessionId);
  }
  return sessionId;
}
