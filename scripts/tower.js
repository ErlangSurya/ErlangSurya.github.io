let N; // number of towers. Need N>=3 to be generally solvable.
let height; // height of towers

const gameplayScreen = document.getElementById('gameplayScreen');
const startButton = document.querySelector('#startButton');
const restartButtons = document.querySelectorAll('.restartButton');
const alltowersdiv = document.getElementById('alltowersdiv');

let towers;
let active_tower;
let key_map;

let intervalStopwatch;


startButton.addEventListener('click',() =>{
    let N_dropdown = document.getElementById("N");
    N = Number(N_dropdown.options[N_dropdown.selectedIndex].value); 
    let height_dropdown = document.getElementById("Height");
    height = Number(height_dropdown.options[height_dropdown.selectedIndex].value);   
}
)

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

class Towers {
    constructor(N, height){
        this.N = N;
        this.height = height;

        let flat_tower = new Array(N*height);
        
        // initialize flat_tower
        for (let i = 0; i<N; i++){
            for (let j=0; j<height; j++){
                flat_tower[i*height+j] = i;
            }
        }

        // randomize problem 
        for (let i = N*height-1; i>0; i--){
            let j = getRandomInt(0,i);
            var temp = flat_tower[i];
            flat_tower[i] = flat_tower[j];
            flat_tower[j] = temp;
        }


        // reshape flat_tower to a 2d array
        let tower_arr = new Array(N);
        for (let i = 0; i<N; i++){
            tower_arr[i] = new Array(height);
            for (let j=0; j<height; j++){
                tower_arr[i][j] = flat_tower[i*height+j];
            }
        }

        this.tower_arr = tower_arr;
    }


    move(i,j){ // move top element of tower i to tower j
        if(this.tower_arr[i].length>0){    
            let x = this.tower_arr[i].pop();
            this.tower_arr[j].push(x);
        }
    }

}




const color_map = new Map();
color_map.set(0,'#FF0000'); //red
color_map.set(1,'#00FF00'); //lime green
color_map.set(2,'#0000FF'); //blue
color_map.set(3,'#FFFF00'); //yellow
color_map.set(4,'#800080'); //purple
color_map.set(5,'#00FFFF'); //cyan


function visualizer(towers){
    alltowersdiv.innerHTML = '';
    for (let i=0; i<towers.N; i++){
        const towerDiv = document.createElement('div');
        towerDiv.classList.add('towerDiv');
        const towerGrid = document.createElement('div');
        towerGrid.classList.add('towerGrid');

        for (let row = towers.tower_arr[i].length-1; row >=0 ; row--) {
            const gridCell = document.createElement('div');
            gridCell.classList.add('cell')
            gridCell.style.height = '5vh'; // Set height of each cell
            gridCell.style.width = '5vw'; // Set width to fill the parent
            //gridCell.style.border = '1px solid black'; // Add border for visibility
            gridCell.style.boxSizing = 'border-box'; // Include border in cell dimensions
            //gridCell.textContent = `${towers.tower_arr[i][row]}`
            gridCell.style.backgroundColor = color_map.get(towers.tower_arr[i][row])
            towerGrid.appendChild(gridCell); // Append cell to the parent div
          }
        
          alltowersdiv.appendChild(towerDiv);
          towerDiv.appendChild(towerGrid);
        
    }
}


function restart(){
    startScreen.style.display = 'none';
    gameplayScreen.style.display = 'flex';
    towers = new Towers(N,height);
    active_tower = new Array(0);
    key_map = new Map();
    if (N==4){
        key_map.set('d',0);
        key_map.set('f',1);
        key_map.set('j',2);
        key_map.set('k',3);
    }
    if (N==6){
        key_map.set('s',0);
        key_map.set('d',1);
        key_map.set('f',2);
        key_map.set('j',3);
        key_map.set('k',4);
        key_map.set('l',5);
    }

    visualizer(towers);
    stopwatch.textContent = '00.0';
    intervalStopwatch = setInterval(updateStopwatch, 100);
}

function check(){
    function check_tower(arr){
        if (arr.length==0){
            return false;
        }
        let temp = arr[0];
        for (let i=0; i<arr.length; i++ ){
            if (arr[i] != temp){
                return false;
            }
        }

        return true;
    }
    for (let i=0; i<towers.tower_arr.length; i++){
        if (!check_tower(towers.tower_arr[i])){
            return false;
        }
    }

    return true;
}

document.addEventListener('keydown', (event)=>{
    const key = event.key.toLowerCase();
    
    for (const [k, value] of key_map.entries()){
        if (key == k){
            active_tower.push(value);
            console.log(value);
        }
    }

    if (active_tower.length==2){
        towers.move(active_tower[0], active_tower[1]);
        active_tower = new Array(0);
        visualizer(towers);
        if (check()){
            clearInterval(intervalStopwatch);
        }
    }

})


restartButtons.forEach(button =>{
    button.addEventListener('click', () =>{restart()})
  });



function updateStopwatch(){
    stopwatch.textContent = (Number(stopwatch.textContent)+0.1).toFixed(1).padStart(4, '0');
}

