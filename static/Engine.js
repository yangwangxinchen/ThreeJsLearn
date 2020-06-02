var MakerJS = { REVISION: '1.0' };
var Public_Engine;
'use strict';

MakerJS.Engine = function () {
    // // @ 单例控制

    this.renderEnabled = false;
    this.realtime = true;

    this.needReset = false;

    this.width = window.innerWidth || 1;
    this.height = window.innerHeight || 1;

    var devicePixelRatio = window.devicePixelRatio || 1;

    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(60, this.width / this.height, 0.1, 10000);
    //  this.camera.position.z = 7;
     this.camera.up.set(0, 0, 1);  //
    // this.camera.translateY(200);

    const canvas = document.querySelector('#Maker_Render_Canvas');
    const MakerJS_div = document.getElementById("MakerJS");
    this.div = MakerJS_div;
    this.canvas = canvas;
    this.renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        //antialiasing : true,
        // alpha: true,
        //logarithmicDepthBuffer: true
    });

    //var renderer = new THREE.WebGLRenderer( { antialias: true } );
    this.renderer.setSize(this.width, this.height);
    //this.renderer.setClearColor(new THREE.Color("rgb(69,69,69)"), 1.0);
    this.renderer.setPixelRatio(devicePixelRatio);

    this.scene.background = new THREE.Color(0x212121); //new THREE.Color(0x212121); // 0x7f7f7f

    this.controls = new THREE.OrbitControls(this.camera, MakerJS_div);
    this.controls.target.set(0, 5, 0);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.6;
    this.controls.update();

    // this.composer = new THREE.EffectComposer(this.renderer);
    // this.composer.setPixelRatio(devicePixelRatio);

    // this.taaRenderPass = new THREE.TAARenderPass(this.scene, this.camera);
    // this.taaRenderPass.unbiased = false;
    // this.composer.addPass(this.taaRenderPass);

    // this.renderPass = new THREE.RenderPass(this.scene, this.camera);
    // this.composer.addPass(this.renderPass);
    // this.renderPass.enabled = false;

    // var copyPass = new THREE.ShaderPass(THREE.CopyShader);
    // this.composer.addPass(copyPass);

    // this.taaRenderPass.enabled = true;
    // this.taaRenderPass.sampleLevel = 2;

    window.addEventListener('resize', resizeWindow, false);

    var scope = this;
    //字体
    new THREE.FontLoader().load('./js/fonts/helvetiker_regular.typeface.json', function (font) {
        scope.font = font;
    });

    //中文字体，简宋
    new THREE.FontLoader().load('./js/fonts/STSong_Regular.json', function (font) {
        scope.hanfont = font;
    });

    function resizeWindow() {
        this.width = window.innerWidth || 1;
        this.height = window.innerHeight || 1;
        scope.camera.aspect = width / height;
        scope.camera.updateProjectionMatrix();

        // resize viewport width and height
        // scope.css2dRenderer.setSize(this.width, this.height);
        // scope.cssRenderer.setSize(this.width, this.height);
        scope.renderer.setSize(this.width, this.height);
        scope.composer.setSize(this.width, this.height);
        scope.blooms.setSize(this.width, this.height);

        scope.requestFrame();
    }


    function update() {

        scope.scene.updateMatrixWorld();

        scope.lods.update(scope.camera.position);

        scope.dispatchEvent({ type: "update" });
    }

    function render() {
        update();
        scope.renderer.autoClear = false;
        scope.renderer.clear();
        scope.renderer.render(scope.scene, scope.camera);

        // // need render before scene render
        // scope.blooms.render();
        // scope.composer.render();

        // scope.lods.reset();

        // scope.fieldTips.render();
        // scope.fieldTips2D.render(); //二维
        // scope.dispatchEvent({ type: "render" });
    }
    
    function animate() {
        
        requestAnimationFrame(animate);
        scope.controls.update();
        
        
        //控制实时渲染
        if (scope.renderEnabled) {
            // stats.begin();
            render();
            // stats.end();
        }
    }

    this.controls.addEventListener('change', function (event) {

        // scope.directionalLight.rotation.copy(scope.camera.rotation);
        // scope.directionalLight.position.set(scope.camera.position.x, scope.camera.position.y, scope.camera.position.z);
        


        scope.requestFrame();
    });

    animate();
    this.requestFrame();

    //
    //0xA9A9A9
    this.directionalLight = new THREE.DirectionalLight(0xe6e6e6); //0xFFFFFF   0xe6e6e6
    this.directionalLight.position.set(68.18992775940117, 86.13502009832158, 120.4306822343087);

    //this.directionalLight.lookAt(new THREE.Vector3(50, 100, 75));
    this.directionalLight.rotation.set(-0.6436145316040527, 0.46408870303057603, 2.6036254515844126);
    this.directionalLight.userData.constant = true;
    this.scene.add(this.directionalLight);

    //directional light
    var SHADOW_MAP_WIDTH = 1024 * 4,
        SHADOW_MAP_HEIGHT = 1024 * 2;

    this.renderer.shadowMapEnabled = false; // 开启阴影，加上阴影渲染
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    var size = 20;
    this.directionalLight.castShadow = true; // 投射阴影
    this.directionalLight.shadow.camera.near = 0.1;
    this.directionalLight.shadow.camera.far = 800;
    this.directionalLight.shadow.camera.right = size;
    this.directionalLight.shadow.camera.left = -size;
    this.directionalLight.shadow.camera.top = size;
    this.directionalLight.shadow.camera.bottom = -size;
    this.directionalLight.shadow.mapSize.width = SHADOW_MAP_WIDTH;
    this.directionalLight.shadow.mapSize.height = SHADOW_MAP_HEIGHT;

    
    //ambient light
    //0xaaaaaa
    //0xA9A9A9
    this.ambientLight = new THREE.AmbientLight(0x686868, 1.0);
    //var ambientLight = new THREE.AmbientLight(0xEEF4FC, 1.0);
    this.ambientLight.userData.constant = true;
    this.scene.add(this.ambientLight);

    this.world = new MakerJS.World(this);
    // this.lods = new MakerJS.LODs(this);
    // this.parameters = new MakerJS.Parameters();
    // this.effects = new MakerJS.Effects(this);
    // this.blooms = new MakerJS.Bloom(this);
    // this.nodeSelection = new MakerJS.NodeSelection(this);
    // this.helper = new MakerJS.Helper(this);
    // this.fieldTips = new MakerJS.FieldTips(this);
    // this.fieldTips2D = new MakerJS.FieldTips2D(this);

    this.scene.background = new THREE.CubeTextureLoader()
        .setPath('textures/skybox1/')
        //.load(['px.jpg', 'nx.jpg', 'py.jpg', 'ny.jpg', 'pz.jpg', 'nz.jpg']);
        .load(['px.jpg', 'nx.jpg', 'py.jpg', 'ny.jpg', 'pz.jpg', 'nz.jpg']);

    this.world.addEventListener('loadEnd', function (event) {
        // Public_Engine.focusWorld(true);
        if (scope.world.world_name == "morenshitu") {
            // scope.controls.target0.set(154.07286071777344, 117.0617904663086, 50);
            scope.controls.target0.set(0, 100, 50);

            scope.controls.reset();
        }
        else if (scope.world.world_name == "jijianguan") {
            var objs = scope.helper.getObjectsByName("网格");



            if (objs.length > 0) {
                var center = scope.helper.getWorldCenter(objs[0]);
                scope.controls.target0.set(center.x, center.y, center.z);
                scope.controls.reset();
            }
        }
        else if (scope.world.world_name == "jiudian") {
            var objs = scope.helper.getObjectsByName("酒店01");
            if (objs.length > 0) {
                var center = scope.helper.getWorldCenter(objs[0]);
                scope.controls.target0.set(center.x, center.y, center.z);
                scope.controls.reset();
            }
        }
    });

};




MakerJS.Engine.prototype = Object.create(THREE.EventDispatcher.prototype);
MakerJS.Engine.prototype.constructor = MakerJS.Engine;

// 清除场景
MakerJS.Engine.prototype.clear = function () {
    this.renderer.dispose();
    this.scene.dispose();
    this.world.clear();
    this.fieldTips.clear();
    this.clearScene();
    // Public_Engine = null;
};


MakerJS.Engine.prototype.requestFrame = function () {
    this.renderEnabled = true;

    if (this.renderTimeout) { // 清除计时器
        clearTimeout(this.renderTimeout);
    }

    if (!this.realtime) {
        var scope = this;
        // 请求式渲染 - 延迟渲染1.5秒
        this.renderTimeout = setTimeout(function () {
            scope.renderEnabled = false;
        }, 1500);
    }
};


MakerJS.Engine.prototype.setRealtime = function (v) {
    this.realtime = v;
    this.requestFrame();
};

MakerJS.Engine.prototype.addPass = function (pass) {
    if (pass == undefined) return;

    var id = this.composer.passes.indexOf(pass);
    if (id == -1) {
        this.composer.addPass(pass);
    }
};

MakerJS.Engine.prototype.removePass = function (pass) {
    if (pass == undefined) return;

    var id = this.composer.passes.indexOf(pass);
    if (id != -1) {
        this.composer.passes.splice(id, 1);
    }
};

// MakerJS.Engine.prototype.setTAA = function (value, level) {
//     this.taaRenderPass.enabled = value;
//     this.renderPass.enabled = !this.taaRenderPass.enabled;
//     if (level) this.taaRenderPass.sampleLevel = level;
// };

MakerJS.Engine.prototype.setAmbientOcclusion = function (e) {

    if (e) {
        var width = window.innerWidth;
        var height = window.innerHeight;
        var scope = this;

        this.camera.far = 700;
        this.camera.updateProjectionMatrix();

        if (this.aoPass == undefined) {
            this.aoPass = new THREE.SAOPass(this.scene, this.camera, false, true);

            this.aoPass.params.saoIntensity = 0.06;
            this.aoPass.params.saoScale = 1.2;
            this.aoPass.params.saoKernelRadius = 25;

            this.ambientLight.color.setHex(0xEEF4FC);
        }
        this.addPass(this.aoPass);


    } else {
        this.camera.far = 10000;
        this.camera.updateProjectionMatrix();

        this.removePass(this.aoPass);
    }
};

MakerJS.Engine.prototype.clearScene = function (begin, end) {
    let scope = this;
    var scene = scope.scene;
    var _idx = scene.children.length - 1;
    if (!begin && !end) {
        begin = 0;
        end = _idx
    }

    // 删除group，释放内存
    function deleteObject(group) {
        if (!group) return;

        let children = group.children;
        for (let i in children) {
            deleteObject(children[i]);
        }

        // 删除掉所有的模型组内的mesh
        group.traverse(function (item) {

            // 删除几何体
            if (item.geometry) {
                item.geometry.dispose();
            }

            // 删除材质
            if (item.material) {
                if (Array.isArray(item.material)) {
                    for (var i in item.material) {
                        item.material[i].dispose();
                    }
                } else {
                    item.material.dispose();
                }
            }
        });
    }

    for (var i = end; i > begin; i--) {
        let child = scene.children[i];
        if (child.userData.constant == undefined) {
            deleteObject(child);
            scene.remove(child);
        }
    }
}

MakerJS.Engine.prototype.load = function (file, merge, callback) {

    var scope = this;
    this.clearScene();
    this.world.clear();
    this.clear();

    scope.needReset = true;

    var loader = new MakerJS.FileLoader(file);

    function _do_parse(filecontent, filename) {

        var index1 = filename.lastIndexOf(".");
        var index2 = filename.length;
        var postf = filename.substring(index1, index2);

        if (postf == '.world') {
            scope.world.load(filecontent, filename, merge);
        } else if (postf == '.mesh') {
        }
    }

    var scene = scope.scene;
    var _idx = scene.children.length - 1;

    loader.load(function (p) {
        _do_parse(p, file);
        console.log(callback)
        if (callback) callback();

        console.log('load： ' + file);
    });

    this.clearScene(0, _idx);
};













































