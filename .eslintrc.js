// eslint-plugin-tsdoc does not ship a 'recommended' config preset.
// The tsdoc/syntax rule is registered manually via the plugins + rules fields below.
// See story 1.4 notes in implementationplan/phase-1-bootstrap.md for the audit trail.
module.exports = {
  extends: ['expo', 'plugin:@typescript-eslint/recommended', 'prettier'],
  plugins: ['tsdoc'],
  rules: {
    'tsdoc/syntax': 'warn',
  },
};
