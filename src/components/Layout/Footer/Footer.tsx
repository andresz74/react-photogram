import React from 'react';
import './Footer.css';

export const Footer: React.FC = () => {
	const getYear = new Date().getFullYear();
	return <footer className="App-footer">{`Copyright &copy; ${getYear} · All rights reserved`}</footer>;
};

Footer.displayName = 'Footer';
