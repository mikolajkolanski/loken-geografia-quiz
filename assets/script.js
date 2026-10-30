"use strict";
// -------- DOM -------- 
const elements = document.getElementById("points").children;
const header = document.getElementById("header");
const scoreElem = document.getElementById("score");
const timerElem = document.getElementById("clock");
const startButtElem = document.getElementById("startButton");
const pointsElem = document.getElementById("points");
const pointButtons = [...pointsElem.querySelectorAll("button")];
const polygons = [...document.querySelectorAll("#areas [name]")];
const allPlaces = pointButtons.concat(polygons);

// -------- CONFIG -------- 
const config = {
  scaleLon: parseFloat(pointsElem.getAttribute('scale-lon')) || 1,
  scaleLat: parseFloat(pointsElem.getAttribute('scale-lat')) || 1,
  moveLon: parseFloat(pointsElem.getAttribute('move-lon')) || 0,
  moveLat: parseFloat(pointsElem.getAttribute('move-lat')) || 0,
  pointsScaleGlobal: parseFloat(pointsElem.getAttribute('points-scale')) || 1,
}

// -------- AUDIO -------- 
const audioCorrect = new Audio('assets/correct.mp3');
const audioWrong = new Audio('assets/error.mp3');

// -------- GAME STATE -------- 
let queue = [];
let place;
let score;
let errors;
let timerInterval;
let startTimer;
let started = false;

// -------- HELPER -------- 
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function playSound(sound) { sound.currentTime = 0; sound.play(); }


// -------- GAME -------- 
function end() {
  place = null;
  header.innerText =
    `Wynik: ${Math.round((score / (allPlaces.length * 3)) * 100)}%`;
  clearInterval(timerInterval);
  timerInterval = null;
}

function nextPlace() {
  errors = 0;
  if (queue.length === 0) {
    end();
    return;
  }
  place = queue.pop();

  header.innerText = `Znajdź '${place.getAttribute("name")}'`;
}

function reset() { startButtElem.innerText = 'Start'; end(); }
function updateScore() { scoreElem.innerText = `${score.toString()}/${allPlaces.length * 3}`; }

function start() {
  startButtElem.innerText = 'Reset';

  queue = shuffle(allPlaces.slice());

  queue.forEach((p) => {
    p.setAttribute('class', '');
  })

  score = 0;
  startTimer = new Date();

  timerInterval = setInterval(function () {
    let delta = Date.now() - startTimer;
    timerElem.innerText =
      Math.floor(delta / 60000) +
      ":" +
      ((Math.floor(delta / 1000) % 60) + "").padStart(2, "0") +
      "." +
      ((Math.floor(delta / 10) % 100) + "").padStart(2, "0");
  }, 10);

  updateScore();
  nextPlace();
}


function start_or_reset() {
  if (!started) start()
  else reset()
  started = !started;
}


function cursorTextPoint(text, correct, x, y) {
  const elem = document.createElement("div");
  elem.className = correct ? "cursorText correct" : "cursorText red";
  elem.textContent = text;
  document.body.appendChild(elem);
  
  const w = elem.offsetWidth;
  const h = elem.offsetHeight;
  const sx = window.scrollX;
  const sy = window.scrollY;
  const M = 8;

  let left = sx + x + 13;
  let top  = sy + y - h + 5;

  left = Math.max(sx + M, Math.min(left, sx + window.innerWidth  - w - M));
  top  = Math.max(sy + M, Math.min(top,  sy + window.innerHeight - h - M));

  elem.style.left = `${left}px`;
  elem.style.top  = `${top}px`;

  setTimeout(() => elem.remove(), 2000);
} 


let pointPressed = function (btn, event) {
  let name = btn.getAttribute("name");

  if (!place) return;
  // If incorrect
  if (name !== place.getAttribute("name")) {
    playSound(audioWrong);
    cursorTextPoint(name, false, event.clientX, event.clientY);
    errors = Math.min(errors+1, 2);
    if (errors > 1) {
      place.classList.add("hint");
    }
    return;
  }

  // Correct answer
    cursorTextPoint(name, true, event.clientX, event.clientY);
  playSound(audioCorrect);

  if (place.classList.contains("hint")) {
    place.classList.remove("hint");
    btn.classList.add("red");
  } else if (errors === 1) {
    btn.classList.add("orange");
  } else {
    btn.classList.add("correct");
  }
  score += 3 - errors;
  updateScore();
  nextPlace();
  return;
};


function calcXY(lon, lat) {
  // Clamp latitude to [-90, 90]
  lat = Math.max(-90, Math.min(90, lat));
  
  // Normalize longitude to [-180, 180]
  lon = ((lon + 180) % 360 + 360) % 360 - 180;

  lat -= config.moveLat;
  lat *= config.scaleLat;
  lon -= config.moveLon;
  lon *= config.scaleLon;
  
  // Convert to %
  let x = (lon + 180) / 360 * 100;  // 0 → 100
  let y = (90 - lat) / 180 * 100-1; // 0 (north) → 100 (south)

  let xPercent = x-1.1
  let yPercent = y*(0.74-0)-0.5

  return [xPercent, yPercent]
}


// -------- INIT BUTTS -------- 
for (let i = 0; i < elements.length; i++) {
  if (elements[i].tagName != "BUTTON") continue;
  const btn = elements[i];

  let x = parseFloat(btn.getAttribute("x"));
  let y = parseFloat(btn.getAttribute("y"));
  if (isNaN(x) || isNaN(y)) {
    let lon = parseFloat(btn.getAttribute("long"));
    let lat = parseFloat(btn.getAttribute("lat"));

    [x, y] = calcXY(lon, lat)
  }
  let dx = parseFloat(btn.getAttribute("dx")) || 0;
  let dy = parseFloat(btn.getAttribute("dy")) || 0;

  x += dx;
  y += dy;

  btn.style.left = x + "%";
  btn.style.top = y + "%";
  
  let point_size = parseFloat(btn.getAttribute("size")) || 1

  btn.style.width = point_size + "rem";
  
  btn.style.transform = `translate(50%, 50%) scale(${config.pointsScaleGlobal*100}%)`
  btn.addEventListener("click", (e) => pointPressed(btn, e));
}


function initAreas() {
  for (const shape of polygons){
    const pts = shape.getAttribute("points")
      .trim().split(/\s+/)
      .map((p) => p.split(",").map(Number))
      .map(([lat, lon]) => calcXY(lon, lat)) 
      .map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`)
      .join(" ");
    shape.setAttribute("points", pts);
    shape.addEventListener("click", (e) => pointPressed(shape, e));
  }
}
initAreas();