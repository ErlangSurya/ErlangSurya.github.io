const startScreen = document.querySelector('#startScreen');
const timerScreen = document.querySelector('#timerScreen');
const fulltimeDisplay = document.querySelector('#fulltimeDisplay');
const roundDisplay = document.querySelector('#roundDisplay');
const roundtimeDisplay = document.querySelector('#roundtimeDisplay');
let bellSound = document.getElementById("bell");
let sound_duration = bellSound.duration;

const worker = new Worker('scripts/timer.worker.js');

let TOTAL_TIME;
let WORK_TIME = 25 * 60;
let BREAK_TIME = 5 * 60;

// debugging time
// let TOTAL_TIME = 90;
// const WORK_TIME = 30;
// const BREAK_TIME = 30;

const startButton4 = document.querySelector('#startButton4')
const startButton2 = document.querySelector('#startButton2')


// function formatTime(seconds) {
//     const hours = Math.floor(seconds / 3600);
//     const minutes = Math.floor((seconds % 3600) / 60);
//     const remainingSeconds = seconds % 60;
//     const full_time =  `${hours.toString().padStart(1, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')} \n`;
//     const round_number = 1 + Math.floor((TOTAL_TIME - seconds)/(WORK_TIME+BREAK_TIME));
//     let work_or_break;
//     let round_seconds;
//     let time_in_round = (TOTAL_TIME-seconds) - (WORK_TIME+BREAK_TIME)*(round_number-1);
//     if (time_in_round===WORK_TIME ||time_in_round===0 ){
//         bellSound.play();
//     }
//     if (time_in_round<WORK_TIME){
//         work_or_break = ' Work ';
//         round_seconds = WORK_TIME - time_in_round;
        
//     }else{
//         work_or_break = ' Break ';
//         round_seconds = WORK_TIME + BREAK_TIME -time_in_round;
//     }
//     const round_minutes = Math.floor((round_seconds % 3600) / 60);
//     const round_remainingSeconds = round_seconds % 60;
//     const round_full_time =  `${round_minutes.toString().padStart(2, '0')}:${round_remainingSeconds.toString().padStart(2, '0')}`;
//     fulltimeDisplay.textContent= full_time;
//     roundDisplay.textContent = work_or_break + round_number;
//     roundtimeDisplay.textContent = round_full_time;
//     }


function start(){
    startScreen.style.display = 'none';
    timerScreen.style.display = 'flex';
    worker.postMessage([TOTAL_TIME, WORK_TIME, BREAK_TIME, sound_duration])
    // let seconds = TOTAL_TIME;
    // formatTime(seconds);
    // const timer = setInterval(() => {
    //     worker.postMessage(seconds);
    //     // formatTime(seconds);
    //     seconds--;
    //     if (seconds < 0) {
    //         timerScreen.textContent = 'Time\'s up!';
    //         bellSound.play();
    //         setTimeout(() => {
    //             clearInterval(timer);
    //           }, bellSound.duration * 1000);
    //       }
    // }, 1000)
}

worker.onmessage = function(message){
    if (message.data[0]==='time'){
        const [full_time, round_text, round_full_time] = message.data[1];
        fulltimeDisplay.textContent= full_time;
        roundDisplay.textContent = round_text;
        roundtimeDisplay.textContent = round_full_time;
    }
    if (message.data[0]==='sound'){
        bellSound.play();
    }
    if (message.data[0]==='stop'){
        timerScreen.textContent = "Time's up";
    }
}


startButton2.addEventListener('click', () =>{
    TOTAL_TIME = 2*60*60;
    start();
})

startButton4.addEventListener('click', () =>{
    TOTAL_TIME = 4*60*60;
    start();
})

document.addEventListener('click', () => {
    bellSound.muted = false;
  });