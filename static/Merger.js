MakerJS.Merger = function(engine) {

    this.engine = engine;
    this.enabled = false;

    /*
    this.matches = {
        name : { type : 'contains', data : [] },
        uuid : { type : 'equals' , data : [] },
        ...
     }
    */
    this.matches = {};
    this.mergeHasProperty = false; // 设置true则合并匹配模型，false则合并其他模型
    this.useMergeMaterial = false; 

    this.materialGeometries = {};
    this.numMaterials = 0;

    this.mergedMaterial = new THREE.MeshPhongMaterial({ //MeshBasicMaterial
        //side:2,
        name: 'mergedMaterial',
        transparent: true,
        opacity: 0.3,
        color: 0x838383, //0x354b48, //0x909090,
        // alphaTest: 0.1,
    });

    this.clear = function() {
        this.matches = {};
        this.numMaterials = 0;
        this.materialGeometries = {};
    }

    // 检查名称，uuid等
    this.isMergeNode = function(node_data) {
        if (!this.enabled) return false;

        for (var i in node_data) {
            if (this.matches.hasOwnProperty(i)) {
                if (this.matches[i].type == 'contains') {
                    for (var j in this.matches[i].data) {
                        var d = this.matches[i].data[j];
                        if (node_data[i].indexOf(d) != -1) {
                            return this.mergeHasProperty;
                        }
                    }
                } else if (this.matches[i].type == 'equals') {
                    for (var j in this.matches[i].data) {
                        var d = this.matches[i].data[j];
                        if (node_data[i] == d) {
                            return this.mergeHasProperty;
                        }
                    }
                }
            }
        }
        return !this.mergeHasProperty;
    }

    this.createSurfaceGeometries = function(meshFile) {
        var surfaceGeometries = [];

        for(var i in meshFile.surfaces){
            var surface = meshFile.surfaces[i];

            // compute normals from tangent
            meshFile.compuateVertexNormals(i);

            surfaceGeometries[i] = new THREE.Geometry();

            for(var j = 0; j < surface.vertex.length / 3; j++) {
                surfaceGeometries[i].vertices.push(new THREE.Vector3(surface.vertex[j * 3], surface.vertex[j * 3 + 1], surface.vertex[j * 3 + 2]));
            }

            surfaceGeometries[i].faceVertexUvs[0] = [];

            for(var j = 0; j < surface.indices.length / 3; j++) {
                var v1 = surface.indices[j * 3];
                var v2 = surface.indices[j * 3 + 1];
                var v3 = surface.indices[j * 3 + 2];
                var vertexNormals = [
                    new THREE.Vector3(surface.normals[v1 * 3], surface.normals[v1 * 3 + 1], surface.normals[v1 * 3 + 2]),
                    new THREE.Vector3(surface.normals[v2 * 3], surface.normals[v2 * 3 + 1], surface.normals[v2 * 3 + 2]),
                    new THREE.Vector3(surface.normals[v3 * 3], surface.normals[v3 * 3 + 1], surface.normals[v3 * 3 + 2])];

                surfaceGeometries[i].faces.push(new THREE.Face3(v1,v2,v3, vertexNormals));
                surfaceGeometries[i].faceVertexUvs[0].push(
                    [
                    new THREE.Vector2(surface.uv[v1 * 2], surface.uv[v1 * 2 + 1]),
                    new THREE.Vector2(surface.uv[v2 * 2], surface.uv[v2 * 2 + 1]),
                    new THREE.Vector2(surface.uv[v3 * 2], surface.uv[v3 * 2 + 1])]
                    );
            }
        }
        return surfaceGeometries;
    }

    this.mergeObjectMeshStatic = function(geometries, object) {

        var scope = this;

        // 合并网格
        function merge_surfaces(surfaceGeometries, object){

            for (var i in object.surfaces)
            {
                var material = object.surfaces[i];

                if(scope.materialGeometries[material.name] == undefined){
                    scope.numMaterials++;
                    scope.materialGeometries[material.name] = {
                        geometry : new THREE.Geometry(),
                        material : material,
                    }
                }

                var mergedGeo = scope.materialGeometries[material.name].geometry;
                mergedGeo.merge(surfaceGeometries[i], object.transform);
            }
        }

        merge_surfaces(geometries, object);
    }

    this.updateObjects = function() {

        for(var name in this.materialGeometries){
            var m = this.useMergeMaterial ? this.mergedMaterial : this.materialGeometries[name].material;
            this.materialGeometries[name].node.material = m;
        }
    }

    this.createMergedObjects = function() {

        /*
        // merge as single geometry

        var geometry, materials;

        if(this.numMaterials > 1){
            geometry = new THREE.Geometry();
            materials = [];
            for(var name in this.materialGeometries){
                var material =  this.materialGeometries[name].material;
                var material_index = materials.length;
                materials.push(material);

                var start = geometry.faces.length;
                var g = this.materialGeometries[name].geometry;
                geometry.merge(g);
                for(var j = start; j < geometry.faces.length; j++){
                    geometry.faces[j].materialIndex = material_index;
                }
            }
        }
        else
        {
            for(var name in this.materialGeometries){
                materials = this.materialGeometries[name].material;
                geometry = this.materialGeometries[name].geometry;
            }
        }

        geometry.computeFaceNormals();
        var node = new THREE.Mesh(geometry, materials);
        this.engine.scene.add(node);
        */

        // @ to do
        // 是否进一步合并?
        for(var name in this.materialGeometries){
            var m = this.useMergeMaterial ? this.mergedMaterial : this.materialGeometries[name].material;
            var g = this.materialGeometries[name].geometry;
            var node = new THREE.Mesh(g, m);
            this.materialGeometries[name].node = node;
            this.engine.scene.add(node);
        }

        // var edges = new THREE.EdgesGeometry(this.merged, 75); //WireframeGeometry
        // var line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({
        //     color: 0x354b48,//0xdee4f5
        //     linewidth: 1,
        //     polygonOffset: true,
        //     polygonOffsetFactor: 1, // positive value pushes polygon further away
        //     polygonOffsetUnits: 1
        // }));

        // node.add(line);
    }

};
