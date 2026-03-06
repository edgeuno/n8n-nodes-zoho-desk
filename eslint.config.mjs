import tsParser from '@typescript-eslint/parser';
import n8nNodesBase from 'eslint-plugin-n8n-nodes-base';

const commonTypeScriptSettings = {
	languageOptions: {
		parser: tsParser,
		parserOptions: {
			ecmaVersion: 'latest',
			sourceType: 'module',
		},
	},
	plugins: {
		'n8n-nodes-base': n8nNodesBase,
	},
};

export default [
	{
		ignores: ['dist/**', 'node_modules/**'],
	},
	{
		...commonTypeScriptSettings,
		files: ['nodes/**/*.ts'],
		rules: {
			...n8nNodesBase.configs.nodes.rules,
		},
	},
	{
		...commonTypeScriptSettings,
		files: ['credentials/**/*.ts'],
		rules: {
			...n8nNodesBase.configs.credentials.rules,
			'n8n-nodes-base/cred-class-field-documentation-url-miscased': 'off',
		},
	},
];
