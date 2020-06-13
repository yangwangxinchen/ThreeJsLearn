MakerJS.UnrealBloom=function(engine){
    
    var scene, camera, controls;
    var renderer;

    var ENTIRE_SCENE = 0, BLOOM_SCENE = 1;
    var bloomLayer = new THREE.Layers();
    //删除图层对象已有的所有对应关系，增加与参数指定的图层的对应关系
    bloomLayer.set( BLOOM_SCENE );

    var params = {
        exposure: 1.0,
        bloomStrength: 1.2,
        bloomThreshold: 0,
        bloomRadius: 0,
        scene: "Scene with Glow"
    };
    
    var darkMaterial = new THREE.MeshBasicMaterial( { color: "black" } );
    var materials = {};
    
    renderer=engine.renderer
    renderer.toneMapping = THREE.ReinhardToneMapping;
    scene=engine.scene;
    camera=engine.camera;
    controls=engine.controls
    
    controls.addEventListener( 'change', render );
    
    
    var renderScene = new THREE.RenderPass( scene, camera );
    
    var bloomPass = new THREE.UnrealBloomPass( new THREE.Vector2( window.innerWidth, window.innerHeight ), 1.5, 0.4, 0.85);
    bloomPass.threshold = params.bloomThreshold;
    bloomPass.strength = params.bloomStrength;
    bloomPass.radius = params.bloomRadius;
    
    // effectCopy
    var effectCopy = new THREE.ShaderPass(THREE.CopyShader);
    // 让effectCopy渲染到屏幕上 没这句不会再屏幕上渲染
    effectCopy.renderToScreen = true;

    
    var bloomComposer = new THREE.EffectComposer( renderer );
    this.bloomComposer=bloomComposer
    bloomComposer.renderToScreen = false;
    bloomComposer.addPass( renderScene );
    bloomComposer.addPass( bloomPass );

    bloomComposer.addPass( effectCopy );
    bloomComposer.render()
    
    var finalPass = new THREE. ShaderPass(
        new THREE.ShaderMaterial( {
            uniforms: {
                baseTexture: { value: null },
                bloomTexture: { value: bloomComposer.renderTarget2.texture }
            },
            //vertexShader: document.getElementById( 'vertexshader' ).textContent,
            // fragmentShader: document.getElementById( 'fragmentshader' ).textContent,
            vertexShader:
            "varying vec2 vUv;\n"+
            "void main() {vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );}",
            fragmentShader:
            "uniform sampler2D baseTexture;\n"+
            "uniform sampler2D bloomTexture;\n"+
            "varying vec2 vUv;\n"+
            "vec4 getTexture( sampler2D texelToLinearTexture ) \n"+
            "{return mapTexelToLinear( texture2D( texelToLinearTexture , vUv ) );}\n"+
            "void main() {gl_FragColor = ( getTexture( baseTexture ) + vec4( 1.0 ) * getTexture( bloomTexture ) );}",
            
            defines: {}
        } ), "baseTexture"
    );
    finalPass.needsSwap = true;
    
    var finalComposer = new THREE.EffectComposer( renderer );
    finalComposer.addPass( renderScene );
    finalComposer.addPass( finalPass );
    
    var raycaster = new THREE.Raycaster();
    
    var mouse = new THREE.Vector2();
    
    window.addEventListener( 'click', onDocumentMouseClick, false );
    
    
    setupScene();
    
    function onDocumentMouseClick( event ) {
    
        event.preventDefault();
    
        mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
        mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
    
        raycaster.setFromCamera( mouse, camera );
        var intersects = raycaster.intersectObjects( scene.children );
        console.log(intersects[ 0 ])
        if ( intersects.length > 0 ) {
            
            var object = intersects[ 0 ].object;
            //根据参数切换对象所属图层
            object.layers.toggle( BLOOM_SCENE );
            render();
    
        }
    
    }


    this.toggleGlow=function(obj){
        // obj.layers.set( BLOOM_SCENE );
        // params.scene='Scene with Glow'
       obj.layers.toggle( BLOOM_SCENE );
       render();
    }

    this.toggleScene=function(obj){
        obj.layers.set( ENTIRE_SCENE );
        params.scene='Scene only'
        render();
    }

    
    window.onresize = function () {
    
        var width = engine.width
        // console.log(width)
        var height = engine.height
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
    
        renderer.setSize( width, height );
    
        bloomComposer.setSize( width, height );
        finalComposer.setSize( width, height );
    
        render();
    };
    
    function setupScene() {
    
        scene.traverse( disposeMaterial );
        scene.children.length = 0;
    
        var geometry = new THREE.IcosahedronBufferGeometry( 1, 4 );
    
            var color = new THREE.Color();
            color.setHSL( 0.5, 0.7, 0.2 );
    
            var material = new THREE.MeshBasicMaterial( { color: color } );
            var sphere = new THREE.Mesh( geometry, material );
            sphere.position.x = 0
            sphere.position.y = 0
            sphere.position.z =50
            // sphere.position.normalize().multiplyScalar( Math.random() * 4.0 + 2.0 );
            sphere.scale.setScalar(10);
            scene.add( sphere );
    
            // if ( Math.random() < 0.25 ) sphere.layers.enable( BLOOM_SCENE );
           
        render();
    
    }


    function disposeMaterial( obj ) {
    
        if ( obj.material ) {
    
            obj.material.dispose();
    
        }
    
    }
   
    function render() {
        // console.log(params.scene)
        switch ( params.scene ) {
           
            case 'Scene only':
                renderer.render( scene, camera );
                break;
            case 'Glow only':
                renderBloom( false );
                break;
            case 'Scene with Glow':
            default:
                // render scene with bloom
                renderBloom( true );
                renderer.render( scene, camera );
                finalComposer.render();
                break;
    
        }
    
    }
    
    function renderBloom( mask ) {
    
        if ( mask === true ) {
            //.traverse ( callback : Function ) : null
            // callback - 以一个object3D对象作为第一个参数的函数。
            // 在对象以及后代中执行的回调函数。
            scene.traverse( darkenNonBloomed );
            bloomComposer.render();
            scene.traverse( restoreMaterial );
    
        } else {
    
            camera.layers.set( BLOOM_SCENE );
            bloomComposer.render();
            camera.layers.set( ENTIRE_SCENE );
    
        }
    
    }
    
    function darkenNonBloomed( obj ) {
    //如果传入图层对象与当前对象属于相同的一组图层，则返回 true，否则返回 false
        if ( obj.isMesh && bloomLayer.test( obj.layers ) === false ) {
    
            materials[ obj.uuid ] = obj.material;
            obj.material = darkMaterial;
        }
    } 
    function restoreMaterial( obj ) {
    
        if ( materials[ obj.uuid ] ) {
    
            obj.material = materials[ obj.uuid ];
            delete materials[ obj.uuid ];
    
        }
    
    }

}