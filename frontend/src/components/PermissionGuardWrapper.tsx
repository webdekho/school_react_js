import React from 'react';
// Import the existing JS PermissionGuard (untyped)
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import PermissionGuard from './PermissionGuard';

type Props = {
  children: React.ReactNode;
  permission: string | string[];
  requireAll?: boolean;
  fallback?: React.ReactNode;
};

export const PermissionGuardWrapper: React.FC<Props> = ({
  children,
  permission,
  requireAll = false,
  fallback = null,
}) => {
  // The underlying component is JS; cast as any to satisfy TS JSX component typing
  const Guard: any = PermissionGuard;
  return (
    <Guard permission={permission} requireAll={requireAll} fallback={fallback}>
      {children}
    </Guard>
  );
};

export default PermissionGuardWrapper;

