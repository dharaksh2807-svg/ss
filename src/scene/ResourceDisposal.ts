import * as THREE from 'three';

export type RenderResource = THREE.BufferGeometry | THREE.Material;

/** Dispose unique instance resources; cached materials/geometries and textures stay alive. */
export function disposeObjectResources(root: THREE.Object3D, shared: ReadonlySet<RenderResource>): void {
  const owned = new Set<RenderResource>();
  root.traverse(object => {
    if (!(object as THREE.Mesh).isMesh) return;
    const mesh = object as THREE.Mesh;
    if (!shared.has(mesh.geometry)) owned.add(mesh.geometry);
    for (const material of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) {
      if (!shared.has(material)) owned.add(material);
    }
  });
  for (const resource of owned) resource.dispose();
}

/** Snapshot resources retained directly by a factory, including its material arrays. */
export function captureSharedResources(factory: object): Set<RenderResource> {
  return new Set(Object.values(factory).flat().filter((value): value is RenderResource =>
    value instanceof THREE.BufferGeometry || value instanceof THREE.Material));
}
