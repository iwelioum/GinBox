
export interface PlayerParams {
  url:    string;
  title:  string;
  poster: string;
}

export interface MpvResponse {
  data:  number | null;
  error: string;
}

export interface PlayerState {
  isPlaying: boolean;
  isLoaded:  boolean;
  volume:    number;
  position:  number;
  duration:  number;
}
