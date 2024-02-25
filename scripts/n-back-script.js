const N = 1;
const game_length = 20+N;
const letters = ['b','c','d','g','h','k','p','q','t'];
const cells = document.querySelectorAll('.cell');

/*
Oelhafen et al:
Irrespective of the current n-level, each block consisted of 6 targets per modality.  
Out of 14 non-target trials, the lure n-back training contained an average of 3 lure trials per block and modality, 
and we defined lures as probes that matched the stimuli with a lag of n \pm 1 or n \pm 2. 
For instance, in a 3-back block, probes that matched 1, 2, 4 or 5 trials back were lures. 
On the other hand, the non-lure n-back training did not have any lures.

For us:
Each entry (after first N) has probability of (6/20, 3/20, 11/20) to become (target, lure, neutral). 
500 ms signal, 2500ms delay.
*/

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

function generate_game_sequence(N, game_length){
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
            if (j>=0){
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
                const random_lure = lures[Math.floor(Math.random()*lures.length)];
                game_sequence.push(random_lure);
            }
        }
        if (type_sequence[i]=='neutral'){
            const random_neutral = neutrals[Math.floor(Math.random()*neutrals.length)];
            game_sequence.push(random_neutral);
        }
    }
    console.log(type_sequence);
    console.log(game_sequence);
    return game_sequence;
}

generate_game_sequence(N, game_length);