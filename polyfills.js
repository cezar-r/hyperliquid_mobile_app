// This file must be imported FIRST in index.ts
import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';
import { Buffer } from 'buffer';

global.Buffer = Buffer;

// Polyfill Event constructor
if (typeof global.Event === 'undefined') {
  global.Event = function Event(type, eventInitDict) {
    this.type = type;
    this.bubbles = !!(eventInitDict && eventInitDict.bubbles);
    this.cancelable = !!(eventInitDict && eventInitDict.cancelable);
    this.composed = !!(eventInitDict && eventInitDict.composed);
  };
}

// Polyfill EventTarget
if (typeof global.EventTarget === 'undefined') {
  global.EventTarget = class EventTarget {
    constructor() {
      this.listeners = {};
    }

    addEventListener(type, listener) {
      if (!this.listeners[type]) {
        this.listeners[type] = [];
      }
      if (this.listeners[type].indexOf(listener) === -1) {
        this.listeners[type].push(listener);
      }
    }

    removeEventListener(type, listener) {
      if (this.listeners[type]) {
        const index = this.listeners[type].indexOf(listener);
        if (index !== -1) {
          this.listeners[type].splice(index, 1);
        }
      }
    }

    dispatchEvent(event) {
      if (this.listeners[event.type]) {
        this.listeners[event.type].forEach((listener) => {
          try {
            listener.call(this, event);
          } catch (e) {
            console.error('Error in event listener:', e);
          }
        });
      }
      return true;
    }
  };
}

// Polyfill CustomEvent
if (typeof global.CustomEvent === 'undefined') {
  global.CustomEvent = function CustomEvent(type, eventInitDict) {
    const event = new Event(type, eventInitDict);
    event.detail = eventInitDict ? eventInitDict.detail : null;
    return event;
  };
}

