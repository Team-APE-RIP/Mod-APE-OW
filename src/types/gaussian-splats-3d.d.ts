declare module '@mkkellogg/gaussian-splats-3d' {
  import { Group } from 'three'

  interface SplatScene {
    visible: boolean
    opacity?: number
  }

  interface SplatSceneOptions {
    path: string
    splatAlphaRemovalThreshold?: number
    showLoadingUI?: boolean
    position?: [number, number, number]
    rotation?: [number, number, number, number]
    scale?: [number, number, number]
    progressiveLoad?: boolean
    onProgress?: (percent: number, label?: string) => void
  }

  export class AbortablePromise<T> {
    promise: Promise<T>
    then<R>(onResolved: (value: T) => R): AbortablePromise<R>
    catch(onRejected: (error: unknown) => unknown): AbortablePromise<T>
    abort(reason?: unknown): void
  }

  export class DropInViewer extends Group {
    constructor(options?: Record<string, unknown>)
    addSplatScene(path: string, options?: Omit<SplatSceneOptions, 'path'>): AbortablePromise<void>
    addSplatScenes(options: SplatSceneOptions[], showLoadingUI?: boolean): AbortablePromise<void>
    getSplatScene(index: number): SplatScene
    dispose(): Promise<void>
  }
}
