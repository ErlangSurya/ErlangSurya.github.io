const grid = document.querySelector('#grid');


class TeaField{
    constructor(width,height){
        this.width = width;
        this.height = height;

        this.growth_rate = 0.3;

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
    constructor(x,y){
        this.x = x;
        this.y = y;
    }

    location_update(teaField){
        // For now let's just do random movement
        let x_update = Math.random() < 0.5 ? -1 : 1;
        let y_update = Math.random() < 0.5 ? -1 : 1;
        let new_x = this.x + x_update 
        let new_y = this.y + y_update 
        if (new_x >= 0 && new_x<teaField.width){
            this.x = new_x 
        }
        if (new_y >= 0 && new_y<teaField.height){
            this.y = new_y
        }
    }


}


const teaField = new TeaField(10,10)

const farmers = [new Farmer(1,1), new Farmer(8,8)];

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

}



let update_time = 1000; // update every x ms
visualizer(teaField, farmers);
setInterval(()=>{
    teaField.tea_growth();
    farmers.forEach(farmer => farmer.location_update(teaField));
    visualizer(teaField, farmers);
}, update_time);