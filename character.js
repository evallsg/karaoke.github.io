import * as THREE from 'three';
import { AnimationRetargeting, applyTPose } from './retargeting.js'

class Character {
    constructor(model, skeleton, name, url, position = new THREE.Vector3()) {
        this.name = name;
        this.model = model;
        this.skeleton = skeleton;
        this.url = url;
        this.position = position;
        this.mixer = new THREE.AnimationMixer(this.model);
        this.retargeting = null;
        this.bindedAnimations = {};
        this.speed = 1;
    }

    setAnimation(animation, skeleton) {
        skeleton = applyTPose(skeleton);
        this.skeleton = applyTPose(this.skeleton);
        this.retargeting = new AnimationRetargeting(skeleton, this.skeleton, {srcPoseMode: AnimationRetargeting.BindPoseModes.CURRENT, trgPoseMode: AnimationRetargeting.BindPoseModes.CURRENT} );         
        this.bindAnimationToCharacter(animation);
        this.model.position.copy(this.position);
    }

    bindAnimationToCharacter(animation) {
  
        this.mixer.stopAllAction();
        let animationName = animation.name;
        while(this.mixer._actions.length){
            this.mixer.uncacheClip(this.mixer._actions[0]._clip); // removes action
        }
             
        
        let tracks = [];        
        // Remove position changes (only keep i == 0, hips)
        for (let i = 0; i < animation.tracks.length; i++) {

            if(!animation.tracks[i].name.includes("Hips") && animation.tracks[i].name.includes('position')) {
                continue;
            }
            tracks.push(animation.tracks[i]);
            tracks[tracks.length - 1].name = tracks[tracks.length - 1].name.replace( /[\[\]`~!@#$%^&*()|+\-=?;:'"<>\{\}\\\/]/gi, "").replace(".bones", "");
        }

        animation.tracks = tracks;  
        if( this.retargeting )
        {
            animation = this.retargeting.retargetAnimation(animation);
        }
        
        this.validateAnimationClip(animation);

        animation.name = animationName;   // mixer
                
        this.bindedAnimations[animationName] = animation;
            
        

        let bindedAnim = this.bindedAnimations[animationName];
        // mixer.clipAction(bindedAnim.mixerFaceAnimation).setEffectiveWeight(1.0).play(); // already handles nulls and undefines
        this.mixer.clipAction(bindedAnim).setEffectiveWeight(1.0).play();
        this.mixer.update(0);
        this.duration = bindedAnim.duration;

        return true;
    }

        
    /** Validate body animation clip created using ML */
    validateAnimationClip(clip) {

        let newTracks = [];
        let tracks = clip.tracks;
        let bones = this.skeleton.bones;
        let bonesNames = [];
        tracks.map((v) => { bonesNames.push(v.name.split(".")[0])});

        for(let i = 0; i < bones.length; i++)
        {
            
            let name = bones[i].name;
            if(bonesNames.indexOf( name ) > -1)
                continue;
            let times = [0];
            let values = [bones[i].quaternion.x, bones[i].quaternion.y, bones[i].quaternion.z, bones[i].quaternion.w];
            
            let track = new THREE.QuaternionKeyframeTrack(name + '.quaternion', times, values);
            newTracks.push(track);
            
        }
        clip.tracks = clip.tracks.concat(newTracks);
    }

    update(dt) {
        if(this.mixer) {
            this.mixer.update(dt*this.speed);
        }
    }

}

export default Character;