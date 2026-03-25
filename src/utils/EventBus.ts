import { EVENTS } from './constants.js';

/**
 * Typed event detail map — each key is an event name, value is its detail shape.
 */
type BusEventMap = {
  [EVENTS.BATTLE_START]:     Record<string, never>;
  [EVENTS.BATTLE_END]:       { victory: boolean };
  [EVENTS.DIALOGUE_OPEN]:    { speaker: string; lines: string[] };
  [EVENTS.DIALOGUE_CLOSE]:   Record<string, never>;
  [EVENTS.SCENE_TRANSITION]: Record<string, never>;
  [EVENTS.PAUSE_OPEN]:       Record<string, never>;
  [EVENTS.PAUSE_CLOSE]:      Record<string, never>;
};

type BusEventName = keyof BusEventMap;

/**
 * Tiny global publish/subscribe bus so scenes and managers
 * can communicate without direct references.
 */
class EventBus extends EventTarget {
  emit<K extends BusEventName>(eventName: K, detail: BusEventMap[K]): void {
    this.dispatchEvent(new CustomEvent(eventName, { detail }));
  }

  on<K extends BusEventName>(
    eventName: K,
    handler: (detail: BusEventMap[K]) => void,
  ): () => void {
    const listener = (e: Event): void => {
      handler((e as CustomEvent<BusEventMap[K]>).detail);
    };
    this.addEventListener(eventName, listener);
    return () => this.removeEventListener(eventName, listener);
  }

  once<K extends BusEventName>(
    eventName: K,
    handler: (detail: BusEventMap[K]) => void,
  ): void {
    const listener = (e: Event): void => {
      this.removeEventListener(eventName, listener);
      handler((e as CustomEvent<BusEventMap[K]>).detail);
    };
    this.addEventListener(eventName, listener);
  }
}

export const bus = new EventBus();
