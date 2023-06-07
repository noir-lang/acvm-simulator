import { esbuildPlugin } from '@web/dev-server-esbuild';

export default {
  nodeResolve: true,
	testFramework: {
		config: {
			// ui: 'bdd',
			timeout: '40000',
		}
	},
  plugins: [esbuildPlugin({ ts: true })],
};