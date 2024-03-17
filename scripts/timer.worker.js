self.onmessage = function(message)
{
    const TOTAL_TIME = message.data[0];
    const WORK_TIME = message.data[1];
    const BREAK_TIME = message.data[2];
    const sound_duration = message.data[3];
    let seconds = TOTAL_TIME;

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
            self.postMessage(['sound'])  
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
        // fulltimeDisplay.textContent= full_time;
        // roundDisplay.textContent = work_or_break + round_number;
        // roundtimeDisplay.textContent = round_full_time;
        self.postMessage(['time',[full_time, work_or_break+round_number, round_full_time]])
        }

    const timer = setInterval(() => {
        formatTime(seconds);
        seconds--;
        if (seconds < 0) {
            self.postMessage(['stop']);
            setTimeout(() => {
                clearInterval(timer);
              }, sound_duration * 1000);
          }
    }, 1000)
}