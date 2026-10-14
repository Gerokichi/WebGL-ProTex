var cubeRotation = 0.0;
var sliderRyVal = 360;
var sliderTxVal = 0.0;
var r = 0.0; var g = 0.0; var b = 0.0;
var fieldOfView = 60 * Math.PI / 180;
var rotateCamY = 0.0;
var texturePath = './texture/lirkis.jpg';
var mousePosx = 0.0;
var mousePosy = 0.0;

main();

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
    attribute vec3 aVertexNormal;
    attribute vec2 aTextureCoord;

    uniform mat4 uNormalMatrix;
    uniform mat4 uModelViewMatrix;
    uniform mat4 uProjectionMatrix;

    varying highp vec2 vTextureCoord;
    varying highp vec3 vLighting;

    void main(void) {
      gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
      vTextureCoord = aTextureCoord;

      // Aplikovanie svetiel a osvetlovacich efektov

      highp vec3 ambientLight = vec3(0.3, 0.3, 0.3);
      highp vec3 directionalLightColor = vec3(1, 1, 1);
      highp vec3 directionalVector = normalize(vec3(0.85, 0.8, 0.75));

      highp vec4 transformedNormal = uNormalMatrix * vec4(aVertexNormal, 1.0);

      highp float directional = max(dot(transformedNormal.xyz, directionalVector), 0.0);
      vLighting = ambientLight + (directionalLightColor * directional);
    }
  `;

  // Fragment shader program

  const fsSource = `
    varying highp vec2 vTextureCoord;
    varying highp vec3 vLighting;

    uniform sampler2D uSampler;

    void main(void) {
      highp vec4 texelColor = texture2D(uSampler, vTextureCoord);

      gl_FragColor = vec4(texelColor.rgb * vLighting, texelColor.a);
    }
  `;

  // Inicializacia shader programu, tu sa nastavuje vsetko osvetlenie pre vrcholy.
  const shaderProgram = initShaderProgram(gl, vsSource, fsSource);

  // Zhromaždovanie vsetkych informacii potrebnych na pouzívanie shaderovacieho programu.
  // Urci sa, ktore atributy shader program pouziva pre aVertexPosition, aVertexColor
  // a tiež pre urcenie jednotneho umiestnenia.
  const programInfo = {
    program: shaderProgram,
    attribLocations: {
      vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
      vertexNormal: gl.getAttribLocation(shaderProgram, 'aVertexNormal'),
      textureCoord: gl.getAttribLocation(shaderProgram, 'aTextureCoord'),
    },
    uniformLocations: {
      projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
      modelViewMatrix: gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'),
      normalMatrix: gl.getUniformLocation(shaderProgram, 'uNormalMatrix'),
      uSampler: gl.getUniformLocation(shaderProgram, 'uSampler'),
    },
  };

  // Tu sa zavola rutina, ktora zostavi vsetky objekty (scenu), ktore sa budu kreslit
  const buffers = initBuffers(gl);

  const texture = loadTexture(gl, texturePath);

  var then = 0;

  // Opakovane kreslenie sceny (hlavny cyklus kreslenia sceny)
  function render(now) {
    now *= 0.001;  // konverzia na sekundy
    const deltaTime = now - then;  // spomalenie kreslenia
    then = now;

    drawScene(gl, programInfo, buffers, texture, deltaTime);

    requestAnimationFrame(render);
  }
  requestAnimationFrame(render);
}

// Inicializacia vyrovnavacej pamate, ktorej obsah bude potrebny.
// Pre tento priklad bude len jeden objekt – jednoducha trojrozmerna kocka.

function initBuffers(gl) {

  // Vytvorenie buffera pre pozicie vrcholov.

  const positionBuffer = gl.createBuffer();

  // Vyber positionBuffera ako toho, na ktory sa maju odtialto aplikovat operacie s bufferom pozicii.

  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

  // Tu sa vytvori pole s polohovymi suradnicami jednotlivych vrcholov.

  const positions = [
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

    // Spodna stena
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
  // Urobi sa to vytvorenim Float32 pola z pola JavaScriptu,
  // ktore sa potom pouzije na naplnenie aktualneho buffera.

  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

  // Nastavia sa normaly pre vrcholy, aby sa mohlo vypocitat osvetlenie.

  const normalBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);

  const vertexNormals = [
    // Predna stena
     0.0,  0.0,  1.0,
     0.0,  0.0,  1.0,
     0.0,  0.0,  1.0,
     0.0,  0.0,  1.0,

    // Zadna stena
     0.0,  0.0, -1.0,
     0.0,  0.0, -1.0,
     0.0,  0.0, -1.0,
     0.0,  0.0, -1.0,

    // Horna stena
     0.0,  1.0,  0.0,
     0.0,  1.0,  0.0,
     0.0,  1.0,  0.0,
     0.0,  1.0,  0.0,

    // Spodna stena
     0.0, -1.0,  0.0,
     0.0, -1.0,  0.0,
     0.0, -1.0,  0.0,
     0.0, -1.0,  0.0,

    // Prava stena
     1.0,  0.0,  0.0,
     1.0,  0.0,  0.0,
     1.0,  0.0,  0.0,
     1.0,  0.0,  0.0,

    // Lava stena
    -1.0,  0.0,  0.0,
    -1.0,  0.0,  0.0,
    -1.0,  0.0,  0.0,
    -1.0,  0.0,  0.0
  ];

  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexNormals),
                gl.STATIC_DRAW);

  // Teraz sa nastavia suradnice umiestnenia textury pre plochy/steny kocky.

  const textureCoordBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, textureCoordBuffer);

  const textureCoordinates = [
    // Predna stena
    0.5,  0.5,
    1.0,  1.0,
    0.0,  1.0,
    0.0,  0.0,
    // Zadna stena
    0.0,  0.0,
    1.0,  0.0,
    1.0,  1.0,
    0.0,  1.0,
    // Horna stena
    0.0,  0.0,
    1.0,  0.0,
    1.0,  1.0,
    0.0,  1.0,
    // Spodna stena
    0.0,  0.0,
    1.0,  0.0,
    1.0,  1.0,
    0.0,  1.0,
    // Prava stena
    0.0,  0.0,
    1.0,  0.0,
    1.0,  1.0,
    0.0,  1.0,
    // Lava stena
    0.0,  0.0,
    1.0,  0.0,
    1.0,  1.0,
    0.0,  1.0,
  ];

  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoordinates),
                gl.STATIC_DRAW);

  // Vytvori sa buffer prvkov urcujuci indexy do poli vrcholov pre vrcholy kazdej steny/plochy

  const indexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

  // Toto pole definuje kazdu stenu ako dva trojuholniky, pricom pomocou indexov
  // do pola vrcholov urcuje polohu kazdeho trojuholnika.

  const indices = [
    0,  1,  2,      0,  2,  3,    // predna
    4,  5,  6,      4,  6,  7,    // zadna
    8,  9,  10,     8,  10, 11,   // horna
    12, 13, 14,     12, 14, 15,   // spodna
    16, 17, 18,     16, 18, 19,   // prava
    20, 21, 22,     20, 22, 23,   // lava
  ];

  // Teraz sa posle pole elementov (element array) do GL

  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,
      new Uint16Array(indices), gl.STATIC_DRAW);

  // vratia sa uz pripravene/sfinalizovane elementy ako pozicia, normaly pre vypocet osvetlenia,
  // suradnice mapovania textur a indexy vrcholov tvoriace objekt kocky
  return {
    position: positionBuffer,
    normal: normalBuffer,
    textureCoord: textureCoordBuffer,
    indices: indexBuffer,
  };
}

//
// Inicializuje sa textúra a nacita sa jej obrazok.
// Po nacitani sa ulozi do struktury textury.
//

function loadTexture(gl, url) {
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);

  // Pretoze obrazky sa musia stahovat z URL (internetu), ich stiahnutie moze chvilu trvat.
  // Dovtedy sa vlozi do textury jeden pixel, aby sa textura mohla okamzite pouzit.
  // Po dokonceni stahovania sa textura aktualizuje obsahom obrazka

  const level = 0;
  const internalFormat = gl.RGBA;
  const width = 1;
  const height = 1;
  const border = 0;
  const srcFormat = gl.RGBA;
  const srcType = gl.UNSIGNED_BYTE;
  const pixel = new Uint8Array([0, 0, 255, 255]);  // nepriehladna modra ako zakladna farba
  gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
                width, height, border, srcFormat, srcType,
                pixel);

  const image = new Image();
  image.crossOrigin = "";
  image.onload = function() {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
                  srcFormat, srcType, image);

    // Ak sa deteklo WebGL1, tak toto ma odlisne spracovanie obrazkov, ktorych
    // rozlisenie ma mocninu 2 oproti nenormalizovanym obrazkom.
    // Skontroluje sa či je obrazok v rozliseni s mocninou 2 v oboch rozmeroch.
    if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
       // Ak ANO, je v rozliseni mocniny 2, rovno sa generuje mipmapa textury.
       gl.generateMipmap(gl.TEXTURE_2D);
    } else {
       // Ak NIE, nie je v rozliseni mocniny 2. Obrazok sa najprv znormalizuje/zdeformuje/upravi
       gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
       gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
       gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    }
  };
  image.src = url;

  return texture;
}

function isPowerOf2(value) {
  return (value & (value - 1)) == 0;  // kontrola ci je mocnina 2
}

//
// Kreslenie sceny.
//
function drawScene(gl, programInfo, buffers, texture, deltaTime) {
    resize(gl.canvas);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height); // Nastavenie pracovneho rozlisenia
    gl.clearColor(r, g, b, 1.0); // Nastavenie farby pozadia na ciernu
  gl.clearDepth(1.0);           // Vymazanie/inicializacia vsetkeho
  gl.enable(gl.DEPTH_TEST);           // Povolenie hlbkoveho testovania
  gl.depthFunc(gl.LEQUAL);            // Nastavenie rezimu: Blízke objekty budu zakryvat vzdialene objekty

  // Vymazanie kresliaceho platna.

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // Vytvorenie matice perspektivy. Matice, ktorá sa pouziva na simulaciu skreslenia perspektivy v kamere.
  // Nastavi sa zorne pole na 45 stupnov s pomerom sirky a vysky, ktory zodpoveda velkosti zobrazenia platna.
  // a bude vidiet iba objekty vzdialene od 0,1 dlzkovej jednotky do 100 dlzkovych jednotiek od kamery

  //const fieldOfView = 45 * Math.PI / 180;   // v radianoch, uhol zorneho pola
  const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;  // pomer stran
  const zNear = 0.1;  // predna orezavacia rovina kamery
  const zFar = 100.0;  // zadna orezavacia rovina kamery
  const projectionMatrix = mat4.create();  // vytvorenie projekcnej matice 4x4

  // glmatrix.js ma vzdy prvy argument ako cielovy, kam sa posle vysledok po perspektivnej projekcii
  // Nastavenie perspektivnej kamery
  mat4.perspective(projectionMatrix,
                   GUItext.fieldOfview * Math.PI / 180,
                   aspect,
                   zNear,
                   zFar);

  // Nastavi sa pozícia kreslenia na bod „identity“ (ciel kamery), ktory je stredom sceny.

  const modelViewMatrix = mat4.create();

  // Teraz sa vykonaju transformacie posunu a rotacie podla nacitanych parametrov
  // s posunom pozicie kreslenia tam, kam sa zacne kreslit stvorec steny

  mat4.translate(modelViewMatrix,            // cielova matica
                 modelViewMatrix,            // matica posunu
                 [sliderTxVal, 0.0, -6.0]);  // parametre posunu vratane hodnoty slajdra z menu

  mat4.rotate(modelViewMatrix,               // cielova matica
              modelViewMatrix,               // rotacna matica
              mousePosx,                     // uhol rotacie v radianoch, podla polohy x mysi v okne
              [0, 1, 0]);                    // os rotacie (Y)

  mat4.rotate(modelViewMatrix,               // cielova matica
        modelViewMatrix,                     // rotacna matica
        mousePosy,                           // uhol rotacie v radianoch, podla polohy y mysi v okne
        [1, 0, 0]);                          // os rotacie (X)

  const normalMatrix = mat4.create();
  mat4.invert(normalMatrix, modelViewMatrix);  // inverzna a
  mat4.transpose(normalMatrix, normalMatrix);  // transponovana matica normal

  // Teraz sa urci (format) WebGL, ako maju vytiahnut pozicie z vrcholoveho buffera a vlozit do atributov vertexPosition

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

  // Teraz sa urci (format) WebGL, ako maju vytiahnut suradnice textury z buffera textury a vlozit do atributu textureCoord
  {
    const numComponents = 2;
    const type = gl.FLOAT;
    const normalize = false;
    const stride = 0;
    const offset = 0;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.textureCoord);
    gl.vertexAttribPointer(
        programInfo.attribLocations.textureCoord,
        numComponents,
        type,
        normalize,
        stride,
        offset);
    gl.enableVertexAttribArray(
        programInfo.attribLocations.textureCoord);
  }

  // Teraz sa urci (format) WebGL, ako maju vytiahnut normaly z buffera normal a vlozit do atributu VertexNormal

  {
    const numComponents = 3;
    const type = gl.FLOAT;
    const normalize = false;
    const stride = 0;
    const offset = 0;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.normal);
    gl.vertexAttribPointer(
        programInfo.attribLocations.vertexNormal,
        numComponents,
        type,
        normalize,
        stride,
        offset);
    gl.enableVertexAttribArray(
        programInfo.attribLocations.vertexNormal);
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
  gl.uniformMatrix4fv(
      programInfo.uniformLocations.normalMatrix,
      false,
      normalMatrix);

  // Specifikacia textury, ktora sa nanesie (namapuje) na steny.

  // Nastavi sa pre WebGL, ktory texturovany objekt sa aktivuje (objekt 0)
  gl.activeTexture(gl.TEXTURE0);

  // Spoji/priradi texturu s texturovanym objektom
  gl.bindTexture(gl.TEXTURE_2D, texture);

  // Nastavi sa shaderu, že sa spojila textura s texturovanym objektom (0)
  gl.uniform1i(programInfo.uniformLocations.uSampler, 0);

  {
    const vertexCount = 36;
    const type = gl.UNSIGNED_SHORT;
    const offset = 0;
    gl.drawElements(gl.TRIANGLES, vertexCount, type, offset);  // vykreslenie otexturovanej kocky z trojuholnikov
  }

  // Aktualizuje sa rotacia pre dalsie kreslenie, nepouzije sa
  //  cubeRotation += deltaTime;
}

//
// Inicializuje sa shadrovaci program, aby WebGL vedel, ako vykreslovat dane data
//
function initShaderProgram(gl, vsSource, fsSource) {
  const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
  const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

  // Vytvorenie shadrovacieho programu

  const shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  // Ak vytvorenie shadrovacieho programu zlyhalo, upozornenie

  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert('Nemozno inicializovat shader programm: ' + gl.getProgramInfoLog(shaderProgram));
    return null;
  }

  return shaderProgram;
}

//
// Vytvorí shader daneho typu, nahra zdrojovy kód a skompiluje ho
//
function loadShader(gl, type, source) {
  const shader = gl.createShader(type);

  // Odoslanie zdroja do objektu shadera

  gl.shaderSource(shader, source);

  // Kompilacia shaderovacieho programu

  gl.compileShader(shader);

  // Kontrola, ci sa uspesne skompiloval

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert('Chyba pri kompilacii shadera: ' + gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }

  return shader;
}

function resize(canvas) {
    // Zisti sa velkost platna, ktory prehliadac zobrazuje.
    var displayWidth  = canvas.clientWidth;
    var displayHeight = canvas.clientHeight;

    // Skontroluje sa, ci aktualne platno nema rovnaku velkost.
    if (canvas.width  != displayWidth ||
        canvas.height != displayHeight) {

        // Nastavi/vytvori sa platno rovnakej velkosti
        canvas.width  = displayWidth;
        canvas.height = displayHeight;
    }
}


var canvas = document.getElementById('glCanvas');
var context = canvas.getContext('2d');  // 2D graficky kontext pre vykreslenie menu

// ziskavanie polohy mysi nad platnom (pre ovladanie rotacie)
canvas.addEventListener('mousemove', function(evt) {
    if(GUItext.MouseControl == true){
        var mousePos = getMousePos(canvas, evt);
        mousePosx = mousePos.x / 100;
        mousePosy = mousePos.y / 100;
        }

}, false);


function getMousePos(canvas, evt) {
    var rect = canvas.getBoundingClientRect();
    return {
        x: evt.clientX - rect.left,   // zisti sa relativna poloha mysi oproti lavemu hornemu rohu okna
        y: evt.clientY - rect.top
    };
}

// definuje sa obsah/struktura a funkcionalita menu, aj typovo aj inicializacne
var GUItext =  {
    message:'dat.gui',
    fieldOfview:60,   // fov kamery
    MouseControl:false,   // ovladanie rotacie mysou
    textureLIRKIS: function () {
        texturePath = './texture/lirkis.jpg';  // nastavenie zdroja prvej textury
        main();
    },
    textureBOX: function () {
        texturePath = './texture/box.jpg';  // nastavenie zdroja druhej textury
        main();
    },
}


// vytvorenie a nacitanie menu
window.onload = function() {
    //var text = new GUItext();

    var gui = new dat.GUI();  // novy objekt menu
    gui.remember(GUItext);
    // definovanie, usporiadanie a popis poloziek menu
    gui.add(GUItext, 'message');
    gui.add(GUItext, 'fieldOfview', 20, 120);
    gui.add(GUItext, 'MouseControl');
    gui.add(GUItext, 'textureLIRKIS');
    gui.add(GUItext, 'textureBOX');
    gui.open();
};
