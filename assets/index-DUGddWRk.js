(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),t.credentials=e.crossOrigin===`use-credentials`?`include`:e.crossOrigin===`anonymous`?`omit`:`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var e=`/assets/kinesis-p8MnHr2e.webp`,t=`/assets/websqz-DiQPNRjy.webp`,n=`/assets/cuboid-oi_IdSre.webp`,r=`/assets/proteinsyntese-CQ_icfZ4.webp`,i=`/assets/vape-lyfe-BG8VFfmH.webp`,a=`/assets/manifold-OakKahVq.webp`,o=`/assets/linerider-CZ-xIvcC.webp`,s=`/assets/halipleumon-DRLAsbCS.webp`,c=`/assets/in-particular-Bg03pPJU.webp`,l=`/assets/opaque-BsSPoTvd.webp`,u=`/assets/mod-D24Dut6N.webp`,d=`/assets/translucent-DcFFYge9.webp`,f=`/assets/overworld-BPPqTct7.webp`,p=`/assets/underworld-DE1d3H2W.webp`,m=`/assets/class-S_hOjNip.webp`,h=e=>`https://www.pouet.net/prod.php?which=${e}`,g=[{title:`kinesis`,year:2026,party:`TRSAC`,run:`kinesis/index.html`,pouet:h(107224),image:e},{title:`websqz`,year:2025,party:`Black Valley`,type:`32k`,pouet:h(104467),image:t},{title:`Cuboid`,year:2023,party:`Black Valley`,type:`64k`,pouet:h(94654),image:n},{title:`proteinsyntese`,year:2023,party:`Lovebyte`,type:`64b`,pouet:h(93688),image:r},{title:`vape lyfe`,year:2023,party:`Lovebyte`,type:`128b`,pouet:h(93689),image:i},{title:`manifold`,year:2022,party:`Black Valley`,type:`16k`,pouet:h(91824),image:a},{title:`linerider`,year:2022,party:`Revision`,type:`256b`,pouet:h(91316),image:o},{title:`halipleumon`,year:2018,party:`TRSAC`,type:`8k`,pouet:h(78641),image:s},{title:`In Particular`,year:2018,party:`Revision`,type:`1k`,pouet:h(75811),image:c},{title:`Opaque`,year:2017,party:`TRSAC`,type:`4k`,pouet:h(71979),image:l},{title:`mod`,year:2017,party:`Solskogen`,type:`8k`,pouet:h(70975),image:u},{title:`Translucent`,year:2017,party:`Revision`,type:`4k`,pouet:h(69643),image:d},{title:`Overworld`,year:2016,party:`The Gathering`,type:`demo`,pouet:h(67153),image:f},{title:`Underworld`,year:2015,party:`The Gathering`,type:`demo`,pouet:h(65347),image:p},{title:`Class`,year:2014,party:`Kindergarden`,type:`demo`,pouet:h(64351),image:m}],_=10,v=32,y=4e3,b=1.2,x=2.2,S=2*x/b,C=.22,w=`
const BOX = ${_.toFixed(1)};
const GRID = ${v}u;
const F = ${b.toFixed(4)};
const NEAR = 0.4;
const RADIUS = 0.035;   // of the largest, in metres
const MAX_SIZE = 18.0;  // CSS pixels, in focus
const MIN_SIZE = 1.5;
// The depth of field: the distance in focus, how deep a band either side of it is sharp too, how
// fast it blurs past that, and the most it blurs, in CSS pixels across
const FOCUS = ${x.toFixed(4)};
const FOCUS_DEPTH = 0.12;
const APERTURE = 0.6;
const MAX_BLUR = 220.0;

struct Particle { pos: vec3f, size: f32, vel: vec3f, hue: f32 }

struct Sim {
  cam: vec3f, time: f32,
  right: vec3f, dt: f32,          // dt in 60ths of a second
  up: vec3f, aspect: f32,
  fwd: vec3f, pad0: f32,
  pointer: vec2f, pointerOn: f32, pad1: f32,
  viewport: vec2f, opacity: f32, count: u32,
  colA: vec3f, pad2: f32,
  colB: vec3f, pad3: f32,
  bg: vec3f, pad4: f32,
}

// The nearest repeat of d, from the camera
fn wrapd(d: vec3f) -> vec3f { return d - BOX * round(d / BOX); }
fn toView(rel: vec3f) -> vec3f { return vec3f(dot(rel, sim.right), dot(rel, sim.up), dot(rel, sim.fwd)); }
fn toClip(v: vec3f) -> vec2f { return vec2f(v.x / v.z * F / sim.aspect, v.y / v.z * F); }
// Fading out toward the box's edge, where it repeats, and just in front of the camera
fn fadeOf(rel: vec3f, v: vec3f) -> f32 {
  return clamp((BOX * 0.5 - length(rel)) / 1.8, 0.0, 1.0) * clamp((v.z - NEAR) / 0.8, 0.0, 1.0);
}
// How blurred something at depth z is: its circle of confusion, in CSS pixels across
fn blurAt(z: f32) -> f32 {
  return min(MAX_BLUR, APERTURE * max(0.0, abs(z - FOCUS) - FOCUS_DEPTH) / z * F * sim.viewport.y * 0.5);
}
`,T=`
${w}
@group(0) @binding(0) var<uniform> sim: Sim;
@group(0) @binding(1) var<storage, read_write> ps: array<Particle>;
@group(0) @binding(2) var<storage, read_write> grid: array<atomic<u32>>;

fn cellOf(p: vec3f) -> vec3i {
  return vec3i(floor((p / BOX + 0.5) * f32(GRID))) & vec3i(i32(GRID) - 1);
}
fn countAt(c: vec3i) -> f32 {
  let w = c & vec3i(i32(GRID) - 1);
  return f32(atomicLoad(&grid[(u32(w.x) * GRID + u32(w.y)) * GRID + u32(w.z)]));
}

@compute @workgroup_size(64)
fn deposit(@builtin(global_invocation_id) id: vec3u) {
  if (id.x >= sim.count) { return; }
  let c = cellOf(ps[id.x].pos);
  atomicAdd(&grid[(u32(c.x) * GRID + u32(c.y)) * GRID + u32(c.z)], 1u);
}

@compute @workgroup_size(64)
fn update(@builtin(global_invocation_id) id: vec3u) {
  if (id.x >= sim.count) { return; }
  var p = ps[id.x];
  let k = sim.dt;
  var v = p.vel;

  // Two octaves of ABC flow, which neither gathers nor spreads them, with slowly wandering phases.
  // Both repeat with the box
  let t = sim.time;
  let w = 6.2831853 / BOX;
  let q = p.pos * w + vec3f(t * 0.008, t * 0.006, t * 0.004);
  let r = p.pos * w * 3.0 + vec3f(1.7 - t * 0.011, 4.1 + t * 0.009, 2.9 - t * 0.007);
  let flow = vec3f(
    sin(q.z) + cos(q.y) + 0.5 * (sin(r.y) + cos(r.z)),
    sin(q.x) + cos(q.z) + 0.5 * (sin(r.z) + cos(r.x)),
    sin(q.y) + cos(q.x) + 0.5 * (sin(r.x) + cos(r.y)));
  v += flow * 0.000008 * k;

  // Out of crowded cells, down the count's slope
  let c = cellOf(p.pos);
  let slope = vec3f(
    countAt(c + vec3i(1, 0, 0)) - countAt(c - vec3i(1, 0, 0)),
    countAt(c + vec3i(0, 1, 0)) - countAt(c - vec3i(0, 1, 0)),
    countAt(c + vec3i(0, 0, 1)) - countAt(c - vec3i(0, 0, 1)));
  v -= slope * 0.0000015 * k;

  // The pointer pushes aside what's near it on screen, across the view
  if (sim.pointerOn > 0.0) {
    let view = toView(wrapd(p.pos - sim.cam));
    if (view.z > NEAR) {
      let clip = toClip(view);
      let screen = vec2f(clip.x * 0.5 + 0.5, 0.5 - clip.y * 0.5) * sim.viewport;
      let e = screen - sim.pointer;
      let d = length(e);
      if (d < 140.0) {
        let f = pow(1.0 - d / 140.0, 2.0) * 0.0006 * k;
        let dir = e / (d + 0.01);
        v += (sim.right * dir.x - sim.up * dir.y) * f;
      }
    }
  }

  v *= pow(0.985, k);
  var pos = p.pos + v * k;
  pos -= BOX * floor(pos / BOX + 0.5);
  p.pos = pos;
  p.vel = v;
  ps[id.x] = p;
}

`,E=`
${w}
@group(0) @binding(0) var<uniform> sim: Sim;
@group(0) @binding(1) var<storage, read> ps: array<Particle>;

struct Out {
  @builtin(position) pos: vec4f,
  @location(0) uv: vec2f,
  @location(1) col: vec3f,
  @location(2) soft: f32,
}

@vertex
fn pointVS(@builtin(vertex_index) vi: u32, @builtin(instance_index) ii: u32) -> Out {
  var corners = array(vec2f(-1, -1), vec2f(1, -1), vec2f(-1, 1), vec2f(-1, 1), vec2f(1, -1), vec2f(1, 1));
  var out: Out;
  let p = ps[ii];
  let rel = wrapd(p.pos - sim.cam);
  let v = toView(rel);
  let f = fadeOf(rel, v);
  if (v.z < NEAR || f <= 0.0) {
    out.pos = vec4f(0.0, 0.0, 2.0, 1.0);
    return out;
  }
  // Its size in focus, spread by its blur, and dimmed as it spreads, though far less than by the
  // area, so even the largest blurs still show. The smallest are drawn at MIN_SIZE and dimmed
  // instead, so they don't shimmer
  let sharp = min(MAX_SIZE, 2.0 * RADIUS * F / v.z * sim.viewport.y * 0.5) * p.size;
  var size = max(sharp, blurAt(v.z));
  var dim = 0.11 + 0.89 * (sharp / size);
  if (size < MIN_SIZE) {
    dim = (size / MIN_SIZE) * (size / MIN_SIZE);
    size = MIN_SIZE;
  }
  let c = corners[vi];
  out.pos = vec4f(toClip(v) + c * size / sim.viewport, 0.0, 1.0);
  out.uv = c;
  out.col = mix(sim.colA, sim.colB, p.hue) * sim.opacity * f * dim;
  out.soft = 1.0 - sharp / size;
  return out;
}

// A disc, with a crisp edge in focus and a soft one out of it
@fragment
fn pointFS(frag: Out) -> @location(0) vec4f {
  let r = length(frag.uv);
  if (r > 1.0) { discard; }
  // Blurred, it's an even disc with a soft rim, like bokeh
  let edge = 1.0 - smoothstep(mix(0.7, 0.35, frag.soft), 1.0, r);
  return vec4f(frag.col * edge, 1.0);
}
`,D=`
${w}
@group(0) @binding(0) var<uniform> sim: Sim;
@group(0) @binding(1) var light: texture_2d<f32>;

@vertex
fn fullVS(@builtin(vertex_index) vi: u32) -> @builtin(position) vec4f {
  return vec4f(vec2f(f32((vi << 1u) & 2u), f32(vi & 2u)) * 2.0 - 1.0, 0.0, 1.0);
}

const GRAIN = 4.0;  // in 8-bit steps, peak to peak

// Interleaved gradient noise, 0 to 1
fn ign(p: vec2f) -> f32 { return fract(52.9829189 * fract(dot(p, vec2f(0.06711056, 0.00583715)))); }

// A PCG hash, for the grain
fn pcg(v: u32) -> u32 {
  let s = v * 747796405u + 2891336453u;
  let w = ((s >> ((s >> 28u) + 4u)) ^ s) * 277803737u;
  return (w >> 22u) ^ w;
}

@fragment
fn presentFS(@builtin(position) pos: vec4f) -> @location(0) vec4f {
  let c = textureLoad(light, vec2i(pos.xy), 0).rgb + sim.bg;
  let dither = ign(pos.xy) + ign(pos.xy + vec2f(47.0, 17.0)) - 1.0;
  let frame = u32(sim.time * 24.0);
  let seed = u32(pos.x) + u32(pos.y) * 8192u + frame * 67108864u;
  let grain = f32(pcg(seed)) / 4294967295.0 - 0.5;
  return vec4f(c + (dither + grain * GRAIN) / 255.0, 1.0);
}

`;async function O(e){let t=await(await navigator.gpu?.requestAdapter())?.requestDevice(),n=e.getContext(`webgpu`);if(!t||!n)return;let r=navigator.gpu.getPreferredCanvasFormat();n.configure({device:t,format:r,alphaMode:`opaque`});let i=new Float32Array(y*8);for(let e=0;e<y;e++){for(let t=0;t<3;t++)i[e*8+t]=(Math.random()-.5)*_;i[e*8+3]=.1+1.1*Math.random()**4,i[e*8+7]=+(Math.random()<.15)}let a=(e,n)=>t.createBuffer({size:e,usage:n}),o=GPUBufferUsage,s=a(144,o.UNIFORM|o.COPY_DST),c=a(i.byteLength,o.STORAGE|o.COPY_DST);t.queue.writeBuffer(c,0,i);let l=a(v**3*4,o.STORAGE|o.COPY_DST),u=t.createShaderModule({code:T}),d=t.createBindGroupLayout({entries:[{binding:0,visibility:GPUShaderStage.COMPUTE,buffer:{type:`uniform`}},{binding:1,visibility:GPUShaderStage.COMPUTE,buffer:{type:`storage`}},{binding:2,visibility:GPUShaderStage.COMPUTE,buffer:{type:`storage`}}]}),f=t.createBindGroup({layout:d,entries:[s,c,l].map((e,t)=>({binding:t,resource:{buffer:e}}))}),p=t.createPipelineLayout({bindGroupLayouts:[d]}),m=e=>t.createComputePipeline({layout:p,compute:{module:u,entryPoint:e}}),h=m(`deposit`),g=m(`update`),b=t.createShaderModule({code:E}),x=t.createBindGroupLayout({entries:[{binding:0,visibility:GPUShaderStage.VERTEX,buffer:{type:`uniform`}},{binding:1,visibility:GPUShaderStage.VERTEX,buffer:{type:`read-only-storage`}}]}),w=t.createBindGroup({layout:x,entries:[s,c].map((e,t)=>({binding:t,resource:{buffer:e}}))}),O=t.createRenderPipeline({layout:t.createPipelineLayout({bindGroupLayouts:[x]}),vertex:{module:b,entryPoint:`pointVS`},fragment:{module:b,entryPoint:`pointFS`,targets:[{format:`rgba16float`,blend:{color:{srcFactor:`one`,dstFactor:`one`},alpha:{srcFactor:`one`,dstFactor:`one`}}}]}}),k=t.createShaderModule({code:D}),A=t.createBindGroupLayout({entries:[{binding:0,visibility:GPUShaderStage.FRAGMENT,buffer:{type:`uniform`}},{binding:1,visibility:GPUShaderStage.FRAGMENT,texture:{sampleType:`unfilterable-float`}}]}),j=t.createRenderPipeline({layout:t.createPipelineLayout({bindGroupLayouts:[A]}),vertex:{module:k,entryPoint:`fullVS`},fragment:{module:k,entryPoint:`presentFS`,targets:[{format:r}]}}),M,N,P=e=>{let t=getComputedStyle(document.documentElement).getPropertyValue(e).trim().replace(`#`,``);return t.length==3&&(t=[...t].map(e=>e+e).join(``)),[0,2,4].map(e=>parseInt(t.slice(e,e+2),16)/255||0)},F={bg:[0,0,0],a:[0,0,0],b:[0,0,0]},I=()=>F={bg:P(`--bg`),a:P(`--particle`),b:P(`--particle-accent`)};I();let L=innerWidth,R=innerHeight,z=()=>{L=innerWidth,R=innerHeight,e.width=Math.round(L*1),e.height=Math.round(R*1),M?.destroy(),M=t.createTexture({size:[e.width,e.height],format:`rgba16float`,usage:GPUTextureUsage.RENDER_ATTACHMENT|GPUTextureUsage.TEXTURE_BINDING}),N=t.createBindGroup({layout:A,entries:[{binding:0,resource:{buffer:s}},{binding:1,resource:M.createView()}]})},B={x:0,y:0,in:!1};addEventListener(`pointermove`,e=>{B.x=e.clientX,B.y=e.clientY,B.in=!0}),document.documentElement.addEventListener(`pointerleave`,()=>B.in=!1);let V=scrollY/R,H=[0,0],U=e=>{let t=e*.004+H[0]*.08,n=-H[1]*.05,r=[Math.sin(t)*Math.cos(n),Math.sin(n),Math.cos(t)*Math.cos(n)],i=[Math.cos(t),0,-Math.sin(t)],a=[r[1]*i[2]-r[2]*i[1],r[2]*i[0]-r[0]*i[2],r[0]*i[1]-r[1]*i[0]];return{cam:[0,-V*S,0],f:r,r:i,u:a}},W=new ArrayBuffer(144),G=new Float32Array(W),K=new Uint32Array(W),q=(r,i)=>{let{cam:a,f:o,r:c,u}=U(r);G.set(a,0),G[3]=r,G.set(c,4),G[7]=i,G.set(u,8),G[11]=L/R,G.set(o,12),G.set([B.x,B.y,+!!B.in],16),G.set([L,R,C],20),K[23]=y,G.set(F.a,24),G.set(F.b,28),G.set(F.bg,32),t.queue.writeBuffer(s,0,W);let d=t.createCommandEncoder();d.clearBuffer(l);let p=d.beginComputePass();p.setBindGroup(0,f);let m=Math.ceil(y/64);i>0&&(p.setPipeline(h),p.dispatchWorkgroups(m),p.setPipeline(g),p.dispatchWorkgroups(m)),p.end();let _=d.beginRenderPass({colorAttachments:[{view:M.createView(),clearValue:[0,0,0,0],loadOp:`clear`,storeOp:`store`}]});_.setBindGroup(0,w),_.setPipeline(O),_.draw(6,y),_.end();let v=d.beginRenderPass({colorAttachments:[{view:n.getCurrentTexture().createView(),loadOp:`clear`,storeOp:`store`}]});v.setBindGroup(0,N),v.setPipeline(j),v.draw(3),v.end(),t.queue.submit([d.finish()]),e.classList.add(`on`)},J=matchMedia(`(prefers-reduced-motion: reduce)`),Y=!1,X=0,Z=e=>{if(J.matches){Y=!1,H=[0,0],q(0,0);return}let t=X?Math.min(3,(e-X)/1e3*60):1;X=e,V=scrollY/R;let n=B.in?[B.x/L*2-1,B.y/R*2-1]:[0,0];H=H.map((e,r)=>e+(n[r]-e)*(1-Math.exp(-t/40))),q(e/1e3,t),requestAnimationFrame(Z)},Q=()=>{(!Y||J.matches)&&(Y=!0,X=0,requestAnimationFrame(Z))};z(),addEventListener(`resize`,()=>(z(),Q())),J.addEventListener(`change`,Q),document.addEventListener(`palettechange`,()=>(I(),Q())),Q()}var k=e=>e.replace(/[&<>"]/g,e=>`&#${e.charCodeAt(0)};`),A=[...new Set(g.map(e=>e.year))];document.querySelector(`#timeline`).innerHTML=A.map(e=>`<section><h2>${e}</h2><ul>${g.filter(t=>t.year==e).map(e=>`<li><a class="prod" href="${k(e.run??e.pouet)}"><img src="${e.image}" alt="" loading="lazy"><span class="title">${k(e.title)}</span><span class="meta">${k([e.party,e.type].filter(Boolean).join(` · `))}<em>${e.run?`run ▶`:`pouët ↗`}</em></span></a>`+(e.run?`<a class="also" href="${k(e.pouet)}">pouët ↗</a>`:``)+`</li>`).join(``)}</ul></section>`).join(``),O(document.querySelector(`canvas`));for(let e of document.querySelectorAll(`.prod`))e.onpointermove=t=>{let n=e.getBoundingClientRect(),r=(t.clientX-n.left)/n.width-.5,i=(t.clientY-n.top)/n.height-.5;e.style.setProperty(`--ry`,`${r*18}deg`),e.style.setProperty(`--rx`,`${-i*14}deg`)},e.onpointerleave=()=>{e.style.removeProperty(`--ry`),e.style.removeProperty(`--rx`)};