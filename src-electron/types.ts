export interface TemplateAttribute {
  column: string;
  changeoverTime: number;
  parallelGroup: string;
}

export interface TemplateConfig {
  orderIdColumn: string;
  attributes: TemplateAttribute[];
}

export interface StoredTemplate {
  id: string;
  name: string;
  created: string;
  modified: string;
  config: TemplateConfig;
}

export interface WindowState {
  width: number;
  height: number;
  x: number | undefined;
  y: number | undefined;
  maximized: boolean;
}
