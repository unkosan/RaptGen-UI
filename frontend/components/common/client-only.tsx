import * as React from "react";

interface ClientOnlyProps {
  children?: React.ReactNode;
  fallback?: React.ReactNode;
}

export const ClientOnly: React.FC<ClientOnlyProps> = ({
  children,
  fallback,
}) => {
  const [renderClientSideComponent, setRenderClientSideComponent] =
    React.useState(false);

  React.useEffect(() => {
    setRenderClientSideComponent(true);
  }, []);

  return renderClientSideComponent ? <>{children}</> : <>{fallback}</>;
};

export default ClientOnly;
