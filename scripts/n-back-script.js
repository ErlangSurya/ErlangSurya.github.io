const N = 1;
const game_length = 20+N;
const letters = []

/*
Oelhafen et al:
Irrespective of the current n-level, each block consisted of 6 targets per modality.  
Out of 14 non-target trials, the lure n-back training contained an average of 3 lure trials per block and modality, 
and we defined lures as probes that matched the stimuli with a lag of n \pm 1 or n \pm 2. 
For instance, in a 3-back block, probes that matched 1, 2, 4 or 5 trials back were lures. 
On the other hand, the non-lure n-back training did not have any lures.

For us:
Each entry (after first N) has probability of (6/20, 3/20, 11/20) to become (target, lure, neutral). 
*/

function generate_game_sequence(){

}