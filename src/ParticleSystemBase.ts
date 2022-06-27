import { BufferGeometry, ShaderMaterial, AdditiveBlending, Points, Vector3, PerspectiveCamera, TextureLoader, Color, Float32BufferAttribute } from "three";

import { LinearSpline } from "./LinearSpline";



export abstract class ParticleSystemBase {
    _geometry: BufferGeometry;
    _material!: ShaderMaterial;
    _camera: PerspectiveCamera;
    _particles: any[];
    _points!: Points<BufferGeometry, any>;

    constructor(params: any) {

        this._camera = params.camera;
        this._particles = [];

        this._geometry = new BufferGeometry();
        this._geometry.setAttribute('position', new Float32BufferAttribute([], 3));
        this._geometry.setAttribute('size', new Float32BufferAttribute([], 1));
        this._geometry.setAttribute('colour', new Float32BufferAttribute([], 4));
        this._geometry.setAttribute('angle', new Float32BufferAttribute([], 1));

    }

    _onKeyUp(event: KeyboardEvent) {
        switch (event.keyCode) {
            case 32: // SPACE
                this._AddParticles(undefined);
                break;
        }
    }

    abstract _AddParticles(timeElapsed?: number): void;

    _UpdateGeometry() {
        const positions = [];
        const sizes = [];
        const colours = [];
        const angles = [];

        for (let p of this._particles) {
            positions.push(p.position.x, p.position.y, p.position.z);
            colours.push(p.colour.r, p.colour.g, p.colour.b, p.alpha);
            sizes.push(p.currentSize);
            angles.push(p.rotation);
        }

        this._geometry.setAttribute(
            'position', new Float32BufferAttribute(positions, 3));
        this._geometry.setAttribute(
            'size', new Float32BufferAttribute(sizes, 1));
        this._geometry.setAttribute(
            'colour', new Float32BufferAttribute(colours, 4));
        this._geometry.setAttribute(
            'angle', new Float32BufferAttribute(angles, 1));

        this._geometry.attributes.position.needsUpdate = true;
        this._geometry.attributes.size.needsUpdate = true;
        this._geometry.attributes.colour.needsUpdate = true;
        this._geometry.attributes.angle.needsUpdate = true;
    }

    abstract _UpdateParticles(timeElapsed: number): void;

    Step(timeElapsed: any) {
        this._AddParticles(timeElapsed);
        this._UpdateParticles(timeElapsed);
        this._UpdateGeometry();
    }
}