"use strict";
// -------- DOM -------- 
const elements = document.getElementById("points").children;
const header = document.getElementById("header");
const scoreElem = document.getElementById("score");
const timerElem = document.getElementById("clock");
const startButtElem = document.getElementById("startButton");
const pointsElem = document.getElementById("points");


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
let startPlaces = [];
let places;
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

function playSound(sound) {
  sound.currentTime = 0
  sound.play();
}


// -------- GAME -------- 
function end() {
  header.innerText =
    `Wynik: ${Math.round((score / (startPlaces.length * 3)) * 100)}%`;
  clearInterval(timerInterval);
  timerInterval = null;
}

function nextPlace() {
  errors = 0;
  if (places.length === 0) {
    end();
    return;
  }
  place = places.pop();

  header.innerText = `Znajdź '${place.getAttribute("name")}'`;
}


function reset() {
  startButtElem.innerText = 'Start';
  end();
}


function updateScore() {
  scoreElem.innerText = `${score.toString()}/${startPlaces.length * 3}`;
}


function start() {
  startButtElem.innerText = 'Reset';

  startPlaces.forEach((p) => {
    p.className = '';
  })

  places = startPlaces.slice();
  places = shuffle(places)
  console.log(places);
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


let pointPressed = function () {
  let name = this.getAttribute("name");

  // If incorrect
  if (name !== place.getAttribute("name")) {
    playSound(audioWrong);
    cursorTextPoint(this, name, false);
    errors = Math.min(errors+1, 2);
    if (errors > 1) {
      place.classList.add("hint");
    }
    return;
  }

  // Correct answer
  cursorTextPoint(this, name, true);
  playSound(audioCorrect);

  if (place.classList.contains("hint")) {
    place.classList.remove("hint");
    this.classList.add("red");
  } else if (errors === 1) {
    this.classList.add("orange");
  } else {
    this.classList.add("correct");
  }
  score += 3 - errors;
  updateScore();
  nextPlace();
  return;
};


function cursorTextPoint(point, text, correct) {
  const p = point.getBoundingClientRect();
  const elem = document.createElement('div');
  if (correct) elem.className = 'cursorText correct';
  else         elem.className = 'cursorText red';
  elem.textContent = text;
  elem.style.left = `${p.left+16}px`;
  elem.style.top = `${p.top}px`;
  document.body.appendChild(elem);

  setTimeout(() => elem.remove(), 4000);  
} 


function calcXY(lon, lat) {
  // Clamp latitude to [-90, 90]
  lat = Math.max(-90, Math.min(90, lat));
  
  // Normalize longitude to [-180, 180]
  lon = ((lon + 180) % 360 + 360) % 360 - 180;

  lat-config.moveLat
  lat*config.scaleLat
  lon-config.moveLon
  lon*config.scaleLon
  
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
  startPlaces.push(elements[i]);
  let x = parseFloat(elements[i].getAttribute("x"));
  let y = parseFloat(elements[i].getAttribute("y"));
  if (isNaN(x) || isNaN(y)) {
    let lon = parseFloat(elements[i].getAttribute("long"));
    let lat = parseFloat(elements[i].getAttribute("lat"));

    [x, y] = calcXY(lon, lat)
  }
  let dx = parseFloat(elements[i].getAttribute("dx")) || 0;
  let dy = parseFloat(elements[i].getAttribute("dy")) || 0;

  x += dx;
  y += dy;

  elements[i].style.left = x + "%";
  elements[i].style.top = y + "%";
  
  let point_size = parseFloat(elements[i].getAttribute("size")) || 1

  elements[i].style.width = point_size + "rem";
  
  elements[i].style.transform = `translate(50%, 50%) scale(${config.pointsScaleGlobal*100}%)`
  elements[i].addEventListener("mousedown", pointPressed, false);
}

