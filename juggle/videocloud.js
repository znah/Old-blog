"use strict";

var VideoCloudShader = {
    uniforms:       {
        video_tex: { type: "t", value: null },
        focal_coef: { type: "f", value: null },
        img_size: {type: "v2", value: null },
        depth_range: {type: "v2", value: null },
        R: {type: "m4", value: null }
    },
    side: THREE.DoubleSide,
    transparent: true,
    vertexShader:  [
"     uniform sampler2D video_tex;",
"     uniform float focal_coef;",
"     uniform vec2 img_size;",
"     uniform vec2 depth_range;",
"     uniform mat4 R;",

"     varying vec2 vUV;",

"     vec3 rgb2hsv(vec3 c)",
"     {",
"         vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);",
"         vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));",
"         vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));",

"         float d = q.x - min(q.w, q.y);",
"         float e = 1.0e-10;",
"         return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);",
"     }",

"     const float Q = 16.0;",
"     const float P = 0.2;",
"     void main() {",
"         vec3 z_rgb = texture2D(video_tex, vec2(uv.x*0.5+0.5, uv.y)).rgb;",
"         float z = mix(depth_range[0], depth_range[1], 1.0-z_rgb.r);",

"         //vec3 z_rgb = texture2D(video_tex, vec2(uv.x*0.5+0.5, uv.y)).rgb;",
"         //vec3 z_hsv = rgb2hsv(z_rgb);",
"         //float z1 = floor(z_hsv.x*Q);",
"         //float z2 = (z_hsv.z-P) / (1.0-P);",
"         //if (mod(z1, 2.0)<1.0)",
"         //    z2 = 1.0 - z2;",
"         //float z = (z1+z2)/Q*300.0 + 100.0;",

"         vec3 pos = vec3((uv-vec2(0.5))*img_size*focal_coef, -1.0)*z;",
"         pos.z += depth_range[0];",
"         pos = (R * vec4(pos, 1.0)).xyz;",

"         vec4 mvPosition = modelViewMatrix * vec4( pos, 1.0 );",
"         vUV = uv;",
"         gl_Position = projectionMatrix * mvPosition;",
"     }"].join('\n'), 

    fragmentShader: [
"     #extension GL_OES_standard_derivatives : require",

"     uniform sampler2D video_tex;",
"     uniform vec2 img_size;",
"     varying vec2 vUV;",

"     float calc_stretch()",
"     {",
"         vec2 tc = vUV * img_size;",
"         vec2 dx = dFdx(tc);",
"         vec2 dy = dFdy(tc);",
"         float l2 = max( dot(dx,dx), dot(dy,dy) );",
"         float area = abs(dx.x*dy.y - dy.x*dx.y);",
"         return l2 / area;",
"     }",

"     void main() {",
"         float str = calc_stretch();",
"         if (calc_stretch()>5.0)",
"             discard;",
"         float z = texture2D( video_tex, vec2(vUV.x*0.5+0.5, vUV.y) ).r;",
"         if (z < 0.1)",
"             discard;",
"         if (gl_FrontFacing)",
"         {",
"             gl_FragColor = texture2D( video_tex, vec2(vUV.x*0.5, vUV.y) );",
"         } else {",
"             gl_FragColor = vec4(vec3(z), 0.3);",
"         }",

"     }"].join('\n'),
};

function VideoTex(url)
{
    // video.type = ' video/ogg; codecs="theora, vorbis" ';
    this.video = document.createElement( 'video' );
    this.video.src = url;
    this.video.load(); // must call after setting/changing source
    this.video.play();

    this.tex = new THREE.Texture( this.video );
    this.tex.minFilter = THREE.LinearFilter;
    this.tex.magFilter = THREE.LinearFilter;
    this.tex.format = THREE.RGBFormat;
    this.tex.generateMipmaps = false;

    this.update = function()
    {
        if (this.video.readyState === this.video.HAVE_ENOUGH_DATA)
            this.tex.needsUpdate = true;
    }
}

function VideoCloud(ctx)
{
    this.cloudVideo = new VideoTex("data/juggle.mp4");

    var restarter = function()
    {
        this.currentTime = 0;
        this.play();
    }

    this.cloudVideo.video.addEventListener('ended', restarter, false);

    var movieMaterial = new THREE.ShaderMaterial( VideoCloudShader );
    movieMaterial.uniforms.video_tex.value = this.cloudVideo.tex;
    movieMaterial.uniforms.img_size.value = ctx.params.img_size;
    movieMaterial.uniforms.focal_coef.value = ctx.params.focal_coef;
    movieMaterial.uniforms.depth_range.value = ctx.params.depth_range;
    movieMaterial.uniforms.R.value = new THREE.Matrix4().makeRotationX(THREE.Math.degToRad(ctx.data.tilt));

    var sz = ctx.params.img_size;
    var movieGeometry = new THREE.PlaneGeometry( sz.x, sz.y, sz.x, sz.y );
    var movieScreen = new THREE.Mesh( movieGeometry, movieMaterial );
    movieScreen.position.set(0,0,0);

    ctx.scene.add(movieScreen);

    this.update = function()
    {
        this.cloudVideo.video.playbackRate = ctx.params.playbackRate;
        this.cloudVideo.update();
    }

    this.get_time = function()
    {
        return this.cloudVideo.video.currentTime;
    }
}