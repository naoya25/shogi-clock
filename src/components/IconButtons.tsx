import type { ReactNode } from "react";
import { IconContext } from "react-icons";
import { Link } from "react-router-dom";

type BaseProps = {
  label: string;
  icon: ReactNode;
  className?: string;
};

const baseClassName =
  "inline-flex h-9 w-9 items-center justify-center rounded-md bg-gray-800 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/60 disabled:cursor-not-allowed disabled:opacity-50";

export function IconButton({
  label,
  icon,
  className,
  ...props
}: BaseProps & Omit<React.ComponentPropsWithoutRef<"button">, "children">) {
  return (
    <button
      type="button"
      className={`${baseClassName} ${className ?? ""}`}
      aria-label={label}
      title={label}
      {...props}
    >
      <IconContext.Provider value={{ size: "18px" }}>
        <span className="h-5 w-5">{icon}</span>
      </IconContext.Provider>
    </button>
  );
}

export function IconLinkButton({
  label,
  icon,
  className,
  to,
  ...props
}: BaseProps &
  Omit<React.ComponentPropsWithoutRef<typeof Link>, "children" | "to"> & {
    to: string;
  }) {
  return (
    <Link
      to={to}
      className={`${baseClassName} ${className ?? ""}`}
      aria-label={label}
      title={label}
      {...props}
    >
      <IconContext.Provider value={{ size: "18px" }}>
        <span className="h-5 w-5">{icon}</span>
      </IconContext.Provider>
    </Link>
  );
}
