module.exports = pkg => name => name in (pkg.dependencies || {}) || name in (pkg.devDependencies || {});
