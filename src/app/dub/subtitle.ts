export interface Subtitle {
  clip: string;
  source: string;
  target: string;
  start_sec: number;
  duration: number;
  extra: number;
  length: number;
  edit: boolean;
  extended: boolean;
  character: string[];
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
  badge: string;
  active: boolean;
  collection?: [];
  path: string;
}