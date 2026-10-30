import * as THREE from 'three';
import { CONSTANTS } from '../core/Constants';

export class CurvedShaderManager {
  private static instance: CurvedShaderManager;
  public uBend: THREE.Vector2 = new THREE.Vector2(CONSTANTS.CURVE_X, CONSTANTS.CURVE_Y);

  public static getInstance(): CurvedShaderManager {
    if (!CurvedShaderManager.instance) {
      CurvedShaderManager.instance = new CurvedShaderManager();
    }
    return CurvedShaderManager.instance;
  }

  /**
   * Modifies a standard Three.js material to bend vertices dynamically in view space.
   */
  public applyCurvature(material: THREE.Material): THREE.Material {
    material.customProgramCacheKey = () => 'curved_shader';
    material.onBeforeCompile = (shader) => {
      shader.uniforms.uBend = { value: this.uBend };

      shader.vertexShader = `
        uniform vec2 uBend;
      ` + shader.vertexShader;

      shader.vertexShader = shader.vertexShader.replace(
        '#include <project_vertex>',
        `
        vec4 mvPosition = vec4( transformed, 1.0 );
        #ifdef USE_INSTANCING
          mvPosition = instanceMatrix * mvPosition;
        #endif
        mvPosition = modelViewMatrix * mvPosition;

        // Apply curvature as a function of distance along negative Z in view space
        float zDist = max(0.0, -mvPosition.z);
        float zSqr = zDist * zDist;
        mvPosition.y += zSqr * uBend.y;
        mvPosition.x += zSqr * uBend.x;

        gl_Position = projectionMatrix * mvPosition;
        `
      );
    };

    return material;
  }

  public setCurvature(x: number, y: number): void {
    this.uBend.set(x, y);
  }
}
