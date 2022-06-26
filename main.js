// WebGL globals
let canvas;
let gl;
let program;

let vPosition;
let vNormal;
/**
 * Sets up WebGL and enables the features this program requires.
 */
function main() {
    // Retrieve <canvas> element
    canvas = document.getElementById('webgl');

    // Get the rendering context for WebGL
    gl = WebGLUtils.setupWebGL(canvas);

    //Check that the return value is not null.
    if (!gl) {
        console.log('Failed to get the rendering context for WebGL');
        return;
    }

    // Set viewport
    gl.viewport(0, 0, canvas.width, canvas.height);

    // Set clear color
    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    // Initialize shaders
    program = initShaders(gl, "vshader", "fshader");
    gl.useProgram(program);




    //buffer creations and vertex array initialization
    let vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW);

    vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);


    let vNormal = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vNormal);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(normalsArray), gl.STATIC_DRAW);

    vNormalPosition = gl.getAttribLocation(program, "vNormal");
    gl.vertexAttribPointer(vNormalPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vNormalPosition);


    //setup progarm matrix locations
    modelViewMatrixLoc = gl.getUniformLocation(program, "modelViewMatrix");
    projectionMatrixLoc = gl.getUniformLocation(program, "projectionMatrix");
    transMatrixLoc = gl.getUniformLocation(program, "transMatrix");


    let base_url = 'https://web.cs.wpi.edu/~jmcuneo/cs4731/project3_1/';
    let files = [
        'bunny.mtl',
        'bunny.obj',
        'car.mtl',
        'car.obj',
        'lamp.mtl',
        'lamp.obj',
        'skybox_negx.png',
        'skybox_negy.png',
        'skybox_negz.png',
        'skybox_posx.png',
        'skybox_posy.png',
        'skybox_posz.png',
        'stop.png',
        'stop_alt.png',
        'stopsign.mtl',
        'stopsign.obj',
        'street.mtl',
        'street.obj',
        'street_alt.mtl',
        'street_alt.obj'
    ];

    for (let elem of files){
        loadFile(base_url+elem, elem.slice(-3));
    }
}