// Non-blocking shader program linking (uses KHR_parallel_shader_compile when available).

type GL = WebGL2RenderingContext | WebGLRenderingContext;

export type PendingProgram = {
  program: WebGLProgram;
  vertex: WebGLShader;
  fragment: WebGLShader;
  parallel: KHR_parallel_shader_compile | null;
};

function compile(gl: GL, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) throw Error("shader allocation failed");
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  return shader;
}

export function linkProgramAsync(
  gl: GL,
  vertexSource: string,
  fragmentSource: string,
  beforeLink?: (program: WebGLProgram) => void,
): PendingProgram {
  const parallel = gl.getExtension("KHR_parallel_shader_compile");
  const vertex = compile(gl, gl.VERTEX_SHADER, vertexSource);
  const fragment = compile(gl, gl.FRAGMENT_SHADER, fragmentSource);
  const program = gl.createProgram();
  if (!program) {
    gl.deleteShader(vertex);
    gl.deleteShader(fragment);
    throw Error("program allocation failed");
  }
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  beforeLink?.(program);
  gl.linkProgram(program);
  return { program, vertex, fragment, parallel };
}

export function isProgramComplete(gl: GL, pending: PendingProgram) {
  return !pending.parallel || gl.getProgramParameter(pending.program, pending.parallel.COMPLETION_STATUS_KHR) === true;
}

export function finishProgram(gl: GL, pending: PendingProgram) {
  const { program, vertex, fragment } = pending;
  const linked = gl.getProgramParameter(program, gl.LINK_STATUS) === true;
  const log = linked
    ? ""
    : [gl.getShaderInfoLog(vertex), gl.getShaderInfoLog(fragment), gl.getProgramInfoLog(program)]
        .filter(Boolean)
        .join(" | ");
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  if (linked) return program;
  gl.deleteProgram(program);
  throw Error(`program link failed: ${log || "unknown"}`);
}

export function disposePendingProgram(gl: GL, pending: PendingProgram) {
  gl.deleteShader(pending.vertex);
  gl.deleteShader(pending.fragment);
  gl.deleteProgram(pending.program);
}
