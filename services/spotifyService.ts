import { SpotifyPlayerState } from '../types';

type SpotifyErrorCallback = (errorType: string, message: string) => void;

interface SpotifyInitCallbacks {
  onReady: (deviceId: string) => void;
  onStateChange: (state: SpotifyPlayerState | null) => void;
  onError: SpotifyErrorCallback;
}

export class SpotifyService {
  private token: string;
  private player: any | null = null;
  private deviceId: string | null = null;

  constructor(token: string) {
    this.token = token;
  }

  public initPlayer(callbacks: SpotifyInitCallbacks): void {
    if (!(window as any).Spotify) {
      console.error("Spotify SDK script not loaded.");
      callbacks.onError("initialization_error", "Spotify SDK not available.");
      return;
    }
    
    this.player = new (window as any).Spotify.Player({
      name: 'Chizuru AI Companion',
      getOAuthToken: (cb: (token: string) => void) => { cb(this.token); },
      volume: 0.5
    });

    this.player.addListener('ready', ({ device_id }: { device_id: string }) => {
      console.log('Ready with Device ID', device_id);
      this.deviceId = device_id;
      callbacks.onReady(device_id);
    });

    this.player.addListener('not_ready', ({ device_id }: { device_id: string }) => {
      console.log('Device ID has gone offline', device_id);
    });

    this.player.addListener('player_state_changed', (state: any | null) => {
      if (!state) {
        callbacks.onStateChange(null);
        return;
      }
      const simplifiedState: SpotifyPlayerState = {
        track: state.track_window.current_track ? {
            name: state.track_window.current_track.name,
            uri: state.track_window.current_track.uri,
            album: {
                name: state.track_window.current_track.album.name,
                images: state.track_window.current_track.album.images,
            },
            artists: state.track_window.current_track.artists,
        } : null,
        is_paused: state.paused,
        position: state.position,
        duration: state.duration,
      };
      callbacks.onStateChange(simplifiedState);
    });
    
    this.player.addListener('authentication_error', ({ message }: { message: string }) => callbacks.onError('authentication_error', message));
    this.player.addListener('account_error', ({ message }: { message: string }) => callbacks.onError('account_error', message));
    this.player.addListener('initialization_error', ({ message }: { message: string }) => callbacks.onError('initialization_error', message));
    this.player.addListener('playback_error', ({ message }: { message: string }) => callbacks.onError('playback_error', message));

    this.player.connect();
  }

  private async spotifyRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T | null> {
    const url = `https://api.spotify.com/v1/${endpoint}`;
    try {
        const response = await fetch(url, {
            ...options,
            headers: {
                ...options.headers,
                'Authorization': `Bearer ${this.token}`,
                'Content-Type': 'application/json'
            }
        });
        if (!response.ok) {
            const error = await response.json();
            console.error(`Spotify API Error: ${error.error.message}`);
            return null;
        }
        if (response.status === 204) return null; // No content
        return response.json() as Promise<T>;
    } catch (error) {
        console.error("Failed to make Spotify API request", error);
        return null;
    }
  }

  public async searchAndPlay(query: string): Promise<void> {
    if (!this.deviceId) {
      console.error("No active Spotify device.");
      return;
    }

    const result = await this.spotifyRequest<{ tracks: { items: any[] } }>(
        `search?q=${encodeURIComponent(query)}&type=track&limit=1`
    );

    const trackUri = result?.tracks?.items?.[0]?.uri;
    if (trackUri) {
      await this.spotifyRequest(
        `me/player/play?device_id=${this.deviceId}`,
        {
          method: 'PUT',
          body: JSON.stringify({ uris: [trackUri] })
        }
      );
    } else {
      console.log(`Could not find a song for query: ${query}`);
    }
  }

  public async togglePlay(): Promise<void> {
      const state = await this.player?.getCurrentState();
      if (state?.paused) {
          await this.player?.resume();
      } else {
          await this.player?.pause();
      }
  }

  public async nextTrack(): Promise<void> {
      await this.player?.nextTrack();
  }

  public async previousTrack(): Promise<void> {
      await this.player?.previousTrack();
  }

  public disconnect(): void {
    this.player?.disconnect();
  }
}