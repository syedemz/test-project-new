// eslint-plugin-tsdoc does not ship a 'recommended' config preset.
// The tsdoc/syntax rule is registered manually via the plugins + rules fields below.
// See story 1.4 notes in implementationplan/phase-1-bootstrap.md for the audit trail.
module.exports = {
  extends: ['expo', 'plugin:@typescript-eslint/recommended', 'prettier'],
  plugins: ['tsdoc'],
  rules: {
    'tsdoc/syntax': 'warn',
  },
  overrides: [
    {
      // Catalog enforcement: screens must use @/components, not raw react-native primitives.
      // Rationale: docs/superpowers/specs/2026-05-17-reusable-components-and-common-styles-design.md §6 Rule 5.
      // Legacy screens (Login/Register/Landing) carry file-top eslint-disable directives and are
      // grandfathered until they are refactored as part of unrelated future work.
      files: ['src/screens/**/*.{ts,tsx}'],
      rules: {
        'no-restricted-imports': [
          'error',
          {
            paths: [
              {
                name: 'react-native',
                importNames: ['TouchableOpacity', 'Pressable', 'TextInput', 'Switch', 'Modal'],
                message:
                  'Use the corresponding component from @/components instead. See codingprinciples.md → Component Catalog.',
              },
            ],
          },
        ],
      },
    },
  ],
};
