/**
 * ============================================================================
 * SOUND SYSTEM – SYNTHETISIERTE KLÄNGE OHNE EXTERNE MP3-DATEIEN
 * ============================================================================
 */

class SoundSystem {
    constructor() {
        this.ctx = null;
    }

    init() {
        if (!this.ctx) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (AudioCtx) this.ctx = new AudioCtx();
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    playTone(freq, type = 'sine', duration = 0.2, vol = 0.08, delay = 0) {
        this.init();
        if (!this.ctx) return;

        setTimeout(() => {
            try {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = type;
                osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

                gain.gain.setValueAtTime(vol, this.ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.0008, this.ctx.currentTime + duration);

                osc.connect(gain);
                gain.connect(this.ctx.destination);

                osc.start();
                osc.stop(this.ctx.currentTime + duration);
            } catch (e) {}
        }, delay * 1000);
    }

    jump() {
        this.playTone(280, 'sine', 0.18, 0.07);
        this.playTone(420, 'sine', 0.15, 0.05, 0.05);
    }

    slideTile() {
        this.playTone(480, 'triangle', 0.09, 0.06);
    }

    stepCorrect(stepIndex) {
        const notes = [440, 493.88, 554.37, 659.25, 880];
        this.playTone(notes[stepIndex % notes.length], 'triangle', 0.28, 0.09);
    }

    stepWrong() {
        this.playTone(170, 'sawtooth', 0.25, 0.08);
        this.playTone(135, 'sawtooth', 0.3, 0.08, 0.12);
    }

    puzzleSolved() {
        const chord = [523.25, 659.25, 783.99, 1046.50];
        chord.forEach((freq, idx) => {
            this.playTone(freq, 'triangle', 0.45, 0.09, idx * 0.11);
        });
    }

    teleport() {
        const notes = [330, 440, 554.37, 659.25, 880, 1108.73];
        notes.forEach((f, i) => this.playTone(f, 'sine', 0.35, 0.06, i * 0.06));
    }

    chestFanfare() {
        const melody = [523.25, 659.25, 783.99, 1046.50, 783.99, 1046.50];
        const times = [0, 0.14, 0.28, 0.42, 0.62, 0.78];
        melody.forEach((f, i) => this.playTone(f, 'triangle', 0.5, 0.11, times[i]));
    }
}
