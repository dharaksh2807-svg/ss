import * as THREE from 'three';
import { disposeObjectResources } from '../scene/ResourceDisposal';

export class SceneryPool {
  private static instance: SceneryPool;
  private groupPool: THREE.Group[] = [];
  private borrowedGroups = new WeakSet<THREE.Group>();
  private activeObjectCount: number = 0;
  private activeMeshCount: number = 0;

  public static getInstance(): SceneryPool {
    if (!SceneryPool.instance) {
      SceneryPool.instance = new SceneryPool();
    }
    return SceneryPool.instance;
  }

  public obtainGroup(): THREE.Group {
    let group = this.groupPool.pop();
    if (!group) {
      group = new THREE.Group();
    } else {
      group.clear();
      group.position.set(0, 0, 0);
      group.rotation.set(0, 0, 0);
      group.scale.set(1, 1, 1);
      group.visible = true;
    }
    this.borrowedGroups.add(group);
    return group;
  }

  public releaseGroup(group: THREE.Group): void {
    while (group.children.length > 0) {
      const child = group.children[0];
      group.remove(child);
      if (child instanceof THREE.Group) {
        this.releaseGroup(child);
      }
    }
    // Only retain groups obtained from this pool. Factory-created groups have
    // no consumer here and would otherwise accumulate on every chunk recycle.
    if (this.borrowedGroups.delete(group)) this.groupPool.push(group);
  }

  /**
   * Clears scenery, optionally releasing factory-owned resources while keeping
   * the supplied shared material cache (and its textures) alive.
   */
  public clearDecorativeGroup(decorativeGroup: THREE.Group, sharedMaterials?: ReadonlySet<THREE.Material>): void {
    let meshesRemoved = 0;
    decorativeGroup.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        meshesRemoved++;
      }
    });
    if (sharedMaterials) disposeObjectResources(decorativeGroup, sharedMaterials);

    while (decorativeGroup.children.length > 0) {
      const child = decorativeGroup.children[0];
      decorativeGroup.remove(child);
      if (child instanceof THREE.Group) {
        this.releaseGroup(child);
      }
    }

    this.activeMeshCount = Math.max(0, this.activeMeshCount - meshesRemoved);
  }

  public recordMeshesAdded(count: number): void {
    this.activeMeshCount += count;
  }

  public getActiveMeshCount(): number {
    return this.activeMeshCount;
  }

  public getActiveObjectCount(): number {
    return this.activeObjectCount;
  }
}
