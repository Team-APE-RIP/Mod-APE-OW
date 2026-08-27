export interface AbortableLike<T> {
  /** gaussian-splats-3d exposes its underlying native promise on this field. */
  promise?: PromiseLike<T>
  then: (onResolved: (value: T) => unknown) => AbortableLike<unknown>
  catch: (onRejected: (error: unknown) => unknown) => AbortableLike<unknown>
  abort?: (reason?: unknown) => void
}

export function toNativePromise<T>(source: AbortableLike<T>): Promise<T> {
  if (source.promise && typeof source.promise.then === 'function') {
    return Promise.resolve(source.promise)
  }

  return new Promise<T>((resolve, reject) => {
    try {
      source.then(resolve).catch(reject)
    } catch (error) {
      reject(error)
    }
  })
}

export function withTimeout<T>(promise: Promise<T>, timeoutMs: number, message: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new Error(message)), timeoutMs)
    promise.then(
      (value) => {
        window.clearTimeout(timer)
        resolve(value)
      },
      (error) => {
        window.clearTimeout(timer)
        reject(error)
      },
    )
  })
}
