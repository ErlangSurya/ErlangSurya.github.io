let t = 0; 
let points = []; // Array to store points of the curve
let size = 30;
let thickness = 0.1;

function setup() {
    createCanvas(4*size, 4*size);
    background(265);
}

function draw() {
    background(265);
    let x = curveX(t);
    let y = curveY(t);
    points.push(createVector(x, y)); 

    // Draw the curve
    noFill();
    beginShape();
    for (let i = 1; i < points.length-2; i++)  { 
      strokeWeight(i*thickness);
      stroke(0);
      curve(points[i-1].x, points[i-1].y, points[i].x, points[i].y,points[i+1].x, points[i+1].y, points[i+2].x, points[i+2].y);
    }
  endShape();
    

    t += 0.01;
    if (t>1){
      t = t-1;
    }
    if (points.length>60){
      points = points.slice(1)
    }

}


function curveX(t) {
    return width / 2 + size * ( cos(TWO_PI*t)/(1+sin(TWO_PI*t)**2) );
}

function curveY(t) {
    return height / 2 + size * ( sin(TWO_PI*t)*cos(TWO_PI*t)/(1+sin(TWO_PI*t)**2));
}