import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import type { DropInViewer as GaussianViewer } from '@mkkellogg/gaussian-splats-3d'
import { toNativePromise, withTimeout } from '../experience/abortable'
import { fitCameraDistance } from '../experience/camera'
import { shouldUseGaussianSplats } from '../experience/rendering'

interface SceneBackdropProps {
  progress: number
  activeScene: 'opening' | 'ruins'
  ariaLabel: string
  onLoadProgress: (progress: number) => void
  onReady: () => void
}

const IMAGE_ASPECT = 1672 / 941
const SHARP_VERTICAL_FOV = THREE.MathUtils.radToDeg(2 * Math.atan(941 / (2 * 1330.3167724609375)))

interface NavigatorWithPerformanceHints extends Navigator {
  connection?: { saveData?: boolean }
  deviceMemory?: number
}

function loadTexture(url: string, onSettled?: () => void): THREE.Texture {
  const texture = new THREE.TextureLoader().load(url, onSettled, undefined, onSettled)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.minFilter = THREE.LinearFilter
  texture.magFilter = THREE.LinearFilter
  return texture
}

export function SceneBackdrop({ progress, activeScene, ariaLabel, onLoadProgress, onReady }: SceneBackdropProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const progressRef = useRef(progress)
  const sceneRef = useRef(activeScene)

  progressRef.current = progress
  sceneRef.current = activeScene

  useEffect(() => {
    const canvas = canvasRef.current
    const root = rootRef.current
    if (!canvas || !root) return undefined

    let disposed = false
    let frame = 0
    let openingViewer: GaussianViewer | null = null
    let ruinsViewer: GaussianViewer | null = null
    let ruinsLoadStarted = false
    let sphereRoot: THREE.Group | null = null
    let sphereRadius = 0.5
    let sphereBaseDistance = 5
    const initialSphereY = -0.32
    const sphereVisualScale = 0.95
    const impactScaleGain = 1.9
    const impactCameraTravel = 3.9
    const impactVerticalTravel = 3.1
    const initialSpherePitch = THREE.MathUtils.degToRad(14)
    const initialSphereYaw = THREE.MathUtils.degToRad(8)
    let readySent = false
    const pointerTarget = new THREE.Vector2()
    const pointerCurrent = new THREE.Vector2()
    const jitterCurrent = new THREE.Vector3()
    const jitterTarget = new THREE.Vector3()
    const jitterVelocity = new THREE.Vector3()
    const jitterAcceleration = new THREE.Vector3()
    const positionJitterCurrent = new THREE.Vector3()
    const positionJitterTarget = new THREE.Vector3()
    const positionJitterVelocity = new THREE.Vector3()
    const positionJitterAcceleration = new THREE.Vector3()
    let nextJitterAt = performance.now() + 25 + Math.random() * 75
    let lastJitterFrameAt = performance.now()
    let jitterCount = 0

    const stepJitterSpring = (
      current: THREE.Vector3,
      target: THREE.Vector3,
      velocity: THREE.Vector3,
      acceleration: THREE.Vector3,
      deltaSeconds: number,
    ) => {
      acceleration.subVectors(target, current).multiplyScalar(260).addScaledVector(velocity, -29)
      velocity.addScaledVector(acceleration, deltaSeconds)
      current.addScaledVector(velocity, deltaSeconds)
    }

    const hints = navigator as NavigatorWithPerformanceHints
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const useSplats = shouldUseGaussianSplats({
      width: window.innerWidth,
      reducedMotion,
      saveData: hints.connection?.saveData ?? false,
      deviceMemory: hints.deviceMemory,
    })
    const loadState = {
      openingImage: 0,
      ruinsImage: 0,
      model: 0,
      openingSplat: useSplats ? 0 : 1,
      ruinsSplat: useSplats ? 0 : 1,
    }
    const updateLoadState = (part: keyof typeof loadState, value: number) => {
      if (disposed || !Number.isFinite(value)) return
      loadState[part] = Math.max(loadState[part], Math.min(1, value))
      const combined = Object.values(loadState).reduce((total, current) => total + current, 0) / Object.keys(loadState).length
      onLoadProgress(combined)
      if (!readySent && combined >= 0.999) {
        readySent = true
        onReady()
      }
    }
    onLoadProgress(0)

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: false,
      antialias: true,
      powerPreference: 'high-performance',
    })
    renderer.setClearColor('#0b0d10', 1)
    renderer.outputColorSpace = THREE.SRGBColorSpace

    const fallbackScene = new THREE.Scene()
    const fallbackCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10)
    fallbackCamera.position.z = 1
    const fallbackGeometry = new THREE.PlaneGeometry(2, 2)
    const openingMaterial = new THREE.MeshBasicMaterial({ map: loadTexture('/assets/scenes/elbe-front.webp', () => updateLoadState('openingImage', 1)), transparent: true })
    const ruinsMaterial = new THREE.MeshBasicMaterial({ map: loadTexture('/assets/scenes/war-ruins.webp', () => updateLoadState('ruinsImage', 1)), transparent: true, opacity: 0 })
    const openingPlane = new THREE.Mesh(fallbackGeometry, openingMaterial)
    const ruinsPlane = new THREE.Mesh(fallbackGeometry, ruinsMaterial)
    fallbackScene.add(openingPlane, ruinsPlane)

    const splatCamera = new THREE.PerspectiveCamera(SHARP_VERTICAL_FOV, 1, 0.01, 500)
    splatCamera.up.set(0, -1, 0)
    splatCamera.position.set(0, 0, 0)
    splatCamera.lookAt(0, 0, 1)
    const openingSplatScene = new THREE.Scene()
    const ruinsSplatScene = new THREE.Scene()

    const modelScene = new THREE.Scene()
    const modelCamera = new THREE.PerspectiveCamera(32, 1, 0.01, 100)
    modelCamera.position.set(0, 0, sphereBaseDistance)
    modelCamera.lookAt(0, 0, 0)
    modelScene.add(new THREE.HemisphereLight('#f4c3cb', '#16060b', 2.1))
    const key = new THREE.DirectionalLight('#ffe6e8', 4.2)
    key.position.set(-2.8, 4.5, 5)
    modelScene.add(key)
    const rim = new THREE.DirectionalLight('#e52c59', 3.4)
    rim.position.set(4, -1, -3)
    modelScene.add(rim)

    const loader = new GLTFLoader()
    loader.load('/assets/models/bleeding-sphere.glb', (gltf) => {
      if (disposed) return
      const group = new THREE.Group()
      group.add(gltf.scene)
      const box = new THREE.Box3().setFromObject(gltf.scene)
      const center = box.getCenter(new THREE.Vector3())
      const size = box.getSize(new THREE.Vector3())
      gltf.scene.position.sub(center)
      const maximumSize = Math.max(size.x, size.y, size.z, 0.001)
      const normalizedScale = 2.35 / maximumSize
      gltf.scene.scale.setScalar(normalizedScale)
      sphereRadius = maximumSize * normalizedScale / 2
      sphereRoot = group
      modelScene.add(group)
      sphereBaseDistance = fitCameraDistance(sphereRadius, modelCamera.fov, modelCamera.aspect, 1.35)
      modelCamera.position.z = sphereBaseDistance
      updateLoadState('model', 1)
    }, (event) => {
      if (event.total > 0) updateLoadState('model', Math.min(0.98, event.loaded / event.total))
    }, () => updateLoadState('model', 1))

    const createSplatViewer = async (targetScene: THREE.Scene) => {
      const { DropInViewer } = await import('@mkkellogg/gaussian-splats-3d')
      if (disposed) return null
      const viewer = new DropInViewer({
        sharedMemoryForWorkers: false,
        gpuAcceleratedSort: false,
        halfPrecisionCovariancesOnGPU: true,
        inMemoryCompressionLevel: 1,
        dynamicScene: false,
        enableOptionalEffects: false,
        freeIntermediateSplatData: true,
      })
      targetScene.add(viewer)
      return viewer
    }

    const loadOpeningSplat = async () => {
      let viewer: GaussianViewer | null = null
      let operation: ReturnType<GaussianViewer['addSplatScene']> | null = null
      try {
        viewer = await createSplatViewer(openingSplatScene)
        if (!viewer) return
        openingViewer = viewer
        operation = viewer.addSplatScene('/assets/scenes/elbe-front.ksplat', {
          showLoadingUI: false,
          progressiveLoad: true,
          onProgress: (percent) => updateLoadState('openingSplat', percent / 100),
        })
        await withTimeout(toNativePromise(operation), 25_000, 'Opening Gaussian scene timed out')
        if (disposed) {
          await viewer.dispose()
          return
        }
        updateLoadState('openingSplat', 1)
      } catch (error) {
        operation?.abort(error)
        if (viewer) {
          openingViewer = null
          if (!disposed) openingSplatScene.remove(viewer)
          void viewer.dispose().catch(() => undefined)
        }
        updateLoadState('openingSplat', 1)
        console.error('Gaussian scene failed to load', error)
      }
    }

    const loadRuinsSplat = async () => {
      if (!useSplats || ruinsLoadStarted || disposed) return
      ruinsLoadStarted = true
      let viewer: GaussianViewer | null = null
      let operation: ReturnType<GaussianViewer['addSplatScene']> | null = null
      try {
        viewer = await createSplatViewer(ruinsSplatScene)
        if (!viewer) return
        ruinsViewer = viewer
        operation = viewer.addSplatScene('/assets/scenes/war-ruins.ksplat', {
          showLoadingUI: false,
          progressiveLoad: true,
          onProgress: (percent) => updateLoadState('ruinsSplat', percent / 100),
        })
        await withTimeout(toNativePromise(operation), 25_000, 'Ruins Gaussian scene timed out')
        if (disposed) {
          await viewer.dispose()
          return
        }
        updateLoadState('ruinsSplat', 1)
      } catch (error) {
        operation?.abort(error)
        if (viewer) {
          ruinsViewer = null
          if (!disposed) ruinsSplatScene.remove(viewer)
          void viewer.dispose().catch(() => undefined)
        }
        updateLoadState('ruinsSplat', 1)
        console.error('Gaussian scene failed to load', error)
      }
    }

    if (useSplats) {
      void loadOpeningSplat()
      void loadRuinsSplat()
    }

    const onPointerMove = (event: PointerEvent) => {
      pointerTarget.set(
        (event.clientX / Math.max(1, window.innerWidth) - 0.5) * 2,
        (event.clientY / Math.max(1, window.innerHeight) - 0.5) * 2,
      )
    }
    const onPointerLeave = () => pointerTarget.set(0, 0)
    window.addEventListener('pointermove', onPointerMove, { passive: true })
    document.documentElement.addEventListener('pointerleave', onPointerLeave)

    const resize = () => {
      const width = Math.max(1, root.clientWidth)
      const height = Math.max(1, root.clientHeight)
      const aspect = width / height
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, width < 800 ? 1.15 : 1.5))
      renderer.setSize(width, height, false)
      fallbackCamera.left = -aspect
      fallbackCamera.right = aspect
      fallbackCamera.top = 1
      fallbackCamera.bottom = -1
      fallbackCamera.updateProjectionMatrix()
      const coverScale = Math.max(1, aspect / IMAGE_ASPECT)
      openingPlane.scale.set(IMAGE_ASPECT * coverScale, coverScale, 1)
      ruinsPlane.scale.copy(openingPlane.scale)
      splatCamera.aspect = aspect
      splatCamera.updateProjectionMatrix()
      modelCamera.aspect = aspect
      sphereBaseDistance = fitCameraDistance(sphereRadius, modelCamera.fov, aspect, 1.35)
      modelCamera.position.z = sphereBaseDistance
      modelCamera.updateProjectionMatrix()
    }
    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(root)
    resize()

    const render = () => {
      if (disposed) return
      const p = progressRef.current
      const showingRuins = sceneRef.current === 'ruins'
      const sceneBlend = Math.min(1, Math.max(0, (p - 0.67) / 0.12))
      pointerCurrent.lerp(pointerTarget, 0.045)

      openingMaterial.opacity = 1 - sceneBlend
      ruinsMaterial.opacity = sceneBlend
      openingPlane.position.x = pointerCurrent.x * -0.012
      openingPlane.position.y = p * 0.025 + pointerCurrent.y * 0.008
      ruinsPlane.position.x = pointerCurrent.x * -0.01
      ruinsPlane.position.y = -(p - 0.67) * 0.04 + pointerCurrent.y * 0.006

      const sceneDrift = showingRuins ? Math.min(1, Math.max(0, (p - 0.72) / 0.28)) : Math.min(1, p / 0.5)
      splatCamera.position.x = pointerCurrent.x * 0.12
      splatCamera.position.y = pointerCurrent.y * 0.075 - (showingRuins ? sceneDrift * 0.09 : sceneDrift * 0.03)
      splatCamera.position.z = showingRuins ? sceneDrift * 0.16 : sceneDrift * 0.09
      splatCamera.lookAt(pointerCurrent.x * 0.035, pointerCurrent.y * 0.02, 1)

      if (sphereRoot) {
        const ascent = Math.min(1, Math.max(0, (p - 0.04) / 0.34))
        const impact = Math.min(1, Math.max(0, (p - 0.42) / 0.12))
        const now = performance.now()
        const deltaSeconds = Math.min(1 / 30, Math.max(0, (now - lastJitterFrameAt) / 1000))
        lastJitterFrameAt = now
        if (!reducedMotion && now >= nextJitterAt) {
          jitterCount += 1
          if (jitterCount % 4 === 0) {
            jitterTarget.set(0, 0, 0)
            positionJitterTarget.set(0, 0, 0)
          } else {
            const randomAngle = () => THREE.MathUtils.degToRad(Math.random() * 1.8 - 0.9)
            const randomPosition = () => Math.random() * 0.018 - 0.009
            jitterTarget.set(randomAngle(), randomAngle(), randomAngle())
            positionJitterTarget.set(randomPosition(), randomPosition(), randomPosition())
          }
          nextJitterAt = now + 35 + Math.random() * 85
        }
        stepJitterSpring(jitterCurrent, jitterTarget, jitterVelocity, jitterAcceleration, deltaSeconds)
        stepJitterSpring(positionJitterCurrent, positionJitterTarget, positionJitterVelocity, positionJitterAcceleration, deltaSeconds)
        sphereRoot.position.x = positionJitterCurrent.x
        sphereRoot.position.y = initialSphereY + ascent * 2.05 - impact * impactVerticalTravel + positionJitterCurrent.y
        sphereRoot.position.z = -ascent * 1.4 + impact * impactCameraTravel + positionJitterCurrent.z
        sphereRoot.scale.setScalar((1 - ascent * 0.62 + impact * impactScaleGain) * sphereVisualScale)
        sphereRoot.rotation.set(
          initialSpherePitch - Math.min(1, Math.max(0, (p - 0.18) / 0.24)) * 0.52 + jitterCurrent.x,
          initialSphereYaw + jitterCurrent.y,
          jitterCurrent.z,
        )
        sphereRoot.visible = p < 0.6
      }

      renderer.autoClear = false
      renderer.clear(true, true, true)
      renderer.render(fallbackScene, fallbackCamera)
      if (useSplats && sceneBlend < 1 && openingViewer) {
        renderer.clearDepth()
        renderer.render(openingSplatScene, splatCamera)
      }
      if (useSplats && sceneBlend > 0 && ruinsViewer) {
        renderer.clearDepth()
        renderer.render(ruinsSplatScene, splatCamera)
      }
      renderer.clearDepth()
      renderer.render(modelScene, modelCamera)
      frame = requestAnimationFrame(render)
    }
    render()

    return () => {
      disposed = true
      cancelAnimationFrame(frame)
      resizeObserver.disconnect()
      window.removeEventListener('pointermove', onPointerMove)
      document.documentElement.removeEventListener('pointerleave', onPointerLeave)
      openingMaterial.map?.dispose()
      ruinsMaterial.map?.dispose()
      openingMaterial.dispose()
      ruinsMaterial.dispose()
      fallbackGeometry.dispose()
      if (openingViewer) void openingViewer.dispose().catch(() => undefined)
      if (ruinsViewer) void ruinsViewer.dispose().catch(() => undefined)
      modelScene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry?.dispose()
          const materials = Array.isArray(object.material) ? object.material : [object.material]
          materials.forEach((material) => material.dispose())
        }
      })
      renderer.dispose()
    }
  }, [onLoadProgress, onReady])

  return (
    <div ref={rootRef} className="scene-backdrop">
      <canvas ref={canvasRef} aria-label={ariaLabel} />
    </div>
  )
}
