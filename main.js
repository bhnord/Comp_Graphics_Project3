// WebGL globals
let canvas;
let gl;
let program;



let vBuffer;
let vNormal;

let FOV_Y = 50;
const Z_DISTANCE = 15.0;

let lightPosition = vec4(0.0, 2.85, -Z_DISTANCE, 0.0);
let lightAmbient = vec4(0.1, 0.1, 0.1, 1.0);
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
    gl = WebGLUtils.setupWebGL(canvas, "{preserveDrawingBuffer: true}");
    // {preserveDrawingBuffer: true}
    //Check that the return value is not null.
    if (!gl) {
        console.log('Failed to get the rendering context for WebGL');
        return;
    }


    // Set viewport
    gl.viewport(0, 0, canvas.width, canvas.height);

    // Set clear color
    gl.clearColor(1.0, 1.0, 1.0, 1.0);

    // Initialize shaders
    program = initShaders(gl, "vshader", "fshader");
    gl.useProgram(program);


    gl.enable(gl.DEPTH_TEST);
    // gl.enable(gl.CULL_FACE);
    // gl.cullFace(gl.BACK);

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


    //setup texture
    var vTexCoord = gl.getAttribLocation(program, "vTexCoord");
    gl.vertexAttribPointer(vTexCoord, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vTexCoord);


    //setup projection matrix locations


    let projectionMatrix = perspective(FOV_Y, canvas.width / canvas.height, .1, 100);
    let projectionMatrixLoc = gl.getUniformLocation(program, "projectionMatrix");

    //TODO: Change back
    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));

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
        'street'
    ];


    //TODO: Parse files
    // note: street_alt is for part 2

    //ONLY PASS IN OBJ, AND LOOKS FOR MTL OF SAME NAME. -- CAN FORCE SYNC ON OBJ AND MTL LOADED




    //loadFiles(base_url, files[0]);
    for (let i = 0; i < files.length; i++) {
        if (i != 3)
            loadFiles(base_url, files[i]);
    }

}

function configureTexture(image) {
    var tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.uniform1i(gl.getUniformLocation(program, "texture"), 0);
}



let lightswitch = vec4(1.0, 1.0, 1.0, 1.0);
let degrees = 0;
function render() {
    //gl.clearColor(1.0, 1.0, 1.0, 1.0);

    //gl.clear(gl.COLOR_BUFFER_BIT);

    let at = vec3(0.0, 0.0, 0.0);
    let up = vec3(0.0, 1.0, 0.0);
    let eye = vec3(0.0, 5, Z_DISTANCE);
    if (animation_on)
        degrees = (degrees + 0.1) % 360;

    

    let eyex = (eye[0]*Math.cos(degrees)) - (eye[2]*Math.sin(degrees));
    let eyez = (-eye[0]*Math.sin(degrees)) + (eye[2]*Math.cos(degrees));
    eye = vec3(eyex, eye[1], eyez);
    console.log(eye);
    //eye = Math.multiply(rotate(degrees, vec3(0, 1, 0)), eye);
    //gl.uniformMatrix4fv(gl.getUniformLocation(program, "rotationMatrix"), false,  flatten(rotation));
    //setup camera rotation / position / lookat

    let modelViewMatrix = lookAt(eye, at, up);
    modelViewMatrixLoc = gl.getUniformLocation(program, "modelViewMatrix");
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));




    gl.uniform4fv(gl.getUniformLocation(program, "lightPosition"), flatten(lightPosition));
    gl.uniform1f(gl.getUniformLocation(program, "shininess"), materialShininess);

    for (const objects of draw_all) {
        let object_name = objects[0];
        console.log(object_name);
        let transMatrix = translate(0.0, 0.0, 0.0);

        if (object_name == "car") {
            transMatrix = translate(2.85, 0.0, 0.0);
        }
        if (object_name == "bunny") {
            transMatrix = translate(0.0, 0.0, 3.0);
        }
        if (object_name == "stop") {

            // let image = new Image();
            // image.crossOrigin = "";
            // image.src = textureURL;
            // image.onload = function(){
            //     configureTexture(image);
            // }
            // //console.log(faceUVs);
        }

        gl.uniformMatrix4fv(gl.getUniformLocation(program, "transMatrix"), false, flatten(transMatrix));

        let faces = objects[1];
        for (const section of faces) { //for each mat, face tuple
            let mat = section[0];
            let verts = section[1];
            let norms = section[2];
            //console.log(mat);
            gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, flatten(verts), gl.STATIC_DRAW);

            gl.bindBuffer(gl.ARRAY_BUFFER, vNormal);
            gl.bufferData(gl.ARRAY_BUFFER, flatten(norms), gl.STATIC_DRAW);


            // console.log(mat);
            // console.log(verts);
            // console.log(norms);
            let diffuseProduct = mult(lightswitch, mult(lightDiffuse, diffuseMap.get(mat)));
            let specularProduct = mult(lightswitch, mult(lightSpecular, specularMap.get(mat)));
            let ambientProduct = mult(lightAmbient, diffuseMap.get(mat));

            //set uniform material properties 
            gl.uniform4fv(gl.getUniformLocation(program, "diffuseProduct"), flatten(diffuseProduct));
            gl.uniform4fv(gl.getUniformLocation(program, "specularProduct"), flatten(specularProduct));
            gl.uniform4fv(gl.getUniformLocation(program, "ambientProduct"), flatten(ambientProduct));


            gl.drawArrays(gl.TRIANGLES, 0, verts.length);
        }
    }





    if (animation_on) {
        requestAnimationFrame(render);
    }

}

let animation_on = false;


window.onkeypress = (event) => {
    let key = event.key;
    switch (key.toLowerCase()) {
        case 'l':
            let light = (lightswitch[0] + 1.0) % 2.0;
            lightswitch = vec4(light, light, light, 1.0);
            console.log(lightswitch);
            if (!animation_on)
                render();
            break;
        case 'c':

            animation_on = !animation_on;
            if (animation_on)
                render();
    }
}