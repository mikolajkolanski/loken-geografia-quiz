const elements = document.getElementById("points").children;
const input = document.getElementById("input");
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
    audio_wrong.cloneNode(true).play();
    cursorTextPoint(this, name, false);
    if (errors < 2) errors += 1;
    if (errors > 1) {
      place.classList.add("hint");
    }
    return;
  }

  // Correct answer
  cursorTextPoint(this, name, true);
  

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

function checkAnswer(e) {
  const polishMap = {
        'ą': 'a', 'ć': 'c', 'ę': 'e', 'ł': 'l', 'ń': 'n',
        'ó': 'o', 'ś': 's', 'ż': 'z', 'ź': 'z',
        'Ą': 'a', 'Ć': 'c', 'Ę': 'e', 'Ł': 'l', 'Ń': 'n',
        'Ó': 'o', 'Ś': 's', 'Ż': 'z', 'Ź': 'z'
  };


  let v = input.value        
        .replace(/\s+/g, '')  // remove all whitespace (spaces, tabs, newlines)
        .toLowerCase()        // convert to lowercase
        .replace(/\d+/g, '') // remove all digits
        .replace(/./g, char => polishMap[char] || char);

  let p = place.getAttribute("name")        
        .replace(/\s+/g, '')  // remove all whitespace (spaces, tabs, newlines)
        .toLowerCase()        // convert to lowercase
        .replace(/\d+/g, '') // remove all digits
        .replace(/./g, char => polishMap[char] || char);
  console.log(v, p)
  if (v == p) {
    input.value = ""
    audio_correct.cloneNode(true).play();
    place.classList.remove("hint");
    place.classList.add("correct");

    next()
  }
}

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

  place.classList.add("hint");
  // header.innerText = "Znajdź '" + place.getAttribute("name") + "'";
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

  elements[i].style.left = x + "%";
  elements[i].style.top = y + "%";
  elements[i].style.width = elements[i].getAttribute("size") + "rem";
  // elements[i].addEventListener("mousedown", pointPressed, false);
}

function calcXY(lon, lat) {
    const lon0 = 35;       // Europe center longitude
    const hScale = 1.2;  // horizontal stretch
    const vScale = 1.2;  // vertical stretch

    const phi = lat * Math.PI / 180;
    const lambda = lon * Math.PI / 180;

    // Solve theta iteratively
    let theta = phi; // initial guess
    for (let i = 0; i < 10; i++) {
        const f = theta + Math.sin(theta) * Math.cos(theta) + 2 * Math.sin(theta) - Math.PI * Math.sin(phi);
        const fPrime = 1 + Math.cos(2*theta) + 2*Math.cos(theta);
        theta = theta - f / fPrime;
    }

    // Eckert IV constants
    const xConst = 2 / Math.sqrt(4 * Math.PI + Math.PI * Math.PI) * hScale;
    const yConst = 2 * Math.sqrt(Math.PI / (4 + Math.PI)) * vScale;

    let x = xConst * (lambda - lon0 * Math.PI / 180) * (1 + Math.cos(theta));
    let y = yConst * Math.sin(theta);

    // Normalize to 0-100%
    let xPercent = (x + Math.PI) / (2 * Math.PI) * 100 * hScale - 6;
    let  yPercent = (Math.PI/2 - y) / (Math.PI) * 100 * vScale - 4;

  // x = 3
  // x = 96
  xPercent = xPercent*(0.96-0.03)+3
  
  // y = 4
  // y = 84.5
  yPercent = yPercent*(0.845-0.04)+4

  return [xPercent, yPercent]
}