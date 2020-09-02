const { Boards, Led, Pin } = require("johnny-five");

var ports = [
       { id: "A", port: "/dev/ttyACM0" },
       { id: "B", port: "/dev/ttyACM1" }
];

const boards = new Boards(ports);
var actuatorBoard = null;
var rgbled = null;
var relay = null;

boards.on("ready", () => {

    boards.each(board => {
      
        if(board.io.firmware.name === 'sensor.ino'){
            //console.log('Sensor IoT device is online');
            // ignore this board for this part of the demo
        }else if(board.io.firmware.name === 'actuator.ino'){
            console.log('Actuator IoT device is online');
            actuatorBoard = board;
            actuatorBoard.samplingInterval(1000);

            rgbled = new Led.RGB({
                board: actuatorBoard,
                pins: [6, 5, 3]
            });
            rgbled.intensity(0);

            relay = new Pin({
                board: actuatorBoard,
                pin: 7
            });

        }
    });
});


var express = require('express')
var app = express()
var bodyParser = require('body-parser')



function componentToHex(c) {
  var hex = c.toString(16);
  return hex.length == 1 ? "0" + hex : hex;
}

function rgbToHex(r, g, b) {
  return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}



app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

app.get('/status', function (req, res) {
    res.status(200).json({
        rgb_led: { brightness: rgbled.intensity(), color: rgbled.color()},
        switch: relay.value?'On':'Off'
    });
});

app.post('/rgb', function (req, res) {
    var red = req.body.red?((req.body.red>255)?255:(req.body.red<0)?0:req.body.red):0;
    var green = req.body.green?((req.body.green>255)?255:(req.body.green<0)?0:req.body.green):0;
    var blue = req.body.blue?((req.body.blue>255)?255:(req.body.blue<0)?0:req.body.blue):0;
    var newHex = rgbToHex(red, green, blue);
    var intensity = req.body.brightness;
    if(!intensity || intensity < 0){
        intensity = 0;
    }
    else if (intensity > 100){ 
        intensity = 100;
    }

    console.log(`Color: ${newHex}, Intensity: ${intensity}`)
    rgbled.color(newHex);
    rgbled.intensity(intensity);

    res.status(201).send('');
});

app.post('/switch', function (req, res) {
    var newVal = req.body.switch?req.body.switch:0;
    if(newVal === 'On' ) 
        newVal = 1;
    else newVal = 0;

    if(newVal) relay.high();
    else relay.low();
    console.log(`Relay state: ${newVal?'On':'Off'}`);
    res.status(201).send();
});

app.listen(3000)
