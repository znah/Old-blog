var SkydomeShader = 
{
    uniforms:       {
        topColor:    { type: "c", value: new THREE.Color( 0x0077ff ) },
        bottomColor: { type: "c", value: new THREE.Color( 0xffffff ) },
        offset:      { type: "f", value: 33 },
        exponent:    { type: "f", value: 0.6 }
    },
    side: THREE.BackSide,
    vertexShader:  [
"       varying vec3 vWorldPosition;",

"       void main() {",
"           vec4 worldPosition = modelMatrix * vec4( position, 1.0 );",
"           vWorldPosition = worldPosition.xyz;",
"           gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",
"       }"].join('\n'), 

    fragmentShader: [
"       uniform vec3 topColor;",
"       uniform vec3 bottomColor;",
"       uniform float offset;",
"       uniform float exponent;",

"       varying vec3 vWorldPosition;",

"       void main() {",
"           float h = normalize( vWorldPosition + offset ).y;",
"           gl_FragColor = vec4( mix( bottomColor, topColor, max( pow( h, exponent ), 0.0 ) ), 1.0 );",
"       }"].join('\n'),
};


var Skydome = function(ctx)
{
    var fld = ctx.gui.addFolder('Skydome');
    var u = SkydomeShader.uniforms;
    var params = {
    	topColor : "#7b07ff",
    	bottomColor : "#7d7d7d"
    }

    var update = function()
    {
    	u.topColor.value.set(params.topColor);
    	u.bottomColor.value.set(params.bottomColor);
    }
    update();

    fld.addColor(params, 'topColor').onChange(update);
    fld.addColor(params, 'bottomColor').onChange(update);
    
    var skyGeo = new THREE.SphereGeometry( 2000, 32, 15 );
    var skyMat = new THREE.ShaderMaterial( SkydomeShader );
    var sky = new THREE.Mesh( skyGeo, skyMat );
    ctx.scene.add( sky );


}
