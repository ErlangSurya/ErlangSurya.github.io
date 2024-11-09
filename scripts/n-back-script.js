const startScreen = document.querySelector('#startScreen');
const gameplayScreen = document.querySelector('#gameplayScreen');
const gameoverScreen = document.querySelector('#gameoverScreen');
const scoreDetails= document.querySelector('#scoreDetails');
const letters = ['B','C','D','G','H','K','P','Q','T'];
const colors = ['aqua', 'black', 'blue', 'darkorchid', 'deeppink', 'gold', 'lightskyblue', 'orange', 'red']
const cells = document.querySelectorAll('.cell');
const signal_time = 500;
const delay_time = 2500;
const restartButtons = document.querySelectorAll('.restartButton');
const startButton = document.querySelector('#startButton')
let gameButtons = document.querySelectorAll('.gameButton');
const gamebuttonContainer = document.querySelector('#gamebuttonContainer');
const scoreDisplay = document.querySelector('#scoreDisplay')
const roundDisplay = document.querySelector('#rounds')



let modes = ['position', 'letter']; // always prefix of ['position', 'letter', 'color']
let N;
let game_length;
let timeout_clear;
let timeout_next;
let answer_keys;
let player_answer;
let game_seqs;
let game_idx;


/*
Oelhafen et al:
Irrespective of the current n-level, each block consisted of 6 targets per modality.  
Out of 14 non-target trials, the lure n-back training contained an average of 3 lure trials per block and modality, 
and we defined lures as probes that matched the stimuli with a lag of n \pm 1 or n \pm 2. 
For instance, in a 3-back block, probes that matched 1, 2, 4 or 5 trials back were lures. 
On the other hand, the non-lure n-back training did not have any lures.

For more discussion see https://gwern.net/dnb-faq

For us:
Each entry (after first N) has certain probabilities to become (target, lure, neutral). 
500 ms signal, 2500ms delay.

Possible modes:
Audio, position, shape, color, number
*/



function generate_game_sequence(N, game_length, number_of_modes){
    const game_sequences =[]
    function generate_single_game_sequence(N, game_length){
        const type_sequence =[];

        for (let i=0; i<N; i++){
            type_sequence.push('random');
        }
        for (let i=0; i<game_length-N; i++){
            let r = Math.random();
            if (r<0.3){
                type_sequence.push('target');
            }
            else if (r <0.45){
                type_sequence.push('lure');
            }
            else{
                type_sequence.push('neutral');
            }
        }
        const game_sequence = [];
        for(let i = 0; i<game_length; i++){
            let lures = [];
            // lures may contain the target, but that's ok for now
            for (const j of [i-N-2, i-N-1, i-N+1, i-N+2]){
                if (j>=0 && j<i){
                    lures.push(game_sequence[j]);
                }
            }
            let target = game_sequence[i-N];
            let neutrals = [];
            for (let j=0; j<9; j++){
                if ( !((j===target) && contain(j, lures))){
                    neutrals.push(j);
                }
            }

            if (type_sequence[i]=='random'){
                game_sequence.push(getRandomInt(0,9))
            }
            if (type_sequence[i]=='target'){
                game_sequence.push(target)
            }
            if (type_sequence[i]=='lure'){
                if (lures.length ===0){
                    game_sequence.push(getRandomInt(0,9));
                }
                else{
                    let random_lure = lures[Math.floor(Math.random()*lures.length)];
                    game_sequence.push(random_lure);
                }
            }
            if (type_sequence[i]=='neutral'){
                let random_neutral = neutrals[Math.floor(Math.random()*neutrals.length)];
                game_sequence.push(random_neutral);
            }
        }
        return game_sequence;
    }
    for(let i = 0; i<number_of_modes; i++){
        const arr = generate_single_game_sequence(N, game_length);
        game_sequences.push(arr);
    }
    return game_sequences;
}

function generate_answer_key(game_seqs,N){
    const answer_keys_returned =[]
    function generate_single_answer_key(game_seq, N){
        const answer_key = [];
        for(let i = 0; i<game_seq.length; i++){
            if (i<N){

                answer_key.push(false);
            }
            else{
                if(game_seq[i]===game_seq[i-N]){

                    answer_key.push(true);
                }
                else{

                    answer_key.push(false);
                }
            }
        }
        return answer_key;
    }
    for(let i = 0; i<modes.length; i++){
        const arr = generate_single_answer_key(game_seqs[i], N);
        answer_keys_returned.push(arr);
    }
    return answer_keys_returned;
}

function gameplay(game_seqs){ //give questions to player, doesn't handle input.
    // just refresh buttons
    //let answer = generate_answer_key(game_seq, N);
    game_idx = 0 
    next();
    function next(){
        roundDisplay.textContent = 'Round: '+ (game_idx+1) + '/' +game_length;
        gameButtons.forEach((button) =>{button.disabled=false;});
        if (game_idx<game_length){
            if(modes.length===1){
                display(cells[game_seqs[0][game_idx]]);
            } else if(modes.length===2){
                display( cells[game_seqs[0][game_idx]], letters[game_seqs[1][game_idx]]);
            } else if(modes.length===3){
                display(cells[game_seqs[0][game_idx]], letters[game_seqs[1][game_idx]], colors[game_seqs[2][game_idx]]);
            }

            setTimeout(()=>{
                game_idx+=1;
                
                
                for (let i=0; i<modes.length;i++){ //if we haven't pressed the button when timer ends, push 'false'
                    if (player_answer[i].length<game_idx){
                        player_answer[i].push(false);
                    }
                }
                next();
            }, signal_time+delay_time);
            
        }
        else{
            roundDisplay.textContent = 'Round: '+ 1 + '/' +game_length;
            game_over();
        }
    }

}

function display(cell, letter = '', color = 'black'){
    cell.style.backgroundColor = color;
    cell.textContent = letter;
    setTimeout( ()=>{reset_cell(cell);}, signal_time );
}

function reset_cell(cell){
    cell.style.backgroundColor = 'white';
    cell.textContent = '';
}

function game_over(){
    startScreen.style.display = 'none';
    gameoverScreen.style.display = 'flex';
    gameplayScreen.style.display = 'none';
    let total_IOU = 0;

    scoreDetails.innerHTML='';
    for (let i = 0; i<modes.length; i++){
        let TP = 0;
        let FP = 0;
        let TN = 0;
        let FN = 0;
        let answer_key = answer_keys[i];
        let p = player_answer[i];
        for (let j =0; j<answer_key.length;j++){
            if (answer_key[j] && p[j]){
                TP +=1
            }
            if (!answer_key[j] && !p[j]){
                TN += 1
            }
            if (answer_key[j] && !p[j]){
                FN += 1
            }
            if (!answer_key[j] && p[j]){
                FP += 1
            }
        }
        let mode_score = document.createElement('div')
        mode_score.innerHTML ='<b>'+ modes[i] +'</b>'+ '<br>TP: ' +TP+' FP: ' +FP+' TN: ' +TN+' FN: ' +FN + '<br>IOU: ' + (TP/(TP+FP+FN)).toFixed(3) +'<br>';
        total_IOU += TP/(TP+FP+FN);
        mode_score.style.textAlign = 'center'
        scoreDetails.appendChild(mode_score);
    }
    scoreDisplay.textContent = 'Score:' + Math.round(100*total_IOU/modes.length)
}

function restart(){
    startScreen.style.display = 'none';
    gameoverScreen.style.display = 'none';
    gameplayScreen.style.display = 'flex';
    game_idx = 0;
    //generate and setup game buttons
    gamebuttonContainer.innerHTML='';
    for (const mode of modes){ 
        const button = document.createElement('button');
        button.classList.add('gameButton');
        button.innerText=mode;
        gamebuttonContainer.appendChild(button)
    }
    gameButtons = document.querySelectorAll('.gameButton');
    gameButtons.forEach((button) =>{
        button.addEventListener('click', () => {
            if(button.textContent==='position'){
                player_answer[0].push(true)
            }
            if(button.textContent==='letter'){
                player_answer[1].push(true)
            }
            if(button.textContent==='color'){
                player_answer[2].push(true)
            }
            button.disabled = true;
        })
    })

    document.addEventListener('keydown', (event)=>{
        const key = event.key.toLowerCase();
        if (key == 'f'){
            gameButtons.forEach((button) =>{
                if(button.textContent==='position'){
                    if (!button.disabled){
                        player_answer[0].push(true);
                        button.disabled = true;
                    }
                }
            })
        }

        if (key == 'j'){
            gameButtons.forEach((button) =>{
                if(button.textContent==='letter'){
                    if (!button.disabled){
                        player_answer[1].push(true);
                        button.disabled = true;
                    }
                }
            })
        }

        if (key == ' '){
            gameButtons.forEach((button) =>{
                if(button.textContent==='color'){
                    if (!button.disabled){
                        player_answer[2].push(true);
                        button.disabled = true;
                    }
                }
            })
        }

        


    })



    game_seqs = generate_game_sequence(N, game_length, modes.length);
    answer_keys = generate_answer_key(game_seqs, N);
    player_answer = [];
    for (let i=0; i<modes.length; i++){
        player_answer.push([]);
    }
    
    setTimeout(gameplay, 1000, game_seqs);
}


startButton.addEventListener('click',() =>{
    let N_dropdown = document.getElementById("N");
    N = Number(N_dropdown.options[N_dropdown.selectedIndex].value);
    game_length = 20 + N;

    roundDisplay.textContent = 'Round: '+ 0 + '/' +game_length;
    let modes_dropdown = document.getElementById("modes");
    let modes_length = modes_dropdown.options[modes_dropdown.selectedIndex].value;

    if (modes_length==='1'){
        modes = ['position'];
    }
    if (modes_length==='2'){
        modes = ['position', 'letter'];
    }
    if (modes_length==='3'){
        modes = ['position', 'letter', 'color'];
    }
}
)

restartButtons.forEach(button =>{
    button.addEventListener('click', () =>{restart()})
  });



//Utility functions


function contain(x, arr){
    for (const y of arr){
        if (y===x){
            return true
        }
    }
    return false
}
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min) + min); 
}

