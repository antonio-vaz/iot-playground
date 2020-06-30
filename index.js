const { Boards, Pin, Thermometer } = require("johnny-five");
const iot_core = require('./publish_example');
const event_trigger = require('./publish_event_pubsub');

var schedule = require('node-schedule');

var ports = [
       { id: "A", port: "/dev/cu.usbmodem141101" },
       { id: "B", port: "/dev/cu.usbmodem145101" }
];

const boards = new Boards(ports);
var sensorBoard = null;

boards.on("ready", () => {

  boards.each(board => {
      
      if(board.io.firmware.name === 'sensor.ino'){
          console.log('Sensor IoT device is online');
          sensorBoard = board;
          sensorBoard.samplingInterval(1000);
      }else if(board.io.firmware.name === 'actuator.ino'){
        console.log('Actuator IoT device is online');
      }else{
          console.log('Unrecognized board is connected');
      }
  });
});


var j = schedule.scheduleJob('*/15 * * * * *', function(){
    
    var promises = [];

    if(sensorBoard){

        var liquidLevel = new Pin({ board: sensorBoard, pin: "A0" });
        var liquidPressure = new Pin({ board: sensorBoard, pin: "A1" });
        var light = new Pin({ board: sensorBoard, pin: "A2" });
        

        promises.push(new Promise( (resolve, reject)  => {
            liquidLevel.query(function(state) {
                resolve({sensor: 'Level', value: state.value} );
            });
        }));

        promises.push(new Promise( (resolve, reject)  => {
            liquidPressure.query(function(state) {
                resolve({sensor: 'Pressure', value: state.value} );
            });
        }));

        promises.push(new Promise( (resolve, reject)  => {
            light.query(function(state) {
                resolve({sensor: 'Light', value: state.value} );
            });
        }));

        promises.push(new Promise( (resolve, reject)  => {
            var temp = new Thermometer({
                controller: "LM35",
                board: sensorBoard, pin: "A3"});

            temp.on("change", () => {
                const {celsius, fahrenheit, kelvin} = temp;
                resolve({sensor: 'Temp', celsius: celsius, fahrenheit: fahrenheit, kelvin: kelvin} );
            });
        }));
            
        if(promises){
            Promise.all(promises).then((values) => {
                iot_core.publishAsync(JSON.stringify({ sensors: values }));
                
                // if the liquid level is above 85 percent and event should be raised;
                // if the liquid pressure is above 75 percent an event should be raised;
            
                values.forEach(element => {
                    if(element.sensor == 'Level' && element.value > (1023 * 0.85)){
                        console.log('Triggering event for liquid level above 85%');

                        const data1 = JSON.stringify({event: 'Liquid Level above 85'});
                        event_trigger.publishEvent(data1);
                    }
                    if(element.sensor == 'Pressure' && element.value > (1023 * .75)){
                        console.log('Triggering event for liquid pressure about 75%');
                        const data1 = JSON.stringify({event: 'Liquid Pressure above 75'});
                        event_trigger.publishEvent(data1);
                    }
                });
            });
        }
    }
    else{
        //empty on purpose, there is nothing to run under these conditions
    }
    
});