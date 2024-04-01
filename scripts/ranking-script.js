const restartButtons = document.querySelectorAll('.restartButton');
const stateDisplay = document.querySelector('#stateDisplay');
const currentQuestion = document.querySelector('#currentQuestion');
const answerButtons_div = document.querySelector('#answerButtons');
const M = 100;

const TOTAL_GAME = 10;


let N;
let question;
let answer_key;
let answer;
let answer_displayed;
let turn;
let loss;
let total_loss;


startButton.addEventListener('click',() =>{
    let N_dropdown = document.getElementById("N");
    N = Number(N_dropdown.options[N_dropdown.selectedIndex].value); 
}
)






function restart(){
    startScreen.style.display = 'none';
    gameplayScreen.style.display = 'flex';

    question = random_numbers(N);
    answer_key = answer_fn(question);
    turn = 0;
    answer = [];
    answer_displayed = [];
    for (let j=0; j<N; j++){
        answer_displayed.push('*');
    }
    display_answer(answer_displayed);
    display_question();
    display_gameButtons()
}




function game_over(){
    loss = L1_loss(answer_key, answer);
}


function display_answer(answer){
    stateDisplay.innerHTML='';
    for (let i=0; i<N; i++){
        const newDiv = document.createElement('div');
        newDiv.textContent = (answer_displayed[i]==='*')? `${i+1}.` : `${i+1}. ${answer_displayed[i]}`;
        stateDisplay.appendChild(newDiv);
    }
}

function display_question(){
    currentQuestion.textContent = question[turn];
}

function display_gameButtons(){
    for (let i=0; i<N; i++){
        const newCell = document.createElement('button');
        newCell.classList.add('gameButton');
        newCell.textContent = `${i+1}`;
        answerButtons_div.appendChild(newCell);
    }
    const answerButtons = document.querySelectorAll('.gameButton');
    answerButtons.forEach(button =>{
        button.addEventListener('click', ()=>{
            button.disabled = true;
            answer[turn] = parseInt(button.textContent)
            answer_displayed[parseInt(button.textContent)-1] = question[turn];
            turn += 1
            display_answer();
            display_question();
            if (turn===N){
                game_over();
            }
        })
    })
}



restartButtons.forEach(button =>{
    button.addEventListener('click', () =>{restart()})
  });




// Utility functions

function random_numbers(N){ // N random numbers from {1,2,...,M}
    let arr = [];
    let temp;
    for (let i=0; i<M; i++){
        arr.push(i+1);
    }
    for (let j=0; j<N; j++){
        const idx = j+Math.floor(Math.random()*(M-j));
        temp = arr[idx];
        arr[idx] = arr[j];
        arr[j] = temp;
    }
    let output = [];
    for (let i = 0; i<N; i++){
        output.push(arr[i]);
    }
    return output;
}

function compareFn(a,b){
    if (a[0]<b[0]){
        return -1;
    }
    else if(a[0]>b[0]){
        return 1;
    }
    return 0
}

function answer_fn(arr){
    let modified_arr = [];
    for (let i=0; i<arr.length; i++){
        modified_arr.push([arr[i], i])
    }
    modified_arr.sort(compareFn)
    let output = [];
    for (let i=0; i<arr.length; i++){
        output.push(0)
    }
    for (let i=0; i<arr.length; i++){
        output[modified_arr[i][1]] = i+1;
    }
    return output;
}


function L1_loss(a ,b){
    let output = 0;
    for (let i=0; i<a.length; i++){
        output += Math.abs(a[i]-b[i]);
    }
    return output
}