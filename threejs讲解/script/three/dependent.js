document.write( 
`
<!-- 引入后处理 -->
  <script src="./js/postprocessing/EffectComposer.js"></script>
  <script src="./js/postprocessing/RenderPass.js"></script>
  <script src="./js/postprocessing/ShaderPass.js"></script>
  <script src="./js/postprocessing/UnrealBloomPass.js"></script>
  <script src="./js/postprocessing/OutlinePass.js"></script>
  <script src="./js/postprocessing/BloomPass.js"></script>
  <script src="./js/postprocessing/SSAARenderPass.js"></script>
  <script src="./js/postprocessing/TAARenderPass.js"></script>

  <!-- SSAO --> 
  <script src="./js/shaders/SSAOShader.js"></script>
  <script src="./js/postprocessing/SSAOPass.js"></script>

  <!-- 引入后期处理通道js -->
  <script src="./js/shaders/CopyShader.js"></script>
  <script src="./js/shaders/SAOShader.js"></script>
  <script src="./js/shaders/DepthLimitedBlurShader.js"></script>
  <script src="./js/shaders/UnpackDepthRGBAShader.js"></script>
  <script src="./js/shaders/BloomShader.js"></script>
  <script src="./js/shaders/LuminosityHighPassShader.js"></script>
  `
  )