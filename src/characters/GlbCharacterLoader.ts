import * as THREE from 'three';
import { GLTFLoader, GLTF } from 'three/addons/loaders/GLTFLoader.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';

export interface LoadedGlbCharacter {
  scene: THREE.Group;
  mixer: THREE.AnimationMixer;
  actions: Map<string, THREE.AnimationAction>;
  clips: THREE.AnimationClip[];
  activeActionName: string | null;
}

export class GlbCharacterLoader {
  private static instance: GlbCharacterLoader;
  private loader: GLTFLoader;
  private cache: Map<string, GLTF> = new Map();
  private pendingLoads: Map<string, Promise<GLTF>> = new Map();

  private constructor() {
    this.loader = new GLTFLoader();
  }

  public static getInstance(): GlbCharacterLoader {
    if (!GlbCharacterLoader.instance) {
      GlbCharacterLoader.instance = new GlbCharacterLoader();
    }
    return GlbCharacterLoader.instance;
  }

  /**
   * Preload a GLB asset into memory cache
   */
  public async preload(url: string): Promise<GLTF> {
    if (this.cache.has(url)) {
      return this.cache.get(url)!;
    }
    if (this.pendingLoads.has(url)) {
      return this.pendingLoads.get(url)!;
    }

    const promise = new Promise<GLTF>((resolve, reject) => {
      this.loader.load(
        url,
        (gltf) => {
          this.cache.set(url, gltf);
          this.pendingLoads.delete(url);
          resolve(gltf);
        },
        undefined,
        (error) => {
          this.pendingLoads.delete(url);
          reject(error);
        }
      );
    });

    this.pendingLoads.set(url, promise);
    return promise;
  }

  /**
   * Instantiate an animated clone of the GLB character with proper scaling, shadows, and mixer
   */
  public async instantiate(url: string, targetHeightMeters: number = 1.93): Promise<LoadedGlbCharacter> {
    const gltf = await this.preload(url);

    // Clone character scene hierarchy cleanly with preserved bone skinning
    const clonedScene = SkeletonUtils.clone(gltf.scene) as THREE.Group;

    // Enable shadows on all skinned meshes and standard materials
    clonedScene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    // Compute native bounding height to apply authoritative game scale
    const box = new THREE.Box3().setFromObject(clonedScene);
    const nativeHeight = box.max.y - box.min.y;
    const uniformScale = nativeHeight > 0.1 ? targetHeightMeters / nativeHeight : 0.88;

    clonedScene.scale.set(uniformScale, uniformScale, uniformScale);
    // Align ground contact: shift bottom to Y = 0
    clonedScene.position.set(0, -box.min.y * uniformScale, 0);
    // Face forward along -Z (run direction in Metro Runner 3D)
    clonedScene.rotation.y = Math.PI;

    // Build AnimationMixer with all available clips
    const mixer = new THREE.AnimationMixer(clonedScene);
    const actions = new Map<string, THREE.AnimationAction>();

    gltf.animations.forEach((clip) => {
      const action = mixer.clipAction(clip);
      actions.set(clip.name, action);
    });

    return {
      scene: clonedScene,
      mixer,
      actions,
      clips: gltf.animations,
      activeActionName: null
    };
  }

  /**
   * Synchronous check if GLTF is already cached
   */
  public hasCached(url: string): boolean {
    return this.cache.has(url);
  }
}
