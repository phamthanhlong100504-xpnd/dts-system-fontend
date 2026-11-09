/** Serialize one attempt's writes. A failed request never leaves the queue locked. */
export function createSimulationCommandQueue() {
  let tail = Promise.resolve();
  let pending = 0;
  return {
    get pending() {
      return pending;
    },
    enqueue<T>(run: () => Promise<T>): Promise<T> {
      pending++;
      const work = tail.then(run);
      tail = work
        .then(
          () => {},
          () => {},
        )
        .finally(() => {
          pending--;
        });
      return work;
    },
  };
}
