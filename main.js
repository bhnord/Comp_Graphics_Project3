

// WebGL globals
let canvas;
let gl;
let program;


const FOV_Y = 50;
const Z_DISTANCE = 9.0;
const CAMERA_SPEED = 0.05;
const CAR_SPEED = -10;



let vBuffer;
let vNormal;
let tBuffer;

let texture_vertices;
let texCoord;
let minT = 0;
let maxT = 1;
let images = [];


let lightPosition = vec4(0.0, 3.85, -Z_DISTANCE);
let lightAmbient = vec4(0.1, 0.1, 0.1, 1.0);

let lightDiffuse = vec4(1.0, 1.0, 1.0, 1.0);
let lightSpecular = vec4(1.0, 1.0, 1.0, 1.0);


let materialShininess = 10.0;

let reflecting = false;
let refracting = false;
let size = 20;
let pointsArray = [];
let texCoordsArray = [];

let modelViewMatrixLoc = null;


let lightswitch = vec4(1.0, 1.0, 1.0, 1.0);
let camera_rotation = 0;
let animation_on = false; // car animation
let rotating = false;

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
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);

    //buffer creations and vertex array initialization
    vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    //gl.bufferData(gl.ARRAY_BUFFER, flatten(texture_vertices), gl.STATIC_DRAW);

    let vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);


    vNormal = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vNormal);
    //gl.bufferData(gl.ARRAY_BUFFER, flatten(normals), gl.STATIC_DRAW);

    let vNormalPosition = gl.getAttribLocation(program, "vNormal");
    gl.vertexAttribPointer(vNormalPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vNormalPosition);

    tBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, tBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten([]), gl.STATIC_DRAW);

    let vTexCoord = gl.getAttribLocation(program, "vTexCoord");
    gl.vertexAttribPointer(vTexCoord, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vTexCoord);

    


    //setup projection matrix locations

    modelViewMatrixLoc = gl.getUniformLocation(program, "modelViewMatrix");

    let projectionMatrix = perspective(FOV_Y, canvas.width / canvas.height, .1, 100);
    let projectionMatrixLoc = gl.getUniformLocation(program, "projectionMatrix");


    //configure light

    gl.uniform4fv(gl.getUniformLocation(program, "lightPosition"), flatten(lightPosition));
    gl.uniform1f(gl.getUniformLocation(program, "shininess"), materialShininess);


    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));

    gl.uniform1i(gl.getUniformLocation(program, "isBox"), 0);

    let box = ['skybox_posz.png',
        'skybox_posx.png',
        'skybox_negy.png',
        'skybox_posy.png',
        'skybox_negz.png',
        'skybox_negx.png'];

    images = [null, null, null, null, null, null];
    for (let i = 0; i < box.length; i++) {
        let image = new Image();
        image.crossOrigin = "";
        image.src = "https://web.cs.wpi.edu/~jmcuneo/cs4731/project3/" + box[i];
        image.onload = function () {
            images[i] = image;
            tryStartParsing();
        }
    }


    //let img1 = 
    // 'skybox_negx.png',
    // 'skybox_negy.png',
    // 'skybox_negz.png',
    // 'skybox_posx.png',
    // 'skybox_posy.png',
    // 'skybox_posz.png',

    // 'stop.png',
    // 'stop_alt.png',

    texture_vertices = [
        vec4(-size, -size, size, 1.0),
        vec4(-size, size, size, 1.0),
        vec4(size, size, size, 1.0),
        vec4(size, -size, size, 1.0),
        vec4(-size, -size, -size, 1.0),
        vec4(-size, size, -size, 1.0),
        vec4(size, size, -size, 1.0),
        vec4(size, -size, -size, 1.0)
    ];
    texCoord = [
        vec2(minT, minT),
        vec2(minT, maxT),
        vec2(maxT, maxT),
        vec2(maxT, minT)
    ];

    m = mat4();
    m[3][3] = 0;
    m[3][1] = -1 / (lightPosition[1]);


    gl.uniform1i(gl.getUniformLocation(program, "isStop"), 0);
    gl.uniform1i(gl.getUniformLocation(program, "isReflecting"), 0);
    gl.uniform1i(gl.getUniformLocation(program, "isRefracting"), 0);




}

function tryStartParsing() {
    for (let i = 0; i < images.length; i++) {
        if (images[i] == null) {
            return;
        }
    }

    configureCubeMap();
    let base_url = 'https://web.cs.wpi.edu/~jmcuneo/cs4731/project3_1/';
    let files = [
        'bunny',
        'car',
        'lamp',
        'stopsign',
        'street'
    ];



    //
    for (let i = 0; i < files.length; i++) {
        //if (i != 3)
        loadFiles(base_url, files[i]);
    }
}

let cubeMap;
function configureCubeMap() {
    cubeMap = gl.createTexture();

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubeMap);


    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);

    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    /*'skybox_posz.png',
        'skybox_posx.png',
        'skybox_negy.png',
        'skybox_posy.png',
        'skybox_negz.png',
        'skybox_negx.png'*/
    //MAP IMAGES HERE

    gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_Z, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, images[0]);
    gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, images[1]);
    gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, images[2]);
    gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_Y, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, images[3]);
    gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_Z, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, images[4]);
    gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_X, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, images[5]);

    // gl.texImage2D(gl.TEXTURE_CUBE_MAP, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);

    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.NEAREST);

    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.NEAREST);


    gl.uniform1i(gl.getUniformLocation(program, "texMap"), 1);
}


function configureTexture(image) {
    let tex = gl.createTexture();

    gl.activeTexture(gl.TEXTURE0);

    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);



    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);


    gl.uniform1i(gl.getUniformLocation(program, "texture"), 0);
}



function Tree(root) {
    this.root = root;
}
function Node(object_name, faces, transform) {
    this.object_name = object_name;
    this.faces = faces;
    this.transform = transform;
    this.children = [];
}





let hierarchy_tree = null;
function createTree() {
    //bunny is childof car
    let bunny = null; // save bunny to make child of car
    let street = null;
    let stop_sign = null;
    let car = null;
    let lamp = null;
    for (const objects of draw_all) {
        let object_name = objects[0];
        let faces = objects[1];


        if (object_name == "car") {
            car = new Node(object_name, faces, translate(2.85, 0.0, 0.0));
        }
        else if (object_name == "bunny") {
            bunny = new Node(object_name, faces, translate(0.0, 0.70, 1.65));
        }
        else if (object_name == "stopsign") {
            stop_sign = new Node(object_name, faces, mult(translate(-4.25, 0.0, -2.0), rotateY(-90)));




        }
        else if (object_name == "street") {
            street = new Node(object_name, faces, translate(0.0, 0.0, 0.0))
        }
        else if (object_name == "lamp") {
            lamp = new Node(object_name, faces, translate(0.0, 0.0, 0.0));
        }
    }


    if (car !== null && street !== null && bunny !== null && lamp !== null && stop_sign !== null) {
        car.children.push(bunny);
        street.children.push(car, lamp, stop_sign);


        hierarchy_tree = new Tree(street);
        carNode = car;


        //since these will be nested under "car" and "stop sign" to move with them, the light position will be in a coordinate system 
        //centered at the object. we need to move our "lightPosition" into this coordinate system by applying the matrix transforms
        //so we can get a projection of shadow.
        let light = mult(mult(inverse4(car.transform), translate(0, 0, Z_DISTANCE)), lightPosition);
        let car_shadow_matrix = translate(-light[0], -light[1], -light[2]);
        car_shadow_matrix = mult(m, car_shadow_matrix);
        car_shadow_matrix = mult(translate(light[0], light[1], light[2]), car_shadow_matrix);


        light = mult(mult(inverse4(stop_sign.transform), translate(0, 0, Z_DISTANCE)), lightPosition);



        let stop_shadow_matrix = translate(-light[0], -light[1], -light[2]);
        stop_shadow_matrix = mult(m, stop_shadow_matrix);
        stop_shadow_matrix = mult(translate(light[0], light[1], light[2]), stop_shadow_matrix);

        let shadow_faces = car.faces.map(function (arr) {
            return arr.slice();
        });
        for (let i = 0; i < shadow_faces.length; i++) {
            shadow_faces[i][0] = "shadow";
        }
        let shadow_faces2 = stop_sign.faces.map(function (arr) {
            return arr.slice();
        });
        for (let i = 0; i < shadow_faces2.length; i++) {
            shadow_faces2[i][0] = "shadow";
        }

        diffuseMap.set("shadow", [0, 0, 0, 1.0]);
        specularMap.set("shadow", [0, 0, 0, 1.0]);



        let car_shadow = new Node("car_shadow", shadow_faces, car_shadow_matrix);//mult(matrix, car.transform));
        car.children.push(car_shadow);

        let stop_shadow = new Node("stop_shadow", shadow_faces2, stop_shadow_matrix);
        stop_sign.children.push(stop_shadow);

        full_render();
    }

}

let m = null;

let carNode = null;

function full_render() {
    //setup camera rotation / position / lookat
    let at = vec3(0.0, 0.0, 0.0);
    let up = vec3(0.0, 1.0, 0.0);
    let eye = vec3(0.0, 4, Z_DISTANCE);
    if (rotating)
        camera_rotation = (camera_rotation + CAMERA_SPEED) % 360;


    let eyex = (eye[0] * Math.cos(camera_rotation)) - (eye[2] * Math.sin(camera_rotation));
    let eyez = (-eye[0] * Math.sin(camera_rotation)) + (eye[2] * Math.cos(camera_rotation));
    eye = vec3(eyex, eye[1] + Math.sin(2 * camera_rotation), eyez);
    let modelViewMatrix = lookAt(eye, at, up);
  

    let nextPos = mult(rotate(CAR_SPEED, vec3(0, 1, 0)), carNode.transform);

    if (first_person) {
        //reverse the effects of the camera and "nest" under car 
        if (animation_on) {
            hierarchy_tree.root.transform = inverse4(mult(nextPos, mult(translate(0, 1, .5), rotateY(180))));
            
        }
        else {
            hierarchy_tree.root.transform = inverse4(mult(carNode.transform, mult(translate(0, 1, .5), rotateY(180))));
            //lightPosition = mult(hierarchy_tree.root.transform, lightPosition);
        }
        //let lightPosition = vec4(0.0, 3.85, -Z_DISTANCE);

        //shifts light over to correct position now that coordinate system centered at car.
        gl.uniform4fv(gl.getUniformLocation(program, "lightPosition"), flatten(vec4(2.85, 3.85, 0)));
        
    }
    else {
        gl.uniform4fv(gl.getUniformLocation(program, "lightPosition"), flatten(lightPosition));
        hierarchy_tree.root.transform = modelViewMatrix;
    }


    modelViewMatrix = translate(0, 0, 0);
    hierarchy(modelViewMatrix, hierarchy_tree.root);
    if (rotating || animation_on)
        requestAnimationFrame(full_render);
}

let first_person = false;
let stack = [];
function hierarchy(mvMatrix, thisNode) {
    if (thisNode.object_name == "car") {
        if (animation_on) {
            thisNode.transform = mult(rotate(CAR_SPEED, vec3(0, 1, 0)), thisNode.transform);
        }
    }

    stack.push(mvMatrix);
    if (thisNode.object_name.includes("shadow")) {
        if (!shadow_on || lightswitch[0] == 0) {

            stack.pop();
            return;
        } else {
            // let light = mult(mult(inverse4(stack[1]), inverse4(mvMatrix)), lightPosition);
            // let car_shadow_matrix = translate(-light[0], -light[1], -light[2]);
            // car_shadow_matrix = mult(m, car_shadow_matrix);
            // car_shadow_matrix = mult(translate(light[0], light[1], light[2]), car_shadow_matrix);

            // thisNode.transform = car_shadow_matrix;
            mvMatrix = mult(mvMatrix, thisNode.transform);

        }
    } else
        mvMatrix = mult(mvMatrix, thisNode.transform);
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(mvMatrix));
    gl.uniformMatrix4fv(gl.getUniformLocation(program, "mvInverse"), false, flatten(inverse4(carNode.transform)));

    if (thisNode.object_name == "stopsign") {

        gl.uniform1i(gl.getUniformLocation(program, "isStop"), 1);
        renderTexture(stopTexture);
        gl.uniform1i(gl.getUniformLocation(program, "isStop"), 0);
    } else if (thisNode.object_name == "car" && reflecting) {
        gl.uniform1i(gl.getUniformLocation(program, "isReflecting"), 1);
        render(thisNode.faces);
        gl.uniform1i(gl.getUniformLocation(program, "isReflecting"), 0);
    } else if (thisNode.object_name == "bunny" && refracting) {
        gl.uniform1i(gl.getUniformLocation(program, "isRefracting"), 1);
        render(thisNode.faces);
        gl.uniform1i(gl.getUniformLocation(program, "isRefracting"), 0);
    }
    else {
        render(thisNode.faces);
    }
    if (thisNode.object_name == "street") {
        if (skybox)
            drawBoxes();
    }

    for (let i = 0; i < thisNode.children.length; i++) {
        hierarchy(mvMatrix, thisNode.children[i]);
    }
    stack.pop();
}


//draws box for sky
function drawBoxes() {
    gl.uniform1i(gl.getUniformLocation(program, "isBox"), 1);


    //cube face vector numbers (maps to textureVertices and texcoord)
    let cubeNums = [[1, 0, 3, 2],
    [2, 3, 7, 6],
    [3, 0, 4, 7],
    [6, 5, 1, 2],
    [4, 5, 6, 7],
    [5, 4, 0, 1]];

    for (let i = 0; i < 6; i++) {
        pointsArray = [];
        texCoordsArray = [];
        configureTexture(images[i]);

        quad(cubeNums[i]);
        gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, tBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(texCoordsArray), gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, vNormal);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW);

        gl.drawArrays(gl.TRIANGLES, 0, pointsArray.length);
    }
    gl.uniform1i(gl.getUniformLocation(program, "isBox"), 0);
}


//pushes points to array to make a face of a cube
function quad(arr) {
    let a = arr[0]; 
    let b = arr[1];
    let c = arr[2];
    let d = arr[3];
    pointsArray.push(texture_vertices[c]);
    texCoordsArray.push(texCoord[2]);

    pointsArray.push(texture_vertices[b]);
    texCoordsArray.push(texCoord[1]);

    pointsArray.push(texture_vertices[a]);
    texCoordsArray.push(texCoord[0]);


    pointsArray.push(texture_vertices[d]);
    texCoordsArray.push(texCoord[3]);

    pointsArray.push(texture_vertices[c]);
    texCoordsArray.push(texCoord[2]);

    pointsArray.push(texture_vertices[a]);
    texCoordsArray.push(texCoord[0]);



}


let shadow_on = false;


//renders object with a texture (stopsign)
function renderTexture(tex) {
    configureTexture(stopImage);

    let mat = tex[0];

    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(tex[1]), gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, tBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(tex[2]), gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, vNormal);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(tex[3]), gl.STATIC_DRAW);


    let diffuseProduct = mult(lightswitch, mult(lightDiffuse, diffuseMap.get(mat)));
    let specularProduct = mult(lightswitch, mult(lightSpecular, specularMap.get(mat)));
    let ambientProduct = mult(lightAmbient, diffuseMap.get(mat));

    //set uniform material properties 
    gl.uniform4fv(gl.getUniformLocation(program, "diffuseProduct"), flatten(diffuseProduct));
    gl.uniform4fv(gl.getUniformLocation(program, "specularProduct"), flatten(specularProduct));
    gl.uniform4fv(gl.getUniformLocation(program, "ambientProduct"), flatten(ambientProduct));

    gl.drawArrays(gl.TRIANGLES, 0, tex[1].length);
}


//render object or object part with given materials.
function render(faces) {
    for (const section of faces) { //for each mat, face tuple
        let mat = section[0];
        let verts = section[1];
        let norms = section[2];

        gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(verts), gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, vNormal);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(norms), gl.STATIC_DRAW);

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




let skybox = true;




window.onkeypress = (event) => {
    let key = event.key;
    switch (key.toLowerCase()) {
        case 'l':
            let light = (lightswitch[0] + 1.0) % 2.0;
            lightswitch = vec4(light, light, light, 1.0);
            if (!rotating && !animation_on)
                full_render();
            break;
        case 'c':
            rotating = !rotating;
            if (rotating && !animation_on)
                full_render();
            break;
        case 'm':
            animation_on = !animation_on;
            if (animation_on && !rotating)
                full_render();
            break;
        case 'd':
            first_person = !first_person;
            rotating = false;
            if (!rotating && !animation_on)
                full_render();
            break;
        case 's':
            shadow_on = !shadow_on;
            if (!rotating && !animation_on)
                full_render();
            break;
        case 'e':
            skybox = !skybox;
            if (!rotating && !animation_on)
                full_render();
            break;
        case 'r':
            reflecting = !reflecting;
            if (!rotating && !animation_on)
                full_render();
            break;
        case 'f':
            refracting = !refracting;
            if (!rotating && !animation_on)
                full_render();
            break;
    }
}