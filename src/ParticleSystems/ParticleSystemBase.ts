import { BufferGeometry, ShaderMaterial, AdditiveBlending, Points, Vector3, PerspectiveCamera, TextureLoader, Color, Float32BufferAttribute, Material } from "three";
import { LinearSpline } from "../Utilitites/LinearSpline";
import { Utility } from "../Utilitites/Utility";


export class Particle {
    alpha!: number;
    life!: number;
    maxLife!: number;
    position!: Vector3;
    size!: number;
    colour!: Color;
    rotation!: number;
    velocity!: Vector3;
}

export abstract class ParticleSystemBase {
    geometry: BufferGeometry;
    material!: ShaderMaterial;
    particles: Particle[];
    points!: Points<BufferGeometry, Material>;
    frequency: number;  //emit every frequency ms
    freqCounter: number;
    maxEmitterLife?: number;    // duration of the particle system    
    particleMaxLife!: number;

    life: number;       // range from 0 to maxLife
    emitRateSpline?: LinearSpline;

    constructor(params: any) {
        if (!params.parent || !params.frequency) {
            throw new Error(`${Utility.timestamp()} Missing expected to param in ParticleSystemBase()`);
        }
        this.particles = [];

        this.geometry = new BufferGeometry();
        this.geometry.setAttribute('position', new Float32BufferAttribute([], 3));
        this.geometry.setAttribute('size', new Float32BufferAttribute([], 1));
        this.geometry.setAttribute('colour', new Float32BufferAttribute([], 4));
        this.geometry.setAttribute('angle', new Float32BufferAttribute([], 1));

        if (params.maxEmitterLife) {
            this.maxEmitterLife = params.maxEmitterLife;
        }
        this.life = 0;
        this.frequency = params.frequency;
        this.freqCounter = 0;

    }

    tick(timeElapsed: number) {
        this.addParticlesGate(timeElapsed);
        this.updateParticles(timeElapsed);
        this.updateGeometry();
    }

    abstract addParticle(): void;
    abstract updateParticles(timeElapsed: number): void;

    addParticlesGate(timeElapsed: number) {
        this.freqCounter += timeElapsed;
        if (this.freqCounter < this.frequency) {
            return;
        }

        if (this.maxEmitterLife && this.life > this.maxEmitterLife) {
            // emission time is over, ps is winding down
            return;
        }

        // Reset the freq counter
        this.freqCounter = this.freqCounter - this.frequency;

        // Determine how many particles to add
        const numParticles = (this.emitRateSpline && this.maxEmitterLife) ? Math.floor(this.emitRateSpline.get(this.life / this.maxEmitterLife)) : 1;
        for (let i = 0; i < numParticles; i++) {
            this.addParticle();
        }
        //console.log(`${Utility.timestamp()} in addParticlesGate, adding ${numParticles}`);
    }

    updateGeometry() {
        const positions: number[] = [];
        const sizes: number[] = [];
        const colours: number[] = [];
        const angles: number[] = [];

        for (const p of this.particles) {
            positions.push(p.position.x, p.position.y, p.position.z);
            colours.push(p.colour.r, p.colour.g, p.colour.b, p.alpha);
            sizes.push(p.size);
            angles.push(p.rotation);
        }

        this.geometry.setAttribute(
            'position', new Float32BufferAttribute(positions, 3));
        this.geometry.setAttribute(
            'size', new Float32BufferAttribute(sizes, 1));
        this.geometry.setAttribute(
            'colour', new Float32BufferAttribute(colours, 4));
        this.geometry.setAttribute(
            'angle', new Float32BufferAttribute(angles, 1));

        this.geometry.attributes.position.needsUpdate = true;
        this.geometry.attributes.size.needsUpdate = true;
        this.geometry.attributes.colour.needsUpdate = true;
        this.geometry.attributes.angle.needsUpdate = true;
    }

}
