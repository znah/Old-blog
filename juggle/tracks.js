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

var TrackShaderAttributes = {
    pos:   { type: 'v3', value: null },
    size:  { type: 'f',  value: null },
    time:  { type: 'f',  value: null },
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
    attributes:  TrackShaderAttributes,
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
    attributes: TrackShaderAttributes,
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


function load_json(url, onready)
{
    var r = new XMLHttpRequest();
    r.open("GET", url, true);
    r.onreadystatechange = function () {
      if (r.readyState != 4 || r.status != 200) return;
      var json = JSON.parse(r.responseText);
      onready(json);
    };
    r.send();
}


function JuggleTracks(ctx)
{
    var particleMaterial = new THREE.ShaderMaterial( TrackParticleShader );
    var lineMaterial = new THREE.ShaderMaterial( TrackLineShader );
    var tracksObject = new THREE.Object3D();
    var geometry = new THREE.BufferGeometry();

    var particles = new THREE.ParticleSystem( geometry, particleMaterial );
    tracksObject.add( particles );

    TrackShaderUniforms.img_size.value = ctx.params.img_size;
    TrackShaderUniforms.focal_coef.value = ctx.params.focal_coef;
    TrackShaderUniforms.depth_range.value = ctx.params.depth_range;
    TrackShaderUniforms.R.value = new THREE.Matrix4().makeRotationX(THREE.Math.degToRad(ctx.params.tilt));


    ctx.gui.add(TrackShaderUniforms.track_scale_z, 'value', 20.0, 200.0).name('track_scale_z');
    ctx.gui.add(TrackShaderUniforms.track_offset_z, 'value', -50.0, 50.0).name('track_offset_z');

    load_json("data/juggle.json", function(data)
    {
        var n = data.points.length;
        geometry.addAttribute( 'position', Float32Array, n, 3 );
        geometry.addAttribute( 'size', Float32Array, n, 1 );
        geometry.addAttribute( 'time', Float32Array, n, 1 );
        var pos_array = geometry.attributes.position.array;
        var size_array = geometry.attributes.size.array;
        var time_array = geometry.attributes.time.array;
        for (var i = 0; i < n; ++i)
        {
            pos_array[i*3]   = data.points[i][0]
            pos_array[i*3+1] = data.points[i][1]
            pos_array[i*3+2] = data.points[i][2]*0.1;
            time_array[i] = data.points[i][3]
            size_array[i] = data.points[i][4]
        }

        for (var tr_i = 0; tr_i < data.tracks.length; ++tr_i)
        {
            var line_material = new THREE.LineBasicMaterial( { linewidth: 1 } );
            var line_geometry = new THREE.BufferGeometry();
            var trackLine = new THREE.Line( line_geometry,  lineMaterial );
            line_geometry.attributes.position = geometry.attributes.position;
            line_geometry.attributes.size = geometry.attributes.size;
            line_geometry.attributes.time = geometry.attributes.time;
            var tr = data.tracks[tr_i]; 
            var n = tr.length;
            line_geometry.addAttribute( 'index', Uint16Array, (n-1)*2, 1 );
            line_geometry.offsets = [ {start:0, index:0, count:(n-1)*2} ]
            var index = line_geometry.attributes.index.array;
            for (var i = 0; i < n-1; i++)
            {
                index[i*2] = tr[i]; index[i*2+1] = tr[i+1];
            }
            tracksObject.add(trackLine);
        }
        ctx.scene.add(tracksObject);
    });

    this.update = function(time)
    {
        TrackShaderUniforms.global_time.value = time;
    }
}