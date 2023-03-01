export interface Subtitle {
  clip: string;
  source: string;
  target: string;
  start_sec: number;
  duration: number;
  extra: number;
  gender: string;
  length: number;
  edit: boolean;
  extended: boolean;
  character: [];
}

export interface Metadata {
  charType: string;
  charIndex: number;
  charLabel: string;
  active: boolean;
}

export interface Item {
  label: string;
  labelColor: string;
  description: string;
  active: boolean;
  collection?: [];
  path: string;
}