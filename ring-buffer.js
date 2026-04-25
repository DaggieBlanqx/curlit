export class RingBuffer {
  constructor (size) {
    this.size = size
    this.buffer = []
    this.listeners = new Set()
  }

  push (entry) {
    if (this.buffer.length >= this.size) {
      this.buffer.shift()
    }
    this.buffer.push(entry)
    this._notify(entry)
  }

  all () {
    return [...this.buffer].reverse()
  }

  clear () {
    this.buffer = []
  }

  /**
   * Subscribe to new entries. Returns an unsubscribe function.
   */
  subscribe (listener) {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  _notify (entry) {
    for (const listener of this.listeners) {
      try { listener(entry) } catch {}
    }
  }
}
