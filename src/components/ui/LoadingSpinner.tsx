interface Props {
  fullScreen?: boolean;
  size?: "sm" | "md" | "lg";
  label?: string;
}

import BrandedLoader from "./BrandedLoader";

export default function LoadingSpinner({ fullScreen, size = "md", label }: Props) {
  if (fullScreen) {
    return <BrandedLoader fullScreen size="lg" label={label} />;
  }

  return <BrandedLoader size={size} label={label} />;
}
