let branch_arr;
let branch;
let main_branch;
let start_arr;
let idx_arr;
let end_arr;

function setup() {
    createCanvas(windowWidth, windowHeight);
    background(14,28,46);



    let p1 = createVector(width/3 + random()*width/3, 0);
    let p2 = createVector(width/3 + random()*width/3, height*9/10);
    main_branch = lightning(p1,p2,10);

    branch_arr = []
    idx_arr = []
    branch = 10;
    for (let i =0; i<branch; i++){
        let r_idx = floor(random()*main_branch.length);
        idx_arr.push(r_idx);
        let random_p = main_branch[r_idx];
        branch_arr.push( lightning(random_p, createVector(random_p.x/3 + 2*width*random()/3, random_p.y + sqrt(random())*(height-random_p.y)),10) );
    }

    
    start_arr = [];
    end_arr = [];

    for (let i = 0; i<branch; i++){
        start_arr.push(false);
        end_arr.push(0);
    }
}

let t = 0;
function draw(){
    background(14,28,46);

    noFill();
    beginShape();
    

 
    draw_branch(main_branch.slice(0,min(main_branch.length,t+1)),6,1.5);

    for (let j=0; j<branch; j++){
        if (idx_arr[j]<=t){
            start_arr[j] = true;
        }
        if (start_arr[j]==true){
            end_arr[j] += 100;
            draw_branch(branch_arr[j].slice(0,min(branch_arr[j].length,end_arr[j])), 6*(1-j/branch), 1.5*(1-j/branch));
        }
    }
    t += 100;
    // console.log(t);

    endShape();

    if (t>30000){
        setup();
        t=0;
    }


}


function new_mid(p1,p2){
    let mid = createVector((p1.x+p2.x)/2, (p1.y+p2.y)/2);
    let orth = createVector(p2.y-p1.y,p1.x-p2.x);
    orth.normalize();
    let d = p1.dist(p2);
    let r = 0.5;
    let ran = random()-0.5;
    return p5.Vector.add(mid, orth.mult(ran*r*d));
}

function lightning(p1,p2,iteration){
    let points =[];
    points.push(p1);
    points.push(p2);
    
    for (let iter =0; iter<iteration; iter++){
        let new_points = [];
        for (let i = 0; i < points.length-1; i++){ 
            let m = new_mid(points[i],points[i+1]);
            new_points.push(points[i]);
            new_points.push(m);
            }
        
            new_points.push(points[points.length-1]);
            points = new_points;
    
    
    }
    return points
}


function draw_branch(points,w1,w2){
    strokeWeight(w1);
    stroke(122,11,209,100);
    for (let i = 0; i < points.length-1; i++)  { 
        line(points[i].x, points[i].y, points[i + 1].x, points[i + 1].y);
      }
    strokeWeight(w2);
    stroke(230);
    for (let i = 0; i < points.length-1; i++)  { 
        line(points[i].x, points[i].y, points[i + 1].x, points[i + 1].y);
      }

}