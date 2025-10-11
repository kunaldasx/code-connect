import type { Config } from 'drizzle-kit';

export default {
	schema: './src/schema.ts',
	out: './drizzle',
	dialect: 'sqlite', // must be sqlite for D1
	dbCredentials: {
		wranglerConfigPath: './wrangler.jsonc',
		dbName: 'd1-virtualbox',
	},
};
