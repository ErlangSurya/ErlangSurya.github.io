function setup() {
    createCanvas(windowWidth, windowHeight);
    background(14,28,46);

    let lightning_arr = [];

    let p1 = createVector(width/3 + random()*width/3, 0);
    let p2 = createVector(width/3 + random()*width/3, height*9/10);
    points = lightning(p1,p2,15);
    lightning_arr.push(points);

    for (let i =0; i<10; i++){
        let random_p = random_element(lightning_arr[0]);
        lightning_arr.push( lightning(random_p, createVector(random_p.x/3 + 2*width*random()/3, random_p.y + sqrt(random())*(height-random_p.y)),10) );
    }

    // for (let i =0; i<5; i++){
    //     let random_p = random_element(random_element(lightning_arr));
    //     lightning_arr.push( lightning(random_p, createVector(random_p.x/3 + 2*width*random()/3, random_p.y + sqrt(random())*(height-random_p.y)),10) );
    // }


    noFill();
    beginShape();
    
    //stroke(122,11,209);
    
    for (let i=0; i<lightning_arr.length; i++){
        strokeWeight(6*(1-i/lightning_arr.length));
        stroke(122,11,209,100);
        draw_branch(lightning_arr[i]);


        strokeWeight(1.5*(1-i/lightning_arr.length));
        stroke(230);
        draw_branch(lightning_arr[i]);
    }
    
    endShape();
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

function random_element(points){
    return points[floor(random()*points.length)]
}

function draw_branch(points){
    for (let i = 0; i < points.length-1; i++)  { 
        line(points[i].x, points[i].y, points[i + 1].x, points[i + 1].y);
      }
}