const startButton = document.querySelector('#startButton');
const restartButtons = document.querySelectorAll('.restartButton');
const grid = document.querySelector('#grid');
const stopwatch = document.querySelector('#stopwatch');
const memo =  document.querySelector('#memo');
const execute =  document.querySelector('#execute');
const gameplayScreen = document.querySelector('#gameplayScreen');

let N;
let chosen =[];
let intervalStopwatch;
let intervalMemo;
let intervalExecute;




startButton.addEventListener('click',() =>{
    let N_dropdown = document.getElementById("N");
    N = Number(N_dropdown.options[N_dropdown.selectedIndex].value); 
}
)


function update(){
    check_chosen();
    window.requestAnimationFrame(update);
}
window.requestAnimationFrame(update);


function check_chosen(){
    if (chosen.length==2){
        let temp = chosen[0].textContent;
        chosen[0].textContent = chosen[1].textContent;
        chosen[1].textContent = temp;
        chosen[0].classList.remove('chosen');
        chosen[1].classList.remove('chosen');
        chosen = [];
        if(check_order()){
            game_over();
        }
    }
}
function check_order(){
    const cells = document.querySelectorAll('.cell');
    for (let i =1; i<=N*N; i++){
        if (cells[i-1].textContent!==i.toString()){
            return false;
        }
    }
    return true;
}

function game_over(){
    const cells = document.querySelectorAll('.cell');
    cells.forEach(cell =>{
        cell.disabled = true;
        cells.forEach(cell =>{cell.style.textIndent = '0px'; })
    })
    clearInterval(intervalStopwatch);
    clearInterval(intervalExecute);
    const resetButton = document.createElement('button');
    resetButton.textContent = 'Reset';
    resetButton.classList.add('restartButton');
    gameplayScreen.appendChild(resetButton);
    resetButton.addEventListener('click', ()=>{
        gameplayScreen.removeChild(resetButton);
        restart();
    });
}


function restart(){
    startScreen.style.display = 'none';
    gameplayScreen.style.display = 'flex';

    let question = random_perm(N*N);
    grid.innerHTML='';
    memo.textContent = '00.0';
    execute.textContent = '00.0';
    stopwatch.textContent = '00.0';
    const isPortrait = window.matchMedia("(orientation: portrait)").matches;
    const columnWidth = isPortrait ? `${Math.floor(90/N)}vw` : `${Math.floor(70/N)}vh`;
    grid.style.gridTemplateColumns = `repeat(${N}, ${columnWidth})`;

    for (let i = 0; i<N*N; i++){
        const newCell = document.createElement('button');
        newCell.classList.add('cell');
        const textsize = isPortrait ? `${Math.floor(50/N)}vw` : `${Math.floor(50/N)}vh`;

        newCell.style.fontSize = textsize;
        newCell.textContent = question[i];
        grid.appendChild(newCell);
    }
   
    const cells = document.querySelectorAll('.cell');
    let execute_trigger = false;
    cells.forEach(cell =>{
        cell.addEventListener('click', ()=>{
            cell.classList.add('chosen');
            chosen.push(cell);
            clearInterval(intervalMemo);
            if (!execute_trigger){
                intervalExecute = setInterval(updateExecute, 100);
                execute_trigger = true;
                cells.forEach(cell =>{cell.style.textIndent = '-9999px'; })
            }
        })
    })
    intervalStopwatch = setInterval(updateStopwatch, 100);
    intervalMemo = setInterval(updateMemo, 100);
}



function updateMemo(){
    memo.textContent = (Number(memo.textContent)+0.1).toFixed(1).padStart(4, '0');
}
function updateExecute(){
    execute.textContent = (Number(execute.textContent)+0.1).toFixed(1).padStart(4, '0');
}
function updateStopwatch(){
    stopwatch.textContent = (Number(stopwatch.textContent)+0.1).toFixed(1).padStart(4, '0');
}





restartButtons.forEach(button =>{
    button.addEventListener('click', () =>{restart()})
  });





//Utility

function random_perm(N){ // random permutation of length N
    let arr = [];
    let temp;
    for (let i=0; i<N; i++){
        arr.push(i+1);
    }
    for (let j=1; j<N; j++){
        const idx = Math.floor(Math.random()*(N-j))
        temp = arr[idx];
        arr[idx] = arr[N-j]
        arr[N-j] = temp
    }
    return arr;
}

