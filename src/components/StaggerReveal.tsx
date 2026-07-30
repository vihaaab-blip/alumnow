"use client";
import { Children, cloneElement, isValidElement } from "react";

export function StaggerReveal({ children, baseDelay = 0, step = 45 }: { children: React.ReactNode; baseDelay?: number; step?: number }) {
  return (
    <>
      {Children.map(children, (child, i) => {
        if (!isValidElement(child)) return child;
        return cloneElement(child as React.ReactElement<any>, {
          style: {
            ...(child.props.style ?? {}),
            animation: `stagger-in var(--dur-base) var(--ease-out-expo) both`,
            animationDelay: `${baseDelay + i * step}ms`,
          },
        });
      })}
    </>
  );
}
