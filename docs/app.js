import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x202020);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

scene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 1.2));
const dirLight = new THREE.DirectionalLight(0xffffff, 1);
dirLight.position.set(5, 10, 7);
scene.add(dirLight);
scene.add(new THREE.AmbientLight(0xffffff, 0.5));

const makeArrows = (size = 1) => {
  const group = new THREE.Group();

  const arrowSize = size;
  const headLength = 0.2 * size;
  const headWidth = 0.1 * size;

  const xArrow = new THREE.ArrowHelper(
    new THREE.Vector3(1, 0, 0),
    new THREE.Vector3(0, 0, 0),
    arrowSize,
    0xff0000,
    headLength, headWidth
  );

  const yArrow = new THREE.ArrowHelper(
    new THREE.Vector3(0, 1, 0),
    new THREE.Vector3(0, 0, 0),
    arrowSize,
    0x00ff00,
    headLength, headWidth
  );

  const zArrow = new THREE.ArrowHelper(
    new THREE.Vector3(0, 0, 1),
    new THREE.Vector3(0, 0, 0),
    arrowSize,
    0x0000ff,
    headLength, headWidth
  );

  group.add(xArrow, yArrow, zArrow);
  return group;
};
scene.add(makeArrows(0.5));

camera.position.set(0, 1, 3);

const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath("https://unpkg.com/three@0.180.0/examples/jsm/libs/draco/");
const loader = new GLTFLoader();
loader.setDRACOLoader(dracoLoader);

document.getElementById("fileInput").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const url = URL.createObjectURL(file);

  loader.load(
    url,
    (gltf) => {
      console.log("[INFO] Loaded:", gltf);
      scene.clear();
      scene.add(dirLight, makeArrows(0.5));
      scene.add(gltf.scene);
      fitCameraToObject(camera, gltf.scene, controls);
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    },
    (p) => {
      console.log(`[INFO] Loading ${(p.loaded / p.total * 100).toFixed(1)}%`)
    },
    (err) => {
      console.error("[Error] ", err);
      alert("[Error]\nFailed to load model. Please check the file format and contents.");
    }
  );
});

const fitCameraToObject = (camera, object, controls) => {
  const box = new THREE.Box3().setFromObject(object);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());

  if (size.length() < 0.0001) {
    console.warn("[WARN] Model too small, scaling up.");
    alert("[WARN]\nModel is too small, scaling up.");
    object.scale.set(100, 100, 100);
  }

  camera.position.copy(center).add(new THREE.Vector3(0, size.y * 2, size.z * 3));
  camera.lookAt(center);
  controls.target.copy(center);
  controls.update();
};

const animate = () => {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
};
animate();

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

const showVersion = (version) => {
  const div = document.createElement("div");
  div.textContent = `GLB Viewer: v${version}`;
  div.style.position = "fixed";
  div.style.bottom = "10px";
  div.style.right = "10px";
  div.style.backgroundColor = "rgba(0, 0, 0, 0.6)";
  div.style.color = "#fff";
  div.style.padding = "6px 12px";
  div.style.borderRadius = "8px";
  div.style.fontFamily = "Arial, sans-serif";
  div.style.fontSize = "14px";
  div.style.zIndex = "10000";
  document.body.appendChild(div);
}

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("service-worker.js").then(
    (registration) => {
      console.log("[INFO] ServiceWorker registration successful with scope: ", registration.scope);

      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({ type: "GET_VERSION" });
      } else {
        navigator.serviceWorker.addEventListener("controllerchange", () => {
          navigator.serviceWorker.controller.postMessage({ type: "GET_VERSION" });
        });
      }

      navigator.serviceWorker.addEventListener("message", (event) => {
        if (event.data && event.data.type === "VERSION") {
          showVersion(event.data.version);
        }
      });
    },
    (err) => {
      console.error("[ERROR] ServiceWorker registration failed: ", err);
    }
  );
}