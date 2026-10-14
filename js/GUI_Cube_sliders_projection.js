var cubeRotation = 0.0;
var sliderRyVal = 360;
var sliderTxVal = 0.0;
var r = 0.0; var g = 0.0; var b = 0.0;
var fieldOfView = 60 * Math.PI / 180;
var rotateCamY = 0.0;

var zNear = 0.1;


main();

// Nacitanie slajdra pre fov z html
function setCamFov(val) {
    fieldOfView = val * Math.PI / 180;
}

function setCamZNear(val) {
    zNear = Number(val);
}

/* // alternativne nacitanie

function setCamFov(val) {
    document.getElementById('camFOV_value').innerHTML = val;
    fieldOfView = document.getElementById('camFOV_value').innerHTML * Math.PI / 180;
}
*/



function setBckColor(inr,ing,inb) {
    r = inr;
    b = inb;
    g = ing;
}

function sliderRyChange(val) {
    sliderRyVal = val / 150;
}

function sliderTxChange(val) {
    sliderTxVal = val / 500;
}


function main() {

    var canvas = document.getElementById('glCanvas');
    gl = canvas.getContext('webgl');

    if (!gl) {
        alert('Nemozno inicializovat WebGL.');
        return;
    }

    // Vrcholovy shader program

    const vsSource = `
    attribute vec4 aVertexPosition;
    attribute vec4 aVertexColor;

    uniform mat4 uModelViewMatrix;
    uniform mat4 uProjectionMatrix;

    varying lowp vec4 vColor;

    void main(void) {
      gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
      vColor = aVertexColor;
    }
  `;

    // Fragment shader program

    const fsSource = `
    varying lowp vec4 vColor;

    void main(void) {
      gl_FragColor = vColor;
    }
  `;

    // Inicializacia shader programu; tu sa nastavuje vsetko osvetlenie pre vrcholy.
    const shaderProgram = initShaderProgram(gl, vsSource, fsSource);

    // Zhromaždovanie vsetkych informacii potrebnych na pouzívanie shaderoveho programu.
    // Urci sa, ktore atributy shader program pouziva pre aVertexPosition, aVertexColor
    // a tiež pre urcenie jednotneho umiestnenia.
    const programInfo = {
        program: shaderProgram,
        attribLocations: {
            vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
            vertexColor: gl.getAttribLocation(shaderProgram, 'aVertexColor'),
        },
        uniformLocations: {
            projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
            modelViewMatrix: gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'),
        },
    };

    // Tu sa zavola rutina, ktora zostavi vsetky objekty, ktore sa budu kreslit.
    const buffers = initBuffers(gl);

    var then = 0;

    // Opakovane kreslenie sceny (cyklus kreslenia sceny)
    function render(now) {
        now *= 0.001;  // konverzia na sekundy
        const deltaTime = now - then; // spomalenie kreslenia
        then = now;

        drawScene(gl, programInfo, buffers, deltaTime);

        requestAnimationFrame(render);
    }
    requestAnimationFrame(render);
}

// Inicializacia vyrovnavacej pamate, ktorej obsah bude potrebny.
// Pre tento priklad bude len jeden objekt – jednoducha trojrozmerna kocka.
//
function initBuffers(gl) {

    // Vytvorenie buffera pre pozicie vrcholov.

    const positionBuffer = gl.createBuffer();

    // Vyber positionBuffera ako toho, na ktory sa maju odtialto aplikovat operacie s bufferom pozicii.

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    // Tu sa vytvori pole s polohovymi suradnicami jednotlivych vrcholov.

    const vertices = [
        // Predna stena
        -1.0, -1.0,  1.0,
        1.0, -1.0,  1.0,
        1.0,  1.0,  1.0,
        -1.0,  1.0,  1.0,

        // Zadna stena
        -1.0, -1.0, -1.0,
        -1.0,  1.0, -1.0,
        1.0,  1.0, -1.0,
        1.0, -1.0, -1.0,

        // Horna stena
        -1.0,  1.0, -1.0,
        -1.0,  1.0,  1.0,
        1.0,  1.0,  1.0,
        1.0,  1.0, -1.0,

        // Dolna stena
        -1.0, -1.0, -1.0,
        1.0, -1.0, -1.0,
        1.0, -1.0,  1.0,
        -1.0, -1.0,  1.0,

        // Prava stena
        1.0, -1.0, -1.0,
        1.0,  1.0, -1.0,
        1.0,  1.0,  1.0,
        1.0, -1.0,  1.0,

        // Lava stena
        -1.0, -1.0, -1.0,
        -1.0, -1.0,  1.0,
        -1.0,  1.0,  1.0,
        -1.0,  1.0, -1.0,
    ];

    // Tu sa prenesie zoznam pozícií do WebGL na vytvorenie tvaru (kocky).
    // Urobí sa to vytvorením Float32 pola z poľa JavaScriptu,
    // ktoré sa potom použije na naplnenie aktualneho buffera.

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

    // Teraz sa nastavia farby pre plochy/steny kocky. Pouziju sa plne farby pre kazdu stenu.

    const faceColors = [
        [1.0,  1.0,  1.0,  1.0],    // predna: biela - white
        [1.0,  1.0,  0.0,  1.0],    // zadna: cerevena - red
        [1.0,  0.0,  0.0,  1.0],    // horna: zelena - green
        [0.0,  0.0,  1.0,  1.0],    // spodna: modra - blue
        [1.0,  0.0,  1.0,  1.0],    // prava: zlta - yellow
        [0.0,  1.0,  1.0,  1.0],    // lava: fialova - purple
    ];

    // Konverzia pola farieb na tabulku pre vsetky vrcholy

    let colors = [];

    for (var j = 0; j < faceColors.length; ++j) {
        const c = faceColors[j];

        // Zopakuje sa kazda farba pre vsetky styri vrcholy steny
        colors = colors.concat(c, c, c, c);
    }

    const colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

    // Vytvorenie vyrovnavacej pamate pola prvkov. Toto určuje indexy do pola vrcholov pre vrcholy kazdej steny.

    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

    // Toto pole definuje kazdu stenu ako dva trojuholniky, pricom pomocou indexov
    // do pola vrcholov urcuje polohu kazdeho trojuholnika.

    const indices = [
        0,  1,  2,      0,  2,  3,    // predna
        4,  5,  6,      4,  6,  7,    // zadna
        8,  9,  10,     8,  10, 11,   // horna
        12, 13, 14,     12, 14, 15,   // dolna
        16, 17, 18,     16, 18, 19,   // prava
        20, 21, 22,     20, 22, 23,   // lava
    ];

    // Teraz sa posle pole elementov (element array) do GL

    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,
        new Uint16Array(indices), gl.STATIC_DRAW);

    return {
        position: positionBuffer,
        color: colorBuffer,
        indices: indexBuffer,
    };
}

//
// Kreslenie sceny.
//
function drawScene(gl, programInfo, buffers, deltaTime) {
    gl.clearColor(r, g, b, 1.0);   // Nastavenie farby pozadia na ciernu
    gl.clearDepth(1.0);            // vymazanie/inicializacia vsetkeho
    gl.enable(gl.DEPTH_TEST);           // Povolenie hlbkoveho testovania
    gl.depthFunc(gl.LEQUAL);            // Nastavenie rezimu: Blízke objekty budu zakryvat vzdialene objekty

    // Vymazanie kresliaceho platna.

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Vytvorenie matice perspektivy. Matice, ktorá sa pouziva na simulaciu skreslenia perspektivy v kamere.
    // Nastavi sa zorne pole na 45 stupnov s pomerom sirky a vysky, ktory zodpoveda velkosti zobrazenia platna.
    // a bude vidiet iba objekty vzdialene od 0,1 dlzkovej jednotky do 100 dlzkovych jednotiek od kamery.

    // const fieldOfView = 45 * Math.PI / 180;   // v radianoch, uhol zorneho pola
    const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight; // pomer stran
    // const zNear = 0.1;   // predna orezavacia rovina kamery
    const zFar = 100.0;  // zadna orezavacia rovina kamery
    const projectionMatrix = mat4.create();  // vytvorenie projekcnej matice 4x4

    // glmatrix.js ma vzdy prvy argument ako cielovy, kam sa posle vysledok po transformacii
    // Nastavenie perspektivnej kamery
    mat4.perspective(projectionMatrix,
        fieldOfView,
        aspect,
        zNear,
        zFar);

    // rotacia kamery
    mat4.rotate(projectionMatrix,  // cielova matica
        projectionMatrix,          // rotacna matica
        rotateCamY,                // uhol rotacie v radianoch, podla nacitaneho slajdra
        [0, 1, 0]);                // os rotacie (Y)

    // Nastavi sa pozícia kreslenia na bod „identity“ (ciel kamery), ktorý je stredom scény.
    const modelViewMatrix = mat4.create();

    // Teraz sa vykonaju transformacie posunu a rotacie podla nacitanych parametrov
    // s posunom pozicie kreslenia tam, kam sa zacne kreslit stvorec steny

    mat4.translate(modelViewMatrix,     // cielova matica
        modelViewMatrix,                // matica posunu
        [sliderTxVal, 0.0, - 8.0]);     // parametre posunu, podla nacitaneho slajdra

    mat4.rotate(modelViewMatrix,        // cielova matica
        modelViewMatrix,                // rotacna matica
        sliderRyVal,                    // uhol rotacie v radianoch, podla nacitaneho slajdra
        [0, 1, 1]);                     // osi rotacie (Y,Z)

    // Teraz sa urci (format) WebGL, ako ma vytiahnut pozicie z vrcholoveho buffera a vlozit do atributov vertexPosition

    {
        const numComponents = 3;
        const type = gl.FLOAT;
        const normalize = false;
        const stride = 0;
        const offset = 0;
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
        gl.vertexAttribPointer(
            programInfo.attribLocations.vertexPosition,
            numComponents,
            type,
            normalize,
            stride,
            offset);
        gl.enableVertexAttribArray(
            programInfo.attribLocations.vertexPosition);
    }

    // Teraz sa urci (format) WebGL, ako ma vytiahnut farby z buffera farieb a vlozit do atributov vertexColor

    {
        const numComponents = 4;
        const type = gl.FLOAT;
        const normalize = false;
        const stride = 0;
        const offset = 0;
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.color);
        gl.vertexAttribPointer(
            programInfo.attribLocations.vertexColor,
            numComponents,
            type,
            normalize,
            stride,
            offset);
        gl.enableVertexAttribArray(
            programInfo.attribLocations.vertexColor);
    }

    // Urci sa pre WebGL, ktore indexy sa maju pouzit na indexovanie vrcholov
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices);

    // Urci sa pre WebGL, aby pri kresleni pouzil program definovany v tomto skripte

    gl.useProgram(programInfo.program);

    // Nastavia sa uniformity matic shaderov

    gl.uniformMatrix4fv(
        programInfo.uniformLocations.projectionMatrix,
        false,
        projectionMatrix);
    gl.uniformMatrix4fv(
        programInfo.uniformLocations.modelViewMatrix,
        false,
        modelViewMatrix);

    {
        const vertexCount = 36;
        const type = gl.UNSIGNED_SHORT;
        const offset = 0;
        gl.drawElements(gl.TRIANGLES, vertexCount, type, offset);
    }


    // Aktualizuje sa rotacia pre dalsie kreslenie, ale nepouzije sa

    // cubeRotation += deltaTime;

}

//
// Inicializuje sa shaderovy program, aby WebGL vedel, ako vykreslovat dane data
//
function initShaderProgram(gl, vsSource, fsSource) {
    const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
    const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

    // Vytvorenie shader programu

    const shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    // Ak vytvorenie shaderoveho programu zlyhalo, upozornenie

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        alert('Nemozno inicializovat shader program: ' + gl.getProgramInfoLog(shaderProgram));
        return null;
    }

    return shaderProgram;
}

//
// Vytvorí shader daneho typu, nahra zdrojovy kód skompiluje ho.
//
function loadShader(gl, type, source) {
    const shader = gl.createShader(type);

    // Odoslanie zdroja do objektu shadera

    gl.shaderSource(shader, source);

    // Kompilacia shadrovacieho programu

    gl.compileShader(shader);

    // Kontrola, ci sa uspesne skompiloval

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert('Chyba pri kompilacii shadera:  ' + gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }

    return shader;
}


document.addEventListener('keydown', (event) => {
    const keyName = event.key;
    if(keyName == "w" ) {rotateCamY = rotateCamY + 0.01;}
});
document.addEventListener('keydown', (event) => {
    const keyName = event.key;
    if(keyName == "s" ) {rotateCamY = rotateCamY - 0.01;}
});
