import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js'

import { BVHLoader } from './BVHeLoader.js';
import Character from './character.js';
class App {
    constructor() {
        
        this.elapsedTime = 0; // clock is ok but might need more time control to dinamicaly change signing speed
        this.clock = new THREE.Clock();
        this.loaderBVH = new BVHLoader();
        this.loaderGLB = new GLTFLoader();
        this.loaderFBX = new FBXLoader();

        this.mixer = null;
        this.playing = false;

        document.addEventListener('DOMContentLoaded', () => {
            const photoBoard = document.getElementById('photoBoard');
        
            // Example images and captions for the polaroids
            const photos = [
                {src: 'https://via.placeholder.com/150', caption: 'Photo 1'},
                {src: 'https://via.placeholder.com/150', caption: 'Photo 2'},
                {src: 'https://via.placeholder.com/150', caption: 'Photo 3'},
                {src: 'https://via.placeholder.com/150', caption: 'Photo 4'},
                {src: 'https://via.placeholder.com/150', caption: 'Photo 5'},
                {src: 'https://via.placeholder.com/150', caption: 'Photo 6'},
                {src: 'https://via.placeholder.com/150', caption: 'Photo 7'},
                {src: 'https://via.placeholder.com/150', caption: 'Photo 8'},
                {src: 'https://via.placeholder.com/150', caption: 'Photo 9'},
                {src: 'https://via.placeholder.com/150', caption: 'Photo 10'},
            ];
        
            // Create polaroid elements
            photos.forEach((photo, index) => {
                const polaroid = document.createElement('div');
                polaroid.classList.add('polaroid');
                polaroid.style.setProperty('--rotation', Math.random());
                polaroid.style.setProperty('--translateX',  (photoBoard.clientWidth*Math.random()).toString() + "px");
                polaroid.style.setProperty('--translateY',  (photoBoard.clientHeight*Math.random()).toString() + "px");
                polaroid.innerHTML = `
                    <img src="${photo.src}" alt="${photo.caption}">
                    <div class="caption">${photo.caption}</div>
                `;
        
                // Add the polaroid to the photo board
                photoBoard.appendChild(polaroid);
                polaroid.classList.add('visible')
                // Animate the polaroid in and out
                setTimeout(() => polaroid.classList.add('visible'), index * 300);
                setTimeout(() => polaroid.classList.remove('visible'), 2000 + index * 300);
            });
        
            // Re-trigger the animation
            setInterval(() => {
                const polaroids = document.querySelectorAll('.polaroid');
                polaroids.forEach((polaroid, index) => {
                    setTimeout(() => polaroid.classList.add('visible'), index * 300);
                    setTimeout(() => polaroid.classList.remove('visible'), 2000 + index * 300);
                });
            }, 6000);
        });
    }

    init() {        
        this.scene = new THREE.Scene();
        let sceneColor = 0xa0a0a0;//0x303030;
        this.scene.background = new THREE.Color( sceneColor );
    
        this.scene.fog = new THREE.Fog( sceneColor, 10, 50 );

        // renderer
        this.renderer = new THREE.WebGLRenderer( { antialias: true } );
        this.renderer.setPixelRatio( window.devicePixelRatio );
        this.renderer.setSize( window.innerWidth, window.innerHeight );

        this.renderer.toneMapping = THREE.LinearToneMapping;
        this.renderer.toneMappingExposure = 1;
        // this.renderer.shadowMap.enabled = false;
        document.body.appendChild( this.renderer.domElement );

        //include lights
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);

        const hemiLight = new THREE.HemisphereLight( 0xffffff, 0xffffff, 2 );
        hemiLight.position.set( 0, 50, 0 );
        this.scene.add( hemiLight );

        const dirLight = new THREE.DirectionalLight( 0xffffff, 3 );
        dirLight.position.set( - 1, 1.75, 1 );
        dirLight.position.multiplyScalar( 30 );
        this.scene.add( dirLight );

        dirLight.castShadow = true;

        dirLight.shadow.mapSize.width = 2048;
        dirLight.shadow.mapSize.height = 2048;

        const d = 50;

        dirLight.shadow.camera.left = - d;
        dirLight.shadow.camera.right = d;
        dirLight.shadow.camera.top = d;
        dirLight.shadow.camera.bottom = - d;

        dirLight.shadow.camera.far = 3500;
        dirLight.shadow.bias = - 0.0001;

        // add entities
        let ground = new THREE.Mesh( new THREE.PlaneGeometry( 300, 300 ), new THREE.MeshStandardMaterial( { color: 0xcbcbcb, depthWrite: true, roughness: 1, metalness: 0 } ) );
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        this.scene.add( ground );
       
        this.camera = new THREE.PerspectiveCamera(60, window.innerWidth/window.innerHeight, 0.01, 1000);
        this.camera.position.set(0,1.2,2);
        this.controls = new OrbitControls( this.camera, this.renderer.domElement );
        this.controls.target.set(0, 1, 0);
        this.controls.enableDamping = true; // this requires controls.update() during application update
        this.controls.dampingFactor = 0.1;
        this.controls.enabled = true;
        this.controls.update();

        this.renderer.render( this.scene,this.camera );    
        
        this.charactersToLoad = [
            {name: 'Alba', filepath: 'https://models.readyplayer.me/66f14263d1fc3e398257745c.glb', position: new THREE.Vector3(-0.5,0,0)},
            {name: 'Matej', filepath: 'https://models.readyplayer.me/66f6cc0711bf6ced95138eb0.glb', position: new THREE.Vector3(0.5,-0.1,0)},
            {name: 'Eva', filepath: 'https://webglstudio.org/3Dcharacters/ReadyEva/ReadyEva.glb', position: new THREE.Vector3(1.5,0,-1)},
            {name: 'Victor', filepath: 'https://webglstudio.org/3Dcharacters/ReadyVictor/ReadyVictor.glb', position: new THREE.Vector3(-1.5,0,-1)}
        ];
 
        this.loadedCharacters = {};
        this.loadAvatars().then(() => {
            this.loadAnimation('data/Macarena Dance.fbx', null, ()=> {
                 document.getElementById("loading").classList.add('hidden');
            });           
        })
        window.addEventListener( 'resize', this.onWindowResize.bind(this) );
        
        fetch('data/lyrics.ttml').then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.text();
        })
        .then((ttmlData) => {
            const captions = parseTTML(ttmlData);
            // Display lyrics in sync with the audio
            const audio = document.getElementById("karaoke-audio");
            const lyricsContainer = document.getElementById("lyrics");
    
            audio.addEventListener("timeupdate", () => {
                const currentTime = audio.currentTime;
                for (let i = 0; i < captions.length; i++) {
                    const caption = captions[i];
                    if (currentTime >= caption.begin && currentTime <= caption.end) {
                        lyricsContainer.innerHTML = caption.text;
                        break;
                    } else if (currentTime > caption.end) {
                        lyricsContainer.innerHTML = ""; // Clear the lyrics if the caption has ended
                    }
                }
            });
            const btn = document.getElementById("play-btn");
            btn.addEventListener("click", (e) => {
                if(this.playing) {
                    this.playing = false;
                    audio.pause();
                    btn.children[0].classList.remove("fa-pause");
                    btn.children[0].classList.add("fa-play");
                }
                else {
                    this.playing = true;
                    audio.play();    
                    btn.children[0].classList.remove("fa-play");
                    btn.children[0].classList.add("fa-pause");                
                }
            })
            this.animate();
        })

    }

    loadAvatars() {
        let promises = [];
        for(let i = 0; i < this.charactersToLoad.length; i++) {
            let filePromise = new Promise(resolve => {                 
                let url = this.charactersToLoad[i].filepath;
                url += url.includes('models.readyplayer.me') ? '?pose=T&morphTargets=ARKit&lod=1' : '';
                this.loadAvatar(url, this.charactersToLoad[i], (data) => resolve(data))                              
                
            });
            promises.push(filePromise); 
        }
        return Promise.all(promises);
    }

    animate() {

        requestAnimationFrame( this.animate.bind(this) );

        let delta = this.clock.getDelta()         
        this.elapsedTime += delta;
        
        this.update(delta); 
        this.controls.update();
        
        this.renderer.render( this.scene, this.camera );
    }

    update( deltaTime ) {
        this.elapsedTime += deltaTime;

        if (this.playing) {
            for(let i = 0; i < this.charactersToLoad.length; i++) {
                this.loadedCharacters[this.charactersToLoad[i].name].update(deltaTime);
            } 
        }
    }

    loadAvatar( modelFilePath, options, callback = null ) {
       
        this.loaderGLB.load( modelFilePath, (glb) => {
            let model = glb.scene;
            
            model.castShadow = true;
            let skeleton = null;
            
            model.traverse( (object) => {
                if ( object.isMesh || object.isSkinnedMesh ) {                        
                    object.material.side = THREE.FrontSide;
                    object.frustumCulled = false;
                    object.castShadow = true;
                    object.receiveShadow = true;
                    if (object.name == "Eyelashes") // eva
                        object.castShadow = false;
                    if(object.material.map) 
                        object.material.map.anisotropy = 16;
                }                             
                if (object.skeleton){
                    skeleton = object.skeleton;                         
                }
            } );
                        
           let avatarName = model.name = options.name;
            
            let animations = glb.animations;

            if(!skeleton && bones.length) {
                skeleton = new THREE.Skeleton(bones);
                for(let i = 0; i < animations.length; i++) {
                    this.loadBVHAnimation(avatarName, {skeletonAnim :{skeleton, clip: animations[i]}}, i == (animations.length - 1) ? callback : null)
                }
                return;
            }
            let skeletonHelper = new THREE.SkeletonHelper(skeleton.bones[0]);
            this.loadedCharacters[avatarName] = new Character(model, skeleton, avatarName, modelFilePath, options.position);
            this.scene.add(model);
            this.onLoadAvatar(model, avatarName);
            if (callback) {
                callback(animations);
            }
        
        });

    }

    loadAnimation( modelFilePath, avatarName, callback = null ) {
        const path = modelFilePath.split(".");
        const filename = path[0];
        const extension = path[1];
        if(extension == "bvh" || extension == "bvhe") {
            const data = this.loaderBVH.parseExtended(modelFilePath);
            this.loadBVHAnimation( avatarName, data, callback );     
        }
        else if(extension == 'fbx') {
            this.loaderFBX.load(modelFilePath, (model) => {
                model.scale.set(0.01, 0.01, 0.01);
                let bones = [];
                model.traverse( (object) => {
                    if ( object.isMesh || object.isSkinnedMesh ) {                        
                        object.material.side = THREE.FrontSide;
                        object.frustumCulled = false;
                        object.castShadow = true;
                        object.receiveShadow = true;
                        
                    }                            
                    if (object.isBone){                        
                        bones.push(object);                         
                    }
                } );
                let skeleton = new THREE.Skeleton(bones);
               
                for(let character in this.loadedCharacters) {
                    this.loadedCharacters[character].setAnimation((model).animations[0], skeleton);
                }            
                if(callback) {
                    callback();
                }
            });
        }
    } 

    changePlayState(state = !this.playing) {
        this.playing = state;
    }

    stopAnimation() {
        this.playing = false;
        if(this.mixer) {
            this.mixer.update(0);                      
            this.mixer.setTime(0);                      
        }
        
    }

    onLoadAvatar(newAvatar, name){      
        // Create mixer for animation
        const mixer = new THREE.AnimationMixer(newAvatar);  
        this.loadedCharacters[name].mixer = mixer;
    }


    onWindowResize() {
        
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
    
        this.renderer.setSize( window.innerWidth, window.innerHeight );
    }

    // load animation from bvhe file
    loadBVHAnimation(name, animationData, callback) { 

        let skeleton = null;
        let bodyAnimation = null;
        let faceAnimation = null;
        if ( animationData && animationData.skeletonAnim ){
            skeleton = animationData.skeletonAnim.skeleton;
            skeleton.bones.forEach( b => { b.name = b.name.replace( /[`~!@#$%^&*()|+\-=?;:'"<>\{\}\\\/]/gi, "") } );
            // loader does not correctly compute the skeleton boneInverses and matrixWorld 
            skeleton.bones[0].updateWorldMatrix( false, true ); // assume 0 is root
            skeleton = new THREE.Skeleton( skeleton.bones ); // will automatically compute boneInverses
            
            animationData.skeletonAnim.clip.tracks.forEach( b => { b.name = b.name.replace( /[`~!@#$%^&*()|+\-=?;:'"<>\{\}\\\/]/gi, "") } );     
            animationData.skeletonAnim.clip.name = name;
            bodyAnimation = animationData.skeletonAnim.clip;
        }
        
        if ( animationData && animationData.blendshapesAnim ){
            animationData.blendshapesAnim.clip.name = "faceAnimation";       
            faceAnimation = animationData.blendshapesAnim.clip;
        }

        this.loadedAnimations[name] = {
            name: name,
            animation: bodyAnimation ?? new THREE.AnimationClip( "bodyAnimation", -1, [] ),
            faceAnimation,
            skeleton,
            type: "bvhe"
        };

        let boneContainer = new THREE.Group();
        boneContainer.add( skeleton.bones[0] );
        boneContainer.position.x = -1;
        boneContainer.name = "Armature";
        this.scene.add( boneContainer );
        let skeletonHelper = new THREE.SkeletonHelper(boneContainer);
        skeletonHelper.name = name;
        skeletonHelper.skeleton = skeleton;
        skeletonHelper.changeColor( 0xFF0000, 0xFFFF00 );
        
        this.loadedCharacters[name] ={
            model: skeletonHelper, skeleton, animations: [this.loadedAnimations[name].animation]
        }
        this.onLoadAvatar(skeletonHelper, name);
        if (callback) {
            callback(this.loadedCharacters[name].animations);
        }
    }

    resize(width, height) {
        const aspect = width / height;
        this.camera.aspect = aspect;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }
}
    
export {App}

const app = new App();
app.init();
window.app = app;




function parseTTML(ttmlString) {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(ttmlString, "text/xml");
    const captions = [];

    const paragraphs = xmlDoc.getElementsByTagName("p");
    for (let i = 0; i < paragraphs.length; i++) {
        const p = paragraphs[i];
        const begin = p.getAttribute("begin");
        const end = p.getAttribute("end");
        const text = p.getElementsByTagName('span')[0].textContent;
        const title = p.getAttribute("xmlns:tts");

        captions.push({
            begin: parseTime(begin),
            end: title ? 0 : parseTime(end),
            text: text
        });
    }

    return captions;
}

function parseTime(timeString) {
    const parts = timeString.split(":");
    const minutes = parseInt(parts[0]);
    const seconds = parseFloat(parts[1]);
    const mseconds = parseFloat(parts[2])
    return (minutes * 60*2 + seconds*60) + mseconds;
}
