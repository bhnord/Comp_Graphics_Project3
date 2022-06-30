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



let lightPosition = vec4(0.0, 3.85, -Z_DISTANCE);
let lightAmbient = vec4(0.1, 0.1, 0.1, 1.0);

let lightDiffuse = vec4(1.0, 1.0, 1.0, 1.0);
let lightSpecular = vec4(1.0, 1.0, 1.0, 1.0);


let materialShininess = 10.0;


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
    // var vTexCoord = gl.getAttribLocation(program, "vTexCoord");
    // gl.vertexAttribPointer(vTexCoord, 2, gl.FLOAT, false, 0, 0);
    // gl.enableVertexAttribArray(vTexCoord);


    //setup projection matrix locations

    modelViewMatrixLoc = gl.getUniformLocation(program, "modelViewMatrix");

    let projectionMatrix = perspective(FOV_Y, canvas.width / canvas.height, .1, 100);
    let projectionMatrixLoc = gl.getUniformLocation(program, "projectionMatrix");


    //configure light

    gl.uniform4fv(gl.getUniformLocation(program, "lightPosition"), flatten(lightPosition));
    gl.uniform1f(gl.getUniformLocation(program, "shininess"), materialShininess);

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



    // note: street_alt is for part 2

    //ONLY PASS IN OBJ, AND LOOKS FOR MTL OF SAME NAME. -- CAN FORCE SYNC ON OBJ AND MTL LOADED


    m = mat4();
    m[3][3] = 0;
    m[3][1] = -1 / (lightPosition[1]);


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
        //TODO: IMPLMENT STOPSIGN
        // else if (object_name == "stopsign") {
        //     stop_sign = new Node(object_name, faces, translate(0.0, 0.0, 0.0));
        //     // let image = new Image();
        //     // image.crossOrigin = "";
        //     // image.src = textureURL;
        //     // image.onload = function(){
        //     //     configureTexture(image);
        //     // }
        //     // //console.log(faceUVs);
        // }
        else if (object_name == "street") {
            street = new Node(object_name, faces, translate(0.0, 0.0, 0.0))
        }
        else if (object_name == "lamp") {
            lamp = new Node(object_name, faces, translate(0.0, 0.0, 0.0));
        }
    }


    //TODO: IMPLEMENT STOPSIGN
    if (car !== null && street !== null && bunny !== null && lamp !== null) {// && stop_sign !== null) {
        car.children.push(bunny);
        street.children.push(car, lamp);//, stop_sign);


        hierarchy_tree = new Tree(street);
        carNode = car;

        console.log(car.transform);
        let car_shadow_matrix = translate(car.transform[0][3], -lightPosition[1], 0);//-lightPosition[2]);

        car_shadow_matrix = mult(m, car_shadow_matrix);
        car_shadow_matrix = mult(translate(-car.transform[0][3], lightPosition[1], 0), car_shadow_matrix);


        let shadow_faces = car.faces.map(function (arr) {
            return arr.slice();
        });
        for (let i = 0; i < shadow_faces.length; i++) {
            //shadow_faces.push("shadow",faces[1], faces)
            shadow_faces[i][0] = "shadow";
        }
        diffuseMap.set("shadow", [0, 0, 0, 1.0]);
        specularMap.set("shadow", [0, 0, 0, 1.0]);




        let car_shadow = new Node("car_shadow", shadow_faces, car_shadow_matrix);//mult(matrix, car.transform));
        car.children.push(car_shadow);
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
    //modelViewMatrix = mult(rotate(camera_rotation, vec3(0, 1, 0)), modelViewMatrix);

    //modelViewMatrix = mult(mult(translate(0, -1, 0.85), carNode.transform), rotateY(180));
    //modelViewMatrix = mult(translate(2.85, -1, .85), rotateY(180)); //drivers window lock
    let nextPos = mult(rotate(CAR_SPEED, vec3(0, 1, 0)), carNode.transform);
    console.log(first_person);
    if (first_person) {
        if (animation_on)
            hierarchy_tree.root.transform = inverse4(mult(nextPos, mult(translate(0, 1, .5), rotateY(180))));
        else
            hierarchy_tree.root.transform = inverse4(mult(carNode.transform, mult(translate(0, 1, .5), rotateY(180))));
    }
    else
        hierarchy_tree.root.transform = modelViewMatrix;


    modelViewMatrix = translate(0, 0, 0);
    hierarchy(modelViewMatrix, hierarchy_tree.root);
    if (rotating || animation_on)
        requestAnimationFrame(full_render);
}

let first_person = false;
let stack = [];
function hierarchy(mvMatrix, thisNode) {
    if (thisNode.object_name == "car") {
        console.log("gg");
        if (animation_on) {
            thisNode.transform = mult(rotate(CAR_SPEED, vec3(0, 1, 0)), thisNode.transform);

            // if (first_person)
            //     hierarchy_tree.root.transform = inverse4(mult(carNode.transform, mult(translate(0, 1, 1), rotateY(180))));
            //hierarchy_tree.root.transform = mult(inverse4(hierarchy_tree.root.transform),inverse4(carNode.transform));
        }
    }

    stack.push(mvMatrix);
    if (thisNode.object_name.includes("shadow")) {
        if (!shadow_on || lightswitch[0] ==0) {
            stack.pop();
            return;
        }
    }
    mvMatrix = mult(mvMatrix, thisNode.transform);
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(mvMatrix));
    render(thisNode.faces);
    for (let i = 0; i < thisNode.children.length; i++) {
        hierarchy(mvMatrix, thisNode.children[i]);
    }
    stack.pop();
}

let shadow_on = false;


function render(faces) {
    for (const section of faces) { //for each mat, face tuple
        let mat = section[0];
        let verts = section[1];
        let norms = section[2];
        //console.log(mat);
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


        // let modelMatrix = translate(lightPosition[0], lightPosition[1], lightPosition[3])

    }
}










window.onkeypress = (event) => {
    let key = event.key;
    switch (key.toLowerCase()) {
        case 'l':
            let light = (lightswitch[0] + 1.0) % 2.0;
            lightswitch = vec4(light, light, light, 1.0);
            console.log(lightswitch);
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
            console.log("d");
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
    }
}