module.exports = {
  apps: [
    {
      name: 'finkfold-dashboard',
      script: 'node_modules/.bin/next',
      args: 'start -p 3001',
      cwd: '/var/www/finkfold-dashboard',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
    },
  ],
};
