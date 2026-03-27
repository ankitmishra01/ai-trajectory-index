declare module "react-simple-maps" {
  import { ComponentProps, ReactNode, ForwardRefExoticComponent, RefAttributes } from "react";

  interface ProjectionConfig {
    scale?: number;
    center?: [number, number];
    rotate?: [number, number, number];
    parallels?: [number, number];
  }

  interface ComposableMapProps {
    projection?: string;
    projectionConfig?: ProjectionConfig;
    width?: number;
    height?: number;
    style?: React.CSSProperties;
    className?: string;
    children?: ReactNode;
  }

  interface GeographyFeature {
    id: string | number;
    rsmKey: string;
    properties: Record<string, unknown>;
    geometry: unknown;
    type: string;
  }

  interface GeographiesProps {
    geography: string | object;
    children: (args: { geographies: GeographyFeature[] }) => ReactNode;
  }

  interface GeographyProps {
    geography: GeographyFeature;
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
    style?: {
      default?: React.CSSProperties;
      hover?: React.CSSProperties;
      pressed?: React.CSSProperties;
    };
    className?: string;
    onClick?: (event: React.MouseEvent) => void;
    onMouseEnter?: (event: React.MouseEvent) => void;
    onMouseLeave?: (event: React.MouseEvent) => void;
    [key: string]: unknown;
  }

  interface ZoomableGroupProps {
    center?: [number, number];
    zoom?: number;
    minZoom?: number;
    maxZoom?: number;
    onMoveStart?: (pos: unknown) => void;
    onMove?: (pos: unknown) => void;
    onMoveEnd?: (pos: unknown) => void;
    children?: ReactNode;
    className?: string;
  }

  interface MapContextValue {
    width: number;
    height: number;
    projection: (coords: [number, number]) => [number, number] | null;
    path: (feature: unknown) => string;
  }

  export const ComposableMap: ForwardRefExoticComponent<
    ComposableMapProps & RefAttributes<SVGSVGElement>
  >;
  export function Geographies(props: GeographiesProps): JSX.Element;
  export function Geography(props: GeographyProps): JSX.Element;
  export function ZoomableGroup(props: ZoomableGroupProps): JSX.Element;
  export function useMapContext(): MapContextValue;
}
