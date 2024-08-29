// import '../css/style.scss';
import { random, lerp } from './utils';
import { Controls } from './controls';
import * as THREE from "three";
// import { VivianiCurve } from "three/examples/jsm/curves/CurveExtras.js"
import Lenis from '@studio-freight/lenis';
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
gsap.registerPlugin(ScrollTrigger);


class Main {
  constructor() {
    this.viewport = {
      width: window.innerWidth,
      height: window.innerHeight
    };

    this.canvas = document.querySelector("#canvas");

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      alpha: true
    });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(this.viewport.width, this.viewport.height);

    this.scene = new THREE.Scene();
    this.group = new THREE.Group();
    this.scene.add(this.group);

    this.camera = null;

    this.mesh = null;

    this.meshParticle = null;
    this.particleCount = 200;

    this.loader = new THREE.TextureLoader();
    this.texture = null;


    this.isEnableControls = false; // OrbitControls有効化
    // this.isEnableControls = true; // OrbitControls有効化

    this.lenis = new Lenis({
      lerp: 0.04, // 慣性の強さ
    });


    this.percentage = 0;
    this.targetPercentage = 0;

    this.isInitialRender = true; // 初回レンダリング用のフラグ
    
    this._init();
  }

  _loadTexture(url) {
    return new Promise((resolve, reject) => {
      this.loader.load(
        url,
        (texture) => {
          resolve(texture);
        },
        undefined,
        (error) => {
          reject(error);
        }
      )
    })
  }

  async _init() {
    this.texture = await this._loadTexture('images/img15.png');

    this._setCamera();

    this._setControlls();

    this._setLight();
    this._setCurve();
    this._setScroll();
    
    this._addMesh();
    this._addParticle();

    this._update();
    this._addEvent();
  }

  _setCamera() {
    // this.camera = new THREE.PerspectiveCamera(45, this.viewport.width / this.viewport.height, 1, 100);
    // this.camera.position.set(0, 0, 5);
    // this.scene.add(this.camera);

    //ウインドウとWebGL座標を一致させる
    const fov = 45;
    const fovRadian = (fov / 2) * (Math.PI / 180); //視野角をラジアンに変換
    const distance = (this.viewport.height / 2) / Math.tan(fovRadian); //ウインドウぴったりのカメラ距離
    this.camera = new THREE.PerspectiveCamera(fov, this.viewport.width / this.viewport.height, 1, distance * 2);
    this.camera.position.z = distance;
    this.camera.lookAt(new THREE.Vector3(0, 0, 0));
    this.scene.add(this.camera);
  }

  _setControlls() {
    if(this.isEnableControls) {
      this.controls = new Controls(this.camera, this.canvas);
    }
  }

  _setLight() {
    const light = new THREE.DirectionalLight(0xffffff, 1.5);
    light.position.set(1, 30, 1);
    this.scene.add(light);

    const lightAmb = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(lightAmb);
  }

  _setCurve() {
    this.curveLine = new THREE.CatmullRomCurve3([
      new THREE.Vector3( 0, 0, 0 ),
      new THREE.Vector3( 0, 0, -50 ),
      new THREE.Vector3( 10, 15, -200 ),
      new THREE.Vector3( -10, 25, -400 ),
      new THREE.Vector3( 30, 5, -600 ),
      new THREE.Vector3( -10, -5, -800 ),
      new THREE.Vector3( 0, 0, -1000 ),
    ]);

    // this.curveLine.closed = true;
    this.curveLine.tension = 20.0;
  }

  _addMesh() {
    const geometry = new THREE.TubeGeometry(this.curveLine, 100, 6, 36, false);
    const material = new THREE.MeshBasicMaterial({
      // color: 0x444444,
      // wireframe: true,
      side: THREE.BackSide,
      map: this.texture,
    });
    material.map.wrapS = THREE.RepeatWrapping;
    material.map.wrapT = THREE.RepeatWrapping;
    // material.map.repeat.set(1, 200);
    material.map.repeat.set(1, 3);

    this.mesh = new THREE.Mesh(geometry, material);
    this.scene.add(this.mesh);
  }

  _addParticle() {
    const geometryBox = new THREE.BoxGeometry(0.3, 0.3, 0.3);
    const geometrySIcosahedron = new THREE.IcosahedronGeometry(0.3, 0);
    const geometryTorus = new THREE.TorusGeometry( 0.3, 0.1, 16, 100);

    for(let i = 0; i < this.particleCount; i++) {
      
      // const geometry = new THREE.BoxGeometry(0.3, 0.3, 0.3);
      const material = new THREE.MeshStandardMaterial({
        color: 0xeeeeee,
      });
      const randomGeo = random(0,1);
      let mesh;
      if(randomGeo < 0.2) {
        mesh = new THREE.Mesh(geometryTorus, material);
      } else if(randomGeo < 0.7) {
        mesh = new THREE.Mesh(geometrySIcosahedron, material);
      } else {
        mesh = new THREE.Mesh(geometryBox, material);
      }
      const random1 = random(-4, 4);
      const random2 = random(-4, 4);
  
      const position = this.curveLine.getPoint(Math.random());
      // mesh.position.set(position.x, position.y, position.z);
      mesh.position.set(position.x + random1, position.y + random2, position.z);
      mesh.rotation.set(Math.random(),Math.random(),Math.random());
  
      this.group.add(mesh);
    }
  }

  _setScroll() {
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: '#section01',
        start: 'top top',
        end: 'bottom bottom',
        scrub: true,
        // markers: true,
        onUpdate: (self) => {
          // this._updateCamera();
          const progress = self.progress;

          if(progress > 0.96) return;
          
          // this.percentage = progress;
          this.targetPercentage = progress;
        }
      }
    });
  }

  _updateCamera() {
    this.percentage = lerp(this.percentage, this.targetPercentage, 0.08);

    let p1 = this.curveLine.getPoint(this.percentage%1);
    let p2 = this.curveLine.getPointAt((this.percentage + 0.01)%1);

    this.camera.position.set(p1.x, p1.y, p1.z);
    this.camera.lookAt(p2);
  }

  _update(time) {
    this.lenis.raf(time);

    for(let i = 0; i < this.particleCount; i++) {
      this.group.children[i].rotation.x += 0.01;
      this.group.children[i].rotation.y += 0.005;
    }

    // this.percentage += 0.001;

    // let p1 = this.curveLine.getPoint(this.percentage%1);
    // let p2 = this.curveLine.getPointAt((this.percentage + 0.01)%1);

    // this.camera.position.set(p1.x, p1.y, p1.z);
    // this.camera.lookAt(p2);

    const previousPercentage = this.percentage;

    this._updateCamera();


    //レンダリング
    this.renderer.render(this.scene, this.camera);
    // 初回またはカメラ位置が変わった場合のみレンダリング
    // if(this.isInitialRender || this.percentage !== previousPercentage) {
    //   this.renderer.render(this.scene, this.camera);
    //   this.isInitialRender = false;
    // }

    if(this.isEnableControls) {
      this.controls.update();
    }

    requestAnimationFrame(this._update.bind(this));
  }

  _onResize() {
    this.viewport = {
      width: window.innerWidth,
      height: window.innerHeight
    }
    // レンダラーのサイズを修正
    this.renderer.setSize(this.viewport.width, this.viewport.height);
    // カメラのアスペクト比を修正
    this.camera.aspect = this.viewport.width / this.viewport.height;
    this.camera.updateProjectionMatrix();
  }

  _addEvent() {
    window.addEventListener("resize", this._onResize.bind(this));
  }
}

new Main();



