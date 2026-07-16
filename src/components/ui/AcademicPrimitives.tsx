import {
  forwardRef,
  useEffect,
  useId,
  useRef,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import ModalPortal from "../ModalPortal";

const classes = (...values: Array<string | false | null | undefined>) =>
  values.filter(Boolean).join(" ");

type SurfaceVariant = "card" | "paper" | "overlay";

interface AcademicSurfaceProps extends HTMLAttributes<HTMLDivElement> {
  variant?: SurfaceVariant;
  active?: boolean;
}

export const AcademicSurface = forwardRef<HTMLDivElement, AcademicSurfaceProps>(
  ({ variant = "card", active = false, className, ...props }, ref) => (
    <div
      ref={ref}
      className={classes(
        variant === "card" && "as-card",
        variant === "paper" && "as-paper",
        variant === "overlay" && "as-overlay-surface",
        active && "as-card--active",
        className,
      )}
      {...props}
    />
  ),
);
AcademicSurface.displayName = "AcademicSurface";

type AcademicButtonVariant = "primary" | "secondary" | "ghost" | "danger";

type AcademicButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: AcademicButtonVariant;
} & (
  | { iconOnly: true; "aria-label": string }
  | { iconOnly?: false }
);

export const AcademicButton = forwardRef<HTMLButtonElement, AcademicButtonProps>(
  (
    {
      variant = "primary",
      iconOnly = false,
      className,
      type = "button",
      children,
      ...props
    },
    ref,
  ) => (
    <button
      ref={ref}
      type={type}
      className={classes(
        "as-button",
        `as-button--${variant}`,
        iconOnly && "as-button--icon",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  ),
);
AcademicButton.displayName = "AcademicButton";

type FeedbackTone = "neutral" | "info" | "success" | "warning" | "error";

interface AcademicBannerProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  tone?: FeedbackTone;
  title?: ReactNode;
  icon?: ReactNode;
}

export const AcademicBanner = forwardRef<HTMLDivElement, AcademicBannerProps>(
  ({ tone = "neutral", title, icon, children, className, role, ...props }, ref) => {
    const liveRole = role ?? (tone === "error" ? "alert" : "status");
    return (
      <div
        ref={ref}
        className={classes("as-banner", tone !== "neutral" && `as-banner--${tone}`, className)}
        role={liveRole}
        {...props}
      >
        {icon && <span aria-hidden="true">{icon}</span>}
        <div>
          {title && <strong className="as-label">{title}</strong>}
          {children}
        </div>
      </div>
    );
  },
);
AcademicBanner.displayName = "AcademicBanner";

interface AcademicStatusProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: FeedbackTone;
}

export const AcademicStatus = forwardRef<HTMLSpanElement, AcademicStatusProps>(
  ({ tone = "neutral", className, ...props }, ref) => (
    <span
      ref={ref}
      className={classes("as-status", tone !== "neutral" && `as-status--${tone}`, className)}
      {...props}
    />
  ),
);
AcademicStatus.displayName = "AcademicStatus";

interface AcademicTabsProps extends HTMLAttributes<HTMLDivElement> {
  label: string;
}

export const AcademicTabs = forwardRef<HTMLDivElement, AcademicTabsProps>(
  ({ label, className, onKeyDown, ...props }, ref) => (
    <div
      ref={ref}
      className={classes("as-tabs", className)}
      role="tablist"
      aria-label={label}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (event.defaultPrevented || !["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) {
          return;
        }
        const tabs = Array.from(
          event.currentTarget.querySelectorAll<HTMLButtonElement>(
            '[role="tab"]:not(:disabled)',
          ),
        );
        if (tabs.length === 0) return;
        event.preventDefault();
        const currentIndex = tabs.indexOf(document.activeElement as HTMLButtonElement);
        const nextIndex =
          event.key === "Home"
            ? 0
            : event.key === "End"
              ? tabs.length - 1
              : (currentIndex + (event.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length;
        tabs[nextIndex].focus();
        tabs[nextIndex].click();
      }}
      {...props}
    />
  ),
);
AcademicTabs.displayName = "AcademicTabs";

interface AcademicTabProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  id: string;
  selected: boolean;
  controls: string;
}

export const AcademicTab = forwardRef<HTMLButtonElement, AcademicTabProps>(
  ({ selected, controls, className, type = "button", ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={classes("as-tab", className)}
      role="tab"
      aria-selected={selected}
      aria-controls={controls}
      tabIndex={selected ? 0 : -1}
      {...props}
    />
  ),
);
AcademicTab.displayName = "AcademicTab";

export type AcademicStageState = "pending" | "active" | "complete";

export interface AcademicStage {
  id: string;
  label: ReactNode;
  description?: ReactNode;
  state: AcademicStageState;
}

interface AcademicStageRailProps extends HTMLAttributes<HTMLOListElement> {
  stages: AcademicStage[];
}

export const AcademicStageRail = forwardRef<HTMLOListElement, AcademicStageRailProps>(
  ({ stages, className, ...props }, ref) => (
    <ol ref={ref} className={classes("as-stage-rail", className)} {...props}>
      {stages.map((stage, index) => (
        <li
          key={stage.id}
          className="as-stage"
          data-state={stage.state}
          aria-current={stage.state === "active" ? "step" : undefined}
        >
          <span className="as-stage__marker" aria-hidden="true">
            {stage.state === "complete" ? "✓" : index + 1}
          </span>
          <span>
            <strong className="as-label">{stage.label}</strong>
            {stage.description && <span className="as-field__hint">{stage.description}</span>}
          </span>
        </li>
      ))}
    </ol>
  ),
);
AcademicStageRail.displayName = "AcademicStageRail";

interface AcademicMenuProps extends HTMLAttributes<HTMLDivElement> {
  label: string;
}

export const AcademicMenu = forwardRef<HTMLDivElement, AcademicMenuProps>(
  ({ className, label, onKeyDown, ...props }, ref) => (
    <div
      ref={ref}
      className={classes("as-menu", className)}
      role="menu"
      aria-label={label}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (event.defaultPrevented || !["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
          return;
        }
        const items = Array.from(
          event.currentTarget.querySelectorAll<HTMLButtonElement>(
            '[role="menuitem"]:not(:disabled)',
          ),
        );
        if (items.length === 0) return;
        event.preventDefault();
        const currentIndex = items.indexOf(document.activeElement as HTMLButtonElement);
        const nextIndex =
          event.key === "Home"
            ? 0
            : event.key === "End"
              ? items.length - 1
              : (currentIndex + (event.key === "ArrowDown" ? 1 : -1) + items.length) % items.length;
        items[nextIndex].focus();
      }}
      {...props}
    />
  ),
);
AcademicMenu.displayName = "AcademicMenu";

interface AcademicMenuItemProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  danger?: boolean;
}

export const AcademicMenuItem = forwardRef<HTMLButtonElement, AcademicMenuItemProps>(
  ({ danger = false, className, type = "button", ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={classes("as-menu__item", danger && "as-menu__item--danger", className)}
      role="menuitem"
      tabIndex={-1}
      {...props}
    />
  ),
);
AcademicMenuItem.displayName = "AcademicMenuItem";

interface AcademicStateProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  title: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  action?: ReactNode;
}

export const AcademicEmptyState = forwardRef<HTMLDivElement, AcademicStateProps>(
  ({ title, description, icon, action, className, ...props }, ref) => (
    <div ref={ref} className={classes("as-empty-state", className)} {...props}>
      {icon && <span className="as-empty-state__icon" aria-hidden="true">{icon}</span>}
      <div>
        <h2 className="as-heading as-heading--md">{title}</h2>
        {description && <p>{description}</p>}
      </div>
      {action}
    </div>
  ),
);
AcademicEmptyState.displayName = "AcademicEmptyState";

export const AcademicErrorState = forwardRef<HTMLDivElement, AcademicStateProps>(
  ({ title, description, icon, action, className, role = "alert", ...props }, ref) => (
    <div ref={ref} className={classes("as-error-state", className)} role={role} {...props}>
      {icon && <span className="as-error-state__icon" aria-hidden="true">{icon}</span>}
      <div>
        <h2 className="as-heading as-heading--md">{title}</h2>
        {description && <p>{description}</p>}
      </div>
      {action}
    </div>
  ),
);
AcademicErrorState.displayName = "AcademicErrorState";

interface AcademicSkeletonProps extends HTMLAttributes<HTMLSpanElement> {
  label?: string;
}

export const AcademicSkeleton = forwardRef<HTMLSpanElement, AcademicSkeletonProps>(
  ({ label = "Loading", className, ...props }, ref) => (
    <span
      ref={ref}
      className={classes("as-skeleton", className)}
      role="status"
      aria-label={label}
      {...props}
    />
  ),
);
AcademicSkeleton.displayName = "AcademicSkeleton";

interface AcademicDrawerProps {
  open: boolean;
  title: ReactNode;
  onClose: () => void;
  children: ReactNode;
  className?: string;
  closeLabel?: string;
}

export const AcademicDrawer = ({
  open,
  title,
  onClose,
  children,
  className,
  closeLabel = "Close panel",
}: AcademicDrawerProps) => {
  const titleId = useId();
  const drawerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;

    document.body.style.overflow = "hidden";
    drawerRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key !== "Tab" || !drawerRef.current) return;

      const focusable = Array.from(
        drawerRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])',
        ),
      );
      if (focusable.length === 0) {
        event.preventDefault();
        drawerRef.current.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
      previousFocus?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <ModalPortal>
      <div className="learning-experience">
        <div className="as-drawer-backdrop" aria-hidden="true" onMouseDown={onClose} />
        <aside
          ref={drawerRef}
          className={classes("as-drawer", className)}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          tabIndex={-1}
        >
          <div className="as-drawer__header">
            <h2 id={titleId} className="as-heading as-heading--md">{title}</h2>
            <AcademicButton
              variant="ghost"
              iconOnly
              aria-label={closeLabel}
              onClick={onClose}
            >
              <span aria-hidden="true">×</span>
            </AcademicButton>
          </div>
          {children}
        </aside>
      </div>
    </ModalPortal>
  );
};
