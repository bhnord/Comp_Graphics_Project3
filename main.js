// WebGL globals
let canvas;
let gl;
let program;



let vBuffer;
let vNormal;

let FOV_Y = 10;
const Z_DISTANCE = 10.0;

let lightPosition = vec4(0.0, 0.0, -Z_DISTANCE+7, 0.0);
let lightAmbient = vec4(0.2, 0.2, 0.2, 1.0);
let lightDiffuse = vec4(1.0, 1.0, 1.0, 1.0);
let lightSpecular = vec4(1.0, 1.0, 1.0, 1.0);

let materialAmbient = vec4(1.0, 0.0, 1.0, 1.0);
let materialDiffuse = vec4(1.0, 0.8, 0.0, 1.0);
let materialSpecular = vec4(1.0, 1.0, 1.0, 1.0);
let materialShininess = 20.0;




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

    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);

    //buffer creations and vertex array initialization
    vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    //gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);

    let vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);


    vNormal = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vNormal);
    //gl.bufferData(gl.ARRAY_BUFFER, flatten(normals), gl.STATIC_DRAW);

    let vNormalPosition = gl.getAttribLocation(program, "vNormal");
    gl.vertexAttribPointer(vNormalPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vNormalPosition);


    //setup progarm matrix locations
    let at = vec3(0.0, 0.0, 1.0);
    let up = vec3(0.0, 1.0, 0.0);


    let eye = vec3(0, 0, Z_DISTANCE);
    let modelViewMatrix = lookAt(eye, at, up);
    modelViewMatrixLoc = gl.getUniformLocation(program, "modelViewMatrix");
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
    
    let projectionMatrix = perspective(FOV_Y, canvas.width / canvas.height,.1, 100);
    let projectionMatrixLoc = gl.getUniformLocation(program, "projectionMatrix");
    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));
    // transMatrixLoc = gl.getUniformLocation(program, "transMatrix");

    // 'skybox_negx.png',
    // 'skybox_negy.png',
    // 'skybox_negz.png',
    // 'skybox_posx.png',
    // 'skybox_posy.png',
    // 'skybox_posz.png',
    // 'stop.png',
    // 'stop_alt.png',


    let base_url = 'https://web.cs.wpi.edu/~jmcuneo/cs4731/project3_1/';
    let files = [
        'bunny',
        'car',
        'lamp',
        'stopsign',
        'street',
        'street_alt'
    ];

    //TODO: Parse files


    //ONLY PASS IN OBJ, AND LOOKS FOR MTL OF SAME NAME. -- CAN FORCE SYNC ON OBJ AND MTL LOADED
    // for (let elem of files){
    //     loadFile(base_url+elem, elem.slice(-3));
    // }
    console.log("ddd");
    loadFiles(base_url+files[0]);
}


function render(){
    gl.clearColor(1.0, 1.0, 1.0, 1.0);

    gl.clear(gl.COLOR_BUFFER_BIT);


    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(faceVertices), gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, vNormal);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(faceNormals), gl.STATIC_DRAW);

    console.log(currMaterial);
    let diffuseProduct = mult(lightDiffuse, diffuseMap.get(currMaterial));
    let specularProduct = mult(lightSpecular, specularMap.get(currMaterial));
    let ambientProduct = lightAmbient;
    let transMatrix = translate(0,0,0);

    gl.uniformMatrix4fv(gl.getUniformLocation(program, "transMatrix"), false, flatten(transMatrix));

    //set uniform material properties 
    gl.uniform4fv(gl.getUniformLocation(program, "diffuseProduct"), flatten(diffuseProduct));
    gl.uniform4fv(gl.getUniformLocation(program, "specularProduct"), flatten(specularProduct));
    gl.uniform4fv(gl.getUniformLocation(program, "ambientProduct"), flatten(ambientProduct));
    gl.uniform4fv(gl.getUniformLocation(program, "lightPosition"), flatten(lightPosition));
    gl.uniform1f(gl.getUniformLocation(program, "shininess"), materialShininess);


    gl.drawArrays(gl.TRIANGLES, 0, faceVertices.length);
}