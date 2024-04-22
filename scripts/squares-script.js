const startButton = document.querySelector('#startButton');
const restartButtons = document.querySelectorAll('.restartButton');
const grid = document.querySelector('#grid');
const stopwatch = document.querySelector('#stopwatch');
const memo =  document.querySelector('#memo');
const execute =  document.querySelector('#execute');
const gameplayScreen = document.querySelector('#gameplayScreen');
const timerBar = document.querySelector('#timer-bar');
const roundText = document.querySelector('#round-number');
const scoreText = document.querySelector('#score-number');


let answering_phase_bool = false;


let N;
const ROUND_NUMBER = 10;
let score = 0;
let current_round = 1;
let ROUND_TIME = 4; // in seconds
let chosen =[];
let question;
let answer=[];
let intervalTimer;

const ANSWER_COLOR = 'black';
const NON_ANSWER_COLOR = 'white';



startButton.addEventListener('click',() =>{
    let N_dropdown = document.getElementById("N");
    N = Number(N_dropdown.options[N_dropdown.selectedIndex].value); 
    let time_dropdown = document.getElementById("Time");
    ROUND_TIME = Number(time_dropdown.options[time_dropdown.selectedIndex].value);     
}
)


function update(){
    if (answering_phase_bool){
        check_chosen();
        window.requestAnimationFrame(update);
    }
}


function check_chosen(){
    if (answer.length === question.length){ // making sure things are already properly initialized
        if (answer.join(',') === question.join(',')){
            console.log('WIN');
            score += 1;
            current_round += 1;
            answering_phase_bool = false;
            if (current_round === ROUND_NUMBER+1){
                scoreText.textContent = score;
                game_over();
            }
            else{
            restart();
            }
            
        }
        for (let i=0; i<answer.length; i++){
            if(answer[i]==1 && question[i]==0){
                console.log('LOSE');
                current_round += 1;
                answering_phase_bool = false;
                if (current_round === ROUND_NUMBER+1){
                    scoreText.textContent = score;
                    game_over();
                }
                else{
                restart();
                }
                break;
            }
        }
    }
}


function game_over(){
    gameOverMessage.textContent = 'Game Over';
    document.getElementById('gameOverScreen').style.display = 'flex';
    const cells = document.querySelectorAll('.cell');
    cells.forEach(cell => {cell.disabled =true;});
    score = 0;
    current_round = 1;
}

function restart(){
    document.getElementById('gameOverScreen').style.display = 'none';
    startScreen.style.display = 'none';
    gameplayScreen.style.display = 'flex';
    answer = [];
    roundText.textContent = current_round+'/'+ROUND_NUMBER;
    scoreText.textContent = score;
    for (let i = 0; i<N*N; i++){
        answer.push(0);
    }
    question = random_bits(N*N);
    grid.innerHTML='';
    
    const isPortrait = window.matchMedia("(orientation: portrait)").matches;
    const columnWidth = isPortrait ? `${Math.floor(90/N)}vw` : `${Math.floor(70/N)}vh`;
    grid.style.gridTemplateColumns = `repeat(${N}, ${columnWidth})`;

    for (let i = 0; i<N*N; i++){
        const newCell = document.createElement('button');
        newCell.classList.add('cell');
        newCell.style.height = columnWidth;
        newCell.style.width = columnWidth;
        newCell.style.backgroundColor = (question[i]===1) ? ANSWER_COLOR : NON_ANSWER_COLOR;
        grid.appendChild(newCell);
    }
   memory_phase();
}





function memory_phase(){
    const cells = document.querySelectorAll('.cell');
    cells.forEach(cell => {cell.disabled =true;});
    let width=100;
    intervalTimer = setInterval(function(){
        width -= 1;
        timerBar.style.width = width +'%';
        if (width<=0){
            clearInterval(intervalTimer);
            setTimeout(answering_phase, 500); // because transition has 0.5s delay
        }
    }, ROUND_TIME*10)
}


function answering_phase(){
    timerBar.style.width = '100%';
    const cells = document.querySelectorAll('.cell');
    const cellsArray = Array.from(cells);
    answering_phase_bool = true;
    window.requestAnimationFrame(update);
    cells.forEach(cell => {
        cell.disabled = false;
        cell.style.backgroundColor = NON_ANSWER_COLOR;
        cell.addEventListener('click', () =>{
            cell.style.backgroundColor = ANSWER_COLOR;
            const cellIdx = cellsArray.indexOf(cell);
            answer[cellIdx] = 1;
        })
    });

}


restartButtons.forEach(button =>{
    button.addEventListener('click', () =>{restart()})
  });





//Utility


function random_bits(N){
    let result = [];
    for (let i=0; i<N; i++){
        result.push(Math.floor(Math.random()*2));
    }
    return result;
}