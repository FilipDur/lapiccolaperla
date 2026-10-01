// Only pending requests are shared. Completed values and failures are never cached.
const pending = new Map();
const invalidated = Symbol("menu read invalidated");

const abortError = () => new DOMException("The operation was aborted.", "AbortError");

function subscribe(promise, signal) {
  if (!signal) return promise;
  if (signal.aborted) return Promise.reject(abortError());
  return new Promise((resolve, reject) => {
    const abort = () => reject(abortError());
    signal.addEventListener("abort", abort, { once: true });
    promise.then(
      (value) => { signal.removeEventListener("abort", abort); resolve(value); },
      (error) => { signal.removeEventListener("abort", abort); reject(error); }
    );
  });
}

export function readMenu(resource, load, { signal, scope = "public", authHeaders = {} } = {}) {
  if (signal?.aborted) return Promise.reject(abortError());
  // Keep dates, public/admin callers and different administrator identities apart.
  // These identity headers are used for coordination only, not added to public GETs.
  const identity = [...new Headers(authHeaders).entries()].sort(([a], [b]) => a.localeCompare(b));
  const key = JSON.stringify([resource, scope, identity]);
  let entry = pending.get(key);
  if (!entry) {
    entry = { resource, stale: false };
    const superseded = new Promise((resolve) => {
      entry.invalidate = () => { entry.stale = true; resolve(invalidated); };
    });
    const freshRead = () => readMenu(resource, load, { scope, authHeaders });
    entry.promise = Promise.race([Promise.resolve().then(load), superseded])
      .then(
        (value) => entry.stale ? freshRead() : value,
        (error) => {
          if (entry.stale) return freshRead();
          throw error;
        }
      )
      .finally(() => {
        if (pending.get(key) === entry) pending.delete(key);
      });
    pending.set(key, entry);
  }
  // Aborting one component must not cancel another component's shared request.
  return subscribe(entry.promise, signal);
}

export function invalidateMenuReads(resource) {
  for (const [key, entry] of pending) {
    if (entry.resource !== resource) continue;
    pending.delete(key);
    // Waiting readers immediately follow a fresh GET; a late old response cannot win.
    entry.invalidate();
  }
}
