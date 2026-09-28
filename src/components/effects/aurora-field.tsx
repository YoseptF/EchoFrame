import { useEffect, useRef, useState } from "react";
import { useEffects } from "./motion-system";

const vertex = `attribute vec2 a_position;
void main(){gl_Position=vec4(a_position,0.0,1.0);}`;
const fragment = `precision mediump float;
uniform vec2 u_resolution;
uniform vec2 u_pointer;
uniform float u_time;
uniform float u_scroll;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
void main(){
  vec2 uv=gl_FragCoord.xy/u_resolution;
  vec2 p=(gl_FragCoord.xy-0.5*u_resolution)/u_resolution.y;
  float t=u_time*0.16;
  p+=vec2((u_pointer.x-.5)*.24,(u_pointer.y-.5)*.18);
  p.y+=u_scroll*.22;
  vec2 m=(u_pointer-.5)*vec2(u_resolution.x/u_resolution.y,1.0);
  float ripple=sin(length(p-m)*17.0-t*6.0)*.035*exp(-length(p-m)*1.8);
  float bend=p.y+p.x*.36-.05+ripple;
  vec3 col=vec3(0.0);
  for(int i=0;i<7;i++){
    float fi=float(i);
    float ribbon=bend+sin(p.x*1.65+t+fi*.28)*.23+sin(p.x*3.1-t*.7+fi*.38)*.065+fi*.026;
    float core=.0035/(abs(ribbon)+.014);
    float halo=exp(-abs(ribbon)*7.0)*.035;
    vec3 tint=mix(vec3(.52,.94,.31),vec3(.06,.70,.82),smoothstep(-.5,.8,p.x+sin(t+fi*.2)*.5));
    col+=tint*(core+halo)*.62;
  }
  float glow=exp(-length(p-vec2(.65,-.1)) *2.3);
  col+=vec3(.06,.28,.24)*glow;
  col*=smoothstep(0.0,.18,uv.y)*(1.0-smoothstep(.62,1.0,uv.y));
  col+=vec3(hash(uv*100.0)*.011);
  gl_FragColor=vec4(col,1.0);
}`;

/** One low-resolution shader; no render loop while hidden, paused, or outside the viewport. */
export function AuroraField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { enabled } = useEffects();
  const enabledRef = useRef(enabled);
  const syncRef = useRef<() => void>(() => {});
  const [generation, setGeneration] = useState(0);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    enabledRef.current = enabled;
    syncRef.current();
  }, [enabled]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let gl: WebGLRenderingContext | null = null;
    try {
      gl = canvas.getContext("webgl", {
        alpha: false,
        antialias: false,
        depth: false,
        powerPreference: "low-power",
      });
    } catch {
      return;
    }
    if (!gl) return;
    const context = gl;
    const shaders: WebGLShader[] = [];
    let program: WebGLProgram | null = null;
    let buffer: WebGLBuffer | null = null;
    let raf = 0;
    let inView = false;
    let lost = false;
    let last = 0;
    let elapsed = 0;
    const target = [0.5, 0.5];
    const pointer = [0.5, 0.5];
    const hero = canvas.closest("section")!;
    const coarse = matchMedia("(pointer: coarse)").matches;
    const interval = 1000 / (coarse ? 24 : 30);
    function compile(type: number, source: string) {
      const shader = context.createShader(type);
      if (!shader) throw new Error("shader allocation");
      shaders.push(shader);
      context.shaderSource(shader, source);
      context.compileShader(shader);
      if (!context.getShaderParameter(shader, context.COMPILE_STATUS))
        throw new Error("shader compile");
      return shader;
    }
    try {
      program = context.createProgram();
      if (!program) throw new Error("program allocation");
      context.attachShader(program, compile(context.VERTEX_SHADER, vertex));
      context.attachShader(program, compile(context.FRAGMENT_SHADER, fragment));
      context.linkProgram(program);
      if (!context.getProgramParameter(program, context.LINK_STATUS))
        throw new Error("shader link");
      context.useProgram(program);
      buffer = context.createBuffer();
      context.bindBuffer(context.ARRAY_BUFFER, buffer);
      context.bufferData(
        context.ARRAY_BUFFER,
        new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
        context.STATIC_DRAW,
      );
      const position = context.getAttribLocation(program, "a_position");
      context.enableVertexAttribArray(position);
      context.vertexAttribPointer(position, 2, context.FLOAT, false, 0, 0);
    } catch {
      shaders.forEach((s) => context.deleteShader(s));
      if (program) context.deleteProgram(program);
      if (buffer) context.deleteBuffer(buffer);
      return;
    }
    const resolution = context.getUniformLocation(program, "u_resolution");
    const time = context.getUniformLocation(program, "u_time");
    const mouse = context.getUniformLocation(program, "u_pointer");
    const scroll = context.getUniformLocation(program, "u_scroll");
    let scrollOffset = 0;
    function draw() {
      if (lost) return;
      context.viewport(0, 0, canvas!.width, canvas!.height);
      context.uniform2f(resolution, canvas!.width, canvas!.height);
      context.uniform1f(time, elapsed * 0.001);
      context.uniform2f(mouse, pointer[0]!, pointer[1]!);
      context.uniform1f(scroll, scrollOffset);
      context.drawArrays(context.TRIANGLES, 0, 6);
    }
    function resize() {
      const rect = canvas!.getBoundingClientRect();
      const ratio = Math.min(
        devicePixelRatio || 1,
        1.25,
        (coarse ? 900 : 1400) / Math.max(rect.width, 1),
        900 / Math.max(rect.height, 1),
      );
      canvas!.width = Math.max(1, Math.round(rect.width * ratio));
      canvas!.height = Math.max(1, Math.round(rect.height * ratio));
      draw();
    }
    function tick(now: number) {
      raf = 0;
      if (lost || !enabledRef.current || !inView || document.hidden) return;
      if (now - last >= interval) {
        elapsed += last ? Math.min(now - last, 60) : 0;
        last = now;
        pointer[0]! += (target[0]! - pointer[0]!) * 0.045;
        pointer[1]! += (target[1]! - pointer[1]!) * 0.045;
        draw();
      }
      raf = requestAnimationFrame(tick);
    }
    function sync() {
      cancelAnimationFrame(raf);
      raf = 0;
      last = 0;
      const running = enabledRef.current && inView && !document.hidden && !lost;
      canvas!.dataset.running = String(running);
      if (running) raf = requestAnimationFrame(tick);
      else draw();
    }
    syncRef.current = sync;
    const observer = new IntersectionObserver(([entry]) => {
      inView = !!entry?.isIntersecting;
      sync();
    });
    observer.observe(canvas);
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);
    const move = (event: PointerEvent) => {
      if (!enabledRef.current || event.pointerType !== "mouse") return;
      const r = hero.getBoundingClientRect();
      target[0] = (event.clientX - r.left) / r.width;
      target[1] = 1 - (event.clientY - r.top) / r.height;
    };
    const onScroll = () => {
      if (inView)
        scrollOffset = Math.max(
          0,
          -hero.getBoundingClientRect().top / hero.offsetHeight,
        );
    };
    const onLost = (event: Event) => {
      event.preventDefault();
      lost = true;
      setReady(false);
      cancelAnimationFrame(raf);
      canvas.dataset.running = "false";
    };
    const onRestored = () => setGeneration((value) => value + 1);
    hero.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("visibilitychange", sync);
    canvas.addEventListener("webglcontextlost", onLost);
    canvas.addEventListener("webglcontextrestored", onRestored);
    resize();
    setReady(true);
    return () => {
      cancelAnimationFrame(raf);
      syncRef.current = () => {};
      observer.disconnect();
      resizeObserver.disconnect();
      hero.removeEventListener("pointermove", move);
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("visibilitychange", sync);
      canvas.removeEventListener("webglcontextlost", onLost);
      canvas.removeEventListener("webglcontextrestored", onRestored);
      shaders.forEach((s) => context.deleteShader(s));
      context.deleteBuffer(buffer);
      context.deleteProgram(program);
    };
  }, [generation]);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden bg-[#080c0d]"
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_40%,#3a69452e,transparent_55%),radial-gradient(ellipse_at_85%_55%,#15637436,transparent_60%)]" />
      <canvas
        ref={canvasRef}
        data-renderer={ready ? "webgl" : "fallback"}
        className="absolute inset-0 h-full w-full opacity-80 transition-opacity duration-1000"
        style={{ visibility: ready ? "visible" : "hidden" }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-background/10 via-transparent to-background" />
    </div>
  );
}
