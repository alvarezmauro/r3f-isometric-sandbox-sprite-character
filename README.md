# React Three Fiber Isometric Sandbox

An educational third-person scene built with [React Three Fiber](https://github.com/pmndrs/react-three-fiber), [drei](https://github.com/pmndrs/drei) helpers and the [`bvhecctrl`](https://github.com/pmndrs/ecctrl) character controller. The project is intentionally documented and structured so that artists, designers or developers unfamiliar with Three.js can understand how each piece fits together.

## ✨ Highlights

- **Readable structure** – scene, components, hooks and constants live in dedicated folders with inline comments explaining their responsibilities.
- **Third-person controller** – `bvhecctrl` handles player movement, collisions and physics for complex GLTF levels.
- **Instant iteration** – Leva-powered debug panel to reset the character and tweak future parameters.
- **Production-ready lighting** – environment map and directional light configured for soft shadows.

## 🚀 Getting started

### Prerequisites

- Node.js 18+
- npm 9+

### Installation

```bash
npm install
```

### Development server

```bash
npm start
```

The app opens at http://localhost:3000. Changes in `src/` hot-reload automatically.

### Production build

```bash
npm run build
```

The optimized assets are emitted into `build/`.

## 🎮 Controls

| Action    | Keys                    |
|-----------|------------------------|
| Move      | `W`/`A`/`S`/`D` or Arrow keys |
| Run       | `Shift`                |
| Jump      | `Space`                |

The mapping lives in [`src/constants/keyboardControls.ts`](src/constants/keyboardControls.ts) so you can adjust it or expose it through your own UI.

## 🗂️ Project structure

```
src/
├── App.tsx                          # Minimal wrapper around the scene component
├── components/
│   ├── camera/
│   ├── character/
│   │   └── GhostCharacterModel.tsx  # Player avatar with GLTF loading comments
│   ├── environment/
│   │   └── LightingEnvironment.tsx  # Directional light + HDR background
│   └── world/
│       └── CozyTavernMap.tsx        # Level geometry and collider setup
├── constants/
│   └── keyboardControls.ts          # Shared keyboard mapping definition
├── hooks/
│   └── useFollowCamera.ts           # Keeps the camera glued to the character
├── scenes/
│   └── IsometricSandboxScene.tsx    # Main R3F scene wiring everything together
├── index.tsx                        # React entry point that mounts the R3F canvas
└── styles.css                       # Global layout and overlay styling
```

Every file contains detailed comments describing how the related library works and why the configuration was chosen.

## 🧠 Key concepts

- **React Three Fiber (R3F)** – Declarative React renderer for Three.js. Instead of writing imperative WebGL code, you compose JSX elements.
- **drei** – Utility components for R3F (e.g. `CameraControls`, `Environment`, `Bvh`). They reduce boilerplate and encapsulate common Three.js patterns.
- **Leva** – Drop-in panel for sliders, toggles and buttons used for debugging or exposing parameters.
- **bvhecctrl** – Third-person controller built on top of a bounding volume hierarchy (BVH) which allows precise collision detection against complex meshes.

## 🧩 Extending the sandbox

- Swap the avatar by replacing `GhostCharacterModel` with your own GLTF and adjusting the scale.
- Update `LightingEnvironment` to experiment with different HDRI presets or add additional lights for accenting areas of the map.
- Add your own UI overlay by extending `styles.css` – the CSS already demonstrates how to anchor elements on top of the full-screen canvas.
- Use the `useFollowCamera` hook for other actors or cinematic sequences by providing a different Three.js group to follow.

## 📚 Further reading

- [React Three Fiber documentation](https://docs.pmnd.rs/react-three-fiber)
- [Three.js fundamentals](https://threejs.org/docs/index.html#manual/en/introduction/Creating-a-scene)
- [Leva controls](https://github.com/pmndrs/leva)
- [BVH character controller demo](https://ecctrl.pmnd.rs/)

Have fun exploring and customising the scene!
