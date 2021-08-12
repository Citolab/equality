
declare module 'chartjs-plugin-error-bars' {
    export interface IErrorBars {
      [label: string]: IErrorBar | IErrorBar[];
    }
  
    export interface IErrorBar {
      plus: number;
      minus: number;
    }
  
    export interface IChartJsPluginErrorBarsOptions {
      color: string | string[];
      width: (string | number) | (string | number)[];
      lineWidth: (string | number) | (string | number)[];
      absoluteValues: boolean;
    }
  }
  