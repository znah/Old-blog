"use strict";


var TrackShaderUniforms = {
    img_size:          { type: "v2", value: null },
    depth_range:       { type: "v2", value: null },
    focal_coef:        { type: "f", value: null },
    R:                 { type: "m4", value: null },

    track_scale_z:     { type: "f", value: 100.0 },
    track_offset_z:    { type: "f", value: -27.0 },
    point_scale:       { type: "f", value: 20.0 },
    color1:            { type: "c", value: new THREE.Color(0x14ffb9) },
    color2:            { type: "c", value: new THREE.Color(0xd4bb6a) },

    global_time:       { type: "f", value: 0.0 }
};

var TrackShaderVP = [
"    uniform vec2 img_size;",
"    uniform vec2 depth_range;",
"    uniform float focal_coef;",
"    uniform mat4 R;",

"    uniform float track_scale_z;",
"    uniform float track_offset_z;",
"    uniform float point_scale;",
"    uniform vec3 color1;",
"    uniform vec3 color2;",

"    uniform float global_time;",

"    attribute float size;",
"    attribute float time;",

"    varying vec3 vColor;",
"    varying float vT;",
    
"    void main()",
"    {",
"       vec3 wld_pos = position;",
"       wld_pos.xy = (wld_pos.xy-0.5*img_size)*focal_coef*wld_pos.z;",
"       wld_pos.y *= -1.0;",
"       wld_pos.z = depth_range[0]-wld_pos.z;",
"       wld_pos = (R * vec4(wld_pos, 1.0)).xyz;",
"       vT = global_time-time;",
"       if (vT < 0.0)",
"       {",
"           gl_PointSize = 0.0;",
"           gl_Position = vec4(0.0);",
"           return;",
"       }",
"       float time_z = vT*track_scale_z+track_offset_z;",
"       wld_pos.z = mix(time_z, wld_pos.z, exp(-vT*vT));",

"       vec4 mvPosition = modelViewMatrix * vec4( wld_pos, 1.0 );",
"       gl_PointSize = point_scale * size * ( 1.0 / length( mvPosition.xyz ) );",
"       gl_PointSize *= min(vT*10.0, 1.0); ",
"       gl_Position = projectionMatrix * mvPosition;",
"       vColor = mix(color1, color2, size/90.0);",
"    }",
].join('\n');


var TrackParticleShader = {
    uniforms:  TrackShaderUniforms,
    vertexShader: TrackShaderVP, 

    fragmentShader: [
"       varying vec3 vColor;",
"       varying float vT;",
"       void main() {",
"           float d = length(gl_PointCoord-vec2(0.5))*2.0;",
"           if (d > 1.0)",
"               discard;",
"           d = clamp(d*4.0-3.0, 0.0, 1.0);",
"           gl_FragColor = vec4(mix(vColor, vec3(0.0), d), 1.0 );",
"       }"].join('\n'),
};

var TrackLineShader = {
    uniforms:  TrackShaderUniforms,
    vertexShader: TrackShaderVP, 

    fragmentShader: [
"       varying vec3 vColor;",
"       varying float vT;",
"       void main() {",
"           if (vT < 0.0)",
"               discard;",
"           gl_FragColor = vec4( vColor, 1.0 );",
"       }"].join('\n'),
};

function JuggleTracks(ctx)
{
    var particleMaterial = new THREE.ShaderMaterial( TrackParticleShader );
    var lineMaterial = new THREE.ShaderMaterial( TrackLineShader );
    var tracksObject = new THREE.Object3D();
    var geometry = new THREE.BufferGeometry();

    var particles = new THREE.Points( geometry, particleMaterial );
    particles.frustumCulled = false;
    tracksObject.add( particles );

    TrackShaderUniforms.img_size.value = ctx.params.img_size;
    TrackShaderUniforms.focal_coef.value = ctx.params.focal_coef;
    TrackShaderUniforms.depth_range.value = ctx.params.depth_range;
    TrackShaderUniforms.R.value = new THREE.Matrix4().makeRotationX(THREE.Math.degToRad(ctx.data.tilt));


    ctx.gui.add(TrackShaderUniforms.track_scale_z, 'value', 20.0, 200.0).name('track_scale_z');
    //ctx.gui.add(TrackShaderUniforms.track_offset_z, 'value', -50.0, 50.0).name('track_offset_z');

    var data = ctx.data;

    var n = data.points.length;
    var pos_array = new Float32Array(n*3);
    var size_array = new Float32Array(n);
    var time_array = new Float32Array(n);
    for (var i = 0; i < n; ++i)
    {
        pos_array[i*3]   = data.points[i][0]
        pos_array[i*3+1] = data.points[i][1]
        pos_array[i*3+2] = data.points[i][2]*0.1;
        time_array[i] = data.points[i][3]
        size_array[i] = data.points[i][4]
    }
    geometry.addAttribute( 'position', new THREE.BufferAttribute( pos_array, 3 ) );
    geometry.addAttribute( 'size', new THREE.BufferAttribute( size_array, 1 ) );
    geometry.addAttribute( 'time', new THREE.BufferAttribute( time_array, 1 ) );

    for (var tr_i = 0; tr_i < data.tracks.length; ++tr_i)
    {
        var line_material = new THREE.LineBasicMaterial( { linewidth: 1 } );
        var line_geometry = new THREE.BufferGeometry();
        line_geometry.addAttribute('position', geometry.attributes.position);
        line_geometry.addAttribute('size', geometry.attributes.size);
        line_geometry.addAttribute('time', geometry.attributes.time);
        var tr = data.tracks[tr_i]; 
        var n = tr.length;
        var index = new Uint16Array((n-1)*2);
        for (var i = 0; i < n-1; i++)
        {
            index[i*2] = tr[i]; index[i*2+1] = tr[i+1];
        }
        line_geometry.setIndex( new THREE.BufferAttribute( index, 1 ) );
        var trackLine = new THREE.LineSegments( line_geometry,  lineMaterial );
        trackLine.frustumCulled = false;
        tracksObject.add(trackLine);
    }
    ctx.scene.add(tracksObject);


    this.update = function(time)
    {
        TrackShaderUniforms.global_time.value = time;
    }
}