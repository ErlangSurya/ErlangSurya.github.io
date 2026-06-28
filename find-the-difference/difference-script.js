const startButton = document.querySelector('#startButton');
const restartButtons = document.querySelectorAll('.restartButton');
const grid_original = document.querySelector('#original');
const grid_modified = document.querySelector('#modified');

const stopwatch = document.querySelector('#stopwatch');
const memo =  document.querySelector('#memo');
const execute =  document.querySelector('#execute');
const gameplayScreen = document.querySelector('#gameplayScreen');
const timerBar = document.querySelector('#timer-bar');
const roundText = document.querySelector('#round-number');
const scoreText = document.querySelector('#score-number');

const colors = ['aqua', 'aquamarine', 'blue', 'darkorchid', 'deeppink', 'gold', 'lightskyblue', 'orange', 'red']


const N = 5;
let question;
let change_idx;

let current_round = 1;


function round_start(){
    const cells = document.querySelectorAll('.cell');
    const cellsArray = Array.from(cells);
    cells.forEach(cell => {
        cell.disabled = false;
        cell.addEventListener('click', () =>{
            const cellIdx = cellsArray.indexOf(cell);
            answer[cellIdx] = 1;
        })
    });

}

function restart(){
    document.getElementById('gameOverScreen').style.display = 'none';
    startScreen.style.display = 'none';
    gameplayScreen.style.display = 'flex';
    question = random_colors(N*N);
    change_idx = Math.floor(Math.random() * N*N);
    grid_original.innerHTML='';
    grid_modified.innerHTML='';
    
    const isPortrait = window.matchMedia("(orientation: portrait)").matches;
    const columnWidth = isPortrait ? `${Math.floor(90/N)}vw` : `${Math.floor(70/N)}vh`;
    grid_original.style.gridTemplateColumns = `repeat(${N}, ${columnWidth})`;
    grid_modified.style.gridTemplateColumns = `repeat(${N}, ${columnWidth})`;

    for (let i = 0; i<N*N; i++){
        const newCell = document.createElement('button');
        newCell.classList.add('cell');
        newCell.style.height = columnWidth;
        newCell.style.width = columnWidth;
        newCell.style.border = 'none';
        newCell.style.backgroundColor = question[i];
        grid_original.appendChild(newCell);
    }

    for (let i = 0; i<N*N; i++){
        const newCell = document.createElement('button');
        newCell.classList.add('cell');
        newCell.style.height = columnWidth;
        newCell.style.width = columnWidth;
        newCell.style.border = 'none';
        if (i===change_idx){
            newCell.style.backgroundColor = new_color(question[i]);
        }
        else{
            newCell.style.backgroundColor = question[i];
        }
        grid_modified.appendChild(newCell);
    }


    
}





restartButtons.forEach(button =>{
    button.addEventListener('click', () =>{restart()})
  });






function random_colors(N){
    let result = [];
    for (let i=0; i<N; i++){
        result.push(colors[Math.floor(Math.random()*(colors.length))]);
    }
    return result;
}

function new_color(color){
    let newColor;
    do {
        newColor = colors[Math.floor(Math.random()*(colors.length))];
    } while (newColor === color);
    return newColor;
}

console.log(random_colors(5));