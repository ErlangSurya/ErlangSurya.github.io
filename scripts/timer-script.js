const startScreen = document.querySelector('#startScreen');
const timerScreen = document.querySelector('#timerScreen');
const fulltimeDisplay = document.querySelector('#fulltimeDisplay');
const roundDisplay = document.querySelector('#roundDisplay');
const roundtimeDisplay = document.querySelector('#roundtimeDisplay');
let bellSound = document.getElementById("bell");


let TOTAL_TIME = 4 * 60 * 60;
const WORK_TIME = 25 * 60;
const BREAK_TIME = 5 * 60;

// debugging time
// let TOTAL_TIME = 90;
// const WORK_TIME = 30;
// const BREAK_TIME = 30;
const startButton = document.querySelector('.startButton')


function formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    const full_time =  `${hours.toString().padStart(1, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')} \n`;
    const round_number = 1 + Math.floor((TOTAL_TIME - seconds)/(WORK_TIME+BREAK_TIME));
    let work_or_break;
    let round_seconds;
    let time_in_round = (TOTAL_TIME-seconds) - (WORK_TIME+BREAK_TIME)*(round_number-1);
    if (time_in_round===WORK_TIME ||time_in_round===0 ){
        bellSound.play();
    }
    if (time_in_round<WORK_TIME){
        work_or_break = ' Work ';
        round_seconds = WORK_TIME - time_in_round;
        
    }else{
        work_or_break = ' Break ';
        round_seconds = WORK_TIME + BREAK_TIME -time_in_round;
    }
    const round_minutes = Math.floor((round_seconds % 3600) / 60);
    const round_remainingSeconds = round_seconds % 60;
    const round_full_time =  `${round_minutes.toString().padStart(2, '0')}:${round_remainingSeconds.toString().padStart(2, '0')}`;
    fulltimeDisplay.textContent= full_time;
    roundDisplay.textContent = work_or_break + round_number;
    roundtimeDisplay.textContent = round_full_time;
    }


function start(){
    startScreen.style.display = 'none';
    timerScreen.style.display = 'flex';
    let seconds = TOTAL_TIME;
    formatTime(seconds);
    const timer = setInterval(() => {
        formatTime(seconds);
        seconds--;
        if (seconds < 0) {
            timerScreen.textContent = 'Time\'s up!';
            bellSound.play();
            setTimeout(() => {
                clearInterval(timer);
              }, bellSound.duration * 1000);
          }
    }, 1000)
}


startButton.addEventListener('click', () =>{
    start();
})
