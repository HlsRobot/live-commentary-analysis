require('dotenv').config();
const express = require('express');
const ExpressWs = require('express-ws');
const fs = require('fs');
const axios = require('axios');
const bodyParser = require('body-parser')

const twilio = require("twilio");
const OpenAI = require("openai");

const app = express();
const PORT = process.env.PORT || 3001;
const SNOWFLAKE_ACCOUNT_ID = process.env.SNOWFLAKE_ACCOUNT_ID
const SEGMENT_SPACE = process.env.SEGMENT_SPACE
const SEGMENT_BEARER_TOKEN = process.env.SEGMENT_BEARER_TOKEN


// Initialize express-ws
ExpressWs(app);
// Enable CORS
app.use(bodyParser.json()); // support json encoded bodies
app.use(express.urlencoded({ extended: true })); // support encoded bodies

// Enable json parsing of request bodies
const jsonParser = bodyParser.json()


////////// SPORTCAST USE CASE ///////
const client = twilio(process.env.ACCOUNT_SID, process.env.AUTH_TOKEN);
const openaiClient = new OpenAI();

app.post('/sport', async (req, res) => {
  
  
  console.log('\n');
  if (req.body.TranscriptionData != undefined){
    let transcription = JSON.parse(req.body.TranscriptionData).transcript;
    console.log('\n');
    console.log('\u001b[' + 32 + 'm' + 'Transcription:' + '\u001b[0m');
    console.log(transcription);
    console.log('\u001b[' + 31 + 'm' + 'Analysis:' + '\u001b[0m');
    const response =  await openaiClient.responses.create({
        model: "gpt-4o",
        instructions: "You are a soccer expert and understand what a british sportcaster is saying",
        input: `Analyse the following text and create simple text outputs of what is happening e.g. "GOAL: team1 0 team2 1" or "Corner kick: for team1" etc: ${transcription}`
    });
    console.log(response.output_text);
    //console.log(transcription);
    // if (transcription.includes("goal")) {
    //   console.log("!!!!!!!!!!!!!!!!!!!!!!!!");
    //   console.log("GOAL");
    //   console.log("!!!!!!!!!!!!!!!!!!!!!!!!");
    // } else if (transcription.includes("offsite")) {
    //   console.log("!!!!!!!!!!!!!!!!!!!!!!!!");
    //   console.log("OffSITE");
    //   console.log("!!!!!!!!!!!!!!!!!!!!!!!!");
    // } else if (transcription.includes("corner")) {
    //   console.log("!!!!!!!!!!!!!!!!!!!!!!!!");
    //   console.log("CORNER KICK");
    //   console.log("!!!!!!!!!!!!!!!!!!!!!!!!");
    // } else if (transcription.includes("yellow card")) {
    //   console.log("!!!!!!!!!!!!!!!!!!!!!!!!");
    //   console.log("YELLOW CARD");
    //   console.log("!!!!!!!!!!!!!!!!!!!!!!!!");
    // } else if (transcription.includes("red card")) {
    //   console.log("!!!!!!!!!!!!!!!!!!!!!!!!");
    //   console.log("RED CARD");
    //   console.log("!!!!!!!!!!!!!!!!!!!!!!!!");
    // } else if (transcription.includes("foul")) {
    //   console.log("!!!!!!!!!!!!!!!!!!!!!!!!");
    //   console.log("FOUL");
    //   console.log("!!!!!!!!!!!!!!!!!!!!!!!!");
    // } else {
    //   console.log(transcription);
    // }
  } else {
    console.log(req.body);
  }
})

app.post('/start', (req, res) => {

  //console.log(req.body)
  console.log("Starting transcription");
  const response = new twilio.twiml.VoiceResponse();
  console.log(response);
  const say = response.say("Hello!");
  const start = response.start();
  console.log(start);
  start.transcription({statusCallbackUrl: 'https://22c9-147-161-170-176.ngrok-free.app/sport', speechModel: "telephony", transcriptionEngine: "google", hints: 'goal, offsite, corner kick, yellow card, red card, owngoal, foul'})
  console.log(start);
  console.log(response.toString());
})

app.get('/openai', async (req, res) => {
  const openaiClient = new OpenAI();

  const input = "And we’re underway at Anfield! Liverpool in their famous red, Manchester United in white—two historic rivals, and you can feel the tension already! United start with early possession, calmly working it around the back—Maguire finds Dalot on the right, looking for an option. Here come Liverpool! Mac Allister into Salah, cutting inside—lovely footwork—he threads it through to Núñez—OH, but Varane gets a toe in at the last second! United push forward now—Fernandes dropping deep, spraying a pinpoint diagonal to Rashford—one-on-one with Alexander-Arnold—early cross—Van Dijk heads clear! McTominay wins it in midfield, feeds Højlund—he turns! He’s going for goal from distance—Ohhh, just wide! That had Alisson scrambling! Liverpool piling on the pressure now—Szoboszlai spreads it wide to Robertson, who whips it in—Núñez gets up! Header! OH, what a save from Onana! He keeps United level! United counter quickly—Fernandes slides it to Rashford—he’s got the pace—skips past Konaté—into the box! Shoots! BLOCKED by Van Dijk! Outstanding defending! Yellow card! Oh, and the referee’s had enough there! Casemiro comes in late on Mac Allister, catching him on the ankle—he’s into the book, and no complaints from the United man. Corner for Liverpool—Robertson delivers—Van Dijk climbs! Powerful header—IT'S IN! GOAL FOR LIVERPOOL! The captain delivers, and Anfield erupts! Liverpool 1, Manchester United 0! United looking for a quick response—McTominay finds Fernandes, who tries to slip it through to Højlund—but Van Dijk is there again! He’s been a rock at the back so far. Liverpool are relentless—Alexander-Arnold darts forward, links up with Salah—beautiful give-and-go—Salah into the box! Drills it low—Oh, Núñez is inches away from tapping it in! United trying to control the tempo now—Casemiro spreading it wide to Dalot, looking for Rashford—he gets past his man! Cross comes in—Højlund with a header—straight at Alisson! Liverpool break again! Szoboszlai drives forward, slides it to Gakpo—he cuts inside, goes for goal—OH, JUST OVER THE BAR! Anfield thought that was in! It’s been an electrifying opening twenty minutes—Liverpool leading through Van Dijk’s header, but United still in it. This one is shaping up to be an absolute classic!"

  const response =  await openaiClient.responses.create({
      model: "gpt-4o",
      instructions: "You are a soccer expert and understand what a british sportcaster is saying",
      input: `Analyse the following text and create simple text outputs of what is happening e.g. GOAL: team1 0 team2 1 or Corner kick for team1 etc: ${input}`
  });
  console.log(response.output_text);
  return response.output_text;
})

////////// SERVER BASICS //////////

// Basic HTTP endpoint
app.get('/', (req, res) => {
    res.send('WebSocket Server Running');
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
}).on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use`);
    } else {
        console.error('Failed to start server:', error);
    }
    process.exit(1);
});
