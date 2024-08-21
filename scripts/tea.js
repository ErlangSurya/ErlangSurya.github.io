const grid = document.querySelector('#grid');


class TeaField{
    constructor(width,height){
        this.width = width;
        this.height = height;

        this.growth_rate = 0.1;

        let tea_array = new Array(height);
        for (let i = 0; i<width; i++){
            tea_array[i] = new Array(width).fill(0); // initialize tea_array as array of 0
        }

        this.tea_array = tea_array

    }
    tea_growth(){
        for (let j =0; j<this.height; j++){
            for (let i = 0; i<this.width; i++){
                this.tea_array[j][i] +=  Math.random() < this.growth_rate ? 1 : 0
            }
        }
    }

}


class Farmer {
    constructor(x,y,type){
        this.x = x;
        this.y = y;
        this.type = type; //'random' or 'greedy'
    }

    location_update(teaField){
        // For now let's just do random movement
        if (this.type == 'random'){
            let x_update = Math.floor(Math.random()*3)-1;
            let y_update = Math.floor(Math.random()*3)-1;
            let new_x = this.x + x_update 
            let new_y = this.y + y_update 
            if (new_x >= 0 && new_x<teaField.width){
                this.x = new_x 
            }
            if (new_y >= 0 && new_y<teaField.height){
                this.y = new_y
            }
        }

        if (this.type == 'greedy'){
            
            let best = 0;
            let best_x = this.x;
            let best_y = this.y;

            for (let x_update = -1; x_update<2; x_update++){    
                for (let y_update = -1; y_update<2; y_update++){
                    let new_x = this.x + x_update; 
                    let new_y = this.y + y_update; 
                    if (new_x >= 0 && new_x<teaField.width && new_y >= 0 && new_y<teaField.height){
                        if (teaField.tea_array[new_y][new_x]>best){
                            best_x = new_x;
                            best_y = new_y;
                            best = teaField.tea_array[new_y][new_x];
                        }
                    }
                }
            }

            this.x = best_x 
            this.y = best_y
        }
    }

    harvest(teaField){
        teaField.tea_array[this.y][this.x] = teaField.tea_array[this.y][this.x]/10;
    }


}

const field_size = 40
const teaField = new TeaField(field_size,field_size)

const farmers = Array.from({ length: field_size }, (_, index) => new Farmer(index, index, 'greedy'));


function teaColor(x){
    let darkest = 100;
    const greenValue = Math.floor((2/(1+Math.exp(x)))*(255-darkest) + darkest)
    return `rgb(0, ${greenValue}, 0)`
}

function visualizer(teaField, farmers){
    grid.innerHTML = '';
    grid.style.gridTemplateColumns = `repeat(${teaField.width}, 1fr)`;
    grid.style.gridTemplateRows = `repeat(${teaField.height}, 1fr)`;

    for (let j =0; j<teaField.height; j++){
        for (let i = 0; i<teaField.width; i++){
            const cell = document.createElement('div');
            cell.className = 'cell';
            //cell.textContent = i 
            //cell.style.border = '1px solid #000';
            //cell.style.backgroundColor = 'lightblue'

            if (window.innerWidth > window.innerHeight){ // landscape orientation
                let alpha = 1/2
                let size = 100*alpha*1/teaField.height
                cell.style.width = `${size}vh`
                cell.style.height = `${size}vh`
                //console.log(`Size:${size}`)
                grid.style.width = `${size*teaField.width}vh`
                grid.style.height = `${size*teaField.height}vh`
            }
            else{
                let alpha = 1/2
                let size = 100*alpha*1/teaField.width
                cell.style.width = `${size}vw`
                cell.style.height = `${size}vw`
                //console.log(`Size:${size}`)
                grid.style.width = `${size*teaField.width}vw`
                grid.style.height = `${size*teaField.height}vw`
            }
            cell.style.backgroundColor = teaColor(teaField.tea_array[j][i])

            

            grid.appendChild(cell);

        }
    }

    farmers.forEach(farmer =>{
        let i = farmer.x;
        let j = farmer.y;
        let farmerCell = grid.children[j*teaField.height + i];
        let circle = document.createElement('div');
        circle.className = 'farmer';
        circle.style.width = (farmerCell.offsetWidth)/2 + 'px';
        circle.style.height = (farmerCell.offsetWidth)/2 + 'px'
        farmerCell.appendChild(circle);
    })

}



let update_time = 100; // update every x ms
visualizer(teaField, farmers);
setInterval(()=>{
    teaField.tea_growth();
    farmers.forEach(farmer => {
        farmer.location_update(teaField);
        farmer.harvest(teaField);
    });
    visualizer(teaField, farmers);
}, update_time);