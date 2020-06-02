MakerJS.World = function(engine) {

    this.baseUrl = '';
    this.WorldXml = null;
    this.engine = engine;
    this.world_name = '';
    this.world_nodes = {};
    this.uuid_nodes = {};
    this.meshFiles = {};
    this.loaded = false;
    this.numLoading = 0;
    this.numLoaded = 0;
    this.materialManager = new MakerJS.Materials(engine);
    this.merger = new MakerJS.Merger(engine);

    this.camera_position;
    this.camera_target;

    this.bound_max;
    this.bound_min;
    this.center;
    this.radius = 0;

    // 字体
    var scope = this;
    new THREE.FontLoader().load('./js/fonts/helvetiker_regular.typeface.json', function(font) {
        scope.font = font;
    });

    function get_base_url(filename) {
        //get relative path
        if (filename !== undefined) {
            var parts = filename.split('/');
            parts.pop();
            return (parts.length < 1 ? '.' : parts.join('/'));
        }
        return filename;
    }

    function get_file_name(filename) {
        if (filename !== undefined) {
            var names = filename.split("/");
            return names[names.length - 1];
        }
    }

    function combine(a, b) {

        if (b[0] == '/' || b[0] == '\\')
            return a + b;
        return a + '/' + b;
    }

    this.clear = function() {
        this.materialManager.clear();
        this.uuid_nodes = {};
        this.world_nodes = {};
        for (var i in this.meshFiles) {
            if (this.meshFiles[i].geometry) this.meshFiles[i].geometry.dispose();
        }
        this.meshFiles = {};
        this.loaded = false;

        this.engine.lods.clear();

        this.numLoading = 0;
        this.numLoaded = 0;

        this.camera_position = new THREE.Vector3();
        this.camera_target = new THREE.Vector3();

        this.bound_max = new THREE.Vector3(-Infinity, -Infinity, -Infinity);
        this.bound_min = new THREE.Vector3(Infinity, Infinity, Infinity);;
        this.center = new THREE.Vector3();
        this.radius = 0;
    };

    this.load = function(filecontent, filename, use_merge) {

        //clear
        this.uuid_nodes = {};
        this.world_nodes = {};
        this.loaded = false;

        // if(use_merge) this.merger.enabled = use_merge;
        // else this.merger.enabled = false;
        this.merger.clear();
        if (use_merge) {
            if (use_merge.enabled != undefined) this.merger.enabled = use_merge.enabled;
            else this.merger.enabled = true;
            if (use_merge.useMergeMaterial != undefined) this.merger.useMergeMaterial = use_merge.useMergeMaterial;
            if (use_merge.hasProperty) this.merger.mergeHasProperty = use_merge.hasProperty;
            if (use_merge.matches) this.merger.matches = use_merge.matches
        } else this.merger.enabled = false;

        var xmlParser = new DOMParser();
        this.WorldXml = xmlParser.parseFromString(filecontent, "application/xml");

        this.baseUrl = get_base_url(filename);
        var _name = get_file_name(filename)
        this.world_name = _name.substring(0, _name.lastIndexOf("."));

        //parse content
        this.parseMaterial();
        this.parseCamera();
        this.parseEditor();

        this.loaded = true;

        return this.baseUrl;
    };

    this.parseMaterial = function() {
        var materials = this.WorldXml.querySelectorAll('materials library');
        for (var i = 0; i < materials.length; i++) {
            var element = materials[i];
            var mtlUrl = combine(this.baseUrl, element.textContent);
            // console.log(mtlUrl)
            this.materialManager.load(this.baseUrl, mtlUrl);
        }
    };

    this.parseCamera = function() {

        var cameraXml = this.WorldXml.querySelectorAll('camera');
        for (var i = 0; i < cameraXml.length; i++) {
            var child = cameraXml[i];
            if (child.nodeName == 'camera') {

                var position = child.getAttribute('position');

                if (position) {
                    var trans_arr = position.split(' ');
                    this.engine.controls.position0.set(parseFloat(trans_arr[0]), parseFloat(trans_arr[1]), parseFloat(trans_arr[2]));
                }

                var quaternion = child.getAttribute('quaternion');

                if (quaternion) {
                    var trans_arr = quaternion.split(' ');
                    var q = new THREE.Quaternion(parseFloat(trans_arr[0]), parseFloat(trans_arr[1]), parseFloat(trans_arr[2]), parseFloat(trans_arr[3]));

                    var dir = new THREE.Vector3(0, 0, 1).applyQuaternion(q);
                    this.engine.controls.target0.copy(dir);
                }

                var matrixWorld = child.getAttribute('transform');

                if (matrixWorld) {
                    var pos = new Float32Array(16);
                    var trans_arr = matrixWorld.split(' ');
                    for (var j in pos) {
                        pos[j] = parseFloat(trans_arr[j]);
                    }

                    let m1 = new THREE.Matrix4();
                    m1.set(
                        pos[0], pos[4], pos[8], pos[12],
                        pos[1], pos[5], pos[9], pos[13],
                        pos[2], pos[6], pos[10], pos[14],
                        pos[3], pos[7], pos[11], pos[15]);

                    var dir = new THREE.Vector3(0, 0, 1).transformDirection(m1);
                    this.camera_position = new THREE.Vector3(pos[12], pos[13], pos[14]);
                    this.camera_target = this.camera_position.clone().sub(dir.multiplyScalar(10))

                    this.engine.controls.position0.copy(this.camera_position);
                    this.engine.controls.target0.copy(this.camera_target);
                }

                this.engine.controls.reset();
            }
        }

    };

    this.parseEditor = function() {

        var editors = this.WorldXml.getElementsByTagName('editor');

        for (var i = 0; i < editors.length; i++) {
            var editor = editors[i];
            for (var j = 0; j < editor.childNodes.length; j++) {
                var nodeXml = editor.childNodes[j];
                if (nodeXml.nodeName == 'node') {
                    var node = this.parseNode(nodeXml);
                    if (node != undefined) {
                        this.engine.scene.add(node);
                    }
                }
            }
        }

    };

    this.parseNode = function(nodeXml, parent) {
        let node;

        var query = {};

        let mat4 = new THREE.Matrix4();
        query.id = nodeXml.getAttribute('id');
        query.name = nodeXml.getAttribute('name');
        query.type = nodeXml.getAttribute('type');

        for (var j = 0; j < nodeXml.childNodes.length; j++) {
            let xml = nodeXml.childNodes[j];
            if (xml.nodeName == 'data') // 读取参数UniqueID
                query.uuid = xml.textContent;
            else if (xml.nodeName == 'transform') {
                var pos = new Float32Array(16);
                var trans_arr = xml.textContent.split(' ');
                for (var i in pos) {
                    pos[i] = parseFloat(trans_arr[i]);
                }

                mat4.set(
                    pos[0], pos[4], pos[8], pos[12],
                    pos[1], pos[5], pos[9], pos[13],
                    pos[2], pos[6], pos[10], pos[14],
                    pos[3], pos[7], pos[11], pos[15]);
            }
        }

        var t;
        if (parent) {
            t = parent.worldTransform.clone().multiply(mat4);
        } else {
            t = mat4.clone();
        }

        // 检查 模型合并
        // 非合并读取
        switch (query.type) {
            case 'NodeExtern':
                node = new THREE.Group(); // group 节点
                break;
            case 'NodeDummy':
                node = new THREE.Object3D();
                break;
            case 'ObjectMeshDynamic':
                node = new THREE.Object3D();
                break;
            case 'ObjectMeshStatic':
                {
                    let materials = [];

                    //先把材质读取一遍
                    for (var i = 0; i < nodeXml.childNodes.length; i++) {
                        if (nodeXml.childNodes[i].nodeName == 'surface') {
                            var mtlName = nodeXml.childNodes[i].getAttribute('material');
                            materials.push(this.materialManager.getMaterial(mtlName));
                        }
                    }

                    for (var i = 0; i < nodeXml.childNodes.length; i++) {
                        var xml = nodeXml.childNodes[i];
                        if (xml.nodeName == 'mesh_name') {

                            let scope = this;

                            function check_loaded() {
                                scope.numLoaded++;
                                if (scope.loaded && scope.numLoading == scope.numLoaded) {
                                    for (var i in scope.meshFiles) {
                                        var item = scope.meshFiles[i];
                                        if (Array.isArray(item.geometry)) {
                                            for (var i in item.geometry) {
                                                item.geometry[i].dispose();
                                            }
                                        } else {
                                            item.geometry.dispose();
                                        }
                                        item.meshFile = null;
                                    }
                                    scope.meshFiles = {};

                                    scope.merger.createMergedObjects();

                                    scope.center.addVectors(scope.bound_max, scope.bound_min).divideScalar(2);
                                    scope.radius = scope.bound_max.distanceTo(scope.bound_min) / 2;
                                    // console.log(scope.center)
                                    // console.log(scope.radius)

                                    console.log('loadEnd');
                                    scope.dispatchEvent({ type: "loadEnd" });
                                }
                            }

                            let mesh_url = xml.textContent;
                            // console.log(mesh_url)
                            let isMergeNode = this.merger.isMergeNode(query);
                            let source = this.meshFiles[mesh_url];
                            if (source == undefined) {
                                source = this.meshFiles[mesh_url] = {};

                                source.meshFile = new MakerJS.Mesh();

                                source.meshFile.addEventListener('load', function(event) {
                                    if (isMergeNode) {
                                        source.geometry = scope.merger.createSurfaceGeometries(source.meshFile);
                                    } else {
                                        source.meshFile.loadGeometry(source.geometry, materials.length > 1);
                                    }
                                });

                                source.meshFile.load(combine(this.baseUrl, mesh_url));
                            }

                            source.meshFile.addEventListener('error', function(event) {
                                check_loaded();
                            });

                            if (isMergeNode) {
                                source.meshFile.addEventListener('load', function(event) {
                                    scope.merger.mergeObjectMeshStatic(source.geometry, {
                                        surfaces: materials,
                                        transform: t,
                                    });
                                    check_loaded();
                                });
                            } else {
                                if (source.geometry == undefined) {
                                    source.geometry = new THREE.BufferGeometry(); //new THREE.Geometry();
                                }

                                node = new THREE.Mesh(source.geometry, materials.length > 1 ? materials : materials[0]);
                                node.visible = false;

                                source.meshFile.addEventListener('load', function(event) {
                                    // boundbox size
                                    node.boundingBox = source.meshFile.bound_box;
                                    node.boundingSphere = source.meshFile.bound_sphere;
                                    var size = new THREE.Vector3().copy(node.boundingBox.max).sub(node.boundingBox.min);

                                    scope.bound_max.max(node.boundingBox.max.clone().applyMatrix4(node.matrixWorld));
                                    scope.bound_min.min(node.boundingBox.min.clone().applyMatrix4(node.matrixWorld));

                                    node.visible = true;
                                    scope.engine.lods.applyNode(node, size);

                                    scope.dispatchEvent({ type: "nodeLoaded", node: node });

                                    check_loaded();
                                    scope.engine.requestFrame();
                                });

                                // @ to do
                                // 需要读取配置
                                node.castShadow = true; //开启投影
                                node.receiveShadow = true; //接收阴影
                            }

                            this.numLoading++;
                        }
                    }

                    break;
                }

                //读取文字
            case 'ObjectText':
                {
                    for (var i = 0; i < nodeXml.childNodes.length; i++) {
                        var xml = nodeXml.childNodes[i];
                        switch (xml.nodeName) {
                            case 'text':
                                {
                                    var text = xml.textContent;
                                }
                                break;

                            case 'font_size':
                                {
                                    var font_size = xml.textContent;
                                }
                                break;

                            case 'text_color':
                                {
                                    var text_color = xml.textContent;
                                    var rgbarr = text_color.split(" ");
                                    var rgbcolor = "rgb(" + rgbarr[0] + ", " + rgbarr[1] + ", " + rgbarr[2] + ")";
                                    var rgbopacity = rgbarr[3];
                                    break;
                                }

                            default:
                                break;
                        }

                        if (text != null && font_size != null && text_color != null) {
                            var matLite = new THREE.MeshBasicMaterial({
                                color: new THREE.Color(rgbcolor),
                                transparent: true,
                                opacity: rgbopacity,
                                side: THREE.DoubleSide
                            });

                            var shapes = scope.font.generateShapes(text, font_size);
                            var geometry = new THREE.ShapeBufferGeometry(shapes);
                            node = new THREE.Mesh(geometry, matLite);
                        }

                    }
                    break;

                }

            default:
                {
                    return;
                }
        }

        if (node != undefined) {
            node.name = query.name;
            node.userData['nodeID'] = query.id;
            this.world_nodes[query.id] = node;

            if (query.uuid) {
                node.userData['UniqueID'] = query.uuid;
                //node.uuid = uuid;
                this.uuid_nodes[query.uuid] = node;
            }

            node.applyMatrix(mat4);

            if (parent && parent.node) {
                parent.node.add(node);
            }
        }

        for (var i = 0; i < nodeXml.childNodes.length; i++) {
            let xml = nodeXml.childNodes[i];
            if (xml.nodeName == 'node') {
                this.parseNode(xml, { node: node, worldTransform: t });
            }
        }

        return node;
    };
}

MakerJS.World.prototype = Object.create(THREE.EventDispatcher.prototype);
