declare module 'react-simple-maps' {
  import { CSSProperties, MouseEvent, ReactNode } from 'react';

  interface ComposableMapProps {
    projection?: string;
    style?: CSSProperties;
    onClick?: (event: MouseEvent<SVGSVGElement>) => void;
    children?: ReactNode;
    [key: string]: unknown;
  }

  interface GeographiesProps {
    geography: string | object;
    children: (props: { geographies: GeoFeature[] }) => ReactNode;
    [key: string]: unknown;
  }

  interface GeoFeature {
    rsmKey: string;
    [key: string]: unknown;
  }

  interface GeographyProps {
    geography: GeoFeature;
    style?: {
      default?: CSSProperties;
      hover?: CSSProperties;
      pressed?: CSSProperties;
    };
    [key: string]: unknown;
  }

  interface MarkerProps {
    coordinates: [number, number];
    children?: ReactNode;
    [key: string]: unknown;
  }

  export function ComposableMap(props: ComposableMapProps): JSX.Element;
  export function Geographies(props: GeographiesProps): JSX.Element;
  export function Geography(props: GeographyProps): JSX.Element;
  export function Marker(props: MarkerProps): JSX.Element;
}
