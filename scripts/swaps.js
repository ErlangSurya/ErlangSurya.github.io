const startButton = document.querySelector('#startButton');
const restartButtons = document.querySelectorAll('.restartButton');
const grid = document.querySelector('#grid');

let N;
let chosen =[];




startButton.addEventListener('click',() =>{
    let N_dropdown = document.getElementById("N");
    N = Number(N_dropdown.options[N_dropdown.selectedIndex].value);
    let question = random_perm(N*N);
    for (let i = 0; i<N*N; i++){
        const newCell = document.createElement('button');
        newCell.classList.add('cell');
        newCell.textContent = question[i];
        grid.appendChild(newCell);
    }
    grid.style.gridTemplateColumns = `repeat(${N}, ${'10vw'})`;
}
)


function update(){
    check_chosen();
    window.requestAnimationFrame(update)
}

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
    })
}


function restart(){
    startScreen.style.display = 'none';
    gameoverScreen.style.display = 'none';
    gameplayScreen.style.display = 'flex';
    const cells = document.querySelectorAll('.cell');
    cells.forEach(cell =>{
        cell.addEventListener('click', ()=>{
            cell.classList.add('chosen');
            chosen.push(cell);
        })
    })
}







restartButtons.forEach(button =>{
    button.addEventListener('click', () =>{restart()})
  });



window.requestAnimationFrame(update)


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

