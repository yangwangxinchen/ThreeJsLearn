MakerJS.Materials = function(engine) {

    this.baseUrl = '';
    this.engine = engine;

    this.clear = function() {
        //dispose textures
        for (var i in this.textures) {
            if (this.textures[i] && this.textures[i].texture) {
                this.textures[i].texture.dispose();
            }
        }
        this.textures = {};

        //dispose materials
        for (var i in this.materials) {
            if (this.materials[i]) this.materials[i].dispose();
        }

        this.materials = {};
    }

    this.load = function(baseUrl, filename) {

        var me = this;
        this.baseUrl = baseUrl;
        var xmlhttp = new XMLHttpRequest();
        xmlhttp.open("Get", filename, false);
        xmlhttp.send(null);

        if (xmlhttp.readyState == 4) {
            //console.log(xmlhttp.responseText);
            me.parseFile(xmlhttp.responseText, filename);
        }
    };

    this.loadTexture = function(filename, callback) {

        let scope = this;
        if (scope.textures[filename] != undefined && scope.textures[filename].texture != undefined) {
            if (callback != undefined) callback(scope.textures[filename].texture);
            return;
        }

        if (scope.textures[filename] == undefined) {
            let index1 = filename.lastIndexOf(".");
            let index2 = filename.length;
            let postf = filename.substring(index1, index2).toLowerCase();

            var loader;
            if (postf == '.dds') {
                loader = new THREE.DDSLoader(); // dds 格式
            } else {
                loader = new THREE.TextureLoader(); // 其他格式
            }

            scope.textures[filename] = {};
            scope.textures[filename].callbacks = [];
            if (callback != undefined) scope.textures[filename].callbacks.push(callback);

            let item = scope.textures[filename];
            loader.load(filename, function(texture) {
                texture.name = filename;
                if (texture.image.width + texture.image.height > 0) {
                    item.texture = texture;

                    texture.wrapS = THREE.RepeatWrapping;
                    texture.wrapT = THREE.RepeatWrapping;

                    for (let c in item.callbacks) {
                        item.callbacks[c](texture);
                    }

                    scope.engine.requestFrame();
                }

                item.callbacks = [];
            });

        } else {
            if (callback != undefined) scope.textures[filename].callbacks.push(callback);
        }
    }

    this.parseFile = function(filecontent, filename) {
        var xmlParser = new DOMParser();
        let MaterialXml = xmlParser.parseFromString(filecontent, "application/xml");

        var materials = MaterialXml.childNodes[0];

        for (var i = 0; i < materials.childNodes.length; i++) {
            var mtlXml = materials.childNodes[i];

            if (mtlXml.nodeName == 'material') {
                let parentName = mtlXml.getAttribute('parent')
                let name = mtlXml.getAttribute('name');
                let parentMaterial = this.getMaterial(parentName);
                let material = this.inheritMaterial(name, parentMaterial);

                let transforms = new Float32Array(4);
                transforms[0] = 1;
                transforms[1] = 1;

                for (var j = 0; j < mtlXml.childNodes.length; j++) {
                    var parameter = mtlXml.childNodes[j];
                    if (parameter.nodeName == 'parameter') {
                        switch (parameter.getAttribute('name')) {
                            case 'base_transform':
                                transforms = parameter.textContent.replace("vec4(", "").replace(")", "").split(',');
                                break;

                            case 'diffuse_color':
                                var color = new Float32Array(4);
                                color = parameter.textContent.split(' ');

                                //material.color.setHSL( color[0], color[1], color[2]);
                                material.color = new THREE.Color(color[0], color[1], color[2]);
                                material.opacity = color[3];
                                break;
                            case 'specular_color':
                                var color = new Float32Array(4);
                                color = parameter.textContent.split(' ');

                                //material.color.setHSL( color[0], color[1], color[2]);
                                material.specular = new THREE.Color(color[0], color[1], color[2]);
                                break;
                            // case 'specular_scale':
                            //     var s = parseFloat(parameter.textContent.split(' '));

                            //     material.specular *s;
                            //     break;
                                

                            case 'emission_color':
                                var color = new Float32Array(4);
                                color = parameter.textContent.split(' ');
                                material.emissive = new THREE.Color(color[0], color[1], color[2]);
                                break;

                            case 'emission_scale':
                                material.shininess = parameter.textContent * 25;
                                material.emissiveIntensity = parameter.textContent / 7.2;
                                break;
                            case 'glow_scale':
                                // material.emissiveIntensity = parameter.textContent;
                                break;
                        }
                    } 
                    else if (parameter.nodeName == 'texture') {

                        let filename = this.baseUrl + '/' + parameter.textContent;
                        switch (parameter.getAttribute('name')) {
                            case 'diffuse':
                                this.loadTexture(filename, function (texture) {
                                	material.map = texture;
                                	material.map.repeat.x = transforms[0];
                                	material.map.repeat.y = transforms[1];
                                    material.needsUpdate = true;
                                });   
                                break;
                            case 'normal':
                                // this.loadTexture(filename, function (texture) {
                                // 	material.normalMap = texture;
                                // 	material.needsUpdate = true;
                                // });
                                break;
                            case 'reflection':
                                // this.loadTexture(filename, function (texture) {
                                // 	material.envMap = texture;
                                // 	material.needsUpdate = true;
                                // });   
                                break;
                        }
                    } 
                    else if (parameter.nodeName == 'blend') {

                        //不同的blend方式，待处理
                        //if(parameter.getAttribute('src') == 'src_alpha' &&
                        //   parameter.getAttribute('dest') == 'one_minus_src_alpha'){
                        //   	mtl.transparent = true;								
                        //}

                        material.transparent = true;
                    } 
                    else if (parameter.nodeName == "options") {
                        material.side = parameter.getAttribute('two_sided') == 1 ? THREE.DoubleSide : THREE.FrontSide;
                    }
                }
            }
        }
    };

    this.inheritMaterial = function(name, parentMaterial) {

        //material.color.setHSL( Math.random(), 1.0, 0.3 );
        return this.getMaterial(name, parentMaterial);
    }

    this.getMaterial = function(name, parentMaterial) {
        if (this.materials[name] == undefined) {
            var material;
            if(parentMaterial)
            {
                material = parentMaterial.clone();
            }
            else {
                material = new THREE.MeshPhongMaterial({
                    flatShading: THREE.FlatShading,
                    //side: THREE.DoubleSide
                });
            }
            
            // var material = new THREE.MeshStandardMaterial();
            // //material.roughness = 0.5 * Math.random() + 0.25;
            // material.metalness = 0;

            //material.side = THREE.DoubleSide; // BackSide
            //material.side = THREE.FrontSide;
            material.name = name;
            this.materials[name] = material;
        }
        return this.materials[name];
    }

    // this.parseSurfaceMtl = function (material, surMtlXml) {
    //     for (var i = 0; i < surMtlXml.childNodes.length; i++) {
    //         var parameter = surMtlXml.childNodes[i];
    //         if (parameter.nodeName == 'parameter') {
    //             switch (parameter.getAttribute('name')) {
    //                 case 'diffuse_color':
    //                     var color = new Float32Array(4);
    //                     color = parameter.textContent.split(' ');
    //                     material.color = new THREE.Color(color[0], color[1], color[2]);
    //                     material.opacity = color[3];
    //                     break;
    //             }
    //         }
    //         else if (parameter.nodeName == 'texture') {
    //             switch (parameter.getAttribute('name')) {
    //                 case 'diffuse':
    //                     var image = this.baseUrl + '/' + parameter.textContent;
    //                     var texture = THREE.ImageUtils.loadTexture(image);
    //                     material.map = texture;
    //                     break;
    //                 case 'reflection':
    //                     var image = this.baseUrl + '/' + parameter.textContent;
    //                     var loader = new THREE.DDSLoader();
    //                     var textureCube = loader.load(image);
    //                     material.envMap = textureCube;
    //                     break;
    //             }
    //         }
    //         else if (parameter.nodeName == 'blend') {
    //             //if(parameter.getAttribute('src') == 'src_alpha' &&
    //             //	parameter.getAttribute('dest') == 'one_minus_src_alpha'){
    //             material.transparent = true;
    //             //}
    //         }
    //     }
    // };
};
