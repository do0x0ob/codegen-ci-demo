import type { SuiCodegenConfig } from '@mysten/codegen/config';

const config: SuiCodegenConfig = {
	output: './src/generated',
	generateSummaries: true,
	prune: true,
	packages: [
		{
			package: '@local-pkg/hello-world',
			path: './move/hello_world',
		},
	],
};

export default config;
