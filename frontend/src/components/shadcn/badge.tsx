import * as React from "react";
import { Badge as SystemBadge, type BadgeProps as SystemBadgeProps } from "@/design-system/primitives/badge";
import { badgeVariants, SIZE_CLASS, TONE_BY_VARIANT, type CompatBadgeVariant } from "./badge-utils";

export interface BadgeProps extends Omit<SystemBadgeProps, "tone"> {
  variant?: CompatBadgeVariant;
  size?: keyof typeof SIZE_CLASS;
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(({ className, variant = "default", size = "default", ...props }, ref) => (
  <SystemBadge
    ref={ref}
    tone={TONE_BY_VARIANT[variant]}
    className={badgeVariants({ variant, size, className })}
    {...props}
  />
));
Badge.displayName = "Badge";

export { Badge };
