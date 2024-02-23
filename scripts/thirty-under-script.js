const questionContainer = document.querySelector('#question');
const buttons = document.querySelectorAll('.key');
const displayscore = document.querySelector('#score');
const restartButtons = document.querySelectorAll('.restartButton');
const time = document.querySelector('#timer')
const duration = 30*1000;
const gameOverMessage = document.querySelector('#gameOverMessage')

let answer;
let score = 0;
let remainingTime = duration/1000;

let timeoutID
let intervalID



function update(time){
    displayscore.textContent = `Score: ${pad(score)}`;
    window.requestAnimationFrame(update);
}




function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min) + min); 
}

function randomQuestion(){
    let x,  answer, question;
    x = Math.random();
    if(x<=0.5){
        answer = getRandomInt(2,10);
        question = getRandomInt(1,answer);
        questionContainer.textContent = question.toString() + " + " + (answer-question).toString();
    }
    else{
        answer = getRandomInt(1,10);
        question = getRandomInt(1,10);
        questionContainer.textContent = (answer+question).toString()  + " - " + question.toString();
    }
    return answer
}

function lose(){
    gameOverMessage.textContent = 'Game Over';
    document.getElementById('gameOverScreen').style.display = 'flex';
    buttons.forEach(button => {button.disabled =true;});
    clearInterval(intervalID);
    clearTimeout(timeoutID);
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
  clearTimeout(timeoutID);
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
    answer = randomQuestion()
    timeoutID = setTimeout(lose_time, duration);
    intervalID = setInterval(updateCountdown, 999);
    buttons.forEach(button => {button.style.backgroundColor ='white';})
    buttons.forEach(button => {button.disabled =false;})
    remainingTime = duration/1000;
    time.textContent = `Time: ${pad(remainingTime)}`;
    
}


function updateCountdown(){
  remainingTime -= 1;
  time.textContent = `Time: ${pad(remainingTime)}`;
}




buttons.forEach(button => {
    button.addEventListener('click', () => {
      const pressedNumber = Number(button.textContent);
      if (pressedNumber===answer){
        score+=1
        answer = randomQuestion()
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

window.requestAnimationFrame(update)