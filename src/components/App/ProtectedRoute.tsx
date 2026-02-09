import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

export interface ProtectedRouteProps {
	isAuthenticated: boolean;
	children: React.ReactElement;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ isAuthenticated, children }) => {
	const location = useLocation();

	if (isAuthenticated) return children;

	const next = `${location.pathname}${location.search}${location.hash}`;
	return <Navigate to={`/login?next=${encodeURIComponent(next)}`} replace />;
};

ProtectedRoute.displayName = 'ProtectedRoute';
