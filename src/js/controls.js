import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js"

class Controls {
  constructor(camera, canvas) {
    this.camera = camera;
    this.canvas = canvas;

    this.controls = new OrbitControls(this.camera, this.canvas);
    this.controls.enableDamping = true;
  }

  update() {
    this.controls.update();
  }
}

export { Controls };