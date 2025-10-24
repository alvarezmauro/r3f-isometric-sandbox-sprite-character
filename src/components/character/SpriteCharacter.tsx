// ============================================================================
// IMPORTS
// ============================================================================

// React Three Fiber (R3F) hooks:
// - useFrame: Runs on every frame render (like a game loop), receives delta time
// - useThree: Provides access to the Three.js scene, camera, renderer, etc.
import { useFrame, useThree } from "@react-three/fiber";

// React Three Drei helpers:
// - useTexture: Loads and manages texture images for 3D materials
import { useTexture } from "@react-three/drei";

// React hooks:
// - useMemo: Caches expensive computations to avoid re-running on every render
// - useRef: Creates a mutable reference that persists across renders without causing re-renders
import { useMemo, useRef } from "react";

// Three.js core imports:
// - DoubleSide: Makes material visible from both front and back faces
// - Mesh: A 3D object that combines geometry and material
// - NearestFilter: Texture filtering for pixel-perfect sprite rendering (no blur)
// - RepeatWrapping: Allows texture coordinates to repeat/wrap
// - Vector2: 2D vector for texture offsets and scaling
// - Vector3: 3D vector for positions and directions
import {
  DoubleSide,
  Mesh,
  NearestFilter,
  RepeatWrapping,
  Vector2,
  Vector3,
} from "three";

// Custom imports from the character control library:
// - characterStatus: Global state containing character movement data
// - useAnimationStore: Zustand store for animation state management
// - CharacterAnimationStatus: Type for animation states (IDLE, WALK, RUN, etc.)
import {
  characterStatus,
  useAnimationStore,
  type CharacterAnimationStatus,
} from "bvhecctrl";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

// Four cardinal directions the character can face in isometric view
type FacingDirection = "south" | "west" | "east" | "north";

// Defines a single animation sequence within the sprite sheet
// - frames: Array of frame indices to play in order (0-11 for 12 columns)
// - fps: Frames per second - how fast the animation plays
// - loop: Whether to repeat the animation or stop at the last frame
type AnimationSequence = {
  frames: number[];
  fps: number;
  loop: boolean;
};

// Maps each direction to its sprite sheet row and available animation sequences
// - row: Which row in the sprite sheet (0-11 for 12 rows, currently using 0-2)
// - sequences: Maps animation states to their frame sequences
//   IDLE is required, others are optional and fall back to IDLE if missing
type SpriteDefinition = {
  row: number;
  sequences: Partial<Record<CharacterAnimationStatus, AnimationSequence>> & {
    IDLE: AnimationSequence;
  };
};

// ============================================================================
// SPRITE SHEET CONFIGURATION
// ============================================================================

// Sprite sheet layout: 12 columns × 12 rows (144 total frames)
// Currently using only the first 3 rows:
// - Row 0: North and South facing animations
// - Row 1: East facing animations
// - Row 2: West facing animations
const SPRITE_COLUMNS = 12;
const SPRITE_ROWS = 12;

// Calculate the size of a single sprite in UV coordinates (0-1 range)
// UV coordinates map textures to 3D geometry (U=horizontal, V=vertical)
// 1/12 = 0.0833... means each sprite takes up ~8.33% of the texture width/height
const SPRITE_SIZE = new Vector2(1 / SPRITE_COLUMNS, 1 / SPRITE_ROWS);

// ============================================================================
// ANIMATION DEFINITIONS
// ============================================================================

// Complete sprite sheet mapping for all directions and animation states
// Each direction uses specific rows in the 12x12 sprite sheet
// Frame numbers refer to column positions (0-11) within each row
const SPRITE_MAP: Record<FacingDirection, SpriteDefinition> = {
  // South-facing (row 0): Character facing toward the camera
  south: {
    row: 0,
    sequences: {
      IDLE: { frames: [6, 7, 8], fps: 3, loop: true },
      WALK: { frames: [0, 1, 2, 3, 4, 5], fps: 10, loop: true },
      RUN: { frames: [0, 1, 2, 3, 4, 5], fps: 10, loop: true },
      JUMP_START: { frames: [7], fps: 1, loop: false },
      JUMP_IDLE: { frames: [7], fps: 1, loop: false },
      JUMP_FALL: { frames: [7], fps: 1, loop: false },
      JUMP_LAND: { frames: [7], fps: 1, loop: false },
    },
  },
  // North-facing (row 1): Character facing away from camera (shares row with south)
  north: {
    row: 1,
    sequences: {
      IDLE: { frames: [6, 7, 8], fps: 3, loop: true },
      WALK: { frames: [0, 1, 2, 3, 4, 5], fps: 10, loop: true },
      RUN: { frames: [0, 1, 2, 3, 4, 5], fps: 10, loop: true },
      JUMP_START: { frames: [7], fps: 1, loop: false },
      JUMP_IDLE: { frames: [7], fps: 1, loop: false },
      JUMP_FALL: { frames: [7], fps: 1, loop: false },
      JUMP_LAND: { frames: [7], fps: 1, loop: false },
    },
  },
  // West-facing (row 2): Character facing left
  west: {
    row: 2,
    sequences: {
      IDLE: { frames: [6, 7, 8], fps: 3, loop: true },
      WALK: { frames: [0, 1, 2, 3, 4, 5], fps: 10, loop: true },
      RUN: { frames: [0, 1, 2, 3, 4, 5], fps: 10, loop: true },
      JUMP_START: { frames: [7], fps: 1, loop: false },
      JUMP_IDLE: { frames: [7], fps: 1, loop: false },
      JUMP_FALL: { frames: [7], fps: 1, loop: false },
      JUMP_LAND: { frames: [7], fps: 1, loop: false },
    },
  },
  // East-facing (row 3): Character facing right
  east: {
    row: 3,
    sequences: {
      IDLE: { frames: [6, 7, 8], fps: 3, loop: true },
      WALK: { frames: [0, 1, 2, 3, 4, 5], fps: 10, loop: true },
      RUN: { frames: [0, 1, 2, 3, 4, 5], fps: 10, loop: true },
      JUMP_START: { frames: [7], fps: 1, loop: false },
      JUMP_IDLE: { frames: [7], fps: 1, loop: false },
      JUMP_FALL: { frames: [7], fps: 1, loop: false },
      JUMP_LAND: { frames: [7], fps: 1, loop: false },
    },
  },
};

// ============================================================================
// HELPER CONSTANTS & VECTORS
// ============================================================================

// Pre-defined world direction vectors (reused for performance)
// In 3D space: X=right/left, Y=up/down, Z=forward/back
const WORLD_FORWARD = new Vector3(0, 0, 1); // Positive Z axis (toward camera)
const WORLD_RIGHT = new Vector3(1, 0, 0);   // Positive X axis (character's right)

// Scratch vector reused for calculations to avoid creating new objects
// (reduces garbage collection and improves performance)
const scratch = new Vector3();

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Determines which direction the character should face based on movement vector
 * Uses dot product to project movement onto world axes
 * 
 * @param movingDir - Normalized direction vector of character movement
 * @returns The cardinal direction the character should face
 */
function resolveFacingDirection(movingDir: Vector3): FacingDirection {
  // If not moving (vector length is near zero), default to south
  // lengthSq() is faster than length() since it avoids sqrt calculation
  if (movingDir.lengthSq() < 1e-6) {
    return "south";
  }

  // Dot product projects movingDir onto world axes
  // Result is positive if vectors point same direction, negative if opposite
  const projectionForward = movingDir.dot(WORLD_FORWARD);
  const projectionRight = movingDir.dot(WORLD_RIGHT);

  // Choose direction based on which axis has stronger projection
  // This creates 4 quadrants for the 4 cardinal directions
  if (Math.abs(projectionRight) > Math.abs(projectionForward)) {
    // Horizontal movement is dominant
    return projectionRight > 0 ? "east" : "west";
  }

  // Vertical movement is dominant
  // Vertical movement is dominant
  return projectionForward > 0 ? "south" : "north";
}

/**
 * Retrieves the animation sequence for a given direction and status
 * Falls back to IDLE animation if the requested status doesn't exist
 * 
 * @param facing - Which direction the character is facing
 * @param status - Current animation state (IDLE, WALK, RUN, etc.)
 * @returns The animation sequence with frames, fps, and loop settings
 */
function getSequence(
  facing: FacingDirection,
  status: CharacterAnimationStatus
): AnimationSequence {
  const definition = SPRITE_MAP[facing];
  // Use nullish coalescing (??) to fall back to IDLE if status animation doesn't exist
  return (
    definition.sequences[status] ??
    definition.sequences.IDLE
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * SpriteCharacter Component
 * 
 * Renders an animated 2D sprite character in 3D space (billboard technique)
 * The sprite always faces the camera while playing frame-based animations
 * from a sprite sheet based on movement direction and animation state.
 * 
 * Key React Three Fiber concepts used:
 * - useFrame: Game loop that runs every frame for animation updates
 * - useThree: Access to Three.js camera for billboard rotation
 * - useTexture: Loads the sprite sheet image as a texture
 * - JSX syntax: <mesh>, <group>, etc. are R3F components that create Three.js objects
 */
export default function SpriteCharacter() {
  // =========================================================================
  // REFS & HOOKS
  // =========================================================================

  // Ref to the mesh object - allows direct access to the Three.js Mesh
  // Used for billboard effect (making sprite face camera)
  const meshRef = useRef<Mesh>(null);

  // Get the camera from the Three.js scene
  // Needed to calculate billboard rotation
  const { camera } = useThree();

  // Load the sprite sheet texture from public folder
  // useTexture handles async loading and returns a Three.js Texture object
  const texture = useTexture("./character/character.png");

  // Configure texture settings (runs once when texture loads)
  // useMemo prevents reconfiguration on every render
  useMemo(() => {
    // ClampToEdgeWrapping prevents texture bleeding between sprites
    // We don't need RepeatWrapping since we're manually offsetting
    texture.wrapS = RepeatWrapping;
    texture.wrapT = RepeatWrapping;

    // NearestFilter = no blur/interpolation between pixels
    // Essential for crisp pixel art sprites
    texture.magFilter = NearestFilter; // When zoomed in
    texture.minFilter = NearestFilter; // When zoomed out

    // Set texture repeat to show only one sprite frame at a time
    // This divides the texture into a 12x12 grid
    texture.repeat.set(1 / SPRITE_COLUMNS, 1 / SPRITE_ROWS); // 1/12, 1/12

    // Start at the first frame (row 0, column 0)
    texture.offset.set(0, 0);

    // Don't flip the texture - we'll handle row indexing in our offset calculation
    texture.flipY = false;

    // Tell Three.js to update the texture on GPU
    texture.needsUpdate = true;

    console.log('Texture configured:', {
      repeat: texture.repeat,
      offset: texture.offset,
      size: SPRITE_SIZE
    });
  }, [texture]); // Only run when texture changes

  // Get current animation status from global store (IDLE, WALK, RUN, etc.)
  // Zustand store automatically triggers re-render when this changes
  const animationStatus = useAnimationStore((state) => state.animationStatus);

  // =========================================================================
  // ANIMATION STATE (using refs to avoid triggering re-renders)
  // =========================================================================

  // Current facing direction - persists between frames
  const directionRef = useRef<FacingDirection>("south");

  // Accumulated time for frame timing
  const elapsedRef = useRef(0);

  // Current frame index within the animation sequence
  const frameIndexRef = useRef(0);

  // Track previous status to detect animation changes
  const previousStatusRef = useRef<CharacterAnimationStatus>(animationStatus);

  // =========================================================================
  // ANIMATION LOOP
  // =========================================================================

  // useFrame runs on every render frame (typically 60 times per second)
  // Parameters: (state, delta) where delta = time since last frame in seconds
  useFrame((_, delta) => {
    // ---------------------------------------------------------------------
    // 1. DETERMINE FACING DIRECTION
    // ---------------------------------------------------------------------

    // Use actual movement direction if moving, otherwise use input direction
    // This allows character to face input direction even when stationary
    const targetDirection =
      characterStatus.movingDir.lengthSq() > 1e-6
        ? characterStatus.movingDir
        : characterStatus.inputDir;

    // Only update facing direction if there's meaningful input
    if (targetDirection.lengthSq() > 1e-6) {
      directionRef.current = resolveFacingDirection(targetDirection);
    }

    // ---------------------------------------------------------------------
    // 2. HANDLE ANIMATION STATE CHANGES
    // ---------------------------------------------------------------------

    // When animation status changes (e.g., IDLE → WALK), reset the animation
    if (previousStatusRef.current !== animationStatus) {
      previousStatusRef.current = animationStatus;
      frameIndexRef.current = 0;  // Start from first frame
      elapsedRef.current = 0;     // Reset timer
    }

    // ---------------------------------------------------------------------
    // 3. GET CURRENT ANIMATION SEQUENCE
    // ---------------------------------------------------------------------

    // Retrieve the frame sequence for current direction and status
    const sequence = getSequence(directionRef.current, animationStatus);

    // ---------------------------------------------------------------------
    // 4. UPDATE ANIMATION FRAME
    // ---------------------------------------------------------------------

    // Handle static frames (single frame or zero fps)
    if (sequence.frames.length <= 1 || sequence.fps <= 0) {
      frameIndexRef.current = 0;
      elapsedRef.current = 0;
    } else {
      // Accumulate time since last frame
      elapsedRef.current += delta;

      // Calculate how long each frame should display (in seconds)
      const frameDuration = 1 / sequence.fps;

      // Advance frames based on elapsed time
      // Loop handles multiple frame advances if lag caused delta to be large
      while (elapsedRef.current >= frameDuration) {
        elapsedRef.current -= frameDuration; // Subtract one frame worth of time
        const nextIndex = frameIndexRef.current + 1;

        // Handle end of animation sequence
        if (nextIndex >= sequence.frames.length) {
          // Loop back to start if looping, otherwise stay on last frame
          frameIndexRef.current = sequence.loop ? 0 : sequence.frames.length - 1;
        } else {
          frameIndexRef.current = nextIndex;
        }
      }
    }

    // ---------------------------------------------------------------------
    // 5. UPDATE TEXTURE OFFSET TO SHOW CORRECT SPRITE
    // ---------------------------------------------------------------------

    // Get the column index (0-11) from the frame sequence
    const frameColumn = sequence.frames[frameIndexRef.current] % SPRITE_COLUMNS;

    // Get the row index (0-2) from the direction mapping
    const row = SPRITE_MAP[directionRef.current].row;

    // Update texture offset to display the correct sprite frame
    // UV coordinates: (0,0) = top-left when flipY=false
    // Calculate offset: column goes left-to-right, row goes top-to-bottom
    const offsetX = frameColumn / SPRITE_COLUMNS;
    const offsetY = row / SPRITE_ROWS;

    texture.offset.set(offsetX, offsetY);

    // Debug log (remove after testing)
    if (frameIndexRef.current === 0) {
      console.log('Animation frame:', {
        direction: directionRef.current,
        status: animationStatus,
        row,
        frameColumn,
        offset: { x: offsetX, y: offsetY }
      });
    }

    // ---------------------------------------------------------------------
    // 6. BILLBOARD EFFECT - Make sprite face camera
    // ---------------------------------------------------------------------

    if (meshRef.current) {
      // Get sprite's current world position
      const worldPosition = meshRef.current.getWorldPosition(scratch);

      // Rotate mesh to look at camera (only on XZ plane, keep Y upright)
      // This makes the 2D sprite always face the player like a billboard
      meshRef.current.lookAt(
        camera.position.x,      // Match camera X position
        worldPosition.y,        // Keep sprite's own Y (don't tilt up/down)
        camera.position.z       // Match camera Z position
      );
    }
  });

  // =========================================================================
  // JSX RENDER
  // =========================================================================

  // In R3F, JSX elements create Three.js objects:
  // <group> → THREE.Group (container for organizing objects)
  // <mesh> → THREE.Mesh (3D object with geometry + material)
  // <planeGeometry> → THREE.PlaneGeometry (flat rectangle)
  // <meshBasicMaterial> → THREE.MeshBasicMaterial (unlit material)

  return (
    // Group positions the sprite slightly below origin (adjust to ground level)
    <group position={[0, 0, 0]}>
      {/* Mesh holds the sprite plane */}
      <mesh
        ref={meshRef}           // Attach ref for billboard rotation
        scale={[1.5, -1.5, 1]}     // Larger scale to make sprite more visible
        castShadow                 // Enable shadow casting for this mesh
        receiveShadow={false}      // Sprites typically don't need to receive shadows
      >
        {/* PlaneGeometry creates a flat 1x1 square */}
        <planeGeometry args={[1, 1]} />

        {/* Material defines how the sprite is rendered */}
        {/* Using meshBasicMaterial for performance (unlit), but it can still cast shadows */}
        <meshBasicMaterial
          map={texture}              // Apply sprite sheet texture
          transparent                // Enable transparency for PNG alpha channel
          alphaTest={0.1}           // Pixels below this alpha value are discarded (important for shadow shape)
          side={DoubleSide}         // Render both front and back faces
          depthWrite={true}         // Enable depth writing for proper shadow casting
          color="white"             // Ensure no color tinting
        />
      </mesh>
    </group>
  );
}