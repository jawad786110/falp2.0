
declare const Audio: any;

class AudioManager {
  private music: any;
  private jumpSound: any;
  private scoreSound: any;
  private crashSound: any;
  
  private musicVolume: number = 0.5;
  private sfxVolume: number = 0.5;

  constructor() {
    // Using reliable CDNs for sound effects
    this.music = new Audio('https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=forest-lullaby-110624.mp3'); 
    this.music.loop = true;
    
    this.jumpSound = new Audio('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3'); // Wing flap
    
    // Satisfying "Ding"
    this.scoreSound = new Audio('https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3'); 
    
    // Viral meme sound as requested
    this.crashSound = new Audio('https://www.myinstants.com/media/sounds/teri-maa-ka-bhosada.mp3'); 
  }

  setVolumes(musicVol: number, sfxVol: number) {
    this.musicVolume = musicVol;
    this.sfxVolume = sfxVol;
    
    this.music.volume = this.musicVolume;
    this.jumpSound.volume = this.sfxVolume;
    this.scoreSound.volume = this.sfxVolume;
    this.crashSound.volume = this.sfxVolume;
  }

  playMusic() {
    // Browsers require user interaction first, we handle this in the Start button
    this.music.play().catch((e: any) => console.log("Audio autoplay blocked until interaction"));
  }

  stopMusic() {
    this.music.pause();
    this.music.currentTime = 0;
  }

  playJump() {
    this.jumpSound.currentTime = 0;
    this.jumpSound.play().catch(() => {});
  }

  playScore() {
    this.scoreSound.currentTime = 0;
    this.scoreSound.play().catch(() => {});
  }

  playCrash() {
    this.crashSound.currentTime = 0;
    this.crashSound.play().catch(() => {});
  }
}

export const audioManager = new AudioManager();
