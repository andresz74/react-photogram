const isDebugEnabled = process.env.NODE_ENV !== 'production';

export const logger = {
	debug: (...args: unknown[]) => {
		if (isDebugEnabled) console.debug(...args);
	},
	info: (...args: unknown[]) => {
		if (isDebugEnabled) console.info(...args);
	},
	warn: (...args: unknown[]) => {
		if (isDebugEnabled) console.warn(...args);
	},
	error: (...args: unknown[]) => {
		console.error(...args);
	},
};

