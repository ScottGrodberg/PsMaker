import { Vector3, Color, ShaderMaterial, TextureLoader, Points, NormalBlending } from "three";
import { LinearSpline } from "../LinearSpline";
import { Particle, ParticleSystemBase } from "../ParticleSystemBase";



const _VS = `
uniform float pointMultiplier;

attribute float size;
attribute float angle;
attribute vec4 colour;

varying vec4 vColour;
varying vec2 vAngle;

void main() {
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);

  gl_Position = projectionMatrix * mvPosition;
  gl_PointSize = size * pointMultiplier / gl_Position.w;

  vAngle = vec2(cos(angle), sin(angle));
  vColour = colour;
}`;

const _FS = `

uniform sampler2D diffuseTexture;

varying vec4 vColour;
varying vec2 vAngle;

void main() {
  vec2 coords = (gl_PointCoord - 0.5) * mat2(vAngle.x, vAngle.y, -vAngle.y, vAngle.x) + 0.5;
  gl_FragColor = texture2D(diffuseTexture, coords) * vColour;
}`;

export class SmokePuff extends ParticleSystemBase {
    particleLife = 0.4;
    initialVelocity = 15;

    _alphaSpline: LinearSpline;
    _colourSpline: LinearSpline;
    _sizeSpline: LinearSpline;
    _velocitySpline: LinearSpline;

    timerCounter = 0;

    constructor(params: any) {
        super(params);

        const uniforms = {
            diffuseTexture: {
                value: new TextureLoader().load('./resources/smoke.png')
            },
            pointMultiplier: {
                value: window.innerHeight / (2.0 * Math.tan(0.5 * 60.0 * Math.PI / 180.0))
            }
        };

        this._material = new ShaderMaterial({
            uniforms: uniforms,
            vertexShader: _VS,
            fragmentShader: _FS,
            blending: NormalBlending,
            depthTest: true,
            depthWrite: false,
            transparent: true,
            vertexColors: true
        });

        this._points = new Points(this._geometry, this._material);

        params.parent.add(this._points);

        this._alphaSpline = new LinearSpline((t: number, a: number, b: number) => {
            return a + t * (b - a);
        });
        this._alphaSpline.AddPoint(0.0, 0.0);
        this._alphaSpline.AddPoint(0.2, 0.7);
        this._alphaSpline.AddPoint(1.0, 0.0);

        this._colourSpline = new LinearSpline((t: any, a: { clone: () => any; }, b: any) => {
            const c = a.clone();
            return c.lerp(b, t);
        });
        this._colourSpline.AddPoint(0.0, new Color(0xFFFFFF));
        this._colourSpline.AddPoint(1.0, new Color(0x999999));

        this._sizeSpline = new LinearSpline((t: number, a: number, b: number) => {
            return a + t * (b - a);
        });
        this._sizeSpline.AddPoint(0.0, 0.0);
        this._sizeSpline.AddPoint(1.0, 10.0);

        this._velocitySpline = new LinearSpline((t: number, a: number, b: number) => {
            return a + t * (b - a);
        });
        this._velocitySpline.AddPoint(0.0, 3.0);
        this._velocitySpline.AddPoint(0.2, 1.0);
        this._velocitySpline.AddPoint(1.0, 0.0);

        this._UpdateGeometry();
    }

    AddParticlesGate(timeElapsed: number) {
        this.timerCounter += timeElapsed;
        if (this.timerCounter < 0.01) {
            return;
        }
        this.timerCounter = 0;
        this.AddParticle();
    }

    AddParticle() {
        const particle = new Particle();
        particle.size = 0
        particle.position = new Vector3(0, 0, 0);
        particle.colour = new Color();
        particle.alpha = 1.0;
        particle.life = this.particleLife;
        particle.maxLife = this.particleLife;
        particle.rotation = Math.random() * 2.0 * Math.PI;
        particle.velocity = new Vector3(Math.cos(particle.rotation), 0, Math.sin(particle.rotation)).multiplyScalar(Math.random() * this.initialVelocity);

        this._particles.push(particle);
    }

    UpdateParticles(timeElapsed: number): void {
        for (let p of this._particles) {
            p.life -= timeElapsed;
        }

        this._particles = this._particles.filter(p => {
            return p.life > 0.0;
        });

        for (const p of this._particles) {
            const t = 1.0 - p.life / p.maxLife;

            p.rotation += timeElapsed * 0.5;

            // update properties from splines
            p.alpha = this._alphaSpline.Get(t);
            p.size = this._sizeSpline.Get(t);
            p.colour.copy(this._colourSpline.Get(t));

            p.position.add(p.velocity.clone().multiplyScalar(this._velocitySpline.Get(t) * timeElapsed));

        }

        // this._particles.sort((a, b) => {
        //     const d1 = this._camera.position.distanceTo(a.position);
        //     const d2 = this._camera.position.distanceTo(b.position);

        //     if (d1 > d2) {
        //         return -1;
        //     }

        //     if (d1 < d2) {
        //         return 1;
        //     }

        //     return 0;
        // });
    }
}