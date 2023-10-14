declare module "swipe-listener" {
  export interface SwipeListenerInstance {
    off: () => void;
  }

  export type SwipeEvent = CustomEvent<{
    direction: "left" | "right" | "up" | "down";
    x: number;
    y: number;
    touch: boolean;
  }>;

  declare global {
    interface HTMLElementEventMap {
      swipe: SwipeEvent;
    }
  }

  export default function SwipeListener(
    element: HTMLElement,
    options?: {
      minHorizontal?: number;
      minVertical?: number;
      deltaHorizontal?: number;
      deltaVertical?: number;
      preventScroll?: boolean;
      lockAxis?: boolean;
      touch?: boolean;
      mouse?: boolean;
    },
  ): SwipeListenerInstance;
}
