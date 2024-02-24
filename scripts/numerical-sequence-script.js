const questionContainer = document.querySelector('#question');
const buttons = document.querySelectorAll('.key');
const restartButtons = document.querySelectorAll('.restartButton');
const gameOverMessage = document.querySelector('#gameOverMessage')
const timerBar = document.querySelector('#timer-bar')

let question;
let answer;
let game_length;
let intervalID;
let timeoutID;




function restart(){
  document.getElementById('gameOverScreen').style.display = 'none';
  document.getElementById('startScreen').style.display = 'none';
  game_length = 8;
  memory_phase();
}



function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min) + min); 
}

function answer_display(answer, game_length){
  questionContainer.innerHTML = '';
  let i = answer.length
  for (let j = 0 ; j<game_length; j++){
    if (j<i){
      const numberSpan = document.createElement('span');
      numberSpan.textContent = answer[j];
      questionContainer.appendChild(numberSpan);
    }
    else{
      const numberSpan = document.createElement('span');
      numberSpan.textContent = question[j];
      numberSpan.style.visibility = 'hidden';
      questionContainer.appendChild(numberSpan);
    }
  }
}


function answering_phase(){
    buttons.forEach(button => {button.disabled =false;});
    answer = [];
    answer_display(answer,game_length);
}

function memory_phase(){
    buttons.forEach(button => {button.disabled =true;});
    let width=100;
    // fixed 10 seconds timer, irrespective of level
    intervalID = setInterval(function(){
        width -= 1;
        timerBar.style.width = width +'%';
        if (width<=0){
            clearInterval(intervalID);
            setTimeout(answering_phase, 500); // because transition has 0.5s delay
        }
    }, 100)
    question = randomQuestion();
}

function randomQuestion(){
    questionContainer.innerHTML='';
    question = [];
    for (let i = 0; i<game_length; i++){
        question.push(getRandomInt(0,10));
    }
    for (const num of question){
        const numberSpan = document.createElement('span');
        numberSpan.textContent = num;
        questionContainer.appendChild(numberSpan);
    }
    return question;
}

function lose(){
    gameOverMessage.textContent = 'Game Over';
    document.getElementById('gameOverScreen').style.display = 'flex';
    buttons.forEach(button => {button.disabled =true;});
    clearInterval(intervalID);

}

function win(){
  gameOverMessage.textContent = 'You win!';
  document.getElementById('gameOverScreen').style.display = 'flex';
  buttons.forEach(button => {button.disabled =true;});
  clearInterval(intervalID);
}






function arrayEqual(arr1, arr2){
  if (arr1.length !== arr2.length){
    return false 
  }
  for (let i=0; i<arr1.length; i++){
    if (arr1[i]!==arr2[i]){
      return false
    }
  }
  return true
}


buttons.forEach(button => {
    button.addEventListener('click', () => {
      const pressedNumber = Number(button.textContent);
      answer.push(pressedNumber);
      answer_display(answer, game_length);
      if (answer.length === game_length){
        //check answer
        if (arrayEqual(answer, question)){
          if (answer.length === 16){
            win();
          }
          else{
          game_length += 1 ;
          memory_phase();
          }
        }
        else{
          lose();
        }
      }
    });
  });

restartButtons.forEach(button =>{
  button.addEventListener('click', () =>{restart()})
});
