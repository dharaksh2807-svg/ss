import * as THREE from 'three';

export type RenderResource = THREE.BufferGeometry | THREE.Material;

/** Dispose unique instance resources; cached materials/geometries and textures stay alive. */
export function disposeObjectResources(root: THREE.Object3D, shared: ReadonlySet<RenderResource>): void {
  const owned = new Set<RenderResource>();
  root.traverse(object => {
    const renderable = object as { geometry?: THREE.BufferGeometry; material?: THREE.Material | THREE.Material[] };
    if (renderable.geometry && !shared.has(renderable.geometry)) {
      owned.add(renderable.geometry);
    }
    if (renderable.material) {
      const mats = Array.isArray(renderable.material) ? renderable.material : [renderable.material];
      for (const material of mats) {
        if (material && !shared.has(material)) {
          owned.add(material);
        }
      }
    }
  });
  for (const resource of owned) resource.dispose();
}

/** Snapshot resources retained directly by a factory, including its material arrays. */
export function captureSharedResources(factory: object): Set<RenderResource> {
  const resources = Object.values(factory).flat().filter((value): value is RenderResource =>
    value instanceof THREE.BufferGeometry || value instanceof THREE.Material);
  for (const res of resources) {
    if (res.userData) {
      res.userData.isShared = true;
    }
  }
  return new Set(resources);
}

