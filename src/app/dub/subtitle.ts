export interface Subtitle {
  clip: string;
  source: string;
  target: string;
  start_sec: number;
  duration: number;
  gender: string;
  length: number;
  edit: boolean;
}

export interface Item {
  label: string;
  labelColor: string;
  description: string;
  active: boolean;
  collection?: [];
  subindex?: [];
  path: string;
}