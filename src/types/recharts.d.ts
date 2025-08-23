import * as React from 'react';

declare module 'recharts' {
  // Common types
  export interface ChartComponentProps {
    data?: any[];
    children?: React.ReactNode;
    width?: number | string;
    height?: number | string;
    margin?: {
      top?: number;
      right?: number;
      bottom?: number;
      left?: number;
    };
  }

  // BarChart
  export class BarChart extends React.Component<ChartComponentProps> {}
  export class Bar extends React.Component<any> {}
  
  // LineChart
  export class LineChart extends React.Component<ChartComponentProps> {}
  export class Line extends React.Component<any> {}
  
  // PieChart
  export class PieChart extends React.Component<ChartComponentProps> {}
  export class Pie extends React.Component<any> {}
  export class Cell extends React.Component<{ fill?: string }> {}
  
  // Common components
  export class XAxis extends React.Component<any> {}
  export class YAxis extends React.Component<any> {}
  export class CartesianGrid extends React.Component<any> {}
  export class Tooltip extends React.Component<any> {}
  export class Legend extends React.Component<any> {}
  export class ResponsiveContainer extends React.Component<{
    width?: string | number;
    height?: string | number;
    children: React.ReactNode;
  }> {}
  
  // Other components
  export class AreaChart extends React.Component<ChartComponentProps> {}
  export class Area extends React.Component<any> {}
  export class ScatterChart extends React.Component<ChartComponentProps> {}
  export class Scatter extends React.Component<any> {}
  export class RadarChart extends React.Component<ChartComponentProps> {}
  export class Radar extends React.Component<any> {}
  export class RadialBarChart extends React.Component<ChartComponentProps> {}
  export class RadialBar extends React.Component<any> {}
  
  // Composed components
  export class ComposedChart extends React.Component<ChartComponentProps> {}
  
  // Utility components
  export class ReferenceLine extends React.Component<any> {}
  export class ReferenceDot extends React.Component<any> {}
  export class ReferenceArea extends React.Component<any> {}
  export class Label extends React.Component<any> {}
  export class LabelList extends React.Component<any> {}
  
  // Brush components
  export class Brush extends React.Component<any> {}
  
  // ErrorBar component
  export class ErrorBar extends React.Component<any> {}
  
  // Polar components
  export class PolarGrid extends React.Component<any> {}
  export class PolarAngleAxis extends React.Component<any> {}
  export class PolarRadiusAxis extends React.Component<any> {}
  
  // Funnel components
  export class FunnelChart extends React.Component<ChartComponentProps> {}
  export class Funnel extends React.Component<any> {}
  
  // Sankey components
  export class Sankey extends React.Component<any> {}
  
  // Treemap components
  export class Treemap extends React.Component<any> {}
  
  // ZAxis component
  export class ZAxis extends React.Component<any> {}
  
  // Customized components
  export class Customized extends React.Component<any> {}
  
  // Tooltip components
  export const DefaultTooltipContent: React.ComponentType<any>;
  
  // Shape components
  export const Curve: React.ComponentType<any>;
  export const Rectangle: React.ComponentType<any>;
  export const Sector: React.ComponentType<any>;
  export const Dot: React.ComponentType<any>;
  export const Cross: React.ComponentType<any>;
  
  // Hooks
  export function useTooltipPortal(container?: HTMLElement): HTMLElement;
  
  // Types
  export type TooltipPayload = Array<{
    name: string;
    value: number | string;
    unit?: string;
    color?: string;
    [key: string]: any;
  }>;
  
  export type TooltipProps = {
    active?: boolean;
    label?: string | number;
    payload?: TooltipPayload;
    separator?: string;
    formatter?: (value: any, name: string, entry: any, index: number) => any;
    labelFormatter?: (label: any) => any;
    content?: React.ReactElement | ((props: any) => React.ReactElement);
  };
}
