const elements = document.getElementById("points").children;
const header = document.getElementById("header");
const score_elem = document.getElementById("score");
const timer_elem = document.getElementById("clock");
const start_butt_elem = document.getElementById("startButton");
var start_places = [];
var places;
var place;
var score;
var errors;
var start_timer;
var started = false;

// Audio
const audio_correct = new Audio('assets/correct.mp3');
const audio_wrong = new Audio('assets/error.mp3');

var pointPressed = function () {
  var name = this.getAttribute("name");


  if (name != place.getAttribute("name")) {
    audio_wrong.currentTime = 0
    audio_wrong.play();
    cursorTextPoint(this, name, false);
    if (errors < 2) errors += 1;
    if (errors > 1) {
      place.classList.add("hint");
    }
    return;
  }

  // Correct answer
  cursorTextPoint(this, name, true);
  audio_correct.currentTime = 0
  audio_correct.play();

  if (place.classList.contains("hint")) {
    place.classList.remove("hint");
    this.classList.add("red");
  } else if (errors == 1) {
    this.classList.add("orange");
  } else {
    this.classList.add("correct");
  }
  score += 3 - errors;
  updateScore();
  next();
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
} 

function start() {
  start_butt_elem.innerText = 'Reset';

  start_places.forEach((p) => {
    p.className = '';
  })

  places = start_places.slice();
  places.sort(() => 0.5 - Math.random());
  console.log(places);
  score = 0;
  start_timer = new Date();

  timer = setInterval(function () {
    var delta = Date.now() - start_timer;
    timer_elem.innerText =
      Math.floor(delta / 60000) +
      ":" +
      ((Math.floor(delta / 1000) % 60) + "").padStart(2, "0") +
      "." +
      ((Math.floor(delta / 10) % 100) + "").padStart(2, "0");
  }, 10);

  updateScore();
  next();
}

function reset() {
  start_butt_elem.innerText = 'Start';
  end();
}

function start_or_reset() {
  if (!started) start()
  else reset()
  started = !started;
}

function updateScore() {
  score_elem.innerText = score.toString() + "/" + start_places.length * 3;
}

function end() {
  // To end this shit
  header.innerText =
    "Wynik: " + Math.round((score / (start_places.length * 3)) * 100) + "%";
  clearInterval(timer);
  timer = null;
}

function next() {
  errors = 0;
  if (places.length == 0) {
    end();
    return;
  }
  place = places.pop();
  console.log(places);

  header.innerText = "Znajdź '" + place.getAttribute("name") + "'";
}


for (var i = 0; i < elements.length; i++) {
  if (elements[i].tagName != "BUTTON") continue;
  start_places.push(elements[i]);
  let x = parseFloat(elements[i].getAttribute("x"));
  let y = parseFloat(elements[i].getAttribute("y"));
  if (isNaN(x) || isNaN(y)) {
    let lon = parseFloat(elements[i].getAttribute("long"));
    let lat = parseFloat(elements[i].getAttribute("lat"));

    [x, y] = calcXY(lon, lat)
  }
  let dx = parseFloat(elements[i].getAttribute("dx"));
  let dy = parseFloat(elements[i].getAttribute("dy"));

  if (!isNaN(dx)) x += dx;
  if (!isNaN(dy)) y += dy;
  elements[i].style.left = x + "%";
  elements[i].style.top = y + "%";
  elements[i].style.width = elements[i].getAttribute("size") + "rem";
  elements[i].addEventListener("mousedown", pointPressed, false);
}

function calcXY(lon, lat) {
  // Clamp latitude to [-90, 90]
  lat = Math.max(-90, Math.min(90, lat));
  
  // Normalize longitude to [-180, 180]
  lon = ((lon + 180) % 360 + 360) % 360 - 180;

  // Convert to %
  const x = (lon + 180) / 360 * 100;   // 0 → 100
  const y = (90 - lat) / 180 * 100-1;    // 0 (north) → 100 (south)

  // x = 3
  // x = 94
  // xPercent = x*(0.94-0.03)+3
  xPercent = x 
  // y = 0
  // y = 74
  yPercent = y*(0.74-0)+0

  return [xPercent, yPercent]
}
