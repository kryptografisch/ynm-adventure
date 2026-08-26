var express = require("express");
var path = require("path");
var favicon = require("serve-favicon");
var logger = require("morgan");
var cookieParser = require("cookie-parser");
var bodyParser = require("body-parser");

var app = express();

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "jade");

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger("dev"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

var currentAnswers = {
  yes: 0,
  no: 0,
};

function resetCurrentAnswers() {
  currentAnswers.yes = 0;
  currentAnswers.no = 0;
}

var clientCounter = 0;

app.get("/", function (req, res) {
  res.redirect("/game");
});

app.get("/debug", function (req, res) {
  res.sendFile(path.join(__dirname, "/views", "debug.html"));
});

app.get("/game", function (req, res) {
  res.sendFile(path.join(__dirname, "/views", "game.html"));
});

app.get("/data", function (req, res) {
  res.sendFile(path.join(__dirname, "/public", "data.json"));
});

app.get("/client", function (req, res) {
  res.sendFile(path.join(__dirname, "/public", "client.html"));
});

app.post("/disconnect", function (req, res) {
  if (eventRes.length > 0) {
    for (var index in eventRes) {
      if (parseInt(eventRes[index].id) == req.body) {
        console.log(
          "deleted res obj from array with id: " + eventRes[index].res.id,
        );
        eventRes.splice(index, 1);
      }
    }
  }
  res.sendStatus(200);
});

app.get("/images", function (req, res) {
  var image = req.query.image;
  res.sendFile(path.join(__dirname, "/public/images/" + image + ".png"));
});

app.get("/videos", function (req, res) {
  var video = req.query.video;
  res.sendFile(path.join(__dirname, "/public/videos/" + video + ".mp4"));
});

app.post("/triggerVoting", function (req, res) {
  resetCurrentAnswers();
  var votingTime = parseInt(req.body["votingTime"]);

  sendEventRes(parseInt(req.body["mediaCounter"]), votingTime);
  //res.setHeader('Cache-Control','no-cache');

  setTimeout(
    function () {
      sendVoteData();
    },
    votingTime * 1000 + 3000,
  );
  res.sendStatus(200);
});

var indexRes;

var masterInterval;
app.get("/updates", function (req, res) {
  res.writeHead(200, {
    Connection: "keep-alive",
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
  });

  indexRes = res;

  masterInterval = setInterval(function () {
    res.write("event: ping\n");
    res.write("data: {}\n\n");
  }, 25000);
});

function sendVoteData() {
  indexRes.write("event: vote\n");
  indexRes.write(
    'data: { "answers" : ' + JSON.stringify(currentAnswers) + " }\n\n",
  );
}

////client functions
var eventRes = [];
function sendEventRes(eventCounter, votingTime) {
  for (index in eventRes) {
    eventRes[index].res.write(
      'data: { "eventNr" : ' +
        eventCounter +
        ', "votingTime":' +
        JSON.stringify(votingTime) +
        "}\n\n",
    );
  }
}
app.get("/events", function (req, res) {
  res.writeHead(200, {
    Connection: "keep-alive",
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
  });

  eventRes.push({ id: clientCounter, res: res });

  res.write("event: id\n");
  res.write('data: { "id": ' + clientCounter + "}\n\n");
  clientCounter++;

  setInterval(function () {
    res.write("event: ping\n");
    res.write("data: {}\n\n");
  }, 25000);
});

app.post("/answer", function (req, res) {
  var answer = req.body.data;
  //console.log('received answer: ' + answer);
  switch (parseInt(answer)) {
    case 0:
      currentAnswers.yes += 1;
      break;
    case 1:
      currentAnswers.no += 1;
      break;
    default:
      console.log("no valid answer");
      break;
  }
  res.sendStatus(200);
});

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  var err = {};
  err.status = 404;
  next(err);
});

// error handlers

// will print stacktrace
app.use(function (err, req, res, next) {
  res.status(err.status || 500);
  res.render("error", {
    title: "Tower Dungeon Community",
    message: `Ooops, wrong endpoint. You are better off clicking one of the links below`,
    error: {},
  });
});

module.exports = app;
