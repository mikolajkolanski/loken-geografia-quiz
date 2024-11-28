var elements = document.getElementById("points").children;
var header = document.getElementById("header");
var score_elem = document.getElementById("score");
var timer_elem = document.getElementById("clock");
var start_butt_elem = document.getElementById("startButton");
var start_places = [];
var places;
var place;
var score;
var errors;
var start_timer;

var buttonPressed = function () {
  var name = this.getAttribute("name");

  if (name == place.getAttribute("name")) {
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
  }

  errors += 1;
  if (errors > 1) {
    place.classList.add("hint");
  }
};

for (var i = 0; i < elements.length; i++) {
  if (elements[i].tagName != "BUTTON") continue;
  start_places.push(elements[i]);
  elements[i].style.left = elements[i].getAttribute("x") + "%";
  elements[i].style.top = elements[i].getAttribute("y") + "%";
  elements[i].style.width = elements[i].getAttribute("size") + "rem";
  elements[i].addEventListener("mousedown", buttonPressed, false);
}

function start() {
  start_butt_elem.remove();
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

  next();
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
