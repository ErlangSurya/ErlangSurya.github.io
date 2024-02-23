const questionContainer = document.querySelector('#question');
const buttons = document.querySelectorAll('.key');
const displayscore = document.querySelector('#score');
const restartButtons = document.querySelectorAll('.restartButton');
const time = document.querySelector('#timer')
const duration = 30*1000;
const gameOverMessage = document.querySelector('#gameOverMessage')
const timerBar = document.querySelector('#timer-bar')

let question;
let score = 0;
let remainingTime = duration/1000;
let length = score + 4;
let answer;

let intervalID;
let timeoutID;







function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min) + min); 
}


function answering_phase(){
    buttons.forEach(button => {button.disabled =false;});
}

function memory_phase(){
    buttons.forEach(button => {button.disabled =true;});
    // run the timer
    let width=100;
    intervalID = setInterval(function(){
        console.log('shrinking');
        width -= 10 / length;
        timerBar.style.width = width +'%';
        if (width<=0){
            clearInterval(intervalID);
            answering_phase()
        }
    }, 100)
    randomQuestion();
}

function randomQuestion(){
    questionContainer.innerHTML='';
    question = [];
    for (let i = 0; i<length; i++){
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
function lose_time(){
  time.textContent = `Time: 00`;
  lose();
}

function win(){
  gameOverMessage.textContent = 'You win!';
  document.getElementById('gameOverScreen').style.display = 'flex';
  buttons.forEach(button => {button.disabled =true;});
  clearInterval(intervalID);
}

function pad(x){
  if (x>=10){
    return x.toString();
  }
  else{
    return '0'+x.toString();
  }
}

function restart(){
    document.getElementById('gameOverScreen').style.display = 'none';
    document.getElementById('startScreen').style.display = 'none';
    score = 0 
    memory_phase()
    buttons.forEach(button => {button.style.backgroundColor ='white';})
    buttons.forEach(button => {button.disabled =false;})   
}


function updateCountdown(){
  remainingTime -= 1;
  time.textContent = `Time: ${pad(remainingTime)}`;
}




buttons.forEach(button => {
    button.addEventListener('click', () => {
      const pressedNumber = Number(button.textContent);
      if (pressedNumber===question){
        score+=1
        question = randomQuestion()
        if (score===30){
          win()
        }
      }
      else{
        button.style.backgroundColor ='red';
        lose()
      }
    });
  });

restartButtons.forEach(button =>{
  button.addEventListener('click', () =>{restart()})
});
