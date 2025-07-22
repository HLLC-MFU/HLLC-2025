import {
    Scene,
    PerspectiveCamera,
    AmbientLight,
    DirectionalLight,
    Box3,
    Vector3,
    AnimationMixer,
    Clock,
    Mesh,
    Material,
    MeshStandardMaterial,
    Object3DEventMap,
    Group,
} from "three";
import ExpoTHREE, { Renderer, THREE } from "expo-three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { ExpoWebGLRenderingContext } from "expo-gl";
import { User } from "@/types/user";
import { RefObject } from "react";
import { tr } from "date-fns/locale";

if (__DEV__) {
    const originalLog = console.log;
    const originalError = console.error;
    console.log = (msg, ...args) => {
        if (
            typeof msg === 'string' &&
            (
                msg.includes("gl.pixelStorei() doesn't support this parameter") ||
                msg.includes("THREE.WebGLRenderer: EXT_color_buffer_float extension not supported")
            )
        ) {
            return;
        }
        originalLog(msg, ...args);
    };
    console.error = (msg, ...args) => {
        if (
            typeof msg === 'string' &&
            (
                msg.includes("THREE.GLTFLoader: Couldn't load texture")
            )
        ) {
            return;
        }
        originalError(msg, ...args);
    };
}

export async function onContextCreate(
    gl: ExpoWebGLRenderingContext,
    user: User | null,
    setLoading: (value: boolean) => void,
    // changeCharacterScene:  RefObject<Group<Object3DEventMap> | null>,
    // baseSceneRef:  RefObject<Group<Object3DEventMap> | null>,
    modelRef: RefObject<Group<Object3DEventMap> | null>,
) {
    const scene = new Scene();
    const group = new Group();

    // Camera
    const camera = new PerspectiveCamera(
        30,
        gl.drawingBufferWidth / gl.drawingBufferHeight,
        0.01,
        1000
    );
    camera.position.set(0, 0, 10);

    const renderer = new Renderer({ gl });
    renderer.setSize(gl.drawingBufferWidth, gl.drawingBufferHeight);
    renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
    renderer.toneMapping = THREE.LinearToneMapping;
    renderer.toneMappingExposure = 1.00;
    renderer.shadowMap.autoUpdate = true;
    renderer.shadowMap.needsUpdate = true;
    renderer.shadowMap.autoUpdate = false;
    renderer.shadowMap.enabled = false;

    //   const controls = new OrbitControls(camera, renderer.domElement);
    //   controlsRef.current = controls;

    // Lights
    scene.add(new AmbientLight(0xffffff, 2));
    const dirLight = new DirectionalLight(0xffecec, 1.5);
    dirLight.position.set(0, 0, 5);
    dirLight.castShadow = false;
    // const fillLight = new PointLight(0xffffff, 0.5);
    // fillLight.position.set(-5, 3, 5);
    // scene.add(fillLight);

    scene.add(dirLight);
    scene.position.y += 0.6;

    try {
        const acronym = user?.data?.[0]?.metadata?.major?.school?.acronym.toUpperCase() ?? "DENT";
        const loader = new GLTFLoader();

        const character = await loader.loadAsync(`${process.env.EXPO_PUBLIC_API_URL}/uploads/models/${acronym}.glb`);
        const base = await loader.loadAsync(
            `${process.env.EXPO_PUBLIC_API_URL}/uploads/models/BASE.glb`
        );

        const characterScene = character.scene;
        characterScene.scale.set(0.5, 0.5, 0.5);

        const baseScene = base.scene;
        baseScene.scale.set(0.7, 0.7, 0.7);
        baseScene.position.set(-0.45, -8, 1);

        // changeCharacterScene.current = characterScene;
        // baseSceneRef.current = baseScene;
        modelRef.current = group;

        // Textures;
        characterScene.traverse(async (child) => {
            if (child instanceof Mesh) {
                const childName = (child.material as Material).name;
                const textureUrl = `${process.env.EXPO_PUBLIC_API_URL}/uploads/${acronym.toLowerCase()}/${childName}.png`;

                const texture = await ExpoTHREE.loadAsync({ uri: textureUrl });
                texture.flipY = false;
                texture.needsUpdate = true;
                child.material = new MeshStandardMaterial({
                    map: texture,
                    metalness: 0,
                    roughness: 0.5,
                });
            }
        });
        baseScene.traverse(async (child) => {
            if (child instanceof Mesh) {
                const childName = (child.material as Material).name;
                const textureUrl = `${process.env.EXPO_PUBLIC_API_URL}/uploads/platform/${childName}.png`;

                const texture = await ExpoTHREE.loadAsync({ uri: textureUrl });
                texture.flipY = false;
                texture.needsUpdate = true;
                child.material = new MeshStandardMaterial({ map: texture });
            }
        });

        // Animation
        const animation = character.animations;
        const mixer = new AnimationMixer(characterScene);

        if (animation.length > 0 && acronym) {
            const animations = acronym.toUpperCase() === "LAW"
                ? animation[animation.length - 5]
                : acronym.toUpperCase() === "MED"
                    ? animation[0]
                    : animation[animation.length - 1];
            const action = mixer.clipAction(animations);
            action.play();
        }

        // Center model
        const box = new Box3().setFromObject(characterScene);
        const center = new Vector3(0, -1, 0);
        box.getCenter(center);
        characterScene.position.sub(center);

        // scene.add(characterScene);
        // scene.add(baseScene);
        scene.add(group);
        setLoading(false);

        const clock = new Clock();

        const render = () => {
            requestAnimationFrame(render);

            const delta = clock.getDelta();
            mixer.update(delta);
            renderer.render(scene, camera);
            gl.endFrameEXP();
        };

        render();
    } catch (error) {
        setLoading(false);
        console.error("GLTF load failed:", error);
    }
}
