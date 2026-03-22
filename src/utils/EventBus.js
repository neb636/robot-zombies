/**
 * Tiny global publish/subscribe bus so scenes and managers
 * can communicate without direct references.
 */
class EventBus extends EventTarget {
  emit(eventName, detail = {}) {
    this.dispatchEvent(new CustomEvent(eventName, { detail }));
  }

  on(eventName, handler) {
    this.addEventListener(eventName, (e) => handler(e.detail));
    return () => this.removeEventListener(eventName, handler);
  }
}

export const bus = new EventBus();
