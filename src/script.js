import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import * as dat from 'dat.gui'

//framerate counter taken from mr doob github
javascript:(function(){var script=document.createElement('script');script.onload=function(){var stats=new
Stats();document.body.appendChild(stats.dom);requestAnimationFrame(function loop(){stats.update();
requestAnimationFrame(loop)});};script.src='//mrdoob.github.io/stats.js/build/stats.min.js';
document.head.appendChild(script);})()


// new gui interface
const gui = new dat.GUI()

// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

//clock
const clock = new THREE.Clock()

// Objects
const particlesGeometry = new THREE.BufferGeometry;
const sparksGeometry = new THREE.BufferGeometry;
const max_line_points = 100000
const particlesCount = 100000
const maxSpeed = 2;
const box_size = 25;
const collision_distance = 0.1
let line_draw_count = 0
let floor = -box_size*0.7;
let speed = 2.5
let line_counter = 0 
let running = true


var control;

//initialise controls values
control = new function() {
    this.elasticity = 0.5
    this.speed = 2.5
    this.gravity = 0.03
    this.friction = 0.2
    this.air_resistance = 0.01 
};


addControls(control);

//initialise particle arrays
const posArray = new Float32Array(particlesCount * 3);
const velArray = new Float32Array(particlesCount * 3);
const accArray = new Float32Array(particlesCount * 3);





//set up gui controls
function addControls(controlObject) {
    var gui = new dat.GUI();
    gui.add(controlObject, 'elasticity', 0, 1);
    gui.add(controlObject, 'speed', 0, 8);
    gui.add(controlObject, 'gravity', -0.07, 0.07);
    gui.add(controlObject, 'friction', 0, 1);
    gui.add(controlObject, 'air_resistance', 0, 0.1);
    //gui.add(obj,'restart');
}

//line positions array
const lineArray = new Float32Array(max_line_points * 3);

//line geometry
var lineGeometry = new THREE.BufferGeometry();


//line material
var lineMaterial = new THREE.LineBasicMaterial( { color: 0xff0000 } );

// line
const line = new THREE.Line(lineGeometry,lineMaterial );
scene.add(line);

// Materials
//define my points material 
const material = new THREE.PointsMaterial({
    size: 0.2
})


// Mesh
const particlesMesh = new THREE.Points(particlesGeometry, material)
scene.add(particlesMesh)


// sizes
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

//resize window to size of mac screen
window.addEventListener('resize', () =>
{
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})


// Base camera
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100)
camera.position.x = 0
camera.position.y = 0
camera.position.z = 55
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true

//renderer
const renderer = new THREE.WebGLRenderer({
    canvas: canvas
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

//render scene
function render(){
    renderer.render(scene, camera);
}

function distance(particle1, particle2){
    var dx = posArray[particle1] - posArray[particle2];
    var dy = posArray[particle1+1] - posArray[particle2+1];
    var dz = posArray[particle1+2] - posArray[particle2+2];
    return Math.sqrt( dx * dx + dy * dy + dz * dz );
}

// Update objects
function gravity(){
    //update the velocity array using the y component of the velocity array for gravity
    for(let i = 1; i <particlesCount * 3; i = i + 3){
        velArray[i] =  velArray[i] - control.gravity;
    }
}

//air resistance applied to all paritcles every tick
function air_resistance(){
    for(let i = 0; i <particlesCount * 3; i++){
        velArray[i] = velArray[i]*(1-control.air_resistance)
    }    
}

//friction applied to the x and z components of particles when the hit the floor
function friction(i){
    velArray[i-1]= velArray[i-1] *(1-control.friction)
    velArray[i+1]= velArray[i+1] *(1-control.friction)
}

function is_collion(pos1,pos2){
    if((posArray[pos1] - posArray[pos2] < collision_distance) || (posArray[pos1] + posArray[pos2] < collision_distance)){
        if((posArray[pos1+1] - posArray[pos2+1] < collision_distance) || (posArray[pos1+1] + posArray[pos2+1] < collision_distance)){
            if((posArray[pos1+2] - posArray[pos2+2] < collision_distance) || (posArray[pos1+2] + posArray[pos2+2] < collision_distance)){
                return true
            }
        }
    }
    else{
        return false
    }
}

function check_particle_collisions(){
    for(let i = 0; i<particlesCount; i=i+3){
        for(let j = 0; j<particlesCount; j=j+3){
            if(is_collion(i,j) == true){
                console.log("collision at :" + i+ " and  " + j)
            }
        }
    }
}

//chesk if particles have reached floor
function check_floor_ceiling(yValue){
    if(yValue <= floor || yValue >= -floor  ){
        return true
    }
    else {
        return false
    }    
}

//chesk if particles have reached floor
function check_left(xValue){
    if(xValue <= -box_size ){
        return true
    }
    else {
        return false
    }    
}

//chesk if particles have reached floor
function check_right(xValue){
    if(xValue >= box_size  ){
        return true
    }
    else {
        return false
    }    
}

//chesk if particles have reached floor
function check_front(zValue){
    if(zValue >= box_size  ){
        return true
    }
    else {
        return false
    }    
}

//chesk if particles have reached floor
function check_rear(zValue){
    if(zValue <= -box_size){
        return true
    }
    else {
        return false
    }    
}

//check for all collisions with walls
function check_wall_collisions(i){
    //if i is referencing a y value
    if((i+2)%3==0){
        //if checkfloor is true then bounce particle back up with 70% initial speed
        if (check_floor_ceiling(posArray[i]) == true){
            posArray[i]= floor
            velArray[i]= -(control.elasticity*velArray[i])
            friction(i)

        }
    }

    
    //if i is referencing a x value
    if((i+3)%3==0){
        //if checkfloor is true then bounce particle back up with 70% initial speed
        if (check_left(posArray[i]) == true){
            posArray[i]= -box_size
            velArray[i]= -(control.elasticity*velArray[i])
        }
        if (check_right(posArray[i]) == true){
            posArray[i]= box_size
            velArray[i]= -(control.elasticity*velArray[i])
        }
    }

    //if i is referencing a x value
    if((i+1)%3==0){
        //if checkfloor is true then bounce particle back up with 70% initial speed
        if (check_front(posArray[i]) == true){
            posArray[i]= box_size
            velArray[i]= -(control.elasticity*velArray[i])
        }
        if (check_rear(posArray[i]) == true){
            posArray[i]= -box_size
            velArray[i]= -(control.elasticity*velArray[i])
        }
    }
    
}

//update the position array using the velocity array
function update_positions(){
    lineArray[line_counter] = posArray[0]
    lineArray[line_counter+1] = posArray[1]
    lineArray[line_counter+2] = posArray[2]
    lineGeometry.setAttribute( 'position', new THREE.BufferAttribute( lineArray, 3 ) );
    lineGeometry.setDrawRange( 0, line_draw_count );
    line_counter = line_counter + 3
    line_draw_count ++

    for(let i = 0; i <particlesCount * 3; i++){
        
        if (velArray[i] >= maxSpeed){
            velArray[i] = maxSpeed
        }
        if (velArray[i] <= -maxSpeed){
            velArray[i] = -maxSpeed
        }

        //update position with respecct to velocity
        velArray[i] =  velArray[i] + accArray[i];
        posArray[i] =  posArray[i] + velArray[i];
        
        check_wall_collisions(i);     
        

    }
    //check_particle_collisions()
    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3))
    //console.log(posArray[1])
    //console.log(velArray[1])

}

//define reset function
function reset(){


    //gives random x and z values for particles within area
    for(let i = 0; i < particlesCount; i=i+3){
        posArray[i] =  0
    }

    //gives random x and z values for particles within area
    for(let i = 1; i < particlesCount; i=i+3){
        posArray[i] =  0
    }

    //gives random x and z values for particles within area
    for(let i = 2; i < particlesCount; i=i+3){
        posArray[i] =  0 
    }

    //initialises all velocities as random
    for(let i = 0; i <particlesCount * 3; i++){
        velArray[i] =  0
        
    }

    //initialises all accelerations as 0
    for(let i = 0; i <particlesCount * 3; i++){
        accArray[i] =  0
    }

    //set position attribute of particles to initial positions
    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3))

}

//give random velocities to particles
function init(){


    
    //initialises all velocities as random
    for(let i = 0; i <particlesCount * 3; i++){
        velArray[i] =  (Math.random()-0.5)*control.speed
        
    }


    //set position attribute of particles to initial positions
    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3))

}






function animate()
{
    
    const elapsedTime = clock.getElapsedTime()
    if(running == true){
        //gravity
        gravity()

        air_resistance()

        //update positions wiith respect to
        update_positions()

        // Render
        render()
        

        // Call tick again on the next frame
        window.requestAnimationFrame(animate)
    }
    else {
        reset()
        return true
    }
    
}

window.addEventListener('keydown', (event) =>{
    if(event.key === "e"){
        running = true
        reset()
        init()
        animate()
    }
    if(event.key == "r"){
        reset()
        running = false
    }
    
})

//animate()